import { App, Testing } from 'cdktf';
import { TradingPlatformStack } from '../lib/tap-stack';

describe('Trading Platform Stack Unit Tests', () => {
  let app: App;
  let stack: TradingPlatformStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = Testing.app();
  });

  test('TradingPlatformStack instantiates successfully as primary', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStackPrimary', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    expect(stack).toBeDefined();
    expect(stack.vpcId).toBeDefined();
    expect(stack.s3BucketArn).toBeDefined();
    expect(stack.dynamoTableArn).toBeDefined();
  });

  test('TradingPlatformStack instantiates successfully as secondary', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStackSecondary', {
      isPrimary: false,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    expect(stack).toBeDefined();
    expect(stack.vpcId).toBeDefined();
    expect(stack.s3BucketArn).toBeDefined();
    expect(stack.dynamoTableArn).toBeDefined();
  });

  test('Stack synthesizes to valid Terraform configuration', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStack', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    // Test that the stack synthesizes without errors
    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();

    // Check that required resources are present in the synthesized JSON
    const stackSynthesis = JSON.parse(synthesized);

    // Check for AWS provider
    expect(stackSynthesis.provider.aws).toBeDefined();
    expect(stackSynthesis.provider.aws[0].region).toBe('us-east-1');

    // Check for VPC resource
    expect(stackSynthesis.resource.aws_vpc).toBeDefined();

    // Check for S3 bucket
    expect(stackSynthesis.resource.aws_s3_bucket).toBeDefined();

    // Check for DynamoDB table
    expect(stackSynthesis.resource.aws_dynamodb_table).toBeDefined();

    // Check for KMS keys
    expect(stackSynthesis.resource.aws_kms_key).toBeDefined();

    // Check outputs
    expect(stackSynthesis.output.VpcId).toBeDefined();
    expect(stackSynthesis.output.S3BucketArn).toBeDefined();
    expect(stackSynthesis.output.DynamoTableArn).toBeDefined();
  });

  test('Stack has proper tags applied', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStack', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    const synthesized = Testing.synth(stack);
    const stackSynthesis = JSON.parse(synthesized);

    // Check that default tags are applied
    const defaultTags = stackSynthesis.provider.aws[0].default_tags[0].tags;
    expect(defaultTags.Project).toBe('TradingPlatform');
    expect(defaultTags.Environment).toBe('Production');
    expect(defaultTags.ManagedBy).toBe('CDKTF');
    expect(defaultTags.Owner).toBe('FinanceOps');
    expect(defaultTags.CostCenter).toBe('FinanceOps');
    expect(defaultTags['DR-RTO']).toBe('15-minutes');
    expect(defaultTags['DR-RPO']).toBe('5-minutes');
  });

  test('DynamoDB table has proper configuration', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStack', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    const synthesized = Testing.synth(stack);
    const stackSynthesis = JSON.parse(synthesized);

    const dynamoTable = Object.values(
      stackSynthesis.resource.aws_dynamodb_table
    )[0] as any;

    expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
    expect(dynamoTable.hash_key).toBe('tradingId');
    expect(dynamoTable.range_key).toBe('timestamp');
    expect(dynamoTable.point_in_time_recovery).toBeDefined();
    expect(dynamoTable.point_in_time_recovery.enabled).toBe(true);
    expect(dynamoTable.server_side_encryption).toBeDefined();
    expect(dynamoTable.server_side_encryption.enabled).toBe(true);

    // Check attributes
    const attributes = dynamoTable.attribute;
    expect(attributes).toHaveLength(3);
    expect(
      attributes.find((attr: any) => attr.name === 'tradingId')
    ).toBeDefined();
    expect(
      attributes.find((attr: any) => attr.name === 'timestamp')
    ).toBeDefined();
    expect(
      attributes.find((attr: any) => attr.name === 'userId')
    ).toBeDefined();

    // Check GSI
    expect(dynamoTable.global_secondary_index).toHaveLength(1);
    expect(dynamoTable.global_secondary_index[0].name).toBe('UserIndex');
    expect(dynamoTable.global_secondary_index[0].hash_key).toBe('userId');
    expect(dynamoTable.global_secondary_index[0].range_key).toBe('timestamp');
  });

  test('VPC has proper network configuration', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStack', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    const synthesized = Testing.synth(stack);
    const stackSynthesis = JSON.parse(synthesized);

    const vpc = Object.values(stackSynthesis.resource.aws_vpc)[0] as any;
    expect(vpc.cidr_block).toBe('10.0.0.0/16');
    expect(vpc.enable_dns_hostnames).toBe(true);
    expect(vpc.enable_dns_support).toBe(true);

    // Check subnets
    const subnets = stackSynthesis.resource.aws_subnet;
    expect(Object.keys(subnets)).toHaveLength(2);

    // Check security group
    const securityGroups = stackSynthesis.resource.aws_security_group;
    expect(Object.keys(securityGroups)).toHaveLength(1);

    const sg = Object.values(securityGroups)[0] as any;
    expect(sg.ingress).toHaveLength(2); // HTTP and HTTPS
    expect(sg.egress).toHaveLength(1); // All outbound
  });

  test('KMS keys are properly configured', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStack', {
      isPrimary: true,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      domainName: 'test.example.com',
    });

    const synthesized = Testing.synth(stack);
    const stackSynthesis = JSON.parse(synthesized);

    const kmsKeys = stackSynthesis.resource.aws_kms_key;
    expect(Object.keys(kmsKeys)).toHaveLength(2); // Database and Storage keys

    const kmsAliases = stackSynthesis.resource.aws_kms_alias;
    expect(Object.keys(kmsAliases)).toHaveLength(2); // Database and Storage aliases

    // Check key properties
    Object.values(kmsKeys).forEach((key: any) => {
      expect(key.key_usage).toBe('ENCRYPT_DECRYPT');
      expect(key.customer_master_key_spec).toBe('SYMMETRIC_DEFAULT');
      expect(key.deletion_window_in_days).toBe(30);
    });
  });
});
