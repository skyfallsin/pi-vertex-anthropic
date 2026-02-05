/**
 * Vertex AI Anthropic Provider Extension for Pi
 *
 * Provides Claude models through Google Cloud Vertex AI.
 * Authentication via gcloud CLI (/login) or environment variables.
 */

import {
	type Api,
	type AssistantMessage,
	type AssistantMessageEventStream,
	type Context,
	calculateCost,
	createAssistantMessageEventStream,
	type ImageContent,
	type Message,
	type Model,
	type SimpleStreamOptions,
	type StopReason,
	type TextContent,
	type ThinkingContent,
	type Tool,
	type ToolCall,
	type ToolResultMessage,
} from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { execSync } from "node:child_process";

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration can be set via:
 * 1. Environment variables (recommended)
 * 2. ~/.pi/agent/settings.json
 * 3. Hardcoded defaults below
 */

function getConfig() {
	return {
		project: process.env.VERTEX_PROJECT_ID || "your-gcp-project-id",
		region: process.env.VERTEX_REGION || "us-east5",
		gcloudPath: process.env.VERTEX_GCLOUD_PATH || findGcloud(),
	};
}

function findGcloud(): string {
	// Try common locations
	const paths = [
		"/usr/local/bin/gcloud",
		"/usr/bin/gcloud",
		`${process.env.HOME}/google-cloud-sdk/bin/gcloud`,
		"gcloud", // Let OS find it
	];

	for (const path of paths) {
		try {
			execSync(`${path} version`, { stdio: "ignore", timeout: 1000 });
			return path;
		} catch {}
	}

	return "gcloud"; // Fallback
}

// =============================================================================
// Message Transformation (handles incomplete tool calls)
// =============================================================================

/**
 * Transform messages to handle incomplete tool calls and cross-provider compatibility.
 * This removes errored/aborted assistant messages and inserts synthetic tool results
 * for orphaned tool calls to prevent API errors.
 */
