# nsf-awards-mcp

MCP (Model Context Protocol) server for searching the NSF Awards API. This tool provides seamless access to the National Science Foundation's Award Search database, allowing you to search for research awards by various criteria.

## Features

- Search NSF awards by keyword, award number, PI name, agency, and more
- Filter by date ranges (start date, expiration date)
- Retrieve detailed award information including:
  - Award ID and title
  - Principal Investigator information
  - Institution details
  - Funding amounts
  - Program information
  - Award abstracts
- Pagination support for large result sets

## Installation

```bash
npm install nsf-awards-mcp
```

Or install globally:

```bash
npm install -g nsf-awards-mcp
```

## Usage with Claude Desktop

Add this to your Claude Desktop configuration file:

### MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
### Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "npx",
      "args": ["-y", "nsf-awards-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "nsf-awards-mcp"
    }
  }
}
```

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/tyson-swetnam/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Available Tools

### search_nsf_awards

Search the NSF Awards database with various criteria.

**Parameters:**

- `keyword` (string, optional): Keyword to search for in awards (searches in title, abstract, PI name, etc.)
- `awardNumber` (string, optional): Specific NSF award number (e.g., '2154420')
- `agency` (string, optional): NSF agency/directorate code (e.g., 'CSE' for Computer and Information Science and Engineering)
- `piFirstName` (string, optional): Principal Investigator's first name
- `piLastName` (string, optional): Principal Investigator's last name
- `fundProgramName` (string, optional): Name of the funding program
- `startDateStart` (string, optional): Start date range beginning in MM/DD/YYYY format
- `startDateEnd` (string, optional): Start date range end in MM/DD/YYYY format
- `expDateStart` (string, optional): Expiration date range beginning in MM/DD/YYYY format
- `expDateEnd` (string, optional): Expiration date range end in MM/DD/YYYY format
- `offset` (number, optional): Starting record offset for pagination (default: 1)
- `printFields` (string, optional): Comma-separated list of fields to return

**Example queries you can ask Claude:**

- "Find NSF awards for machine learning research"
- "Show me awards from the Computer Science directorate in 2023"
- "Search for awards by PI Jane Smith"
- "Find award number 2154420"
- "What are recent awards in the CAREER program?"

## API Reference

This tool uses the NSF Award Search API v1. For more information about the API, visit:
https://resources.research.gov/common/webapi/awardapisearch-v1.htm

## License

MIT License - see LICENSE file for details

## Author

Tyson L. Swetnam

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
