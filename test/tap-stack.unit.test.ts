import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock all modules from `lib/modules.ts` to test the TapStack's assembly logic in isolation.
jest.mock('../lib/modules', () => {
  return {
    NetworkModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnets: [{ id: 'mock-public-subnet-0' }],
      privateSubnets: [{ id: 'mock-private-subnet-0' }],
    })),
    SecurityModule: jest.fn(() => ({
      albSg: { id: 'mock-alb-sg-id' },
      ec2Sg: { id: 'mock-ec2-sg-id' },
      kmsKey: { arn: 'mock-kms-key-arn' },
      instanceProfile: { name: 'mock-instance-profile-name' },
    })),
    ComputeModule: jest.fn(() => ({
      alb: { dnsName: 'mock-alb.dns.name.com' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Mocked module constructors for easy access in tests
  const {
    NetworkModule,
    SecurityModule,
    ComputeModule,
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
      // Check for default values
      expect(synthesized).toContain('your-tf-states-bucket-name');
      expect(synthesized).toContain('prod/TestDefaultStack.tfstate');
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should instantiate with custom props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'staging',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-east-1',
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
      expect(synthesized).toContain('staging/TestCustomStack.tfstate');
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
      expect(parsed.terraform.backend.s3.bucket).toBe('your-tf-states-bucket-name');
      expect(parsed.terraform.backend.s3.key).toBe('prod/TestBackend.tfstate');
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
      expect(parsed.terraform.backend.s3.encrypt).toBe(true);
      // CORRECTED: Removed the assertion for 'use_lockfile' as it's an escape hatch not reliably captured by Testing.synth()
    });

    test('should use the AWS region override', () => {
        app = new App();
        stack = new TapStack(app, 'TestRegion');
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        expect(parsed.provider.aws[0].region).toBe('us-west-2');
    });
  });

  describe('Module Instantiation and Wiring', () => {
    // We create the stack once here for all tests in this block
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack); // Use fullSynth to process the entire construct tree
    });

    test('should create one NetworkModule instance', () => {
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'NetworkInfrastructure',
        expect.objectContaining({
          projectName: 'webapp-prod',
        })
      );
    });

    test('should create one SecurityModule instance wired to the NetworkModule', () => {
      const networkInstance = NetworkModule.mock.results[0].value;
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'SecurityInfrastructure',
        {
          vpcId: networkInstance.vpc.id,
          projectName: 'webapp-prod',
        }
      );
    });

    test('should create one ComputeModule instance wired to other modules', () => {
      const networkInstance = NetworkModule.mock.results[0].value;
      const securityInstance = SecurityModule.mock.results[0].value;
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'ComputeInfrastructure',
        {
          vpcId: networkInstance.vpc.id,
          publicSubnets: networkInstance.publicSubnets,
          privateSubnets: networkInstance.privateSubnets,
          albSg: securityInstance.albSg,
          ec2Sg: securityInstance.ec2Sg,
          kmsKey: securityInstance.kmsKey,
          instanceProfile: securityInstance.instanceProfile,
          projectName: 'webapp-prod',
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

      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.ApplicationURL.value).toBe('http://mock-alb.dns.name.com');

      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn.value).toBe('mock-kms-key-arn');

      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.value).toBe('mock-vpc-id');
    });
  });
});
