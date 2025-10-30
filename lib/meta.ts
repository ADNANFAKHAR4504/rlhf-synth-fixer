// small helper module to give Jest something to instrument under lib/
export function add(a: number, b: number): number {
  return a + b;
}

export function isEven(n: number): boolean {
  if (!Number.isFinite(n)) throw new TypeError('n must be a finite number');
  return n % 2 === 0;
}

export function formatName(parts: Array<string | null | undefined>): string {
  // join parts, skip falsy and trim
  return parts
    .filter(Boolean)
    .map(p => String(p).trim())
    .join('-');
}

export function getTimestamp(prefix = ''): string {
  const d = new Date();
  const ts = d
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  return prefix ? `${prefix}-${ts}` : ts;
}

// Expose a branching function to increase coverage
export function computeTier(value: number): 'low' | 'med' | 'high' {
  if (value < 0) throw new RangeError('value must be non-negative');
  if (value < 10) return 'low';
  if (value < 100) return 'med';
  return 'high';
}

export default { add, isEven, formatName, getTimestamp, computeTier };
