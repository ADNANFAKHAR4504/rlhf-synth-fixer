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
    expect(outputs.VPCId).toBe('vpc-06f9b229f8f5114f4');
  });

  test('should have DatabaseEndpoint output', () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(typeof outputs.DatabaseEndpoint).toBe('string');
    expect(outputs.DatabaseEndpoint).toBe('database-tapstack1271-dev.c43eiskmcd0s.us-east-1.rds.amazonaws.com');
  });

  test('should have LoadBalancerDNS output', () => {
    expect(outputs.LoadBalancerDNS).toBeDefined();
    expect(typeof outputs.LoadBalancerDNS).toBe('string');
    expect(outputs.LoadBalancerDNS).toBe('ALB-tapstack1271-dev-1075792934.us-east-1.elb.amazonaws.com');
  });

  test('should have CloudFrontDomainName output', () => {
    expect(outputs.CloudFrontDomainName).toBeDefined();
    expect(typeof outputs.CloudFrontDomainName).toBe('string');
    expect(outputs.CloudFrontDomainName).toBe('d3hs3ak99hgkyi.cloudfront.net');
  });

  test('should have SecretArn output', () => {
    expect(outputs.SecretArn).toBeDefined();
    expect(typeof outputs.SecretArn).toBe('string');
    expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:[\w-]+:\d+:secret:rds-credentials-tapstack1271-dev-/);
  });

  test('should have WebACLArn output', () => {
    expect(outputs.WebACLArn).toBeDefined();
    expect(typeof outputs.WebACLArn).toBe('string');
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:[\w-]+:\d+:global\/webacl\/WebACL-tapstack1271-dev\//);
  });
});
