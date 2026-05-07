#!/bin/bash
# SSL/TLS setup script for NSF Awards MCP Server using Let's Encrypt

set -euo pipefail

# Configuration
DOMAIN="${DOMAIN:-nsf-awards-mcp.example.com}"
EMAIL="${EMAIL:-admin@example.com}"
NGINX_CONF_PATH="/etc/nginx/sites-available/nsf-awards-mcp"
CERTBOT_LOG="/var/log/letsencrypt/letsencrypt.log"

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
NSF Awards MCP Server - SSL/TLS Setup Script

USAGE:
    $(basename "$0") [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN    Domain name (default: nsf-awards-mcp.example.com)
    -e, --email EMAIL      Email for Let's Encrypt (default: admin@example.com)
    --staging             Use Let's Encrypt staging environment
    --self-signed         Generate self-signed certificate instead of Let's Encrypt
    --renew-only          Only renew existing certificate
    -h, --help            Show this help

EXAMPLES:
    # Setup SSL for production domain
    $(basename "$0") -d your-domain.com -e admin@your-domain.com

    # Generate self-signed certificate for testing
    $(basename "$0") --self-signed -d localhost

    # Use staging environment for testing
    $(basename "$0") --staging -d test.example.com

EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi

    # Check nginx
    if ! command -v nginx >/dev/null 2>&1; then
        log_error "nginx is not installed"
        log_info "Install nginx first: apt-get install nginx"
        exit 1
    fi

    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        log_warning "nginx is not running, starting it..."
        systemctl start nginx
    fi

    log_success "Prerequisites check completed"
}

# Install certbot if needed
install_certbot() {
    if ! command -v certbot >/dev/null 2>&1; then
        log_info "Installing certbot..."

        # Detect OS and install accordingly
        if [[ -f /etc/debian_version ]]; then
            # Debian/Ubuntu
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
        elif [[ -f /etc/redhat-release ]]; then
            # CentOS/RHEL
            yum install -y epel-release
            yum install -y certbot python3-certbot-nginx
        else
            log_error "Unsupported OS for automatic certbot installation"
            log_info "Please install certbot manually"
            exit 1
        fi

        log_success "certbot installed"
    else
        log_info "certbot is already installed"
    fi
}

# Setup nginx configuration
setup_nginx_config() {
    log_info "Setting up nginx configuration..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SOURCE_CONF="$SCRIPT_DIR/../nginx/nsf-awards-mcp.conf"

    if [[ ! -f "$SOURCE_CONF" ]]; then
        log_error "nginx configuration template not found: $SOURCE_CONF"
        exit 1
    fi

    # Copy and customize nginx configuration
    cp "$SOURCE_CONF" "$NGINX_CONF_PATH"

    # Update domain in configuration
    sed -i "s/nsf-awards-mcp.example.com/$DOMAIN/g" "$NGINX_CONF_PATH"

    # Create symlink to sites-enabled
    ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/nsf-awards-mcp"

    # Test nginx configuration
    if nginx -t; then
        log_success "nginx configuration is valid"
    else
        log_error "nginx configuration test failed"
        exit 1
    fi

    # Reload nginx
    systemctl reload nginx
    log_success "nginx configuration updated"
}

# Generate self-signed certificate
generate_self_signed() {
    log_info "Generating self-signed certificate for $DOMAIN..."

    SSL_DIR="/etc/ssl/private"
    CERT_DIR="/etc/ssl/certs"

    # Create directories
    mkdir -p "$SSL_DIR" "$CERT_DIR"

    # Generate private key
    openssl genrsa -out "$SSL_DIR/nsf-awards-mcp.key" 2048
    chmod 600 "$SSL_DIR/nsf-awards-mcp.key"

    # Generate certificate
    openssl req -new -x509 -key "$SSL_DIR/nsf-awards-mcp.key" \
        -out "$CERT_DIR/nsf-awards-mcp.crt" \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

    # Create chain file (self-signed doesn't have a chain)
    cp "$CERT_DIR/nsf-awards-mcp.crt" "$CERT_DIR/nsf-awards-mcp-chain.crt"

    log_success "Self-signed certificate generated"
    log_warning "Self-signed certificates should only be used for testing"
}

