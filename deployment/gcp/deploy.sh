#!/bin/bash
# Google Cloud Platform deployment script for NSF Awards MCP Server

set -euo pipefail

# Configuration
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-nsf-awards-mcp}"
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/user/nsf-awards-mcp:latest}"
MIN_INSTANCES="${MIN_INSTANCES:-1}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"
MEMORY="${MEMORY:-2Gi}"
CPU="${CPU:-1}"

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
NSF Awards MCP Server - GCP Cloud Run Deployment Script

USAGE:
    $(basename "$0") [OPTIONS] [COMMAND]

COMMANDS:
    deploy      Deploy service to Cloud Run (default)
    update      Update existing service
    delete      Delete service
    status      Check service status
    logs        View service logs
    setup       Setup GCP project and enable APIs

OPTIONS:
    -p, --project PROJECT    GCP Project ID
    -r, --region REGION      GCP Region (default: us-central1)
    -i, --image IMAGE        Container image (default: ghcr.io/user/nsf-awards-mcp:latest)
    --min-instances N        Minimum instances (default: 1)
    --max-instances N        Maximum instances (default: 10)
    --memory SIZE            Memory allocation (default: 2Gi)
    --cpu COUNT              CPU allocation (default: 1)
    --allow-unauthenticated  Allow public access
    -h, --help              Show this help

EXAMPLES:
    # Deploy to Cloud Run
    $(basename "$0") deploy -p my-project-id --allow-unauthenticated

    # Update existing service
    $(basename "$0") update -p my-project-id -i ghcr.io/user/nsf-awards-mcp:v2.0.0

    # Setup project
    $(basename "$0") setup -p my-project-id

EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check gcloud CLI
    if ! command -v gcloud >/dev/null 2>&1; then
        log_error "gcloud CLI is not installed"
        log_info "Install gcloud: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 >/dev/null; then
        log_error "Not authenticated with gcloud"
        log_info "Run: gcloud auth login"
        exit 1
    fi

    # Check project ID
    if [[ -z "$PROJECT_ID" ]]; then
        # Try to get from gcloud config
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
        if [[ -z "$PROJECT_ID" ]]; then
            log_error "Project ID not specified and no default project set"
            log_info "Use -p PROJECT_ID or run: gcloud config set project PROJECT_ID"
            exit 1
        fi
    fi

    log_info "Using project: $PROJECT_ID"
    log_info "Using region: $REGION"
    log_success "Prerequisites check completed"
}

# Setup GCP project
setup_project() {
    log_info "Setting up GCP project..."

    # Set project
    gcloud config set project "$PROJECT_ID"

    # Enable required APIs
    log_info "Enabling required APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        logging.googleapis.com \
        monitoring.googleapis.com

    # Create service account
    log_info "Creating service account..."
    gcloud iam service-accounts create nsf-awards-mcp \
        --display-name="NSF Awards MCP Server" \
        --description="Service account for NSF Awards MCP Server" || true

    # Grant necessary roles
    log_info "Granting IAM roles..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:nsf-awards-mcp@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/logging.logWriter"

    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:nsf-awards-mcp@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/monitoring.metricWriter"

    log_success "Project setup completed"
}

# Deploy service to Cloud Run
deploy_service() {
    log_info "Deploying NSF Awards MCP Server to Cloud Run..."

    # Build deployment command
    local deploy_args=(
        "gcloud" "run" "deploy" "$SERVICE_NAME"
        "--image" "$IMAGE_NAME"
        "--platform" "managed"
        "--region" "$REGION"
        "--min-instances" "$MIN_INSTANCES"
        "--max-instances" "$MAX_INSTANCES"
        "--memory" "$MEMORY"
        "--cpu" "$CPU"
        "--concurrency" "100"
        "--timeout" "300"
        "--service-account" "nsf-awards-mcp@${PROJECT_ID}.iam.gserviceaccount.com"
        "--set-env-vars" "NODE_ENV=production,LOG_LEVEL=info"
        "--port" "3000"
    )

    # Add authentication setting
    if [[ "${ALLOW_UNAUTHENTICATED:-false}" == "true" ]]; then
        deploy_args+=("--allow-unauthenticated")
        log_warning "Service will be publicly accessible"
    else
        deploy_args+=("--no-allow-unauthenticated")
        log_info "Service will require authentication"
    fi

    # Execute deployment
    "${deploy_args[@]}"

    # Get service URL
    local service_url
    service_url=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --format="value(status.url)")

    log_success "Deployment completed"
    log_info "Service URL: $service_url"

    # Test the deployment
    test_deployment "$service_url"
}

