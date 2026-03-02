#!/bin/bash
#
# Pi Vertex Anthropic Extension Installer
# Installs the extension to ~/.pi/agent/extensions/vertex-anthropic
#
# Usage:
#   bash install.sh          # Clone from GitHub
#   bash install.sh --dev    # Symlink current directory (for development)
#

set -e

EXTENSION_DIR="$HOME/.pi/agent/extensions/vertex-anthropic"
REPO_URL="https://github.com/skyfallsin/pi-vertex-anthropic.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEV_MODE=false

# Parse arguments
for arg in "$@"; do
    case "$arg" in
        --dev)
            DEV_MODE=true
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: bash install.sh [--dev]"
            exit 1
            ;;
    esac
done

echo "📦 Installing Pi Vertex Anthropic Extension..."
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

# Remove existing installation if present
if [ -L "$EXTENSION_DIR" ]; then
    echo "🔗 Removing existing symlink..."
    rm "$EXTENSION_DIR"
elif [ -d "$EXTENSION_DIR" ]; then
    echo "📁 Removing existing installation..."
    rm -rf "$EXTENSION_DIR"
fi

if [ "$DEV_MODE" = true ]; then
    echo "🔧 Dev mode: symlinking $SCRIPT_DIR -> $EXTENSION_DIR"
    ln -s "$SCRIPT_DIR" "$EXTENSION_DIR"

    # Install dependencies in the source directory if needed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        echo "📥 Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" "$EXTENSION_DIR"
    cd "$EXTENSION_DIR"

    echo "📥 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Installation complete!"
if [ "$DEV_MODE" = true ]; then
    echo "   Mode: dev (symlinked from $SCRIPT_DIR)"
else
    echo "   Mode: release (cloned from GitHub)"
fi
echo ""
echo "⚙️  Next steps:"
echo "   1. Restart Pi or run /reload"
echo "   2. Run /login to configure your GCP project and region"
echo "   3. Ensure you're authenticated: gcloud auth login"
echo ""
echo "📖 Documentation: https://github.com/skyfallsin/pi-vertex-anthropic"
echo ""
