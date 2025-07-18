import fs from 'fs';
import path from 'path';

describe('Tap Stack Outputs Integration Test', () => {
  let outputs: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('VpcId should match expected format', () => {
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{17}$/);
  });

  test('KMSKeyId should be a valid KMS ARN', () => {
    expect(outputs.KMSKeyId).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[0-9a-f\-]{36}$/);
  });

  test('DatabaseEndpoint should be a valid RDS endpoint', () => {
    expect(outputs.DatabaseEndpoint).toMatch(/^[a-z0-9\-\.]+\.rds\.amazonaws\.com$/);
  });

  test('ContentBucketName should be correct', () => {
    expect(outputs.ContentBucketName).toBe('secure-content-bucket-Pr55');
  });

  test('LoggingBucketName should be correct', () => {
    expect(outputs.LoggingBucketName).toBe('secure-logging-bucket-Pr55');
  });

  test('LoadBalancerDNS should be a valid AWS ELB DNS name', () => {
    expect(outputs.LoadBalancerDNS).toMatch(/^myalb-[a-z0-9\-]+\.us-east-1\.elb\.amazonaws\.com$/);
  });

  test('CloudFrontDomainName should be valid', () => {
    expect(outputs.CloudFrontDomainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
  });

  test('WebACLArn should be a valid WAF ARN', () => {
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:us-east-1:\d{12}:global\/webacl\/.+\/[0-9a-f\-]+$/);
  });

  test('AutoScalingGroupName should include environment suffix', () => {
    expect(outputs.AutoScalingGroupName).toBe('myasg-Pr55');
  });

  test('CPUAlarmArn should be a valid CloudWatch alarm ARN', () => {
    expect(outputs.CPUAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d{12}:alarm:.+$/);
  });

  test('EnvironmentSuffix should match expected value', () => {
    expect(outputs.EnvironmentSuffix).toBe('pr62');
  });

  test('TurnAroundPromptTableName should match expected value', () => {
    expect(outputs.TurnAroundPromptTableName).toBe('TurnAroundPromptTablepr62');
  });

  test('StackName should match expected value', () => {
    expect(outputs.StackName).toBe('TapStackpr62');
  });
});
