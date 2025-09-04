import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('With environment suffix from context', () => {
    beforeEach(() => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test-context',
        },
      });
      stack = new TapStack(app, `TestTapStacktest-context`, {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Should use environment suffix from context', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-vpc-test-context' }),
        ]),
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tap-sg-test-context',
      });
    });
  });

  describe('With environment suffix from environment variable', () => {
    beforeEach(() => {
      process.env.ENVIRONMENT_SUFFIX = 'test-env';
      app = new cdk.App();
      stack = new TapStack(app, `TestTapStacktest-env`, {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      template = Template.fromStack(stack);
    });

    afterEach(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    test('Should use environment suffix from environment variable', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-vpc-test-env' }),
        ]),
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tap-sg-test-env',
      });
    });
  });

  describe('With default environment suffix', () => {
    beforeEach(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
      app = new cdk.App();
      stack = new TapStack(app, `TestTapStacksynthtrainr268`, {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      template = Template.fromStack(stack);
    });

  describe('VPC Configuration', () => {
    test('Should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('Should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Group Configuration', () => {
    test('Should create security group with SSH and HTTP rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Should tag security group correctly', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'dev' }),
          Match.objectLike({ Key: 'Project', Value: 'SampleProject' }),
        ]),
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('Should create EC2 instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: Match.stringLikeRegexp('t3.micro'),
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              VolumeSize: 8,
              VolumeType: 'gp3',
            }),
          }),
        ]),
      });
    });

    test('Should create Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('Should tag EC2 instance correctly', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'dev' }),
          Match.objectLike({ Key: 'Project', Value: 'SampleProject' }),
        ]),
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should tag S3 bucket correctly', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'dev' }),
          Match.objectLike({ Key: 'Project', Value: 'SampleProject' }),
        ]),
      });
    });
  });

    describe('Resources with dynamic naming', () => {
      test('Should have VPC with environment suffix in name', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'tap-vpc-synthtrainr268' }),
          ]),
        });
      });

      test('Should have EC2 instance with environment suffix in name tag', () => {
        template.hasResourceProperties('AWS::EC2::Instance', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: 'tap-instance-synthtrainr268' }),
          ]),
        });
      });

      test('Should have S3 bucket with account and region in name', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.stringLikeRegexp('tap-bucket-synthtrainr268-.*-us-west-2'),
        });
      });
    });

    describe('Stack Outputs', () => {
    test('Should have S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket',
      });
    });

    test('Should have EC2 public IP output', () => {
      template.hasOutput('EC2PublicIP', {
        Description: 'Public IP address of the EC2 instance',
      });
    });
    });
  });
});
