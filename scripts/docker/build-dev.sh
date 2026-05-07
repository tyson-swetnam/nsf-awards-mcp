#!/bin/bash
# Simple Docker build script for local development

set -euo pipefail

# Configuration
IMAGE_NAME="nsf-awards-mcp"
TAG="dev"

echo "🐳 Building NSF Awards MCP for local development..."

# Build the image
docker build -t "${IMAGE_NAME}:${TAG}" .

echo "✅ Build completed: ${IMAGE_NAME}:${TAG}"

# Show usage examples
echo ""
echo "Usage examples:"
echo "  # Run with docker-compose"
echo "  docker-compose up"
echo ""
echo "  # Run standalone"
echo "  docker run --rm -it ${IMAGE_NAME}:${TAG}"
echo ""
echo "  # Run with development profile"
echo "  docker-compose --profile dev up"