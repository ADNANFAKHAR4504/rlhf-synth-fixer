import { Testing } from 'cdktf';
import { TradingPlatformStack } from '../lib/tap-stack';

describe('Trading Platform Integration Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new TradingPlatformStack(app, 'test-trading-platform', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'trading-platform.example.com',
    });
    const synthResult = Testing.synth(stack);
    synthesized = JSON.parse(synthResult);
  });

  test('should synthesize without errors', () => {
    expect(synthesized).toBeDefined();
    expect(Object.keys(synthesized).length).toBeGreaterThan(0);
  });

  test('should have valid Terraform provider configuration', () => {
    expect(synthesized.provider).toBeDefined();
    expect(synthesized.provider.aws).toBeDefined();
    expect(synthesized.provider.aws[0].region).toBe('us-east-1');
  });

  test('should have proper VPC configuration', () => {
    expect(synthesized.resource.aws_vpc).toBeDefined();
    const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
    expect(vpc.cidr_block).toBe('10.0.0.0/16');
  });

  test('should have proper DynamoDB configuration', () => {
    expect(synthesized.resource.aws_dynamodb_table).toBeDefined();
    const dynamoTable = Object.values(synthesized.resource.aws_dynamodb_table)[0] as any;
    expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
  });

  test('should have proper S3 bucket configuration', () => {
    expect(synthesized.resource.aws_s3_bucket).toBeDefined();
    const s3Bucket = Object.values(synthesized.resource.aws_s3_bucket)[0] as any;
    expect(s3Bucket.bucket).toMatch(/trading-platform-data-pri-\d+-\w+/);
  });

  test('should have proper KMS key configuration', () => {
    expect(synthesized.resource.aws_kms_key).toBeDefined();
    const kmsKeys = Object.values(synthesized.resource.aws_kms_key);
    expect(kmsKeys.length).toBeGreaterThan(0);
  });

  test('should have proper security group configuration', () => {
    expect(synthesized.resource.aws_security_group).toBeDefined();
    const securityGroups = Object.values(synthesized.resource.aws_security_group);
    expect(securityGroups.length).toBeGreaterThan(0);
  });

  test('should have consistent resource naming', () => {
    const s3Bucket = Object.values(synthesized.resource.aws_s3_bucket)[0] as any;
    const dynamoTable = Object.values(synthesized.resource.aws_dynamodb_table)[0] as any;
    expect(s3Bucket.bucket).toMatch(/trading-platform-data-pri-\d+-\w+/);
    expect(dynamoTable.name).toMatch(/trading-platform-pri-\d+-\w+/);
  });

  test('should have proper outputs defined', () => {
    expect(synthesized.output).toBeDefined();
    expect(synthesized.output.VpcId).toBeDefined();
    expect(synthesized.output.S3BucketArn).toBeDefined();
    expect(synthesized.output.DynamoTableArn).toBeDefined();
  });
});
