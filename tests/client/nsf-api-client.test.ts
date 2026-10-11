/**
 * Unit tests for NSF API client
 */

import { NSFApiClient } from '../../src/client/nsf-api-client';
import { NSFAward } from '../../src/types/nsf-api.types';

describe('NSFApiClient', () => {
  let client: NSFApiClient;

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
      (client as any).client.get = jest.fn().mockResolvedValue({
        data: { response: { award: [] } },
        status: 200
      });

      await client.searchAwards({
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
      expect((client as any).client.get).toHaveBeenCalledWith('/awards/1234567.json');
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
    it('should read projectOutComesReport from the award record', async () => {
      // Shape returned by /awards/{id}/projectoutcomes.json (checked live)
      const mockResponse = {
        data: {
          response: {
            award: [
              {
                id: '1114898',
                title: 'CNH: Long-Term Vulnerability',
                awardee: 'UNIVERSITY OF ARIZONA',
                awardeeName: 'University of Arizona',
                pdPIName: 'Thomas W Swetnam',
                projectOutComesReport:
                  '<div class="porColContainerWBG"><p>Homes &amp; forests.</p><p>Second</p></div>'
              }
            ],
            metadata: { offset: 0, rpp: 25, totalCount: 1 }
          }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.getProjectOutcomes('1114898');

      expect(result).toMatchObject({
        awardId: '1114898',
        title: 'CNH: Long-Term Vulnerability',
        pi: 'Thomas W Swetnam',
        awardee: 'University of Arizona',
        outcomesReport: 'Homes & forests.\nSecond'
      });
      expect((client as any).client.get).toHaveBeenCalledWith(
        '/awards/1114898/projectoutcomes.json'
      );
    });

    it('should return null when the award has no report', async () => {
      const mockResponse = {
        data: {
          response: { award: [{ id: '9307607', title: 'Old', awardee: 'U' }] }
        },
        status: 200
      };

      (client as any).client.get = jest.fn().mockResolvedValue(mockResponse);

      expect(await client.getProjectOutcomes('9307607')).toBeNull();
    });
  });

  describe('API service notifications', () => {
    it('should surface AwardAPI-002 as an error instead of empty results', async () => {
      (client as any).client.get = jest.fn().mockResolvedValue({
        data: {
          response: {
            serviceNotification: [
              {
                notificationCode: 'AwardAPI-002',
                notificationMessage:
                  'Invalid parameter(s) sent in the request. Invalid Parameter(s) {startDateFrom}',
                notificationType: 'ERROR'
              }
            ]
          }
        },
        status: 200
      });

      await expect(client.searchAwards({ keyword: 'x' })).rejects.toThrow('AwardAPI-002');
    });

    it('should use metadata.totalCount for totals and hasMore', async () => {
      (client as any).client.get = jest.fn().mockResolvedValue({
        data: {
          response: {
            award: [{ id: '1', title: 'A', awardee: 'U' }],
            metadata: { offset: 0, rpp: 1, totalCount: 981 }
          }
        },
        status: 200
      });

      const result = await client.searchAwards({ keyword: 'wildfire', rpp: 1 });

      expect(result.totalResults).toBe(981);
      expect(result.hasMore).toBe(true);
    });

    it('should quote multi-word awardeeName so the API matches the phrase', async () => {
      (client as any).client.get = jest.fn().mockResolvedValue({
        data: { response: { award: [] } },
        status: 200
      });

      await client.searchByInstitution('University of Arizona');

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.awardeeName).toBe('"University of Arizona"');
    });
  });

  describe('searchByInstitution', () => {
    it('should search by institution successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'Institution Award',
          awardee: 'MIT',
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
        awardeeStateCode: 'MA'
      });

      expect(result.awards).toEqual(mockAwards);

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.awardeeName).toBe('MIT');
    });
  });

  describe('searchByPI', () => {
    it('should search by PI successfully', async () => {
      const mockAwards: NSFAward[] = [
        {
          id: '1234567',
          title: 'PI Award',
          awardee: 'MIT',
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
        awardeeName: 'MIT'
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
        startDateStart: '2024-01-01',
        startDateEnd: '2024-12-31'
      });

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.startDateStart).toBe('01/01/2024');
      expect(callArgs[1].params.startDateEnd).toBe('12/31/2024');
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
        startDateStart: 'invalid',
        startDateEnd: '01/01/2024'
      });

      const callArgs = ((client as any).client.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].params.startDateStart).toBeUndefined();
      expect(callArgs[1].params.startDateEnd).toBe('01/01/2024');
    });
  });
});