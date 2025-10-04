# NSF Awards MCP - Project Summary

## Overview
This project implements a Model Context Protocol (MCP) server that provides access to the National Science Foundation's Award Search API. It allows AI assistants like Claude to search and retrieve information about NSF research awards.

## Files Created

### Core Implementation
- **src/index.ts** (237 lines)
  - Main MCP server implementation
  - Implements `search_nsf_awards` tool
  - Handles API requests to NSF Award Search API
  - Formats and returns award data

### Configuration Files
- **package.json**
  - Node.js package configuration
  - Dependencies: @modelcontextprotocol/sdk, zod
  - Scripts: build, prepare, dev
  - Configured for npm publishing

- **tsconfig.json**
  - TypeScript compiler configuration
  - Target: ES2022, Module: Node16
  - Strict type checking enabled

- **.npmignore**
  - Specifies files to exclude from npm package
  - Excludes source files and development artifacts

- **.gitignore**
  - Already existed, properly configured for Node.js projects

### Documentation
- **README.md** (128 lines)
  - Installation instructions
  - Usage with Claude Desktop
  - Development setup
  - Available tools and parameters

- **USAGE.md** (132 lines)
  - Detailed usage examples
  - Query patterns and tips
  - API limitations and troubleshooting

- **CONTRIBUTING.md** (114 lines)
  - Development guidelines
  - Project structure
  - Coding standards
  - Contribution workflow

- **claude_desktop_config.example.json**
  - Example configuration for Claude Desktop
  - Shows how to integrate the MCP server

### Existing Files
- **LICENSE** - MIT License (already existed)

## Technical Details

### Dependencies
**Production:**
- `@modelcontextprotocol/sdk` ^1.19.1 - MCP protocol implementation
- `zod` ^3.25.76 - Schema validation

**Development:**
- `typescript` ^5.9.3 - TypeScript compiler
- `tsx` ^4.20.6 - TypeScript execution for development
- `@types/node` ^24.6.2 - Node.js type definitions

### API Integration
The tool integrates with the NSF Award Search API v1:
- Base URL: `https://api.nsf.gov/services/v1/awards.json`
- Supports multiple search parameters
- Returns up to 25 results per request
- Pagination via offset parameter

### Search Parameters Supported
- `keyword` - Full-text search across award data
- `awardNumber` - Search by specific award ID
- `agency` - Filter by NSF directorate/division
- `piFirstName` / `piLastName` - Search by Principal Investigator
- `fundProgramName` - Filter by funding program
- `startDateStart` / `startDateEnd` - Filter by start date range
- `expDateStart` / `expDateEnd` - Filter by expiration date range
- `offset` - Pagination offset
- `printFields` - Specify fields to return

### Return Data
Each award includes:
- Award ID
- Title
- Principal Investigator name
- Institution location (city, state)
- Agency/directorate
- Funding program
- Start and expiration dates
- Funds obligated amount
- Abstract (truncated to 500 characters)

## Package Information
- **Name:** nsf-awards-mcp
- **Version:** 1.0.0
- **License:** MIT
- **Package Size:** 5.7 KB (compressed), 17.8 KB (unpacked)
- **Node.js Requirement:** >= 18.0.0

## Installation Methods
1. Global install: `npm install -g nsf-awards-mcp`
2. Use with npx: `npx nsf-awards-mcp`
3. Local development: `npm install && npm run build`

## Usage
Once configured in Claude Desktop, users can ask natural language questions like:
- "Find NSF awards about machine learning"
- "Show me CAREER awards from 2023"
- "Search for awards by PI Jane Smith"
- "Get details for award 2154420"

## Build and Development
```bash
npm install      # Install dependencies
npm run build    # Build TypeScript to JavaScript
npm run dev      # Run in development mode with tsx
```

## Quality Metrics
- TypeScript with strict mode enabled
- Comprehensive error handling
- Input validation with Zod schemas
- Well-documented with examples
- Clean package distribution
- Ready for npm publishing

## Repository
https://github.com/tyson-swetnam/nsf-awards-mcp