function transformMessages(
	messages: Message[],
	model: Model<Api>,
	normalizeToolCallId?: (id: string) => string,
): Message[] {
	// Build a map of original tool call IDs to normalized IDs
	const toolCallIdMap = new Map<string, string>();

	// First pass: transform messages (thinking blocks, tool call ID normalization)
	const transformed = messages.map((msg) => {
		// User messages pass through unchanged
		if (msg.role === "user") {
			return msg;
		}

		// Handle toolResult messages - normalize toolCallId if we have a mapping
		if (msg.role === "toolResult") {
			const normalizedId = toolCallIdMap.get(msg.toolCallId);
			if (normalizedId && normalizedId !== msg.toolCallId) {
				return { ...msg, toolCallId: normalizedId };
			}
			return msg;
		}

		// Assistant messages need transformation check
		if (msg.role === "assistant") {
			const assistantMsg = msg as AssistantMessage;
			const isSameModel =
				assistantMsg.provider === model.provider &&
				assistantMsg.api === model.api &&
				assistantMsg.model === model.id;

			const transformedContent = assistantMsg.content.flatMap((block) => {
				if (block.type === "thinking") {
					const thinkingBlock = block as ThinkingContent;
					// For same model: keep thinking blocks with signatures (needed for replay)
					if (isSameModel && thinkingBlock.thinkingSignature) return block;

					// Skip empty thinking blocks, convert others to plain text
					if (!thinkingBlock.thinking || thinkingBlock.thinking.trim() === "") return [];
					if (isSameModel) return block;

					return {
						type: "text" as const,
						text: thinkingBlock.thinking,
					};
				}

				if (block.type === "text") {
					if (isSameModel) return block;
					return {
						type: "text" as const,
						text: block.text,
					};
				}

				if (block.type === "toolCall") {
					const toolCall = block as ToolCall;
					let normalizedToolCall = toolCall;

					if (!isSameModel && normalizeToolCallId) {
						const normalizedId = normalizeToolCallId(toolCall.id);
						if (normalizedId !== toolCall.id) {
							toolCallIdMap.set(toolCall.id, normalizedId);
							normalizedToolCall = { ...normalizedToolCall, id: normalizedId };
						}
					}

					return normalizedToolCall;
				}

				return block;
			});

			return {
				...assistantMsg,
				content: transformedContent,
			};
		}

		return msg;
	});

	// Second pass: insert synthetic empty tool results for orphaned tool calls
	// This preserves thinking signatures and satisfies API requirements
	const result: Message[] = [];
	let pendingToolCalls: ToolCall[] = [];
	let existingToolResultIds = new Set<string>();

	for (let i = 0; i < transformed.length; i++) {
		const msg = transformed[i];

		if (msg.role === "assistant") {
			// If we have pending orphaned tool calls from a previous assistant, insert synthetic results now
			if (pendingToolCalls.length > 0) {
				for (const tc of pendingToolCalls) {
					if (!existingToolResultIds.has(tc.id)) {
						result.push({
							role: "toolResult",
							toolCallId: tc.id,
							toolName: tc.name,
							content: [{ type: "text", text: "No result provided" }],
							isError: true,
							timestamp: Date.now(),
						} as ToolResultMessage);
					}
				}
				pendingToolCalls = [];
				existingToolResultIds = new Set();
			}

			// Skip errored/aborted assistant messages entirely.
			// These are incomplete turns that shouldn't be replayed
			const assistantMsg = msg as AssistantMessage;
			if (assistantMsg.stopReason === "error" || assistantMsg.stopReason === "aborted") {
				continue;
			}

			// Track tool calls from this assistant message
			const toolCalls = assistantMsg.content.filter((b) => b.type === "toolCall") as ToolCall[];
			if (toolCalls.length > 0) {
				pendingToolCalls = toolCalls;
				existingToolResultIds = new Set();
			}

			result.push(msg);
		} else if (msg.role === "toolResult") {
			existingToolResultIds.add((msg as ToolResultMessage).toolCallId);
			result.push(msg);
		} else if (msg.role === "user") {
			// User message interrupts tool flow - insert synthetic results for orphaned calls
			if (pendingToolCalls.length > 0) {
				for (const tc of pendingToolCalls) {
					if (!existingToolResultIds.has(tc.id)) {
						result.push({
							role: "toolResult",
							toolCallId: tc.id,
							toolName: tc.name,
							content: [{ type: "text", text: "No result provided" }],
							isError: true,
							timestamp: Date.now(),
						} as ToolResultMessage);
					}
				}
				pendingToolCalls = [];
				existingToolResultIds = new Set();
			}
			result.push(msg);
		} else {
			result.push(msg);
		}
	}

	return result;
}

// =============================================================================
// Message conversion (from custom-provider-anthropic example)
// =============================================================================

function sanitizeSurrogates(text: string): string {
	return text.replace(/[\uD800-\uDFFF]/g, "\uFFFD");
}

function convertContentBlocks(
	content: (TextContent | ImageContent)[],
): string | Array<{ type: "text"; text: string } | { type: "image"; source: any }> {
	const hasImages = content.some((c) => c.type === "image");
	if (!hasImages) {
		return sanitizeSurrogates(content.map((c) => (c as TextContent).text).join("\n"));
	}

	const blocks = content.map((block) => {
		if (block.type === "text") {
			return { type: "text" as const, text: sanitizeSurrogates(block.text) };
		}
		return {
			type: "image" as const,
			source: {
				type: "base64" as const,
				media_type: block.mimeType,
				data: block.data,
			},
		};
	});

	if (!blocks.some((b) => b.type === "text")) {
		blocks.unshift({ type: "text" as const, text: "(see attached image)" });
	}

	return blocks;
}

