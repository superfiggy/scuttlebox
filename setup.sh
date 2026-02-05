#!/bin/bash
#
# Scuttlebox Setup Script
# Interactive setup for the Scuttlebox web interface
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

#------------------------------------------------------------------------------
# Helper functions
#------------------------------------------------------------------------------

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▸${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

confirm() {
    local prompt="$1"
    local default="${2:-y}"
    
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    read -rp "$prompt" answer
    answer=${answer:-$default}
    
    [[ "$answer" =~ ^[Yy]$ ]]
}

prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [[ -n "$default" ]]; then
        read -rp "$prompt [$default]: " input
        input=${input:-$default}
    else
        read -rp "$prompt: " input
    fi
    
    eval "$var_name='$input'"
}

check_command() {
    command -v "$1" &> /dev/null
}

#------------------------------------------------------------------------------
# Prerequisite checks
#------------------------------------------------------------------------------

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing=()
    
    # Check Node.js
    if check_command node; then
        local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [[ "$node_version" -ge 18 ]]; then
            print_success "Node.js $(node -v) installed"
        else
            print_error "Node.js 18+ required (found $(node -v))"
            missing+=("node")
        fi
    else
        print_error "Node.js not found"
        missing+=("node")
    fi
    
    # Check npm
    if check_command npm; then
        print_success "npm $(npm -v) installed"
    else
        print_error "npm not found"
        missing+=("npm")
    fi
    
    # Check Python
    if check_command python3; then
        local py_version=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
        local py_major=$(echo "$py_version" | cut -d. -f1)
        local py_minor=$(echo "$py_version" | cut -d. -f2)
        if [[ "$py_major" -ge 3 && "$py_minor" -ge 11 ]]; then
            print_success "Python $py_version installed"
        else
            print_error "Python 3.11+ required (found $py_version)"
            missing+=("python")
        fi
    else
        print_error "Python 3 not found"
        missing+=("python")
    fi
    
    # Check OpenClaw
    if check_command openclaw; then
        local oc_version=$(openclaw --version 2>/dev/null | head -1 || echo "unknown")
        print_success "OpenClaw installed ($oc_version)"
    else
        print_error "OpenClaw not found"
        missing+=("openclaw")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo ""
        print_error "Missing prerequisites: ${missing[*]}"
        echo ""
        echo "Install instructions:"
        [[ " ${missing[*]} " =~ " node " ]] && echo "  • Node.js: https://nodejs.org/ or 'brew install node'"
        [[ " ${missing[*]} " =~ " python " ]] && echo "  • Python: https://python.org/ or 'brew install python@3.11'"
        [[ " ${missing[*]} " =~ " openclaw " ]] && echo "  • OpenClaw: npm install -g openclaw"
        echo ""
        exit 1
    fi
    
    echo ""
    print_success "All prerequisites met!"
}

#------------------------------------------------------------------------------
# OpenClaw Gateway checks
#------------------------------------------------------------------------------

check_gateway() {
    print_header "Checking OpenClaw Gateway"
    
    # Check if gateway is running
    print_step "Checking if gateway is running..."
    
    if openclaw gateway status &>/dev/null; then
        print_success "Gateway is running"
        return 0
    else
        print_warning "Gateway is not running"
        echo ""
        
        if confirm "Would you like to start the gateway now?"; then
            print_step "Starting gateway..."
            openclaw gateway start
            sleep 2
            
            if openclaw gateway status &>/dev/null; then
                print_success "Gateway started successfully"
            else
                print_error "Failed to start gateway"
                echo ""
                echo "Try starting manually with: openclaw gateway start"
                echo "Or run in foreground: openclaw gateway run"
                exit 1
            fi
        else
            print_warning "Gateway must be running for Scuttlebox to work"
            echo "Start it later with: openclaw gateway start"
        fi
    fi
}

#------------------------------------------------------------------------------
# Configure OpenClaw Gateway
#------------------------------------------------------------------------------

