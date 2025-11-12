import * as cdk from 'aws-cdk-lib';

/**
 * Generate a deterministic resource name: <env>-<component>-<region>-<suffix>
 * - baseEnv: optional base environment suffix (e.g., 'dev' or 'prod')
 * - component: short component name (no spaces)
 * - suffix: short unique suffix (usually derived from stack id)
 *
 * Returns a CDK token (string) suitable for resource names that accept tokens.
 */
export function canonicalResourceName(
  component: string,
  baseEnv?: string,
  suffix?: string
): string | cdk.Token {
  // envPart may be a provided literal string or a CDK token (from stack id).
  const envPart: string | cdk.Token = baseEnv
    ? baseEnv.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

  // suffix can be either a literal string or a CDK token. If it's a
  // literal string, normalize it; if it's a token, pass it through
  // unchanged so we don't attempt string operations on token objects.
  const suffixPart: string | cdk.Token | undefined =
    typeof suffix === 'string' && suffix.length > 0
      ? suffix.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : suffix && (suffix as unknown as cdk.Token);

  // component should be normalized too
  const comp = component.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Build the parts array and only include optional pieces when
  // provided. Avoid inserting Aws.NO_VALUE into the join list which
  // results in extra separators ("--") when CloudFormation renders
  // tokens as empty strings.
  const parts: Array<string | cdk.Token> = [comp, envPart as any];
  if (suffixPart) {
    parts.push(suffixPart as any);
  }
  parts.push(cdk.Aws.REGION);

  return cdk.Fn.join('-', parts as any);
}

export default canonicalResourceName;