# Update existing service
update_service() {
    log_info "Updating NSF Awards MCP Server..."

    gcloud run services update "$SERVICE_NAME" \
        --image "$IMAGE_NAME" \
        --region "$REGION"

    log_success "Service updated successfully"
}

# Delete service
delete_service() {
    log_warning "This will delete the Cloud Run service: $SERVICE_NAME"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deleting service..."
        gcloud run services delete "$SERVICE_NAME" \
            --region="$REGION" \
            --quiet
        log_success "Service deleted"
    else
        log_info "Deletion cancelled"
    fi
}

# Check service status
check_status() {
    log_info "Checking service status..."

    # Get service details
    gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --format="table(
            metadata.name,
            status.url,
            status.conditions[0].type,
            status.conditions[0].status,
            spec.template.spec.containers[0].image
        )"

    # Get recent revisions
    echo
    log_info "Recent revisions:"
    gcloud run revisions list \
        --service="$SERVICE_NAME" \
        --region="$REGION" \
        --limit=5 \
        --format="table(
            metadata.name,
            status.conditions[0].lastTransitionTime,
            spec.containers[0].image,
            status.observedGeneration
        )"
}

# View service logs
view_logs() {
    log_info "Viewing service logs..."
    gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --limit=50 \
        --format="table(timestamp,severity,textPayload)"
}

# Test deployment
test_deployment() {
    local url="$1"
    log_info "Testing deployment..."

    # Test health endpoint
    if curl -f -s "${url}/health" >/dev/null; then
        log_success "Health check passed"
    else
        log_warning "Health check failed or endpoint not responding"
    fi

    # Test basic connectivity
    if curl -f -s -o /dev/null "${url}"; then
        log_success "Service is accessible"
    else
        log_warning "Service accessibility test failed"
    fi
}

# Parse command line arguments
parse_args() {
    local command=""
    ALLOW_UNAUTHENTICATED="false"

    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|update|delete|status|logs|setup)
                command="$1"
                shift
                ;;
            -p|--project)
                PROJECT_ID="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -i|--image)
                IMAGE_NAME="$2"
                shift 2
                ;;
            --min-instances)
                MIN_INSTANCES="$2"
                shift 2
                ;;
            --max-instances)
                MAX_INSTANCES="$2"
                shift 2
                ;;
            --memory)
                MEMORY="$2"
                shift 2
                ;;
            --cpu)
                CPU="$2"
                shift 2
                ;;
            --allow-unauthenticated)
                ALLOW_UNAUTHENTICATED="true"
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

    # Set default command
    command="${command:-deploy}"

    # Export variables
    export COMMAND="$command"
    export PROJECT_ID
    export REGION
    export SERVICE_NAME
    export IMAGE_NAME
    export MIN_INSTANCES
    export MAX_INSTANCES
    export MEMORY
    export CPU
    export ALLOW_UNAUTHENTICATED
}

# Main function
main() {
    parse_args "$@"

    log_info "=== NSF Awards MCP GCP Deployment ==="
    log_info "Command: $COMMAND"
    log_info "Project: $PROJECT_ID"
    log_info "Region: $REGION"
    log_info "Service: $SERVICE_NAME"
    log_info "Image: $IMAGE_NAME"
    echo

    check_prerequisites

    case "$COMMAND" in
        setup)
            setup_project
            ;;
        deploy)
            deploy_service
            ;;
        update)
            update_service
            ;;
        delete)
            delete_service
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            exit 1
            ;;
    esac

    log_success "Operation completed successfully!"
}

# Run main function
main "$@"