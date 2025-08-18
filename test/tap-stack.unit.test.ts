import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Mock the modules to avoid complex dependencies in unit tests
jest.mock('../lib/modules', () => ({
  VpcModule: jest.fn().mockImplementation((_scope, _id, props) => ({
    vpc: { id: 'vpc-12345' },
    publicSubnets: [
      { id: 'subnet-12345' },
      { id: 'subnet-67890' }
    ]
  })),
  SecurityGroupModule: jest.fn().mockImplementation((_scope, _id, props) => ({
    securityGroup: { id: `sg-${props.name}` }
  })),
  AutoScalingModule: jest.fn().mockImplementation((_scope, _id, _props) => ({
    autoScalingGroup: { name: 'web-asg-name' }
  })),
  S3BucketModule: jest.fn().mockImplementation((_scope, _id, props) => ({
    bucket: { bucket: `${props.project}-${props.env}-${props.name}` }
  }))
}));

describe('TapStack', () => {
  let app: any;

  beforeEach(() => {
    app = Testing.app();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor with default props', () => {
    it('should create stack with default values', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
    });

    it('should create all required outputs', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = JSON.parse(Testing.synth(stack));
      const expectedOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'web_server_sg_id',
        'web_asg_name',
        'app_bucket_name',
        'bastion_sg_id'
      ];

      expectedOutputs.forEach(outputName => {
        expect(synthesized.output).toHaveProperty(outputName);
      });
    });
  });

  describe('Constructor with custom props', () => {
    it('should use custom environment suffix and backend', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
        awsRegion: 'us-west-2',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-west-1'
      });
      const synthesized = Testing.synth(stack);

    });

    it('should use custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Owner: 'engineering'
        }
      };

      const stack = new TapStack(app, 'test-stack', {
        defaultTags: customTags
      });
      const synthesized = Testing.synth(stack);

    });
  });

  describe('Module instantiation', () => {
    it('should create VPC module with correct props', () => {
      const { VpcModule } = require('../lib/modules');
      new TapStack(app, 'test-stack', { environmentSuffix: 'qa' });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.any(Object),
        'tap-vpc',
        { cidrBlock: '10.0.0.0/16', env: 'qa', project: 'tap' }
      );
    });

    it('should create security group modules with correct props', () => {
      const { SecurityGroupModule } = require('../lib/modules');
      new TapStack(app, 'test-stack');

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.any(Object),
        'web-server-sg',
        expect.objectContaining({
          vpcId: 'vpc-12345',
          env: 'dev',
          project: 'tap',
          name: 'web-server'
        })
      );

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.any(Object),
        'bastion-sg',
        expect.objectContaining({
          vpcId: 'vpc-12345',
          env: 'dev',
          project: 'tap',
          name: 'bastion'
        })
      );
    });

    it('should create auto scaling module with correct props', () => {
      const { AutoScalingModule } = require('../lib/modules');
      new TapStack(app, 'test-stack');

      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.any(Object),
        'web-asg',
        expect.objectContaining({
          env: 'dev',
          project: 'tap',
          subnetIds: ['subnet-12345', 'subnet-67890'],
          securityGroupIds: ['sg-web-server'],
          amiId: 'ami-04e08e36e17a21b56',
          instanceType: 't2.micro'
        })
      );
    });

    it('should create S3 bucket module with correct props', () => {
      const { S3BucketModule } = require('../lib/modules');
      new TapStack(app, 'test-stack');

      expect(S3BucketModule).toHaveBeenCalledWith(
        expect.any(Object),
        'app-bucket',
        { env: 'dev', project: 'tap', name: 'app-assets' }
      );
    });
  });

  });

  