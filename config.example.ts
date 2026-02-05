/**
 * Example Configuration for Pi Vertex Anthropic Extension
 * 
 * Copy the values below to the top of index.ts and customize for your setup.
 */

// =============================================================================
// Configuration Options
// =============================================================================

/**
 * Your Google Cloud Project ID
 * Find it with: gcloud config get-value project
 */
const PROJECT = "your-gcp-project-id";

/**
 * Vertex AI Region
 * Supported regions:
 * - us-east5 (recommended)
 * - us-central1
 * - europe-west1
 * - asia-southeast1
 */
const REGION = "us-east5";

/**
 * Path to gcloud CLI binary
 * Find it with: which gcloud
 * 
 * Common paths:
 * - macOS/Linux: /usr/local/bin/gcloud
 * - Home install: ~/google-cloud-sdk/bin/gcloud
 * - Cloud Shell: /usr/bin/gcloud
 */
const GCLOUD_PATH = "/usr/local/bin/gcloud";

// =============================================================================
// How to Find Your Configuration
// =============================================================================

/*
# 1. Get your project ID
gcloud config get-value project

# 2. Find gcloud path
which gcloud

# 3. Test authentication (should print a long token)
gcloud auth print-access-token

# 4. Verify Vertex AI API is enabled
gcloud services list --enabled | grep aiplatform

# 5. Enable Vertex AI API if needed
gcloud services enable aiplatform.googleapis.com

# 6. Check your authentication status
gcloud auth list
*/

// =============================================================================
// Advanced Configuration (Optional)
// =============================================================================

/**
 * Customize the available models by editing the models array in index.ts
 * 
 * Example: Add Claude Opus when available
 */
const EXAMPLE_MODELS = [
	{
		id: "claude-sonnet-4-5@20250929",
		name: "Claude Sonnet 4.5 (Vertex)",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
		contextWindow: 200000,
		maxTokens: 64000,
	},
	// Add more models here as they become available on Vertex AI
];

/**
 * Note: Model IDs on Vertex AI use @VERSION suffix
 * Check available models: https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude
 */
