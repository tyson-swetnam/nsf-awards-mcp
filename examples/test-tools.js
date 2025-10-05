#!/usr/bin/env node

/**
 * Example script to demonstrate NSF Awards MCP server usage
 * This script simulates MCP protocol communication with the server
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to the built server
const serverPath = path.join(__dirname, '..', 'build', 'index.js');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let messageId = 1;

/**
 * Send a JSON-RPC message to the server
 */
function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method: method,
    params: params
  };

  const jsonMessage = JSON.stringify(message) + '\n';
  server.stdin.write(jsonMessage);
}

/**
 * Process server output
 */
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim() && line.includes('jsonrpc')) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        // Not JSON, likely a log message
      }
    }
  }
});

// Handle stderr (logging output)
server.stderr.on('data', (data) => {
  // Ignore log messages for this example
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code || 0);
});

// Run example interactions
async function runExamples() {
  console.log('=== Testing NSF Awards MCP Server ===\n');

  // 1. Initialize the server
  console.log('1. Initializing server...');
  sendMessage('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0' }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. List available tools
  console.log('\n2. Listing available tools...');
  sendMessage('tools/list', {});

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Search for awards
  console.log('\n3. Searching for machine learning awards...');
  sendMessage('tools/call', {
    name: 'search_nsf_awards',
    arguments: {
      keyword: 'machine learning',
      limit: 5,
      startDateFrom: '01/01/2024'
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Get award details
  console.log('\n4. Getting details for a specific award...');
  sendMessage('tools/call', {
    name: 'get_award_details',
    arguments: {
      awardId: '2012345',
      includeAbstract: true
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. Search by institution
  console.log('\n5. Searching awards by institution...');
  sendMessage('tools/call', {
    name: 'search_by_institution',
    arguments: {
      institutionName: 'MIT',
      stateCode: 'MA',
      limit: 3
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Close the server
  console.log('\n=== Test Complete ===');
  server.stdin.end();
}

// Run the examples
runExamples().catch(console.error);