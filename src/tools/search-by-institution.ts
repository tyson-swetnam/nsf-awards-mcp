/**
 * MCP tool: search_by_institution
 * Institution-specific award searches
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  SearchByInstitutionSchema,
  SearchByInstitutionInput,
  ToolResponse
} from '../types/mcp-tools.types.js';
import { NSFAward, NSFSearchParams } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Search by Institution Tool
 */
export const searchByInstitutionTool = {
  name: 'search_by_institution',
  description: 'Search NSF awards by institution name with optional filters',
  inputSchema: zodToJsonSchema(SearchByInstitutionSchema),
  handler: async (input: unknown): Promise<ToolResponse<NSFAward[]>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = SearchByInstitutionSchema.parse(input) as SearchByInstitutionInput;

      logger.info('Executing search_by_institution', {
        institution: validatedInput.institutionName,
        stateCode: validatedInput.stateCode
      });

      // Build search parameters
      const searchParams: Partial<NSFSearchParams> = {
        awardeeStateCode: validatedInput.stateCode,
        startDateFrom: validatedInput.startDateFrom,
        startDateTo: validatedInput.startDateTo,
        offset: validatedInput.offset || 0,
        rpp: Math.min(validatedInput.limit || 25, 25)
      };

      // Execute search
      const result = await nsfApiClient.searchByInstitution(
        validatedInput.institutionName,
        searchParams
      );

      // If includeSubawards is false, filter out subawards
      let filteredAwards = result.awards;
      if (!validatedInput.includeSubawards) {
        filteredAwards = result.awards.filter(award => {
          // Subawards typically have transType of 'SUBAWARD' or specific indicators
          return !award.transType ||
                 !award.transType.toLowerCase().includes('subaward');
        });
      }

      const executionTime = Date.now() - startTime;

      // Group awards by program if there are results
      const programDistribution: Record<string, number> = {};
      filteredAwards.forEach(award => {
        const program = award.fundProgramName || award.primaryProgram || 'Unknown';
        programDistribution[program] = (programDistribution[program] || 0) + 1;
      });

      logger.info('search_by_institution completed', {
        institution: validatedInput.institutionName,
        resultCount: filteredAwards.length,
        programCount: Object.keys(programDistribution).length,
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
      logger.error('search_by_institution failed', { error });

      return {
        success: false,
        error: {
          code: 'INSTITUTION_SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
};