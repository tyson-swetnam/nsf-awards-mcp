/**
 * MCP tool: search_by_pi
 * Search by Principal Investigator
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  SearchByPISchema,
  SearchByPIInput,
  ToolResponse
} from '../types/mcp-tools.types.js';
import { NSFAward, NSFSearchParams } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Search by Principal Investigator Tool
 */
export const searchByPITool = {
  name: 'search_by_pi',
  description: 'Search NSF awards by Principal Investigator name',
  inputSchema: zodToJsonSchema(SearchByPISchema),
  handler: async (input: unknown): Promise<ToolResponse<NSFAward[]>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = SearchByPISchema.parse(input) as SearchByPIInput;

      logger.info('Executing search_by_pi', {
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        institution: validatedInput.institution
      });

      // Build search parameters
      const searchParams: Partial<NSFSearchParams> = {
        awardeeOrganization: validatedInput.institution,
        startDateFrom: validatedInput.startDateFrom,
        startDateTo: validatedInput.startDateTo,
        offset: validatedInput.offset || 0,
        rpp: Math.min(validatedInput.limit || 25, 25)
      };

      // Execute primary search for PI
      const result = await nsfApiClient.searchByPI(
        validatedInput.firstName,
        validatedInput.lastName,
        searchParams
      );

      let allAwards = [...result.awards];
      let hasMoreResults = result.hasMore;

      // If includeCoPIs is true, also search for Co-PI matches
      if (validatedInput.includeCoPIs) {
        const coPIParams: NSFSearchParams = {
          ...searchParams,
          coPDPI: validatedInput.lastName,
          piFirstName: undefined,
          piLastName: undefined
        };

        try {
          const coPIResult = await nsfApiClient.searchAwards(coPIParams);

          // Merge results and remove duplicates based on award ID
          const awardIds = new Set(allAwards.map(a => a.id));
          const uniqueCoPIAwards = coPIResult.awards.filter(
            award => !awardIds.has(award.id)
          );

          allAwards = [...allAwards, ...uniqueCoPIAwards];
          hasMoreResults = hasMoreResults || coPIResult.hasMore;
        } catch (coPIError) {
          logger.warn('Co-PI search failed, returning PI results only', { coPIError });
        }
      }

      // Sort awards by start date (most recent first)
      allAwards.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        try {
          const [aMonth, aDay, aYear] = a.startDate.split('/').map(Number);
          const [bMonth, bDay, bYear] = b.startDate.split('/').map(Number);
          const aDate = new Date(aYear, aMonth - 1, aDay);
          const bDate = new Date(bYear, bMonth - 1, bDay);
          return bDate.getTime() - aDate.getTime();
        } catch {
          return 0;
        }
      });

      // Apply limit after merging and sorting
      const limitedAwards = allAwards.slice(0, validatedInput.limit || 25);

      const executionTime = Date.now() - startTime;

      // Calculate some statistics
      const totalAmount = limitedAwards.reduce((sum, award) => {
        return sum + (award.estimatedTotalAmt || 0);
      }, 0);

      const institutionDistribution: Record<string, number> = {};
      limitedAwards.forEach(award => {
        const org = award.awardeeOrganization || award.awardeeName || 'Unknown';
        institutionDistribution[org] = (institutionDistribution[org] || 0) + 1;
      });

      logger.info('search_by_pi completed', {
        piName: `${validatedInput.firstName || ''} ${validatedInput.lastName}`.trim(),
        resultCount: limitedAwards.length,
        totalAmount,
        institutionCount: Object.keys(institutionDistribution).length,
        executionTime
      });

      return {
        success: true,
        data: limitedAwards,
        metadata: {
          totalResults: limitedAwards.length,
          offset: validatedInput.offset || 0,
          limit: validatedInput.limit || 25,
          hasMore: hasMoreResults || allAwards.length > limitedAwards.length,
          executionTime
        }
      };
    } catch (error) {
      logger.error('search_by_pi failed', { error });

      return {
        success: false,
        error: {
          code: 'PI_SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
};