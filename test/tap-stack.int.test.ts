// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// LocalStack uses hardcoded 'development' environment instead of PR-specific suffixes
const isLocalStack = process.env.PROVIDER === 'localstack';
const expectedEnvironment = isLocalStack ? 'development' : environmentSuffix;

describe('CloudFormation Template Integration Tests', () => {
  it('should have all required CloudFormation outputs', () => {
    expect(outputs).toHaveProperty('EnvironmentS3Bucket');
    expect(outputs).toHaveProperty('SharedConfigBucket');
    // NOTE: DynamoDBTableName removed - service not available in LocalStack Community
    expect(outputs).toHaveProperty('ApplicationExecutionRoleArn');
    expect(outputs).toHaveProperty('ApplicationLogGroupName');
    expect(outputs).toHaveProperty('SSMParameterPrefix');
    expect(outputs).toHaveProperty('InstanceProfileArn');
    expect(outputs).toHaveProperty('SSMKMSKeyId');
    expect(outputs).toHaveProperty('SSMKMSKeyAlias');
  });

  it('should have correct environment suffix in resource names', () => {
    expect(outputs.EnvironmentS3Bucket).toContain(expectedEnvironment);
    expect(outputs.SharedConfigBucket).toContain(expectedEnvironment);
    // NOTE: DynamoDBTableName removed - service not available in LocalStack Community
    expect(outputs.ApplicationLogGroupName).toContain(expectedEnvironment);
    expect(outputs.SSMParameterPrefix).toContain(expectedEnvironment);
  });

  it('should have valid ARNs for roles and instance profile', () => {
    expect(outputs.ApplicationExecutionRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
    expect(outputs.InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\//);
  });

  it('should have valid S3 bucket names', () => {
    expect(outputs.EnvironmentS3Bucket).toMatch(/^[a-z0-9\-]+$/);
    expect(outputs.SharedConfigBucket).toMatch(/^[a-z0-9\-]+$/);
  });

  it('should have valid KMS Key ID and Alias', () => {
    expect(outputs.SSMKMSKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(outputs.SSMKMSKeyAlias).toMatch(/^alias\/.+$/);
    expect(outputs.SSMKMSKeyAlias).toContain(expectedEnvironment);
  });

  it('should have CloudWatch log groups with environment suffix', () => {
    expect(outputs.ApplicationLogGroupName).toMatch(/^\/aws\/.+\/.+$/);
    expect(outputs.ApplicationLogGroupName).toContain(expectedEnvironment);
  });

  it('should have SSM parameter prefix with environment suffix', () => {
    expect(outputs.SSMParameterPrefix).toMatch(/^\/webapp\/.+\/$/);
    expect(outputs.SSMParameterPrefix).toContain(expectedEnvironment);
  });

  // NOTE: DynamoDB tests removed - service not available in LocalStack Community

  it('should have shared config bucket created for all environments', () => {
    // SharedConfigBucket should exist regardless of environment
    expect(outputs.SharedConfigBucket).toBeDefined();
    expect(outputs.SharedConfigBucket).toContain('shared-config');
    // Note: In LocalStack, bucket names may not include environment suffix due to account ID suffix
    if (!isLocalStack) {
      expect(outputs.SharedConfigBucket).toContain(expectedEnvironment);
    }
  });

  it('should have role and instance profile names with environment suffix', () => {
    expect(outputs.ApplicationExecutionRoleArn).toContain(expectedEnvironment);
    expect(outputs.InstanceProfileArn).toContain(expectedEnvironment);
  });
});