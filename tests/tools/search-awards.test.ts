/**
 * Unit tests for search_nsf_awards tool
 */

import { searchNSFAwardsTool } from '../../src/tools/search-awards';
import { nsfApiClient } from '../../src/client/nsf-api-client';
import { NSFAward } from '../../src/types/nsf-api.types';

// Mock the NSF API client
jest.mock('../../src/client/nsf-api-client');

describe('search_nsf_awards tool', () => {
  const mockClient = nsfApiClient as jest.Mocked<typeof nsfApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(searchNSFAwardsTool.name).toBe('search_nsf_awards');
    expect(searchNSFAwardsTool.description).toContain('Search NSF awards');
    expect(searchNSFAwardsTool.inputSchema).toBeDefined();
  });

  describe('handler', () => {
    it('should search awards successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'Test Award 1',
          awardee: 'University A',
          estimatedTotalAmt: 500000,
          startDate: '01/01/2024',
          expDate: '12/31/2026'
        },
        {
          id: '2345678',
          title: 'Test Award 2',
          awardee: 'University B',
          estimatedTotalAmt: 750000,
          startDate: '02/01/2024',
          expDate: '01/31/2027'
        }
      ];

      mockClient.searchAwards.mockResolvedValue({
        awards: mockAwards,
        totalResults: 2,
        hasMore: false
      });

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test',
        limit: 25
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAwards);
      expect(result.metadata).toMatchObject({
        totalResults: 2,
        offset: 0,
        limit: 25,
        hasMore: false
      });
    });

    it('should request active awards only when includeExpired is false', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 0,
        hasMore: false
      });

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test',
        includeExpired: false
      });

      expect(result.success).toBe(true);
      expect(mockClient.searchAwards).toHaveBeenCalledWith(
        expect.objectContaining({ ActiveAwards: true })
      );
    });

    it('should apply printFields client-side', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [{ id: '1', title: 'T', awardee: 'U', abstractText: 'long' }],
        totalResults: 1,
        hasMore: false
      });

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test',
        printFields: 'id, title'
      });

      expect(result.data).toEqual([{ id: '1', title: 'T' }]);
    });

    it('should handle search with all parameters', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 0,
        hasMore: false
      });

      const input = {
        keyword: 'machine learning',
        awardeeName: 'MIT',
        awardeeCity: 'Cambridge',
        awardeeStateCode: 'MA',
        piFirstName: 'John',
        piLastName: 'Doe',
        startDateFrom: '01/01/2023',
        startDateTo: '12/31/2023',
        estimatedTotalAmtFrom: 100000,
        estimatedTotalAmtTo: 1000000,
        agency: 'NSF',
        fundProgramName: 'Computer Science',
        nsfDirectorateName: 'CISE',
        perfStateCode: 'MA',
        offset: 0,
        limit: 25
      };

      await searchNSFAwardsTool.handler(input);

      expect(mockClient.searchAwards).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'machine learning',
          awardeeName: 'MIT',
          awardeeCity: 'Cambridge',
          awardeeStateCode: 'MA',
          piFirstName: 'John',
          piLastName: 'Doe',
          rpp: 25
        })
      );
    });

    it('should limit results to maximum 25', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 0,
        hasMore: false
      });

      await searchNSFAwardsTool.handler({
        keyword: 'test',
        limit: 100
      });

      expect(mockClient.searchAwards).toHaveBeenCalledWith(
        expect.objectContaining({
          rpp: 25
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API connection failed';
      mockClient.searchAwards.mockRejectedValue(new Error(errorMessage));

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        code: 'SEARCH_FAILED',
        message: errorMessage
      });
    });

    it('should handle invalid input', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 0,
        hasMore: false
      });

      const result = await searchNSFAwardsTool.handler({
        invalidField: 'test'
      } as any);

      expect(result.success).toBe(true); // Zod will filter out invalid fields
    });

    it('should include execution time in metadata', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 0,
        hasMore: false
      });

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test'
      });

      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle pagination parameters', async () => {
      mockClient.searchAwards.mockResolvedValue({
        awards: [],
        totalResults: 50,
        hasMore: true
      });

      const result = await searchNSFAwardsTool.handler({
        keyword: 'test',
        offset: 25,
        limit: 25
      });

      expect(mockClient.searchAwards).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 25,
          rpp: 25
        })
      );

      expect(result.metadata?.hasMore).toBe(true);
      expect(result.metadata?.offset).toBe(25);
    });
  });
});