/**
 * MCP tool: search_nsf_awards
 * Primary search tool for NSF awards with multiple filter parameters
 */

import { SearchNSFAwardsSchema, ToolResponse } from '../types/mcp-tools.types.js';
import { NSFAward, NSFSearchParams } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';
import { pickFields } from '../utils/fields.js';

/**
 * Search NSF Awards Tool
 */
export const searchNSFAwardsTool = {
  name: 'search_nsf_awards',
  title: 'Search NSF Awards',
  description:
    'Search NSF awards with multiple filter parameters including keyword, institution, PI name, dates, and amounts',
  inputSchema: SearchNSFAwardsSchema,
  handler: async (input: unknown): Promise<ToolResponse<Partial<NSFAward>[]>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = SearchNSFAwardsSchema.parse(input);

      logger.info('Executing search_nsf_awards', { input: validatedInput });

      // Map MCP input to NSF API parameters
      const searchParams: NSFSearchParams = {
        // Core search
        keyword: validatedInput.keyword,

        // Identifier parameters
        id: validatedInput.id,
        ueiNumber: validatedInput.ueiNumber,
        cfdaNumber: validatedInput.cfdaNumber,

        // Organization parameters
        awardeeName: validatedInput.awardeeName,
        awardeeCity: validatedInput.awardeeCity,
        awardeeStateCode: validatedInput.awardeeStateCode,
        awardeeCountryCode: validatedInput.awardeeCountryCode,
        awardeeZipCode: validatedInput.awardeeZipCode,
        awardeeDistrictCode: validatedInput.awardeeDistrictCode,

        // Principal Investigator parameters
        piFirstName: validatedInput.piFirstName,
        piLastName: validatedInput.piLastName,
        pdPIName: validatedInput.pdPIName,
        coPDPI: validatedInput.coPDPI,

        // Date parameters
        startDateStart: validatedInput.startDateFrom,
        startDateEnd: validatedInput.startDateTo,
        expDateStart: validatedInput.expDateFrom,
        expDateEnd: validatedInput.expDateTo,
        dateStart: validatedInput.dateStart,
        dateEnd: validatedInput.dateEnd,

        // Financial parameters
        estimatedTotalAmtFrom: validatedInput.estimatedTotalAmtFrom,
        estimatedTotalAmtTo: validatedInput.estimatedTotalAmtTo,
        fundsObligatedAmtFrom: validatedInput.fundsObligatedAmtFrom,
        fundsObligatedAmtTo: validatedInput.fundsObligatedAmtTo,

        // Agency and program parameters
        agency: validatedInput.agency,
        awardAgencyCode: validatedInput.awardAgencyCode,
        fundProgramName: validatedInput.fundProgramName,
        primaryProgram: validatedInput.primaryProgram,

        // Award type and classification
        transType: validatedInput.transType,

        // Performance location parameters
        perfLocation: validatedInput.perfLocation,
        perfStateCode: validatedInput.perfStateCode,
        perfCountryCode: validatedInput.perfCountryCode,

        // Parent organization
        parentUeiNumber: validatedInput.parentUeiNumber,

        // Pagination
        offset: validatedInput.offset || 0,
        rpp: Math.min(validatedInput.limit || 25, 25),

        // Server-side active filter (filtering a page client-side would
        // shrink pages and break pagination)
        ActiveAwards: validatedInput.includeExpired === false ? true : undefined
      };

      // Execute search
      const result = await nsfApiClient.searchAwards(searchParams);

      // The live API ignores printFields, so apply the projection here
      const awards = validatedInput.printFields
        ? result.awards.map((award) => pickFields(award, validatedInput.printFields as string))
        : result.awards;

      const executionTime = Date.now() - startTime;

      logger.info('search_nsf_awards completed', {
        resultCount: awards.length,
        executionTime
      });

      return {
        success: true,
        data: awards,
        metadata: {
          totalResults: result.totalResults,
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
