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

  test('should have DatabaseEndpoint output', () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(typeof outputs.DatabaseEndpoint).toBe('string');
    expect(outputs.DatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
  });

  test('should have LoadBalancerDNS output', () => {
    expect(outputs.LoadBalancerDNS).toBeDefined();
    expect(typeof outputs.LoadBalancerDNS).toBe('string');
    expect(outputs.LoadBalancerDNS).toMatch(/\.elb\..*\.amazonaws\.com$/);
  });

  test('should have CloudFrontDomainName output', () => {
    expect(outputs.CloudFrontDomainName).toBeDefined();
    expect(typeof outputs.CloudFrontDomainName).toBe('string');
    expect(outputs.CloudFrontDomainName).toMatch(/\.cloudfront\.net$/);
  });

  test('should have SecretArn output', () => {
    expect(outputs.SecretArn).toBeDefined();
    expect(typeof outputs.SecretArn).toBe('string');
    expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
  });

  test('should have WebACLArn output', () => {
    expect(outputs.WebACLArn).toBeDefined();
    expect(typeof outputs.WebACLArn).toBe('string');
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:/);
  });
});
