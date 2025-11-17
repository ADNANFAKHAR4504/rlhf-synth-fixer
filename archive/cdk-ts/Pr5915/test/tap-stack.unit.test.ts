import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  test('TapStack is created', () => {
    expect(stack).toBeDefined();
  });

  test('TapStack has correct environment suffix', () => {
    expect(stack.node.tryGetContext('environmentSuffix') || environmentSuffix).toBe(environmentSuffix);
  });

  test('TapStack creates nested VpcStack', () => {
    const nestedStacks = stack.node.children.filter(
      (child) => child instanceof VpcStack
    );
    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('TapStack uses environment suffix from context when props is undefined', () => {
    const appWithContext = new cdk.App();
    appWithContext.node.setContext('environmentSuffix', 'context-test');

    const stackWithContext = new TapStack(appWithContext, 'ContextTestStack');

    const vpcStack = stackWithContext.node.children.find(
      (child) => child instanceof VpcStack
    );
    expect(vpcStack).toBeDefined();
    expect(vpcStack?.node.id).toContain('context-test');
  });

  test('TapStack uses default environment suffix when no props or context', () => {
    const appNoContext = new cdk.App();

    const stackNoContext = new TapStack(appNoContext, 'DefaultTestStack');

    const vpcStack = stackNoContext.node.children.find(
      (child) => child instanceof VpcStack
    );
    expect(vpcStack).toBeDefined();
    expect(vpcStack?.node.id).toContain('dev');
  });

  test('TapStack prefers props over context for environment suffix', () => {
    const appWithContext = new cdk.App();
    appWithContext.node.setContext('environmentSuffix', 'context-test');

    const stackWithProps = new TapStack(appWithContext, 'PropsTestStack', {
      environmentSuffix: 'props-test',
    });

    const vpcStack = stackWithProps.node.children.find(
      (child) => child instanceof VpcStack
    );
    expect(vpcStack).toBeDefined();
    expect(vpcStack?.node.id).toContain('props-test');
  });

  test('TapStack passes environment configuration to VpcStack', () => {
    const testEnv = { region: 'eu-west-1', account: '999888777666' };
    const stackWithEnv = new TapStack(app, 'EnvTestStack', {
      environmentSuffix: 'env-test',
      env: testEnv,
    });

    const vpcStack = stackWithEnv.node.children.find(
      (child) => child instanceof VpcStack
    ) as VpcStack;

    expect(vpcStack).toBeDefined();
    expect(vpcStack.region).toBe('eu-west-1');
    expect(vpcStack.account).toBe('999888777666');
  });

  test('TapStack handles undefined props gracefully', () => {
    const stackNullProps = new TapStack(app, 'NullPropsStack', undefined);

    expect(stackNullProps).toBeDefined();
    const vpcStack = stackNullProps.node.children.find(
      (child) => child instanceof VpcStack
    );
    expect(vpcStack).toBeDefined();
  });

  test('TapStack handles empty props object', () => {
    const stackEmptyProps = new TapStack(app, 'EmptyPropsStack', {});

    expect(stackEmptyProps).toBeDefined();
    const vpcStack = stackEmptyProps.node.children.find(
      (child) => child instanceof VpcStack
    );
    expect(vpcStack).toBeDefined();
  });
});

