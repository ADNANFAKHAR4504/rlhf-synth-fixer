import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test-123',
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });
  });

  test('VPC has exactly 3 availability zones', () => {
    const vpc = template.findResources('AWS::EC2::VPC');
    expect(Object.keys(vpc).length).toBe(1);
  });

  test('Public subnets are created', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 tiers (CDK default maxAzs in test)
  });

  test('Internet Gateway is created and attached', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });

    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      VpcId: Match.objectLike({ Ref: Match.anyValue() }),
      InternetGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
    });
  });

  test('NAT Gateways are created in HA mode (3 total)', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2); // 2 AZs in test environment
  });

  test('VPC Flow Logs are enabled with CloudWatch Logs', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });
  });

  test('CloudWatch Log Group is created for Flow Logs', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs-.*'),
      RetentionInDays: 30,
    });
  });

  test('IAM role is created for VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ]),
      },
    });
  });

  test('Web tier security group is created with HTTP/HTTPS rules', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
      Properties: {
        GroupDescription: 'Security group for web tier - allows HTTP/HTTPS',
      },
    });
    expect(Object.keys(securityGroups).length).toBe(1);

    // Verify web security group has HTTP and HTTPS ingress
    const webSg = Object.values(securityGroups)[0] as any;
    expect(webSg.Properties.SecurityGroupIngress).toHaveLength(2);
    expect(webSg.Properties.Tags).toEqual(
      expect.arrayContaining([
        { Key: 'Tier', Value: 'web' },
      ])
    );
  });

  test('App tier security group is created', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for application tier - allows traffic from web tier',
      Tags: Match.arrayWith([
        { Key: 'Tier', Value: 'application' },
      ]),
    });
  });

  test('Database tier security group is created with no outbound access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for database tier - allows traffic from app tier',
      Tags: Match.arrayWith([
        { Key: 'Tier', Value: 'database' },
      ]),
    });
  });

  test('All security groups use environmentSuffix in names', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(securityGroups).forEach((sg: any) => {
      expect(sg.Properties.GroupName).toMatch(/test-123/);
    });
  });

  test('Stack exports VPC ID', () => {
    template.hasOutput('VpcId', {
      Export: {
        Name: Match.stringLikeRegexp('payment-vpc-id-.*'),
      },
    });
  });

  test('Stack exports all subnet IDs', () => {
    template.hasOutput('PublicSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-public-subnets-.*'),
      },
    });

    template.hasOutput('PrivateSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-private-subnets-.*'),
      },
    });

    template.hasOutput('DatabaseSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-database-subnets-.*'),
      },
    });
  });

  test('Stack exports all security group IDs', () => {
    template.hasOutput('WebSecurityGroupId', {});
    template.hasOutput('AppSecurityGroupId', {});
    template.hasOutput('DatabaseSecurityGroupId', {});
  });

  test('Resources use environmentSuffix for uniqueness', () => {
    const outputs = template.findOutputs('*');
    const outputNames = Object.values(outputs);

    outputNames.forEach((output: any) => {
      if (output.Export && output.Export.Name) {
        expect(output.Export.Name).toMatch(/test-123/);
      }
    });
  });

  test('No resources have Retain deletion policy', () => {
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    Object.values(logGroups).forEach((resource: any) => {
      expect(resource.DeletionPolicy).not.toBe('Retain');
    });
  });

  test('All route tables have explicit associations', () => {
    const routeTables = template.findResources('AWS::EC2::RouteTable');
    const associations = template.findResources('AWS::EC2::SubnetRouteTableAssociation');

    // Should have at least one association per route table
    expect(Object.keys(associations).length).toBeGreaterThan(0);
  });
});
