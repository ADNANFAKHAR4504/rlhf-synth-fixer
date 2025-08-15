import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// AWS Test Configuration
export interface AWSTestConfig {
  region: string;
  accountId: string;
  environment: string;
  skipAWSValidation: boolean;
}

// Initialize AWS test configuration
export async function getAWSTestConfig(): Promise<AWSTestConfig> {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environment = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const skipAWSValidation = process.env.SKIP_AWS_VALIDATION === 'true';

  let accountId = process.env.CDK_DEFAULT_ACCOUNT || '';

  // Get AWS account ID if not provided
  if (!accountId && !skipAWSValidation) {
    try {
      const stsClient = new STSClient({ region });
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);
      accountId = response.Account || '';
    } catch (error) {
      console.warn('Could not get AWS account ID:', error);
      accountId = 'unknown';
    }
  }

  return {
    region,
    accountId,
    environment,
    skipAWSValidation,
  };
}

// Validate AWS credentials
export async function validateAWSCredentials(): Promise<boolean> {
  try {
    const stsClient = new STSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    const command = new GetCallerIdentityCommand({});
    await stsClient.send(command);
    return true;
  } catch (error) {
    console.warn('AWS credentials not available:', error);
    return false;
  }
}

// Test environment setup
export function setupTestEnvironment() {
  // Set default environment variables for testing
  process.env.ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  process.env.ALERT_EMAIL = process.env.ALERT_EMAIL || 'test@example.com';
  process.env.DATABASE_PORT = process.env.DATABASE_PORT || '3306';
}

// Skip test if AWS validation is disabled
export function skipIfNoAWSValidation(testName: string) {
  if (process.env.SKIP_AWS_VALIDATION === 'true') {
    console.log(`Skipping ${testName} - AWS validation disabled`);
    return true;
  }
  return false;
}

// Generate test resource names
export function getTestResourceName(
  baseName: string,
  environment: string
): string {
  return `${baseName}-${environment}-test`;
}

// Validate resource ARN format
export function validateResourceARN(arn: string, service: string): boolean {
  const arnPattern = new RegExp(`^arn:aws:${service}:[a-z0-9-]+:[0-9]+:.*$`);
  return arnPattern.test(arn);
}

// Validate resource ID format
export function validateResourceID(id: string, type: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    vpc: /^vpc-[a-f0-9]+$/,
    subnet: /^subnet-[a-f0-9]+$/,
    securityGroup: /^sg-[a-f0-9]+$/,
    instance: /^i-[a-f0-9]+$/,
    bucket: /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,
  };

  const pattern = patterns[type];
  return pattern ? pattern.test(id) : true;
}
