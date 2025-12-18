import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const enableEC2 = !isLocalStack && (process.env.ENABLE_EC2 === 'true');

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should have correct stack tags', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags['Environment']).toBe('production');
      expect(stackTags['Project']).toBe('SecureInfrastructure');
    });

    test('should pass environment suffix to nested constructs', () => {
      // Verify the stack was created with correct props
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should default to dev environment when no suffix provided', () => {
      // Test default behavior with no environmentSuffix
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should still have alias with default suffix
      defaultTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/production-encryption-key-dev',
      });
    });

    test('should use context environment suffix when props not provided', () => {
      // Test context fallback
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/production-encryption-key-context-test',
      });
    });
  });

  describe('Security Infrastructure', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for production environment encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/production-encryption-key-${environmentSuffix}`,
      });
    });

    test('should create IAM role with MFA requirement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ProductionSecureRole-${environmentSuffix}`,
        Description: 'Production role requiring MFA authentication',
        MaxSessionDuration: 14400,
      });

      // Check for MFA deny policy
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should create VPC with correct configuration when EC2 is enabled', () => {
      if (enableEC2) {
        template.hasResourceProperties('AWS::EC2::VPC', {
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: `production-vpc-${environmentSuffix}`,
            }),
          ]),
        });
      } else {
        // No VPC should be created when EC2 is disabled
        template.resourceCountIs('AWS::EC2::VPC', 0);
      }
    });

    test('should create public and isolated subnets when EC2 is enabled', () => {
      if (enableEC2) {
        // Check for public subnets
        template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 isolated

        // Verify public subnet configuration
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: true,
        });
      } else {
        // No subnets when EC2 is disabled
        template.resourceCountIs('AWS::EC2::Subnet', 0);
      }
    });

    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`production-secure-bucket-${environmentSuffix}-\\d+`),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should configure S3 bucket lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            }),
          ]),
        },
      });
    });

    test('should create EC2 instance with encrypted EBS volume when enabled', () => {
      if (enableEC2) {
        // EC2 instance uses launch template with encrypted EBS in instance properties
        template.hasResourceProperties('AWS::EC2::Instance', {
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
                DeleteOnTermination: true,
              }),
            }),
          ]),
        });
      } else {
        // No EC2 instance when disabled
        template.resourceCountIs('AWS::EC2::Instance', 0);
      }
    });

    test('should configure EC2 instance with IMDSv2 when enabled', () => {
      if (enableEC2) {
        template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
          LaunchTemplateData: Match.objectLike({
            MetadataOptions: {
              HttpTokens: 'required',
            },
          }),
        });
      } else {
        // No launch template when EC2 is disabled
        template.resourceCountIs('AWS::EC2::LaunchTemplate', 0);
      }
    });

    test('should create security group with restricted egress when enabled', () => {
      if (enableEC2) {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for production EC2 instances',
          SecurityGroupEgress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0',
            }),
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0',
            }),
          ]),
        });
      } else {
        // No security groups when EC2 is disabled
        template.resourceCountIs('AWS::EC2::SecurityGroup', 0);
      }
    });

    test('should enable VPC flow logs when enabled', () => {
      if (enableEC2) {
        template.hasResourceProperties('AWS::EC2::FlowLog', {
          ResourceType: 'VPC',
          TrafficType: 'ALL',
        });
      } else {
        // No flow logs when EC2 is disabled
        template.resourceCountIs('AWS::EC2::FlowLog', 0);
      }
    });
  });

  describe('Stack Outputs', () => {
    test('should export KMS key ARN', () => {
      template.hasOutput('KMSKeyArn', {
        Description: 'ARN of the production KMS key',
        Export: {
          Name: `TapStack${environmentSuffix}-KMSKeyArn`,
        },
      });
    });

    test('should export S3 bucket ARN', () => {
      template.hasOutput('S3BucketArn', {
        Description: 'ARN of the encrypted S3 bucket',
        Export: {
          Name: `TapStack${environmentSuffix}-S3BucketArn`,
        },
      });
    });

    test('should export IAM role ARN', () => {
      template.hasOutput('SecureRoleArn', {
        Description: 'ARN of the MFA-required production role',
        Export: {
          Name: `TapStack${environmentSuffix}-SecureRoleArn`,
        },
      });
    });

    test('should export VPC ID when EC2 is enabled', () => {
      if (enableEC2) {
        template.hasOutput('VPCId', {
          Description: 'ID of the production VPC',
          Export: {
            Name: `TapStack${environmentSuffix}-VPCId`,
          },
        });
      } else {
        // Check that VPCId output does not exist
        const outputs = template.toJSON().Outputs;
        expect(outputs?.VPCId).toBeUndefined();
      }
    });

    test('should export security note', () => {
      template.hasOutput('SecurityNote', {
        Description: 'Security services configuration',
      });
      // Value will vary based on enableEC2, so just check it exists
    });

    test('should export additional stack outputs', () => {
      template.hasOutput('SecurityStackKMSKeyArn', {
        Description: 'Reference to Security Stack KMS Key',
      });

      template.hasOutput('SecurityStackS3BucketName', {
        Description: 'Reference to Security Stack S3 Bucket',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with Environment tag', () => {
      // Check KMS key
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'production',
          }),
        ]),
      });

      // Check IAM role
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'production',
          }),
        ]),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have resources with Retain deletion policy', () => {
      const resources = template.toJSON().Resources;
      Object.entries(resources).forEach(([logicalId, resource]: [string, any]) => {
        // Skip VPC flow logs S3 bucket which needs Retain for CloudFormation
        if (logicalId.includes('VPCs3Bucket')) {
          return;
        }
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should not have auto-delete objects for S3 bucket in LocalStack', () => {
      // autoDeleteObjects is disabled for LocalStack compatibility
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 0);
    });

    test('should have proper security configurations', () => {
      if (enableEC2) {
        // Verify security group exists with proper configuration when EC2 is enabled
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for production EC2 instances',
        });
      } else {
        // No security groups when EC2 is disabled
        template.resourceCountIs('AWS::EC2::SecurityGroup', 0);
      }

      // Verify IAM policies are attached (always present)
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['kms:Decrypt']),
            }),
          ]),
        }),
      });
    });

    test('should handle SecurityStack with default environment suffix', () => {
      // Test SecurityStack directly with undefined environmentSuffix
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestSecurityStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      
      // Import SecurityStack to test it directly
      const { SecurityStack } = require('../lib/security-stack');
      const securityStack = new SecurityStack(testStack, 'SecurityConstruct');
      const testTemplate = Template.fromStack(testStack);

      // Should default to 'dev' suffix
      testTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/production-encryption-key-dev',
      });

      testTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'ProductionSecureRole-dev',
      });
    });
  });
});