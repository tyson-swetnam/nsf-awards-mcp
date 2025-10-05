/**
 * Unit tests for NSF API client
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NSFApiClient } from '../../src/client/nsf-api-client';
import { NSFAward, NSFProjectOutcome } from '../../src/types/nsf-api.types';

// Mock axios
jest.mock('axios');

describe('NSFApiClient', () => {
  let client: NSFApiClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Create a new client for each test
    client = new NSFApiClient({
      baseURL: 'https://api.nsf.gov/services/v1',
      timeout: 5000,
      maxRetries: 1
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAwards', () => {
    it('should search awards successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'Test Award',
          awardee: 'Test University',
          piFirstName: 'John',
          piLastName: 'Doe',
          startDate: '01/01/2024',
          expDate: '12/31/2026',
          estimatedTotalAmt: 500000
        }
      ];

      // Mock the axios response
      const mockResponse = {
        data: {
          response: {
            award: mockAwards
          }
        },
        status: 200
      };

      // Setup mock implementation
      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.searchAwards({
        keyword: 'test',
        rpp: 25
      });

      expect(result.awards).toEqual(mockAwards);
      expect(result.totalResults).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          response: {}
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.searchAwards({
        keyword: 'nonexistent'
      });

      expect(result.awards).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle single award response', async () => {
      const mockAward: NSFAward = {
        id: '1234567',
        title: 'Single Award',
        awardee: 'Test University'
      };

      const mockResponse = {
        data: {
          response: {
            award: mockAward // Single object, not array
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.searchAwards({
        id: '1234567'
      });

      expect(result.awards).toEqual([mockAward]);
      expect(result.totalResults).toBe(1);
    });

    it('should limit results to maximum 25', async () => {
      const result = await client.searchAwards({
        keyword: 'test',
        rpp: 100 // Exceeds maximum
      });

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.rpp).toBe(25);
    });
  });

  describe('getAwardDetails', () => {
    it('should get award details successfully', async () => {
      const mockAward: NSFAward = {
        id: '1234567',
        title: 'Detailed Award',
        awardee: 'Test University',
        abstractText: 'This is a test abstract'
      };

      const mockResponse = {
        data: {
          response: {
            award: mockAward
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.getAwardDetails('1234567');

      expect(result).toEqual(mockAward);
      expect((client as any).client.get).toHaveBeenCalledWith(
        '/awards/1234567.json'
      );
    });

    it('should return null for non-existent award', async () => {
      const error = new Error('Not Found') as any;
      error.response = { status: 404 };
      error.isAxiosError = true;

      (client as any).client.get = jest.fn().mockRejectedValue(error);

      const result = await client.getAwardDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getProjectOutcomes', () => {
    it('should get project outcomes successfully', async () => {
      const mockOutcome: NSFProjectOutcome = {
        awardId: '1234567',
        awardTitle: 'Test Award',
        pi: 'John Doe',
        organization: 'Test University',
        accomplishments: 'Test accomplishments',
        publications: [
          {
            title: 'Test Publication',
            authors: 'Doe, J.',
            year: '2024'
          }
        ]
      };

      const mockResponse = {
        data: {
          response: {
            projectOutcomes: mockOutcome
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.getProjectOutcomes('1234567');

      expect(result).toEqual(mockOutcome);
      expect((client as any).client.get).toHaveBeenCalledWith(
        '/awards/1234567/projectoutcomes.json'
      );
    });

    it('should return null when no outcomes exist', async () => {
      const mockResponse = {
        data: {
          response: {}
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.getProjectOutcomes('1234567');

      expect(result).toBeNull();
    });
  });

  describe('searchByInstitution', () => {
    it('should search by institution successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'Institution Award',
          awardeeOrganization: 'MIT'
        }
      ];

      const mockResponse = {
        data: {
          response: {
            award: mockAwards
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.searchByInstitution('MIT', {
        stateCode: 'MA'
      });

      expect(result.awards).toEqual(mockAwards);

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.awardeeOrganization).toBe('MIT');
    });
  });

  describe('searchByPI', () => {
    it('should search by PI successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'PI Award',
          piFirstName: 'John',
          piLastName: 'Doe'
        }
      ];

      const mockResponse = {
        data: {
          response: {
            award: mockAwards
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.searchByPI('John', 'Doe', {
        institution: 'MIT'
      });

      expect(result.awards).toEqual(mockAwards);

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.piFirstName).toBe('John');
      expect(callArgs[1].params.piLastName).toBe('Doe');
    });
  });

  describe('Date parameter processing', () => {
    it('should convert date formats correctly', async () => {
      const mockResponse = {
        data: {
          response: { award: [] }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      await client.searchAwards({
        startDateFrom: '2024-01-01',
        startDateTo: '2024-12-31'
      });

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.startDateFrom).toBe('01/01/2024');
      expect(callArgs[1].params.startDateTo).toBe('12/31/2024');
    });

    it('should remove invalid date parameters', async () => {
      const mockResponse = {
        data: {
          response: { award: [] }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      await client.searchAwards({
        startDateFrom: 'invalid',
        startDateTo: '01/01/2024'
      });

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.startDateFrom).toBeUndefined();
      expect(callArgs[1].params.startDateTo).toBe('01/01/2024');
    });
  });
});