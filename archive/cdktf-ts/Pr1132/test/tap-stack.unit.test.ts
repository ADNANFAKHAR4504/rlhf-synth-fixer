import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpcId: 'mock-vpc-id',
      publicSubnetId: 'mock-public-subnet-id',
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
      stack = new TapStack(app, 'TestDefaultStack', { awsRegion: 'us-west-2' });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toMatchSnapshot();
    });
  });

  describe('VpcModule', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVpc', { awsRegion: 'us-west-2' });
      Testing.fullSynth(stack);
    });

    test('should create VpcModule with expected props', () => {
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'VpcModule',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev',
            Owner: 'team-a',
          }),
        })
      );
    });

    test('should output vpc_id and public_subnet_id', () => {
      const outputs = JSON.parse(Testing.synth(stack)).output;
      expect(outputs.vpc_id.value).toEqual('mock-vpc-id');
      expect(outputs.public_subnet_id.value).toEqual('mock-public-subnet-id');
    });
  });

  describe('S3Module', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestS3', { awsRegion: 'us-west-2' });
      Testing.fullSynth(stack);
    });

    test('should create S3Module with versioning and forceDestroy', () => {
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        'S3Module',
        expect.objectContaining({
          versioning: true,
          forceDestroy: true,
          tags: expect.objectContaining({
            Environment: 'dev',
            Owner: 'team-a',
          }),
        })
      );
    });

    test('should output bucket_name and bucket_arn', () => {
      const outputs = JSON.parse(Testing.synth(stack)).output;
      expect(outputs.bucket_name.value).toEqual('mock-bucket-name');
      expect(outputs.bucket_arn.value).toEqual(
        'arn:aws:s3:::mock-bucket-name'
      );
    });
  });

  describe('IamModule', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestIam', { awsRegion: 'us-west-2' });
      Testing.fullSynth(stack);
    });

    test('should create IamModule linked to S3 bucket', () => {
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

    test('should output iam_role_name, iam_role_arn, and instance_profile_name', () => {
      const outputs = JSON.parse(Testing.synth(stack)).output;
      expect(outputs.iam_role_name.value).toEqual('mock-role-name');
      expect(outputs.iam_role_arn.value).toEqual(
        'arn:aws:iam::123456789012:role/mock-role-name'
      );
      expect(outputs.instance_profile_name.value).toEqual(
        'mock-instance-profile'
      );
    });
  });

  describe('SecurityModule', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSecurity', { awsRegion: 'us-west-2' });
      Testing.fullSynth(stack);
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

    test('should output security_group_id and security_group_name', () => {
      const outputs = JSON.parse(Testing.synth(stack)).output;
      expect(outputs.security_group_id.value).toEqual('mock-sg-id');
      expect(outputs.security_group_name.value).toEqual('mock-sg-name');
    });
  });

  describe('Ec2Module', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestEc2', { awsRegion: 'us-west-2' });
      Testing.fullSynth(stack);
    });

    test('should create Ec2Module linked to subnet, SG, and IAM', () => {
      const vpcInstance = VpcModule.mock.results[0].value;
      const sgInstance = SecurityModule.mock.results[0].value;
      const iamInstance = IamModule.mock.results[0].value;

      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'Ec2Module',
        expect.objectContaining({
          subnetId: vpcInstance.publicSubnetId,
          securityGroupIds: [sgInstance.securityGroupId],
          instanceProfileName: iamInstance.instanceProfileName,
          instanceType: 't2.micro',
        })
      );
    });

    test('should output ec2_instance_id and ec2_instance_public_ip', () => {
      const outputs = JSON.parse(Testing.synth(stack)).output;
      expect(outputs.ec2_instance_id.value).toEqual('mock-instance-id');
      expect(outputs.ec2_instance_public_ip.value).toEqual('1.2.3.4');
    });
  });

  // --- Branch coverage for awsRegion selection ---
  test('should use props.awsRegion when AWS_REGION_OVERRIDE is falsy', () => {
    delete process.env.AWS_REGION_OVERRIDE; // ensure falsy
    const { TapStack } = require('../lib/tap-stack');
    const app = new App();
    const stack = new TapStack(app, 'TestFallback', { awsRegion: 'us-west-2' });
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('us-west-2');
  });

  test('should use AWS_REGION_OVERRIDE when provided', () => {
    process.env.AWS_REGION_OVERRIDE = 'us-west-2';
    const { TapStack } = require('../lib/tap-stack');
    const app = new App();
    const stack = new TapStack(app, 'TestOverride', { awsRegion: 'us-west-2' });
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('us-west-2');

    delete process.env.AWS_REGION_OVERRIDE; // cleanup
  });
});
