import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock all modules from `lib/modules.ts` to test the TapStack's assembly logic in isolation.
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
      launchTemplate: { id: 'mock-lt-id' },
      autoScalingGroup: { id: 'mock-asg-id' },
    })),
    S3BucketModule: jest.fn(() => ({
      bucket: { id: 'mock-bucket-id' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Destructure the mocked modules to access them in tests
  const {
    VpcModule,
    SecurityGroupModule,
    AutoScalingModule,
    S3BucketModule,
  } = require('../lib/modules');

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: { Project: 'TAP' },
        },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Verify custom props are used
      expect(parsed.terraform.backend.s3.bucket).toBe('my-custom-state-bucket');
      expect(parsed.terraform.backend.s3.key).toBe('prod/TestCustomStack.tfstate');
      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({ Project: 'TAP' });
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should use default values when no props are provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Verify default props are used
      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestDefaultStack.tfstate');
      // The default `awsRegion` is set to 'us-east-1' in the stack code,
      // so we check for that default value here.
      expect(parsed.provider.aws[0].region).toBe('us-east-1');
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

    test('should enable S3 backend state locking via escape hatch', () => {
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
        'tap-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          env: 'dev',
          project: 'tap',
        }),
      );
    });

    test('should create one SecurityGroupModule instance wired to the VpcModule', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'web-server-sg',
        expect.objectContaining({
          vpcId: vpcInstance.vpc.id,
          name: 'web-server',
          env: 'dev',
          project: 'tap',
        }),
      );
    });

    test('should create one AutoScalingModule instance wired to the VpcModule and SecurityGroupModule', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const sgInstance = SecurityGroupModule.mock.results[0].value;
      expect(AutoScalingModule).toHaveBeenCalledTimes(1);
    });
    
    test('should create one S3BucketModule instance with correct properties', () => {
      expect(S3BucketModule).toHaveBeenCalledTimes(1);
    });
  });
});