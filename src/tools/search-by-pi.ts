/**
 * MCP tool: search_by_pi
 * Search by Principal Investigator
 */

import { SearchByPISchema, ToolResponse } from '../types/mcp-tools.types.js';
import { NSFAward, NSFSearchParams } from '../types/nsf-api.types.js';
import { nsfApiClient } from '../client/nsf-api-client.js';
import { logger } from '../utils/logger.js';

/** Lower-cased words of a name, ignoring punctuation such as "(Former)" commas */
const nameWords = (name: string): string[] =>
  name
    .toLowerCase()
    .split(/[\s,()]+/)
    .filter(Boolean);

/**
 * True when the award names the person as PI or Co-PI. The API's name
 * matching is loose (piFirstName alone matches other people, and a
 * coPDPI last-name search finds every Co-PI sharing the surname), so the
 * merged Co-PI results are checked against both names.
 */
function namesPerson(award: NSFAward, firstName: string | undefined, lastName: string): boolean {
  const wanted = nameWords(`${firstName ?? ''} ${lastName}`);
  const people = [award.pdPIName ?? '', ...(award.coPDPI ?? [])];
  return people.some((person) => {
    const words = nameWords(person);
    return wanted.every((word) => words.includes(word));
  });
}

/** Parse the API's mm/dd/yyyy into a sortable number (0 when absent) */
function startDateValue(award: NSFAward): number {
  if (!award.startDate) {
    return 0;
  }
  const [month, day, year] = award.startDate.split('/').map(Number);
  return new Date(year, month - 1, day).getTime() || 0;
}

/**
 * Most recent first; ties broken by id because the API's own order among
 * ties changes between calls, which would shuffle records across pages.
 */
const byStartDateDesc = (a: NSFAward, b: NSFAward): number =>
  startDateValue(b) - startDateValue(a) || b.id.localeCompare(a.id);

/**
 * Search by Principal Investigator Tool
 */
export const searchByPITool = {
  name: 'search_by_pi',
  title: 'Search NSF Awards by PI',
  description: 'Search NSF awards by Principal Investigator name',
  inputSchema: SearchByPISchema,
  handler: async (input: unknown): Promise<ToolResponse<NSFAward[]>> => {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = SearchByPISchema.parse(input);

      logger.info('Executing search_by_pi', {
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        institution: validatedInput.institution
      });

      const { firstName, lastName, limit } = validatedInput;
      const offset = validatedInput.offset || 0;

      // Build search parameters
      const searchParams: Partial<NSFSearchParams> = {
        awardeeName: validatedInput.institution,
        startDateStart: validatedInput.startDateFrom,
        startDateEnd: validatedInput.startDateTo
      };

      let limitedAwards: NSFAward[];
      let totalMatches: number;
      let hasMoreResults: boolean;

      if (validatedInput.includeCoPIs) {
        // PI and Co-PI results come from two searches, so the API's offset
        // can't page the union. Fetch both in full, merge, then page here.
        const piAwards = await nsfApiClient.searchAllPages({
          ...searchParams,
          piFirstName: firstName,
          piLastName: lastName
        });
        const coPIAwards = await nsfApiClient.searchAllPages({
          ...searchParams,
          coPDPI: firstName ? `${firstName} ${lastName}` : lastName
        });

        const merged = new Map<string, NSFAward>();
        for (const award of [...piAwards, ...coPIAwards]) {
          if (!merged.has(award.id) && namesPerson(award, firstName, lastName)) {
            merged.set(award.id, award);
          }
        }

        const allAwards = [...merged.values()].sort(byStartDateDesc);
        limitedAwards = allAwards.slice(offset, offset + limit);
        totalMatches = allAwards.length;
        hasMoreResults = offset + limitedAwards.length < totalMatches;
      } else {
        const result = await nsfApiClient.searchByPI(firstName, lastName, {
          ...searchParams,
          offset,
          rpp: limit
        });
        limitedAwards = [...result.awards].sort(byStartDateDesc);
        totalMatches = result.totalResults;
        hasMoreResults = result.hasMore;
      }

      const executionTime = Date.now() - startTime;

      // Calculate some statistics
      const totalAmount = limitedAwards.reduce((sum, award) => {
        return sum + (award.estimatedTotalAmt || 0);
      }, 0);

      const institutionDistribution: Record<string, number> = {};
      limitedAwards.forEach((award) => {
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
          totalResults: totalMatches,
          offset,
          limit,
          hasMore: hasMoreResults,
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
