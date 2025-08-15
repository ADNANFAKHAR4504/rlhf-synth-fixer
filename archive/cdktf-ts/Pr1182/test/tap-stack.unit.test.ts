import { App, Testing, TerraformOutput } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock the VpcModule and Ec2Module to test the TapStack's assembly logic in isolation.
// The mocks return objects with the expected properties that the TapStack will use for wiring and outputs.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      publicSubnetIds: ['mock-public-subnet-1', 'mock-public-subnet-2'],
      privateSubnetId: 'mock-private-subnet-1',
    })),
    Ec2Module: jest.fn(() => ({
      securityGroupId: 'mock-ec2-sg-id',
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Mocked module constructors for easy access in tests
  const { VpcModule, Ec2Module } = require('../lib/modules');

  // Clear all mocks before each test to ensure a clean slate
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    beforeEach(() => {
        app = new App();
    });

    test('TapStack should instantiate with default props and match snapshot', () => {
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Check for default values from the template
      expect(synthesized).toContain('iac-rlhf-tf-states'); // Default state bucket
      expect(synthesized).toContain('dev/TestDefaultStack.tfstate'); // Default state key
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should instantiate with custom props and match snapshot', () => {
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-west-2',
        sshKeyName: 'my-prod-key',
        defaultTags: {
          tags: {
            Project: 'TAP',
            Environment: 'Production',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Check for custom values
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestCustomStack.tfstate');
      expect(synthesized).toMatchSnapshot();
    });
    
    test('should configure the AWS provider with the correct region and tags', () => {
      stack = new TapStack(app, 'TestProvider', {
        awsRegion: 'eu-central-1',
        defaultTags: { tags: { Owner: 'TeamA' } },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.provider.aws[0].region).toBe('eu-central-1');
      expect(parsed.provider.aws[0].default_tags[0].tags.Owner).toBe('TeamA');
    });

    test('should configure the S3 backend with correct properties', () => {
        stack = new TapStack(app, 'TestBackend', {
            stateBucket: 'my-backend-bucket',
            stateBucketRegion: 'us-west-1',
            environmentSuffix: 'staging',
        });
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        expect(parsed.terraform.backend.s3.bucket).toBe('my-backend-bucket');
        expect(parsed.terraform.backend.s3.key).toBe('staging/TestBackend.tfstate');
        expect(parsed.terraform.backend.s3.region).toBe('us-west-1');
    });

    test('should enable S3 state locking via override', () => {
        stack = new TapStack(app, 'TestStateLocking');
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);
        
        expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
    });

    test('should create one VpcModule instance', () => {
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
      
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'VpcModule'
      );
    });

    test('should create one Ec2Module instance wired to the VpcModule and props', () => {
      stack = new TapStack(app, 'TestModuleWiring', {
        sshKeyName: 'test-wiring-key',
      });
      Testing.fullSynth(stack);
      const vpcInstance = VpcModule.mock.results[0].value;

      expect(Ec2Module).toHaveBeenCalledTimes(1);
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'Ec2Module',
        expect.objectContaining({
          vpcId: vpcInstance.vpcId,
          publicSubnetIds: vpcInstance.publicSubnetIds,
          sshKeyName: 'test-wiring-key',
        })
      );
    });

    test('should use default sshKeyName if not provided in props', () => {
        stack = new TapStack(app, 'TestDefaultSshKey');
        Testing.fullSynth(stack);
        
        expect(Ec2Module).toHaveBeenCalledWith(
            expect.anything(),
            'Ec2Module',
            expect.objectContaining({
                sshKeyName: 'your-dev-key', // Check the fallback value
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

      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId.value).toBe('mock-vpc-id');

      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.publicSubnetIds.value).toBe(
        'mock-public-subnet-1, mock-public-subnet-2'
      );

      expect(outputs.privateSubnetId).toBeDefined();
      expect(outputs.privateSubnetId.value).toBe('mock-private-subnet-1');

      expect(outputs.ec2SecurityGroupId).toBeDefined();
      expect(outputs.ec2SecurityGroupId.value).toBe('mock-ec2-sg-id');
    });
  });
});
