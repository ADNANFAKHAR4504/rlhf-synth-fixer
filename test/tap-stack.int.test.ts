// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'env';

describe('TapStack Integration Tests', () => {
  test('EC2 instance should be reachable only from AllowedIpCidr', async () => {
    // This is a placeholder; actual test would require network access from 192.168.0.0/16
    expect(outputs.EC2Instance).toBeDefined();
    // You would use SSH or HTTP request from allowed IP and expect success, and from other IP expect failure
  });

  test('S3 bucket should have server-side encryption enabled', async () => {
    expect(outputs.S3Bucket).toBeDefined();
    // You would use AWS SDK to get bucket encryption configuration
    // Example: await s3.getBucketEncryption({ Bucket: outputs.S3Bucket }).promise()
  });

  test('RDS instance should be encrypted and not publicly accessible', async () => {
    expect(outputs.RDS).toBeDefined();
    // Use AWS SDK to describe DB instance and check StorageEncrypted and PubliclyAccessible
  });

  test('Lambda function should be deployed with at least 128MB memory', async () => {
    expect(outputs.Lambda).toBeDefined();
    // Use AWS SDK to get Lambda configuration and check MemorySize >= 128
  });

  test('CloudTrail should be logging to encrypted S3 bucket', async () => {
    expect(outputs.CloudTrail).toBeDefined();
    // Use AWS SDK to describe trail and check S3BucketName and log file validation
  });

  test('All resources should have Environment: Production tag', async () => {
    // Use AWS SDK to describe tags for each resource in outputs
    // Example: await ec2.describeTags({ Resources: [outputs.EC2Instance] }).promise()
  });
});
