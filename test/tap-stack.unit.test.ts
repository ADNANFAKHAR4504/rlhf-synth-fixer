// __tests__/tap-stack.unit.test.ts
import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
jest.mock('../lib/modules', () => {
  return {
    NetworkModule: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      publicSubnetIds: ['mock-public-subnet-id'],
      privateSubnetId: 'mock-private-subnet-id',
    })),
    SecurityModule: jest.fn(() => ({
      securityGroupId: 'mock-security-group-id',
    })),
    ComputeModule: jest.fn(() => ({
      instanceId: 'mock-instance-id',
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const {
    NetworkModule,
    SecurityModule,
    ComputeModule,
  } = require('../lib/modules');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('should instantiate with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'CustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'ap-south-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Project: 'Custom' },
        },
        sshKeyName: 'my-key',
      });

      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Backend settings
      expect(synthesized).toContain('custom-bucket');
      expect(synthesized).toContain('prod/CustomStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2'); // override

      // Default tags
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({ Project: 'Custom' });

      expect(synthesized).toMatchSnapshot();
    });

    test('should use default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'DefaultStack');

      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/DefaultStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2'); // override
      expect(synthesized).toMatchSnapshot();
    });

    test('should configure S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'BackendStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3).toBeDefined();
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/BackendStack.tfstate');
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
      expect(parsed.terraform.backend.s3.encrypt).toBe(true);
    });

    test('should enable S3 backend state locking', () => {
      app = new App();
      stack = new TapStack(app, 'LockingStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'ModuleWiringStack');
      Testing.fullSynth(stack);
    });

    test('should create NetworkModule with correct AZ', () => {
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'NetworkModule',
        expect.objectContaining({
          availabilityZone: 'us-west-2a',
        })
      );
    });

    test('should create SecurityModule wired to NetworkModule VPC', () => {
      const netInstance = NetworkModule.mock.results[0].value;
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'SecurityModule',
        expect.objectContaining({
          vpcId: netInstance.vpcId,
        })
      );
    });

    test('should create ComputeModule wired to network and security', () => {
      const netInstance = NetworkModule.mock.results[0].value;
      const secInstance = SecurityModule.mock.results[0].value;
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'ComputeModule',
        expect.objectContaining({
          vpcId: netInstance.vpcId,
          publicSubnetIds: netInstance.publicSubnetIds,
          securityGroupId: secInstance.securityGroupId,
          sshKeyName: expect.any(String),
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    test('should output values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'OutputStack');
      const outputs = JSON.parse(Testing.synth(stack)).output;

      expect(outputs.vpcId.value).toBe('mock-vpc-id');
      expect(outputs.publicSubnetIds.value).toContain('mock-public-subnet-id');
      expect(outputs.privateSubnetId.value).toBe('mock-private-subnet-id');
      expect(outputs.securityGroupId.value).toBe('mock-security-group-id');
      expect(outputs.instanceId.value).toBe('mock-instance-id');
    });
  });
});
