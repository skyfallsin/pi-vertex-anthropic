# Pi Vertex Anthropic Extension

A [Pi coding agent](https://github.com/badlogic/pi) extension that enables Claude models through Google Cloud Vertex AI.

## Features

- 🎯 **Interactive `/login` Setup** - Guided configuration with gcloud installation help
- 🌍 **Global Region Support** - Access latest models via `global` endpoint
- 🚀 **Direct Vertex AI Integration** - Uses Google Cloud's Vertex AI Anthropic endpoint
- 🔐 **gcloud Authentication** - Leverages your existing `gcloud` credentials
- 💰 **Cost Tracking** - Full token usage and cost calculation support
- 🧠 **Extended Thinking** - Supports Claude's reasoning capabilities
- 📦 **Prompt Caching** - Automatic ephemeral caching for efficiency
- 🛡️ **Robust Error Handling** - Handles incomplete tool calls and aborted requests
- 🔄 **Cross-Provider Compatible** - Uses Pi's message transformation for reliability
- 🛠️ **Zero Config Editing** - Everything configured through `/login` command

## Why Use This?

- **Vertex AI Benefits**: Take advantage of Google Cloud's enterprise features, billing, and regional deployments
- **Alternative to Direct API**: Useful if you have GCP credits or prefer consolidated cloud billing
- **Extended Context**: Access to Claude's 200K context window through Vertex AI

## Installation

### Prerequisites

1. **Pi coding agent** installed ([installation guide](https://github.com/badlogic/pi))
2. **Google Cloud SDK** with `gcloud` CLI configured
3. **Vertex AI API** enabled in your GCP project
4. **Authenticated gcloud session**: `gcloud auth login`

### Install Extension

**One-line install:**

```bash
curl -fsSL https://raw.githubusercontent.com/skyfallsin/pi-vertex-anthropic/main/install.sh | bash
```

**Manual install:**

```bash
mkdir -p ~/.pi/agent/extensions/vertex-anthropic
git clone https://github.com/skyfallsin/pi-vertex-anthropic.git ~/.pi/agent/extensions/vertex-anthropic
cd ~/.pi/agent/extensions/vertex-anthropic && npm install
```

**Then run:**

```bash
pi
/login  # Interactive setup - does everything for you!
```

## Configuration

**Use `/login` - It does everything for you!**

```bash
pi
/login  # Select "Google Cloud Vertex AI (gcloud)"
```

The interactive login flow will:
1. ✅ Check if gcloud is installed (offers to help install if missing)
2. ✅ Run `gcloud auth login` if needed
3. ✅ Help you select or enter a GCP project
4. ✅ Let you choose a region (global, us-east5, etc.)
5. ✅ Enable Vertex AI API if not enabled
6. ✅ Test authentication
7. ✅ Show you what to add to your shell config

**That's it!** The `/login` command handles all configuration.

### Persist Settings (Optional)

After `/login`, add the suggested environment variables to your shell config:

```bash
# Add to ~/.zshrc or ~/.bashrc
export VERTEX_PROJECT_ID="your-project-id"
export VERTEX_REGION="global"  # or us-east5, europe-west1, etc.
```

This persists your settings across terminal sessions.

## Usage

Once installed and configured, the extension will register the `vertex-anthropic` provider with Pi.

### Available Models

All Claude models available on Vertex AI are supported:

#### Claude 4.6 & 4.5 Generation (Extended Thinking)

- **Claude Opus 4.6** (`claude-opus-4-6`)
  - 200K context, 64K max output
  - ✅ Extended thinking/reasoning
  - ✅ Image support
  - Cost: $5/1M input, $25/1M output
  - **Latest Flagship** - Most intelligent model

- **Claude Opus 4.5** (`claude-opus-4-5@20251101`)
  - 200K context, 64K max output
  - ✅ Extended thinking/reasoning
  - ✅ Image support
  - Cost: $15/1M input, $75/1M output

- **Claude Sonnet 4.5** (`claude-sonnet-4-5@20250929`)
  - 200K context, 64K max output
  - ✅ Extended thinking/reasoning
  - ✅ Image support
  - Cost: $3/1M input, $15/1M output
  - **Best price/performance**

- **Claude Haiku 4.5** (`claude-haiku-4-5@20251001`)
  - 200K context, 64K max output
  - ✅ Extended thinking/reasoning
  - ✅ Image support
  - Cost: $1/1M input, $5/1M output
  - **Fast & economical**

#### Claude 3.5 Family

- **Claude 3.5 Sonnet v2** (`claude-3-5-sonnet-v2@20241022`)
  - 200K context, 8K max output
  - ✅ Image support
  - Cost: $3/1M input, $15/1M output

- **Claude 3.5 Sonnet** (`claude-3-5-sonnet@20240620`)
  - 200K context, 8K max output
  - ✅ Image support
  - Cost: $3/1M input, $15/1M output

- **Claude 3.5 Haiku** (`claude-3-5-haiku@20241022`)
  - 200K context, 8K max output
  - ✅ Image support
  - Cost: $0.80/1M input, $4/1M output

#### Claude 3 Family

- **Claude 3 Opus** (`claude-3-opus@20240229`)
  - 200K context, 4K max output
  - ✅ Image support
  - Cost: $15/1M input, $75/1M output

- **Claude 3 Sonnet** (`claude-3-sonnet@20240229`)
  - 200K context, 4K max output
  - ✅ Image support
  - Cost: $3/1M input, $15/1M output

- **Claude 3 Haiku** (`claude-3-haiku@20240307`)
  - 200K context, 4K max output
  - ✅ Image support
  - Cost: $0.25/1M input, $1.25/1M output

### Selecting the Model

Use Pi's `/model` command or `Ctrl+L` to switch models:

```bash
pi
/model  # Interactive model selector
```

Or start with a specific model:

```bash
# Use the latest flagship model
pi --model claude-opus-4-6 --provider vertex-anthropic

# Or use Sonnet 4.5 for best price/performance
pi --model claude-sonnet-4-5@20250929 --provider vertex-anthropic
```

## How It Works

This extension:

1. **Authenticates** using `gcloud auth print-access-token`
2. **Converts** Pi's message format to Anthropic's Messages API format
3. **Streams** requests to Vertex AI's `:streamRawPredict` endpoint
4. **Parses** Server-Sent Events (SSE) responses
5. **Transforms** responses back to Pi's event stream format

### Message Transformation

The extension uses Pi's `transformMessages` utility to:
- Remove incomplete assistant messages (errors/aborted)
- Insert synthetic tool results for orphaned tool calls
- Normalize tool call IDs for Anthropic's requirements
- Convert thinking blocks to appropriate formats

This prevents common API errors like:
```
messages.X: `tool_use` ids were found without `tool_result` blocks
```

## Development

### Project Structure

```
pi-vertex-anthropic/
├── index.ts          # Main extension implementation
├── package.json      # Dependencies and metadata
├── README.md         # This file
└── LICENSE          # MIT License
```

### Building

The extension is written in TypeScript and loaded directly by Pi:

```bash
# Install dependencies
npm install

# Pi will compile TypeScript extensions automatically
```

### Testing

1. Start Pi with debug logging:
   ```bash
   pi --debug
   ```

2. Try a simple request with the vertex-anthropic model

3. Check for authentication errors:
   ```bash
   gcloud auth print-access-token
   ```

## Troubleshooting

### "No GCP project configured"

Set the environment variable:
```bash
export VERTEX_PROJECT_ID="your-project-id"
```

Or find your project ID:
```bash
gcloud config get-value project
```

### Authentication Errors

```bash
# Re-authenticate
gcloud auth login

# Verify token generation (should print a long token)
gcloud auth print-access-token

# Check active account
gcloud auth list
```

### "gcloud: command not found"

Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install

Or specify the path:
```bash
export VERTEX_GCLOUD_PATH="/path/to/gcloud"
```

### Vertex AI API Not Enabled

```bash
# Enable for your project
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID

# Verify it's enabled
gcloud services list --enabled | grep aiplatform
```

### Permission Issues

Ensure your GCP account has:
- `roles/aiplatform.user` or higher
- Vertex AI API access in the specified region

Check IAM permissions:
```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Rate Limits

Vertex AI has different quotas than direct Anthropic API. Check quotas in the GCP Console:
https://console.cloud.google.com/iam-admin/quotas

## Supported Regions

Vertex AI Anthropic models are available in:
- **`global`** (recommended) - Latest models and features
- `us-east5`
- `us-central1`
- `europe-west1`
- `asia-southeast1`

The `/login` command lets you choose your preferred region.

## Cost Comparison

| Model | Direct Anthropic API | Vertex AI |
|-------|---------------------|-----------|
| Claude Opus 4.6 Input | $5/1M tokens | $5/1M tokens |
| Claude Opus 4.6 Output | $25/1M tokens | $25/1M tokens |
| Claude Sonnet 4.5 Input | $3/1M tokens | $3/1M tokens |
| Claude Sonnet 4.5 Output | $15/1M tokens | $15/1M tokens |
| Claude Haiku 4.5 Input | $1/1M tokens | $1/1M tokens |
| Claude Haiku 4.5 Output | $5/1M tokens | $5/1M tokens |
| Cache Reads | 10% of input cost | 10% of input cost |
| Cache Writes | 25% of input cost | 25% of input cost |

*Prices as of February 2025. Check GCP pricing for current rates.*

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for [Pi coding agent](https://github.com/badlogic/pi) by [@badlogicgames](https://github.com/badlogicgames)
- Uses [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- Inspired by Pi's custom provider examples

## Related Projects

- [Pi Coding Agent](https://github.com/badlogic/pi) - The AI coding agent
- [Pi AI SDK](https://github.com/badlogic/pi-ai) - Core AI provider SDK
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Official Anthropic SDK

## Support

- 🐛 [Report Issues](https://github.com/skyfallsin/pi-vertex-anthropic/issues)
- 💬 [Discussions](https://github.com/skyfallsin/pi-vertex-anthropic/discussions)
- 📧 Contact: [via GitHub](https://github.com/skyfallsin)

---

**Note**: This is an unofficial community extension. Not affiliated with Google Cloud or Anthropic.
