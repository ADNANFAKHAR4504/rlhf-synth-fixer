/**
 * Utility functions for Terraform configuration validation and processing
 */

/**
 * Validates if a CIDR block is valid
 */
export function validateCidrBlock(cidr: string): boolean {
  const cidrRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;
  return cidrRegex.test(cidr);
}

/**
 * Validates if AWS region is valid
 */
export function validateAwsRegion(region: string): boolean {
  const validRegions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
  ];
  return validRegions.includes(region);
}

/**
 * Generates resource names with proper prefix and suffix
 */
export function generateResourceName(
  prefix: string,
  resourceType: string,
  suffix?: string
): string {
  const parts = [prefix, resourceType];
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join('-');
}

/**
 * Validates if instance type is valid for Graviton architecture
 */
export function isGravitonInstanceType(instanceType: string): boolean {
  const gravitonTypes = /^(a1|c6g|c7g|m6g|m7g|r6g|r7g|t4g)\./;
  return gravitonTypes.test(instanceType);
}

/**
 * Calculates subnet CIDR blocks for given VPC CIDR and number of subnets
 */
export function calculateSubnetCidrs(
  vpcCidr: string,
  subnetCount: number
): string[] {
  if (!validateCidrBlock(vpcCidr)) {
    throw new Error('Invalid VPC CIDR block');
  }

  const [baseIp, prefixLength] = vpcCidr.split('/');
  const prefix = parseInt(prefixLength, 10);

  // Calculate subnet prefix length (add bits for subnets)
  const bitsNeeded = Math.ceil(Math.log2(subnetCount));
  const subnetPrefix = prefix + bitsNeeded;

  if (subnetPrefix > 28) {
    throw new Error('Too many subnets for the given VPC CIDR');
  }

  const cidrs: string[] = [];
  const baseIpParts = baseIp.split('.').map(Number);

  for (let i = 0; i < subnetCount; i++) {
    // Simple subnet calculation for demonstration
    const subnetIp = [...baseIpParts];
    subnetIp[2] = subnetIp[2] + i;
    cidrs.push(`${subnetIp.join('.')}/${subnetPrefix}`);
  }

  return cidrs;
}

/**
 * Interface for Terraform variable validation
 */
export interface TerraformVariables {
  vpcCidr: string;
  awsRegion: string;
  instanceType: string;
  enableMultiAz: boolean;
}

/**
 * Validates Terraform variables
 */
export function validateTerraformVariables(variables: TerraformVariables): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateCidrBlock(variables.vpcCidr)) {
    errors.push('Invalid VPC CIDR block');
  }

  if (!validateAwsRegion(variables.awsRegion)) {
    errors.push('Invalid AWS region');
  }

  if (!isGravitonInstanceType(variables.instanceType)) {
    errors.push('Instance type is not Graviton-based');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
