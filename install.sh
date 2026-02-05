#!/bin/bash
#
# Pi Vertex Anthropic Extension Installer
# Installs the extension to ~/.pi/agent/extensions/vertex-anthropic
#

set -e

EXTENSION_DIR="$HOME/.pi/agent/extensions/vertex-anthropic"
REPO_URL="https://github.com/skyfallsin/pi-vertex-anthropic.git"

echo "🚀 Installing Pi Vertex Anthropic Extension..."
echo ""

# Check if Pi is installed
if [ ! -d "$HOME/.pi" ]; then
    echo "❌ Error: Pi coding agent not found at ~/.pi"
    echo "   Please install Pi first: https://github.com/badlogic/pi"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "⚠️  Warning: gcloud CLI not found in PATH"
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    echo ""
fi

# Create extensions directory if it doesn't exist
mkdir -p "$(dirname "$EXTENSION_DIR")"

# Clone or update repository
if [ -d "$EXTENSION_DIR" ]; then
    echo "📦 Extension already installed. Updating..."
    cd "$EXTENSION_DIR"
    git pull
else
    echo "📦 Cloning repository..."
    git clone "$REPO_URL" "$EXTENSION_DIR"
    cd "$EXTENSION_DIR"
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚙️  Next steps:"
echo "   1. Edit $EXTENSION_DIR/index.ts"
echo "   2. Update the config values:"
echo "      - PROJECT: Your GCP project ID (gcloud config get-value project)"
echo "      - REGION: Your preferred Vertex AI region"
echo "      - GCLOUD_PATH: Path to gcloud binary (which gcloud)"
echo "   3. Ensure you're authenticated: gcloud auth login"
echo "   4. Enable Vertex AI API: gcloud services enable aiplatform.googleapis.com"
echo "   5. Restart Pi or reload extensions"
echo ""
echo "📖 Documentation: https://github.com/skyfallsin/pi-vertex-anthropic"
echo ""
