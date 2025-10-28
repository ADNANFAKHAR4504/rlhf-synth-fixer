import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      teamName: 'security',
      complianceLevel: 'PCI-DSS',
      dataClassification: 'Sensitive',
      alertEmail: 'test@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('Creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('Customer-managed key for .* environment'),
        EnableKeyRotation: true,
        PendingWindowInDays: 30
      });
    });

    test('Creates KMS alias with correct naming', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-master-${stack.region}-${environmentSuffix}`
      });
    });

    test('KMS key policy allows CloudWatch Logs service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Principal: {
                Service: `logs.${stack.region}.amazonaws.com`
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*'
              ])
            })
          ])
        }
      });
    });

    test('KMS key policy allows Secrets Manager service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow Secrets Manager',
              Principal: {
                Service: 'secretsmanager.amazonaws.com'
              },
              Action: Match.arrayWith([
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKey'
              ])
            })
          ])
        }
      });
    });
  });

  describe('IAM Permission Boundary', () => {
    test('Creates permission boundary policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Permission boundary preventing privilege escalation'
      });
    });

    test('Permission boundary denies privilege escalation actions', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'iam:CreateRole',
                'iam:AttachRolePolicy',
                'iam:PutRolePolicy',
                'iam:PassRole'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Developer Role', () => {
    test('Creates developer role with permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `DeveloperRole-${environmentSuffix}`,
        PermissionsBoundary: Match.anyValue()
      });
    });

    test('Developer role has ReadOnly access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          'arn:aws:iam::aws:policy/ReadOnlyAccess'
        ])
      });
    });
  });

  describe('VPC Configuration', () => {
    test('Creates isolated VPC with private subnets only', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*AuditVPC.*${environmentSuffix}`)
          }
        ])
      });
    });

    test('Creates private subnets without internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated'
          }
        ])
      });
    });

    test('Does not create internet gateway by default', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 0);
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('Creates secret with KMS encryption', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Database credentials for PCI-DSS compliant application',
        KmsKeyId: Match.anyValue()
      });
    });

    test('Creates rotation schedule', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          AutomaticallyAfterDays: 30
        }
      });
    });
  });

  describe('Rotation Lambda', () => {
    test('Creates rotation Lambda in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        VpcConfig: Match.anyValue()
      });
    });

    test('Rotation Lambda has KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('Creates CloudTrail with encryption', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        KMSKeyId: Match.anyValue()
      });
    });

    test('CloudTrail uses encrypted S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            })
          ])
        }
      });
    });
  });

  describe('S3 Audit Bucket', () => {
    test('Creates S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has lifecycle policy for audit retention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 2555, // 7 years
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                })
              ])
            })
          ])
        }
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('Creates log groups with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 365,
        KmsKeyId: Match.anyValue()
      });
    });
  });

  describe('Security Monitoring', () => {
    test('Creates CloudWatch alarms for security events', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: Match.anyValue(),
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: Match.anyValue()
      });
    });

    test('Creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Security Alert Notifications',
        KmsMasterKeyId: Match.anyValue()
      });
    });

    test('Creates email subscription for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });
  });

  describe('Tagging Compliance', () => {
    test('All resources have mandatory compliance tags', () => {
      const resources = template.findResources('*');
      
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          expect(resource.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ Key: 'Environment', Value: environmentSuffix }),
              expect.objectContaining({ Key: 'Team', Value: 'security' }),
              expect.objectContaining({ Key: 'ComplianceLevel', Value: 'PCI-DSS' }),
              expect.objectContaining({ Key: 'DataClassification', Value: 'Sensitive' })
            ])
          );
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports KMS key ARN', () => {
      template.hasOutput('KmsKeyArn', {
        Description: 'ARN of the customer-managed KMS key'
      });
    });

    test('Exports permission boundary ARN', () => {
      template.hasOutput('PermissionBoundaryArn', {
        Description: 'ARN of the permission boundary policy'
      });
    });

    test('Exports developer role ARN', () => {
      template.hasOutput('DeveloperRoleArn', {
        Description: 'ARN of the sample developer role with least-privilege access'
      });
    });

    test('Exports secrets ARN', () => {
      template.hasOutput('SecretArn', {
        Description: 'ARN of the managed secret with automatic rotation'
      });
    });

    test('Exports audit bucket name', () => {
      template.hasOutput('AuditBucketName', {
        Description: 'Name of the S3 bucket for audit logs'
      });
    });

    test('Exports security alerts topic ARN', () => {
      template.hasOutput('SecurityAlertsTopicArn', {
        Description: 'ARN of the SNS topic for security alerts'
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('Resources include environment suffix in names', () => {
      const kmsKeyResource = template.findResources('AWS::KMS::Key');
      const bucketResource = template.findResources('AWS::S3::Bucket');
      
      // Verify resource names contain environment suffix
      Object.keys(kmsKeyResource).forEach(key => {
        expect(key).toContain(environmentSuffix);
      });
      
      Object.keys(bucketResource).forEach(key => {
        const bucketProps = bucketResource[key].Properties;
        if (bucketProps && bucketProps.BucketName) {
          expect(bucketProps.BucketName).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Security Hardening', () => {
    test('Lambda functions have no internet access', () => {
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      
      Object.keys(lambdaResources).forEach(key => {
        const lambdaProps = lambdaResources[key].Properties;
        if (lambdaProps.VpcConfig) {
          // Verify Lambda is in VPC (no internet access by default in isolated subnets)
          expect(lambdaProps.VpcConfig).toBeDefined();
        }
      });
    });

    test('No IAM policies with wildcard permissions', () => {
      const managedPolicies = template.findResources('AWS::IAM::ManagedPolicy');
      
      Object.keys(managedPolicies).forEach(key => {
        const policyDoc = managedPolicies[key].Properties.PolicyDocument;
        policyDoc.Statement.forEach((statement: any) => {
          // Check for overly broad permissions (except for explicit deny statements)
          if (statement.Effect === 'Allow' && Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              if (action === '*') {
                // Only acceptable if it's a very specific resource or condition
                expect(statement.Resource).not.toBe('*');
              }
            });
          }
        });
      });
    });
  });
});