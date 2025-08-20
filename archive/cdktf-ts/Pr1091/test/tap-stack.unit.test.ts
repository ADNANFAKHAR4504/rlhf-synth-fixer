import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mock the resource creation helpers from modules.ts ---
jest.mock('../lib/modules', () => {
  return {
    createStateBucket: jest.fn(() => ({
      bucketName: 'mock-tfstate-bucket',
      bucketArn: 'arn:aws:s3:::mock-tfstate-bucket',
    })),
    createHighAvailabilityVpc: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      publicSubnetIds: ['subnet-public-1', 'subnet-public-2'],
      privateSubnetIds: ['subnet-private-1', 'subnet-private-2'],
    })),
    createEc2S3StateRole: jest.fn(() => ({
      name: 'mock-ec2-s3-role',
      arn: 'arn:aws:iam::123456789012:role/mock-ec2-s3-role',
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const {
    createStateBucket,
    createHighAvailabilityVpc,
    createEc2S3StateRole,
  } = require('../lib/modules');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with default props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('iac-rlhf-tf-states');
      expect(synthesized).toContain('dev/TestDefaultStack.tfstate');
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should instantiate with custom props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'staging',
        stateBucket: 'custom-state-bucket',
        awsRegion: 'us-west-1',
        defaultTags: {
          tags: {
            Project: 'TAP',
            Owner: 'DevOps',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('custom-state-bucket');
      expect(synthesized).toContain('staging/TestCustomStack.tfstate');
      const parsed = JSON.parse(synthesized);
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Project: 'TAP',
        Owner: 'DevOps',
      });
      expect(synthesized).toMatchSnapshot();
    });

    test('should configure the S3 backend correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackend');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3).toBeDefined();
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestBackend.tfstate');
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
      expect(parsed.terraform.backend.s3.encrypt).toBe(true);
      expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Invocation', () => {
    test('should call createStateBucket, createHighAvailabilityVpc, and createEc2S3StateRole if used', () => {
      app = new App();
      stack = new TapStack(app, 'TestModules');
      Testing.fullSynth(stack);

      // NOTE: Right now TapStack does not call these functions,
      // but this test ensures they are invoked when added.
      expect(createStateBucket).toHaveBeenCalledTimes(1);
      expect(createHighAvailabilityVpc).toHaveBeenCalledTimes(1);
      expect(createEc2S3StateRole).toHaveBeenCalledTimes(1);
    });
  });
});