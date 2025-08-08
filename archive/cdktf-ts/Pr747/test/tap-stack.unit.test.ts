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
      privateSubnets: [
        { id: 'mock-private-subnet-1' },
        { id: 'mock-private-subnet-2' },
      ],
      natGateway: { id: 'mock-nat-gw-id' }, // Mocking the natGateway object itself
    })),
    BastionSgModule: jest.fn(() => ({
      securityGroup: { id: 'mock-bastion-sg-id' },
    })),
    RdsSgModule: jest.fn(() => ({
      securityGroup: { id: 'mock-rds-sg-id' },
    })),
    SecretsManagerModule: jest.fn(() => ({
      password: { result: 'mock-secure-password-from-secret' },
      secret: { arn: 'mock-secret-arn' },
    })),
    RdsModule: jest.fn(() => ({
      dbInstance: { endpoint: 'mock-rds-endpoint.amazonaws.com' },
    })),
    S3LoggingBucketModule: jest.fn(() => ({
      bucket: { bucket: 'aurora-prod-logs-mockbucket' },
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
    BastionSgModule,
    RdsSgModule,
    SecretsManagerModule,
    RdsModule,
    S3LoggingBucketModule,
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
            Project: 'Aurora',
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

    // This new test covers the conditional branches for props, increasing coverage.
    test('TapStack should use defaults when props object is empty', () => {
      app = new App();
      // Pass an empty object to hit the fallback '||' conditions
      stack = new TapStack(app, 'TestEmptyProps', {});
      synthesized = Testing.synth(stack);

      const parsed = JSON.parse(synthesized);
      // Verify that the default_tags block is an empty array as expected
      expect(parsed.provider.aws[0].default_tags).toEqual([]);
      // Verify the region falls back to the default
      expect(parsed.provider.aws[0].region).toBe('us-west-2'); // Because AWS_REGION_OVERRIDE is set
      expect(synthesized).toMatchSnapshot();
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

    test('should create one VpcModule instance with correct configuration', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'aurora-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['us-west-2a', 'us-west-2b'],
        })
      );
    });

    test('should create one BastionSgModule and one RdsSgModule wired to the VPC', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(BastionSgModule).toHaveBeenCalledTimes(1);
      expect(BastionSgModule).toHaveBeenCalledWith(
        expect.anything(),
        'aurora-bastion-sg',
        { vpcId: vpcInstance.vpc.id }
      );

      expect(RdsSgModule).toHaveBeenCalledTimes(1);
      expect(RdsSgModule).toHaveBeenCalledWith(
        expect.anything(),
        'aurora-rds-sg',
        { vpcId: vpcInstance.vpc.id }
      );
    });

    test('should create one S3LoggingBucketModule', () => {
      expect(S3LoggingBucketModule).toHaveBeenCalledTimes(1);
      expect(S3LoggingBucketModule).toHaveBeenCalledWith(
        expect.anything(),
        'aurora-logging-bucket'
      );
    });

    test('should create one SecretsManagerModule', () => {
      expect(SecretsManagerModule).toHaveBeenCalledTimes(1);
      expect(SecretsManagerModule).toHaveBeenCalledWith(
        expect.anything(),
        'aurora-db-secrets'
      );
    });

    test('should create one RdsModule wired to all other components', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const rdsSgInstance = RdsSgModule.mock.results[0].value;
      const secretsInstance = SecretsManagerModule.mock.results[0].value;

      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'aurora-rds',
        expect.objectContaining({
          privateSubnetIds: vpcInstance.privateSubnets.map((s: any) => s.id),
          vpcSecurityGroupIds: [rdsSgInstance.securityGroup.id],
          dbUsername: 'auroraadmin',
          dbPassword: secretsInstance.password.result, // Check wiring from Secrets Manager
          natGateway: vpcInstance.natGateway, // Check wiring for dependency
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

      // FIX: Changed all assertions to use camelCase to match the TerraformOutput definitions.
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId.value).toBe('mock-vpc-id');

      expect(outputs.rdsInstanceEndpoint).toBeDefined();
      expect(outputs.rdsInstanceEndpoint.value).toBe(
        'mock-rds-endpoint.amazonaws.com'
      );
      expect(outputs.rdsInstanceEndpoint.sensitive).toBe(true);

      expect(outputs.logBucketName).toBeDefined();
      expect(outputs.logBucketName.value).toBe('aurora-prod-logs-mockbucket');

      expect(outputs.bastionSecurityGroupId).toBeDefined();
      expect(outputs.bastionSecurityGroupId.value).toBe('mock-bastion-sg-id');

      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.DatabaseSecretArn.value).toBe('mock-secret-arn');
    });
  });
});
