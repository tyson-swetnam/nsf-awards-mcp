/**
 * MCP tool input/output type definitions
 */

import { z } from 'zod';

/**
 * Input schema for search_nsf_awards tool
 */
export const SearchNSFAwardsSchema = z.object({
  // Core search parameters
  keyword: z.string().optional().describe('Keyword to search across all fields'),

  // Field selection parameters (HIGH PRIORITY)
  printFields: z.string().optional().describe('Comma-separated list of fields to return (e.g., "id,title,piLastName,estimatedTotalAmt"). Reduces response size.'),

  // Identifier parameters
  id: z.string().optional().describe('Specific NSF Award ID'),
  ueiNumber: z.string().optional().describe('Unique Entity Identifier (UEI)'),
  cfdaNumber: z.string().optional().describe('Catalog of Federal Domestic Assistance (CFDA) number'),

  // Organization parameters
  awardeeName: z.string().optional().describe('Name of the award recipient organization'),
  awardeeCity: z.string().optional().describe('City of the awardee'),
  awardeeStateCode: z.string().optional().describe('State code of the awardee (e.g., CA, NY)'),
  awardeeCountryCode: z.string().optional().describe('Country code of the awardee (e.g., US, CA, UK)'),
  awardeeZipCode: z.string().optional().describe('ZIP code of the awardee'),
  awardeeDistrictCode: z.string().optional().describe('Congressional district code of the awardee'),

  // Principal Investigator parameters
  piFirstName: z.string().optional().describe('Principal Investigator first name'),
  piLastName: z.string().optional().describe('Principal Investigator last name'),
  pdPIName: z.string().optional().describe('Combined Principal Director/Principal Investigator name search'),
  coPDPI: z.string().optional().describe('Co-Principal Director/Co-Principal Investigator name'),

  // Date parameters - Multiple date range options
  startDateFrom: z.string().optional().describe('Award start date from (mm/dd/yyyy format)'),
  startDateTo: z.string().optional().describe('Award start date to (mm/dd/yyyy format)'),
  expDateFrom: z.string().optional().describe('Award expiration date from (mm/dd/yyyy format)'),
  expDateTo: z.string().optional().describe('Award expiration date to (mm/dd/yyyy format)'),
  dateStart: z.string().optional().describe('General award date from (mm/dd/yyyy format)'),
  dateEnd: z.string().optional().describe('General award date to (mm/dd/yyyy format)'),
  awardsDateStart: z.string().optional().describe('Alternative award date from (mm/dd/yyyy format)'),
  awardsDateEnd: z.string().optional().describe('Alternative award date to (mm/dd/yyyy format)'),

  // Financial parameters
  estimatedTotalAmtFrom: z.number().optional().describe('Minimum estimated total award amount'),
  estimatedTotalAmtTo: z.number().optional().describe('Maximum estimated total award amount'),
  fundsObligatedAmtFrom: z.number().optional().describe('Minimum obligated funds amount'),
  fundsObligatedAmtTo: z.number().optional().describe('Maximum obligated funds amount'),

  // Agency and program parameters
  agency: z.string().optional().describe('Funding agency name'),
  awardAgencyCode: z.string().optional().describe('Award agency code'),
  fundingAgencyCode: z.string().optional().describe('Funding agency code'),
  awardingAgencyCode: z.string().optional().describe('Awarding agency code'),
  fundProgramName: z.string().optional().describe('Funding program name'),
  primaryProgram: z.string().optional().describe('Primary program name'),
  nsfOrganization: z.string().optional().describe('NSF organization code'),
  nsfDirectorateName: z.string().optional().describe('NSF directorate name'),

  // Award type and classification
  transType: z.string().optional().describe('Transaction type (e.g., Grant, Contract, Fellowship)'),
  awardType: z.string().optional().describe('Award type (e.g., Standard Grant, Continuing Grant)'),

  // Performance location parameters
  perfLocation: z.string().optional().describe('Performance location description'),
  perfState: z.string().optional().describe('Performance location state name'),
  perfStateCode: z.string().optional().describe('Performance location state code'),
  perfCountryCode: z.string().optional().describe('Performance location country code'),

  // Parent organization
  parentUeiNumber: z.string().optional().describe('Parent organization UEI number'),

  // Pagination and control
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