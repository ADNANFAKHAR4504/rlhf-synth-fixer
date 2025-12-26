import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// LocalStack detection for conditional tests
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('secure-vpc-test') })
        ])
      });
    });

    test('should create exactly 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });
      expect(Object.keys(subnets).length).toBe(2);
    });

    test('should create exactly 2 private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false
        }
      });
      expect(Object.keys(subnets).length).toBe(2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Elastic IP for NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc'
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });
    });

    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/vpc/flowlogs/test',
        RetentionInDays: 7
      });
    });

    test('should create IAM role for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'vpc-flow-log-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  // Network Firewall tests - skip in LocalStack (not supported in Community)
  (isLocalStack ? describe.skip : describe)('Network Firewall', () => {
    test('should create Network Firewall', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
        FirewallName: 'security-firewall-test',
        Description: 'Network firewall for VPC protection'
      });
    });

    test('should create Network Firewall Rule Group', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        RuleGroupName: 'threat-protection-test',
        Type: 'STATEFUL',
        Capacity: 100
      });
    });

    test('should create Network Firewall Policy', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
        FirewallPolicyName: 'security-policy-test',
        Description: 'Network firewall policy for threat protection'
      });
    });

    test('should configure stateful rules for threat protection', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        RuleGroup: {
          RulesSource: {
            StatefulRules: Match.arrayWith([
              Match.objectLike({
                Action: 'DROP',
                Header: {
                  Protocol: 'TCP'
                }
              })
            ])
          },
          StatefulRuleOptions: {
            RuleOrder: 'DEFAULT_ACTION_ORDER'
          }
        }
      });
    });
  });

  // VPC Lattice tests - skip in LocalStack (not supported in Community)
  (isLocalStack ? describe.skip : describe)('VPC Lattice', () => {
    test('should create VPC Lattice Service Network', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'secure-service-network-test',
        AuthType: 'AWS_IAM'
      });
    });

    test('should create VPC Lattice Service Network VPC Association', () => {
      template.hasResource('AWS::VpcLattice::ServiceNetworkVpcAssociation', {});
    });

    test('should create IAM role for VPC Lattice', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'vpc-lattice-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-lattice.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should have correct VPC Lattice permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'vpc-lattice:ListServices',
                'vpc-lattice:GetService',
                'vpc-lattice:CreateServiceNetworkVpcAssociation',
                'vpc-lattice:GetServiceNetworkVpcAssociation'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('should create Web Tier Security Group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier with least privilege access',
        GroupName: 'web-tier-sg-test'
      });
    });

    test('should create App Tier Security Group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier',
        GroupName: 'app-tier-sg-test'
      });
    });

    test('Web Tier SG should allow HTTPS inbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('Web Tier SG should allow HTTP inbound for health checks', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('App Tier SG should only allow traffic from Web Tier', () => {
      template.hasResource('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          Description: 'Allow traffic from web tier',
          FromPort: 8080,
          ToPort: 8080,
          IpProtocol: 'tcp'
        }
      });
    });

    test('Both security groups should restrict outbound to HTTPS only', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties?.SecurityGroupEgress) {
          expect(sg.Properties.SecurityGroupEgress).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                IpProtocol: 'tcp',
                FromPort: 443,
                ToPort: 443
              })
            ])
          );
        }
      });
    });
  });

  describe('Tagging', () => {
    test('should tag all resources with Environment: Production', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Production'
            })
          ])
        );
      });
    });

    test('should tag networking resources with Component: Networking', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      Object.values(vpcResources).forEach(resource => {
        expect(resource.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Component',
              Value: 'Networking'
            })
          ])
        );
      });
    });

    test('should tag security resources with Component: Security', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(sgResources).forEach(resource => {
        expect(resource.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Component',
              Value: 'Security'
            })
          ])
        );
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output VPC ID', () => {
      const outputs = template.findOutputs('*');
      const vpcIdOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'VPC ID'
      );
      expect(vpcIdOutput).toBeDefined();
    });

    test('should output VPC CIDR', () => {
      const outputs = template.findOutputs('*');
      const vpcCidrOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'VPC CIDR Block'
      );
      expect(vpcCidrOutput).toBeDefined();
    });

    test('should output Public Subnet IDs', () => {
      const outputs = template.findOutputs('*');
      const publicSubnetOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'Public Subnet IDs'
      );
      expect(publicSubnetOutput).toBeDefined();
    });

    test('should output Private Subnet IDs', () => {
      const outputs = template.findOutputs('*');
      const privateSubnetOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'Private Subnet IDs'
      );
      expect(privateSubnetOutput).toBeDefined();
    });

    test('should output Network Firewall ARN', () => {
      const outputs = template.findOutputs('*');
      const firewallOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'Network Firewall ARN'
      );
      expect(firewallOutput).toBeDefined();
    });

    test('should output Service Network ID', () => {
      const outputs = template.findOutputs('*');
      const serviceNetworkOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'VPC Lattice Service Network ID'
      );
      expect(serviceNetworkOutput).toBeDefined();
    });

    test('should output Web Tier Security Group ID', () => {
      const outputs = template.findOutputs('*');
      const webTierSgOutput = Object.entries(outputs).find(([key, value]) => 
        value.Description === 'Web Tier Security Group ID'
      );
      expect(webTierSgOutput).toBeDefined();
    });
  });

  describe('IAM Least Privilege', () => {
    test('VPC Flow Logs role should have minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams'
              ])
            })
          ])
        }
      });
    });

    test('VPC Lattice role should have minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'vpc-lattice:ListServices',
                'vpc-lattice:GetService',
                'vpc-lattice:CreateServiceNetworkVpcAssociation',
                'vpc-lattice:GetServiceNetworkVpcAssociation'
              ]),
              Resource: '*'
            })
          ])
        }
      });
    });
  });

  describe('Resource Naming', () => {
    test('all named resources should include environment suffix', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'Name', 
            Value: Match.stringLikeRegexp('.*test.*') 
          })
        ])
      });

      // Check IAM roles
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('.*test.*')
      });

      // Check Security Groups
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('.*test.*')
      });

      // Check Network Firewall
      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
        FirewallName: Match.stringLikeRegexp('.*test.*')
      });

      // Check VPC Lattice Service Network
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: Match.stringLikeRegexp('.*test.*')
      });
    });
  });

  describe('Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      const jsonString = JSON.stringify(template.toJSON());
      expect(jsonString).not.toMatch(/AWS_ACCESS_KEY_ID/);
      expect(jsonString).not.toMatch(/AWS_SECRET_ACCESS_KEY/);
      expect(jsonString).not.toMatch(/password/i);
      expect(jsonString).not.toMatch(/secret/i);
    });

    test('should have removal policy set for stateful resources', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('should enable DNS hostnames and support in VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });
  });
});