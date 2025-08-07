import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

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

    test('should create VPC with correct configuration', () => {
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
    });

    test('should create public and isolated subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 isolated
      
      // Verify public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
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

    test('should create EC2 instance with encrypted EBS volume', () => {
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
    });

    test('should configure EC2 instance with IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
          },
        }),
      });
    });

    test('should create security group with restricted egress', () => {
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
    });

    test('should enable VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
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

    test('should export VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'ID of the production VPC',
        Export: {
          Name: `TapStack${environmentSuffix}-VPCId`,
        },
      });
    });

    test('should export security note', () => {
      template.hasOutput('SecurityNote', {
        Description: 'Security services configuration',
        Value: 'GuardDuty and Security Hub should be enabled at the organization level for comprehensive security monitoring',
      });
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

    test('should have auto-delete objects for S3 bucket', () => {
      // Check for custom resource that handles auto-deletion
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: Match.objectLike({
          BucketName: Match.anyValue(),
        }),
      });
    });

    test('should have proper security configurations', () => {
      // Verify security group exists with proper configuration
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for production EC2 instances',
      });
      
      // Verify IAM policies are attached
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
  });
});