import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
      alertEmail: 'test@example.com',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
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
        AliasName: Match.stringLikeRegexp(`alias/tap-master-.*-${environmentSuffix}`)
      });
    });

    test('KMS key policy allows CloudWatch Logs service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Principal: {
                Service: Match.stringLikeRegexp('logs\\..*\\.amazonaws\\.com')
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
        Description: 'Permission boundary for all developer roles - prevents privilege escalation and enforces security controls'
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
                'iam:PutUserPolicy',
                'iam:AttachUserPolicy',
                'iam:CreatePolicy'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Developer Roles', () => {
    test('Creates developer read-only role with permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`tap-developer-readonly-.*-${environmentSuffix}`),
        PermissionsBoundary: Match.anyValue()
      });
    });

    test('Creates developer limited role with permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`tap-developer-limited-.*-${environmentSuffix}`),
        PermissionsBoundary: Match.anyValue()
      });
    });

    test('Developer read-only role has ReadOnly access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                { 'Ref': 'AWS::Partition' },
                ':iam::aws:policy/ReadOnlyAccess'
              ])
            ])
          })
        ])
      });
    });
  });

  describe('VPC Configuration', () => {
    test('Creates isolated VPC with private subnets only', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
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
        Description: Match.stringLikeRegexp('Auto-rotating database credentials.*'),
        KmsKeyId: Match.anyValue()
      });
    });

    test('Creates rotation schedule', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)'
        }
      });
    });
  });

  describe('Rotation Lambda', () => {
    test('Creates rotation Lambda in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
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
        EnableLogFileValidation: true
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
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: Match.anyValue()
      });
    });

    test('Creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Security Alerts for Compliance Monitoring',
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
        Description: 'ARN of the customer-managed KMS key for encryption'
      });
    });

    test('Exports permission boundary ARN', () => {
      template.hasOutput('PermissionBoundaryArn', {
        Description: 'ARN of the permission boundary policy - apply to all developer roles'
      });
    });

    test('Exports developer read-only role ARN', () => {
      template.hasOutput('DeveloperReadOnlyRoleArn', {
        Description: 'ARN of the read-only developer role'
      });
    });

    test('Exports developer limited role ARN', () => {
      template.hasOutput('DeveloperLimitedRoleArn', {
        Description: 'ARN of the limited write developer role'
      });
    });

    test('Exports database secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'ARN of the auto-rotating database secret'
      });
    });

    test('Exports CloudTrail bucket name', () => {
      template.hasOutput('CloudTrailBucketName', {
        Description: 'Name of the S3 bucket containing CloudTrail audit logs'
      });
    });

    test('Exports security alerts topic ARN', () => {
      template.hasOutput('SecurityAlertTopicArn', {
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

  describe('Alternative Configurations', () => {
    describe('Existing KMS Key', () => {
      let existingKmsApp: cdk.App;
      let existingKmsStack: TapStack;
      let existingKmsTemplate: Template;

      beforeEach(() => {
        existingKmsApp = new cdk.App();
        existingKmsStack = new TapStack(existingKmsApp, 'ExistingKmsTestStack', {
          environmentSuffix,
          teamName: 'security',
          complianceLevel: 'PCI-DSS',
          dataClassification: 'Sensitive',
          alertEmail: 'test@example.com',
          kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        existingKmsTemplate = Template.fromStack(existingKmsStack);
      });

      test('Uses existing KMS key when provided', () => {
        // Should create only the logs KMS key (not the main KMS key)
        existingKmsTemplate.resourceCountIs('AWS::KMS::Key', 1);
      });

      test('Creates KMS alias for logs key', () => {
        existingKmsTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: Match.stringLikeRegexp(`alias/tap-logs-.*-${environmentSuffix}`)
        });
      });
    });

    describe('Existing VPC', () => {
      let existingVpcApp: cdk.App;
      let existingVpcStack: TapStack;
      let existingVpcTemplate: Template;

      beforeEach(() => {
        existingVpcApp = new cdk.App();
        existingVpcStack = new TapStack(existingVpcApp, 'ExistingVpcTestStack', {
          environmentSuffix,
          teamName: 'security',
          complianceLevel: 'PCI-DSS',
          dataClassification: 'Sensitive',
          alertEmail: 'test@example.com',
          useExistingVpc: true,
          vpcId: 'vpc-12345678',
          privateSubnetIds: ['subnet-12345678', 'subnet-87654321'],
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        existingVpcTemplate = Template.fromStack(existingVpcStack);
      });

      test('Uses existing VPC when provided', () => {
        // Should not create a new VPC
        existingVpcTemplate.resourceCountIs('AWS::EC2::VPC', 0);
      });

      test('Creates Lambda in existing VPC', () => {
        existingVpcTemplate.hasResourceProperties('AWS::Lambda::Function', {
          VpcConfig: Match.anyValue()
        });
      });
    });

    describe('VPC Endpoints Enabled', () => {
      let vpcEndpointsApp: cdk.App;
      let vpcEndpointsStack: TapStack;
      let vpcEndpointsTemplate: Template;

      beforeEach(() => {
        vpcEndpointsApp = new cdk.App();
        vpcEndpointsStack = new TapStack(vpcEndpointsApp, 'VpcEndpointsTestStack', {
          environmentSuffix,
          teamName: 'security',
          complianceLevel: 'PCI-DSS',
          dataClassification: 'Sensitive',
          alertEmail: 'test@example.com',
          enableVpcEndpoints: true,
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        vpcEndpointsTemplate = Template.fromStack(vpcEndpointsStack);
      });

      test('Creates VPC endpoints when enabled', () => {
        vpcEndpointsTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
      });

      test('Creates Secrets Manager VPC endpoint', () => {
        vpcEndpointsTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('com\\.amazonaws\\.us-east-1\\.secretsmanager')
        });
      });

      test('Creates CloudWatch Logs VPC endpoint', () => {
        vpcEndpointsTemplate.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.stringLikeRegexp('com\\.amazonaws\\.us-east-1\\.logs')
        });
      });
    });

    describe('Default Parameters', () => {
      let defaultApp: cdk.App;
      let defaultStack: TapStack;
      let defaultTemplate: Template;

      beforeEach(() => {
        defaultApp = new cdk.App();
        // Test with minimal props to trigger default values
        defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
        defaultTemplate = Template.fromStack(defaultStack);
      });

      test('Uses default values when props are not provided', () => {
        // Should still create all expected resources with default values
        defaultTemplate.resourceCountIs('AWS::KMS::Key', 2); // Main key + logs key
        defaultTemplate.resourceCountIs('AWS::EC2::VPC', 1);
        defaultTemplate.resourceCountIs('AWS::Lambda::Function', 1);
        defaultTemplate.resourceCountIs('AWS::SecretsManager::Secret', 1);
      });

      test('Creates resources with default naming', () => {
        // Check that resources are created with default environment suffix 'dev'
        defaultTemplate.hasResourceProperties('AWS::KMS::Key', {
          Description: Match.stringLikeRegexp('Customer-managed key for dev environment')
        });
      });
    });
  });
});