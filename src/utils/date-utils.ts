/**
 * Date utilities for NSF API date format handling
 * NSF API requires dates in mm/dd/yyyy format
 */

/**
 * Validates if a string is in mm/dd/yyyy format
 */
export function isValidNSFDateFormat(dateString: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Additional validation to check if date is actually valid
  const [month, day, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Converts a Date object or ISO string to NSF date format (mm/dd/yyyy)
 */
export function toNSFDateFormat(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Parses NSF date format (mm/dd/yyyy) to Date object
 */
export function parseNSFDate(dateString: string): Date {
  if (!isValidNSFDateFormat(dateString)) {
    throw new Error(`Invalid NSF date format: ${dateString}. Expected mm/dd/yyyy`);
  }

  const [month, day, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string from various formats to NSF format
 * Handles ISO 8601, Unix timestamps, and various string formats
 */
export function normalizeToNSFDate(dateInput: string | number | Date): string | undefined {
  if (!dateInput) {
    return undefined;
  }

  try {
    // If already in NSF format, validate and return
    if (typeof dateInput === 'string' && isValidNSFDateFormat(dateInput)) {
      return dateInput;
    }

    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      // Assume Unix timestamp
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      // Try to parse various date formats
      date = new Date(dateInput);

      // Handle yyyy-mm-dd format specifically
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(year, month - 1, day);
      }
    } else {
      throw new Error('Invalid date input type');
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }

    return toNSFDateFormat(date);
  } catch (error) {
    return undefined;
  }
}

/**
 * Validates date range (from date should be before or equal to to date)
 */
export function validateDateRange(fromDate: string, toDate: string): boolean {
  try {
    const from = parseNSFDate(fromDate);
    const to = parseNSFDate(toDate);
    return from <= to;
  } catch {
    return false;
  }
}

/**
 * Gets current date in NSF format
 */
export function getCurrentNSFDate(): string {
  return toNSFDateFormat(new Date());
}

/**
 * Gets date N days ago in NSF format
 */
export function getNSFDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toNSFDateFormat(date);
}

/**
 * Gets date N days in the future in NSF format
 */
export function getNSFDateDaysAhead(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toNSFDateFormat(date);
}