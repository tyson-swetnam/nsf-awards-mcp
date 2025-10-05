/**
 * MCP tool: get_project_outcomes
 * Fetch project outcomes for an award
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  GetProjectOutcomesSchema,
  GetProjectOutcomesInput,
  ToolResponse
} from '../types/mcp-tools.types.js';
import { NSFProjectOutcome } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Get Project Outcomes Tool
 */
export const getProjectOutcomesTool = {
  name: 'get_project_outcomes',
  description: 'Get project outcomes, publications, and results for a specific NSF award',
  inputSchema: zodToJsonSchema(GetProjectOutcomesSchema),
  handler: async (input: unknown): Promise<ToolResponse<NSFProjectOutcome>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = GetProjectOutcomesSchema.parse(input) as GetProjectOutcomesInput;

      logger.info('Executing get_project_outcomes', { awardId: validatedInput.awardId });

      // Fetch project outcomes
      const outcomes = await nsfApiClient.getProjectOutcomes(validatedInput.awardId);

      if (!outcomes) {
        logger.warn('Project outcomes not found', { awardId: validatedInput.awardId });

        return {
          success: false,
          error: {
            code: 'OUTCOMES_NOT_FOUND',
            message: `No project outcomes found for award ID: ${validatedInput.awardId}. This may be because the project has not yet submitted outcomes or the award is too recent.`
          }
        };
      }

      const executionTime = Date.now() - startTime;

      // Count publications and conferences for metadata
      const publicationCount = outcomes.publications?.length || 0;
      const conferenceCount = outcomes.conferences?.length || 0;

      logger.info('get_project_outcomes completed', {
        awardId: validatedInput.awardId,
        publicationCount,
        conferenceCount,
        executionTime
      });

      return {
        success: true,
        data: outcomes,
        metadata: {
          executionTime,
          totalResults: 1,
          offset: 0,
          limit: 1,
          hasMore: false
        }
      };
    } catch (error) {
      logger.error('get_project_outcomes failed', { error });

      return {
        success: false,
        error: {
          code: 'GET_OUTCOMES_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
};