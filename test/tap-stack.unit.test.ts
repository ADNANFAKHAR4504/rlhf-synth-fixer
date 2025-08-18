// test/tap-stack.unit.test.ts
import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
jest.mock('../lib/modules', () => {
  return {
    NetworkModule: jest.fn((scope: any, id: string, provider?: any) => ({
      vpc: { id: 'mock-vpc-id' },
      privateSubnetIds: ['mock-private-subnet-id'],
    })),
    KmsModule: jest.fn((scope: any, id: string, opts?: any) => ({
      kmsKey: { arn: 'mock-kms-arn' },
    })),
    ComputeModule: jest.fn((scope: any, id: string, opts?: any) => ({
      instance: { id: 'mock-instance-id', privateIp: 'mock-private-ip' },
    })),
    DatabaseModule: jest.fn((scope: any, id: string, opts?: any) => ({
      db: { endpoint: 'mock-rds-endpoint' },
      dbSecret: { arn: 'mock-rds-secret-arn' },
    })),
    StorageModule: jest.fn((scope: any, id: string, opts?: any) => ({
      bucket: { bucket: 'mock-s3-bucket' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const {
    NetworkModule,
    KmsModule,
    ComputeModule,
    DatabaseModule,
    StorageModule,
  } = require('../lib/modules');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // Stack Configuration Tests
  // ------------------------
  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-west-2',
        defaultTags: { tags: { Project: 'TAP' } },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('my-custom-state-bucket');
      expect(parsed.terraform.backend.s3.key).toBe('prod/TestCustomStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should use default values when no props are provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestDefaultStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');
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
      expect(parsed.terraform.backend.s3.region).toBe('us-east-1'); // <- updated
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

  // ------------------------
  // Module Instantiation Tests
  // ------------------------
  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
    });

    test('should create NetworkModule instance', () => {
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.anything() // <-- accept provider argument
      );
    });

    test('should create KmsModule instance', () => {
      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({ project: 'tap', env: 'dev' })
      );
    });

    test('should create ComputeModule wired to Network and KMS', () => {
      const network = NetworkModule.mock.results[0].value;
      const kms = KmsModule.mock.results[0].value;

      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          vpcId: network.vpc.id,
          subnetId: network.privateSubnetIds[0],
          kmsKeyId: kms.kmsKey.arn,
        })
      );
    });

    test('should create DatabaseModule wired to Network and KMS', () => {
      const network = NetworkModule.mock.results[0].value;
      const kms = KmsModule.mock.results[0].value;

      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          subnetIds: network.privateSubnetIds,
          kmsKeyArn: kms.kmsKey.arn,
        })
      );
    });

    test('should create StorageModule wired to KMS', () => {
      const kms = KmsModule.mock.results[0].value;

      expect(StorageModule).toHaveBeenCalledTimes(1);
      expect(StorageModule).toHaveBeenCalledWith(
        expect.anything(),
        'storage',
        expect.objectContaining({
          project: 'tap',
          env: 'dev',
          kmsKeyArn: kms.kmsKey.arn,
        })
      );
    });
  });

  // ------------------------
  // Terraform Outputs Tests
  // ------------------------
  describe('Terraform Outputs', () => {
    test('should create all required outputs from mocked modules', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      synthesized = Testing.synth(stack);
      const outputs = JSON.parse(synthesized).output;

      expect(outputs.vpcId.value).toBe('mock-vpc-id');
      expect(outputs.privateSubnetId.value).toBe('mock-private-subnet-id');
      expect(outputs.ec2InstanceId.value).toBe('mock-instance-id');
      expect(outputs.ec2PrivateIp.value).toBe('mock-private-ip');
      expect(outputs.rdsInstanceEndpoint.value).toBe('mock-rds-endpoint');
      expect(outputs.rdsSecretArn.value).toBe('mock-rds-secret-arn');
      expect(outputs.s3BucketName.value).toBe('mock-s3-bucket');

      expect(outputs.rdsInstanceEndpoint.sensitive).toBe(true);
      expect(outputs.rdsSecretArn.sensitive).toBe(true);
    });
  });
});
