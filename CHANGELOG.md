# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-02-05

### Added
- **Claude Opus 4.5** - Flagship model with extended thinking ($15/$75 per 1M tokens)

### Fixed
- **BREAKING**: Renamed "Claude Sonnet 4.5" → "Claude Sonnet 4" (correct model name)
- **BREAKING**: Updated Sonnet 4 version from @20250929 → @20250514 (correct version)
- Model IDs now match official Vertex AI catalog

### Changed
- Models now aligned with PR #1157 in badlogic/pi-mono
- Using correct Anthropic model naming convention

## [2.0.0] - 2025-02-05

### Changed
- **BREAKING**: Replaced hardcoded configuration with environment variables
- **BREAKING**: Configuration now uses `VERTEX_PROJECT_ID`, `VERTEX_REGION`, `VERTEX_GCLOUD_PATH`
- **Complete `/login` rewrite** - Now fully interactive and helpful:
  - Detects if gcloud is missing and offers installation help
  - Runs `gcloud auth login` if needed
  - Helps select/configure GCP project
  - Interactive region selection (including `global`)
  - Enables Vertex AI API if needed
  - Tests authentication before completing
  - Shows exact commands to persist settings

### Added
- **Global region support** - Access latest models via `global` endpoint
- All available Claude models on Vertex AI (7 models total)
  - Claude Sonnet 4.5 (Extended Thinking)
  - Claude 3.5 Sonnet v2
  - Claude 3.5 Sonnet
  - Claude 3.5 Haiku
  - Claude 3 Opus
  - Claude 3 Sonnet
  - Claude 3 Haiku
- Interactive project selection from your available projects
- Automatic API enablement during `/login`
- Helpful progress messages during setup
- Persist configuration in credentials for reuse

### Fixed
- TypeScript import compatibility issues
- Extension now follows Pi's authentication patterns
- Proper error handling when gcloud is missing
- Correct endpoint format for global region

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
