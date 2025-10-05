#!/usr/bin/env node

/**
 * NSF Awards MCP Server
 * Provides structured access to NSF grant and award information through MCP tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { allTools } from './tools/index.js';
import { logger } from './utils/logger.js';

/**
 * Server metadata
 */
const SERVER_INFO = {
  name: 'nsf-awards-mcp',
  version: '1.0.0',
  description: 'MCP server for NSF Awards API integration'
};

/**
 * Create and configure the MCP server
 */
async function createServer(): Promise<Server> {
  logger.info('Starting NSF Awards MCP Server', SERVER_INFO);

  // Create the server instance
  const server = new Server(
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

  /**
   * Handle list_tools request
   * Returns all available tools with their schemas
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling list_tools request');

    const tools = allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return {
      tools
    };
  });

  /**
   * Handle call_tool request
   * Routes tool calls to appropriate handlers
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;

    logger.info('Handling tool call', { toolName, args });

    // Find the requested tool
    const tool = allTools.find(t => t.name === toolName);

    if (!tool) {
      logger.error('Tool not found', { toolName });
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool '${toolName}' not found. Available tools: ${allTools.map(t => t.name).join(', ')}`
      );
    }

    try {
      // Execute the tool handler with proper typing
      const handler = tool.handler as (input: unknown) => Promise<any>;
      const result = await handler(args);

      // Format the response based on success/failure
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ],
          isError: false
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${result.error?.message || 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      logger.error('Tool execution failed', { toolName, error });

      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${toolName}': ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Create the server
    const server = await createServer();

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Handle server errors
    server.onerror = (error) => {
      logger.error('Server error', { error });
    };

    // Handle transport closure
    transport.onclose = () => {
      logger.info('Transport closed, shutting down server');
      process.exit(0);
    };

    // Connect server to transport
    await server.connect(transport);

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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error', { error });
    process.exit(1);
  });
}

export { createServer, SERVER_INFO };