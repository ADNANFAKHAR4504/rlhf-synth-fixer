import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock the consolidated VpcModule and the S3BucketModule to test the TapStack in isolation.
jest.mock('../lib/modules', () => {
  return {
    // The new VpcModule now includes the instance and returns arrays for subnets.
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

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Import the mocked modules
  const { VpcModule, S3BucketModule } = require('../lib/modules');

  beforeEach(() => {
    // Clear all mocks before each test to ensure a clean state
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with custom props and merge tags', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-east-1', // This will be overridden
        defaultTags: {
          tags: { Project: 'TAP', Owner: 'Test' },
        },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Verify custom backend configuration
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestCustomStack.tfstate');

      // Verify provider configuration (region override should take precedence)
      expect(parsed.provider.aws[0].region).toBe('us-west-2');

      // Verify that 'Environment: Production' is merged with custom tags
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Environment: 'Production',
        Project: 'TAP',
        Owner: 'Test',
      });
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should use default values and required tags when no props are provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Verify default backend and provider configuration
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestDefaultStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');

      // Verify that the default 'Environment: Production' tag is present
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Environment: 'Production',
      });
      expect(synthesized).toMatchSnapshot();
    });

    test('should configure the S3 backend with state locking', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackend');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3).toBeDefined();
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestBackend.tfstate');
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
      expect(parsed.terraform.backend.s3.encrypt).toBe(true);
      // Verify escape hatch for state locking
      expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack); // Synthesize the stack to trigger constructor logic
    });

    test('should create one VpcModule instance with correct props', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'VpcAndCompute', // The ID of the module in the stack
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          // FIX: Use expect.any(String) for tokenized values to make the test more robust.
          ami: expect.any(String),
          tags: { Environment: 'Production' },
        })
      );
    });

    test('should create one S3BucketModule instance with correct props', () => {
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
    test('should create all required outputs from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      synthesized = Testing.synth(stack);
      const outputs = JSON.parse(synthesized).output;

      // Verify all outputs are defined
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.Ec2InstanceId).toBeDefined();

      // Verify the values from the mocked modules
      expect(outputs.VpcId.value).toBe('mock-vpc-id');
      // Verify that subnet IDs are correctly mapped from the mock arrays
      expect(outputs.PublicSubnetIds.value).toEqual(['mock-public-subnet-id-1', 'mock-public-subnet-id-2']);
      expect(outputs.PrivateSubnetIds.value).toEqual(['mock-private-subnet-id-1', 'mock-private-subnet-id-2']);
      expect(outputs.S3BucketName.value).toBe('mock-s3-bucket-name');
      expect(outputs.Ec2InstanceId.value).toBe('mock-instance-id');
    });
  });
});