configure_gateway() {
    print_header "Configuring OpenClaw Gateway"
    
    print_info "Scuttlebox requires the following gateway settings:"
    echo ""
    echo "  1. ${BOLD}Chat Completions API${NC} - For sending commands to the agent"
    echo "     Config: gateway.http.endpoints.chatCompletions.enabled: true"
    echo ""
    echo "  2. ${BOLD}Gateway Auth Token${NC} - For API authentication"
    echo "     Config: gateway.auth.token (or OPENCLAW_GATEWAY_TOKEN env)"
    echo ""
    
    # Get current config
    print_step "Checking current gateway configuration..."
    
    local config_file="$HOME/.openclaw/openclaw.json"
    local needs_update=false
    local current_token=""
    
    if [[ -f "$config_file" ]]; then
        # Check if chatCompletions is enabled
        if grep -q '"chatCompletions"' "$config_file" && grep -q '"enabled": true' "$config_file"; then
            print_success "Chat Completions API is enabled"
        else
            print_warning "Chat Completions API is NOT enabled"
            needs_update=true
        fi
        
        # Try to get current token
        current_token=$(grep -oP '"token":\s*"\K[^"]+' "$config_file" 2>/dev/null | head -1 || echo "")
        if [[ -n "$current_token" ]]; then
            print_success "Gateway token is configured"
        fi
    else
        print_warning "No config file found at $config_file"
        needs_update=true
    fi
    
    # Check env var
    if [[ -n "$OPENCLAW_GATEWAY_TOKEN" ]]; then
        print_success "OPENCLAW_GATEWAY_TOKEN env var is set"
        current_token="$OPENCLAW_GATEWAY_TOKEN"
    fi
    
    echo ""
    
    if [[ "$needs_update" == true ]]; then
        echo -e "${YELLOW}Gateway configuration needs to be updated.${NC}"
        echo ""
        echo "You have two options:"
        echo ""
        echo "  ${BOLD}Option 1:${NC} Let this script update your config (recommended)"
        echo "  ${BOLD}Option 2:${NC} Update manually and re-run this script"
        echo ""
        
        if confirm "Would you like this script to update your gateway config?"; then
            update_gateway_config
        else
            echo ""
            echo "To update manually, add this to ~/.openclaw/openclaw.json:"
            echo ""
            echo -e "${CYAN}{"
            echo '  "gateway": {'
            echo '    "http": {'
            echo '      "endpoints": {'
            echo '        "chatCompletions": { "enabled": true }'
            echo '      }'
            echo '    },'
            echo '    "auth": {'
            echo '      "token": "your-secure-token-here"'
            echo '    }'
            echo '  }'
            echo -e "}${NC}"
            echo ""
            print_info "After updating, restart the gateway: openclaw gateway restart"
            exit 0
        fi
    fi
    
    # Store token for .env file
    GATEWAY_TOKEN="$current_token"
}

update_gateway_config() {
    print_step "Updating gateway configuration..."
    
    local config_file="$HOME/.openclaw/openclaw.json"
    
    # Generate a token if needed
    if [[ -z "$GATEWAY_TOKEN" ]]; then
        print_step "Generating new gateway token..."
        GATEWAY_TOKEN=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | xxd -p)
        print_success "Token generated"
    fi
    
    # Use openclaw config set if available, otherwise patch manually
    if openclaw config set gateway.http.endpoints.chatCompletions.enabled true 2>/dev/null; then
        print_success "Enabled Chat Completions API"
    else
        print_warning "Could not use 'openclaw config set' - manual update may be needed"
    fi
    
    if [[ -z "$(grep -oP '"token":\s*"\K[^"]+' "$config_file" 2>/dev/null | head -1)" ]]; then
        if openclaw config set gateway.auth.token "$GATEWAY_TOKEN" 2>/dev/null; then
            print_success "Set gateway auth token"
        else
            print_warning "Could not set token via CLI - add to config manually"
        fi
    fi
    
    # Restart gateway to apply changes
    print_step "Restarting gateway to apply changes..."
    if openclaw gateway restart 2>/dev/null; then
        sleep 2
        print_success "Gateway restarted"
    else
        print_warning "Could not restart gateway automatically"
        echo "Please restart manually: openclaw gateway restart"
    fi
}

#------------------------------------------------------------------------------
# Create .env file
#------------------------------------------------------------------------------

