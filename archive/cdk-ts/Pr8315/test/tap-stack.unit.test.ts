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
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('creates public subnets across two AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // Check public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets across two AZs', () => {
      // Check private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates NAT Gateways in public subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for bastion host with minimal privileges', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
          Version: '2012-10-17',
        },
        Description: 'IAM role for bastion host with minimal permissions',
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('Security Groups', () => {
    test('creates bastion security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host with restricted SSH access',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from trusted network only',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('creates web tier security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTP access from internet',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS access from internet',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('creates app tier security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier',
      });
    });

    test('creates database tier security group with no outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier',
        SecurityGroupEgress: [
          {
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            FromPort: 252,
            IpProtocol: 'icmp',
            ToPort: 86,
          },
        ],
      });
    });

    test('creates security group ingress rules between tiers', () => {
      // Web tier can receive SSH from bastion
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'SSH access from bastion host',
        FromPort: 22,
        IpProtocol: 'tcp',
        ToPort: 22,
      });

      // App tier can receive traffic from web tier
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'Application traffic from web tier',
        FromPort: 8080,
        IpProtocol: 'tcp',
        ToPort: 8080,
      });

      // Database tier can receive MySQL traffic from app tier
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'MySQL access from application tier',
        FromPort: 3306,
        IpProtocol: 'tcp',
        ToPort: 3306,
      });

      // Database tier can receive PostgreSQL traffic from app tier
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'PostgreSQL access from application tier',
        FromPort: 5432,
        IpProtocol: 'tcp',
        ToPort: 5432,
      });
    });
  });

  describe('EC2 Bastion Host', () => {
    test('creates bastion host with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('creates instance profile for bastion host', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `SecureVPC-${environmentSuffix}`,
        },
      });

      template.hasOutput('BastionInstanceId', {
        Description: 'Bastion Host Instance ID',
        Export: {
          Name: `BastionHost-${environmentSuffix}`,
        },
      });

      template.hasOutput('BastionPublicIp', {
        Description: 'Bastion Host Public IP',
        Export: {
          Name: `BastionPublicIp-${environmentSuffix}`,
        },
      });

      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: {
          Name: `PublicSubnets-${environmentSuffix}`,
        },
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: `PrivateSubnets-${environmentSuffix}`,
        },
      });

      template.hasOutput('WebTierSecurityGroupId', {
        Description: 'Web Tier Security Group ID',
        Export: {
          Name: `WebTierSG-${environmentSuffix}`,
        },
      });

      template.hasOutput('AppTierSecurityGroupId', {
        Description: 'Application Tier Security Group ID',
        Export: {
          Name: `AppTierSG-${environmentSuffix}`,
        },
      });

      template.hasOutput('DbTierSecurityGroupId', {
        Description: 'Database Tier Security Group ID',
        Export: {
          Name: `DbTierSG-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources have Environment:Production tag', () => {
      // Check that all resources have the production tag
      const resources = template.toJSON().Resources;
      const resourcesWithTags = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      resourcesWithTags.forEach((resource: any) => {
        expect(resource.Properties.Tags).toContainEqual({
          Key: 'Environment',
          Value: 'Production',
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('bastion host does not allow SSH from 0.0.0.0/0', () => {
      const template_json = template.toJSON();
      const securityGroups = Object.values(template_json.Resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::SecurityGroup'
      );

      securityGroups.forEach((sg: any) => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.FromPort === 22) {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });

    test('VPC enables DNS support and hostnames', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTapStack', {
        environmentSuffix: 'test'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'SecureVPC-test',
        },
      });
    });

    test('uses context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context-test' }
      });
      const contextStack = new TapStack(contextApp, 'ContextTapStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'SecureVPC-context-test',
        },
      });
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTapStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'SecureVPC-dev',
        },
      });
    });
  });

  describe('LocalStack Configuration', () => {
    test('applies RemovalPolicy.DESTROY for LocalStack environment', () => {
      const localstackApp = new cdk.App({
        context: { localstack: true }
      });
      const localstackStack = new TapStack(localstackApp, 'LocalStackTapStack');
      const localstackTemplate = Template.fromStack(localstackStack);

      // Verify bastion instance has DeletionPolicy: Delete
      localstackTemplate.hasResource('AWS::EC2::Instance', {
        DeletionPolicy: 'Delete',
      });
    });
  });
});
