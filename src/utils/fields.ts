/**
 * Field projection helpers
 */

/**
 * Keep only the comma-separated fields named in `fields`
 */
export function pickFields<T extends object>(record: T, fields: string): Partial<T> {
  const wanted = new Set(
    fields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
  );
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => wanted.has(key))
  ) as Partial<T>;
}
