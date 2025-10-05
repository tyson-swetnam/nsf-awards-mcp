# User Guide: Integrating NSF Awards MCP Server

Complete guide for users who want to use the NSF Awards MCP Server with various MCP clients.

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Supported MCP Clients](#supported-mcp-clients)
- [Configuration by Client](#configuration-by-client)
  - [Claude Desktop](#claude-desktop)
  - [Cline (VS Code Extension)](#cline-vs-code-extension)
  - [Chatbox](#chatbox)
  - [Cursor](#cursor)
  - [Other MCP Clients](#other-mcp-clients)
- [Using the Tools](#using-the-tools)
- [Troubleshooting](#troubleshooting)
- [Platform-Specific Notes](#platform-specific-notes)

## Introduction

The NSF Awards MCP Server provides AI assistants with access to the U.S. National Science Foundation's award database. Once configured, your AI assistant can search for grants, retrieve award details, and analyze research funding data.

### What You'll Need

- An MCP-compatible client (Claude Desktop, Cline, etc.)
- The NSF Awards MCP Server installed (see [INSTALL.md](INSTALL.md))
- Basic text editor to modify configuration files

## Quick Start

**For Claude Desktop users (most common):**

1. Install the NSF Awards MCP Server (see [INSTALL.md](INSTALL.md))
2. Find your configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`
3. Add the server configuration (see [Claude Desktop](#claude-desktop) section)
4. Restart Claude Desktop
5. Start asking questions about NSF awards!

## Supported MCP Clients

The NSF Awards MCP Server works with any MCP-compatible client. Tested and verified with:

| Client | Platform | Status | Notes |
|--------|----------|--------|-------|
| Claude Desktop | macOS, Windows | ✅ Fully Supported | Official Anthropic client |
| Claude Desktop | Linux | ✅ Fully Supported | Community builds available |
| Cline | VS Code (All platforms) | ✅ Fully Supported | Popular VS Code extension |
| Chatbox | macOS, Windows, Linux | ✅ Fully Supported | Open-source MCP client |
| Cursor | macOS, Windows, Linux | ✅ Fully Supported | AI-first code editor |
| Continue | VS Code (All platforms) | ⚠️ Experimental | May require additional setup |
| Zed | macOS, Linux | ⚠️ Experimental | MCP support in development |

## Configuration by Client

### Claude Desktop

Claude Desktop is the official Anthropic client with full MCP support.

#### Configuration File Location

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```
Full path: `C:\Users\YourUsername\AppData\Roaming\Claude\claude_desktop_config.json`

**Linux:**
```
~/.config/claude/claude_desktop_config.json
```

#### Configuration Format

Create or edit the configuration file with this content:

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/absolute/path/to/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/absolute/path/to/nsf-awards-mcp/` with the actual installation path
- Use forward slashes (`/`) even on Windows in JSON files
- The path must be absolute, not relative
- Ensure the `build/index.js` file exists (run `npm run build` if needed)

#### Platform-Specific Examples

**macOS Example:**
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/Users/yourusername/projects/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "C:/Users/YourUsername/Documents/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Linux Example:**
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/home/yourusername/projects/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Step-by-Step Setup

1. **Locate or create the config file:**

   **macOS/Linux:**
   ```bash
   # Create directory if it doesn't exist
   mkdir -p ~/Library/Application\ Support/Claude  # macOS
   mkdir -p ~/.config/claude  # Linux

   # Create or edit the config file
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
   nano ~/.config/claude/claude_desktop_config.json  # Linux
   ```

   **Windows (PowerShell):**
   ```powershell
   # Create directory if it doesn't exist
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"

   # Edit the config file
   notepad "$env:APPDATA\Claude\claude_desktop_config.json"
   ```

2. **Add the configuration** (see examples above)

3. **Verify the path** exists:

   **macOS/Linux:**
   ```bash
   ls /absolute/path/to/nsf-awards-mcp/build/index.js
   ```

   **Windows:**
   ```powershell
   Test-Path "C:\path\to\nsf-awards-mcp\build\index.js"
   ```

4. **Restart Claude Desktop** completely (quit and reopen)

5. **Verify the server is loaded:**
   - Open Claude Desktop
   - Look for the hammer icon (🔨) in the bottom right
   - You should see "nsf-awards" listed with 5 tools

### Cline (VS Code Extension)

Cline is a popular VS Code extension with MCP support.

#### Configuration Location

Cline uses VS Code's settings system. Configuration is in:
- VS Code Settings UI: Search for "Cline MCP"
- Settings JSON: `.vscode/settings.json` or user settings

#### Configuration Format

Add to your VS Code settings JSON:

```json
{
  "cline.mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/absolute/path/to/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Step-by-Step Setup

1. **Install Cline extension** from VS Code Marketplace

2. **Open VS Code Settings:**
   - Press `Cmd/Ctrl + ,`
   - Click the file icon (top right) to open JSON settings

3. **Add MCP server configuration** (see format above)

4. **Reload VS Code:**
   - Press `Cmd/Ctrl + Shift + P`
   - Type "Developer: Reload Window"
   - Press Enter

5. **Open Cline:**
   - Click the Cline icon in the sidebar
   - The NSF Awards tools should be available

### Chatbox

Chatbox is an open-source MCP-compatible desktop application.

#### Configuration Location

**macOS:**
```
~/Library/Application Support/Chatbox/mcp_config.json
```

**Windows:**
```
%APPDATA%\Chatbox\mcp_config.json
```

**Linux:**
```
~/.config/Chatbox/mcp_config.json
```

#### Configuration Format

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/absolute/path/to/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Step-by-Step Setup

1. **Close Chatbox** if it's running

2. **Create or edit config file:**

   **macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Chatbox
   nano ~/Library/Application\ Support/Chatbox/mcp_config.json
   ```

   **Windows:**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\Chatbox"
   notepad "$env:APPDATA\Chatbox\mcp_config.json"
   ```

   **Linux:**
   ```bash
   mkdir -p ~/.config/Chatbox
   nano ~/.config/Chatbox/mcp_config.json
   ```

3. **Add configuration** (see format above)

4. **Restart Chatbox**

5. **Verify in settings:**
   - Open Chatbox settings
   - Look for MCP servers section
   - NSF Awards should be listed

### Cursor

Cursor is an AI-first code editor with MCP support.

#### Configuration Location

Cursor uses project-level or user-level configuration:

**Project-level:** `.cursor/mcp.json` in your project root

**User-level:**
- **macOS**: `~/Library/Application Support/Cursor/User/mcp.json`
- **Windows**: `%APPDATA%\Cursor\User\mcp.json`
- **Linux**: `~/.config/Cursor/User/mcp.json`

#### Configuration Format

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": [
        "/absolute/path/to/nsf-awards-mcp/build/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Step-by-Step Setup

**For project-level configuration:**

1. **Create `.cursor` directory** in your project:
   ```bash
   mkdir .cursor
   ```

2. **Create `mcp.json`:**
   ```bash
   nano .cursor/mcp.json
   ```

3. **Add configuration** (see format above)

4. **Reload Cursor window**

**For user-level configuration:**

1. **Create config directory:**

   **macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Cursor/User
   ```

   **Windows:**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\Cursor\User"
   ```

   **Linux:**
   ```bash
   mkdir -p ~/.config/Cursor/User
   ```

2. **Create `mcp.json`** and add configuration

3. **Restart Cursor**

### Other MCP Clients

For other MCP-compatible clients, the general pattern is:

1. **Find the MCP configuration location** (check client documentation)
2. **Use this standard configuration format:**
   ```json
   {
     "mcpServers": {
       "nsf-awards": {
         "command": "node",
         "args": ["/path/to/nsf-awards-mcp/build/index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```
3. **Restart the client**
4. **Verify the tools are available**

## Using the Tools

Once configured, you can use these tools through natural language with your AI assistant.

### Available Tools

1. **search_nsf_awards** - Search for NSF awards
2. **get_award_details** - Get detailed information about a specific award
3. **get_project_outcomes** - Retrieve project outcomes and publications
4. **search_by_institution** - Find awards for a specific institution
5. **search_by_pi** - Search awards by Principal Investigator

### Example Queries

Try asking your AI assistant:

**Basic Search:**
```
Find recent NSF awards related to machine learning
```

**Institution Search:**
```
Show me NSF awards for Stanford University from 2024
```

**PI Search:**
```
Find awards where Jane Smith is the principal investigator
```

**Award Details:**
```
Get details for NSF award 2012345
```

**Project Outcomes:**
```
What are the outcomes of award 2012345?
```

**Complex Queries:**
```
Find all NSF awards for climate research in California
with funding over $500,000 since 2023
```

### Understanding Tool Responses

The tools return structured data including:

- **Award ID**: Unique identifier (e.g., "2012345")
- **Title**: Project title
- **Abstract**: Project description (optional)
- **PI Information**: Principal Investigator name and email
- **Institution**: Organization name and location
- **Funding**: Award amount and dates
- **Program**: NSF program and directorate
- **Status**: Active, completed, or other status

### Tips for Better Results

1. **Be specific with dates:** Use "since 2024" or "between 2020 and 2023"
2. **Include funding ranges:** "over $1 million" or "between $100k and $500k"
3. **Specify institutions fully:** "Massachusetts Institute of Technology" not just "MIT"
4. **Use full names for PIs** when possible
5. **Combine multiple criteria** for targeted searches

## Troubleshooting

### Tools Not Appearing

**Problem:** NSF Awards tools don't show up in the client.

**Solutions:**

1. **Verify configuration file exists:**
   ```bash
   # macOS (Claude Desktop)
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Windows (Claude Desktop)
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Check JSON syntax:**
   - Use a JSON validator: https://jsonlint.com/
   - Ensure no trailing commas
   - Check all quotes are straight quotes (`"` not `"` or `"`)

3. **Verify path is correct:**
   ```bash
   # Test the path exists
   node /absolute/path/to/nsf-awards-mcp/build/index.js
   ```

   Should start the server without errors (press Ctrl+C to exit)

4. **Check Node.js is in PATH:**
   ```bash
   which node  # macOS/Linux
   where node  # Windows
   ```

5. **Completely restart the client** (quit, don't just reload)

### Server Fails to Start

**Problem:** Server starts but immediately crashes or shows errors.

**Solutions:**

1. **Check build exists:**
   ```bash
   ls /path/to/nsf-awards-mcp/build/index.js
   ```

   If missing, run:
   ```bash
   cd /path/to/nsf-awards-mcp
   npm run build
   ```

2. **Check dependencies installed:**
   ```bash
   cd /path/to/nsf-awards-mcp
   npm install
   ```

3. **Enable debug logging:**
   ```json
   {
     "mcpServers": {
       "nsf-awards": {
         "command": "node",
         "args": ["/path/to/nsf-awards-mcp/build/index.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "debug"
         }
       }
     }
   }
   ```

4. **Check Node.js version:**
   ```bash
   node --version  # Should be v18.x or higher
   ```

### Permission Errors

**Problem:** Permission denied errors.

**Solutions:**

**macOS/Linux:**
```bash
# Make index.js executable
chmod +x /path/to/nsf-awards-mcp/build/index.js

# Check ownership
ls -l /path/to/nsf-awards-mcp/build/index.js
```

**Windows:**
- Run client as Administrator (right-click > Run as Administrator)
- Check file isn't marked as blocked (Properties > Unblock)

### API Errors

**Problem:** Tools work but return API errors.

**Solutions:**

1. **Check internet connection** - NSF API requires network access

2. **Verify NSF API is accessible:**
   ```bash
   curl "https://api.nsf.gov/services/v1/awards.json?keyword=science&rpp=1"
   ```

3. **Check for rate limiting** - Wait a few minutes and try again

4. **Verify date formats** - NSF API requires mm/dd/yyyy format

### Path Issues

**Problem:** Can't find the correct path to use.

**Solutions:**

1. **Find installation directory:**
   ```bash
   # In the project directory
   pwd
   ```

2. **Get absolute path to build file:**

   **macOS/Linux:**
   ```bash
   realpath build/index.js
   ```

   **Windows:**
   ```powershell
   Resolve-Path build\index.js
   ```

3. **Use workspace variable (VS Code/Cline):**
   ```json
   {
     "cline.mcpServers": {
       "nsf-awards": {
         "command": "node",
         "args": ["${workspaceFolder}/nsf-awards-mcp/build/index.js"]
       }
     }
   }
   ```

## Platform-Specific Notes

### macOS

**Finding Application Support Folder:**
1. Open Finder
2. Press `Cmd + Shift + G`
3. Type `~/Library/Application Support/Claude`
4. Press Enter

**Common Issues:**
- **Gatekeeper**: If blocked, go to System Preferences > Security & Privacy > Allow
- **Permissions**: macOS may require granting terminal full disk access

### Windows

**Finding AppData Folder:**
1. Press `Win + R`
2. Type `%APPDATA%`
3. Press Enter
4. Navigate to `Claude` folder

**Common Issues:**
- **Path separators**: Use forward slashes (`/`) in JSON, even on Windows
- **Execution policy**: May need to allow script execution in PowerShell
- **Antivirus**: Some antivirus software may block Node.js execution

### Linux

**Finding Config Folder:**
```bash
# Use environment variable
echo $XDG_CONFIG_HOME  # Usually ~/.config

# Or directly
ls ~/.config/claude/
```

**Common Issues:**
- **Permissions**: Ensure config file is user-readable
- **Node.js installation**: May need to install via package manager or nvm
- **Distribution differences**: Paths may vary by distribution

## Advanced Configuration

### Multiple MCP Servers

You can configure multiple MCP servers:

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/path/to/nsf-awards-mcp/build/index.js"],
      "env": {"NODE_ENV": "production"}
    },
    "other-server": {
      "command": "node",
      "args": ["/path/to/other-server/index.js"],
      "env": {"NODE_ENV": "production"}
    }
  }
}
```

### Custom Environment Variables

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/path/to/nsf-awards-mcp/build/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug",
        "NODE_OPTIONS": "--max-old-space-size=4096"
      }
    }
  }
}
```

### Using npx

If you install globally or want to use npx:

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "npx",
      "args": [
        "-y",
        "nsf-awards-mcp"
      ],
      "env": {"NODE_ENV": "production"}
    }
  }
}
```

## Getting Help

If you're still having issues:

1. **Check the logs** - Enable debug logging (see above)
2. **Review INSTALL.md** - Ensure installation completed successfully
3. **Check GitHub Issues** - Search for similar problems
4. **Create an Issue** - Include:
   - Client name and version
   - Operating system
   - Configuration file (remove sensitive info)
   - Error messages
   - Steps to reproduce

## Additional Resources

- [Installation Guide](INSTALL.md)
- [Development Guide](DEVELOPMENT.md)
- [MCP Specification](https://modelcontextprotocol.io/)
- [NSF Award Search API](https://www.research.gov/common/webapi/awardapisearch-v1.htm)
- [Project README](README.md)
