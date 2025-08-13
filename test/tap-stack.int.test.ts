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
    expect(outputs).toHaveProperty('DynamoDBTableName');
    expect(outputs).toHaveProperty('ApplicationExecutionRoleArn');
    expect(outputs).toHaveProperty('ApplicationLogGroupName');
    expect(outputs).toHaveProperty('SSMParameterPrefix');
    expect(outputs).toHaveProperty('InstanceProfileArn');
  });

  it('should have correct environment suffix in resource names', () => {
    expect(outputs.EnvironmentS3Bucket).toContain(environmentSuffix);
    expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
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
});
