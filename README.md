# NSF Awards MCP Server

A Model Context Protocol (MCP) server that provides structured access to the U.S. National Science Foundation's Award API. This server enables AI assistants to search, retrieve, and analyze NSF grant and award information through standardized MCP tools.

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

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Run tests (optional)
npm test
```

## Usage

### Running the MCP Server

```bash
# Start the server
npm start

# Or run directly with Node
node build/index.js

# For development with auto-reload
npm run dev
```

### Integration with Claude Desktop

1. Add the server to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/path/to/nsf-awards-mcp/build/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. The NSF Awards tools will be available in your conversations

### Example Tool Usage

#### Search for awards
```typescript
{
  "tool": "search_nsf_awards",
  "arguments": {
    "keyword": "machine learning",
    "awardeeName": "MIT",
    "startDateFrom": "01/01/2023",
    "estimatedTotalAmtFrom": 100000,
    "limit": 25
  }
}
```

#### Get award details
```typescript
{
  "tool": "get_award_details",
  "arguments": {
    "awardId": "2012345",
    "includeAbstract": true
  }
}
```

#### Search by institution
```typescript
{
  "tool": "search_by_institution",
  "arguments": {
    "institutionName": "Stanford University",
    "stateCode": "CA",
    "startDateFrom": "01/01/2024",
    "limit": 10
  }
}
```

## Development

### Project Structure

```
src/
├── index.ts           # MCP server entry point
├── tools/             # MCP tool implementations
│   ├── search-awards.ts
│   ├── get-award-details.ts
│   ├── get-project-outcomes.ts
│   ├── search-by-institution.ts
│   └── search-by-pi.ts
├── types/             # TypeScript type definitions
│   ├── nsf-api.types.ts
│   └── mcp-tools.types.ts
├── client/            # NSF API HTTP client
│   └── nsf-api-client.ts
└── utils/             # Utility functions
    ├── logger.ts      # Winston logger configuration
    └── date-utils.ts  # Date format utilities
```

### Available Scripts

```bash
npm run build      # Build TypeScript to JavaScript
npm run dev        # Run in development mode with auto-reload
npm start          # Run the production server
npm test           # Run test suite
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run type-check # Check TypeScript types
```

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `LOG_LEVEL`: Logging level (`error`, `warn`, `info`, `debug`, `verbose`)

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

The project includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

Test coverage includes:
- Date utility functions
- NSF API client methods
- MCP tool handlers
- Input validation
- Error handling

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Acknowledgments

This MCP server integrates with the U.S. National Science Foundation's public award database API. All data is publicly available through [nsf.gov](https://www.nsf.gov).

## Support

For issues, questions, or suggestions, please open an issue on GitHub.