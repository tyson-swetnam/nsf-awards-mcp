---
name: verify
description: Verify the NSF Awards MCP server end-to-end by driving the built stdio server with the v2 MCP client against the live NSF Award API.
---

# Verifying nsf-awards-mcp

The surface is the stdio MCP server (`build/index.js`). Drive it with a real MCP client, not by importing `src/`.

## Build and baseline

```bash
npm run build
npm run validate:live   # legacy (2025-11-25) + modern (2026-07-28) handshakes, ~19 live tool calls
```

## Ad-hoc driver

Put a client script in the scratchpad and import the client by absolute path (scratchpad has no node_modules):

```js
import { Client } from '<repo>/node_modules/@modelcontextprotocol/client/dist/index.mjs';
import { StdioClientTransport } from '<repo>/node_modules/@modelcontextprotocol/client/dist/stdio.mjs';
const c = new Client({ name: 'verify', version: '1' }, { versionNegotiation: { mode: { pin: '2026-07-28' } } });
await c.connect(new StdioClientTransport({ command: process.execPath, args: ['<repo>/build/index.js'],
  env: { ...process.env, LOG_LEVEL: 'error' }, stderr: 'inherit' }));
const res = await c.callTool({ name: 'search_nsf_awards', arguments: { keyword: 'wildfire', limit: 5 } });
// res.content[0].text = JSON array of awards; res.content[1].text = "Showing X of N matching awards (offset k)..."
```

Omit `versionNegotiation` to get a legacy-era (2025-11-25) client.

Compare against the raw API with `curl -s -G https://www.research.gov/awardapi-service/v1/awards.json --data-urlencode k=v` to tell server bugs from upstream behaviour.

## Gotchas

- `totalCount` is capped at 10000, so a broad filter can look like it didn't narrow. Add a `keyword` (e.g. `wildfire`, ~981 awards) before judging a filter.
- `cfdaNumber`, `primaryProgram`, `coPDPI` and `fundsObligated` hold several values (comma lists or arrays), so check with "contains", not equality.
- If you print the raw tool text, don't truncate it before `JSON.parse`, because records with abstracts are large.
- `LOG_LEVEL=error` hides the server's warn log, which is where a dropped invalid date filter shows up.
- Phrase quoting depends on the field. A quoted value fixes `awardeeName`/`perfLocation`/`fundProgramName`, but returns 0 for `pdPIName`/`coPDPI` and broadens `piLastName`.
- Useful fixtures: award 2632685 (UNM, PI Tyson Swetnam, full field set), 1114898 (has a Project Outcomes Report), 9307607 (has no report).
