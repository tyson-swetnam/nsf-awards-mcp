# NSF Awards MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io/)

A Model Context Protocol (MCP) server that provides structured access to the U.S. National Science Foundation's Award API. This server enables AI assistants to search, retrieve, and analyze NSF grant and award information through standardized MCP tools.

## Table of Contents

- [Documentation](#documentation)
- [Features](#features)
- [MCP Tools](#mcp-tools)
- [Quick Start](#quick-start)
- [Client Compatibility](#client-compatibility)
- [Usage](#usage)
- [Development](#development)
- [API Details](#api-details)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Documentation

- **[Installation Guide](INSTALL.md)** - Complete installation instructions for all platforms
- **[User Guide](USAGE.md)** - How to integrate with Claude Desktop, Cline, and other MCP clients
- **[Developer Guide](DEVELOPMENT.md)** - Contributing, development setup, and testing
- **[NSF API Documentation](https://www.research.gov/common/webapi/awardapisearch-v1.htm)** - Official NSF API reference

## Features

- **Comprehensive Award Search**: Search NSF awards with multiple filter parameters including keywords, institution names, PI names, date ranges, and funding amounts
- **Detailed Award Information**: Retrieve complete award details including abstracts, funding information, and project metadata
- **Project Outcomes**: Access project outcomes, publications, and research results
- **Institution-Specific Searches**: Find all awards associated with specific institutions
- **Principal Investigator Searches**: Search awards by PI name with support for Co-PI searches
- **Robust Error Handling**: Comprehensive error handling with retry logic and detailed error messages
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Production Ready**: Includes logging, input validation, and comprehensive test coverage

## MCP Tools

The server provides 5 MCP tools:

### 1. `search_nsf_awards`
Primary search tool with multiple filter parameters:
- Keywords, institution names, PI names
- Date ranges (start/end dates)
- Funding amount ranges
- Geographic filters (state, country)
- Program and directorate filters

### 2. `get_award_details`
Retrieve complete information about a specific award by ID:
- Full award metadata
- Abstract text (optional)
- Funding details
- Institution and PI information

### 3. `get_project_outcomes`
Access project results and publications:
- Research accomplishments
- Publications with DOIs
- Conference presentations
- Websites and other products

### 4. `search_by_institution`
Institution-focused award searches:
- Filter by state
- Date range filtering
- Include/exclude subawards
- Pagination support

### 5. `search_by_pi`
Search awards by Principal Investigator:
- Support for first and last name
- Optional institution filtering
- Include Co-PI searches
- Date range filtering

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Verify installation
npm start
```

For detailed installation instructions, platform-specific guides, and troubleshooting, see **[INSTALL.md](INSTALL.md)**.

## Client Compatibility

The NSF Awards MCP Server works with any MCP-compatible client:

| Client | Platform | Status | Documentation |
|--------|----------|--------|---------------|
| **Claude Desktop** | macOS, Windows, Linux | ✅ Fully Supported | [Setup Guide](USAGE.md#claude-desktop) |
| **Cline** | VS Code (All platforms) | ✅ Fully Supported | [Setup Guide](USAGE.md#cline-vs-code-extension) |
| **Chatbox** | macOS, Windows, Linux | ✅ Fully Supported | [Setup Guide](USAGE.md#chatbox) |
| **Cursor** | macOS, Windows, Linux | ✅ Fully Supported | [Setup Guide](USAGE.md#cursor) |
| **Continue** | VS Code (All platforms) | ⚠️ Experimental | [Setup Guide](USAGE.md#other-mcp-clients) |
| **Zed** | macOS, Linux | ⚠️ Experimental | [Setup Guide](USAGE.md#other-mcp-clients) |

For complete integration instructions, configuration examples, and troubleshooting, see **[USAGE.md](USAGE.md)**.

## Usage

### Quick Setup for Claude Desktop

1. **Install the server** (see [Installation](#installation) above)

2. **Configure Claude Desktop** - Edit your configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

3. **Add this configuration**:
   ```json
   {
     "mcpServers": {
       "nsf-awards": {
         "command": "node",
         "args": ["/absolute/path/to/nsf-awards-mcp/build/index.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

5. **Start using the tools** - Try asking: "Find recent NSF awards about machine learning"

For detailed setup instructions for all clients, see **[USAGE.md](USAGE.md)**.

### Running Standalone

You can run the server standalone for testing:

```bash
# Start the server
npm start

# Or run directly with Node
node build/index.js

# For development with auto-reload
npm run dev
```

The server communicates via stdio (standard input/output) as per the MCP specification.

### Example Queries

Once configured, ask your AI assistant natural language questions:

**Basic Search:**
```
Find recent NSF awards related to machine learning
```

**Institution Search:**
```
Show me NSF awards for Stanford University in California from 2024
```

**Principal Investigator Search:**
```
Find awards where Jane Smith is the principal investigator
```

**Award Details:**
```
Get detailed information about NSF award 2012345
```

**Complex Query:**
```
Find all NSF awards for climate research with funding over $500,000 since 2023
```

For complete usage examples and tool documentation, see **[USAGE.md](USAGE.md)**.

## Development

### For Contributors

Contributions are welcome! To get started:

```bash
# Clone and setup
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
npm run type-check
```

For complete development documentation, including:
- Project structure details
- Testing guidelines
- Code style conventions
- Adding new tools
- Troubleshooting development issues

See **[DEVELOPMENT.md](DEVELOPMENT.md)**.

## API Details

### NSF API Integration

The server integrates with the NSF Award Search API v1:
- Base URL: `https://api.nsf.gov/services/v1/`
- No authentication required (public API)
- Supports both JSON and XML responses (JSON preferred)
- Maximum 25 results per page
- Date format: mm/dd/yyyy

### Rate Limiting

The NSF API does not require authentication but may have rate limits. The server implements:
- Exponential backoff retry logic
- Configurable timeout (default: 30 seconds)
- Maximum 3 retry attempts

### Error Handling

The server provides comprehensive error handling:
- Input validation using Zod schemas
- NSF API error parsing and meaningful error messages
- Network error recovery with retries
- Detailed error logging for debugging

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

See [DEVELOPMENT.md](DEVELOPMENT.md#testing) for detailed testing information.

## Troubleshooting

### Common Issues

**Tools not appearing in client:**
- Verify configuration file path is correct
- Check that `build/index.js` exists (run `npm run build`)
- Ensure Node.js is in PATH
- Restart your MCP client completely

**Server fails to start:**
- Check Node.js version: `node --version` (must be 18.x or higher)
- Rebuild the project: `npm run build`
- Check for error messages in client logs

**API errors:**
- Verify internet connection
- Check NSF API is accessible: `curl https://api.nsf.gov/services/v1/awards.json?rpp=1`

For comprehensive troubleshooting guides, see:
- **[INSTALL.md](INSTALL.md#troubleshooting)** - Installation issues
- **[USAGE.md](USAGE.md#troubleshooting)** - Configuration and usage issues
- **[DEVELOPMENT.md](DEVELOPMENT.md#troubleshooting)** - Development issues

## Contributing

We welcome contributions! Please see **[DEVELOPMENT.md](DEVELOPMENT.md#contributing)** for:
- Development workflow
- Code style guidelines
- Testing requirements
- Pull request process

## License

MIT

## Acknowledgments

This MCP server integrates with the U.S. National Science Foundation's public award database API. All data is publicly available through [nsf.gov](https://www.nsf.gov).

## Support

For issues, questions, or suggestions, please open an issue on GitHub.