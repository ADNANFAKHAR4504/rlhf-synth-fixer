export function safeSuffix(input?: string): string {
  // Normalize input to a safe suffix: lowercase, keep a-z0-9, hyphen and underscore
  const base = (input ?? '').toString();
  return base.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

export default safeSuffix;