// Normalize tool call IDs to match Anthropic's required pattern and length
function normalizeToolCallId(id: string): string {
	return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

function convertMessages(messages: Message[], model: Model<Api>, _tools?: Tool[]): any[] {
	const params: any[] = [];

	// Transform messages for cross-provider compatibility - this removes errored/aborted
	// assistant messages and inserts synthetic tool results for orphaned tool calls
	const transformedMessages = transformMessages(messages, model, normalizeToolCallId);

	for (let i = 0; i < transformedMessages.length; i++) {
		const msg = transformedMessages[i];

		if (msg.role === "user") {
			if (typeof msg.content === "string") {
				if (msg.content.trim()) {
					params.push({ role: "user", content: sanitizeSurrogates(msg.content) });
				}
			} else {
				const blocks: any[] = msg.content.map((item) =>
					item.type === "text"
						? { type: "text" as const, text: sanitizeSurrogates(item.text) }
						: {
								type: "image" as const,
								source: { type: "base64" as const, media_type: item.mimeType as any, data: item.data },
							},
				);
				if (blocks.length > 0) {
					params.push({ role: "user", content: blocks });
				}
			}
		} else if (msg.role === "assistant") {
			const blocks: any[] = [];
			for (const block of msg.content) {
				if (block.type === "text" && block.text.trim()) {
					blocks.push({ type: "text", text: sanitizeSurrogates(block.text) });
				} else if (block.type === "thinking" && block.thinking.trim()) {
					if ((block as ThinkingContent).thinkingSignature) {
						blocks.push({
							type: "thinking" as any,
							thinking: sanitizeSurrogates(block.thinking),
							signature: (block as ThinkingContent).thinkingSignature!,
						});
					} else {
						blocks.push({ type: "text", text: sanitizeSurrogates(block.thinking) });
					}
				} else if (block.type === "toolCall") {
					blocks.push({
						type: "tool_use",
						id: block.id,
						name: block.name,
						input: block.arguments,
					});
				}
			}
			if (blocks.length > 0) {
				params.push({ role: "assistant", content: blocks });
			}
		} else if (msg.role === "toolResult") {
			const toolResults: any[] = [];
			toolResults.push({
				type: "tool_result",
				tool_use_id: msg.toolCallId,
				content: convertContentBlocks(msg.content),
				is_error: msg.isError,
			});

			let j = i + 1;
			while (j < transformedMessages.length && transformedMessages[j].role === "toolResult") {
				const nextMsg = transformedMessages[j] as ToolResultMessage;
				toolResults.push({
					type: "tool_result",
					tool_use_id: nextMsg.toolCallId,
					content: convertContentBlocks(nextMsg.content),
					is_error: nextMsg.isError,
				});
				j++;
			}
			i = j - 1;
			params.push({ role: "user", content: toolResults });
		}
	}

	// Add cache control to last user message
	if (params.length > 0) {
		const last = params[params.length - 1];
		if (last.role === "user" && Array.isArray(last.content)) {
			const lastBlock = last.content[last.content.length - 1];
			if (lastBlock) {
				lastBlock.cache_control = { type: "ephemeral" };
			}
		}
	}

	return params;
}

function convertTools(tools: Tool[]): any[] {
	return tools.map((tool) => ({
		name: tool.name,
		description: tool.description,
		input_schema: {
			type: "object",
			properties: (tool.parameters as any).properties || {},
			required: (tool.parameters as any).required || [],
		},
	}));
}

function mapStopReason(reason: string): StopReason {
	switch (reason) {
		case "end_turn":
		case "pause_turn":
		case "stop_sequence":
			return "stop";
		case "max_tokens":
			return "length";
		case "tool_use":
			return "toolUse";
		default:
			return "error";
	}
}

// =============================================================================
// SSE Parser for Vertex AI streamRawPredict
// =============================================================================

async function* parseSSE(response: Response): AsyncGenerator<any> {
	const reader = response.body!.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop()!; // Keep incomplete line in buffer

		let eventType = "";
		let data = "";

		for (const line of lines) {
			if (line.startsWith("event: ")) {
				eventType = line.slice(7).trim();
			} else if (line.startsWith("data: ")) {
				data = line.slice(6).trim();
			} else if (line === "" && data) {
				try {
					const parsed = JSON.parse(data);
					parsed._eventType = eventType;
					yield parsed;
				} catch {}
				eventType = "";
				data = "";
			}
		}
	}
}

// =============================================================================
// Streaming Implementation
// =============================================================================

