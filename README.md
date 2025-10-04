# NSF Awards MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with access to the U.S. National Science Foundation's Award API, enabling intelligent search and retrieval of NSF grant and award information.

## Overview

This MCP server integrates with the [NSF Awards API](https://resources.research.gov/common/webapi/awardapisearch-v1.htm) to provide structured access to NSF funding awards, project outcomes, and related metadata through the Model Context Protocol.

## API Reference

**Base URL:** `http://api.nsf.gov/services/v1/`

**Available Endpoints:**
- Award Search: `/awards.{format}`
- Specific Award: `/awards/{id}.{format}`
- Project Outcomes: `/awards/{id}/projectoutcomes.{format}`

**Supported Formats:** JSON, XML, JSONP

## Planned MCP Tools

### 1. `search_nsf_awards`
Search NSF awards using various criteria.

**Parameters:**
- `keyword` (string, optional): Free text search across award data
- `awardee_name` (string, optional): Filter by organization name
- `awardee_city` (string, optional): Filter by organization city
- `pi_name` (string, optional): Principal Investigator name
- `fund_program_name` (string, optional): NSF program name
- `date_start` (string, optional): Award start date (mm/dd/yyyy)
- `date_end` (string, optional): Award end date (mm/dd/yyyy)
- `estimated_amount_from` (number, optional): Minimum award amount
- `estimated_amount_to` (number, optional): Maximum award amount
- `offset` (number, optional): Pagination offset
- `results_per_page` (number, optional): Results per page (1-25, default 25)

**Returns:** List of awards with default fields (id, agency, title, awardee info, PI names)

### 2. `get_award_details`
Retrieve detailed information about a specific NSF award.

**Parameters:**
- `award_id` (string, required): NSF award ID

**Returns:** Complete award record with all available metadata

### 3. `get_project_outcomes`
Fetch project outcomes and results for a specific award.

**Parameters:**
- `award_id` (string, required): NSF award ID

**Returns:** Project outcomes, publications, and impact data

### 4. `search_by_institution`
Find all awards for a specific institution with optional date range.

**Parameters:**
- `institution_name` (string, required): Organization/university name
- `date_start` (string, optional): Start date filter
- `date_end` (string, optional): End date filter
- `offset` (number, optional): Pagination offset

**Returns:** All awards for the specified institution

### 5. `search_by_pi`
Search awards by Principal Investigator name.

**Parameters:**
- `pi_name` (string, required): PI first or last name
- `offset` (number, optional): Pagination offset

**Returns:** Awards associated with the specified PI

## Technical Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Set up TypeScript project structure
- [ ] Configure MCP SDK dependencies
- [ ] Implement base HTTP client for NSF API
- [ ] Add JSON/XML response parsing
- [ ] Create type definitions for NSF API responses

### Phase 2: Tool Implementation
- [ ] Implement `search_nsf_awards` tool
- [ ] Implement `get_award_details` tool
- [ ] Implement `get_project_outcomes` tool
- [ ] Implement `search_by_institution` tool
- [ ] Implement `search_by_pi` tool

### Phase 3: Enhancement & Polish
- [ ] Add request caching for frequently accessed awards
- [ ] Implement rate limiting and error handling
- [ ] Add input validation and sanitization
- [ ] Create comprehensive error messages
- [ ] Add pagination helper utilities

### Phase 4: Testing & Documentation
- [ ] Write unit tests for each tool
- [ ] Integration tests with live API
- [ ] Usage examples and documentation
- [ ] Performance optimization

## Features

- **No Authentication Required:** The NSF API is public and open
- **Flexible Searching:** Multiple search criteria and filters
- **Pagination Support:** Handle large result sets efficiently
- **Multiple Formats:** Support for JSON and XML responses
- **Type-Safe:** Full TypeScript type definitions

## Use Cases

- Research funding analysis and trends
- Grant history for institutions or PIs
- Project outcome tracking
- Funding opportunity discovery
- Academic research support

## Installation

```bash
npm install
npm run build
```

## Configuration

Add to your MCP settings configuration:

```json
{
  "mcpServers": {
    "nsf-awards": {
      "command": "node",
      "args": ["/path/to/nsf-awards-mcp/build/index.js"]
    }
  }
}
```

## API Limitations

- Maximum 25 results per page
- Date format must be mm/dd/yyyy
- No authentication or API key required
- Public data only

## Development Status

🚧 **In Development** - This MCP server is currently being built.

## License

MIT
