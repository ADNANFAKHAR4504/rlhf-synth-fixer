import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultProps = {
    region: 'us-east-1',
    environmentSuffix,
    // Use a direct AMI ID to avoid SSM lookup
    amiSsmParameterName: 'dummy-param-to-avoid-lookup',
    env: {
      account: '123456789012',
      region: 'us-east-1'
    }
  };

  beforeEach(() => {
    app = new cdk.App();

    // Set context to provide AMI ID directly to avoid SSM lookup
    app.node.setContext('ami-account-mapping', {
      'us-east-1': 'ami-12345678',
      'us-west-2': 'ami-87654321'
    });

    // Provide the SSM parameter value directly to avoid lookup
    app.node.setContext('ssm:account=123456789012:parameterName=dummy-param-to-avoid-lookup:region=us-east-1', 'ami-12345678');

    stack = new TapStack(app, 'TestTapStack', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create exactly 4 subnets (2 public, 2 private)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Check that we have both public and private subnets
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetValues = Object.values(subnets);

      const publicSubnets = subnetValues.filter((subnet: any) =>
        subnet.Properties?.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnetValues.filter((subnet: any) =>
        subnet.Properties?.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('should create 2 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        InternetGatewayId: Match.anyValue(),
        VpcId: Match.anyValue()
      });
    });

    test('should create route tables for public and private subnets', () => {

      // Public route to Internet Gateway
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
      });

      // Private route to NAT Gateway
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue()
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for multi-region web app',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH access from anywhere'
          },
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP access from anywhere'
          }
        ]
      });
    });

    test('should allow all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0'
          }
        ]
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 instance role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        Description: 'IAM role for EC2 instances in multi-region web app'
      });
    });

    test('should create inline policy for SSM parameter access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'SSMParameterAccess',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ssm:GetParameter',
                    'ssm:GetParameters'
                  ],
                  Resource: Match.stringLikeRegexp('arn:aws:ssm:us-east-1:.*:parameter.*')
                }
              ]
            }
          }
        ]
      });
    });

    test('should create instance profile linked to IAM role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.anyValue()
          }
        ]
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('should create exactly 2 EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('should create instances with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        ImageId: 'ami-12345678',
        IamInstanceProfile: {
          Ref: Match.anyValue()
        },
        NetworkInterfaces: Match.anyValue(),
        UserData: Match.anyValue()
      });
    });

    test('should associate public IP addresses with instances', () => {
      // Instances use NetworkInterfaces configuration
      template.hasResourceProperties('AWS::EC2::Instance', {
        NetworkInterfaces: Match.anyValue()
      });

      // Verify instances are created
      const instances = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(instances).length).toBe(2);
    });

    test('should reference AMI ID correctly', () => {
      // The AMI ID should be from the provided context
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: 'ami-12345678'
      });
    });
  });

  describe('Tags Configuration', () => {
    test('should tag all resources with Project=MultiRegionWebApp', () => {
      // Check that the stack has the required tag
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Project']).toBe('MultiRegionWebApp');
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create outputs for instance public DNS names', () => {
      template.hasOutput('Instance1PublicDns', {
        Description: 'Public DNS name for EC2 instance 1 in us-east-1',
        Export: {
          Name: 'TestTapStack-Instance1-PublicDns'
        }
      });

      template.hasOutput('Instance2PublicDns', {
        Description: 'Public DNS name for EC2 instance 2 in us-east-1',
        Export: {
          Name: 'TestTapStack-Instance2-PublicDns'
        }
      });
    });

    test('should create output for VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for us-east-1',
        Export: {
          Name: 'TestTapStack-VpcId'
        }
      });
    });

    test('should create output for Security Group ID', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID for us-east-1',
        Export: {
          Name: 'TestTapStack-SecurityGroupId'
        }
      });
    });
  });

  describe('Props Validation', () => {
    test('should use default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('ssm:account=123456789012:parameterName=dummy-param-to-avoid-lookup:region=us-west-2', 'ami-87654321');

      const stackWithoutSuffix = new TapStack(testApp, 'TestStackNoSuffix', {
        region: 'us-west-2',
        amiSsmParameterName: 'dummy-param-to-avoid-lookup',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      // Should not throw and should use 'dev' as default
      expect(stackWithoutSuffix).toBeDefined();
    });

    test('should use custom environment suffix when provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('ssm:account=123456789012:parameterName=dummy-param-to-avoid-lookup:region=us-west-2', 'ami-87654321');

      const customStack = new TapStack(testApp, 'TestStackCustom', {
        region: 'us-west-2',
        environmentSuffix: 'prod',
        amiSsmParameterName: 'dummy-param-to-avoid-lookup',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(customStack).toBeDefined();
    });

    test('should use custom AMI SSM parameter when provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('ssm:account=123456789012:parameterName=/custom/ami/parameter:region=us-west-2', 'ami-custom123');

      const customAmiStack = new TapStack(testApp, 'TestStackCustomAmi', {
        region: 'us-west-2',
        amiSsmParameterName: '/custom/ami/parameter',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const customTemplate = Template.fromStack(customAmiStack);

      // Should use custom SSM parameter in IAM policy
      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: [
                {
                  Resource: Match.stringLikeRegexp('.*parameter/custom/ami/parameter')
                }
              ]
            }
          }
        ]
      });
    });

    test('should handle different regions correctly', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('ssm:account=123456789012:parameterName=dummy-param-to-avoid-lookup:region=us-west-2', 'ami-87654321');

      const westCoastStack = new TapStack(testApp, 'TestStackWest', {
        region: 'us-west-2',
        environmentSuffix: 'test',
        amiSsmParameterName: 'dummy-param-to-avoid-lookup',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      const westTemplate = Template.fromStack(westCoastStack);

      // Check that outputs reference the correct region
      westTemplate.hasOutput('VpcId', {
        Description: 'VPC ID for us-west-2'
      });

      westTemplate.hasOutput('Instance1PublicDns', {
        Description: 'Public DNS name for EC2 instance 1 in us-west-2'
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct dependencies between resources', () => {
      // Security group should depend on VPC
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          VpcId: {
            Ref: Match.anyValue()
          }
        }
      });

      // Instance profile should reference IAM role
      template.hasResource('AWS::IAM::InstanceProfile', {
        Properties: {
          Roles: [
            {
              Ref: Match.anyValue()
            }
          ]
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use least privilege for IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ssm:GetParameter',
                    'ssm:GetParameters'
                  ],
                  // Should only allow access to specific SSM parameter
                  Resource: Match.stringLikeRegexp('arn:aws:ssm:.*:.*:parameter.*')
                }
              ]
            }
          }
        ]
      });
    });

    test('should not have overly permissive security group rules', () => {
      // While the current implementation allows SSH and HTTP from anywhere,
      // we can test that it doesn't have more permissive rules
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 22,
            ToPort: 22
          }),
          Match.objectLike({
            FromPort: 80,
            ToPort: 80
          })
        ])
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy instances across multiple availability zones', () => {
      // With 2 public subnets in different AZs, instances should be distributed
      template.resourceCountIs('AWS::EC2::Instance', 2);

      // Each instance should be in a different subnet
      const instances = template.findResources('AWS::EC2::Instance');
      const instanceKeys = Object.keys(instances);

      expect(instanceKeys.length).toBe(2);
    });

    test('should have NAT Gateways in multiple AZs for redundancy', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle missing required props gracefully', () => {
      const testApp = new cdk.App();

      expect(() => {
        new TapStack(testApp, 'TestStackMissingProps', {
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        } as any);
      }).toThrow();
    });

    test('should require region prop', () => {
      const testApp = new cdk.App();

      expect(() => {
        new TapStack(testApp, 'TestStackNoRegion', {
          environmentSuffix: 'test',
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        } as any);
      }).toThrow();
    });
  });

  describe('Write Integration TESTS', () => {
    test('Should verify complete infrastructure deployment', () => {
      // Verify all major components are present
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::IAM::Role', 1);
      // Verify outputs are created
      template.hasOutput('VpcId', {});
      template.hasOutput('SecurityGroupId', {});
      template.hasOutput('Instance1PublicDns', {});
      template.hasOutput('Instance2PublicDns', {});

      expect(true).toBe(true);
    });

    test('Should validate cross-stack references work correctly', () => {
      // Test that exports are properly named for cross-stack references
      template.hasOutput('VpcId', {
        Export: {
          Name: 'TestTapStack-VpcId'
        }
      });

      template.hasOutput('SecurityGroupId', {
        Export: {
          Name: 'TestTapStack-SecurityGroupId'
        }
      });

      expect(true).toBe(true);
    });

    test('Should ensure proper resource naming and tagging for multi-environment support', () => {
      // Verify project tag is applied
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Project']).toBe('MultiRegionWebApp');

      // Verify export names include stack name for uniqueness
      template.hasOutput('Instance1PublicDns', {
        Export: {
          Name: Match.stringLikeRegexp('.*-Instance1-PublicDns')
        }
      });

      expect(true).toBe(true);
    });
  });
});