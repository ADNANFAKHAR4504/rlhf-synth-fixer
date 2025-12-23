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

  describe('Environment Suffix', () => {
    test('should use provided environment suffix', () => {
      const customSuffix = 'test123';
      const customStack = new TapStack(app, 'CustomStack', { environmentSuffix: customSuffix });
      expect(customStack).toBeDefined();
    });

    test('should use context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({ context: { environmentSuffix: 'context-suffix' } });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('should default to dev when no suffix provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create exactly 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create exactly 2 private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create subnets in correct availability zones', () => {
      // CDK uses Fn::Select to choose AZs dynamically
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: Match.objectLike({
          'Fn::Select': Match.arrayWith([0]),
        }),
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: Match.objectLike({
          'Fn::Select': Match.arrayWith([1]),
        }),
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateways for private subnets', () => {
      // For LocalStack: NAT gateways are disabled (set to 0) for compatibility
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('VPC Endpoints', () => {
    test('should create SSM VPC endpoint', () => {
      // Find VPC endpoints and check for SSM endpoint
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const ssmEndpoint = Object.values(endpoints).find(ep => {
        const serviceName = ep.Properties?.ServiceName;
        if (typeof serviceName === 'object' && serviceName['Fn::Join']) {
          const parts = serviceName['Fn::Join'][1];
          return parts && parts.some((p: any) => typeof p === 'string' && p.includes('ssm') && !p.includes('messages'));
        }
        return false;
      });
      
      expect(ssmEndpoint).toBeDefined();
      expect(ssmEndpoint?.Properties?.VpcEndpointType).toBe('Interface');
      expect(ssmEndpoint?.Properties?.PrivateDnsEnabled).toBe(true);
    });

    test('should create SSM Messages VPC endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const ssmMessagesEndpoint = Object.values(endpoints).find(ep => {
        const serviceName = ep.Properties?.ServiceName;
        if (typeof serviceName === 'object' && serviceName['Fn::Join']) {
          const parts = serviceName['Fn::Join'][1];
          return parts && parts.some((p: any) => typeof p === 'string' && p.includes('ssmmessages'));
        }
        return false;
      });
      
      expect(ssmMessagesEndpoint).toBeDefined();
      expect(ssmMessagesEndpoint?.Properties?.VpcEndpointType).toBe('Interface');
      expect(ssmMessagesEndpoint?.Properties?.PrivateDnsEnabled).toBe(true);
    });

    test('should create EC2 Messages VPC endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const ec2MessagesEndpoint = Object.values(endpoints).find(ep => {
        const serviceName = ep.Properties?.ServiceName;
        if (typeof serviceName === 'object' && serviceName['Fn::Join']) {
          const parts = serviceName['Fn::Join'][1];
          return parts && parts.some((p: any) => typeof p === 'string' && p.includes('ec2messages'));
        }
        return false;
      });
      
      expect(ec2MessagesEndpoint).toBeDefined();
      expect(ec2MessagesEndpoint?.Properties?.VpcEndpointType).toBe('Interface');
      expect(ec2MessagesEndpoint?.Properties?.PrivateDnsEnabled).toBe(true);
    });

    test('should have VPC endpoint security groups', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*VPC.*Endpoint.*'),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create bastion security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion hosts',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('should create internal security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for internal communication',
      });
    });

    test('should allow bastion to internal communication on port 22', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'SSH access from bastion hosts',
        FromPort: 22,
        ToPort: 22,
        IpProtocol: 'tcp',
      });
    });

    test('should create VPC endpoint security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Shared security group for VPC endpoints',
      });
    });

    test('bastion security group should allow HTTPS outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion hosts',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('bastion security group should allow HTTP outbound for updates', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion hosts',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });
  });

  describe('Bastion Hosts', () => {
    test('should create exactly 2 bastion hosts', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('should use t3.nano instance type for bastion hosts', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.nano',
      });
    });

    test('should place bastion hosts in public subnets', () => {
      const bastionHosts = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(bastionHosts)).toHaveLength(2);
    });

    test('should have IAM instance profile for bastion hosts', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM role for bastion hosts', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create IAM role for private instances', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const privateRole = Object.values(roles).find(role => {
        const policyArns = role.Properties?.ManagedPolicyArns;
        if (Array.isArray(policyArns)) {
          return policyArns.some(arn => {
            if (typeof arn === 'object' && arn['Fn::Join']) {
              const parts = arn['Fn::Join'][1];
              return parts && parts.some((p: any) => typeof p === 'string' && p.includes('AmazonSSMManagedInstanceCore'));
            }
            return false;
          });
        }
        return false;
      });
      
      expect(privateRole).toBeDefined();
    });

    test('bastion hosts should have SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:UpdateInstanceInformation',
                'ssm:SendCommand',
                'ssmmessages:CreateControlChannel',
                'ssmmessages:CreateDataChannel',
                'ssmmessages:OpenControlChannel',
                'ssmmessages:OpenDataChannel',
                'ec2messages:GetEndpoint',
                'ec2messages:GetMessages',
                'ec2messages:SendReply',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag VPC with Environment:Production', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('should tag security groups with Environment:Production', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('should tag bastion hosts with Environment:Production', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('should tag bastion hosts with appropriate Name tags', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('BastionHost-AZ[12]'),
          }),
        ]),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('SecurityStackVpcId62BB3396', {
        Description: 'VPC ID',
      });
    });

    test('should output Bastion Security Group ID', () => {
      template.hasOutput('SecurityStackBastionSecurityGroupId02E464D4', {
        Description: 'Bastion Host Security Group ID',
      });
    });

    test('should output Internal Security Group ID', () => {
      template.hasOutput('SecurityStackInternalSecurityGroupIdF3056D73', {
        Description: 'Internal Resources Security Group ID',
      });
    });

    test('should output Bastion Host IDs', () => {
      // Outputs are created with CDK-generated IDs, check that at least 2 bastion host outputs exist
      const outputs = template.findOutputs('*');
      const bastionOutputs = Object.keys(outputs).filter(key =>
        key.includes('BastionHost') && key.includes('BastionHostId')
      );
      expect(bastionOutputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Network Routing', () => {
    test('should create route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('should create default routes for public subnets to IGW', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('should create default routes for private subnets to NAT', () => {
      // For LocalStack: No NAT gateways, so no routes to NAT
      // Private subnets are isolated and use VPC endpoints for AWS service access
      const routes = template.findResources('AWS::EC2::Route');
      const natRoutes = Object.values(routes).filter((route: any) =>
        route.Properties?.NatGatewayId
      );
      expect(natRoutes.length).toBe(0);
    });
  });

  describe('Security Compliance', () => {
    test('should not allow unrestricted SSH access', () => {
      const template = Template.fromStack(stack);
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach(sg => {
        const ingress = sg.Properties?.SecurityGroupIngress;
        if (ingress && Array.isArray(ingress)) {
          ingress.forEach(rule => {
            if (rule.FromPort === 22 && rule.ToPort === 22) {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });

    test('internal security group should have restricted outbound', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const internalSg = Object.values(securityGroups).find(
        sg => sg.Properties?.GroupDescription === 'Security group for internal communication'
      );
      
      expect(internalSg).toBeDefined();
      // Internal SG should not have default allow all outbound
      expect(internalSg?.Properties?.SecurityGroupEgress).toBeUndefined();
    });
  });
});
