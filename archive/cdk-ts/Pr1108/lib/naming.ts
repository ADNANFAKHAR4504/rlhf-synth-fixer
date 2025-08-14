export function name(
  dept: string,
  env: string,
  purpose: string,
  suffix?: string
) {
  const base = `${dept}-${env}-${purpose}`;
  return suffix ? `${base}-${suffix}` : base;
}
