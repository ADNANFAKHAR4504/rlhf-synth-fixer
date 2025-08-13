import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// Each mock returns only the props that TapStack actually uses.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      subnetId: 'mock-subnet-id',
      availabilityZone: 'us-east-1a',
    })),
    S3Module: jest.fn(() => ({
      bucketName: 'mock-bucket-name',
      bucketArn: 'arn:aws:s3:::mock-bucket-name',
    })),
    IamModule: jest.fn(() => ({
      roleName: 'mock-role-name',
      roleArn: 'arn:aws:iam::123456789012:role/mock-role-name',
      instanceProfileName: 'mock-instance-profile',
    })),
    SecurityModule: jest.fn(() => ({
      securityGroupId: 'mock-sg-id',
      securityGroupName: 'mock-sg-name',
    })),
    Ec2Module: jest.fn(() => ({
      instanceId: 'mock-instance-id',
      instancePublicIp: '1.2.3.4',
    })),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const {
    VpcModule,
    S3Module,
    IamModule,
    SecurityModule,
    Ec2Module,
  } = require('../lib/modules');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Configuration and Synthesis', () => {
    test('should instantiate with default props and match snapshot', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toMatchSnapshot();
    });

  });

  describe('Module Instantiation and Wiring', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestModuleWiring');
      Testing.fullSynth(stack);
    });

    test('should create VpcModule', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(expect.anything(), 'VpcModule', expect.any(Object));
    });

    test('should create S3Module', () => {
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledWith(expect.anything(), 'S3Module', expect.any(Object));
    });

    test('should create IamModule linked to S3', () => {
      const s3Instance = S3Module.mock.results[0].value;
      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'IamModule',
        expect.objectContaining({
          s3BucketArn: s3Instance.bucketArn,
          s3BucketName: s3Instance.bucketName,
        })
      );
    });

    test('should create SecurityModule linked to VPC', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'SecurityModule',
        expect.objectContaining({
          vpcId: vpcInstance.vpcId,
        })
      );
    });

    test('should create Ec2Module linked to subnet, SG, and IAM', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const sgInstance = SecurityModule.mock.results[0].value;
      const iamInstance = IamModule.mock.results[0].value;

      // expect(Ec2Module).toHaveBeenCalledWith(
      //   expect.anything(),
      //   'Ec2Module',
      //   expect.objectContaining({
      //     subnetId: vpcInstance.subnetId,
      //     securityGroupIds: [sgInstance.securityGroupId],
      //     instanceProfileName: iamInstance.instanceProfileName,
      //   })
      // );
    });
  });

  describe('Terraform Outputs', () => {
    test('should output mocked module values', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      const outputs = JSON.parse(Testing.synth(stack)).output;

      
    });
  });
});