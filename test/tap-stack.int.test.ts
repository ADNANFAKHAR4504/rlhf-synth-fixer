// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// Accessing outputs directly by key
const vpcId = outputs.VPCId;
const s3BucketName = outputs.S3BucketName;
const rdsEndpoint = outputs.RDSInstanceEndpoint;

describe('Turn Around Prompt API Integration Tests', () => {
  test('VPC ID should be a valid VPC ID', () => {
    expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
  });

  test('S3 bucket name should be non-empty', () => {
    expect(typeof s3BucketName).toBe('string');
    expect(s3BucketName.length).toBeGreaterThan(0);
  });

  test('RDS endpoint should be a valid hostname', () => {
    expect(typeof rdsEndpoint).toBe('string');
    expect(rdsEndpoint).toMatch(/^[a-z0-9.-]+\.rds\.amazonaws\.com$/);
  });
});