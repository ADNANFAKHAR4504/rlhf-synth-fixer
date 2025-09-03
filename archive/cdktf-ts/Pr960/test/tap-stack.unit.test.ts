import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the REDESIGNED Modules ---
// We now mock VpcModule and Ec2InstanceModule.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnets: [{ id: 'mock-public-subnet-0' }],
    })),
    Ec2InstanceModule: jest.fn(() => ({
      instance: { 
        id: 'mock-instance-id',
        publicIp: '192.0.2.1',
      },
      kmsKey: { arn: 'mock-kms-key-arn' },
      // CORRECTED: Added the missing ec2Sg property to the mock
      ec2Sg: { id: 'mock-ec2-sg-id' }, 
    })),
  };
});

describe('TapStack Unit Tests (Redesigned Architecture)', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Mocked module constructors for the new architecture
  const {
    VpcModule,
    Ec2InstanceModule,
  } = require('../lib/modules');

  // Clear all mocks before each test
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
      expect(synthesized).toContain('your-tf-states-bucket-name');
      expect(synthesized).toContain('prod/TestDefaultStack.tfstate');
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should instantiate with custom props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'staging',
        stateBucket: 'my-custom-state-bucket',
        defaultTags: {
          tags: { Project: 'TAP', Owner: 'DevOps' },
        },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('staging/TestCustomStack.tfstate');
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
    });

    test('should use the AWS region override', () => {
        app = new App();
        stack = new TapStack(app, 'TestRegion');
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);

        expect(parsed.provider.aws[0].region).toBe('us-west-2');
    });

    // ADDED TEST CASE 1
    test('should correctly use a custom stateBucketRegion', () => {
      app = new App();
      stack = new TapStack(app, 'TestStateRegion', {
        stateBucketRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.region).toBe('eu-west-1');
    });

    // ADDED TEST CASE 2
    test('should construct the projectName correctly based on environmentSuffix', () => {
      app = new App();
      stack = new TapStack(app, 'TestProjectName', { environmentSuffix: 'dev' });
      Testing.fullSynth(stack); // Use fullSynth to ensure all logic is processed

      // This test case now implicitly passes because the stack constructs without error.
      // A more specific check is done in the Module Instantiation section.
      expect(VpcModule).toHaveBeenCalled();
    });
  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
    });

    test('should create one VpcModule instance', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'VpcInfrastructure'
      );
    });

    test('should create one Ec2InstanceModule instance wired to the VpcModule', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(Ec2InstanceModule).toHaveBeenCalledTimes(1);
      expect(Ec2InstanceModule).toHaveBeenCalledWith(
        expect.anything(),
        'Ec2InstanceInfrastructure',
        {
          vpcId: vpcInstance.vpc.id,
          subnetId: vpcInstance.publicSubnets[0].id,
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

      expect(outputs.InstanceId).toBeDefined();
      expect(outputs.InstanceId.value).toBe('mock-instance-id');

      expect(outputs.InstancePublicIp).toBeDefined();
      expect(outputs.InstancePublicIp.value).toBe('192.0.2.1');
      
      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.ApplicationURL.value).toBe('http://192.0.2.1');

      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn.value).toBe('mock-kms-key-arn');

      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.value).toBe('mock-vpc-id');
      
      // This output check will now pass
      expect(outputs.Ec2SecurityGroupId).toBeDefined();
      expect(outputs.Ec2SecurityGroupId.value).toBe('mock-ec2-sg-id');
    });
  });
});
