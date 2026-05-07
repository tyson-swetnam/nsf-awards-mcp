#!/bin/bash
# Installation script for NSF Awards MCP Server on Linux with systemd

set -euo pipefail

# Configuration
SERVICE_NAME="nsf-awards-mcp"
INSTALL_DIR="/opt/${SERVICE_NAME}"
SERVICE_USER="${SERVICE_NAME}"
SERVICE_GROUP="${SERVICE_NAME}"
LOG_DIR="/var/log/${SERVICE_NAME}"

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
NSF Awards MCP Server - systemd Installation Script

USAGE:
    $(basename "$0") [OPTIONS]

OPTIONS:
    --install-dir DIR    Installation directory (default: /opt/nsf-awards-mcp)
    --user USER         Service user (default: nsf-awards-mcp)
    --group GROUP       Service group (default: nsf-awards-mcp)
    --no-start         Don't start the service after installation
    --uninstall        Remove the service and files
    -h, --help         Show this help

EXAMPLES:
    # Standard installation
    sudo $(basename "$0")

    # Custom installation directory
    sudo $(basename "$0") --install-dir /usr/local/nsf-awards-mcp

    # Uninstall
    sudo $(basename "$0") --uninstall

EOF
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect system information
detect_system() {
    log_info "Detecting system information..."

    # Check if systemd is available
    if ! command -v systemctl >/dev/null 2>&1; then
        log_error "systemd is not available on this system"
        exit 1
    fi

    # Check OS
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        log_info "Detected OS: $NAME $VERSION"
    else
        log_warning "Could not detect OS version"
    fi

    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js 18 or later:"
        log_info "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
        log_info "  CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs"
        exit 1
    fi

    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"

    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm is not installed"
        exit 1
    fi
}

# Create user and directories
setup_user_and_dirs() {
    log_info "Setting up user and directories..."

    # Create service user
    if ! id "$SERVICE_USER" &>/dev/null; then
        log_info "Creating user: $SERVICE_USER"
        useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    else
        log_info "User $SERVICE_USER already exists"
    fi

    # Create installation directory
    log_info "Creating installation directory: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
    chown "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
    chmod 755 "$INSTALL_DIR"

    # Create log directory
    log_info "Creating log directory: $LOG_DIR"
    mkdir -p "$LOG_DIR"
    chown "$SERVICE_USER:$SERVICE_GROUP" "$LOG_DIR"
    chmod 755 "$LOG_DIR"

    # Create logs subdirectory in install dir
    mkdir -p "$INSTALL_DIR/logs"
    chown "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR/logs"
}

