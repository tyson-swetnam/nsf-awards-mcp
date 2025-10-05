# Installation Guide

Complete installation guide for the NSF Awards MCP Server on all platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Quick Install](#quick-install)
- [Installation from Source](#installation-from-source)
- [Installation from NPM](#installation-from-npm)
- [Docker Installation](#docker-installation)
- [Platform-Specific Installation](#platform-specific-installation)
- [Verification](#verification)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing, ensure you have:

### Required

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)

### Optional

- **Git**: For installing from source
- **Docker**: For Docker-based installation

### Check Your System

Run these commands to verify:

```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
```

If you don't have Node.js installed, see [Platform-Specific Installation](#platform-specific-installation) for detailed instructions.

## Installation Methods

Choose the method that works best for you:

| Method | Best For | Difficulty | Updates |
|--------|----------|------------|---------|
| [From Source](#installation-from-source) | All users (required currently) | Moderate | Manual |
| [Docker](#docker-installation) | Isolated environments | Easy | Pull new image |

**Note:** NPM package is not yet published. Installation from source is currently the only supported method.

## Quick Install

```bash
# Clone and setup
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp
npm install
npm run build

# Verify
npm start
# Press Ctrl+C to stop
```

**Note:** See [Installation from Source](#installation-from-source) below for detailed step-by-step instructions.

## Installation from Source

**Currently the only supported installation method.** Follow these steps to install from source.

### Step 1: Install Git (if not installed)

**macOS:**
```bash
# Using Homebrew
brew install git

# Or download from: https://git-scm.com/download/mac
```

**Windows:**
- Download from: https://git-scm.com/download/win
- Run installer with default settings

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install git
```

### Step 2: Clone the Repository

Choose a directory where you want to install:

```bash
# Navigate to your preferred location
cd ~/projects  # macOS/Linux
cd C:\Users\YourUsername\Documents  # Windows

# Clone the repository
git clone https://github.com/yourusername/nsf-awards-mcp.git

# Enter the directory
cd nsf-awards-mcp
```

### Step 3: Install Dependencies

```bash
npm install
```

This will:
- Download all required packages
- Install development dependencies
- Set up the project structure

**Expected output:**
```
added 150 packages, and audited 151 packages in 15s
found 0 vulnerabilities
```

### Step 4: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

**Expected output:**
```
> nsf-awards-mcp@1.0.0 build
> tsc
```

### Step 5: Verify Installation

```bash
npm start
```

You should see:
```
NSF Awards MCP Server running on stdio
```

Press `Ctrl+C` to stop. Installation complete!

### Step 6: Note the Installation Path

You'll need this path for configuration:

**macOS/Linux:**
```bash
pwd
# Example output: /Users/yourusername/projects/nsf-awards-mcp
```

**Windows (PowerShell):**
```powershell
Get-Location
# Example output: C:\Users\YourUsername\Documents\nsf-awards-mcp
```

**Full path to use in configuration:**
- macOS: `/Users/yourusername/projects/nsf-awards-mcp/build/index.js`
- Windows: `C:/Users/YourUsername/Documents/nsf-awards-mcp/build/index.js`
- Linux: `/home/yourusername/projects/nsf-awards-mcp/build/index.js`


## Docker Installation

Run the MCP server in a Docker container for isolation and easy deployment.

### Prerequisites

Install Docker:
- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### Step 1: Create Dockerfile

**Note:** Dockerfile is not yet included. This is the recommended setup:

Create `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "build/index.js"]
```

### Step 2: Build Docker Image

```bash
# From the project directory
docker build -t nsf-awards-mcp .

# Verify image
docker images | grep nsf-awards-mcp
```

### Step 3: Run Container

```bash
# Run interactively
docker run -it --rm nsf-awards-mcp

# Run in background
docker run -d --name nsf-awards-server nsf-awards-mcp
```

### Step 4: Configure MCP Client

Docker containers can't use stdio directly. Use a wrapper script:

**`run-docker-mcp.sh` (macOS/Linux):**
```bash
#!/bin/bash
docker run -i --rm nsf-awards-mcp
```

Make it executable:
```bash
chmod +x run-docker-mcp.sh
```

**Configure in MCP client:**
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "/path/to/run-docker-mcp.sh"
    }
  }
}
```

## Platform-Specific Installation

### macOS

#### Install Node.js

**Method 1: Official Installer (Recommended for beginners)**

1. Visit https://nodejs.org/
2. Download the LTS version installer (.pkg file)
3. Run installer and follow prompts
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Method 2: Homebrew (Recommended for developers)**

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version
npm --version
```

**Method 3: nvm (Best for multiple Node versions)**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.zshrc  # or ~/.bash_profile

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node --version
```

#### Complete Installation

```bash
# Choose installation location
cd ~/projects

# Clone repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install and build
npm install
npm run build

# Test
npm start
```

#### Configuration Path

Use in MCP clients:
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/Users/yourusername/projects/nsf-awards-mcp/build/index.js"]
    }
  }
}
```

### Windows

#### Install Node.js

**Method 1: Official Installer (Recommended)**

1. Visit https://nodejs.org/
2. Download Windows Installer (.msi) for LTS version
3. Run installer
   - Check "Add to PATH"
   - Install default components
4. Restart terminal/PowerShell
5. Verify:
   ```powershell
   node --version
   npm --version
   ```

**Method 2: Chocolatey**

```powershell
# Install Chocolatey (run PowerShell as Admin)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs-lts

# Verify
node --version
```

**Method 3: nvm-windows**

1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Run installer
3. Open new PowerShell:
   ```powershell
   nvm install lts
   nvm use lts
   node --version
   ```

#### Install Git

1. Download from: https://git-scm.com/download/win
2. Run installer with default settings

#### Complete Installation

**PowerShell:**
```powershell
# Navigate to desired location
cd C:\Users\YourUsername\Documents

# Clone repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install and build
npm install
npm run build

# Test
npm start
```

#### Configuration Path

**Important:** Use forward slashes in JSON files!

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["C:/Users/YourUsername/Documents/nsf-awards-mcp/build/index.js"]
    }
  }
}
```

### Linux

#### Ubuntu/Debian

```bash
# Update system
sudo apt update

# Method 1: NodeSource repository (Recommended)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Method 2: Default repository (may be older version)
sudo apt install nodejs npm

# Install Git
sudo apt install git

# Verify
node --version
npm --version
git --version
```

#### Fedora/RHEL/CentOS

```bash
# Install Node.js
sudo dnf install nodejs npm

# Or use NodeSource
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs

# Install Git
sudo dnf install git

# Verify
node --version
npm --version
```

#### Arch Linux

```bash
# Install Node.js and Git
sudo pacman -S nodejs npm git

# Verify
node --version
npm --version
```

#### Complete Installation

```bash
# Navigate to desired location
cd ~/projects

# Clone repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install and build
npm install
npm run build

# Test
npm start
```

#### Fix npm Permissions (if needed)

If you get permission errors with npm:

```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### Configuration Path

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/home/yourusername/projects/nsf-awards-mcp/build/index.js"]
    }
  }
}
```

## Verification

### 1. Check Build Directory

Verify files were built:

**macOS/Linux:**
```bash
ls -la build/
```

**Windows:**
```powershell
dir build\
```

You should see:
- `index.js`
- `index.d.ts`
- Various directories (client, tools, types, utils)

### 2. Test Server Startup

```bash
npm start
```

Expected output:
```
NSF Awards MCP Server running on stdio
```

The server is running correctly. Press `Ctrl+C` to stop.

### 3. Verify Node.js Can Find Dependencies

```bash
node -e "require('@modelcontextprotocol/sdk')"
```

No output means success. Error means dependencies not installed.

### 4. Check Version

```bash
npm run --silent version
# Or
node -p "require('./package.json').version"
```

### 5. Run Tests (Optional)

```bash
npm test
```

All tests should pass.

## Updating

### From Source Installation

```bash
# Navigate to installation directory
cd /path/to/nsf-awards-mcp

# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Test
npm start
```

### Docker Installation

```bash
# Pull latest image
docker pull nsf-awards-mcp:latest

# Or rebuild
docker build -t nsf-awards-mcp .
```

## Uninstalling

### Source Installation

```bash
# Simply delete the directory
rm -rf /path/to/nsf-awards-mcp
```

### Docker Installation

```bash
# Remove container
docker rm -f nsf-awards-server

# Remove image
docker rmi nsf-awards-mcp
```

### Remove Configuration

**Claude Desktop:**

**macOS:**
```bash
# Edit config to remove nsf-awards entry
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

**Linux:**
```bash
nano ~/.config/claude/claude_desktop_config.json
```

Remove the `"nsf-awards"` entry from `"mcpServers"`.

## Troubleshooting

### Installation Issues

#### "npm command not found"

**Solution:** Node.js/npm not installed or not in PATH.

```bash
# Verify installation
which node  # macOS/Linux
where node  # Windows

# Add to PATH if installed but not found
export PATH=$PATH:/usr/local/bin  # macOS/Linux
```

#### "Permission denied" during npm install

**macOS/Linux:**
```bash
# Don't use sudo! Fix npm permissions instead
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Try install again
npm install
```

**Windows:**
- Run PowerShell/Command Prompt as Administrator
- Or install Node.js for current user only

#### "EACCES: permission denied" on macOS

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### "gyp ERR!" during installation

**Solution:** Missing build tools.

**macOS:**
```bash
xcode-select --install
```

**Windows:**
```powershell
# Install Windows Build Tools
npm install --global windows-build-tools
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install build-essential

# Fedora/RHEL
sudo dnf groupinstall "Development Tools"
```

### Build Issues

#### TypeScript compilation errors

```bash
# Clean and rebuild
rm -rf build/ node_modules/
npm install
npm run build
```

#### "Cannot find module" errors

```bash
# Reinstall dependencies
rm -rf node_modules/ package-lock.json
npm install
npm run build
```

### Runtime Issues

#### "node: command not found" in configuration

**Solution:** Use full path to node:

**macOS/Linux:**
```bash
which node
# Use output (e.g., /usr/local/bin/node) in config
```

**Windows:**
```powershell
where.exe node
# Use output (e.g., C:/Program Files/nodejs/node.exe)
```

#### Path Issues in Configuration

**Common mistakes:**
- Using backslashes on Windows in JSON (use forward slashes!)
- Using relative paths (use absolute paths!)
- Including quotes inside the path string

**Correct:**
```json
"args": ["C:/Users/Name/nsf-awards-mcp/build/index.js"]
```

**Incorrect:**
```json
"args": ["C:\\Users\\Name\\nsf-awards-mcp\\build\\index.js"]
"args": ["./build/index.js"]
"args": ["\"C:/Users/Name/nsf-awards-mcp/build/index.js\""]
```

### Getting Help

If you're still having issues:

1. **Check existing issues:** https://github.com/yourusername/nsf-awards-mcp/issues
2. **Create a new issue** with:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Complete error message
   - Steps you've already tried

## Next Steps

After successful installation:

1. **Configure your MCP client** - See [USAGE.md](USAGE.md)
2. **Test the tools** - Try searching for NSF awards
3. **Read the documentation** - Check [README.md](README.md) for features
4. **For developers** - See [DEVELOPMENT.md](DEVELOPMENT.md)

## System Requirements

### Minimum Requirements

- **OS**: macOS 10.15+, Windows 10+, or modern Linux
- **Node.js**: 18.x or higher
- **RAM**: 512 MB
- **Disk**: 200 MB for installation
- **Network**: Internet connection for NSF API access

### Recommended Requirements

- **OS**: Latest macOS, Windows 11, or Ubuntu 22.04+
- **Node.js**: Latest LTS (20.x)
- **RAM**: 1 GB
- **Disk**: 500 MB (including dependencies)
- **Network**: Broadband connection

## Additional Resources

- [User Guide](USAGE.md) - How to use with MCP clients
- [Developer Guide](DEVELOPMENT.md) - Contributing and development
- [README](README.md) - Project overview and features
- [NSF Award API](https://www.research.gov/common/webapi/awardapisearch-v1.htm) - API documentation
- [MCP Specification](https://modelcontextprotocol.io/) - Model Context Protocol
