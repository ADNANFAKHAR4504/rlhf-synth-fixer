import { App, TerraformStack, Testing } from 'cdktf';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { SecureVpcStack } from '../lib/secure-vpc-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { TapStack } from '../lib/tap-stack';

describe('Unit Tests', () => {
  test('ComputeStack should create EC2 instances', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestComputeStackStack');
    new ComputeStack(stack, 'TestComputeStack', {
      subnetIds: ['subnet-abc123'],
      securityGroupIds: ['sg-12345678'],
      amiId: 'ami-test',
      instanceType: 't3.micro',
      instanceCount: 1,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('ComputeStack should distribute EC2 instances across subnets', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestComputeStackMultiSubnet');
    new ComputeStack(stack, 'TestComputeStackMultiSubnet', {
      subnetIds: ['subnet-1', 'subnet-2'],
      securityGroupIds: ['sg-xyz'],
      amiId: 'ami-123',
      instanceType: 't2.micro',
      instanceCount: 3,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('ComputeStack should throw if subnetIds is empty', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestInvalidComputeStack');
    expect(() => {
      new ComputeStack(stack, 'InvalidComputeStack', {
        subnetIds: [],
        securityGroupIds: ['sg-test'],
        amiId: 'ami-test',
        instanceType: 't3.micro',
        instanceCount: 1,
      });
    }).toThrow('ComputeStack: subnetIds must be provided and non-empty');
  });

  test('SecureVpcStack should create VPC and subnets', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestVpcStack');
    new SecureVpcStack(stack, 'TestVpc');
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('SecurityStack should create security groups', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestSecurityStack');
    new SecurityStack(stack, 'TestSecurity', {
      vpcId: 'vpc-0a1b2c3d4e5f67890',
      vpcCidr: '10.0.0.0/16',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('StorageStack should create an S3 bucket', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestStorageStack');
    new StorageStack(stack, 'TestStorage', {
      bucketSuffixOverride: 'static',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('DatabaseStack should create RDS instance', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestDatabaseStack');
    new DatabaseStack(stack, 'TestDatabase', {
      subnetIds: ['subnet-abc123'],
      securityGroupIds: ['sg-xyz123'],
      dbName: 'testdb',
      username: 'admin',
      password: 'password123',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  // ✅ New test to cover password > 41 chars branch
  test('DatabaseStack should truncate password longer than 41 chars', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestDatabaseLongPw');
    const longPw = 'A'.repeat(50);
    new DatabaseStack(stack, 'TestDatabaseTruncatePw', {
      subnetIds: ['subnet-abc123'],
      securityGroupIds: ['sg-xyz123'],
      dbName: 'testdb',
      username: 'admin',
      password: longPw,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });
});

test('TapStack builds with defaults and with explicit props (branch coverage)', () => {
  const app = new App();

  process.env.DB_PASSWORD = 'unit-test-password';

  const defaultStack = new TapStack(app, 'TapDefault');
  const defaultSynth = Testing.synth(defaultStack);
  expect(defaultSynth).toBeTruthy();

  const explicitStack = new TapStack(app, 'TapExplicit', {
    environmentSuffix: 'qa',
    awsRegion: 'us-west-2',
    stateBucket: 'iac-rlhf-tf-states',
    stateBucketRegion: 'us-west-2',
    defaultTags: {
      tags: { Environment: 'qa', Repository: 'demo', CommitAuthor: 'tester' },
    },
  });
  const explicitSynth = Testing.synth(explicitStack);
  expect(explicitSynth).toBeTruthy();
});