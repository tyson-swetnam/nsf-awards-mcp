/**
 * HTTP client for NSF Awards API with retry logic and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { parseStringPromise } from 'xml2js';
import {
  NSFSearchParams,
  NSFSearchResponse,
  NSFAward,
  NSFErrorResponse,
  NSFProjectOutcome
} from '../types/nsf-api.types.js';
import { logger } from '../utils/logger.js';
import { normalizeToNSFDate } from '../utils/date-utils.js';
import { htmlToText } from '../utils/html-utils.js';

/**
 * Configuration for the NSF API client
 */
export interface NSFApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  preferJSON?: boolean;
}

/**
 * NSF API client class
 */
export class NSFApiClient {
  private client: AxiosInstance;

  constructor(config: NSFApiClientConfig = {}) {
    const {
      baseURL = 'https://www.research.gov/awardapi-service/v1',
      timeout = 30000,
      maxRetries = 3,
      retryDelay = 1000
    } = config;

    // Create axios instance
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        Accept: 'application/json, application/xml',
        'User-Agent': 'NSF-Awards-MCP-Server/1.0'
      }
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: maxRetries,
      retryDelay: (retryCount) => {
        logger.debug(`Retry attempt ${retryCount} after ${retryDelay}ms`);
        return retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
      },
      retryCondition: (error: AxiosError) => {
        // Retry on network errors and 5xx status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('NSF API Request', {
          method: config.method,
          url: config.url,
          params: config.params as unknown
        });
        return config;
      },
      (error: unknown) => {
        logger.error('NSF API Request Error', { error });
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('NSF API Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('NSF API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for NSF awards
   */
  async searchAwards(params: NSFSearchParams): Promise<{
    awards: NSFAward[];
    totalResults: number;
    hasMore: boolean;
  }> {
    try {
      // Process date parameters to ensure correct format
      const processedParams = this.processDateParams(params);

      // Ensure rpp doesn't exceed maximum
      if (processedParams.rpp && processedParams.rpp > 25) {
        processedParams.rpp = 25;
      }

      // An unquoted multi-word awardeeName matches any one of the words
      // ("University of Arizona" returns every "University"); quoting it
      // makes the API match the phrase.
      if (processedParams.awardeeName && /\s/.test(processedParams.awardeeName.trim())) {
        processedParams.awardeeName = `"${processedParams.awardeeName.trim().replace(/"/g, '')}"`;
      }

      const response = await this.client.get<NSFSearchResponse | string>('/awards.json', {
        params: processedParams
      });

      const data = await this.parseResponse<NSFSearchResponse>(response.data);
      this.assertNoServiceError(data);
      const awards = this.normalizeAwards(data.response?.award);

      // Prefer the API's own total; fall back to a full page meaning "maybe more"
      const totalCount = data.response?.metadata?.totalCount;
      const offset = processedParams.offset ?? 0;
      const hasMore =
        totalCount !== undefined
          ? offset + awards.length < totalCount
          : awards.length === (processedParams.rpp || 25);

      return {
        awards,
        totalResults: totalCount ?? awards.length,
        hasMore
      };
    } catch (error) {
      throw this.handleError(error, 'searchAwards');
    }
  }

  /**
   * Get detailed information about a specific award
   */
  async getAwardDetails(awardId: string): Promise<NSFAward | null> {
    try {
      // The API always returns the full record (abstract included);
      // callers strip abstractText when they don't want it.
      const response = await this.client.get<NSFSearchResponse | string>(
        `/awards/${encodeURIComponent(awardId)}.json`
      );

      const data = await this.parseResponse<NSFSearchResponse>(response.data);
      this.assertNoServiceError(data);
      const awards = this.normalizeAwards(data.response?.award);

      return awards.length > 0 ? awards[0] : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error, 'getAwardDetails');
    }
  }

  /**
   * Get the Project Outcomes Report for a specific award.
   * Returns null when the award does not exist or has no report yet.
   */
  async getProjectOutcomes(awardId: string): Promise<NSFProjectOutcome | null> {
    try {
      const response = await this.client.get<NSFSearchResponse | string>(
        `/awards/${encodeURIComponent(awardId)}/projectoutcomes.json`
      );

      const data = await this.parseResponse<NSFSearchResponse>(response.data);
      this.assertNoServiceError(data);
      const award = this.normalizeAwards(data.response?.award)[0];
      const html = award?.projectOutComesReport;

      if (!award || !html) {
        return null;
      }

      return {
        awardId: award.id,
        title: award.title,
        pi: award.pdPIName,
        awardee: award.awardeeName ?? award.awardee,
        startDate: award.startDate,
        expDate: award.expDate,
        outcomesReport: htmlToText(html),
        outcomesReportHtml: html
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error, 'getProjectOutcomes');
    }
  }

  /**
   * Search awards by institution name
   */
  async searchByInstitution(
    institutionName: string,
    additionalParams: Partial<NSFSearchParams> = {}
  ): Promise<{
    awards: NSFAward[];
    totalResults: number;
    hasMore: boolean;
  }> {
    const params: NSFSearchParams = {
      ...additionalParams,
      awardeeName: institutionName,
      rpp: additionalParams.rpp || 25
    };

    return this.searchAwards(params);
  }

  /**
   * Search awards by Principal Investigator
   */
  async searchByPI(
    firstName: string | undefined,
    lastName: string,
    additionalParams: Partial<NSFSearchParams> = {}
  ): Promise<{
    awards: NSFAward[];
    totalResults: number;
    hasMore: boolean;
  }> {
    const params: NSFSearchParams = {
      ...additionalParams,
      piFirstName: firstName,
      piLastName: lastName,
      rpp: additionalParams.rpp || 25
    };

    return this.searchAwards(params);
  }

  /**
   * Process date parameters to ensure correct format
   */
  private processDateParams(params: NSFSearchParams): NSFSearchParams {
    const processed = { ...params };

    // List of date fields that need processing
    const dateFields = [
      'startDateStart',
      'startDateEnd',
      'expDateStart',
      'expDateEnd',
      'dateStart',
      'dateEnd'
    ] as const;

    for (const field of dateFields) {
      if (processed[field]) {
        const normalized = normalizeToNSFDate(processed[field]);
        if (normalized) {
          processed[field] = normalized;
        } else {
          logger.warn(`Invalid date format for ${field}: ${String(processed[field])}`);
          delete processed[field];
        }
      }
    }

    return processed;
  }

  /**
   * The API reports rejected requests (unknown parameters, bad values) as an
   * HTTP 200 with a serviceNotification instead of an error status. Surface
   * them as errors rather than as an empty result set.
   */
  private assertNoServiceError(data: NSFSearchResponse): void {
    const errors = (data.response?.serviceNotification ?? []).filter(
      (n) => n.notificationType?.toUpperCase() === 'ERROR'
    );
    if (errors.length > 0) {
      throw new Error(
        errors.map((n) => `${n.notificationCode}: ${n.notificationMessage}`).join('; ')
      );
    }
  }

  /**
   * Parse response data (handles both JSON and XML)
   */
  private async parseResponse<T>(data: unknown): Promise<T> {
    // If data is already an object, return it
    if (typeof data === 'object' && data !== null) {
      return data as T;
    }

    // If data is a string, it might be XML
    if (typeof data === 'string') {
      try {
        // Try to parse as JSON first
        return JSON.parse(data) as T;
      } catch {
        // If JSON parsing fails, try XML
        try {
          const parsed: unknown = await parseStringPromise(data, {
            explicitArray: false,
            ignoreAttrs: true
          });
          return parsed as T;
        } catch (xmlError) {
          logger.error('Failed to parse response', { data, xmlError });
          throw new Error('Failed to parse API response');
        }
      }
    }

    throw new Error('Unexpected response format');
  }

  /**
   * Normalize awards to always return an array
   */
  private normalizeAwards(awards: NSFAward | NSFAward[] | undefined): NSFAward[] {
    if (!awards) {
      return [];
    }
    return Array.isArray(awards) ? awards : [awards];
  }

  /**
   * Handle and transform API errors
   */
  private handleError(error: unknown, operation: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<NSFErrorResponse>;

      // Extract error message from response
      let errorMessage = `NSF API error during ${operation}`;

      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;

        if (errorData.response?.error) {
          errorMessage = `${errorData.response.error.code}: ${errorData.response.error.message}`;
        } else if (errorData.notification) {
          errorMessage = `${errorData.notification.code}: ${errorData.notification.message}`;
        }
      }

      logger.error(errorMessage, {
        operation,
        status: axiosError.response?.status,
        url: axiosError.config?.url
      });

      return new Error(errorMessage);
    }

    logger.error(`Unexpected error during ${operation}`, { error });
    return error instanceof Error ? error : new Error(String(error));
  }
}

// Export a default instance
export const nsfApiClient = new NSFApiClient();
