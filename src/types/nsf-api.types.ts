/**
 * Type definitions for NSF Awards API responses
 * Based on NSF API v1 documentation
 */

/**
 * Base award information structure
 */
export interface NSFAward {
  // Core identifiers
  id: string;
  title: string;

  // Awardee/Organization fields
  awardee: string;
  awardeeName?: string;
  awardeeCity?: string;
  awardeeStateCode?: string;
  awardeeCountryCode?: string;
  awardeeZipCode?: string;
  awardeeDistrictCode?: string;
  awardeeAddress?: string;
  awardeeOrganization?: string;

  // Award special attention fields (default API fields)
  awdSpAttnCode?: string;
  awdSpAttnDesc?: string;

  // Principal Investigator fields
  piFirstName?: string;
  piMiddleInitial?: string;
  piLastName?: string;
  piEmail?: string;
  pdPIName?: string;
  coPDPI?: string[];

  // Date fields
  startDate?: string;
  expDate?: string;

  // Performance location fields
  perfLocation?: string;
  perfCity?: string;
  perfState?: string;
  perfStateCode?: string;
  perfCountryCode?: string;
  perfCountryName?: string;
  perfZipCode?: string;
  perfDistrictCode?: string;
  perfAddress?: string;

  // Financial fields
  estimatedTotalAmt?: number;
  fundsObligatedAmt?: number;
  awardTotalIntnAmount?: number;

  // Agency and program fields
  agency?: string;
  awardAgencyCode?: string;
  fundAgencyCode?: string;
  awardingAgencyCode?: string;
  fundProgramName?: string;
  primaryProgram?: string;
  nsfDirectorateName?: string;

  // Award classification
  transType?: string;
  awardType?: string;
  cfdaNumber?: string;

  // Program Officer fields
  poName?: string;
  poEmail?: string;
  poPhone?: string;

  // Identifier fields
  ueiNumber?: string;
  parentUeiNumber?: string;
  dunsNumber?: string; // Legacy
  parentDunsNumber?: string; // Legacy

  // Research outputs
  abstractText?: string;
  publicationResearch?: string[];
  publicationConference?: string[];
  /** HTML Project Outcomes Report; note the API's capital "C" spelling */
  projectOutComesReport?: string;
}

/**
 * Search response envelope
 */
export interface NSFSearchResponse {
  response: {
    award?: NSFAward | NSFAward[];
    metadata?: NSFResponseMetadata;
    serviceNotification?: NSFServiceNotification[];
  };
}

/**
 * Paging metadata returned alongside search results
 */
export interface NSFResponseMetadata {
  offset?: number;
  rpp?: number;
  totalCount?: number;
}

/**
 * Notification the API returns (with HTTP 200) for rejected requests,
 * e.g. AwardAPI-002 "Invalid parameter(s) sent in the request"
 */
export interface NSFServiceNotification {
  notificationCode: string;
  notificationMessage: string;
  notificationType: string;
}

/**
 * Project Outcomes Report for an award. The API returns it as the
 * `projectOutComesReport` HTML field on the award record.
 */
export interface NSFProjectOutcome {
  awardId: string;
  title: string;
  pi?: string;
  awardee?: string;
  startDate?: string;
  expDate?: string;
  /** The report as plain text */
  outcomesReport: string;
  /** The report as returned by the API (HTML) */
  outcomesReportHtml: string;
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
  piFirstName?: string;
  piLastName?: string;
  pdPIName?: string;
  coPDPI?: string;
  // Date ranges, format mm/dd/yyyy. The API rejects the *From/*To spellings
  // (AwardAPI-002 "Invalid parameter(s)"), so only these names are valid.
  startDateStart?: string;
  startDateEnd?: string;
  expDateStart?: string;
  expDateEnd?: string;
  dateStart?: string;
  dateEnd?: string;
  estimatedTotalAmtFrom?: number;
  estimatedTotalAmtTo?: number;
  estimatedAwardAmountFrom?: number;
  estimatedAwardAmountTo?: number;
  fundsObligatedAmtFrom?: number;
  fundsObligatedAmtTo?: number;
  id?: string;
  agency?: string;
  awardAgencyCode?: string;
  fundProgramName?: string;
  primaryProgram?: string;
  transType?: string;
  cfdaNumber?: string;
  perfStateCode?: string;
  perfCountryCode?: string;
  perfLocation?: string;
  ueiNumber?: string;
  parentUeiNumber?: string;
  /** true limits results to active awards */
  ActiveAwards?: boolean;
  /** true limits results to expired awards */
  ExpiredAwards?: boolean;
  offset?: number; // 0-based record offset
  rpp?: number; // Results per page, max 25
  printFields?: string; // Accepted but ignored by the live API
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
