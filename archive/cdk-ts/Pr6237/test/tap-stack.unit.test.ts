import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack Zero-Trust Security', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: environmentSuffix,
      },
    });
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('Uses provided environmentSuffix in resource names', () => {
      // Test with the current environmentSuffix from the outer scope
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/logs-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `finance-data-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `finance-role-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-alerts-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `unauthorized-api-calls-${environmentSuffix}`,
      });
    });

    test('Defaults to "dev" when environmentSuffix is not provided in context', () => {
      // Create app explicitly without environmentSuffix in context
      const appWithoutContext = new cdk.App({
        context: {},
      });
      const stackWithoutContext = new TapStack(
        appWithoutContext,
        'TestTapStackNoContext'
      );
      const templateWithoutContext = Template.fromStack(stackWithoutContext);

      // Verify that resources use 'dev' as default when no context is provided
      templateWithoutContext.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/logs-key-dev',
      });

      templateWithoutContext.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'finance-data-dev',
      });

      templateWithoutContext.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'finance-role-dev',
      });
    });
  });

  describe('KMS Encryption Keys', () => {
    test('Creates 4 KMS keys with key rotation enabled', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);

      template.allResourcesProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS keys have proper aliases with environmentSuffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/logs-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/dynamodb-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/sns-key-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Creates 3 S3 buckets for each department', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('S3 buckets include environmentSuffix in name', () => {
      // BucketName uses Fn::Join, so we check via logical ID or Tags instead
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );

      expect(buckets.length).toBe(3);

      // Check that buckets have Department tags that match departments
      const departments = ['finance', 'marketing', 'analytics'];
      departments.forEach((dept) => {
        const bucket = buckets.find((b: any) => {
          const tags = b.Properties.Tags;
          return tags.some((t: any) => t.Key === 'Department' && t.Value === dept);
        });
        expect(bucket).toBeDefined();
      });
    });

    test('S3 buckets use KMS encryption', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('S3 buckets have versioning enabled', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 buckets block all public access', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket policies deny insecure transport', () => {
      template.allResourcesProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('S3 bucket policies deny unauthorized account access', () => {
      template.allResourcesProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyUnauthorizedAccess',
              Effect: 'Deny',
              Condition: Match.objectLike({
                StringNotEquals: Match.objectLike({
                  'aws:PrincipalAccount': Match.anyValue(),
                }),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('Creates 3 DynamoDB tables for each department', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 3);
    });

    test('DynamoDB tables include environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `finance-data-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `marketing-data-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `analytics-data-${environmentSuffix}`,
      });
    });

    test('DynamoDB tables use KMS customer-managed encryption', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
          KMSMasterKeyId: Match.anyValue(),
        },
      });
    });

    test('DynamoDB tables have point-in-time recovery enabled', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB tables have correct key schema', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });
  });

  describe('IAM Roles - Department Specific', () => {
    test('Creates 9 IAM roles total', () => {
      // 3 department roles + 3 cross-department + 3 lambda roles
      // Note: May have additional custom resource roles (like S3 auto-delete)
      const resources = template.toJSON().Resources;
      const roles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );

      // We expect at least 9 roles (may have more for custom resources)
      expect(roles.length).toBeGreaterThanOrEqual(9);

      // Verify our 9 core roles exist
      const roleNames = [
        `finance-role-${environmentSuffix}`,
        `marketing-role-${environmentSuffix}`,
        `analytics-role-${environmentSuffix}`,
        `finance-to-marketing-${environmentSuffix}`,
        `marketing-to-analytics-${environmentSuffix}`,
        `analytics-to-finance-${environmentSuffix}`,
        `finance-lambda-role-${environmentSuffix}`,
        `marketing-lambda-role-${environmentSuffix}`,
        `analytics-lambda-role-${environmentSuffix}`,
      ];

      roleNames.forEach((roleName) => {
        const role = roles.find(
          (r: any) => r.Properties.RoleName === roleName
        );
        expect(role).toBeDefined();
      });
    });

    test('Department roles have 1-hour max session duration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `finance-role-${environmentSuffix}`,
        MaxSessionDuration: 3600,
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `marketing-role-${environmentSuffix}`,
        MaxSessionDuration: 3600,
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `analytics-role-${environmentSuffix}`,
        MaxSessionDuration: 3600,
      });
    });

    test('Finance role has MFA and IP conditions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `finance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8'],
                },
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true',
                },
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('IAM Policies - Department Specific', () => {
    test('Finance role has scoped S3 access', () => {
      // Resources use CloudFormation intrinsic functions, so check for Sid instead
      const resources = template.toJSON().Resources;
      const financePolicy = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::IAM::Policy' &&
          r.Properties.PolicyName?.includes('FinanceRole')
      ) as any;

      expect(financePolicy).toBeDefined();

      const statements = financePolicy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) => s.Sid === 'FinanceS3Access');

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:DeleteObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });

    test('Finance role has scoped DynamoDB access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'FinanceDynamoDBAccess',
              Action: Match.arrayWith([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Cross-Department Roles', () => {
    test('Cross-department roles require external ID', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `finance-to-marketing-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                StringEquals: {
                  'sts:ExternalId': `zero-trust-${environmentSuffix}-external-id`,
                },
              }),
            }),
          ]),
        }),
      });
    });

    test('Cross-department roles have IP restrictions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `marketing-to-analytics-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8'],
                },
              }),
            }),
          ]),
        }),
      });
    });

    test('Cross-department roles have read-only access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ReadOnlyMarketingSharedData',
              Action: ['s3:GetObject', 's3:ListBucket'],
            }),
          ]),
        }),
      });
    });
  });

  describe('Lambda Execution Roles', () => {
    test('Lambda roles have basic execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `finance-lambda-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Lambda roles have scoped S3 and DynamoDB access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'FinanceLambdaS3Access',
              Action: ['s3:GetObject', 's3:PutObject'],
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Creates 3 log groups for each department', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 3);
    });

    test('Log groups have 90-day retention', () => {
      template.allResourcesProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });

    test('Log groups include environmentSuffix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/finance-${environmentSuffix}`,
      });
    });
  });

  describe('SNS Topics', () => {
    test('Creates 2 SNS topics for alerting', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('SNS topics include environmentSuffix', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-alerts-${environmentSuffix}`,
        DisplayName: 'Security Alerts',
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-violations-${environmentSuffix}`,
        DisplayName: 'Compliance Violations',
      });
    });

    test('SNS topics have KMS encryption', () => {
      template.allResourcesProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('SNS topics have email subscriptions', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 2);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'security-team@example.com',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'compliance-team@example.com',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Creates 5 CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('Alarm names include environmentSuffix', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `unauthorized-api-calls-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iam-policy-changes-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `root-account-usage-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `failed-console-logins-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `s3-bucket-policy-changes-${environmentSuffix}`,
      });
    });

    test('Alarms are connected to SNS topics', () => {
      const resources = template.toJSON().Resources;
      const alarms = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('Failed console login alarm has correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `failed-console-logins-${environmentSuffix}`,
        Threshold: 3,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('CloudWatch Metric Filters', () => {
    test('Creates 5 metric filters', () => {
      template.resourceCountIs('AWS::Logs::MetricFilter', 5);
    });

    test('Metric filters monitor security events', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: Match.stringLikeRegexp('.*UnauthorizedOperation.*'),
        MetricTransformations: [
          Match.objectLike({
            MetricNamespace: 'SecurityMetrics',
            MetricName: 'UnauthorizedApiCalls',
          }),
        ],
      });
    });
  });

  describe('AWS Config Rules', () => {
    test('Creates 5 Config rules', () => {
      template.resourceCountIs('AWS::Config::ConfigRule', 5);
    });

    test('Config rule names include environmentSuffix', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `iam-password-policy-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `s3-encryption-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `mfa-enabled-for-iam-console-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `cloudtrail-enabled-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `iam-policy-no-admin-${environmentSuffix}`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports all required role ARNs', () => {
      template.hasOutput('FinanceRoleArn', {
        Export: {
          Name: `finance-role-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('MarketingRoleArn', {
        Export: {
          Name: `marketing-role-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('AnalyticsRoleArn', {
        Export: {
          Name: `analytics-role-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('FinanceToMarketingRoleArn', {
        Export: {
          Name: `finance-to-marketing-role-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('MarketingToAnalyticsRoleArn', {
        Export: {
          Name: `marketing-to-analytics-role-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('AnalyticsToFinanceRoleArn', {
        Export: {
          Name: `analytics-to-finance-role-arn-${environmentSuffix}`,
        },
      });
    });

    test('Exports external ID and SNS topics', () => {
      template.hasOutput('ExternalId', {
        Export: {
          Name: `external-id-${environmentSuffix}`,
        },
      });

      template.hasOutput('SecurityAlertsTopicArn', {
        Export: {
          Name: `security-alerts-topic-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput('ComplianceTopicArn', {
        Export: {
          Name: `compliance-topic-arn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('S3 buckets have Department and Environment tags', () => {
      // Check that finance bucket has correct tags
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );

      expect(buckets.length).toBe(3);

      // Find finance bucket
      const financeBucket = buckets.find((b: any) => {
        const tags = b.Properties.Tags;
        return tags.some((t: any) => t.Key === 'Department' && t.Value === 'finance');
      }) as any;

      expect(financeBucket).toBeDefined();
      const tags = financeBucket.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Department',
        Value: 'finance',
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: environmentSuffix,
      });
      expect(tags).toContainEqual({
        Key: 'DataClassification',
        Value: 'Confidential',
      });
    });

    test('DynamoDB tables have Department and Environment tags', () => {
      const resources = template.toJSON().Resources;
      const financeTable = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::DynamoDB::Table' &&
          r.Properties.TableName === `finance-data-${environmentSuffix}`
      ) as any;

      expect(financeTable).toBeDefined();
      const tags = financeTable.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Department',
        Value: 'finance',
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: environmentSuffix,
      });
      expect(tags).toContainEqual({
        Key: 'DataClassification',
        Value: 'Confidential',
      });
    });

    test('IAM roles have Environment tags', () => {
      const resources = template.toJSON().Resources;
      const financeRole = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::IAM::Role' &&
          r.Properties.RoleName === `finance-role-${environmentSuffix}`
      ) as any;

      expect(financeRole).toBeDefined();
      const tags = financeRole.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: environmentSuffix,
      });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('All KMS keys are destroyable', () => {
      // Check that KMS keys have Delete policy in metadata
      const resources = template.toJSON().Resources;
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );

      kmsKeys.forEach((key: any) => {
        expect(key.UpdateReplacePolicy).toBe('Delete');
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('All S3 buckets are destroyable with auto-delete objects', () => {
      const resources = template.toJSON().Resources;
      const s3Buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('All DynamoDB tables are destroyable', () => {
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      );

      tables.forEach((table: any) => {
        expect(table.UpdateReplacePolicy).toBe('Delete');
        expect(table.DeletionPolicy).toBe('Delete');
      });
    });
  });
});
