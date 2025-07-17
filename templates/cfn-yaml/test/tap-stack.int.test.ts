import fs from 'fs';
import path from 'path';

describe('Secure Web Infrastructure Init Test', () => {
  let outputs: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../../../cdk-outputs/flat-output.json');
    outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('VPC ID should follow AWS format', () => {
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{17}$/);
  });

  test('KMS Key ARN should be valid', () => {
    expect(outputs.KMSKeyId).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[a-f0-9\-]+$/);
  });

  test('Database endpoint should be a valid RDS endpoint', () => {
    expect(outputs.DatabaseEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
  });

  test('Load balancer DNS should be valid', () => {
    expect(outputs.AppLoadBalancerDNS).toMatch(/^internal-.*\.elb\.amazonaws\.com$/);
  });

  test('CloudFront distribution URL should be valid', () => {
    expect(outputs.CloudFrontURL).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
  });

  test('SecretsManager ARN format should be valid', () => {
    expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:.*:secret:.+$/);
  });

  test('RDS instance should be Multi-AZ', () => {
    expect(outputs.IsMultiAZ).toBe(true);
  });

  test('WAF WebACL ARN should be valid', () => {
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:.*:webacl\/.+\/.*/);
  });

  test('ALB Security Group should be attached', () => {
    expect(outputs.ALBSecurityGroupId).toMatch(/^sg-[0-9a-f]{8,}$/);
  });

  test('Logging bucket ARN should be valid', () => {
    expect(outputs.LoggingBucketArn).toMatch(/^arn:aws:s3:::logging-bucket-[\w\-]+$/);
  });

  test('AutoScaling Group name should be defined', () => {
    expect(outputs.AutoScalingGroupName).toBeDefined();
  });
});
