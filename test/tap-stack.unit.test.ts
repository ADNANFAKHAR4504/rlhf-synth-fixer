import { App, Testing, TerraformVariable, TerraformOutput } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust the import path as needed
import 'cdktf/lib/testing/adapters/jest';

// Mock the modules since we're testing the stack that uses them.
// This allows us to test the stack's logic in isolation.
jest.mock('../lib/modules', () => {
  // We need to mock the actual constructor of the modules
  return {
    VpcNetwork: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      publicSubnetIds: ['mock-public-subnet-1', 'mock-public-subnet-2'],
      privateSubnetIds: ['mock-private-subnet-1', 'mock-private-subnet-2'],
    })),
    BastionHost: jest.fn(() => ({
      instancePublicIp: '1.2.3.4',
      securityGroupId: 'mock-sg-id',
    })),
    RdsDatabase: jest.fn(() => ({
      rdsEndpoint: 'mock-rds-endpoint.amazonaws.com',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-secret',
    })),
  };
});

// We mock TerraformVariable to control its output for tests, but we keep
// the original TerraformOutput so that snapshots are generated correctly.
jest.mock('cdktf', () => {
    const originalCdktf = jest.requireActual('cdktf');
    return {
        ...originalCdktf,
        TerraformVariable: jest.fn().mockImplementation(() => ({
            stringValue: '192.168.1.1/32', // Provide a mock IP for the bastion host
        })),
        // We are NOT mocking TerraformOutput anymore, so it will be included in snapshots.
    };
});


describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Clear all mocks before each test to ensure a clean slate
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Structure and Configuration', () => {
    test('TapStack should instantiate successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'prod',
            Team: 'TAP',
          },
        },
      });
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors and matches the snapshot
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toMatchSnapshot();
      expect(synthesized).toContain('my-custom-state-bucket');
      expect(synthesized).toContain('prod/TestTapStackWithProps.tfstate');
    });

    test('TapStack should use default values when no props are provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates with defaults and matches the snapshot
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toMatchSnapshot();
      expect(synthesized).toContain('iac-rlhf-tf-states'); // Default bucket
      expect(synthesized).toContain('dev/TestTapStackDefault.tfstate'); // Default env
    });
  });

  describe('Module Instantiation and Integration', () => {
    // Mocked module constructors
    const mockVpcNetwork = require('../lib/modules').VpcNetwork;
    const mockBastionHost = require('../lib/modules').BastionHost;
    const mockRdsDatabase = require('../lib/modules').RdsDatabase;
    const mockTfVariable = require('cdktf').TerraformVariable;

    beforeEach(() => {
      // Using `new App()` directly instead of `Testing.app()` to avoid issues
      // with the `jest.mock('cdktf', ...)` call.
      app = new App();
      stack = new TapStack(app, 'TestModuleIntegration');
    });

    test('should create one TerraformVariable for the IP address', () => {
        Testing.fullSynth(stack);
        expect(mockTfVariable).toHaveBeenCalledTimes(1);
        expect(mockTfVariable).toHaveBeenCalledWith(
            expect.anything(), // The stack instance
            'my_ip',
            expect.objectContaining({
                description: expect.stringContaining('Your local IP for SSH access'),
            })
        );
    });

    test('should create one VpcNetwork instance with correct configuration', () => {
      Testing.fullSynth(stack);
      expect(mockVpcNetwork).toHaveBeenCalledTimes(1);
      expect(mockVpcNetwork).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'vpc-network',
        expect.objectContaining({
          envPrefix: 'dev',
          vpcCidr: '10.0.0.0/16',
        })
      );
    });

    test('should create one BastionHost instance wired to the VpcNetwork', () => {
      Testing.fullSynth(stack);
      const vpcNetworkInstance = mockVpcNetwork.mock.results[0].value;

      expect(mockBastionHost).toHaveBeenCalledTimes(1);
      expect(mockBastionHost).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'bastion-host',
        expect.objectContaining({
          envPrefix: 'dev',
          vpcId: vpcNetworkInstance.vpcId, // Check wiring from VPC
          publicSubnetId: expect.any(String), // Check that a token (represented as a string) is passed
          allowedSshIp: '192.168.1.1/32', // From mocked TerraformVariable
        })
      );
    });

    test('should create one RdsDatabase instance wired to the VpcNetwork and BastionHost', () => {
      Testing.fullSynth(stack);
      const vpcNetworkInstance = mockVpcNetwork.mock.results[0].value;
      const bastionHostInstance = mockBastionHost.mock.results[0].value;

      expect(mockRdsDatabase).toHaveBeenCalledTimes(1);
      expect(mockRdsDatabase).toHaveBeenCalledWith(
        expect.anything(), // The stack instance
        'rds-database',
        expect.objectContaining({
          envPrefix: 'dev',
          vpcId: vpcNetworkInstance.vpcId, // Check wiring from VPC
          privateSubnetIds: vpcNetworkInstance.privateSubnetIds, // Check wiring from VPC
          sourceSecurityGroupId: bastionHostInstance.securityGroupId, // Check wiring from Bastion
        })
      );
    });

    test('should create Terraform outputs for bastion IP, RDS endpoint, and SSH command', () => {
        const synthesizedOutput = Testing.synth(stack);
        const outputs = JSON.parse(synthesizedOutput).output;
  
        expect(outputs.bastion_public_ip).toBeDefined();
        expect(outputs.bastion_public_ip.value).toBe('1.2.3.4');
        expect(outputs.bastion_public_ip.description).toBe('Public IP of the Bastion Host');

        expect(outputs.rds_instance_endpoint).toBeDefined();
        expect(outputs.rds_instance_endpoint.value).toBe('mock-rds-endpoint.amazonaws.com');
        expect(outputs.rds_instance_endpoint.description).toBe('The connection endpoint for the RDS instance');

        expect(outputs.ssh_command).toBeDefined();
        expect(outputs.ssh_command.value).toBe('ssh ec2-user@1.2.3.4');
        expect(outputs.ssh_command.description).toBe('Command to SSH into the Bastion Host (provide your own key)');
      });
  });
});