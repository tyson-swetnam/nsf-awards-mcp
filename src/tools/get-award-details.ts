/**
 * MCP tool: get_award_details
 * Retrieve complete award information by ID
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  GetAwardDetailsSchema,
  GetAwardDetailsInput,
  ToolResponse
} from '../types/mcp-tools.types.js';
import { NSFAward } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Get Award Details Tool
 */
export const getAwardDetailsTool = {
  name: 'get_award_details',
  description: 'Get detailed information about a specific NSF award by its ID',
  inputSchema: zodToJsonSchema(GetAwardDetailsSchema),
  handler: async (input: unknown): Promise<ToolResponse<NSFAward>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = GetAwardDetailsSchema.parse(input) as GetAwardDetailsInput;

      logger.info('Executing get_award_details', { awardId: validatedInput.awardId });

      // Fetch award details
      const award = await nsfApiClient.getAwardDetails(validatedInput.awardId);

      if (!award) {
        logger.warn('Award not found', { awardId: validatedInput.awardId });

        return {
          success: false,
          error: {
            code: 'AWARD_NOT_FOUND',
            message: `No award found with ID: ${validatedInput.awardId}`
          }
        };
      }

      // Filter out abstract if not requested
      if (!validatedInput.includeAbstract && award.abstractText) {
        const { abstractText, ...awardWithoutAbstract } = award;
        const executionTime = Date.now() - startTime;

        logger.info('get_award_details completed', {
          awardId: validatedInput.awardId,
          executionTime
        });

        return {
          success: true,
          data: awardWithoutAbstract as NSFAward,
          metadata: {
            totalResults: 1,
            offset: 0,
            limit: 1,
            hasMore: false,
            executionTime
          }
        };
      }

      const executionTime = Date.now() - startTime;

      logger.info('get_award_details completed', {
        awardId: validatedInput.awardId,
        executionTime
      });

      return {
        success: true,
        data: award,
        metadata: {
          totalResults: 1,
          offset: 0,
          limit: 1,
          hasMore: false,
          executionTime
        }
      };
    } catch (error) {
      logger.error('get_award_details failed', { error });

      return {
        success: false,
        error: {
          code: 'GET_DETAILS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      };
    }
  }
};