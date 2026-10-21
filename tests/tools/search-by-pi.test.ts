/**
 * Unit tests for search_by_pi tool
 */

import { searchByPITool } from '../../src/tools/search-by-pi';
import { nsfApiClient } from '../../src/client/nsf-api-client';
import { NSFAward } from '../../src/types/nsf-api.types';

// Mock the NSF API client
jest.mock('../../src/client/nsf-api-client');

const award = (id: string, startDate: string, pdPIName: string, coPDPI?: string[]): NSFAward => ({
  id,
  title: `Award ${id}`,
  awardee: 'U',
  startDate,
  pdPIName,
  coPDPI
});

describe('search_by_pi tool', () => {
  const mockClient = nsfApiClient as jest.Mocked<typeof nsfApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with includeCoPIs', () => {
    const piAwards = [
      award('3', '07/15/2026', 'Tyson L Swetnam'),
      award('1', '09/01/2018', 'Tyson L Swetnam')
    ];
    const coPIAwards = [
      award('2', '08/01/2020', 'Kevin J Anchukaitis', ['Tyson L Swetnam tswetnam@example.edu']),
      // Same award found by both searches
      award('3', '07/15/2026', 'Tyson L Swetnam'),
      // Same surname, different person: the API's coPDPI match is loose
      award('4', '01/01/2014', 'Steven W Leavitt', ['Thomas W Swetnam tswetnam@example.edu'])
    ];

    beforeEach(() => {
      mockClient.searchAllPages.mockImplementation(async (params) =>
        params.coPDPI ? coPIAwards : piAwards
      );
    });

    it('should page the merged results so every award is reachable', async () => {
      const input = { firstName: 'Tyson', lastName: 'Swetnam', includeCoPIs: true, limit: 2 };

      const page1 = await searchByPITool.handler(input);
      const page2 = await searchByPITool.handler({ ...input, offset: 2 });

      expect(page1.data?.map((a) => a.id)).toEqual(['3', '2']);
      expect(page1.metadata).toMatchObject({ totalResults: 3, hasMore: true });
      expect(page2.data?.map((a) => a.id)).toEqual(['1']);
      expect(page2.metadata).toMatchObject({ totalResults: 3, hasMore: false });
    });

    it('should search Co-PIs by full name and drop other people with the surname', async () => {
      const result = await searchByPITool.handler({
        firstName: 'Tyson',
        lastName: 'Swetnam',
        includeCoPIs: true
      });

      expect(mockClient.searchAllPages).toHaveBeenCalledWith(
        expect.objectContaining({ coPDPI: 'Tyson Swetnam' })
      );
      expect(result.data?.map((a) => a.id)).not.toContain('4');
    });

    it('should keep every same-surname person when no firstName is given', async () => {
      const result = await searchByPITool.handler({ lastName: 'Swetnam', includeCoPIs: true });

      expect(mockClient.searchAllPages).toHaveBeenCalledWith(
        expect.objectContaining({ coPDPI: 'Swetnam' })
      );
      expect(result.data?.map((a) => a.id)).toEqual(['3', '2', '1', '4']);
      expect(result.metadata?.totalResults).toBe(4);
    });

    it('should report an over-broad search as an error', async () => {
      mockClient.searchAllPages.mockRejectedValue(new Error('Search matches 2760 awards'));

      const result = await searchByPITool.handler({ lastName: 'Smith', includeCoPIs: true });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('2760');
    });
  });

  it('should page PI-only searches through the API', async () => {
    mockClient.searchByPI.mockResolvedValue({
      awards: [award('1', '09/01/2018', 'Tyson L Swetnam')],
      totalResults: 30,
      hasMore: true
    });

    const result = await searchByPITool.handler({ lastName: 'Swetnam', offset: 25, limit: 5 });

    expect(mockClient.searchByPI).toHaveBeenCalledWith(
      undefined,
      'Swetnam',
      expect.objectContaining({ offset: 25, rpp: 5 })
    );
    expect(mockClient.searchAllPages).not.toHaveBeenCalled();
    expect(result.metadata).toMatchObject({ totalResults: 30, offset: 25, hasMore: true });
  });
});
