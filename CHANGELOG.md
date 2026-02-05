# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-05

### Added
- Initial release of Pi Vertex Anthropic extension
- Support for Claude Sonnet 4.5 via Google Cloud Vertex AI
- gcloud authentication integration
- Full streaming support with SSE parsing
- Extended thinking/reasoning capabilities
- Prompt caching with ephemeral cache control
- Comprehensive error handling for incomplete tool calls
- Cross-provider message transformation
- Cost tracking and token usage reporting
- Image input support

### Features
- Direct integration with Vertex AI `:streamRawPredict` endpoint
- Automatic tool call ID normalization
- Synthetic tool result insertion for orphaned calls
- Thinking block conversion and signature handling
- Robust abort and error handling
- Cache control on system prompts and conversation history

### Documentation
- Comprehensive README with setup instructions
- Configuration guide for GCP project and region
- Troubleshooting section
- Cost comparison table
- Usage examples

[1.0.0]: https://github.com/skyfallsin/pi-vertex-anthropic/releases/tag/v1.0.0
