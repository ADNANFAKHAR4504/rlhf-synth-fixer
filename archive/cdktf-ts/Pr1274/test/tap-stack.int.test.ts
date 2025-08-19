import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// Updated mock includes privateSubnet2 for Multi-AZ support
jest.mock('../lib/modules', () => {
  return {
    NetworkModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      publicSubnet: { id: 'mock-public-subnet-id' },
      privateSubnet: { id: 'mock-private-subnet-id' },
      privateSubnet2: { id: 'mock-private-subnet-2-id' }, // Added for Multi-AZ
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

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const { NetworkModule, ComputeModule, DatabaseModule } = require('../lib/modules');

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
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
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
          keyName: 'my-dev-keypair',
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
          subnetIds: [
            networkInstance.privateSubnet.id,
            networkInstance.privateSubnet2.id, // Multi-AZ subnet included
          ],
          securityGroupId: networkInstance.rdsSecurityGroup.id,
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

      expect(outputs.vpcId.value).toBe('mock-vpc-id');
      expect(outputs.publicSubnetId.value).toBe('mock-public-subnet-id');
      expect(outputs.privateSubnetId.value).toBe('mock-private-subnet-id');
      expect(outputs.ec2InstanceId.value).toBe('mock-instance-id');
      expect(outputs.ec2PublicIp.value).toBe('mock-public-ip');
      expect(outputs.rdsInstanceEndpoint.value).toBe('mock-rds-endpoint');
      expect(outputs.rdsInstanceEndpoint.sensitive).toBe(true);
      expect(outputs.databaseSecretArn.value).toBe('mock-secret-arn');
      expect(outputs.databaseSecretArn.sensitive).toBe(true);
    });
  });
});