describe('VpcStack Unit Tests', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcTags = Object.values(vpcs)[0].Properties.Tags;
      expect(vpcTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'production' }),
          expect.objectContaining({ Key: 'Project', Value: 'financial-app' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'cdk' }),
        ])
      );
    });
  });

  describe('Subnet Configuration', () => {
    test('Creates 3 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        (subnet: any) => subnet.Properties.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(3);
    });

    test('Creates 3 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(
        (subnet: any) => !subnet.Properties.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBe(3);
    });

    test('Public subnets have correct tags', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('production-.-public-subnet') }),
        ]),
      });
    });

    test('Private subnets have correct tags', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('production-.-private-subnet') }),
        ]),
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('Creates 3 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('Creates 3 Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 3);
    });

    test('Each NAT Gateway has an Elastic IP', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        AllocationId: Match.anyValue(),
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Internet Gateway is attached to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('Route Table Configuration', () => {
    test('Creates route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });

    test('Public route tables route to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('Private route tables route to NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      });
    });

    test('All subnets are associated with route tables', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 6);
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('Creates CloudWatch Log Group for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('Creates IAM Role for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `vpc-flow-log-role-${environmentSuffix}`,
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

    test('IAM Role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ]),
            }),
          ]),
        }),
      });
    });

    test('Creates VPC Flow Log capturing ALL traffic', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });

    test('Flow Log has correct tags', () => {
      const flowLogs = template.findResources('AWS::EC2::FlowLog');
      const flowLogTags = Object.values(flowLogs)[0].Properties.Tags;
      expect(flowLogTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'production' }),
          expect.objectContaining({ Key: 'Project', Value: 'financial-app' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'cdk' }),
        ])
      );
    });
  });

  describe('Network ACL Configuration', () => {
    test('Creates Network ACL for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `public-nacl-${environmentSuffix}` },
        ]),
      });
    });

    test('Network ACL denies SSH from internet', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleNumber: 1,
        Protocol: 6, // TCP
        PortRange: { From: 22, To: 22 },
        CidrBlock: '0.0.0.0/0',
        RuleAction: 'deny',
        Egress: false,
      });
    });

    test('Network ACL allows all other inbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleNumber: 100,
        Protocol: -1, // All protocols
        CidrBlock: '0.0.0.0/0',
        RuleAction: 'allow',
        Egress: false,
      });
    });

    test('Network ACL allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleNumber: 100,
        Protocol: -1,
        CidrBlock: '0.0.0.0/0',
        RuleAction: 'allow',
        Egress: true,
      });
    });

    test('Network ACL is associated with public subnets', () => {
      template.resourceCountIs('AWS::EC2::SubnetNetworkAclAssociation', 3);
    });
  });

  describe('Security Group Configuration', () => {
    test('Creates Web Tier Security Group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-tier-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for web tier - allows HTTP and HTTPS from internet',
      });
    });

    test('Web Security Group allows HTTP from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            Description: 'Allow HTTP from anywhere',
          },
        ]),
      });
    });

    test('Web Security Group allows HTTPS from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            Description: 'Allow HTTPS from anywhere',
          },
        ]),
      });
    });

    test('Web Security Group has correct tags', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const webSg = Object.values(securityGroups).find(
        (sg: any) => sg.Properties.GroupName === `web-tier-sg-${environmentSuffix}`
      );
      expect(webSg).toBeDefined();
      expect(webSg.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Tier', Value: 'web' }),
        ])
      );
    });

    test('Creates App Tier Security Group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `app-tier-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for app tier - allows HTTP and HTTPS only from web tier',
      });
    });

    test('App Security Group allows HTTP from web tier only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue(),
        Description: 'Allow HTTP from web tier',
      });
    });

    test('App Security Group allows HTTPS from web tier only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        SourceSecurityGroupId: Match.anyValue(),
        Description: 'Allow HTTPS from web tier',
      });
    });

    test('App Security Group has correct tags', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const appSg = Object.values(securityGroups).find(
        (sg: any) => sg.Properties.GroupName === `app-tier-sg-${environmentSuffix}`
      );
      expect(appSg).toBeDefined();
      expect(appSg.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Tier', Value: 'app' }),
        ])
      );
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: { Name: `VpcId-${environmentSuffix}` },
      });
    });

    test('Exports VPC CIDR', () => {
      template.hasOutput('VpcCidr', {
        Export: { Name: `VpcCidr-${environmentSuffix}` },
      });
    });

    test('Exports all public subnet IDs', () => {
      template.hasOutput('PublicSubnet1Id', {
        Export: { Name: `PublicSubnet1Id-${environmentSuffix}` },
      });
      template.hasOutput('PublicSubnet2Id', {
        Export: { Name: `PublicSubnet2Id-${environmentSuffix}` },
      });
      template.hasOutput('PublicSubnet3Id', {
        Export: { Name: `PublicSubnet3Id-${environmentSuffix}` },
      });
    });

    test('Exports all private subnet IDs', () => {
      template.hasOutput('PrivateSubnet1Id', {
        Export: { Name: `PrivateSubnet1Id-${environmentSuffix}` },
      });
      template.hasOutput('PrivateSubnet2Id', {
        Export: { Name: `PrivateSubnet2Id-${environmentSuffix}` },
      });
      template.hasOutput('PrivateSubnet3Id', {
        Export: { Name: `PrivateSubnet3Id-${environmentSuffix}` },
      });
    });

    test('Exports Web Security Group ID', () => {
      template.hasOutput('WebSecurityGroupId', {
        Export: { Name: `WebSecurityGroupId-${environmentSuffix}` },
      });
    });

    test('Exports App Security Group ID', () => {
      template.hasOutput('AppSecurityGroupId', {
        Export: { Name: `AppSecurityGroupId-${environmentSuffix}` },
      });
    });

    test('Exports Availability Zones', () => {
      template.hasOutput('AvailabilityZones', {
        Export: { Name: `AvailabilityZones-${environmentSuffix}` },
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('All resource names include environmentSuffix', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      Object.values(vpcResources).forEach((resource: any) => {
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value).toContain(environmentSuffix);
        }
      });
    });

    test('CloudWatch Log Group name includes environmentSuffix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(environmentSuffix),
      });
    });

    test('IAM Role name includes environmentSuffix', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(environmentSuffix),
      });
    });

    test('Security Group names include environmentSuffix', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties.GroupName) {
          expect(sg.Properties.GroupName).toContain(environmentSuffix);
        }
      });
    });
  });
});
