/**
 * Type definitions for NSF Awards API responses
 * Based on NSF API v1 documentation
 */

/**
 * Base award information structure
 */
export interface NSFAward {
  id: string;
  title: string;
  awardee: string;
  awardeeCity?: string;
  awardeeStateCode?: string;
  awardeeCountryCode?: string;
  awardeeZipCode?: string;
  piFirstName?: string;
  piMiddleInitial?: string;
  piLastName?: string;
  piEmail?: string;
  coPDPI?: string[];
  startDate?: string;
  expDate?: string;
  awardeeName?: string;
  awardeeAddress?: string;
  perfLocation?: string;
  primaryProgram?: string;
  agency?: string;
  awardAgencyCode?: string;
  fundProgramName?: string;
  awardTotalIntnAmount?: number;
  estimatedTotalAmt?: number;
  fundsObligatedAmt?: number;
  dunsNumber?: string;
  ueiNumber?: string;
  parentDunsNumber?: string;
  parentUeiNumber?: string;
  fundAgencyCode?: string;
  awardingAgencyCode?: string;
  abstractText?: string;
  poName?: string;
  poEmail?: string;
  awardeeOrganization?: string;
  transType?: string;
  awardType?: string;
  cfdaNumber?: string;
  nsfDirectorateName?: string;
  perfState?: string;
  perfStateCode?: string;
  perfCountryCode?: string;
  perfCountryName?: string;
  publicationResearch?: string[];
  publicationConference?: string[];
  projectOutcomesReport?: string;
  perfZipCode?: string;
  pdPIName?: string;
}

/**
 * Search response envelope
 */
export interface NSFSearchResponse {
  response: {
    award?: NSFAward | NSFAward[];
  };
}

/**
 * Project outcomes structure
 */
export interface NSFProjectOutcome {
  awardId: string;
  awardTitle: string;
  pi: string;
  organization: string;
  accomplishments?: string;
  publications?: Array<{
    title: string;
    authors?: string;
    journalName?: string;
    year?: string;
    doi?: string;
  }>;
  conferences?: Array<{
    title: string;
    location?: string;
    year?: string;
  }>;
  websites?: string[];
  otherProducts?: string[];
  impacts?: string;
}

/**
 * Project outcomes response envelope
 */
export interface NSFProjectOutcomesResponse {
  response: {
    projectOutcomes?: NSFProjectOutcome | NSFProjectOutcome[];
  };
}

/**
 * API error response structure
 */
export interface NSFErrorResponse {
  response?: {
    error?: {
      code: string;
      message: string;
    };
  };
  notification?: {
    code: string;
    message: string;
  };
}

/**
 * Search parameters for NSF Awards API
 */
export interface NSFSearchParams {
  keyword?: string;
  awardeeCity?: string;
  awardeeStateCode?: string;
  awardeeCountryCode?: string;
  awardeeZipCode?: string;
  awardeeDistrictCode?: string;
  awardeeName?: string;
  awardeeOrganization?: string;
  piFirstName?: string;
  piLastName?: string;
  pdPIName?: string;
  coPDPI?: string;
  startDateFrom?: string; // Format: mm/dd/yyyy
  startDateTo?: string;   // Format: mm/dd/yyyy
  expDateFrom?: string;    // Format: mm/dd/yyyy
  expDateTo?: string;      // Format: mm/dd/yyyy
  dateStart?: string;      // Format: mm/dd/yyyy
  dateEnd?: string;        // Format: mm/dd/yyyy
  awardsDateStart?: string; // Format: mm/dd/yyyy
  awardsDateEnd?: string;   // Format: mm/dd/yyyy
  estimatedTotalAmtFrom?: number;
  estimatedTotalAmtTo?: number;
  estimatedAwardAmountFrom?: number;
  estimatedAwardAmountTo?: number;
  id?: string;
  agency?: string;
  awardAgencyCode?: string;
  fundingAgencyCode?: string;
  awardingAgencyCode?: string;
  fundProgramName?: string;
  primaryProgram?: string;
  transType?: string;
  awardType?: string;
  cfdaNumber?: string;
  nsfOrganization?: string;
  nsfDirectorateName?: string;
  perfState?: string;
  perfStateCode?: string;
  perfCountryCode?: string;
  perfLocation?: string;
  ueiNumber?: string;
  parentUeiNumber?: string;
  offset?: number;
  rpp?: number; // Results per page, max 25
  printFields?: string;
}

/**
 * Common API parameters
 */
export interface NSFApiParams {
  format?: 'json' | 'xml';
  offset?: number;
  rpp?: number; // Results per page
  printFields?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationInfo {
  offset: number;
  limit: number;
  totalResults?: number;
  hasMore: boolean;
}