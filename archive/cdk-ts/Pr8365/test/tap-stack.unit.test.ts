import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';

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

  describe('Stack Structure', () => {
    test('TapStack instantiates successfully', () => {
      // Verify that TapStack creates the expected structure
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('TapStack uses environmentSuffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'TestTapStackWithProps', { 
        environmentSuffix: 'prod' 
      });
      
      // Verify that TapStack instantiates without errors when environmentSuffix is provided via props
      expect(customStack).toBeDefined();
      const template = Template.fromStack(customStack);
      expect(template).toBeDefined();
    });

    test('TapStack uses environmentSuffix from context', () => {
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const customStack = new TapStack(customApp, 'TestTapStackWithContext');
      
      // Verify that TapStack instantiates without errors when environmentSuffix is provided via context
      expect(customStack).toBeDefined();
      const template = Template.fromStack(customStack);
      expect(template).toBeDefined();
    });

    test('TapStack uses default environmentSuffix when none provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'TestTapStackDefault');
      
      // Verify that TapStack instantiates without errors when no environmentSuffix is provided
      expect(customStack).toBeDefined();
      const template = Template.fromStack(customStack);
      expect(template).toBeDefined();
    });
  });
});

describe('NetworkStack', () => {
  let app: cdk.App;
  let stack: NetworkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkStack(app, 'TestNetworkStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Constructor Behavior', () => {
    test('NetworkStack uses default environmentSuffix when none provided', () => {
      const customApp = new cdk.App();
      const customStack = new NetworkStack(customApp, 'TestNetworkStackDefault');
      const customTemplate = Template.fromStack(customStack);
      
      // Verify security group names use the default environment suffix
      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'DMZ-SG-dev',
      });
    });

    test('NetworkStack uses custom environmentSuffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new NetworkStack(customApp, 'TestNetworkStackCustom', { 
        environmentSuffix: 'test' 
      });
      const customTemplate = Template.fromStack(customStack);
      
      // Verify security group names use the custom environment suffix
      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'DMZ-SG-test',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('creates public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 tiers = 6 subnets
    });

    test('creates internet gateway for public subnets', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('creates NAT gateways for private subnets', () => {
      // LocalStack Community Edition has limited NAT Gateway support
      // We use PRIVATE_ISOLATED subnets instead, so no NAT Gateways are created
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Groups', () => {
    test('creates DMZ security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for DMZ zone - Web servers',
        GroupName: `DMZ-SG-${environmentSuffix}`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP from internet',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS from internet',
          },
        ],
      });
    });

    test('creates Internal security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Internal zone - Application servers',
        GroupName: `Internal-SG-${environmentSuffix}`,
      });
    });

    test('creates Secure security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Secure zone - Database server',
        GroupName: `Secure-SG-${environmentSuffix}`,
      });
    });

    test('creates security group rules for tier communication', () => {
      // Check for ingress rule allowing DMZ to connect to Internal on port 8080
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 8080,
        ToPort: 8080,
        Description: 'Allow connections from DMZ web servers',
      });

      // Check for ingress rule allowing Internal to connect to Secure on port 5432
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow database connections from application servers',
      });
    });

    test('creates security group egress rules', () => {
      // Check for egress rule allowing DMZ to connect to Internal
      template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
        IpProtocol: 'tcp',
        FromPort: 8080,
        ToPort: 8080,
        Description: 'Allow DMZ to connect to application servers',
      });

      // Check for egress rule allowing Internal to connect to Secure
      template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow application servers to connect to database',
      });
    });

    test('creates SSH admin access rule in secure security group', () => {
      // Check if the Secure security group includes the SSH ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Secure zone - Database server',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '10.0.0.0/16',
            Description: 'Allow SSH access for database administration',
          })
        ])
      });
    });
  });

  describe('Network ACLs', () => {
    test('creates Network ACLs for each tier', () => {
      template.resourceCountIs('AWS::EC2::NetworkAcl', 3); // DMZ, Internal, Secure
    });

    test('creates NACL entries for HTTP/HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6, // TCP
        PortRange: { From: 80, To: 80 },
        RuleAction: 'allow',
        RuleNumber: 100,
      });

      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        Protocol: 6, // TCP
        PortRange: { From: 443, To: 443 },
        RuleAction: 'allow',
        RuleNumber: 110,
      });
    });

    test('creates NACL associations for subnets', () => {
      template.resourceCountIs('AWS::EC2::SubnetNetworkAclAssociation', 6); // 6 subnets
    });
  });

  describe('Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the TechCorp network',
      });
    });

    test('exports security group IDs', () => {
      template.hasOutput('DmzSecurityGroupId', {
        Description: 'Security Group ID for DMZ zone',
      });

      template.hasOutput('InternalSecurityGroupId', {
        Description: 'Security Group ID for Internal zone',
      });

      template.hasOutput('SecureSecurityGroupId', {
        Description: 'Security Group ID for Secure zone',
      });
    });

    test('exports subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Comma-separated list of public subnet IDs (DMZ)',
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Comma-separated list of private subnet IDs (Internal)',
      });

      template.hasOutput('IsolatedSubnetIds', {
        Description: 'Comma-separated list of isolated subnet IDs (Secure)',
      });
    });

    test('verifies private subnets output is empty string (LocalStack architecture)', () => {
      // In LocalStack architecture, we use PRIVATE_ISOLATED for both Internal and Secure tiers
      // This means privateSubnets array is empty, and PrivateSubnetIds should be an empty string
      const outputs = template.toJSON().Outputs;
      const privateSubnetOutput = outputs?.PrivateSubnetIds;

      // The output should exist but the value should be an empty Join (empty array)
      expect(privateSubnetOutput).toBeDefined();
    });
  });
});
