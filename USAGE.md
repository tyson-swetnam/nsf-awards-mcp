# Usage Examples

This document provides examples of how to use the NSF Awards MCP tool with Claude.

## Setup

1. Install the tool:
```bash
npm install -g nsf-awards-mcp
```

2. Configure Claude Desktop (see README.md for config file location):
```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "nsf-awards-mcp"
    }
  }
}
```

3. Restart Claude Desktop

## Example Queries

Once configured, you can ask Claude questions like:

### Search by Keyword
```
"Find NSF awards related to artificial intelligence"
"Show me recent awards about climate change"
"Search for awards on quantum computing"
```

### Search by Award Number
```
"Get details for NSF award 2154420"
"Show me information about award number 1234567"
```

### Search by Principal Investigator
```
"Find awards where Jane Smith is the PI"
"Show me awards by PI with last name Johnson"
```

### Search by Agency/Directorate
```
"Find awards from the Computer Science directorate (CSE)"
"Show me awards from the Biological Sciences directorate (BIO)"
```

### Search by Program
```
"Find CAREER awards"
"Show me awards from the Small Business Innovation Research program"
```

### Search with Date Ranges
```
"Find awards that started in 2023"
"Show me awards expiring between 01/01/2024 and 12/31/2024"
```

### Complex Queries
```
"Find CAREER awards in computer science from 2022"
"Show me awards about machine learning with funding over $500k"
"Find recent awards from UC Berkeley on climate research"
```

## Direct API Parameters

You can also ask Claude to use specific parameters:

```
"Use the NSF awards tool to search with these parameters:
- keyword: robotics
- agency: CSE
- startDateStart: 01/01/2023
- startDateEnd: 12/31/2023"
```

## Result Interpretation

The tool returns:
- **Award ID**: Unique NSF award identifier
- **Title**: Full title of the research project
- **PI**: Principal Investigator name
- **Institution**: Awardee institution and location
- **Agency**: NSF directorate/division
- **Program**: Specific funding program
- **Dates**: Start and expiration dates
- **Funding**: Total funds obligated
- **Abstract**: Project description (truncated to 500 chars)

## Pagination

For large result sets, use the offset parameter:

```
"Search for AI awards starting from the 26th result (offset: 26)"
```

The API returns up to 25 results per request. Use offset to page through results.

## Tips

1. **Be specific**: More specific queries return more relevant results
2. **Use dates wisely**: Date ranges help narrow down results
3. **Combine parameters**: Use multiple search criteria for precision
4. **Check award numbers**: If you know an award number, use it directly
5. **Explore programs**: Search by program name to find similar awards

## API Limitations

- Maximum 25 results per request
- Date format must be MM/DD/YYYY
- Some fields may be empty depending on the award
- Results are limited to public NSF awards data

## Troubleshooting

If you get no results:
- Try broader search terms
- Check date format (MM/DD/YYYY)
- Verify agency/directorate codes
- Remove some filters to expand search

For more information about available fields and search capabilities, see:
https://resources.research.gov/common/webapi/awardapisearch-v1.htm
