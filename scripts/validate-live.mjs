#!/usr/bin/env node
/**
 * Live end-to-end validation: spawns the built server over stdio with the
 * v2 MCP client, lists tools, and calls every tool against the real NSF
 * Award API. Usage: npm run build && node scripts/validate-live.mjs
 */
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const serverParams = () => ({
  command: process.execPath,
  args: [new URL('../build/index.js', import.meta.url).pathname],
  env: { ...process.env, LOG_LEVEL: process.env.LOG_LEVEL || 'error' },
  stderr: 'inherit'
});

// Confirm older (2025-era initialize) clients can still connect.
const legacy = new Client({ name: 'nsf-awards-validate-legacy', version: '1.0.0' });
await legacy.connect(new StdioClientTransport(serverParams()));
const legacyTools = await legacy.listTools();
console.log(`Legacy handshake: ${legacy.getNegotiatedProtocolVersion()} (${legacyTools.tools.length} tools)`);
await legacy.close();

// Main run pinned to the 2026-07-28 revision (server/discover, no fallback).
const client = new Client(
  { name: 'nsf-awards-validate', version: '1.0.0' },
  { versionNegotiation: { mode: { pin: '2026-07-28' } } }
);
await client.connect(new StdioClientTransport(serverParams()));

console.log(`Modern handshake: ${client.getNegotiatedProtocolVersion()} era=${client.getProtocolEra()}`);
const { tools } = await client.listTools();
console.log('Tools:', tools.map(t => `${t.name}${t.annotations?.readOnlyHint ? ' (read-only)' : ''}`).join(', '));

// A known award with a published project outcomes report is discovered at runtime.
const cases = [
  ['search_nsf_awards', { keyword: 'wildfire', limit: 3 }],
  ['search_nsf_awards', { keyword: 'dendrochronology', startDateFrom: '2020-01-01', startDateTo: '12/31/2024', limit: 3 }],
  ['search_nsf_awards', { awardeeStateCode: 'NM', estimatedTotalAmtFrom: 1000000, limit: 3 }],
  ['search_nsf_awards', { keyword: 'machine learning', printFields: 'id,title,piLastName,estimatedTotalAmt', limit: 2 }],
  ['search_nsf_awards', { keyword: 'climate', offset: 26, limit: 2 }],
  ['search_by_institution', { institutionName: 'University of Arizona', limit: 3 }],
  ['search_by_institution', { institutionName: 'University of New Mexico', stateCode: 'NM', limit: 3 }],
  ['search_by_pi', { lastName: 'Swetnam', limit: 5 }],
  ['search_by_pi', { firstName: 'Tyson', lastName: 'Swetnam', includeCoPIs: true, limit: 5 }],
];

let failures = 0;
const summarize = (name, args, res) => {
  const text = res.content?.[0]?.text ?? '';
  let detail = text.slice(0, 160).replace(/\s+/g, ' ');
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      detail = `${data.length} awards; first: ${data[0] ? `${data[0].id} ${String(data[0].title).slice(0, 60)}` : '-'}`;
    } else if (data && typeof data === 'object') {
      detail = `keys: ${Object.keys(data).slice(0, 8).join(',')}`;
    }
  } catch { /* not JSON */ }
  console.log(`${res.isError ? 'FAIL' : 'ok  '} ${name} ${JSON.stringify(args)} -> ${detail}`);
  if (res.isError) failures++;
  return text;
};

let firstId;
for (const [name, args] of cases) {
  const res = await client.callTool({ name, arguments: args });
  const text = summarize(name, args, res);
  if (!firstId) { try { firstId = JSON.parse(text)[0]?.id; } catch {} }
}

// Detail + outcomes on awards found above, plus a historic award that has an outcomes report.
for (const id of [firstId, '1550835'].filter(Boolean)) {
  summarize('get_award_details', { awardId: id }, await client.callTool({ name: 'get_award_details', arguments: { awardId: id } }));
  summarize('get_award_details', { awardId: id, includeAbstract: false }, await client.callTool({ name: 'get_award_details', arguments: { awardId: id, includeAbstract: false } }));
  summarize('get_project_outcomes', { awardId: id }, await client.callTool({ name: 'get_project_outcomes', arguments: { awardId: id } }));
}

// Expected-error paths
const bad = await client.callTool({ name: 'get_award_details', arguments: { awardId: '0000000' } });
console.log(`${bad.isError ? 'ok  ' : 'FAIL'} get_award_details unknown id returns isError -> ${bad.content?.[0]?.text?.slice(0, 120)}`);
if (!bad.isError) failures++;
try {
  const inv = await client.callTool({ name: 'search_by_pi', arguments: {} });
  console.log(`${inv.isError ? 'ok  ' : 'FAIL'} search_by_pi missing lastName rejected -> ${inv.content?.[0]?.text?.slice(0, 120)}`);
  if (!inv.isError) failures++;
} catch (e) {
  console.log(`ok   search_by_pi missing lastName rejected -> ${e.message.slice(0, 120)}`);
}

await client.close();
console.log(failures ? `\n${failures} failure(s)` : '\nAll calls succeeded');
process.exit(failures ? 1 : 0);
