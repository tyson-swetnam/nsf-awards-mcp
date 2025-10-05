/**
 * MCP tool: search_nsf_awards
 * Primary search tool for NSF awards with multiple filter parameters
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  SearchNSFAwardsSchema,
  SearchNSFAwardsInput,
  ToolResponse
} from '../types/mcp-tools.types.js';
import { NSFAward, NSFSearchParams } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Search NSF Awards Tool
 */
export const searchNSFAwardsTool: Tool = {
  name: 'search_nsf_awards',
  description: 'Search NSF awards with multiple filter parameters including keyword, institution, PI name, dates, and amounts',
  inputSchema: SearchNSFAwardsSchema as any,
  handler: async (input: unknown): Promise<ToolResponse<NSFAward[]>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = SearchNSFAwardsSchema.parse(input) as SearchNSFAwardsInput;

      logger.info('Executing search_nsf_awards', { input: validatedInput });

      // Map MCP input to NSF API parameters
      const searchParams: NSFSearchParams = {
        keyword: validatedInput.keyword,
        awardeeName: validatedInput.awardeeName,
        awardeeCity: validatedInput.awardeeCity,
        awardeeStateCode: validatedInput.awardeeStateCode,
        piFirstName: validatedInput.piFirstName,
        piLastName: validatedInput.piLastName,
        startDateFrom: validatedInput.startDateFrom,
        startDateTo: validatedInput.startDateTo,
        expDateFrom: validatedInput.expDateFrom,
        expDateTo: validatedInput.expDateTo,
        estimatedTotalAmtFrom: validatedInput.estimatedTotalAmtFrom,
        estimatedTotalAmtTo: validatedInput.estimatedTotalAmtTo,
        agency: validatedInput.agency,
        fundProgramName: validatedInput.fundProgramName,
        nsfDirectorateName: validatedInput.nsfDirectorateName,
        perfStateCode: validatedInput.perfStateCode,
        offset: validatedInput.offset || 0,
        rpp: Math.min(validatedInput.limit || 25, 25)
      };

      // Execute search
      const result = await nsfApiClient.searchAwards(searchParams);

      // Filter out expired awards if requested
      let filteredAwards = result.awards;
      if (!validatedInput.includeExpired) {
        const currentDate = new Date();
        filteredAwards = result.awards.filter(award => {
          if (!award.expDate) return true;
          try {
            const [month, day, year] = award.expDate.split('/').map(Number);
            const expDate = new Date(year, month - 1, day);
            return expDate >= currentDate;
          } catch {
            return true; // Include if can't parse date
          }
        });
      }

      const executionTime = Date.now() - startTime;

      logger.info('search_nsf_awards completed', {
        resultCount: filteredAwards.length,
        executionTime
      });

      return {
        success: true,
        data: filteredAwards,
        metadata: {
          totalResults: filteredAwards.length,
          offset: validatedInput.offset || 0,
          limit: validatedInput.limit || 25,
          hasMore: result.hasMore,
          executionTime
        }
      };
    } catch (error) {
      logger.error('search_nsf_awards failed', { error });

      return {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
};