# Install application files
install_application() {
    log_info "Installing application files..."

    # Determine script location
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

    # Check if we're in the project directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found in $PROJECT_ROOT"
        log_error "Please run this script from the project root or ensure the project is available"
        exit 1
    fi

    # Copy application files
    log_info "Copying application files to $INSTALL_DIR"
    cp -r "$PROJECT_ROOT"/* "$INSTALL_DIR/"

    # Install dependencies in target directory
    cd "$INSTALL_DIR"
    log_info "Installing production dependencies..."
    sudo -u "$SERVICE_USER" npm ci --only=production

    # Build the application
    log_info "Building the application..."
    sudo -u "$SERVICE_USER" npm run build

    # Set correct permissions
    chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
    find "$INSTALL_DIR" -type d -exec chmod 755 {} \;
    find "$INSTALL_DIR" -type f -exec chmod 644 {} \;
    chmod 755 "$INSTALL_DIR/build/index.js"
}

# Install systemd service
install_systemd_service() {
    log_info "Installing systemd service..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SERVICE_FILE="$SCRIPT_DIR/../systemd/${SERVICE_NAME}.service"

    if [[ ! -f "$SERVICE_FILE" ]]; then
        log_error "Service file not found: $SERVICE_FILE"
        exit 1
    fi

    # Copy and customize service file
    cp "$SERVICE_FILE" "/etc/systemd/system/${SERVICE_NAME}.service"

    # Update service file with actual paths
    sed -i "s|/opt/nsf-awards-mcp|${INSTALL_DIR}|g" "/etc/systemd/system/${SERVICE_NAME}.service"
    sed -i "s|User=nsf-mcp|User=${SERVICE_USER}|g" "/etc/systemd/system/${SERVICE_NAME}.service"
    sed -i "s|Group=nsf-mcp|Group=${SERVICE_GROUP}|g" "/etc/systemd/system/${SERVICE_NAME}.service"

    # Reload systemd
    systemctl daemon-reload

    # Enable service
    systemctl enable "${SERVICE_NAME}.service"

    log_success "systemd service installed and enabled"
}

# Setup log rotation
setup_logrotate() {
    log_info "Setting up log rotation..."

    cat > "/etc/logrotate.d/${SERVICE_NAME}" << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $SERVICE_USER $SERVICE_GROUP
    postrotate
        systemctl reload $SERVICE_NAME.service > /dev/null 2>&1 || true
    endscript
}
EOF

    log_success "Log rotation configured"
}

# Uninstall service
uninstall_service() {
    log_info "Uninstalling NSF Awards MCP service..."

    # Stop and disable service
    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
        log_info "Stopping service..."
        systemctl stop "${SERVICE_NAME}.service"
    fi

    if systemctl is-enabled --quiet "${SERVICE_NAME}.service"; then
        log_info "Disabling service..."
        systemctl disable "${SERVICE_NAME}.service"
    fi

    # Remove service file
    if [[ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]]; then
        rm "/etc/systemd/system/${SERVICE_NAME}.service"
        systemctl daemon-reload
        log_info "Service file removed"
    fi

    # Remove logrotate configuration
    if [[ -f "/etc/logrotate.d/${SERVICE_NAME}" ]]; then
        rm "/etc/logrotate.d/${SERVICE_NAME}"
        log_info "Logrotate configuration removed"
    fi

    # Remove installation directory (ask for confirmation)
    if [[ -d "$INSTALL_DIR" ]]; then
        read -p "Remove installation directory $INSTALL_DIR? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
            log_info "Installation directory removed"
        fi
    fi

    # Remove log directory (ask for confirmation)
    if [[ -d "$LOG_DIR" ]]; then
        read -p "Remove log directory $LOG_DIR? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$LOG_DIR"
            log_info "Log directory removed"
        fi
    fi

    # Remove user (ask for confirmation)
    if id "$SERVICE_USER" &>/dev/null; then
        read -p "Remove user $SERVICE_USER? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            userdel "$SERVICE_USER"
            log_info "User $SERVICE_USER removed"
        fi
    fi

    log_success "Uninstallation completed"
}

# Main installation function
install() {
    log_info "=== NSF Awards MCP Server Installation ==="
    log_info "Installation directory: $INSTALL_DIR"
    log_info "Service user: $SERVICE_USER"
    log_info "Log directory: $LOG_DIR"
    echo

    detect_system
    setup_user_and_dirs
    install_application
    install_systemd_service
    setup_logrotate

    if [[ "${START_SERVICE:-true}" == "true" ]]; then
        log_info "Starting service..."
        systemctl start "${SERVICE_NAME}.service"
        sleep 2

        if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
            log_success "Service is running"
        else
            log_error "Service failed to start"
            log_info "Check logs with: journalctl -u ${SERVICE_NAME}.service"
            exit 1
        fi
    fi

    log_success "Installation completed successfully!"
    echo
    log_info "Service commands:"
    log_info "  Start:   sudo systemctl start ${SERVICE_NAME}"
    log_info "  Stop:    sudo systemctl stop ${SERVICE_NAME}"
    log_info "  Status:  sudo systemctl status ${SERVICE_NAME}"
    log_info "  Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
    echo
    log_info "Configuration files:"
    log_info "  Service: /etc/systemd/system/${SERVICE_NAME}.service"
    log_info "  Application: $INSTALL_DIR"
    log_info "  Logs: $LOG_DIR"
}

# Parse command line arguments
parse_args() {
    local uninstall_flag=""
    START_SERVICE="true"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            --user)
                SERVICE_USER="$2"
                shift 2
                ;;
            --group)
                SERVICE_GROUP="$2"
                shift 2
                ;;
            --no-start)
                START_SERVICE="false"
                shift
                ;;
            --uninstall)
                uninstall_flag="true"
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

    if [[ "$uninstall_flag" == "true" ]]; then
        uninstall_service
        exit 0
    fi
}

# Main function
main() {
    parse_args "$@"
    check_root
    install
}

# Run main function
main "$@"