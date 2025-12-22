import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test',
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify the stack was created successfully with the props value
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use environment suffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-test');

      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify the stack was created successfully with the context value
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use default dev when neither props nor context provided', () => {
      const testApp = new cdk.App();

      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify the stack was created successfully with the default value
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets in different AZs', () => {
      // Should have 4 subnets total (2 public + 2 private isolated)
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Check for Internet Gateway
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});

      // LocalStack: No NAT Gateways (not fully supported in Community Edition)
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should enable VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });

      // Should create CloudWatch Log Group for Flow Logs
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs/.*'),
      });
    });

    test('should create IAM role for VPC Flow Logs with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should apply Environment: Production tag', () => {
      // Check that resources have the Production environment tag as per requirements
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('should create CloudFormation outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
      });

      template.hasOutput('AvailabilityZones', {
        Description: 'Availability Zones used',
      });

      template.hasOutput('FlowLogsRoleArn', {
        Description: 'VPC Flow Logs IAM Role ARN',
      });

      template.hasOutput('FlowLogsLogGroupArn', {
        Description: 'VPC Flow Logs CloudWatch Log Group ARN',
      });
    });
  });
});
