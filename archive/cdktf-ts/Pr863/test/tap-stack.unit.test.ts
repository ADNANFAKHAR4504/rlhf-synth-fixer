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
      publicSubnets: [{ id: 'mock-public-subnet-0' }],
      privateSubnets: [{ id: 'mock-private-subnet-0' }],
    })),
    S3LoggingBucketModule: jest.fn(() => ({
      bucket: { bucket: 'mock-logging-bucket-name' },
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
    S3LoggingBucketModule,
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
        Environment: 'Production',
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

    test('should use the AWS region override', () => {
        app = new App();
        stack = new TapStack(app, 'TestRegion');
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        expect(parsed.provider.aws[0].region).toBe('us-west-2');
    });

    test('should enable S3 backend state locking', () => {
        app = new App();
        stack = new TapStack(app, 'TestStateLocking');
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });

    test('should not allow overriding the Environment: Production tag', () => {
        app = new App();
        stack = new TapStack(app, 'TestTagOverride', {
            defaultTags: {
                tags: {
                    Environment: 'Staging', // Attempt to override
                    Project: 'TAP'
                }
            }
        });
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        // The 'Production' value should be preserved
        expect(parsed.provider.aws[0].default_tags[0].tags.Environment).toBe('Production');
        expect(parsed.provider.aws[0].default_tags[0].tags.Project).toBe('TAP');
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

    test('should create one S3LoggingBucketModule instance', () => {
      expect(S3LoggingBucketModule).toHaveBeenCalledTimes(1);
      expect(S3LoggingBucketModule).toHaveBeenCalledWith(
        expect.anything(),
        'LoggingBucketModule',
        expect.objectContaining({
          bucketName: expect.stringContaining('logging-bucket-dev-'),
        })
      );
    });

    test('should create one VpcModule instance', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(expect.anything(), 'VpcModule');
    });

    test('should create one Ec2InstanceModule wired to the VPC', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(Ec2InstanceModule).toHaveBeenCalledTimes(1);
      expect(Ec2InstanceModule).toHaveBeenCalledWith(
        expect.anything(),
        'Ec2InstanceModule',
        {
          vpcId: vpcInstance.vpc.id,
          subnetId: vpcInstance.publicSubnets[0].id,
          sshCidrBlock: '0.0.0.0/0',
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

      expect(outputs.LoggingBucketName).toBeDefined();
      expect(outputs.LoggingBucketName.value).toBe('mock-logging-bucket-name');

      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.value).toBe('mock-vpc-id');

      expect(outputs.Ec2InstanceId).toBeDefined();
      expect(outputs.Ec2InstanceId.value).toBe('mock-instance-id');
    });
  });
});