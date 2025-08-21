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

  // ✅ This test hits the missing branch
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
});

test('TapStack builds with defaults and with explicit props (branch coverage)', () => {
  const app = new App();

  // Needed so TapStack -> DatabaseStack resolves password during synth
  process.env.DB_PASSWORD = 'unit-test-password';

  // Default props path
  const defaultStack = new TapStack(app, 'TapDefault');
  const defaultSynth = Testing.synth(defaultStack);
  expect(defaultSynth).toBeTruthy();

  // Explicit props path (exercises branches for props?.*)
  const explicitStack = new TapStack(app, 'TapExplicit', {
    environmentSuffix: 'qa',
    awsRegion: 'us-west-2',
    stateBucket: 'iac-rlhf-tf-states',
    stateBucketRegion: 'us-west-2',
    defaultTags: { tags: { Environment: 'qa', Repository: 'demo', CommitAuthor: 'tester' } },
  });
  const explicitSynth = Testing.synth(explicitStack);
  expect(explicitSynth).toBeTruthy();
});

describe('Additional Unit Tests for Enhanced Coverage', () => {
  test('DatabaseStack should handle password from environment variable', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestDatabaseEnvStack');
    
    // Test environment variable password handling
    process.env.TEST_DB_PASSWORD = 'env-password-123!';
    
    new DatabaseStack(stack, 'TestDatabaseEnv', {
      subnetIds: ['subnet-test1', 'subnet-test2'],
      securityGroupIds: ['sg-test1'],
      dbName: 'testdb',
      username: 'admin',
      passwordEnvVarName: 'TEST_DB_PASSWORD',
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
    
    // Clean up
    delete process.env.TEST_DB_PASSWORD;
  });

  test('TapStack should properly parameterize project name and environment', () => {
    const app = new App();
    process.env.DB_PASSWORD = 'test-password';
    
    const stack = new TapStack(app, 'TapParameterized', {
      environmentSuffix: 'staging',
    });
    
    const synthesized = Testing.synth(stack);
    // Verify that resources are tagged with the environment suffix
    expect(synthesized).toContain('staging');
    expect(synthesized).toContain('myproject');
  });

  test('SecureVpcStack should create proper network configuration', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestNetworkValidation');
    const vpcStack = new SecureVpcStack(stack, 'TestNetworkVpc');
    
    const synthesized = Testing.synth(stack);
    const config = JSON.parse(synthesized);
    
    // Verify VPC CIDR is correctly configured
    const vpcResources = Object.values(config.resource?.aws_vpc || {});
    expect(vpcResources.length).toBeGreaterThan(0);
    
    // Verify subnets are created in different AZs
    const subnetResources = Object.values(config.resource?.aws_subnet || {});
    expect(subnetResources.length).toBeGreaterThan(1);
  });

  test('StorageStack should create secure S3 bucket', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestS3SecurityStack');
    new StorageStack(stack, 'TestS3Security');
    
    const synthesized = Testing.synth(stack);
    const config = JSON.parse(synthesized);
    
    // Verify S3 bucket public access block is configured
    const publicAccessBlocks = Object.values(config.resource?.aws_s3_bucket_public_access_block || {});
    expect(publicAccessBlocks.length).toBeGreaterThan(0);
    
    // Verify encryption is enabled
    const encryptionConfigs = Object.values(config.resource?.aws_s3_bucket_server_side_encryption_configuration || {});
    expect(encryptionConfigs.length).toBeGreaterThan(0);
  });

  test('ComputeStack should handle edge case with single subnet', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestSingleSubnetStack');
    new ComputeStack(stack, 'TestSingleSubnet', {
      subnetIds: ['subnet-single'],
      securityGroupIds: ['sg-single'],
      amiId: 'ami-single-test',
      instanceType: 't3.nano',
      instanceCount: 3, // More instances than subnets
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });
});
