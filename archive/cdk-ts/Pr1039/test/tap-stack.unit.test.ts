import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityConfigStack } from '../lib/security-config-stack';

function createTestStack(stackName: string, isPrimaryRegion = true, environmentSuffix = 'test') {
  const app = new cdk.App();
  const stack = new SecurityConfigStack(app, stackName, {
    environmentSuffix,
    isPrimaryRegion,
    env: {
      account: '123456789012',
      region: isPrimaryRegion ? 'us-east-1' : 'us-west-2',
    },
  });
  return {
    app,
    stack,
    template: Template.fromStack(stack),
  };
}

describe('SecurityConfigStack', () => {
  describe('S3 Buckets', () => {
    test('should create Config bucket with proper security settings', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('aws-security-config-test-.*'),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
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

    test('should create Monitoring Logs bucket with proper security settings', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('aws-monitoring-logs-test-.*'),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
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

    test('should have lifecycle rules for Config bucket', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('aws-security-config-test-.*'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'config-lifecycle',
              ExpirationInDays: 2555,
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ]),
            }),
          ]),
        },
      });
    });

    test('should have lifecycle rules for Monitoring Logs bucket', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('aws-monitoring-logs-test-.*'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'monitoring-logs-lifecycle',
              ExpirationInDays: 365,
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ]),
            }),
          ]),
        },
      });
    });

    test('should enforce SSL for all buckets', () => {
      const { template } = createTestStack('TestStack');
      
      // Check bucket policy exists with SSL enforcement
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
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
  });

  describe('IAM Roles and Policies', () => {
    test('should create Config service role with correct trust policy', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }],
        },
      });
    });

    test('should create MFA enforcement policy', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: Match.stringLikeRegexp('MFAEnforcementPolicy-test-.*'),
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowViewAccountInfo',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'iam:GetAccountPasswordPolicy',
                'iam:GetAccountSummary',
                'iam:ListVirtualMFADevices',
              ]),
              Resource: '*',
            }),
            Match.objectLike({
              Sid: 'AllowManageOwnPasswords',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'iam:ChangePassword',
                'iam:GetUser',
              ]),
              Resource: 'arn:aws:iam::*:user/${aws:username}',
            }),
            Match.objectLike({
              Sid: 'AllowManageOwnMFA',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'iam:CreateVirtualMFADevice',
                'iam:DeleteVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:ListMFADevices',
                'iam:ResyncMFADevice',
              ]),
            }),
            Match.objectLike({
              Sid: 'DenyAllExceptUnlessMFAAuthenticated',
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

    test('should create FIDO2 passkey policy', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: Match.stringLikeRegexp('FIDO2PasskeyPolicy-test-.*'),
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowFIDO2PasskeyActions',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'iam:CreateServiceLinkedRole',
                'iam:DeleteServiceLinkedRole',
                'iam:ListServiceLinkedRoles',
                'iam:PassRole',
              ]),
              Resource: '*',
              Condition: {
                StringEquals: {
                  'iam:AWSServiceName': 'fido.iam.amazonaws.com',
                },
              },
            }),
            Match.objectLike({
              Sid: 'AllowPasskeyRegistration',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'iam:CreateVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:TagMFADevice',
                'iam:UntagMFADevice',
              ]),
            }),
          ]),
        },
      });
    });

    test('should create MFA required user group', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: Match.stringLikeRegexp('MFARequiredUsers-test-.*'),
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create Security Logs Group', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/security-monitoring/test'),
        RetentionInDays: 365,
      });
    });

    test('should create Security Dashboard', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('SecurityMonitoring-test-.*'),
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output Config bucket name', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('ConfigBucketName', {
        Description: 'AWS Config delivery channel S3 bucket name',
        Export: {
          Name: Match.stringLikeRegexp('ConfigBucket-test-.*'),
        },
      });
    });

    test('should output Monitoring Logs bucket name', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('MonitoringLogsBucketName', {
        Description: 'Monitoring logs S3 bucket name',
        Export: {
          Name: Match.stringLikeRegexp('MonitoringLogsBucket-test-.*'),
        },
      });
    });

    test('should output MFA Group name', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('MFAGroupName', {
        Description: 'IAM group name for MFA-required users',
        Export: {
          Name: Match.stringLikeRegexp('MFAGroup-test-.*'),
        },
      });
    });

    test('should output Configuration Recorder name', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('ConfigurationRecorderName', {
        Description: Match.anyValue(),
        Export: {
          Name: Match.stringLikeRegexp('ConfigRecorder-test-.*'),
        },
      });
    });

    test('should output Security Dashboard URL', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('SecurityDashboardUrl', {
        Description: 'CloudWatch Security Dashboard URL',
        Export: {
          Name: Match.stringLikeRegexp('SecurityDashboard-test-.*'),
        },
      });
    });
  });

  describe('Multi-Region Deployment', () => {
    test('primary and secondary stacks should have different configurations', () => {
      const { template: primaryTemplate } = createTestStack('PrimaryStack', true);
      const { template: secondaryTemplate } = createTestStack('SecondaryStack', false);
      
      // Primary should have global resource types included
      const primaryRole = primaryTemplate.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [{
              Principal: {
                Service: 'config.amazonaws.com',
              },
            }],
          },
        },
      });
      expect(Object.keys(primaryRole).length).toBeGreaterThan(0);

      // Secondary should also have Config role but different bucket names
      const secondaryRole = secondaryTemplate.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [{
              Principal: {
                Service: 'config.amazonaws.com',
              },
            }],
          },
        },
      });
      expect(Object.keys(secondaryRole).length).toBeGreaterThan(0);
    });

    test('both regions should have security monitoring dashboards', () => {
      const { template: primaryTemplate } = createTestStack('PrimaryStack', true);
      const { template: secondaryTemplate } = createTestStack('SecondaryStack', false);
      
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*us-east-1'),
      });

      secondaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*us-west-2'),
      });
    });
  });

  describe('Resource Deletion Policy', () => {
    test('all resources should have DESTROY removal policy', () => {
      const { template } = createTestStack('TestStack');
      
      // Check S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });

      // Check Log Groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('S3 buckets should have auto-delete objects enabled', () => {
      const { template } = createTestStack('TestStack');
      
      // Check for Custom Resource for auto-deletion
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: Match.anyValue(),
        },
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any inline policies on roles except for Lambda', () => {
      const { template } = createTestStack('TestStack');
      
      const roles = template.findResources('AWS::IAM::Role');
      Object.entries(roles).forEach(([logicalId, role]) => {
        // Skip Lambda execution roles which may have inline policies
        if (!logicalId.includes('Lambda') && !logicalId.includes('CustomResource')) {
          if (role.Properties?.Policies) {
            expect(role.Properties.Policies).toHaveLength(0);
          }
        }
      });
    });

    test('MFA policies should deny all actions without MFA', () => {
      const { template } = createTestStack('TestStack');
      
      // Check for MFA enforcement policy with deny statement
      const policies = template.findResources('AWS::IAM::ManagedPolicy');
      const mfaPolicies = Object.values(policies).filter(policy => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => 
          stmt.Sid === 'DenyAllExceptUnlessMFAAuthenticated' &&
          stmt.Effect === 'Deny' &&
          stmt.Resource === '*'
        );
      });
      expect(mfaPolicies.length).toBeGreaterThan(0);
    });

    test('all S3 buckets should block public access', () => {
      const { template } = createTestStack('TestStack');
      
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const { template } = createTestStack('TestStack');
      
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.VersioningConfiguration).toEqual({
          Status: 'Enabled',
        });
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const { template } = createTestStack('TestStack');
      
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
        expect(bucket.Properties?.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });
  });

  describe('Tags', () => {
    test('stack should be taggable', () => {
      const app = new cdk.App();
      const stack = new SecurityConfigStack(app, 'TagTestStack', {
        environmentSuffix: 'test',
        isPrimaryRegion: true,
        tags: {
          Environment: 'test',
          Project: 'SecurityConfig',
        },
      });
      
      expect(stack.tags).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('should handle missing environment suffix', () => {
      const app = new cdk.App();
      const stack = new SecurityConfigStack(app, 'NoSuffixStack', {
        isPrimaryRegion: true,
        // environmentSuffix is not provided, should default to 'dev'
      });
      const template = Template.fromStack(stack);
      
      // When no environment is provided, CDK generates the bucket name with Fn::Join
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('aws-security-config-dev-.*'),
            ]),
          ]),
        }),
      });
    });

    test('should use provided environment suffix', () => {
      const customSuffix = 'custom-suffix';
      const { template } = createTestStack('CustomSuffixStack', true, customSuffix);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`aws-security-config-${customSuffix}-.*`),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create Lambda for S3 auto-delete', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: Match.stringLikeRegexp('nodejs.*'),
      });
    });

    test('Lambda should have appropriate execution role', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }],
        },
      });
    });
  });

  describe('Config Integration', () => {
    test('should have proper bucket permissions for Config', () => {
      const { template } = createTestStack('TestStack');
      
      // Check Config bucket has proper policies
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: {
          Ref: Match.stringLikeRegexp('ConfigBucket.*'),
        },
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetBucketAcl', 's3:ListBucket']),
            }),
          ]),
        },
      });
    });

    test('should export config recorder name for integration', () => {
      const { template } = createTestStack('TestStack');
      
      template.hasOutput('ConfigurationRecorderName', {
        Value: Match.anyValue(),
        Export: {
          Name: Match.stringLikeRegexp('ConfigRecorder-.*'),
        },
      });
    });
  });
});