create_env_file() {
    print_header "Configuring Environment"
    
    local env_file="$SCRIPT_DIR/.env"
    local env_example="$SCRIPT_DIR/.env.example"
    
    if [[ -f "$env_file" ]]; then
        print_info "Found existing .env file"
        echo ""
        if confirm "Would you like to reconfigure .env?" "n"; then
            mv "$env_file" "$env_file.backup"
            print_info "Backed up to .env.backup"
        else
            print_success "Keeping existing .env"
            return 0
        fi
    fi
    
    echo ""
    print_step "Setting up environment variables..."
    echo ""
    
    # Gateway URL
    local default_url="http://localhost:18789"
    prompt_input "Gateway URL" "$default_url" GATEWAY_URL
    
    # Gateway Token
    if [[ -n "$GATEWAY_TOKEN" ]]; then
        local masked_token="${GATEWAY_TOKEN:0:8}...${GATEWAY_TOKEN: -4}"
        print_info "Using token from gateway config: $masked_token"
    else
        prompt_input "Gateway Token" "" GATEWAY_TOKEN
    fi
    
    # Workspace path
    local default_workspace="$HOME/.openclaw/workspace"
    prompt_input "OpenClaw workspace path" "$default_workspace" WORKSPACE_PATH
    
    # CORS origins
    local default_cors="http://localhost:5173,http://127.0.0.1:5173"
    prompt_input "CORS origins (comma-separated)" "$default_cors" CORS_ORIGINS
    
    echo ""
    print_step "Writing .env file..."
    
    cat > "$env_file" << EOF
# OpenClaw Gateway configuration
OPENCLAW_GATEWAY_URL=$GATEWAY_URL
OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN
OPENCLAW_WORKSPACE=$WORKSPACE_PATH

# CORS (comma-separated origins)
CORS_ORIGINS=$CORS_ORIGINS
EOF
    
    print_success "Created .env file"
    
    # Show summary
    echo ""
    echo "Configuration saved:"
    echo "  • Gateway URL: $GATEWAY_URL"
    echo "  • Gateway Token: ${GATEWAY_TOKEN:0:8}..."
    echo "  • Workspace: $WORKSPACE_PATH"
    echo "  • CORS Origins: $CORS_ORIGINS"
}

#------------------------------------------------------------------------------
# Install dependencies
#------------------------------------------------------------------------------

install_dependencies() {
    print_header "Installing Dependencies"
    
    # Backend
    print_step "Setting up Python backend..."
    cd "$SCRIPT_DIR/backend"
    
    if [[ ! -d "venv" ]]; then
        print_step "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    print_step "Installing Python dependencies..."
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    print_success "Backend dependencies installed"
    
    # Frontend
    print_step "Installing frontend dependencies..."
    cd "$SCRIPT_DIR/frontend"
    
    if [[ ! -d "node_modules" ]]; then
        npm install --silent
    else
        print_info "node_modules exists, running npm install to update..."
        npm install --silent
    fi
    print_success "Frontend dependencies installed"
    
    cd "$SCRIPT_DIR"
}

#------------------------------------------------------------------------------
# Verify setup
#------------------------------------------------------------------------------

verify_setup() {
    print_header "Verifying Setup"
    
    local all_good=true
    
    # Check .env
    if [[ -f "$SCRIPT_DIR/.env" ]]; then
        print_success ".env file exists"
    else
        print_error ".env file missing"
        all_good=false
    fi
    
    # Check backend venv
    if [[ -d "$SCRIPT_DIR/backend/venv" ]]; then
        print_success "Python virtual environment exists"
    else
        print_error "Python virtual environment missing"
        all_good=false
    fi
    
    # Check frontend node_modules
    if [[ -d "$SCRIPT_DIR/frontend/node_modules" ]]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Frontend dependencies missing"
        all_good=false
    fi
    
    # Test gateway connection
    print_step "Testing gateway connection..."
    
    source "$SCRIPT_DIR/.env" 2>/dev/null || true
    
    if curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
        "$OPENCLAW_GATEWAY_URL/health" 2>/dev/null | grep -q "200\|401"; then
        print_success "Gateway is reachable"
    else
        print_warning "Could not reach gateway (may not be running)"
    fi
    
    echo ""
    
    if [[ "$all_good" == true ]]; then
        print_success "Setup verified successfully!"
    else
        print_error "Some checks failed - please review above"
    fi
}

