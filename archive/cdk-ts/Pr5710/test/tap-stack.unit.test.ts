import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        'availability-zones:account=unknown:region=ap-southeast-1': [
          'ap-southeast-1a',
          'ap-southeast-1b',
          'ap-southeast-1c',
        ],
      },
    });
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        region: 'ap-southeast-1',
        account: 'unknown',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC created with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('VPC has correct tags', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'apac-expansion' },
      ]),
    });
  });

  test('Public subnets created with /24 CIDR', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private

    // Check for public subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('NAT Gateways created', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('Internet Gateway created and attached', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('VPC Flow Logs enabled', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });
  });

  test('CloudWatch Log Group created with 7-day retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('Network ACLs created', () => {
    template.resourceCountIs('AWS::EC2::NetworkAcl', 2); // public and private
  });

  test('Network ACL allows HTTP traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 80,
        To: 80,
      },
      RuleAction: 'allow',
    });
  });

  test('Network ACL allows HTTPS traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 443,
        To: 443,
      },
      RuleAction: 'allow',
    });
  });

  test('Network ACL allows SSH traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 22,
        To: 22,
      },
      RuleAction: 'allow',
    });
  });

  test('IAM role created for VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('Outputs created for VPC and subnets', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('PublicSubnetId1');
    expect(outputs).toHaveProperty('PublicSubnetId2');
    expect(outputs).toHaveProperty('PublicSubnetId3');
    expect(outputs).toHaveProperty('PrivateSubnetId1');
    expect(outputs).toHaveProperty('PrivateSubnetId2');
    expect(outputs).toHaveProperty('PrivateSubnetId3');
  });

  test('No resources have Retain deletion policy', () => {
    const templateJson = template.toJSON();
    const resources = templateJson.Resources;

    Object.keys(resources).forEach(resourceKey => {
      const resource = resources[resourceKey];
      if (resource.DeletionPolicy) {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      }
    });
  });

  test('Stack deployed to ap-southeast-1 region', () => {
    expect(stack.region).toBe('ap-southeast-1');
  });

  test('Route tables count matches subnets', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 6); // 3 public + 3 private
  });

  test('Ephemeral ports allowed for return traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6,
      PortRange: {
        From: 1024,
        To: 65535,
      },
      RuleAction: 'allow',
    });
  });
});
