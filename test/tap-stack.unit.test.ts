import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProjectXInfrastructureStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ProjectXInfrastructureStack', () => {
  let app: cdk.App;
  let stack: ProjectXInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProjectXInfrastructureStack(app, 'TestProjectXStack', {
      description: `ProjectX Infrastructure Stack - ${environmentSuffix}`,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });
  });

  describe('Security Group Resources', () => {
    test('should create security group with HTTP/HTTPS/SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
        GroupName: 'projectX-web-server-sg',
      });
    });
  });

  describe('Auto Scaling Group Resources', () => {
    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });
  });

  describe('IAM Resources', () => {
    test('should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'projectX-ec2-role',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });
});
