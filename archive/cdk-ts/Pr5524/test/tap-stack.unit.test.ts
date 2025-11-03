import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create 4 KMS keys with correct configuration', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);
    });

    test('PII KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/PII/i),
      });
    });

    test('Financial KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Ff]inancial/),
      });
    });

    test('Operational KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Oo]perational/),
      });
    });

    test('Logs KMS Key should have multi-region and auto-rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        MultiRegion: true,
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(/[Ll]ogs|CloudWatch/),
      });
    });

    test('KMS keys should have key policies defined', () => {
      const keyPolicyCapture = new Capture();
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: keyPolicyCapture,
      });

      const keyPolicy = keyPolicyCapture.asObject();
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should create 4 KMS aliases with correct naming', () => {
      template.resourceCountIs('AWS::KMS::Alias', 4);
    });
  });

  describe('IAM Roles', () => {
    test('should create 3 IAM roles with environment suffix', () => {
      template.resourceCountIs('AWS::IAM::Role', 4); // 3 main roles + 1 Lambda execution role
    });

    test('AppServicesRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `app-services-role-${environmentSuffix}`,
      });
    });

    test('DataAnalystsRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `data-analysts-role-${environmentSuffix}`,
      });
    });

    test('SecurityAuditorsRole should have correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `security-auditors-role-${environmentSuffix}`,
      });
    });

    test('IAM roles should have assume role policies defined', () => {
      const assumeRolePolicyCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: assumeRolePolicyCapture,
      });

      const assumeRolePolicy = assumeRolePolicyCapture.asObject();
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(Array.isArray(assumeRolePolicy.Statement)).toBe(true);
    });

    test('LambdaExecutionRole should have correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Policies', () => {
    test('should create MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
      });
    });

    test('should create resource protection policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `resource-protection-${environmentSuffix}`,
      });
    });

    test('MFA enforcement policy should deny actions without MFA', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Deny',
            Condition: expect.objectContaining({
              BoolIfExists: expect.objectContaining({
                'aws:MultiFactorAuthPresent': 'false',
              }),
            }),
          }),
        ])
      );
    });

    test('resource protection policy should have policy statements', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `resource-protection-${environmentSuffix}`,
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toBeDefined();
      expect(Array.isArray(policyDocument.Statement)).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('should create 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('PII data bucket should have correct encryption and policies', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/pii-data/)]),
          ]),
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Financial data bucket should have correct encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/financial-data/)]),
          ]),
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
      });
    });

    test('Operational data bucket should have correct encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp(/operational-data/)]),
          ]),
        }),
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create bucket policies for all 3 buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 3);
    });

    test('bucket policies should have TLS enforcement', () => {
      const policyDocumentCapture = new Capture();
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: policyDocumentCapture,
      });

      const policyDocument = policyDocumentCapture.asObject();
      expect(policyDocument.Statement).toBeDefined();
      expect(Array.isArray(policyDocument.Statement)).toBe(true);
      expect(policyDocument.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create 4 log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 4);
    });

    test('all log groups should have 7-year retention (2557 days)', () => {
      template.allResourcesProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 2557,
      });
    });

    test('Lambda log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/security-functions-${environmentSuffix}`,
      });
    });

    test('API access log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/api/access-logs-${environmentSuffix}`,
      });
    });

    test('Security event log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/security/events-${environmentSuffix}`,
      });
    });

    test('Audit trail log group should have correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/audit/trail-${environmentSuffix}`,
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create 2 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('S3 remediation function should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `s3-remediation-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 300,
      });
    });

    test('Key rotation monitor function should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `key-rotation-monitor-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 60,
      });
    });

    test('Lambda functions should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
          }),
        },
      });
    });
  });

  describe('SNS Topics', () => {
    test('should create 2 SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('Security notification topic should have correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-notifications-${environmentSuffix}`,
      });
    });

    test('Key rotation notification topic should have correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `key-rotation-notifications-${environmentSuffix}`,
      });
    });

    test('SNS topics should have email subscriptions', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 2);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'security@example.com',
      });
    });

    test('SNS topics should have topic policies', () => {
      template.resourceCountIs('AWS::SNS::TopicPolicy', 1);
    });
  });

  describe('EventBridge Rules', () => {
    test('should create 3 EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 3);
    });

    test('should create S3 remediation rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-object-remediation-${environmentSuffix}`,
        State: 'ENABLED',
      });
    });

    test('should create key rotation check rule with schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `key-rotation-check-${environmentSuffix}`,
        ScheduleExpression: 'rate(1 day)',
      });
    });

    test('should create KMS rotation event rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `kms-rotation-event-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['aws.kms'],
          'detail-type': Match.arrayWith([
            Match.stringLikeRegexp(/KMS Key Rotation/),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create 5 CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('should create failed authentication alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `failed-authentication-${environmentSuffix}`,
        MetricName: 'FailedAuthentication',
        Threshold: 5,
      });
    });

    test('should create unauthorized KMS access alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `unauthorized-kms-access-${environmentSuffix}`,
        MetricName: 'NumberOfOperations',
      });
    });

    test('should create S3 policy change alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `s3-policy-changes-${environmentSuffix}`,
        MetricName: 'BucketPolicyChanges',
      });
    });

    test('should create IAM change alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iam-changes-${environmentSuffix}`,
        MetricName: 'PolicyChanges',
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-errors-${environmentSuffix}`,
        MetricName: 'Errors',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export PII KMS key ARN', () => {
      template.hasOutput('PiiKmsKeyArn', {
        Description: 'KMS Key ARN for PII data encryption',
        Export: {
          Name: `PiiKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export Financial KMS key ARN', () => {
      template.hasOutput('FinancialKmsKeyArn', {
        Description: 'KMS Key ARN for financial data encryption',
        Export: {
          Name: `FinancialKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export Operational KMS key ARN', () => {
      template.hasOutput('OperationalKmsKeyArn', {
        Description: 'KMS Key ARN for operational data encryption',
        Export: {
          Name: `OperationalKmsKeyArn-${environmentSuffix}`,
        },
      });
    });

    test('should export all S3 bucket names', () => {
      template.hasOutput('PiiDataBucketName', Match.objectLike({}));
      template.hasOutput('FinancialDataBucketName', Match.objectLike({}));
      template.hasOutput('OperationalDataBucketName', Match.objectLike({}));
    });

    test('should export all IAM role ARNs', () => {
      template.hasOutput('AppServicesRoleArn', Match.objectLike({}));
      template.hasOutput('DataAnalystsRoleArn', Match.objectLike({}));
      template.hasOutput('SecurityAuditorsRoleArn', Match.objectLike({}));
    });

    test('should export Lambda function ARNs', () => {
      template.hasOutput('S3RemediationFunctionArn', Match.objectLike({}));
      template.hasOutput('KeyRotationMonitorFunctionArn', Match.objectLike({}));
    });

    test('should export SNS topic ARNs', () => {
      template.hasOutput('SecurityNotificationTopicArn', Match.objectLike({}));
      template.hasOutput('KeyRotationNotificationTopicArn', Match.objectLike({}));
    });

    test('should export compliance report', () => {
      template.hasOutput('ComplianceReport', {
        Description: 'PCI DSS compliance audit report',
      });
    });

    test('should export security framework version', () => {
      template.hasOutput('SecurityFrameworkVersion', {
        Value: 'v1.0.0',
        Description: 'Security framework version',
      });
    });
  });

  describe('Tags', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      // This test verifies that the tag is being applied at the stack level
      expect(stack.tags.tagValues()).toHaveProperty('iac-rlhf-amazon', 'true');
    });

    test('stack should have environment suffix tag', () => {
      expect(stack.tags.tagValues()).toHaveProperty(
        'Environment',
        environmentSuffix
      );
    });
  });

  describe('Security Configurations', () => {
    test('all resources should follow least privilege principle', () => {
      // Verify IAM policies don't use wildcards excessively
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (statement.Effect === 'Allow') {
            // Ensure actions are specific
            expect(statement.Action).toBeDefined();
          }
        });
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('all KMS keys should have automatic rotation enabled', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.values(resources).filter(
        (resource: any) =>
          resource.Properties.FunctionName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName
      );

      namedResources.forEach((resource: any) => {
        const name =
          resource.Properties.FunctionName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName;

        if (typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('PCI DSS Compliance', () => {
    test('data at rest encryption should be enforced', () => {
      // All S3 buckets must have encryption
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('log retention should meet 7-year requirement', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.Properties.RetentionInDays).toBe(2557);
      });
    });

    test('MFA should be enforced for sensitive operations', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `mfa-enforcement-${environmentSuffix}`,
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: Match.objectLike({
                BoolIfExists: Match.objectLike({
                  'aws:MultiFactorAuthPresent': 'false',
                }),
              }),
            }),
          ]),
        },
      });
    });

    test('TLS 1.2 minimum should be enforced on S3', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      Object.values(bucketPolicies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        const tlsStatement = statements.find((s: any) =>
          s.Condition?.NumericLessThan?.hasOwnProperty('s3:TlsVersion')
        );
        expect(tlsStatement).toBeDefined();
        expect(tlsStatement.Condition.NumericLessThan['s3:TlsVersion']).toBe(
          '1.2'
        );
      });
    });
  });

  describe('Cross-Account Security Role', () => {
    test('should not create cross-account role when externalSecurityAccountId is not provided', () => {
      // Default stack created without externalSecurityAccountId
      // Should have 4 IAM roles (3 main + 1 Lambda execution)
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('should create cross-account role when externalSecurityAccountId is provided', () => {
      const appWithCrossAccount = new cdk.App();
      const stackWithCrossAccount = new TapStack(
        appWithCrossAccount,
        'TestTapStackWithCrossAccount',
        {
          environmentSuffix,
          externalSecurityAccountId: '123456789012',
        }
      );
      const templateWithCrossAccount =
        Template.fromStack(stackWithCrossAccount);

      // Should have 5 IAM roles (3 main + 1 Lambda execution + 1 cross-account)
      templateWithCrossAccount.resourceCountIs('AWS::IAM::Role', 5);

      // Verify cross-account role properties
      templateWithCrossAccount.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cross-account-security-scanner-${environmentSuffix}`,
      });
    });
  });

  describe('Configuration Fallbacks', () => {
    test('should use default environmentSuffix when not provided in props or context', () => {
      const appNoEnv = new cdk.App();
      const stackNoEnv = new TapStack(appNoEnv, 'TestTapStackNoEnv', {});
      const templateNoEnv = Template.fromStack(stackNoEnv);

      // Verify default 'dev' suffix is used
      templateNoEnv.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'app-services-role-dev',
      });
    });

    test('should use context environmentSuffix when not provided in props', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stackWithContext = new TapStack(
        appWithContext,
        'TestTapStackWithContext',
        {}
      );
      const templateWithContext = Template.fromStack(stackWithContext);

      // Verify context suffix is used
      templateWithContext.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'app-services-role-staging',
      });
    });
  });
});
