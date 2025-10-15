import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR and subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates NAT Gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates S3 Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('s3')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('creates VPC Flow Log', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Customer Gateway', () => {
    test('creates Customer Gateway with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::CustomerGateway', {
        BgpAsn: 65000,
        IpAddress: '203.0.113.1',
        Type: 'ipsec.1',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `MainOfficeRouter-${environmentSuffix}`,
          },
        ]),
      });
    });
  });

  describe('Virtual Private Gateway', () => {
    test('creates VPN Gateway', () => {
      template.hasResourceProperties('AWS::EC2::VPNGateway', {
        Type: 'ipsec.1',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `HybridVPNGateway-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('attaches VPN Gateway to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: Match.objectLike({ Ref: Match.anyValue() }),
        VpnGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
      });
    });
  });

  describe('Transit Gateway', () => {
    test('creates Transit Gateway with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64512,
        AutoAcceptSharedAttachments: 'disable',
        DefaultRouteTableAssociation: 'enable',
        DefaultRouteTablePropagation: 'enable',
        DnsSupport: 'enable',
        VpnEcmpSupport: 'enable',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `HybridTransitGateway-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('creates Transit Gateway VPC attachment', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', {
        TransitGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
        VpcId: Match.objectLike({ Ref: Match.anyValue() }),
        SubnetIds: Match.arrayWith([Match.objectLike({ Ref: Match.anyValue() })]),
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `HybridVPCAttachment-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('creates routes to Transit Gateway in private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '192.168.0.0/16',
        TransitGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
      });
    });
  });

  describe('Site-to-Site VPN', () => {
    test('creates VPN Connection', () => {
      template.hasResourceProperties('AWS::EC2::VPNConnection', {
        Type: 'ipsec.1',
        StaticRoutesOnly: false,
        CustomerGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
        TransitGatewayId: Match.objectLike({ Ref: Match.anyValue() }),
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `HybridVPNConnection-${environmentSuffix}`,
          },
        ]),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch Alarm for VPN tunnel state', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'TunnelState',
        Namespace: 'AWS/VPN',
        Statistic: 'Average',
        Threshold: 0,
      });
    });
  });

  describe('Route 53 Resolver', () => {
    test('creates security group for Resolver endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Route 53 Resolver',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            IpProtocol: 'tcp',
            FromPort: 53,
            ToPort: 53,
          }),
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            IpProtocol: 'udp',
            FromPort: 53,
            ToPort: 53,
          }),
        ]),
      });
    });

    test('creates inbound Resolver endpoint', () => {
      template.hasResourceProperties('AWS::Route53Resolver::ResolverEndpoint', {
        Direction: 'INBOUND',
        Name: `hybrid-inbound-resolver-${environmentSuffix}`,
      });
    });

    test('creates outbound Resolver endpoint', () => {
      template.hasResourceProperties('AWS::Route53Resolver::ResolverEndpoint', {
        Direction: 'OUTBOUND',
        Name: `hybrid-outbound-resolver-${environmentSuffix}`,
      });
    });

    test('creates Resolver rule for on-premises DNS forwarding', () => {
      template.hasResourceProperties('AWS::Route53Resolver::ResolverRule', {
        DomainName: 'corp.example.internal',
        RuleType: 'FORWARD',
        Name: `onprem-dns-forwarding-${environmentSuffix}`,
        TargetIps: [
          { Ip: '192.168.1.10', Port: '53' },
          { Ip: '192.168.1.11', Port: '53' },
        ],
      });
    });
  });

  describe('IAM Access Control', () => {
    test('creates Hybrid Access Role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `HybridAccessRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
        ]),
      });
    });

    test('creates inline policy for Hybrid Access Role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CustomPolicy',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    'ec2:DescribeVpcs',
                    'ec2:DescribeSubnets',
                    'ec2:DescribeSecurityGroups',
                  ],
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('exports Transit Gateway ID', () => {
      template.hasOutput('TransitGatewayId', {
        Description: 'Transit Gateway ID',
      });
    });

    test('exports VPN Connection ID', () => {
      template.hasOutput('VPNConnectionId', {
        Description: 'VPN Connection ID',
      });
    });

    test('exports Inbound Resolver Endpoint ID', () => {
      template.hasOutput('InboundResolverEndpointId', {
        Description: 'Inbound Route 53 Resolver Endpoint ID',
      });
    });

    test('exports Outbound Resolver Endpoint ID', () => {
      template.hasOutput('OutboundResolverEndpointId', {
        Description: 'Outbound Route 53 Resolver Endpoint ID',
      });
    });

    test('exports Hybrid Access Role ARN', () => {
      template.hasOutput('HybridAccessRoleArn', {
        Description: 'Hybrid Access Role ARN',
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of VPC resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates expected number of hybrid connectivity resources', () => {
      template.resourceCountIs('AWS::EC2::CustomerGateway', 1);
      template.resourceCountIs('AWS::EC2::VPNGateway', 1);
      template.resourceCountIs('AWS::EC2::VPNConnection', 1);
      template.resourceCountIs('AWS::EC2::TransitGateway', 1);
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 1);
    });

    test('creates expected number of Route 53 Resolver resources', () => {
      template.resourceCountIs('AWS::Route53Resolver::ResolverEndpoint', 2);
      template.resourceCountIs('AWS::Route53Resolver::ResolverRule', 1);
    });

    test('creates expected number of IAM resources', () => {
      template.resourceCountIs('AWS::IAM::Role', 2);
    });

    test('creates expected number of monitoring resources', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });
  });

  describe('Context Variables', () => {
    test('uses custom context values when provided', () => {
      const customApp = new cdk.App({
        context: {
          customerGatewayIp: '198.51.100.1',
          customerGatewayBgpAsn: 65001,
          onPremDomain: 'internal.company.com',
          onPremCidr: '172.16.0.0/12',
        },
      });
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::CustomerGateway', {
        BgpAsn: 65001,
        IpAddress: '198.51.100.1',
      });

      customTemplate.hasResourceProperties('AWS::Route53Resolver::ResolverRule', {
        DomainName: 'internal.company.com',
      });

      customTemplate.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '172.16.0.0/12',
      });
    });

    test('applies environment suffix to all resource names', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test123',
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::EC2::CustomerGateway', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'MainOfficeRouter-test123' },
        ]),
      });

      testTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'HybridAccessRole-test123',
      });
    });

    test('defaults to "dev" suffix when no props or context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultStack');
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::EC2::CustomerGateway', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'MainOfficeRouter-dev' },
        ]),
      });

      testTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'HybridAccessRole-dev',
      });
    });
  });
});
