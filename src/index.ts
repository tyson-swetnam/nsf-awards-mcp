#!/usr/bin/env node

/**
 * NSF Awards MCP Server
 * Provides structured access to NSF grant and award information through MCP tools
 */

import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { allTools } from './tools/index.js';
import type { ToolResponse } from './types/mcp-tools.types.js';
import { logger } from './utils/logger.js';

/**
 * Server metadata
 */
const SERVER_INFO = {
  name: 'nsf-awards-mcp',
  version: '1.1.0',
  description: 'MCP server for NSF Awards API integration'
};

/**
 * Convert a tool handler's ToolResponse into an MCP CallToolResult
 */
function toCallToolResult(toolName: string, result: ToolResponse<unknown>): CallToolResult {
  if (result.success) {
    const content: CallToolResult['content'] = [
      {
        type: 'text',
        text: JSON.stringify(result.data, null, 2)
      }
    ];

    // Paging info for search tools, so the model knows whether to fetch more
    const meta = result.metadata;
    if (meta && Array.isArray(result.data) && meta.totalResults !== undefined) {
      const shown = result.data.length;
      const next = meta.offset + shown;
      content.push({
        type: 'text',
        text:
          `Showing ${shown} of ${meta.totalResults} matching awards (offset ${meta.offset}).` +
          (meta.hasMore ? ` More results are available: call again with offset=${next}.` : '')
      });
    }

    return { content, isError: false };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Error executing tool '${toolName}': ${result.error?.message || 'Unknown error'}`
      }
    ],
    isError: true
  };
}

/**
 * Create and configure the MCP server
 */
function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register every tool; the SDK validates arguments against the Zod schema
  // and advertises the derived JSON Schema in tools/list.
  for (const tool of allTools) {
    const handler = tool.handler as (input: unknown) => Promise<ToolResponse<unknown>>;

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true
        }
      },
      async (args: unknown): Promise<CallToolResult> => {
        logger.info('Handling tool call', { toolName: tool.name, args });

        try {
          return toCallToolResult(tool.name, await handler(args));
        } catch (error) {
          logger.error('Tool execution failed', { toolName: tool.name, error });
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          return {
            content: [
              {
                type: 'text',
                text: `Error executing tool '${tool.name}': ${errorMessage}`
              }
            ],
            isError: true
          };
        }
      }
    );
  }

  return server;
}

/**
 * Main entry point
 *
 * serveStdio owns era selection for the connection: a 2026-07-28 client
 * negotiates via server/discover, while a 2025-era client that opens with
 * initialize is pinned to an instance from the same factory, so both are
 * served by identical tool definitions.
 */
function main(): void {
  logger.info('Starting NSF Awards MCP Server', SERVER_INFO);

  try {
    serveStdio(
      ({ era }) => {
        logger.debug('Creating server instance', { era });
        return createServer();
      },
      {
        onerror: (error) => {
          logger.error('Server error', { error });
        }
      }
    );

    logger.info('NSF Awards MCP Server started successfully');

    // Handle shutdown signals
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server if this is the main module
// (resolve symlinks so it also works when launched through an npm bin link)
const entryPath = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main();
}

export { createServer, SERVER_INFO };
