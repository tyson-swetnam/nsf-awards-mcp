/**
 * MCP tool input/output type definitions
 */

import { z } from 'zod';
import { normalizeToNSFDate, validateDateRange } from '../utils/date-utils.js';

/**
 * Date filter. Rejected up front rather than dropped later, so a typo can't
 * silently turn into an unfiltered search.
 */
const nsfDate = (description: string) =>
  z
    .string()
    .refine((value) => normalizeToNSFDate(value) !== undefined, {
      message: 'Invalid date: expected mm/dd/yyyy or yyyy-mm-dd'
    })
    .optional()
    .describe(`${description} (mm/dd/yyyy or yyyy-mm-dd)`);

// The API serves at most 25 records per page and nothing past record 10000
const limit = z
  .number()
  .int()
  .min(1)
  .max(25)
  .optional()
  .default(25)
  .describe('Number of results to return (1-25)');
const offset = z
  .number()
  .int()
  .min(0)
  .max(9999)
  .optional()
  .describe('0-based record offset for pagination (the API stops at 9999)');

const DATE_RANGES = [
  ['startDateFrom', 'startDateTo'],
  ['expDateFrom', 'expDateTo'],
  ['dateStart', 'dateEnd']
] as const;

/**
 * Reject a range whose start is after its end; the API would just return
 * nothing, which reads as "no matching awards".
 */
function checkDateRanges(input: Record<string, unknown>, ctx: z.RefinementCtx): void {
  for (const [fromKey, toKey] of DATE_RANGES) {
    const from = normalizeToNSFDate(input[fromKey] as string);
    const to = normalizeToNSFDate(input[toKey] as string);
    if (from && to && !validateDateRange(from, to)) {
      ctx.addIssue({
        code: 'custom',
        path: [toKey],
        message: `${fromKey} (${from}) is after ${toKey} (${to})`
      });
    }
  }
}

/**
 * Input schema for search_nsf_awards tool
 */
export const SearchNSFAwardsSchema = z
  .object({
    // Core search parameters
    keyword: z.string().optional().describe('Keyword to search across all fields'),

    // Field selection parameters (HIGH PRIORITY)
    printFields: z
      .string()
      .optional()
      .describe(
        'Comma-separated list of fields to return (e.g., "id,title,piLastName,estimatedTotalAmt"). Reduces response size; omit for full records.'
      ),

    // Identifier parameters
    id: z.string().optional().describe('Specific NSF Award ID'),
    ueiNumber: z.string().optional().describe('Unique Entity Identifier (UEI)'),
    cfdaNumber: z
      .string()
      .optional()
      .describe('Catalog of Federal Domestic Assistance (CFDA) number'),

    // Organization parameters
    awardeeName: z.string().optional().describe('Name of the award recipient organization'),
    awardeeCity: z
      .string()
      .optional()
      .describe(
        'City of the awardee (the API matches any word of a multi-word city, so pair it with awardeeStateCode)'
      ),
    awardeeStateCode: z.string().optional().describe('State code of the awardee (e.g., CA, NY)'),
    awardeeCountryCode: z
      .string()
      .optional()
      .describe('Country code of the awardee (e.g., US, CA, UK)'),
    awardeeZipCode: z.string().optional().describe('ZIP code of the awardee'),
    awardeeDistrictCode: z
      .string()
      .optional()
      .describe('Congressional district code of the awardee'),

    // Principal Investigator parameters
    piFirstName: z.string().optional().describe('Principal Investigator first name'),
    piLastName: z.string().optional().describe('Principal Investigator last name'),
    pdPIName: z
      .string()
      .optional()
      .describe('Combined Principal Director/Principal Investigator name search'),
    coPDPI: z.string().optional().describe('Co-Principal Director/Co-Principal Investigator name'),

    // Date parameters - Multiple date range options
    startDateFrom: nsfDate('Award start date from'),
    startDateTo: nsfDate('Award start date to'),
    expDateFrom: nsfDate('Award expiration date from'),
    expDateTo: nsfDate('Award expiration date to'),
    dateStart: nsfDate('Award (action) date from'),
    dateEnd: nsfDate('Award (action) date to'),

    // Financial parameters
    estimatedTotalAmtFrom: z.number().optional().describe('Minimum estimated total award amount'),
    estimatedTotalAmtTo: z.number().optional().describe('Maximum estimated total award amount'),
    fundsObligatedAmtFrom: z.number().optional().describe('Minimum obligated funds amount'),
    fundsObligatedAmtTo: z.number().optional().describe('Maximum obligated funds amount'),

    // Agency and program parameters. awardAgencyCode and primaryProgram are not
    // offered: the live API returns no results for any value of either.
    agency: z.string().optional().describe('Agency abbreviation (NSF data uses "NSF")'),
    fundProgramName: z
      .string()
      .optional()
      .describe('Funding program name, matched as a phrase (e.g. "Ecosystem Studies")'),

    // Award type and classification
    transType: z
      .string()
      .optional()
      .describe('Transaction type (e.g., Grant, Contract, Fellowship)'),

    // Performance location parameters
    perfLocation: z
      .string()
      .optional()
      .describe('Performance location (organization) name, matched as a phrase'),
    perfStateCode: z.string().optional().describe('Performance location state code'),
    perfCountryCode: z.string().optional().describe('Performance location country code'),

    // Parent organization
    parentUeiNumber: z.string().optional().describe('Parent organization UEI number'),

    // Pagination and control
    offset,
    limit,
    includeExpired: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include expired awards in results (false returns active awards only)')
  })
  .superRefine(checkDateRanges);

export type SearchNSFAwardsInput = z.infer<typeof SearchNSFAwardsSchema>;

/**
 * Input schema for get_award_details tool
 */
export const GetAwardDetailsSchema = z.object({
  awardId: z.string().trim().min(1).describe('NSF Award ID to retrieve details for'),
  includeAbstract: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include award abstract in response')
});

export type GetAwardDetailsInput = z.infer<typeof GetAwardDetailsSchema>;

/**
 * Input schema for get_project_outcomes tool
 */
export const GetProjectOutcomesSchema = z.object({
  awardId: z.string().trim().min(1).describe('NSF Award ID to retrieve project outcomes for')
});

export type GetProjectOutcomesInput = z.infer<typeof GetProjectOutcomesSchema>;

/**
 * Input schema for search_by_institution tool
 */
export const SearchByInstitutionSchema = z
  .object({
    institutionName: z.string().trim().min(1).describe('Name of the institution'),
    stateCode: z.string().optional().describe('State code to filter results'),
    startDateFrom: nsfDate('Award start date from'),
    startDateTo: nsfDate('Award start date to'),
    offset,
    limit
  })
  .superRefine(checkDateRanges);

export type SearchByInstitutionInput = z.infer<typeof SearchByInstitutionSchema>;

/**
 * Input schema for search_by_pi tool
 */
export const SearchByPISchema = z
  .object({
    firstName: z.string().optional().describe('Principal Investigator first name'),
    lastName: z.string().trim().min(1).describe('Principal Investigator last name (required)'),
    institution: z.string().optional().describe('Institution name to filter results'),
    startDateFrom: nsfDate('Award start date from'),
    startDateTo: nsfDate('Award start date to'),
    includeCoPIs: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Also include awards where the person is a Co-PI (matched on firstName too when given; give firstName or institution for common surnames)'
      ),
    offset,
    limit
  })
  .superRefine(checkDateRanges);

export type SearchByPIInput = z.infer<typeof SearchByPISchema>;

/**
 * Standardized tool response structure
 */
export interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    totalResults?: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    executionTime?: number;
  };
}
