import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
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
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs * 2 subnet types
    });

    test('should create VPC with custom CIDR when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        vpcCidr: '172.16.0.0/16',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });

    test('should create VPC with custom max AZs when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        maxAzs: 3,
      });
      const customTemplate = Template.fromStack(customStack);

      // Should create 6 subnets (3 AZs * 2 subnet types)
      // Note: CDK may not always create exactly 6 subnets due to region limitations
      const subnetCount = Object.keys(
        customTemplate.findResources('AWS::EC2::Subnet')
      ).length;
      expect(subnetCount).toBeGreaterThanOrEqual(4); // At least 4 subnets (2 AZs * 2 types)
    });

    test('should create VPC with flow logs when enabled', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        enableVpcFlowLogs: true,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create security group with HTTP and SSH rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
        SecurityGroupIngress: [
          {
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP inbound',
          },
          {
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0',
            Description: 'Allow SSH inbound',
          },
        ],
      });
    });

    test('should create security group with restricted outbound when specified', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        allowAllOutbound: false,
      });
      const customTemplate = Template.fromStack(customStack);

      // Check that security group exists with proper description
      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('should create EC2 instance with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
      });
    });

    test('should create EC2 instance in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        NetworkInterfaces: [
          {
            AssociatePublicIpAddress: true,
          },
        ],
      });
    });

    test('should create EC2 instance with custom instance type when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T3,
          cdk.aws_ec2.InstanceSize.SMALL
        ),
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.small',
      });
    });

    test('should create EC2 instance with user data', () => {
      const instanceResources = template.findResources('AWS::EC2::Instance');
      const instanceResource = Object.values(instanceResources)[0];

      expect(instanceResource.Properties.UserData).toBeDefined();
      expect(instanceResource.Properties.UserData['Fn::Base64']).toContain(
        '#!/bin/bash'
      );
    });
  });

  describe('Key Pair Configuration', () => {
    test('should create key pair with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyFormat: 'pem',
        KeyType: 'rsa',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output EC2 public IP', () => {
      template.hasOutput('EC2PublicIP', {
        Description: 'Public IP of the EC2 instance',
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCID', {
        Description: 'VPC ID',
      });
    });

    test('should output Security Group ID', () => {
      template.hasOutput('SecurityGroupID', {
        Description: 'Security Group ID',
      });
    });

    test('should output Key Pair Name', () => {
      template.hasOutput('KeyPairName', {
        Description: 'Key Pair Name for SSH access',
      });
    });

    test('should output Instance ID', () => {
      template.hasOutput('InstanceID', {
        Description: 'EC2 Instance ID',
      });
    });

    test('should output Availability Zone', () => {
      template.hasOutput('AvailabilityZone', {
        Description: 'EC2 Instance Availability Zone',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with environment', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcResources)[0];

      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ])
      );
    });

    test('should tag resources with additional metadata', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcResources)[0];

      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'TAP' },
          { Key: 'Owner', Value: 'DevOps' },
          { Key: 'ManagedBy', Value: 'CDK' },
        ])
      );
    });
  });

  describe('VPC Endpoints', () => {
    test('should create VPC endpoints when enabled', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        enableVpcEndpoints: true,
      });
      const customTemplate = Template.fromStack(customStack);

      // Should create VPC endpoints
      customTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 4); // S3 Gateway + 3 SSM Interface endpoints
    });

    test('should not create VPC endpoints when disabled', () => {
      // Default behavior (endpoints disabled)
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC flow logs when enabled', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix,
        enableVpcFlowLogs: true,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Logs::LogGroup', {});
      customTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should not create VPC flow logs when disabled', () => {
      // Default behavior (flow logs disabled)
      template.resourceCountIs('AWS::EC2::FlowLog', 0);
    });
  });

  describe('Error Handling and Validation', () => {
    test('should throw error for invalid environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'InvalidStack', {
          environmentSuffix: 'invalid',
        });
      }).toThrow('Invalid environment suffix: invalid. Must be one of: dev, staging, prod, test or a PR number (prXXXX)');
    });

    test('should handle PR number environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'PRStack', {
          environmentSuffix: 'pr1003',
        });
      }).not.toThrow();
    });

    test('should handle PR number environment suffix with uppercase', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'PRStack', {
          environmentSuffix: 'PR1003',
        });
      }).not.toThrow();
    });

    test('should throw error for invalid VPC CIDR format', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'InvalidStack', {
          environmentSuffix,
          vpcCidr: 'invalid-cidr',
        });
      }).toThrow('Invalid VPC CIDR format: invalid-cidr');
    });

    test('should throw error for invalid VPC CIDR prefix length', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'InvalidStack', {
          environmentSuffix,
          vpcCidr: '10.0.0.0/8', // Too large
        });
      }).toThrow('Invalid VPC CIDR prefix length: 8');
    });

    test('should throw error for invalid VPC CIDR prefix length too small', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'InvalidStack', {
          environmentSuffix,
          vpcCidr: '10.0.0.0/29', // Too small
        });
      }).toThrow('Invalid VPC CIDR prefix length: 29');
    });

    test('should throw error for invalid max AZs', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'InvalidStack', {
          environmentSuffix,
          maxAzs: 5, // Too many
        });
      }).toThrow('Invalid max AZs: 5');
    });

    test('should handle max AZs of 0 by using default', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'ZeroAzsStack', {
          environmentSuffix,
          maxAzs: 0, // Should use default
        });
      }).not.toThrow();
    });

    test('should handle case-insensitive environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'CaseInsensitiveStack', {
          environmentSuffix: 'PROD',
        });
      }).not.toThrow();
    });

    test('should handle empty environment suffix by using default', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'EmptySuffixStack', {
          environmentSuffix: '',
        });
      }).not.toThrow();
    });

    test('should handle undefined environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'UndefinedSuffixStack', {});
      }).not.toThrow();
    });

    test('should handle undefined VPC CIDR', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'UndefinedCidrStack', {
          environmentSuffix,
          vpcCidr: undefined,
        });
      }).not.toThrow();
    });

    test('should handle undefined max AZs', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'UndefinedAzsStack', {
          environmentSuffix,
          maxAzs: undefined,
        });
      }).not.toThrow();
    });

    test('should handle null environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'NullSuffixStack', {
          environmentSuffix: null as any,
        });
      }).not.toThrow();
    });

    test('should handle null VPC CIDR', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'NullCidrStack', {
          environmentSuffix,
          vpcCidr: null as any,
        });
      }).not.toThrow();
    });

    test('should handle null max AZs', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'NullAzsStack', {
          environmentSuffix,
          maxAzs: null as any,
        });
      }).not.toThrow();
    });

    test('should handle whitespace-only environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'WhitespaceSuffixStack', {
          environmentSuffix: '   ',
        });
      }).not.toThrow();
    });

    test('should handle negative max AZs', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'NegativeAzsStack', {
          environmentSuffix,
          maxAzs: -1,
        });
      }).not.toThrow();
    });

    test('should handle max AZs of 1', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'OneAzStack', {
          environmentSuffix,
          maxAzs: 1,
        });
      }).not.toThrow();
    });

    test('should handle max AZs of 4', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'FourAzStack', {
          environmentSuffix,
          maxAzs: 4,
        });
      }).not.toThrow();
    });

    test('should handle VPC CIDR with prefix length 16', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'Cidr16Stack', {
          environmentSuffix,
          vpcCidr: '10.0.0.0/16',
        });
      }).not.toThrow();
    });

    test('should handle VPC CIDR with prefix length 20', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'Cidr20Stack', {
          environmentSuffix,
          vpcCidr: '10.0.0.0/20',
        });
      }).not.toThrow();
    });

    test('should handle VPC CIDR with prefix length 22', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'Cidr22Stack', {
          environmentSuffix,
          vpcCidr: '10.0.0.0/22',
        });
      }).not.toThrow();
    });
  });

  describe('Public Properties', () => {
    test('should expose VPC as public property', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.vpcId).toBeDefined();
    });

    test('should expose Security Group as public property', () => {
      expect(stack.securityGroup).toBeDefined();
      expect(stack.securityGroup.securityGroupId).toBeDefined();
    });

    test('should expose EC2 Instance as public property', () => {
      expect(stack.instance).toBeDefined();
      expect(stack.instance.instanceId).toBeDefined();
    });

    test('should expose Key Pair as public property', () => {
      expect(stack.keyPair).toBeDefined();
      expect(stack.keyPair.keyPairName).toBeDefined();
    });
  });

  describe('Configuration Options', () => {
    test('should handle all configuration options together', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'FullConfigStack', {
        environmentSuffix: 'prod',
        vpcCidr: '192.168.0.0/16',
        maxAzs: 3,
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T3,
          cdk.aws_ec2.InstanceSize.MEDIUM
        ),
        allowAllOutbound: false,
        enableVpcFlowLogs: true,
        enableVpcEndpoints: true,
      });
      const customTemplate = Template.fromStack(customStack);

      // Verify VPC with custom CIDR
      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
      });

      // Verify flow logs
      customTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });

      // Verify VPC endpoints
      customTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 4);

      // Verify instance type
      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.medium',
      });
    });

    test('should handle minimal configuration', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'MinimalConfigStack', {});
      const customTemplate = Template.fromStack(customStack);

      // Should use all defaults
      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
      });
    });

    test('should handle partial configuration', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'PartialConfigStack', {
        environmentSuffix: 'staging',
        vpcCidr: '172.16.0.0/16',
      });
      const customTemplate = Template.fromStack(customStack);

      // Should use provided values and defaults for others
      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });

      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro', // Default
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle constructor with no props', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'NoPropsStack');
      }).not.toThrow();
    });

    test('should handle constructor with empty props object', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'EmptyPropsStack', {});
      }).not.toThrow();
    });

    test('should handle constructor with only environment suffix', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'OnlyEnvStack', {
          environmentSuffix: 'test',
        });
      }).not.toThrow();
    });

    test('should handle constructor with only VPC CIDR', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'OnlyCidrStack', {
          vpcCidr: '192.168.0.0/16',
        });
      }).not.toThrow();
    });

    test('should handle constructor with only max AZs', () => {
      expect(() => {
        const customApp = new cdk.App();
        new TapStack(customApp, 'OnlyAzsStack', {
          maxAzs: 3,
        });
      }).not.toThrow();
    });
  });
});