# Setup Let's Encrypt certificate
setup_letsencrypt() {
    log_info "Setting up Let's Encrypt certificate for $DOMAIN..."

    install_certbot

    # Prepare certbot arguments
    local certbot_args=(
        "--nginx"
        "--email" "$EMAIL"
        "--agree-tos"
        "--no-eff-email"
        "--domain" "$DOMAIN"
    )

    if [[ "${STAGING:-false}" == "true" ]]; then
        certbot_args+=("--staging")
        log_warning "Using Let's Encrypt staging environment"
    fi

    # Run certbot
    if certbot "${certbot_args[@]}"; then
        log_success "Let's Encrypt certificate obtained successfully"
    else
        log_error "Failed to obtain Let's Encrypt certificate"
        log_info "Check logs: $CERTBOT_LOG"
        exit 1
    fi

    # Setup automatic renewal
    setup_auto_renewal
}

# Setup automatic certificate renewal
setup_auto_renewal() {
    log_info "Setting up automatic certificate renewal..."

    # Create renewal script
    cat > "/usr/local/bin/renew-nsf-awards-ssl.sh" << 'EOF'
#!/bin/bash
# Automatic SSL certificate renewal for NSF Awards MCP

/usr/bin/certbot renew --quiet --no-self-upgrade --post-hook "systemctl reload nginx"

# Log renewal attempts
echo "$(date): SSL renewal check completed" >> /var/log/ssl-renewal.log
EOF

    chmod +x "/usr/local/bin/renew-nsf-awards-ssl.sh"

    # Create cron job for automatic renewal
    cat > "/etc/cron.d/nsf-awards-ssl-renewal" << EOF
# Automatic SSL certificate renewal for NSF Awards MCP
# Runs twice daily at random minutes to avoid rate limiting

$(shuf -i 0-59 -n 1) $(shuf -i 0-5,18-23 -n 1) * * * root /usr/local/bin/renew-nsf-awards-ssl.sh
EOF

    log_success "Automatic renewal configured"
}

# Renew existing certificate
renew_certificate() {
    log_info "Renewing existing certificate..."

    if [[ "${SELF_SIGNED:-false}" == "true" ]]; then
        log_warning "Cannot renew self-signed certificate automatically"
        log_info "Regenerating self-signed certificate..."
        generate_self_signed
    else
        if certbot renew --force-renewal; then
            systemctl reload nginx
            log_success "Certificate renewed successfully"
        else
            log_error "Failed to renew certificate"
            exit 1
        fi
    fi
}

# Verify SSL configuration
verify_ssl() {
    log_info "Verifying SSL configuration..."

    # Test nginx configuration
    if ! nginx -t; then
        log_error "nginx configuration test failed"
        exit 1
    fi

    # Test SSL certificate (if not self-signed)
    if [[ "${SELF_SIGNED:-false}" != "true" ]]; then
        log_info "Testing SSL certificate with openssl..."
        if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates; then
            log_success "SSL certificate is valid"
        else
            log_warning "Could not verify SSL certificate automatically"
        fi
    fi

    log_success "SSL verification completed"
}

# Parse command line arguments
parse_args() {
    STAGING="false"
    SELF_SIGNED="false"
    RENEW_ONLY="false"

    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            --staging)
                STAGING="true"
                shift
                ;;
            --self-signed)
                SELF_SIGNED="true"
                shift
                ;;
            --renew-only)
                RENEW_ONLY="true"
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

    # Validate email format (basic check)
    if [[ ! "$EMAIL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        log_error "Invalid email format: $EMAIL"
        exit 1
    fi
}

# Main function
main() {
    parse_args "$@"

    log_info "=== NSF Awards MCP SSL Setup ==="
    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"
    log_info "Self-signed: $SELF_SIGNED"
    log_info "Staging: $STAGING"
    echo

    check_prerequisites

    if [[ "$RENEW_ONLY" == "true" ]]; then
        renew_certificate
    else
        setup_nginx_config

        if [[ "$SELF_SIGNED" == "true" ]]; then
            generate_self_signed
        else
            setup_letsencrypt
        fi

        verify_ssl
    fi

    log_success "SSL setup completed successfully!"
    echo
    log_info "Your NSF Awards MCP server is now available at: https://$DOMAIN"
    log_info "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
    log_info "nginx configuration: $NGINX_CONF_PATH"
}

# Run main function
main "$@"