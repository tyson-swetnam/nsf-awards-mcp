# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for the U.S. National Science Foundation's Award API. The server provides AI assistants with structured access to NSF grant and award information through MCP tools.

## NSF API Integration

**Base URL:** `https://www.research.gov/awardapi-service/v1/`

**Key Endpoints:**
- `/awards.{format}` - Search awards
- `/awards/{id}.{format}` - Get specific award details
- `/awards/{id}/projectoutcomes.{format}` - Get project outcomes

**Important API Constraints:**
- Maximum 25 results per page
- Date format must be mm/dd/yyyy
- No authentication required
- Public data only

**Live API behaviour (verified 2026-10-11, see `scripts/probe-nsf-api.sh`):**
- Rejected parameters come back as HTTP 200 with
  `response.serviceNotification` (`AwardAPI-002 Invalid parameter(s) {...}`), not an
  error status; the client turns these into errors
- Date ranges are `startDateStart/End`, `expDateStart/End`, `dateStart/End`; the
  `*From/*To` spellings, `awardsDateStart/End`, `awardeeOrganization`, `nsfOrganization`,
  `nsfDirectorateName`, `awardType`, `fundingAgencyCode`, `awardingAgencyCode`,
  `perfState`, `sortBy` and `sortDir` are invalid
- `printFields` is accepted but ignored (full records always return)
- Unquoted multi-word `awardeeName` matches any word; quote it to match the phrase
- `ActiveAwards=true` / `ExpiredAwards=true` filter by status
- `offset` is a 0-based record offset; `response.metadata.totalCount` gives the total
  (capped at 10000), and ordering among ties is not stable between calls
- `/awards/{id}/projectoutcomes.json` returns `response.award[]`; the report is the
  HTML field `projectOutComesReport` (capital C), absent for older awards

## Planned MCP Tools

When implementing, create these tools in the following priority order:

1. **search_nsf_awards** - Primary search tool with multiple filter parameters
2. **get_award_details** - Retrieve complete award information by ID
3. **get_project_outcomes** - Fetch the Project Outcomes Report (projectOutComesReport field)
4. **search_by_institution** - Institution-specific award searches
5. **search_by_pi** - Principal Investigator searches

## Project Structure (To Be Implemented)

```
src/
  index.ts          # MCP server entry point
  tools/            # Individual MCP tool implementations
  types/            # TypeScript definitions for NSF API responses
  client/           # HTTP client for NSF API
  utils/            # Helper functions (pagination, parsing)
```

## Development Setup Commands

Since this is a new project, you'll need to initialize it first:

```bash
# Initialize TypeScript project
npm init -y
npm install --save-dev typescript @types/node
npm install @modelcontextprotocol/server zod

# Create TypeScript config
npx tsc --init

# Build project (once src/ exists)
npm run build

# Run the MCP server (after implementation)
node build/index.js
```

## Implementation Guidelines

### Response Parsing
The NSF API returns both JSON and XML. Prioritize JSON for simplicity, but be prepared to handle XML responses if needed.

### Error Handling
NSF API returns error responses with notification codes. Parse these and provide meaningful error messages to users.

### Pagination
All search tools must handle pagination properly:
- Use `offset` parameter for pagination
- Maximum `rpp` (results per page) is 25
- Consider implementing automatic pagination for large result sets

### Type Safety
Create comprehensive TypeScript interfaces for:
- NSF Award objects
- API request parameters
- API response envelopes
- Error responses

## Testing Approach

When implementing tests:
- Mock NSF API responses for unit tests
- Use actual API for integration tests (no auth required)
- Test pagination edge cases
- Validate date format handling

## Git Workflow

After each successful prompt completion, commit changes to track development progress:

```bash
# Stage all changes
git add .

# Create a verbose, comprehensive commit message that includes:
# - What was implemented/changed
# - Why the change was made
# - Any important technical decisions
# - Impact on the codebase
git commit -m "[Feature/Fix/Refactor]: Brief summary

Detailed description:
- Specific changes made
- Rationale for implementation approach
- Any dependencies or prerequisites
- Files modified and their purpose

This enables easy reversion to functional states and provides a clear
development history for context during future sessions."
```

**Commit Message Guidelines:**
- Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- First line: concise summary (50 chars or less)
- Blank line, then detailed multi-line description
- Include technical context that helps understand the change
- Reference any relevant issues or requirements

**Benefits:**
- Prevents hallucination by maintaining clear state history
- Enables quick reversion if issues arise
- Provides context for resuming work across sessions
- Creates audit trail of all "Vibe Code" iterations