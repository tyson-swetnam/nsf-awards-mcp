/**
 * Unit tests for date utilities
 */

import {
  isValidNSFDateFormat,
  toNSFDateFormat,
  parseNSFDate,
  normalizeToNSFDate,
  validateDateRange,
  getCurrentNSFDate,
  getNSFDateDaysAgo,
  getNSFDateDaysAhead
} from '../../src/utils/date-utils';

describe('Date Utilities', () => {
  describe('isValidNSFDateFormat', () => {
    it('should validate correct NSF date format', () => {
      expect(isValidNSFDateFormat('01/15/2024')).toBe(true);
      expect(isValidNSFDateFormat('12/31/2023')).toBe(true);
      expect(isValidNSFDateFormat('06/01/2024')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidNSFDateFormat('2024-01-15')).toBe(false);
      expect(isValidNSFDateFormat('15/01/2024')).toBe(false);
      expect(isValidNSFDateFormat('1/15/2024')).toBe(false);
      expect(isValidNSFDateFormat('01-15-2024')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidNSFDateFormat('13/01/2024')).toBe(false); // Invalid month
      expect(isValidNSFDateFormat('02/30/2024')).toBe(false); // Invalid day for February
      expect(isValidNSFDateFormat('00/15/2024')).toBe(false); // Invalid month
    });
  });

  describe('toNSFDateFormat', () => {
    it('should convert Date object to NSF format', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(toNSFDateFormat(date)).toBe('01/15/2024');
    });

    it('should convert ISO string to NSF format', () => {
      expect(toNSFDateFormat('2024-01-15T00:00:00Z')).toBe('01/15/2024');
    });

    it('should handle single-digit months and days', () => {
      const date = new Date(2024, 4, 5); // May 5, 2024
      expect(toNSFDateFormat(date)).toBe('05/05/2024');
    });

    it('should throw error for invalid dates', () => {
      expect(() => toNSFDateFormat('invalid')).toThrow('Invalid date');
    });
  });

  describe('parseNSFDate', () => {
    it('should parse NSF date format to Date object', () => {
      const date = parseNSFDate('01/15/2024');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseNSFDate('2024-01-15')).toThrow('Invalid NSF date format');
    });
  });

  describe('normalizeToNSFDate', () => {
    it('should handle various date formats', () => {
      expect(normalizeToNSFDate('2024-01-15')).toBe('01/15/2024');
      expect(normalizeToNSFDate('01/15/2024')).toBe('01/15/2024');
      expect(normalizeToNSFDate(new Date(2024, 0, 15))).toBe('01/15/2024');
      expect(normalizeToNSFDate(1705276800000)).toBe('01/15/2024'); // Unix timestamp
    });

    it('should return undefined for invalid inputs', () => {
      expect(normalizeToNSFDate('')).toBeUndefined();
      expect(normalizeToNSFDate('invalid')).toBeUndefined();
      expect(normalizeToNSFDate(null as any)).toBeUndefined();
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      expect(validateDateRange('01/01/2024', '12/31/2024')).toBe(true);
      expect(validateDateRange('01/15/2024', '01/15/2024')).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      expect(validateDateRange('12/31/2024', '01/01/2024')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(validateDateRange('invalid', '01/01/2024')).toBe(false);
      expect(validateDateRange('01/01/2024', 'invalid')).toBe(false);
    });
  });

  describe('getCurrentNSFDate', () => {
    it('should return current date in NSF format', () => {
      const result = getCurrentNSFDate();
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

      // Verify it's today's date
      const today = new Date();
      const expected = toNSFDateFormat(today);
      expect(result).toBe(expected);
    });
  });

  describe('getNSFDateDaysAgo', () => {
    it('should return date N days ago', () => {
      const daysAgo = 7;
      const result = getNSFDateDaysAgo(daysAgo);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - daysAgo);
      const expected = toNSFDateFormat(expectedDate);

      expect(result).toBe(expected);
    });
  });

  describe('getNSFDateDaysAhead', () => {
    it('should return date N days in the future', () => {
      const daysAhead = 30;
      const result = getNSFDateDaysAhead(daysAhead);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + daysAhead);
      const expected = toNSFDateFormat(expectedDate);

      expect(result).toBe(expected);
    });
  });
});