#------------------------------------------------------------------------------
# Print completion message
#------------------------------------------------------------------------------

print_completion() {
    print_header "Setup Complete! 🎱"
    
    echo "Scuttlebox is ready to use!"
    echo ""
    echo -e "${BOLD}To start the development servers:${NC}"
    echo ""
    echo "  ./start-dev.sh"
    echo ""
    echo -e "${BOLD}Or start them separately:${NC}"
    echo ""
    echo "  # Backend (in one terminal)"
    echo "  cd backend && source venv/bin/activate"
    echo "  uvicorn app.main:app --reload --port 8000"
    echo ""
    echo "  # Frontend (in another terminal)"
    echo "  cd frontend && npm run dev"
    echo ""
    echo -e "${BOLD}Access the portal:${NC}"
    echo ""
    echo "  http://localhost:5173"
    echo ""
    echo -e "${BOLD}Important:${NC}"
    echo ""
    echo "  • Make sure the OpenClaw gateway is running: ${CYAN}openclaw gateway status${NC}"
    echo "  • Start it if needed: ${CYAN}openclaw gateway start${NC}"
    echo ""
    echo "For more info, see README.md"
    echo ""
}

#------------------------------------------------------------------------------
# Quick setup (non-interactive)
#------------------------------------------------------------------------------

quick_setup() {
    print_header "Quick Setup Mode"
    
    # Use defaults
    GATEWAY_URL="http://localhost:18789"
    GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"
    WORKSPACE_PATH="$HOME/.openclaw/workspace"
    CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
    
    # Try to get token from config
    local config_file="$HOME/.openclaw/openclaw.json"
    if [[ -z "$GATEWAY_TOKEN" && -f "$config_file" ]]; then
        GATEWAY_TOKEN=$(grep -oP '"token":\s*"\K[^"]+' "$config_file" 2>/dev/null | head -1 || echo "")
    fi
    
    # Generate token if still missing
    if [[ -z "$GATEWAY_TOKEN" ]]; then
        GATEWAY_TOKEN=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | xxd -p)
        print_warning "Generated new gateway token (update your openclaw config)"
    fi
    
    # Write .env
    cat > "$SCRIPT_DIR/.env" << EOF
# OpenClaw Gateway configuration
OPENCLAW_GATEWAY_URL=$GATEWAY_URL
OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN
OPENCLAW_WORKSPACE=$WORKSPACE_PATH

# CORS (comma-separated origins)
CORS_ORIGINS=$CORS_ORIGINS
EOF
    
    print_success "Created .env with defaults"
    
    # Install deps
    install_dependencies
    
    print_completion
}

#------------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------------

main() {
    echo ""
    echo -e "${BOLD}${CYAN}"
    echo "  ╔═══════════════════════════════════════════════════════════════╗"
    echo "  ║                                                               ║"
    echo "  ║   🎱  Scuttlebox Setup                                      ║"
    echo "  ║                                                               ║"
    echo "  ║   Web interface for your OpenClaw agent                       ║"
    echo "  ║                                                               ║"
    echo "  ╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Parse args
    local quick=false
    local skip_gateway=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --quick|-q)
                quick=true
                shift
                ;;
            --skip-gateway)
                skip_gateway=true
                shift
                ;;
            --help|-h)
                echo "Usage: ./setup.sh [options]"
                echo ""
                echo "Options:"
                echo "  --quick, -q      Quick setup with defaults (non-interactive)"
                echo "  --skip-gateway   Skip gateway checks and configuration"
                echo "  --help, -h       Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    if [[ "$quick" == true ]]; then
        check_prerequisites
        quick_setup
        exit 0
    fi
    
    # Interactive setup
    check_prerequisites
    
    if [[ "$skip_gateway" != true ]]; then
        check_gateway
        configure_gateway
    fi
    
    create_env_file
    install_dependencies
    verify_setup
    print_completion
}

# Run main
main "$@"
