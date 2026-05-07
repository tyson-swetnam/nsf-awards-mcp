#!/bin/bash
# Multi-architecture Docker build script for NSF Awards MCP Server
# Supports AMD64, ARM64 architectures for broad deployment compatibility

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-nsf-awards-mcp}"
REGISTRY="${REGISTRY:-ghcr.io/user}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

# Build metadata
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
NSF Awards MCP Docker Build Script

USAGE:
    $(basename "$0") [OPTIONS] [COMMAND]

COMMANDS:
    build       Build multi-architecture images (default)
    push        Build and push to registry
    local       Build local image only (current architecture)
    test        Build and run tests
    clean       Remove local images and build cache

OPTIONS:
    -t, --tag TAG       Image tag (default: latest)
    -r, --registry REG  Container registry (default: ghcr.io/user)
    -p, --platforms PLAT Platform list (default: linux/amd64,linux/arm64)
    --no-cache         Build without cache
    --push             Push after building
    -h, --help         Show this help

ENVIRONMENT VARIABLES:
    IMAGE_NAME          Base image name (default: nsf-awards-mcp)
    REGISTRY           Container registry (default: ghcr.io/user)
    PLATFORMS          Platform targets (default: linux/amd64,linux/arm64)
    DOCKER_BUILDKIT    Enable BuildKit (default: 1)

EXAMPLES:
    # Build multi-arch images
    $(basename "$0") build

    # Build and push to registry
    $(basename "$0") push -t v1.0.0

    # Build local image only
    $(basename "$0") local

    # Build with custom registry
    $(basename "$0") build -r docker.io/myuser -t latest

EOF
}

# Parse command line arguments
parse_args() {
    local command=""
    local tag="latest"
    local no_cache=""
    local push_flag=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            build|push|local|test|clean)
                command="$1"
                shift
                ;;
            -t|--tag)
                tag="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -p|--platforms)
                PLATFORMS="$2"
                shift 2
                ;;
            --no-cache)
                no_cache="--no-cache"
                shift
                ;;
            --push)
                push_flag="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Set defaults
    command="${command:-build}"

    # Export variables
    export COMMAND="$command"
    export TAG="$tag"
    export NO_CACHE="$no_cache"
    export PUSH_FLAG="$push_flag"
}

# Verify prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker version
    docker_version=$(docker --version | grep -o '[0-9]\+\.[0-9]\+' | head -1)
    log_info "Docker version: $docker_version"

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Enable BuildKit
    export DOCKER_BUILDKIT=1

    # Check for buildx plugin (needed for multi-arch)
    if [[ "$COMMAND" == "build" ]] || [[ "$COMMAND" == "push" ]]; then
        if ! docker buildx version >/dev/null 2>&1; then
            log_warning "Docker buildx not available, falling back to single architecture build"
            PLATFORMS="linux/amd64"
        else
            # Create/use buildx builder instance
            docker buildx create --use --name nsf-awards-builder 2>/dev/null || true
            docker buildx inspect --bootstrap >/dev/null 2>&1
        fi
    fi

    # Verify project structure
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found in project root"
        exit 1
    fi

    if [[ ! -f "$PROJECT_ROOT/Dockerfile" ]]; then
        log_error "Dockerfile not found in project root"
        exit 1
    fi

    log_success "Prerequisites verified"
}

# Build local image (single architecture)
build_local() {
    log_info "Building local image: ${FULL_IMAGE_NAME}"

    cd "$PROJECT_ROOT"

    docker build \
        $NO_CACHE \
        --tag "$FULL_IMAGE_NAME" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg VERSION="$VERSION" \
        .

    log_success "Local build completed: ${FULL_IMAGE_NAME}"
}

# Build multi-architecture images
build_multiarch() {
    log_info "Building multi-architecture images: ${FULL_IMAGE_NAME}"
    log_info "Platforms: $PLATFORMS"

    cd "$PROJECT_ROOT"

    local push_arg=""
    if [[ "$PUSH_FLAG" == "true" ]] || [[ "$COMMAND" == "push" ]]; then
        push_arg="--push"
        log_info "Images will be pushed to registry"
    fi

    docker buildx build \
        $NO_CACHE \
        --platform "$PLATFORMS" \
        --tag "$FULL_IMAGE_NAME" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg VERSION="$VERSION" \
        $push_arg \
        .

    if [[ "$push_arg" == "--push" ]]; then
        log_success "Multi-arch build and push completed: ${FULL_IMAGE_NAME}"
    else
        log_success "Multi-arch build completed: ${FULL_IMAGE_NAME}"
    fi
}

# Test the built image
test_image() {
    log_info "Testing image: ${FULL_IMAGE_NAME}"

    # Test that the image runs
    log_info "Testing image startup..."
    container_id=$(docker run -d --rm "$FULL_IMAGE_NAME")

    # Wait for startup
    sleep 5

    # Check if container is still running
    if docker ps | grep -q "$container_id"; then
        log_success "Image startup test passed"
        docker stop "$container_id" >/dev/null
    else
        log_error "Image startup test failed"
        docker logs "$container_id" 2>/dev/null || true
        exit 1
    fi

    # Test image metadata
    log_info "Verifying image metadata..."
    docker inspect "$FULL_IMAGE_NAME" | jq -r '.[0].Config.Labels' >/dev/null 2>&1 || {
        log_warning "jq not available, skipping metadata verification"
    }

    log_success "Image testing completed"
}

# Clean up images and build cache
clean() {
    log_info "Cleaning up Docker images and cache..."

    # Remove local images
    docker images | grep "$IMAGE_NAME" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

    # Clean build cache
    docker builder prune -f 2>/dev/null || true

    # Clean buildx cache
    docker buildx prune -f 2>/dev/null || true

    log_success "Cleanup completed"
}

# Main execution
main() {
    # Parse arguments
    parse_args "$@"

    # Set full image name
    export FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

    # Show configuration
    log_info "=== NSF Awards MCP Docker Build ==="
    log_info "Command: $COMMAND"
    log_info "Image: $FULL_IMAGE_NAME"
    log_info "Platforms: $PLATFORMS"
    log_info "Version: $VERSION"
    log_info "VCS Ref: $VCS_REF"
    log_info "Build Date: $BUILD_DATE"
    echo

    # Check prerequisites
    check_prerequisites

    # Execute command
    case "$COMMAND" in
        build)
            if [[ "$PLATFORMS" == "linux/amd64" ]] || [[ "$PLATFORMS" != *","* ]]; then
                build_local
            else
                build_multiarch
            fi
            ;;
        push)
            build_multiarch
            ;;
        local)
            build_local
            ;;
        test)
            build_local
            test_image
            ;;
        clean)
            clean
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            exit 1
            ;;
    esac

    log_success "Script completed successfully!"
}

# Run main function
main "$@"