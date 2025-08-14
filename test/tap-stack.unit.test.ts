// __tests__/tap-stack.unit.test.ts
import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnets: [{ id: 'mock-public-subnet-id' }],
      privateSubnets: [{ id: 'mock-private-subnet-id' }],
    })),
    SecurityGroupModule: jest.fn(() => ({
      securityGroup: { id: 'mock-security-group-id' },
    })),
    LaunchTemplateModule: jest.fn(() => ({
      launchTemplate: { id: 'mock-launch-template-id' },
    })),
    AutoScalingGroupModule: jest.fn(() => ({
      autoScalingGroup: { id: 'mock-asg-id' },
    })),
    S3Module: jest.fn(() => ({
      bucket: { bucket: 'mock-bucket-name' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const {
    VpcModule,
    SecurityGroupModule,
    LaunchTemplateModule,
    AutoScalingGroupModule,
    S3Module,
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
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: { Project: 'Custom' },
        },
      });

      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Backend settings
      expect(synthesized).toContain('custom-bucket');
      expect(synthesized).toContain('prod/CustomStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');

      // Default tags
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Project: 'Custom',
      });

      expect(synthesized).toMatchSnapshot();
    });

    test('should use default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'DefaultStack');

      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/DefaultStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-east-1');
      expect(synthesized).toMatchSnapshot();
    });

    test('should configure S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'BackendStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3).toBeDefined();
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe(
        'dev/BackendStack.tfstate'
      );
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

    test('should create VpcModule with correct props', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpcModule',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          environment: expect.any(String),
        })
      );
    });

    test('should create SecurityGroupModule wired to VpcModule VPC', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'ec2SecurityGroup',
        expect.objectContaining({
          vpcId: vpcInstance.vpc.id,
        })
      );
    });

    test('should create LaunchTemplateModule wired to security group', () => {
      const sgInstance = SecurityGroupModule.mock.results[0].value;
      expect(LaunchTemplateModule).toHaveBeenCalledTimes(1);
      expect(LaunchTemplateModule).toHaveBeenCalledWith(
        expect.anything(),
        'launchTemplateModule',
        expect.objectContaining({
          securityGroupIds: [sgInstance.securityGroup.id],
        })
      );
    });

    test('should create AutoScalingGroupModule wired to launch template', () => {
      const ltInstance = LaunchTemplateModule.mock.results[0].value;
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(AutoScalingGroupModule).toHaveBeenCalledTimes(1);
      expect(AutoScalingGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'autoScalingGroupModule',
        expect.objectContaining({
          launchTemplateId: ltInstance.launchTemplate.id,
          subnetIds: vpcInstance.publicSubnets.map((s: any) => s.id),
        })
      );
    });

    test('should create S3Module with correct name', () => {
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3BucketModule',
        expect.objectContaining({
          bucketName: expect.stringContaining('-data-'),
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    test('should output values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'OutputStack');
      const outputs = JSON.parse(Testing.synth(stack)).output;

      expect(outputs.vpc_id.value).toBe('mock-vpc-id');
      expect(outputs.public_subnet_ids.value).toContain(
        'mock-public-subnet-id'
      );
      expect(outputs.ec2_security_group_id.value).toBe(
        'mock-security-group-id'
      );
    });
  });
});
