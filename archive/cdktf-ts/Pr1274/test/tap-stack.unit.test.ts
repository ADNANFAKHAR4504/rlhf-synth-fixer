import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// We mock all modules from `lib/modules.ts` to test the TapStack's assembly logic in isolation.
jest.mock('../lib/modules', () => {
  return {
   NetworkModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnet: { id: 'mock-public-subnet-id' },
      privateSubnet: { id: 'mock-private-subnet-id' },
      privateSubnet2: { id: 'mock-private-subnet-2-id' }, // <-- add this
      ec2SecurityGroup: { id: 'mock-ec2-sg-id' },
      rdsSecurityGroup: { id: 'mock-rds-sg-id' },
    })),
    ComputeModule: jest.fn(() => ({
      instance: { id: 'mock-instance-id', publicIp: 'mock-public-ip' },
    })),
    DatabaseModule: jest.fn(() => ({
      dbInstance: { endpoint: 'mock-rds-endpoint' },
      dbSecret: { arn: 'mock-secret-arn' },
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Destructure the mocked modules to access them in tests
  const {
    NetworkModule,
    ComputeModule,
    DatabaseModule,
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
        awsRegion: 'us-east-1', // This will be ignored due to the override
        defaultTags: {
          tags: { Project: 'TAP' },
        },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Verify custom props are used
      expect(parsed.terraform.backend.s3.bucket).toBe('my-custom-state-bucket');
      expect(parsed.terraform.backend.s3.key).toBe('prod/TestCustomStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2'); // Because of the override
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
      expect(parsed.provider.aws[0].region).toBe('us-west-2'); // Because of the override
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
      Testing.fullSynth(stack); // Use fullSynth to process the entire construct tree
    });

    test('should create one NetworkModule instance', () => {
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'Network',
        expect.objectContaining({
          vpcCidrBlock: '10.0.0.0/16',
          tags: { Environment: 'Production', Owner: 'DevOpsTeam' },
        })
      );
    });

    test('should create one ComputeModule instance wired to the NetworkModule', () => {
      const networkInstance = NetworkModule.mock.results[0].value;
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'Compute',
        expect.objectContaining({
          subnetId: networkInstance.publicSubnet.id,
          securityGroupId: networkInstance.ec2SecurityGroup.id,
          keyName: "my-dev-keypair",
        })
      );
    });

    test('should create one DatabaseModule instance wired to the NetworkModule', () => {
        const networkInstance = NetworkModule.mock.results[0].value;
        expect(DatabaseModule).toHaveBeenCalledTimes(1);
        expect(DatabaseModule).toHaveBeenCalledWith(
          expect.anything(),
          'Database',
          expect.objectContaining({
            securityGroupId: 'mock-rds-sg-id',
            subnetIds: expect.arrayContaining(['mock-private-subnet-id'])
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

      // Check that all outputs are defined
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetId).toBeDefined();
      expect(outputs.privateSubnetId).toBeDefined();
      expect(outputs.ec2InstanceId).toBeDefined();
      expect(outputs.ec2PublicIp).toBeDefined();
      expect(outputs.rdsInstanceEndpoint).toBeDefined();
      expect(outputs.databaseSecretArn).toBeDefined();

      // Check that outputs have correct values from mocks
      expect(outputs.vpcId.value).toBe('mock-vpc-id');
      expect(outputs.ec2InstanceId.value).toBe('mock-instance-id');
      expect(outputs.ec2PublicIp.value).toBe('mock-public-ip');
      expect(outputs.rdsInstanceEndpoint.value).toBe('mock-rds-endpoint');
      expect(outputs.databaseSecretArn.value).toBe('mock-secret-arn');
      
      // Check that sensitive outputs are marked as such
      expect(outputs.rdsInstanceEndpoint.sensitive).toBe(true);
      expect(outputs.databaseSecretArn.sensitive).toBe(true);
    });
  });
});