function streamVertexAnthropic(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	(async () => {
		const output: AssistantMessage = {
			role: "assistant",
			content: [],
			api: model.api,
			provider: model.provider,
			model: model.id,
			usage: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 0,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
			},
			stopReason: "stop",
			timestamp: Date.now(),
		};

		try {
			const config = getConfig();
			const project = (model as any).project || config.project;
			const region = (model as any).region || config.region;
			const gcloudPath = (model as any).gcloudPath || config.gcloudPath;

			// Get access token
			const token = execSync(`${gcloudPath} auth print-access-token`, {
				encoding: "utf-8",
				timeout: 10000,
			}).trim();

			// Build Anthropic Messages API request body
			const body: any = {
				anthropic_version: "vertex-2023-10-16",
				messages: convertMessages(context.messages, model, context.tools),
				max_tokens: options?.maxTokens || Math.floor(model.maxTokens / 3),
				stream: true,
			};

			if (context.systemPrompt) {
				body.system = [
					{
						type: "text",
						text: sanitizeSurrogates(context.systemPrompt),
						cache_control: { type: "ephemeral" },
					},
				];
			}

			if (context.tools) {
				body.tools = convertTools(context.tools);
			}

			// Handle thinking/reasoning
			if (options?.reasoning && model.reasoning) {
				const defaultBudgets: Record<string, number> = {
					minimal: 1024,
					low: 4096,
					medium: 10240,
					high: 20480,
				};
				const customBudget = options.thinkingBudgets?.[options.reasoning as keyof typeof options.thinkingBudgets];
				body.thinking = {
					type: "enabled",
					budget_tokens: customBudget ?? defaultBudgets[options.reasoning] ?? 10240,
				};
			}

			// Make request to Vertex AI streamRawPredict endpoint
			const vertexModelId = (model as any).vertexModelId || model.id;
			
			// Handle global region (no region prefix in domain)
			const endpoint = region === "global"
				? "aiplatform.googleapis.com"
				: `${region}-aiplatform.googleapis.com`;
			
			const url = `https://${endpoint}/v1/projects/${project}/locations/${region}/publishers/anthropic/models/${vertexModelId}:streamRawPredict`;

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
				signal: options?.signal,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Vertex AI error (${response.status}): ${errorText}`);
			}

			stream.push({ type: "start", partial: output });

			type Block = (ThinkingContent | TextContent | (ToolCall & { partialJson: string })) & { index: number };
			const blocks = output.content as Block[];

			for await (const event of parseSSE(response)) {
				if (event.type === "message_start") {
					output.usage.input = event.message?.usage?.input_tokens || 0;
					output.usage.output = event.message?.usage?.output_tokens || 0;
					output.usage.cacheRead = event.message?.usage?.cache_read_input_tokens || 0;
					output.usage.cacheWrite = event.message?.usage?.cache_creation_input_tokens || 0;
					output.usage.totalTokens =
						output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
					calculateCost(model, output.usage);
				} else if (event.type === "content_block_start") {
					if (event.content_block.type === "text") {
						output.content.push({ type: "text", text: "", index: event.index } as any);
						stream.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });
					} else if (event.content_block.type === "thinking") {
						output.content.push({
							type: "thinking",
							thinking: "",
							thinkingSignature: "",
							index: event.index,
						} as any);
						stream.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
					} else if (event.content_block.type === "tool_use") {
						output.content.push({
							type: "toolCall",
							id: event.content_block.id,
							name: event.content_block.name,
							arguments: {},
							partialJson: "",
							index: event.index,
						} as any);
						stream.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });
					}
				} else if (event.type === "content_block_delta") {
					const index = blocks.findIndex((b) => b.index === event.index);
					const block = blocks[index];
					if (!block) continue;

					if (event.delta.type === "text_delta" && block.type === "text") {
						block.text += event.delta.text;
						stream.push({ type: "text_delta", contentIndex: index, delta: event.delta.text, partial: output });
					} else if (event.delta.type === "thinking_delta" && block.type === "thinking") {
						block.thinking += event.delta.thinking;
						stream.push({
							type: "thinking_delta",
							contentIndex: index,
							delta: event.delta.thinking,
							partial: output,
						});
					} else if (event.delta.type === "input_json_delta" && block.type === "toolCall") {
						(block as any).partialJson += event.delta.partial_json;
						try {
							block.arguments = JSON.parse((block as any).partialJson);
						} catch {}
						stream.push({
							type: "toolcall_delta",
							contentIndex: index,
							delta: event.delta.partial_json,
							partial: output,
						});
					} else if (event.delta.type === "signature_delta" && block.type === "thinking") {
						block.thinkingSignature = (block.thinkingSignature || "") + (event.delta as any).signature;
					}
				} else if (event.type === "content_block_stop") {
					const index = blocks.findIndex((b) => b.index === event.index);
					const block = blocks[index];
					if (!block) continue;

					delete (block as any).index;
					if (block.type === "text") {
						stream.push({ type: "text_end", contentIndex: index, content: block.text, partial: output });
					} else if (block.type === "thinking") {
						stream.push({ type: "thinking_end", contentIndex: index, content: block.thinking, partial: output });
					} else if (block.type === "toolCall") {
						try {
							block.arguments = JSON.parse((block as any).partialJson);
						} catch {}
						delete (block as any).partialJson;
						stream.push({ type: "toolcall_end", contentIndex: index, toolCall: block, partial: output });
					}
				} else if (event.type === "message_delta") {
					if (event.delta?.stop_reason) {
						output.stopReason = mapStopReason(event.delta.stop_reason);
					}
					if (event.usage) {
						output.usage.output = event.usage.output_tokens || output.usage.output;
						output.usage.totalTokens =
							output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
						calculateCost(model, output.usage);
					}
				}
			}

			if (options?.signal?.aborted) {
				throw new Error("Request was aborted");
			}

			// Clean up any remaining index properties
			for (const block of output.content) delete (block as any).index;

			stream.push({ type: "done", reason: output.stopReason as "stop" | "length" | "toolUse", message: output });
			stream.end();
		} catch (error) {
			for (const block of output.content) {
				delete (block as any).index;
				delete (block as any).partialJson;
			}
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
			stream.push({ type: "error", reason: output.stopReason, error: output });
			stream.end();
		}
	})();

	return stream;
}

// =============================================================================
// Extension Entry Point
// =============================================================================

export default function (pi: ExtensionAPI) {
	const config = getConfig();

	// Handle global region endpoint
	const endpoint = config.region === "global"
		? "aiplatform.googleapis.com"
		: `${config.region}-aiplatform.googleapis.com`;

	// Register provider with OAuth-style /login support
	pi.registerProvider("vertex-anthropic", {
		baseUrl: `https://${endpoint}`,
		api: "vertex-anthropic-api",

		// OAuth configuration for /login command
		oauth: {
			name: "Google Cloud Vertex AI (gcloud)",
			async login(callbacks) {
				callbacks.onAuth({ type: "progress", message: "Setting up Google Cloud Vertex AI..." });

				// Step 1: Check if gcloud is installed
				let gcloudPath = config.gcloudPath;
				try {
					execSync(`${gcloudPath} version`, { stdio: "ignore", timeout: 2000 });
				} catch {
					const install = await callbacks.onPrompt({
						message: "gcloud CLI not found. Install Google Cloud SDK?\n\n" +
							"This will download and install gcloud from:\n" +
							"https://cloud.google.com/sdk/docs/install\n\n" +
							"(y/n)",
					});

					if (install?.toLowerCase() === "y") {
						callbacks.onAuth({
							type: "info",
							message: "Opening installation guide in browser...",
						});
						callbacks.onAuth({
							url: "https://cloud.google.com/sdk/docs/install",
						});
						throw new Error("Please install gcloud CLI and run /login again");
					} else {
						throw new Error("gcloud CLI required. Install from: https://cloud.google.com/sdk/docs/install");
					}
				}

				// Step 2: Check authentication
				callbacks.onAuth({ type: "progress", message: "Checking gcloud authentication..." });
				let needsAuth = false;
				try {
					const token = execSync(`${gcloudPath} auth print-access-token`, {
						encoding: "utf-8",
						timeout: 5000,
						stdio: ["ignore", "pipe", "ignore"],
					}).trim();
					needsAuth = !token || token.includes("ERROR") || token.length < 20;
				} catch {
					needsAuth = true;
				}

				if (needsAuth) {
					const doAuth = await callbacks.onPrompt({
						message: "Not authenticated with gcloud. Run 'gcloud auth login' now? (y/n)",
					});

					if (doAuth?.toLowerCase() === "y") {
						callbacks.onAuth({ type: "progress", message: "Running gcloud auth login..." });
						callbacks.onAuth({
							type: "info",
							message: "A browser window will open for authentication",
						});

						try {
							execSync(`${gcloudPath} auth login`, { stdio: "inherit" });
						} catch (error) {
							throw new Error("Authentication failed. Please try: gcloud auth login");
						}
					} else {
						throw new Error("Authentication required. Run: gcloud auth login");
					}
				}

				// Step 3: Get/Set project
				callbacks.onAuth({ type: "progress", message: "Configuring project..." });
				let project = process.env.VERTEX_PROJECT_ID;

				if (!project || project === "your-gcp-project-id") {
					// Try to get current project
					try {
						const currentProject = execSync(`${gcloudPath} config get-value project`, {
							encoding: "utf-8",
							stdio: ["ignore", "pipe", "ignore"],
						}).trim();

						if (currentProject && currentProject !== "(unset)") {
							const use = await callbacks.onPrompt({
								message: `Use current project '${currentProject}'? (y/n)`,
							});
							if (use?.toLowerCase() === "y") {
								project = currentProject;
							}
						}
					} catch {}

					if (!project) {
						// List available projects
						try {
							const projects = execSync(`${gcloudPath} projects list --format="value(projectId)"`, {
								encoding: "utf-8",
								stdio: ["ignore", "pipe", "ignore"],
							}).trim().split("\n");

							if (projects.length > 0) {
								callbacks.onAuth({
									type: "info",
									message: `Available projects:\n${projects.map(p => `  - ${p}`).join("\n")}`,
								});
							}
						} catch {}

						const projectInput = await callbacks.onPrompt({
							message: "Enter GCP project ID:",
						});

						if (!projectInput || projectInput.trim() === "") {
							throw new Error("Project ID required");
						}
						project = projectInput.trim();

						// Set as default
						try {
							execSync(`${gcloudPath} config set project ${project}`, { stdio: "ignore" });
						} catch {}
					}
				}

				// Save to environment (user will need to add to their shell config)
				process.env.VERTEX_PROJECT_ID = project;

				// Step 4: Select region
				callbacks.onAuth({ type: "progress", message: "Configuring region..." });
				let region = process.env.VERTEX_REGION;

				if (!region) {
					const regions = [
						"global (recommended for latest models)",
						"us-east5",
						"us-central1",
						"europe-west1",
						"asia-southeast1",
					];

					callbacks.onAuth({
						type: "info",
						message: `Available regions:\n${regions.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}`,
					});

					const regionChoice = await callbacks.onPrompt({
						message: "Select region (1-5) or enter custom:",
					});

					if (regionChoice === "1") {
						region = "global";
					} else if (regionChoice === "2") {
						region = "us-east5";
					} else if (regionChoice === "3") {
						region = "us-central1";
					} else if (regionChoice === "4") {
						region = "europe-west1";
					} else if (regionChoice === "5") {
						region = "asia-southeast1";
					} else {
						region = regionChoice || "us-east5";
					}

					process.env.VERTEX_REGION = region;
				}

				// Step 5: Enable Vertex AI API
				callbacks.onAuth({ type: "progress", message: "Checking Vertex AI API..." });
				try {
					const enabled = execSync(
						`${gcloudPath} services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)"`,
						{ encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
					).trim();

					if (!enabled) {
						const enable = await callbacks.onPrompt({
							message: "Vertex AI API not enabled. Enable it now? (y/n)",
						});

						if (enable?.toLowerCase() === "y") {
							callbacks.onAuth({ type: "progress", message: "Enabling Vertex AI API (this may take a minute)..." });
							execSync(`${gcloudPath} services enable aiplatform.googleapis.com`, { stdio: "inherit" });
							callbacks.onAuth({ type: "info", message: "Vertex AI API enabled!" });
						} else {
							callbacks.onAuth({
								type: "warning",
								message: "API not enabled. You'll need to enable it manually:\n" +
									`  gcloud services enable aiplatform.googleapis.com --project=${project}`,
							});
						}
					}
				} catch (error) {
					callbacks.onAuth({
						type: "warning",
						message: "Could not check API status. If requests fail, enable it manually:\n" +
							`  gcloud services enable aiplatform.googleapis.com --project=${project}`,
					});
				}

				// Step 6: Test authentication
				callbacks.onAuth({ type: "progress", message: "Testing authentication..." });
				try {
					const token = execSync(`${gcloudPath} auth print-access-token`, {
						encoding: "utf-8",
						timeout: 5000,
					}).trim();

					if (!token || token.length < 20) {
						throw new Error("Invalid token");
					}
				} catch (error) {
					throw new Error("Authentication test failed. Please run: gcloud auth login");
				}

				// Success! Show next steps
				callbacks.onAuth({
					type: "success",
					message: `✓ Configured successfully!\n\n` +
						`Project: ${project}\n` +
						`Region: ${region}\n\n` +
						`To persist these settings, add to your ~/.zshrc or ~/.bashrc:\n\n` +
						`  export VERTEX_PROJECT_ID="${project}"\n` +
						`  export VERTEX_REGION="${region}"\n`,
				});

				// Return credentials
				return {
					refresh: JSON.stringify({ project, region, gcloudPath }),
					access: "gcloud",
					expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
				};
			},
			async refreshToken(credentials) {
				// Always use fresh token from gcloud
				return credentials;
			},
			getApiKey(credentials) {
				// Parse saved config
				try {
					const saved = JSON.parse(credentials.refresh);
					// Update process env from saved credentials
					if (saved.project) process.env.VERTEX_PROJECT_ID = saved.project;
					if (saved.region) process.env.VERTEX_REGION = saved.region;
				} catch {}

				// Return command that Pi will execute to get token
				const gcloudPath = config.gcloudPath;
				return `!${gcloudPath} auth print-access-token`;
			},
		},

		models: [
			// Claude Sonnet 4.5 (Latest - Extended Thinking)
			{
				id: "claude-sonnet-4-5@20250929",
				name: "Claude Sonnet 4.5 (Vertex)",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 64000,
			},

			// Claude 3.5 Sonnet v2
			{
				id: "claude-3-5-sonnet-v2@20241022",
				name: "Claude 3.5 Sonnet v2 (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 8192,
			},

			// Claude 3.5 Sonnet (Original)
			{
				id: "claude-3-5-sonnet@20240620",
				name: "Claude 3.5 Sonnet (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 8192,
			},

			// Claude 3.5 Haiku
			{
				id: "claude-3-5-haiku@20241022",
				name: "Claude 3.5 Haiku (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
				contextWindow: 200000,
				maxTokens: 8192,
			},

			// Claude 3 Opus
			{
				id: "claude-3-opus@20240229",
				name: "Claude 3 Opus (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
				contextWindow: 200000,
				maxTokens: 4096,
			},

			// Claude 3 Sonnet
			{
				id: "claude-3-sonnet@20240229",
				name: "Claude 3 Sonnet (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
				contextWindow: 200000,
				maxTokens: 4096,
			},

			// Claude 3 Haiku
			{
				id: "claude-3-haiku@20240307",
				name: "Claude 3 Haiku (Vertex)",
				reasoning: false,
				input: ["text", "image"],
				cost: { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 },
				contextWindow: 200000,
				maxTokens: 4096,
			},
		],

		streamSimple: streamVertexAnthropic,
	});

	// Provide helpful status when extension loads
	pi.on("session_start", async (_event, ctx) => {
		if (config.project === "your-gcp-project-id") {
			ctx.ui?.notify(
				"Vertex AI: Set VERTEX_PROJECT_ID environment variable to configure",
				"warning",
			);
		}
	});
}
