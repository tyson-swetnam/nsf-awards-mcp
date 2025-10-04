#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// NSF Awards API base URL
const NSF_API_BASE = "https://api.nsf.gov/services/v1/awards.json";

// Schema for search parameters
const SearchAwardsArgsSchema = z.object({
  keyword: z.string().optional().describe("Keyword to search for in awards"),
  awardNumber: z.string().optional().describe("Specific award number to search for"),
  agency: z.string().optional().describe("NSF agency/directorate code"),
  piFirstName: z.string().optional().describe("Principal Investigator first name"),
  piLastName: z.string().optional().describe("Principal Investigator last name"),
  fundProgramName: z.string().optional().describe("Funding program name"),
  startDateStart: z.string().optional().describe("Start date range beginning (MM/DD/YYYY)"),
  startDateEnd: z.string().optional().describe("Start date range end (MM/DD/YYYY)"),
  expDateStart: z.string().optional().describe("Expiration date range beginning (MM/DD/YYYY)"),
  expDateEnd: z.string().optional().describe("Expiration date range end (MM/DD/YYYY)"),
  offset: z.number().optional().default(1).describe("Starting record offset (default: 1)"),
  printFields: z.string().optional().describe("Comma-separated list of fields to return"),
});

type SearchAwardsArgs = z.infer<typeof SearchAwardsArgsSchema>;

// Interface for NSF Award API response
interface NSFAwardResponse {
  response: {
    award?: Array<{
      id: string;
      title?: string;
      agency?: string;
      awardeeCity?: string;
      awardeeStateCode?: string;
      piFirstName?: string;
      piLastName?: string;
      startDate?: string;
      expDate?: string;
      fundsObligatedAmt?: string;
      abstractText?: string;
      fundProgramName?: string;
      [key: string]: any;
    }>;
  };
}

// Create MCP server
const server = new Server(
  {
    name: "nsf-awards-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: "search_nsf_awards",
      description: "Search the NSF Awards database using various criteria including keywords, award numbers, PI names, agencies, and date ranges. Returns detailed information about matching awards including title, PI, institution, funding amount, and abstract.",
      inputSchema: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Keyword to search for in awards (searches in title, abstract, PI name, etc.)",
          },
          awardNumber: {
            type: "string",
            description: "Specific NSF award number (e.g., '2154420')",
          },
          agency: {
            type: "string",
            description: "NSF agency/directorate code (e.g., 'CSE' for Computer and Information Science and Engineering)",
          },
          piFirstName: {
            type: "string",
            description: "Principal Investigator's first name",
          },
          piLastName: {
            type: "string",
            description: "Principal Investigator's last name",
          },
          fundProgramName: {
            type: "string",
            description: "Name of the funding program",
          },
          startDateStart: {
            type: "string",
            description: "Start date range beginning in MM/DD/YYYY format",
          },
          startDateEnd: {
            type: "string",
            description: "Start date range end in MM/DD/YYYY format",
          },
          expDateStart: {
            type: "string",
            description: "Expiration date range beginning in MM/DD/YYYY format",
          },
          expDateEnd: {
            type: "string",
            description: "Expiration date range end in MM/DD/YYYY format",
          },
          offset: {
            type: "number",
            description: "Starting record offset for pagination (default: 1)",
          },
          printFields: {
            type: "string",
            description: "Comma-separated list of fields to return (e.g., 'id,title,piFirstName,piLastName')",
          },
        },
      },
    },
  ];

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_nsf_awards") {
    try {
      const args = SearchAwardsArgsSchema.parse(request.params.arguments);

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (args.keyword) queryParams.append("keyword", args.keyword);
      if (args.awardNumber) queryParams.append("id", args.awardNumber);
      if (args.agency) queryParams.append("agency", args.agency);
      if (args.piFirstName) queryParams.append("piFirstName", args.piFirstName);
      if (args.piLastName) queryParams.append("piLastName", args.piLastName);
      if (args.fundProgramName) queryParams.append("fundProgramName", args.fundProgramName);
      if (args.startDateStart) queryParams.append("startDateStart", args.startDateStart);
      if (args.startDateEnd) queryParams.append("startDateEnd", args.startDateEnd);
      if (args.expDateStart) queryParams.append("expDateStart", args.expDateStart);
      if (args.expDateEnd) queryParams.append("expDateEnd", args.expDateEnd);
      if (args.printFields) queryParams.append("printFields", args.printFields);
      
      // Always add offset
      queryParams.append("offset", args.offset?.toString() || "1");

      const url = `${NSF_API_BASE}?${queryParams.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NSF API request failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as NSFAwardResponse;

      // Format the response for better readability
      const awards = data.response.award || [];
      
      if (awards.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No awards found matching the search criteria.",
            },
          ],
        };
      }

      const formattedResults = awards.map((award, index) => {
        const parts = [
          `Award ${index + 1}:`,
          `  ID: ${award.id || "N/A"}`,
          `  Title: ${award.title || "N/A"}`,
          `  PI: ${award.piFirstName || ""} ${award.piLastName || ""}`.trim() || "N/A",
          `  Institution: ${award.awardeeCity || ""}${award.awardeeCity && award.awardeeStateCode ? ", " : ""}${award.awardeeStateCode || ""}`.trim() || "N/A",
          `  Agency: ${award.agency || "N/A"}`,
          `  Program: ${award.fundProgramName || "N/A"}`,
          `  Start Date: ${award.startDate || "N/A"}`,
          `  Expiration Date: ${award.expDate || "N/A"}`,
          `  Funds Obligated: ${award.fundsObligatedAmt ? `$${award.fundsObligatedAmt}` : "N/A"}`,
        ];

        if (award.abstractText) {
          parts.push(`  Abstract: ${award.abstractText.substring(0, 500)}${award.abstractText.length > 500 ? "..." : ""}`);
        }

        return parts.join("\n");
      });

      const resultText = [
        `Found ${awards.length} award(s):\n`,
        ...formattedResults,
      ].join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid arguments: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
        );
      }
      throw error;
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NSF Awards MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
