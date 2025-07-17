import fs from 'fs';
import path from 'path';

describe('Secure Web Infrastructure Init Test', () => {
  let outputs: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('VPC ID should follow AWS format', () => {
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{17}$/);
  });

  test('KMS Key ARN should be valid', () => {
    expect(outputs.KMSKeyId).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[0-9a-f\-]{36}$/);
  });

  test('Database endpoint should be a valid RDS endpoint', () => {
    expect(outputs.DatabaseEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
  });

  test('Content bucket should follow naming conventions', () => {
    expect(outputs.ContentBucketName).toMatch(/^secure-content-bucket-/);
  });

  test('Logging bucket should follow naming conventions', () => {
    expect(outputs.LoggingBucketName).toMatch(/^secure-logging-bucket-/);
  });

  test('Load Balancer DNS should look like a valid AWS ELB address', () => {
    expect(outputs.LoadBalancerDNS).toMatch(/elb\.amazonaws\.com$/);
  });

  test('CloudFront domain name should look valid', () => {
    expect(outputs.CloudFrontDomainName).toMatch(/^d[a-z0-9]{13}\.cloudfront\.net$/);
  });

  test('CloudFront Distribution ID should start with E', () => {
    expect(outputs.CloudFrontDistributionId).toMatch(/^E[A-Z0-9]{13}$/);
  });

  test('WebACL ARN should be valid', () => {
    expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:us-east-1:\d{12}:global\/webacl\/.+/);
  });

  test('Auto Scaling Group name should end in -Pr24', () => {
    expect(outputs.AutoScalingGroupName).toMatch(/-Pr\d+$/);
  });

  test('CloudWatch CPU alarm ARN should be valid', () => {
    expect(outputs.CPUAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d{12}:alarm:/);
  });

  test('Environment suffix should be a short tag', () => {
    expect(outputs.EnvironmentSuffix).toMatch(/^Pr\d+$/);
  });

  test('DynamoDB table name should be consistent with suffix', () => {
    expect(outputs.TurnAroundPromptTableName).toMatch(/TurnAroundPromptTablePr\d+$/);
  });

  test('Stack name should match naming convention', () => {
    expect(outputs.StackName).toMatch(/^TapStackPr\d+$/);
  });
});
