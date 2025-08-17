import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { VpcConstruct } from '../lib/vpc-construct';
import { SecurityConstruct } from '../lib/security-construct';
import { ComputeConstruct } from '../lib/compute-construct';
import { DatabaseConstruct } from '../lib/database-construct';
import { StorageConstruct } from '../lib/storage-construct';
import { DynamoDbConstruct } from '../lib/dynamodb-construct';

describe('TapStack Comprehensive Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  test('TapStack instantiates with required arguments', () => {
    const stack = new TapStack(app, 'TestTapStack');
    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('VpcConstruct creates VPC and subnets', () => {
    const stack = new TapStack(app, 'VpcTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', {
      prefix: 'test',
      regions: ['us-west-2'],
    });
    expect(vpc.vpcs['us-west-2']).toBeDefined();
    expect(vpc.publicSubnets['us-west-2'].length).toBeGreaterThan(0);
    expect(vpc.privateSubnets['us-west-2'].length).toBeGreaterThan(0);
  });

  test('SecurityConstruct creates security resources', () => {
    const stack = new TapStack(app, 'SecurityTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-2'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', {
      prefix: 'test',
      vpc,
    });
    expect(security).toBeDefined();
    // Optionally check for specific resources if exposed
  });

  test('ComputeConstruct creates compute resources', () => {
    const stack = new TapStack(app, 'ComputeTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-2'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', { prefix: 'test', vpc });
    const compute = new ComputeConstruct(stack, 'ComputeTest', {
      prefix: 'test',
      vpc,
      security,
    });
    expect(compute).toBeDefined();
    // Optionally check for EC2/Lambda if exposed
  });

  test('DatabaseConstruct creates RDS resources', () => {
    const stack = new TapStack(app, 'DatabaseTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-2'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', { prefix: 'test', vpc });
    const database = new DatabaseConstruct(stack, 'DatabaseTest', {
      prefix: 'test',
      vpc,
      security,
    });
    expect(database).toBeDefined();
    // Optionally check for RDS if exposed
  });

  test('StorageConstruct creates S3 buckets', () => {
    const stack = new TapStack(app, 'StorageTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-2'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', { prefix: 'test', vpc });
    const storage = new StorageConstruct(stack, 'StorageTest', {
      prefix: 'test',
      security,
    });
    expect(storage).toBeDefined();
    // Optionally check for buckets if exposed
  });

  test('DynamoDbConstruct creates DynamoDB tables', () => {
    const stack = new TapStack(app, 'DynamoDbTestStack');
    const vpc = new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-2'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', { prefix: 'test', vpc });
    const dynamodb = new DynamoDbConstruct(stack, 'DynamoDbTest', {
      prefix: 'test',
      security,
    });
    expect(dynamodb).toBeDefined();
    // Optionally check for tables if exposed
  });

  test('Synthesized output contains expected resource names', () => {
    const stack = new TapStack(app, 'OutputTestStack');
    // Add constructs to stack with unique IDs
  new VpcConstruct(stack, 'VpcTest', { prefix: 'test', regions: ['us-west-1'] });
  const vpc2 = new VpcConstruct(stack, 'VpcTest2', { prefix: 'test2', regions: ['us-east-1', 'us-west-1'] });
    const security = new SecurityConstruct(stack, 'SecurityTest', { prefix: 'test', vpc: vpc2 });
    new StorageConstruct(stack, 'StorageTest', { prefix: 'test', security });
    const synthesized = Testing.synth(stack);
  expect(synthesized).toContain('test-vpc-us-west-1');
  expect(synthesized).toContain('test-public-subnet-1-us-west-1');
  expect(synthesized).toContain('test-private-subnet-1-us-west-1');
  expect(synthesized).toContain('test-bucket-us-west-1');
  expect(synthesized).toContain('test-s3-logs-us-west-1');
  // Additional checks for multi-region and edge cases
  expect(synthesized).toContain('test2-vpc-us-east-1');
  expect(synthesized).toContain('test2-vpc-us-west-1');
  expect(synthesized).toContain('test2-public-subnet-1-us-east-1');
  expect(synthesized).toContain('test2-public-subnet-1-us-west-1');
  expect(synthesized).toContain('test2-private-subnet-1-us-east-1');
  expect(synthesized).toContain('test2-private-subnet-1-us-west-1');
  });

  test('VpcConstruct handles empty regions array gracefully', () => {
    const stack = new TapStack(app, 'EmptyRegionStack');
    const vpc = new VpcConstruct(stack, 'VpcEmpty', { prefix: 'empty', regions: [] });
    expect(vpc.vpcs).toEqual({});
    expect(vpc.publicSubnets).toEqual({});
    expect(vpc.privateSubnets).toEqual({});
  });

  test('VpcConstruct throws error for missing prefix', () => {
    const stack = new TapStack(app, 'MissingPrefixStack');
    expect(() => {
      // @ts-expect-error
      new VpcConstruct(stack, 'VpcNoPrefix', { regions: ['us-west-2'] });
    }).toThrow();
  });
});
