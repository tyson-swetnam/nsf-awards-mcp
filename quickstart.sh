#!/bin/bash

# NSF Awards MCP Server - Quick Start Script

echo "NSF Awards MCP Server - Quick Start"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

echo "✓ npm $(npm -v) detected"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""

# Build the project if needed
if [ ! -d "build" ]; then
    echo "Building the project..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build the project"
        exit 1
    fi
    echo "✓ Project built successfully"
else
    echo "✓ Project already built"
fi

echo ""
echo "===================================="
echo "Setup complete!"
echo ""
echo "To start the MCP server:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
echo "For Claude Desktop integration, add this to your config:"
echo "  ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "  {
    \"mcpServers\": {
      \"nsf-awards\": {
        \"command\": \"node\",
        \"args\": [\"$(pwd)/build/index.js\"]
      }
    }
  }"
echo ""
echo "===================================="