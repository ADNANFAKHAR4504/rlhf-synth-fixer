import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock all modules from `lib/modules.ts` to test the TapStack's assembly logic in isolation.
// Each mock returns an object with the expected properties that the TapStack will use.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnet: { id: 'mock-public-subnet-id' },
      privateSubnet: { id: 'mock-private-subnet-id' },
    })),
    S3BucketModule: jest.fn(() => ({
      bucket: { bucket: 'mock-s3-bucket-name' },
    })),
    Ec2InstanceModule: jest.fn(() => ({
      instance: { id: 'mock-instance-id' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Mocked module constructors for easy access in tests
  const {
    VpcModule,
    S3BucketModule,
    Ec2InstanceModule,
  } = require('../lib/modules');

  // Clear all mocks before each test to ensure a clean slate
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
      // Check for default values from the template
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
            Owner: 'DevOps',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Check for custom values
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestCustomStack.tfstate');
      // Check for custom tags
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
    // We create the stack once here for all tests in this block
    beforeEach(() => {
      app = new App();
      // We use the default stack configuration for testing module wiring
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack); // Use fullSynth to process the entire construct tree
    });

    test('should create one VpcModule instance', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(), 
        'Vpc', 
        expect.objectContaining({
            cidrBlock: '10.0.0.0/16',
            availabilityZone: 'us-west-2a'
        })
      );
    });

    test('should create one S3BucketModule instance', () => {
        expect(S3BucketModule).toHaveBeenCalledTimes(1);
        expect(S3BucketModule).toHaveBeenCalledWith(
          expect.anything(),
          'S3Bucket',
          expect.objectContaining({
            bucketName: expect.stringContaining('tap-secure-bucket-'),
          })
        );
      });

    test('should create one Ec2InstanceModule wired to the VPC', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(Ec2InstanceModule).toHaveBeenCalledTimes(1);
      expect(Ec2InstanceModule).toHaveBeenCalledWith(
        expect.anything(),
        'Ec2Instance',
        {
          vpcId: vpcInstance.vpc.id,
          subnetId: vpcInstance.privateSubnet.id, // Should be in the private subnet
          ami: expect.any(String), // AMI is a data source, so we just check for a string
        }
      );
    });
  });

  describe('Terraform Outputs', () => {
    test('should create the required outputs with values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      const synthesizedOutput = Testing.synth(stack);
      const outputs = JSON.parse(synthesizedOutput).output;

      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.value).toBe('mock-vpc-id');

      expect(outputs.PublicSubnetId).toBeDefined();
      expect(outputs.PublicSubnetId.value).toBe('mock-public-subnet-id');

      expect(outputs.PrivateSubnetId).toBeDefined();
      expect(outputs.PrivateSubnetId.value).toBe('mock-private-subnet-id');

      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName.value).toBe('mock-s3-bucket-name');
      
      expect(outputs.Ec2InstanceId).toBeDefined();
      expect(outputs.Ec2InstanceId.value).toBe('mock-instance-id');
    });
  });
});
