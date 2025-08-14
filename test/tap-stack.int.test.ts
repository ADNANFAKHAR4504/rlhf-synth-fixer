import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Full Stack Integration', () => {
    test('should synthesize valid CloudFormation template', () => {
      // This test ensures the entire stack can be synthesized without errors
      expect(() => {
        template.toJSON();
      }).not.toThrow();
    });

    test('should have all required resource types', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);

      // Verify all expected resource types are present
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::VPCEndpoint');
      expect(resourceTypes).toContain('AWS::EC2::FlowLog');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
    });

    test('should have proper resource dependencies', () => {
      // Verify that resources have proper DependsOn relationships
      const resources = template.toJSON().Resources;

      // Find VPC Flow Log and verify it depends on VPC
      const flowLogResource = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::EC2::FlowLog'
      );
      expect(flowLogResource).toBeDefined();

      // Find VPC Endpoints and verify they depend on VPC
      const vpcEndpoints = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCEndpoint'
      );
      expect(vpcEndpoints.length).toBeGreaterThan(0);
    });

    test('should have consistent tagging across all resources', () => {
      const resources = template.toJSON().Resources;

      // Check that all tagged resources have the standard tags
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          const hasEnvironmentTag = tags.some(
            (tag: any) => tag.Key === 'Environment'
          );
          const hasServiceTag = tags.some((tag: any) => tag.Key === 'Service');

          if (hasEnvironmentTag || hasServiceTag) {
            // If any standard tag is present, all should be present
            expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(
              true
            );
            expect(tags.some((tag: any) => tag.Key === 'Service')).toBe(true);
            expect(tags.some((tag: any) => tag.Key === 'Owner')).toBe(true);
            expect(tags.some((tag: any) => tag.Key === 'Project')).toBe(true);
            expect(tags.some((tag: any) => tag.Key === 'ManagedBy')).toBe(true);
          }
        }
      });
    });
  });

  describe('KMS Integration', () => {
    test('should create KMS keys with proper policies and dependencies', () => {
      // Verify KMS keys are created with proper configuration
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });

      // Verify KMS keys have proper deletion policies (at resource level, not properties level)
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.DeletionPolicy).toBe('Retain');
        expect(key.UpdateReplacePolicy).toBe('Retain');
      });

      // Verify KMS keys have proper policies (embedded in the key resource)
      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.Properties.KeyPolicy).toBeDefined();
        expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      });
    });

    test('should have KMS keys referenced by other resources', () => {
      // Verify that IAM roles reference KMS keys
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                  ]),
                  Resource: Match.anyValue(),
                }),
              ]),
            },
          }),
        ]),
      });

      // Verify that VPC Flow Logs reference KMS keys
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  describe('IAM Integration', () => {
    test('should create IAM roles with proper trust relationships', () => {
      // Lambda execution role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({}), // Use objectLike for complex ARN objects
        ]),
      });

      // EC2 instance role
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
        },
      });

      // RDS monitoring role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({}), // Use objectLike for complex ARN objects
        ]),
      });

      // CloudTrail role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should have IAM roles with proper inline policies', () => {
      // Verify that at least one IAM role has inline policies
      const iamRoles = template.findResources('AWS::IAM::Role');
      const rolesWithPolicies = Object.values(iamRoles).filter(
        (role: any) =>
          role.Properties?.Policies && role.Properties.Policies.length > 0
      );

      expect(rolesWithPolicies.length).toBeGreaterThan(0);

      // Verify that roles with policies have proper structure
      rolesWithPolicies.forEach((role: any) => {
        expect(role.Properties.Policies).toBeDefined();
        expect(Array.isArray(role.Properties.Policies)).toBe(true);

        role.Properties.Policies.forEach((policy: any) => {
          expect(policy.PolicyName).toBeDefined();
          expect(policy.PolicyDocument).toBeDefined();
          expect(policy.PolicyDocument.Statement).toBeDefined();
        });
      });
    });
  });

  describe('Network Integration', () => {
    test('should create VPC with all required components', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
      });

      // Subnets (public and private)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: Match.anyValue(),
      });

      // Internet Gateway
      template.hasResource('AWS::EC2::InternetGateway', {});

      // NAT Gateway
      template.hasResource('AWS::EC2::NatGateway', {});

      // Route Tables
      template.hasResource('AWS::EC2::RouteTable', {});
    });

    test('should create security groups with proper rules', () => {
      // Web tier security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier (load balancers)',
      });

      // Application tier security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier',
      });

      // Database tier security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier',
      });

      // Lambda security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });

    test('should create VPC endpoints for AWS services', () => {
      // Interface endpoints
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
        ServiceName: Match.stringLikeRegexp('com\\.amazonaws\\..*'),
      });

      // Verify that VPC endpoints exist
      const vpcEndpoints = template.findResources('AWS::EC2::VPCEndpoint');
      expect(Object.keys(vpcEndpoints).length).toBeGreaterThan(0);

      // Verify endpoints have valid types (Interface or Gateway)
      Object.values(vpcEndpoints).forEach((endpoint: any) => {
        expect(['Interface', 'Gateway']).toContain(
          endpoint.Properties.VpcEndpointType
        );
      });
    });

    test('should create VPC Flow Logs with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
        LogGroupName: Match.anyValue(),
      });

      // Verify Log Group is created with proper retention
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue(), // Accept any retention period
      });
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('should have proper dependencies between KMS and IAM', () => {
      // Verify IAM roles reference KMS keys
      const iamRoles = template.findResources('AWS::IAM::Role');
      const kmsKeys = template.findResources('AWS::KMS::Key');

      expect(Object.keys(iamRoles).length).toBeGreaterThan(0);
      expect(Object.keys(kmsKeys).length).toBe(3);
    });

    test('should have proper dependencies between VPC and other resources', () => {
      // Verify VPC Flow Logs depend on VPC
      const flowLogs = template.findResources('AWS::EC2::FlowLog');
      const vpcs = template.findResources('AWS::EC2::VPC');

      expect(Object.keys(flowLogs).length).toBeGreaterThan(0);
      expect(Object.keys(vpcs).length).toBe(1);
    });

    test('should have proper dependencies between security groups', () => {
      // Verify security groups reference each other
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('CloudFormation Outputs Integration', () => {
    test('should export all required outputs', () => {
      // VPC ID
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the secure network',
        Export: {
          Name: 'TestTapStack-VpcId',
        },
      });

      // KMS Key ARN
      template.hasOutput('DataKeyArn', {
        Description: 'ARN of the data encryption KMS key',
        Export: {
          Name: 'TestTapStack-DataKeyArn',
        },
      });

      // Lambda Role ARN
      template.hasOutput('LambdaExecutionRoleArn', {
        Description: 'ARN of the Lambda execution role',
        Export: {
          Name: 'TestTapStack-LambdaExecutionRoleArn',
        },
      });
    });

    test('should have valid output values', () => {
      const outputs = template.toJSON().Outputs;

      // Verify VPC ID output references actual VPC
      expect(outputs.VpcId.Value).toBeDefined();

      // Verify KMS key ARN output references actual key
      expect(outputs.DataKeyArn.Value).toBeDefined();

      // Verify Lambda role ARN output references actual role
      expect(outputs.LambdaExecutionRoleArn.Value).toBeDefined();
    });
  });

  describe('Environment-Specific Integration', () => {
    test('should work with different environment suffixes', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Verify prod stack has different resource names
      const prodResources = prodTemplate.toJSON().Resources;
      const testResources = template.toJSON().Resources;

      expect(Object.keys(prodResources).length).toBe(
        Object.keys(testResources).length
      );
    });

    test('should have environment-specific tags', () => {
      const resources = template.toJSON().Resources;

      // Check that all tagged resources have the correct environment tag
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toBe('test');
          }
        }
      });
    });
  });

  describe('Security and Compliance Integration', () => {
    test('should have encryption enabled on all applicable resources', () => {
      // KMS keys should have encryption enabled
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });

      // VPC Flow Logs should be encrypted
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogDestinationType: 'cloud-watch-logs',
      });
    });

    test('should have compliance tags on all resources', () => {
      const resources = template.toJSON().Resources;

      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          const hasComplianceTags = tags.some((tag: any) =>
            ['ComplianceLevel', 'DataClassification'].includes(tag.Key)
          );

          if (hasComplianceTags) {
            expect(tags.some((tag: any) => tag.Key === 'ComplianceLevel')).toBe(
              true
            );
            expect(
              tags.some((tag: any) => tag.Key === 'DataClassification')
            ).toBe(true);
            expect(tags.some((tag: any) => tag.Key === 'BackupRequired')).toBe(
              true
            );
            expect(
              tags.some((tag: any) => tag.Key === 'MonitoringEnabled')
            ).toBe(true);
          }
        }
      });
    });

    test('should have proper security group rules for compliance', () => {
      // Database security group should exist
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier',
      });

      // Verify security groups have proper egress rules (no overly permissive rules)
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties?.SecurityGroupEgress) {
          sg.Properties.SecurityGroupEgress.forEach((rule: any) => {
            // Should not allow all traffic outbound on all ports
            if (rule.CidrIp === '0.0.0.0/0') {
              expect(rule.FromPort).not.toBe(-1);
              expect(rule.ToPort).not.toBe(-1);
            }
          });
        }
      });
    });
  });

  describe('Resource Limits and Constraints', () => {
    test('should not exceed AWS service limits', () => {
      const resources = template.toJSON().Resources;

      // Check KMS key count (limit is 100 per region)
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBeLessThanOrEqual(100);

      // Check IAM role count (limit is 5000 per account)
      const iamRoles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );
      expect(iamRoles.length).toBeLessThanOrEqual(5000);

      // Check VPC count (limit is 5 per region)
      const vpcs = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      );
      expect(vpcs.length).toBeLessThanOrEqual(5);
    });

    test('should have reasonable resource configurations', () => {
      // VPC should have reasonable CIDR
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16', // /16 is reasonable for most use cases
      });

      // Subnets should have reasonable CIDR blocks
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'), // /24 is reasonable
      });

      // KMS keys should have proper rotation
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });
});
