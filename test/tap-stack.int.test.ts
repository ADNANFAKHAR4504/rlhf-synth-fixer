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
      publicSubnets: [{ id: 'mock-public-subnet-id-0' }, { id: 'mock-public-subnet-id-1' }],
    })),
    SecurityGroupModule: jest.fn(() => ({
      securityGroup: { id: 'mock-sg-id' },
    })),
    AutoScalingModule: jest.fn(() => ({
      autoScalingGroup: { name: 'mock-asg-name' },
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

  const { VpcModule, SecurityGroupModule, AutoScalingModule, S3BucketModule } = require('../lib/modules');

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
    });
    test('TapStack should instantiate with custom props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-east-1',
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
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Project: 'TAP',
        ManagedBy: 'Terraform',
      });
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

    // FIX: Updated test case for VpcModule
    test('should create one VpcModule instance with correct properties', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'tap-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          env: 'dev',
          project: 'tap',
        })
      );
    });

    // FIX: Added test case for SecurityGroupModule
    test('should create one SecurityGroupModule instance wired to the VpcModule', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'web-server-sg',
        expect.objectContaining({
          vpcId: vpcInstance.vpc.id,
          name: 'web-server',
          description: 'Allows HTTP and SSH access',
        })
      );
    });

    // FIX: Added test case for AutoScalingModule
    test('should create one AutoScalingModule instance wired to VpcModule and SecurityGroupModule', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const sgInstance = SecurityGroupModule.mock.results[0].value;
      expect(AutoScalingModule).toHaveBeenCalledTimes(1);
      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        'web-asg',
        expect.objectContaining({
          subnetIds: [
            vpcInstance.publicSubnets[0].id,
            vpcInstance.publicSubnets[1].id,
          ],
          securityGroupIds: [sgInstance.securityGroup.id],
          amiId: 'ami-04e08e36e17a21b56',
          instanceType: 't2.micro',
        })
      );
    });

    // FIX: Updated test case for S3BucketModule
    test('should create one S3BucketModule instance with correct properties', () => {
      expect(S3BucketModule).toHaveBeenCalledTimes(1);
      expect(S3BucketModule).toHaveBeenCalledWith(
        expect.anything(),
        'app-bucket',
        expect.objectContaining({
          env: 'dev',
          project: 'tap',
          name: 'app-assets',
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    // FIX: Updated test case to match the actual TerraformOutput names and values
    test('should create the required outputs with values from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      const synthesizedOutput = Testing.synth(stack);
      const outputs = JSON.parse(synthesizedOutput).output;

      const vpcInstance = VpcModule.mock.results[0].value;
      const sgInstance = SecurityGroupModule.mock.results[0].value;
      const asgInstance = AutoScalingModule.mock.results[0].value;
      const s3Instance = S3BucketModule.mock.results[0].value;

      expect(outputs.vpc_id.value).toBe(vpcInstance.vpc.id);
      expect(outputs.web_server_sg_id.value).toBe(sgInstance.securityGroup.id);
      expect(outputs.web_asg_name.value).toBe(asgInstance.autoScalingGroup.name);
      expect(outputs.app_bucket_name.value).toBe(s3Instance.bucket.bucket);
    });
  });
});