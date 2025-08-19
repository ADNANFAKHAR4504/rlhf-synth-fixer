import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// Mocks are created to isolate the TapStack and test its wiring logic,
// simulating the behavior of the real modules.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnets: [{ id: 'mock-public-subnet-id-1' }, { id: 'mock-public-subnet-id-2' }],
      privateSubnets: [{ id: 'mock-private-subnet-id-1' }, { id: 'mock-private-subnet-id-2' }],
      instance: { id: 'mock-instance-id' },
    })),
    S3BucketModule: jest.fn(() => ({
      bucket: { bucket: 'mock-s3-bucket-name' },
    })),
  };
});

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const { VpcModule, S3BucketModule } = require('../lib/modules');

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
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Project: 'TAP',
            ManagedBy: 'Terraform',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestCustomStack.tfstate');

      const parsed = JSON.parse(synthesized);
      // It should merge the required 'Environment' tag with any custom tags provided.
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Environment: 'Production',
        Project: 'TAP',
        ManagedBy: 'Terraform',
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
    });

    test('should enable S3 backend state locking', () => {
      app = new App();
      stack = new TapStack(app, 'TestStateLocking');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
    });

    test('should create one VpcModule instance with correct properties', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'VpcAndCompute',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          ami: expect.any(String),
          tags: { Environment: 'Production' },
        })
      );
    });

    test('should create one S3BucketModule instance wired correctly', () => {
      expect(S3BucketModule).toHaveBeenCalledTimes(1);
      expect(S3BucketModule).toHaveBeenCalledWith(
        expect.anything(),
        'S3Bucket',
        expect.objectContaining({
          bucketName: expect.stringContaining('tap-secure-bucket-'),
          tags: { Environment: 'Production' },
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    test('should create the required outputs with values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      const synthesizedOutput = Testing.synth(stack);
      const outputs = JSON.parse(synthesizedOutput).output;

      expect(outputs.VpcId.value).toBe('mock-vpc-id');
      expect(outputs.PublicSubnetIds.value).toEqual(['mock-public-subnet-id-1', 'mock-public-subnet-id-2']);
      expect(outputs.PrivateSubnetIds.value).toEqual(['mock-private-subnet-id-1', 'mock-private-subnet-id-2']);
      expect(outputs.Ec2InstanceId.value).toBe('mock-instance-id');
      expect(outputs.S3BucketName.value).toBe('mock-s3-bucket-name');
    });
  });
});
