# Pi Vertex Anthropic Extension

A [Pi coding agent](https://github.com/badlogic/pi) extension that enables Claude models through Google Cloud Vertex AI.

## Features

- 🚀 **Direct Vertex AI Integration** - Uses Google Cloud's Vertex AI Anthropic endpoint
- 🔐 **gcloud Authentication** - Leverages your existing `gcloud` credentials
- 💰 **Cost Tracking** - Full token usage and cost calculation support
- 🧠 **Extended Thinking** - Supports Claude's reasoning capabilities
- 📦 **Prompt Caching** - Automatic ephemeral caching for efficiency
- 🛡️ **Robust Error Handling** - Handles incomplete tool calls and aborted requests
- 🔄 **Cross-Provider Compatible** - Uses Pi's message transformation for reliability

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

```bash
# Create the extension directory
mkdir -p ~/.pi/agent/extensions/vertex-anthropic

# Clone this repository
git clone https://github.com/skyfallsin/pi-vertex-anthropic.git ~/.pi/agent/extensions/vertex-anthropic

# Install dependencies
cd ~/.pi/agent/extensions/vertex-anthropic
npm install
```

## Configuration

Edit `~/.pi/agent/extensions/vertex-anthropic/index.ts` to configure your GCP settings:

```typescript
const PROJECT = "your-gcp-project-id";  // Your GCP project ID
const REGION = "us-east5";              // Vertex AI region
const GCLOUD_PATH = "/path/to/gcloud";  // Path to gcloud binary
```

Common gcloud paths:
- macOS/Linux: `/usr/local/bin/gcloud` or `~/google-cloud-sdk/bin/gcloud`
- Cloud Shell: `/usr/bin/gcloud`

### Find Your Settings

```bash
# Get your project ID
gcloud config get-value project

# Find gcloud path
which gcloud

# Test authentication
gcloud auth print-access-token
```

## Usage

Once installed and configured, the extension will register the `vertex-anthropic` provider with Pi.

### Available Models

- **Claude Sonnet 4.5** (`claude-sonnet-4-5@20250929`)
  - 200K context window
  - 64K max output tokens
  - Extended thinking/reasoning support
  - Image input support
  - Cost: $3/1M input tokens, $15/1M output tokens

### Selecting the Model in Pi

In Pi's settings (`~/.pi/agent/settings.json`) or via the UI, select:

```json
{
  "model": "claude-sonnet-4-5@20250929",
  "provider": "vertex-anthropic"
}
```

Or use the Pi TUI to switch models interactively.

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

### Authentication Errors

```bash
# Re-authenticate
gcloud auth login

# Verify token generation
gcloud auth print-access-token

# Check active account
gcloud auth list
```

### Vertex AI API Not Enabled

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

### Permission Issues

Ensure your GCP account has:
- `roles/aiplatform.user` or higher
- Vertex AI API access in the specified region

### Rate Limits

Vertex AI has different quotas than direct Anthropic API. Check your quotas:
```bash
gcloud compute project-info describe --project=YOUR_PROJECT_ID
```

## Supported Regions

Vertex AI Anthropic models are available in:
- `us-east5` (default)
- `us-central1`
- `europe-west1`
- `asia-southeast1`

Update the `REGION` constant in `index.ts` to use a different region.

## Cost Comparison

| Model | Direct Anthropic API | Vertex AI |
|-------|---------------------|-----------|
| Claude Sonnet 4.5 Input | $3/1M tokens | $3/1M tokens |
| Claude Sonnet 4.5 Output | $15/1M tokens | $15/1M tokens |
| Cache Reads | $0.30/1M tokens | $0.30/1M tokens |
| Cache Writes | $3.75/1M tokens | $3.75/1M tokens |

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
