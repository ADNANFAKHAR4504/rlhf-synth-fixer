// lib/utils/naming.ts
export function name(
  env: string,
  piece: string,
  region: string,
  index?: number
): string {
  const suffix = typeof index === 'number' ? `-${index + 1}` : '';
  return `${env}-${piece}${suffix}-${region}`;
}
