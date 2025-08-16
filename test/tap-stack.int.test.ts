// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  test('should have deployment outputs available', () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe('object');
  });

  test('should have DynamoDB table deployed', () => {
    expect(outputs.TurnAroundPromptTableName).toBeDefined();
    expect(outputs.TurnAroundPromptTableArn).toBeDefined();
    expect(outputs.TurnAroundPromptTableName).toMatch(/TurnAroundPromptTable/);
  });

  test('should have Security Group deployed', () => {
    expect(outputs.SecurityGroupId).toBeDefined();
    expect(outputs.SecurityGroupId).toMatch(/sg-/);
  });

  test('should have EC2 Instance deployed', () => {
    expect(outputs.InstanceId).toBeDefined();
    expect(outputs.InstanceId).toMatch(/i-/);
  });

  test('should have S3 Bucket deployed', () => {
    expect(outputs.BucketName).toBeDefined();
    expect(outputs.BucketName).toMatch(/application-bucket-/);
  });

  test('should have Environment Suffix in resource names', () => {
    expect(outputs.EnvironmentSuffix).toBeDefined();
    expect(outputs.TurnAroundPromptTableName).toContain(outputs.EnvironmentSuffix);
    expect(outputs.BucketName).toContain(outputs.EnvironmentSuffix);
  });

  test('EC2 instance should have public IP', () => {
    if (outputs.InstancePublicIp) {
      expect(outputs.InstancePublicIp).toMatch(/\d+\.\d+\.\d+\.\d+/);
    }
  });
});
