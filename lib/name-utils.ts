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
  const envPart = baseEnv
    ? baseEnv.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

  const suffixPart = suffix
    ? suffix.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : cdk.Aws.NO_VALUE;

  // component should be normalized too
  const comp = component.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Place the region last to avoid generating names that end with a
  // trailing '-' when the suffix is not provided (CDK may render
  // Aws.NO_VALUE as an empty token). Putting the region at the end
  // guarantees the resulting CloudFormation value does not end with
  // '-' and is less likely to violate service-specific naming rules.
  return cdk.Fn.join('-', [comp, envPart, suffixPart, cdk.Aws.REGION]);
}

export default canonicalResourceName;
