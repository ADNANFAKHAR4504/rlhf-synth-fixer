// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Outputs Integration', () => {
  test('should have VPCId output', () => {
    expect(outputs.VPCId).toBeDefined();
    expect(typeof outputs.VPCId).toBe('string');
    expect(outputs.VPCId).toMatch(/^vpc-/);
  });

  test('should have WebServerInstanceId output', () => {
    expect(outputs.WebServerInstanceId).toBeDefined();
    expect(typeof outputs.WebServerInstanceId).toBe('string');
    expect(outputs.WebServerInstanceId).toMatch(/^i-/);
  });

  test('should have WebServerPublicIP output', () => {
    expect(outputs.WebServerPublicIP).toBeDefined();
    expect(typeof outputs.WebServerPublicIP).toBe('string');
    expect(outputs.WebServerPublicIP).toMatch(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
  });

  test('should have S3BucketName output', () => {
    expect(outputs.S3BucketName).toBeDefined();
    expect(typeof outputs.S3BucketName).toBe('string');
    expect(outputs.S3BucketName).toMatch(/^app-bucket-/);
  });

  test('should have DatabaseEndpoint output', () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(typeof outputs.DatabaseEndpoint).toBe('string');
    expect(outputs.DatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
  });

  test('should have DatabasePort output', () => {
    expect(outputs.DatabasePort).toBeDefined();
    expect(typeof outputs.DatabasePort).toBe('string');
    expect(Number(outputs.DatabasePort)).toBeGreaterThan(0);
  });
});
