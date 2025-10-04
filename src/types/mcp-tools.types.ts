/**
 * MCP tool input/output type definitions
 */

import { z } from 'zod';

/**
 * Input schema for search_nsf_awards tool
 */
export const SearchNSFAwardsSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search across all fields'),
  awardeeName: z.string().optional().describe('Name of the award recipient organization'),
  awardeeCity: z.string().optional().describe('City of the awardee'),
  awardeeStateCode: z.string().optional().describe('State code of the awardee (e.g., CA, NY)'),
  piFirstName: z.string().optional().describe('Principal Investigator first name'),
  piLastName: z.string().optional().describe('Principal Investigator last name'),
  startDateFrom: z.string().optional().describe('Award start date from (mm/dd/yyyy format)'),
  startDateTo: z.string().optional().describe('Award start date to (mm/dd/yyyy format)'),
  expDateFrom: z.string().optional().describe('Award expiration date from (mm/dd/yyyy format)'),
  expDateTo: z.string().optional().describe('Award expiration date to (mm/dd/yyyy format)'),
  estimatedTotalAmtFrom: z.number().optional().describe('Minimum award amount'),
  estimatedTotalAmtTo: z.number().optional().describe('Maximum award amount'),
  agency: z.string().optional().describe('Funding agency name'),
  fundProgramName: z.string().optional().describe('Funding program name'),
  nsfDirectorateName: z.string().optional().describe('NSF directorate name'),
  perfStateCode: z.string().optional().describe('Performance location state code'),
  offset: z.number().optional().describe('Pagination offset'),
  limit: z.number().optional().default(25).describe('Number of results to return (max 25)'),
  includeExpired: z.boolean().optional().default(true).describe('Include expired awards in results')
});

export type SearchNSFAwardsInput = z.infer<typeof SearchNSFAwardsSchema>;

/**
 * Input schema for get_award_details tool
 */
export const GetAwardDetailsSchema = z.object({
  awardId: z.string().describe('NSF Award ID to retrieve details for'),
  includeAbstract: z.boolean().optional().default(true).describe('Include award abstract in response')
});

export type GetAwardDetailsInput = z.infer<typeof GetAwardDetailsSchema>;

/**
 * Input schema for get_project_outcomes tool
 */
export const GetProjectOutcomesSchema = z.object({
  awardId: z.string().describe('NSF Award ID to retrieve project outcomes for')
});

export type GetProjectOutcomesInput = z.infer<typeof GetProjectOutcomesSchema>;

/**
 * Input schema for search_by_institution tool
 */
export const SearchByInstitutionSchema = z.object({
  institutionName: z.string().describe('Name of the institution'),
  stateCode: z.string().optional().describe('State code to filter results'),
  startDateFrom: z.string().optional().describe('Award start date from (mm/dd/yyyy format)'),
  startDateTo: z.string().optional().describe('Award start date to (mm/dd/yyyy format)'),
  includeSubawards: z.boolean().optional().default(false).describe('Include subawards in results'),
  offset: z.number().optional().describe('Pagination offset'),
  limit: z.number().optional().default(25).describe('Number of results to return (max 25)')
});

export type SearchByInstitutionInput = z.infer<typeof SearchByInstitutionSchema>;

/**
 * Input schema for search_by_pi tool
 */
export const SearchByPISchema = z.object({
  firstName: z.string().optional().describe('Principal Investigator first name'),
  lastName: z.string().describe('Principal Investigator last name (required)'),
  institution: z.string().optional().describe('Institution name to filter results'),
  startDateFrom: z.string().optional().describe('Award start date from (mm/dd/yyyy format)'),
  startDateTo: z.string().optional().describe('Award start date to (mm/dd/yyyy format)'),
  includeCoPIs: z.boolean().optional().default(false).describe('Include awards where person is Co-PI'),
  offset: z.number().optional().describe('Pagination offset'),
  limit: z.number().optional().default(25).describe('Number of results to return (max 25)')
});

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