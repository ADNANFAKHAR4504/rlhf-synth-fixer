// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
    expect(outputs.EnvironmentS3Bucket).toContain(environmentSuffix);
    expect(outputs.SharedConfigBucket).toContain(environmentSuffix);
    // NOTE: DynamoDBTableName removed - service not available in LocalStack Community
    expect(outputs.ApplicationLogGroupName).toContain(environmentSuffix);
    expect(outputs.SSMParameterPrefix).toContain(environmentSuffix);
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
    expect(outputs.SSMKMSKeyAlias).toContain(environmentSuffix);
  });

  it('should have CloudWatch log groups with environment suffix', () => {
    expect(outputs.ApplicationLogGroupName).toMatch(/^\/aws\/.+\/.+$/);
    expect(outputs.ApplicationLogGroupName).toContain(environmentSuffix);
  });

  it('should have SSM parameter prefix with environment suffix', () => {
    expect(outputs.SSMParameterPrefix).toMatch(/^\/webapp\/.+\/$/);
    expect(outputs.SSMParameterPrefix).toContain(environmentSuffix);
  });

  // NOTE: DynamoDB tests removed - service not available in LocalStack Community

  it('should have shared config bucket created for all environments', () => {
    // SharedConfigBucket should exist regardless of environment
    expect(outputs.SharedConfigBucket).toBeDefined();
    expect(outputs.SharedConfigBucket).toContain('shared-config');
    expect(outputs.SharedConfigBucket).toContain(environmentSuffix);
  });

  it('should have role and instance profile names with environment suffix', () => {
    expect(outputs.ApplicationExecutionRoleArn).toContain(environmentSuffix);
    expect(outputs.InstanceProfileArn).toContain(environmentSuffix);
  });
});