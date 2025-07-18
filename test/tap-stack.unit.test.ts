import fs from 'fs';
import path from 'path';

describe('Tap Stack Outputs Integration Test', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('VpcId should match expected value', () => {
    expect(outputs.VpcId).toBe('vpc-1234567890abcdef0');
  });

  test('KMSKeyId should match expected value', () => {
    expect(outputs.KMSKeyId).toBe('arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012');
  });

  test('DatabaseEndpoint should match expected value', () => {
    expect(outputs.DatabaseEndpoint).toBe('mydb.c9akciq32.us-east-1.rds.amazonaws.com');
  });

  test('ContentBucketName should match expected value', () => {
    expect(outputs.ContentBucketName).toBe('secure-content-bucket-Pr55');
  });

  test('LoggingBucketName should match expected value', () => {
    expect(outputs.LoggingBucketName).toBe('secure-logging-bucket-Pr55');
  });

  test('LoadBalancerDNS should match expected value', () => {
    expect(outputs.LoadBalancerDNS).toBe('myalb-123456789.us-east-1.elb.amazonaws.com');
  });

  test('CloudFrontDomainName should match expected value', () => {
    expect(outputs.CloudFrontDomainName).toBe('d1234567890abc.cloudfront.net');
  });

  test('WebACLArn should match expected value', () => {
    expect(outputs.WebACLArn).toBe('arn:aws:wafv2:us-east-1:123456789012:global/webacl/mywebacl/12345678-1234-1234-1234-123456789012');
  });

  test('AutoScalingGroupName should match expected value', () => {
    expect(outputs.AutoScalingGroupName).toBe('myasg-Pr55');
  });

  test('CPUAlarmArn should match expected value', () => {
    expect(outputs.CPUAlarmArn).toBe('arn:aws:cloudwatch:us-east-1:123456789012:alarm:cpu-alarm-Pr55');
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
