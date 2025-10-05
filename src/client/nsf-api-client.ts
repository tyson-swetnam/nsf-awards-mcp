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
  NSFProjectOutcomesResponse,
  NSFErrorResponse,
  NSFProjectOutcome
} from '../types/nsf-api.types.js';
import { logger } from '../utils/logger.js';
import { normalizeToNSFDate } from '../utils/date-utils.js';

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
      baseURL = 'https://api.nsf.gov/services/v1',
      timeout = 30000,
      maxRetries = 3,
      retryDelay = 1000
    } = config;

    // Create axios instance
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Accept': 'application/json, application/xml',
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
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false);
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('NSF API Request', {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('NSF API Request Error', { error });
        return Promise.reject(error);
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
      (error) => {
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

      const response = await this.client.get<NSFSearchResponse | string>('/awards.json', {
        params: {
          ...processedParams,
          printFields: params.printFields || undefined
        }
      });

      const data = await this.parseResponse<NSFSearchResponse>(response.data);
      const awards = this.normalizeAwards(data.response?.award);

      // Determine if there are more results
      const hasMore = awards.length === (params.rpp || 25);

      return {
        awards,
        totalResults: awards.length,
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
      const response = await this.client.get<NSFSearchResponse | string>(
        `/awards/${awardId}.json`
      );

      const data = await this.parseResponse<NSFSearchResponse>(response.data);
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
   * Get project outcomes for a specific award
   */
  async getProjectOutcomes(awardId: string): Promise<NSFProjectOutcome | null> {
    try {
      const response = await this.client.get<NSFProjectOutcomesResponse | string>(
        `/awards/${awardId}/projectoutcomes.json`
      );

      const data = await this.parseResponse<NSFProjectOutcomesResponse>(response.data);
      const outcomes = this.normalizeProjectOutcomes(data.response?.projectOutcomes);

      return outcomes.length > 0 ? outcomes[0] : null;
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
      awardeeOrganization: institutionName,
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
      'startDateFrom', 'startDateTo',
      'expDateFrom', 'expDateTo',
      'dateStart', 'dateEnd',
      'awardsDateStart', 'awardsDateEnd'
    ] as const;

    for (const field of dateFields) {
      if (processed[field]) {
        const normalized = normalizeToNSFDate(processed[field] as string);
        if (normalized) {
          (processed as any)[field] = normalized;
        } else {
          logger.warn(`Invalid date format for ${field}: ${processed[field]}`);
          delete (processed as any)[field];
        }
      }
    }

    return processed;
  }

  /**
   * Parse response data (handles both JSON and XML)
   */
  private async parseResponse<T>(data: any): Promise<T> {
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
          const parsed = await parseStringPromise(data, {
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
   * Normalize project outcomes to always return an array
   */
  private normalizeProjectOutcomes(
    outcomes: NSFProjectOutcome | NSFProjectOutcome[] | undefined
  ): NSFProjectOutcome[] {
    if (!outcomes) {
      return [];
    }
    return Array.isArray(outcomes) ? outcomes : [outcomes];
  }

  /**
   * Handle and transform API errors
   */
  private handleError(error: any, operation: string): Error {
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