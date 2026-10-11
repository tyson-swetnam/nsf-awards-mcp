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

// Each case: tool, arguments, and a check on the parsed result (null = ok).
// Award ids were confirmed against the live API: 1114898 has a Project
// Outcomes Report, 9307607 (1993) predates them.
const hasAwards = (min = 1) => (data) =>
  Array.isArray(data) && data.length >= min ? null : `expected >= ${min} awards, got ${data?.length ?? 0}`;
const all = (pred, label) => (data) =>
  Array.isArray(data) && data.length > 0 && data.every(pred) ? null : `not every award ${label}`;
const parseDate = (s) => { const [m, d, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };

const cases = [
  ['search_nsf_awards', { keyword: 'wildfire', limit: 3 }, hasAwards(3)],
  ['search_nsf_awards', { keyword: 'wildfire', startDateFrom: '2020-01-01', startDateTo: '12/31/2020', limit: 5 },
    all((a) => parseDate(a.startDate) >= new Date(2020, 0, 1) && parseDate(a.startDate) <= new Date(2020, 11, 31), 'starts in 2020')],
  ['search_nsf_awards', { keyword: 'wildfire', expDateFrom: '01/01/2020', expDateTo: '12/31/2020', limit: 5 },
    all((a) => parseDate(a.expDate).getFullYear() === 2020, 'expires in 2020')],
  ['search_nsf_awards', { keyword: 'wildfire', dateStart: '01/01/2020', dateEnd: '12/31/2020', limit: 3 }, hasAwards(1)],
  ['search_nsf_awards', { awardeeStateCode: 'NM', estimatedTotalAmtFrom: 1000000, limit: 3 },
    all((a) => a.awardeeStateCode === 'NM' && a.estimatedTotalAmt >= 1000000, 'is an NM award >= $1M')],
  ['search_nsf_awards', { keyword: 'machine learning', printFields: 'id,title,piLastName,estimatedTotalAmt', limit: 2 },
    all((a) => Object.keys(a).every((k) => ['id', 'title', 'piLastName', 'estimatedTotalAmt'].includes(k)), 'has only the requested fields')],
  ['search_nsf_awards', { keyword: 'climate', offset: 26, limit: 2 }, hasAwards(2)],
  ['search_nsf_awards', { piLastName: 'Swetnam', includeExpired: false, limit: 25 },
    all((a) => a.activeAwd === true || a.activeAwd === 'true', 'is active')],
  ['search_by_institution', { institutionName: 'University of Arizona', limit: 5 },
    all((a) => a.awardeeName === 'University of Arizona', 'is at University of Arizona')],
  ['search_by_institution', { institutionName: 'University of New Mexico', stateCode: 'NM', limit: 5 },
    all((a) => a.awardeeName === 'University of New Mexico', 'is at University of New Mexico')],
  ['search_by_pi', { lastName: 'Swetnam', limit: 10 }, all((a) => /Swetnam/.test(a.pdPIName), 'has PI Swetnam')],
  ['search_by_pi', { firstName: 'Tyson', lastName: 'Swetnam', institution: 'University of Arizona', limit: 10 },
    all((a) => /Tyson/.test(a.pdPIName) && a.awardeeName === 'University of Arizona', 'is Tyson Swetnam at UA')],
  ['search_by_pi', { firstName: 'Tyson', lastName: 'Swetnam', includeCoPIs: true, limit: 10 }, hasAwards(4)],
  ['get_award_details', { awardId: '2632685' }, (d) => (d?.id === '2632685' && d.abstractText ? null : 'missing award or abstract')],
  ['get_award_details', { awardId: '2632685', includeAbstract: false }, (d) => (d?.id === '2632685' && !('abstractText' in d) ? null : 'abstract not removed')],
  ['get_project_outcomes', { awardId: '1114898' }, (d) => (d?.outcomesReport?.length > 200 ? null : 'no outcomes report text')],
];

let failures = 0;
const report = (ok, name, args, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${JSON.stringify(args)} -> ${detail}`);
  if (!ok) failures++;
};

for (const [name, args, check] of cases) {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content?.[0]?.text ?? '';
  if (res.isError) { report(false, name, args, text.slice(0, 200)); continue; }
  let data;
  try { data = JSON.parse(text); } catch { report(false, name, args, 'non-JSON result'); continue; }
  const problem = check(data);
  const paging = res.content?.[1]?.text ? ` | ${res.content[1].text}` : '';
  const summary = Array.isArray(data)
    ? `${data.length} awards; first: ${data[0] ? `${data[0].id} ${String(data[0].title).slice(0, 50)}` : '-'}${paging}`
    : `keys: ${Object.keys(data).slice(0, 8).join(',')}`;
  report(!problem, name, args, problem ? `${problem} (${summary})` : summary);
}

// Expected-error paths
for (const [name, args, label] of [
  ['get_award_details', { awardId: '0000000' }, 'unknown award id'],
  ['get_project_outcomes', { awardId: '9307607' }, 'award without an outcomes report'],
  ['search_by_pi', {}, 'missing lastName'],
]) {
  try {
    const res = await client.callTool({ name, arguments: args });
    report(res.isError, name, args, `${label} -> ${res.content?.[0]?.text?.slice(0, 120)}`);
  } catch (e) {
    report(true, name, args, `${label} rejected -> ${e.message.slice(0, 120)}`);
  }
}

await client.close();
console.log(failures ? `\n${failures} failure(s)` : '\nAll calls succeeded');
process.exit(failures ? 1 : 0);
