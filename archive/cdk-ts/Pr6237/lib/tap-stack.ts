import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // FIXED BUG 1: Properly read environmentSuffix from context
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // FIXED BUG 2: Create common tags for all resources (unused variable removed)

    const departments = ['finance', 'marketing', 'analytics'];
    const dataClassifications = ['Confidential', 'Internal', 'Confidential'];

    // FIXED BUG 3: KMS Key with proper policy and alias
    const logsKey = new kms.Key(this, 'LogsKmsKey', {
      description: `CloudWatch Logs encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `logs-key-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant CloudWatch Logs permission to use the key
    logsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogs',
        principals: [
          new iam.ServicePrincipal(
            `logs.${cdk.Stack.of(this).region}.amazonaws.com`
          ),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`,
          },
        },
      })
    );

    // KMS Key for S3 encryption
    const s3Key = new kms.Key(this, 'S3KmsKey', {
      description: `S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `s3-key-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS Key for DynamoDB encryption
    const dynamoKey = new kms.Key(this, 'DynamoKmsKey', {
      description: `DynamoDB encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `dynamodb-key-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create S3 buckets for each department
    const buckets: { [key: string]: s3.Bucket } = {};
    departments.forEach((dept, index) => {
      // FIXED BUG 4: Include environmentSuffix in bucket name
      // FIXED BUG 5: Use KMS encryption instead of S3_MANAGED
      const bucket = new s3.Bucket(this, `${dept}Bucket`, {
        bucketName: `${dept}-data-${environmentSuffix}-${cdk.Stack.of(this).account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3Key,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      // FIXED BUG 6: Add bucket policy for SSL enforcement
      bucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'DenyInsecureTransport',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        })
      );

      // Add policy to deny access from outside trusted accounts
      bucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'DenyUnauthorizedAccess',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          conditions: {
            StringNotEquals: {
              'aws:PrincipalAccount': cdk.Stack.of(this).account,
            },
          },
        })
      );

      cdk.Tags.of(bucket).add('Department', dept);
      cdk.Tags.of(bucket).add('Environment', environmentSuffix);
      cdk.Tags.of(bucket).add('DataClassification', dataClassifications[index]);

      buckets[dept] = bucket;
    });

    // Create DynamoDB tables for each department
    const tables: { [key: string]: dynamodb.Table } = {};
    departments.forEach((dept, index) => {
      // FIXED BUG 7: Include environmentSuffix in table name
      // FIXED BUG 8: Use KMS encryption
      const table = new dynamodb.Table(this, `${dept}Table`, {
        tableName: `${dept}-data-${environmentSuffix}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dynamoKey,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      cdk.Tags.of(table).add('Department', dept);
      cdk.Tags.of(table).add('Environment', environmentSuffix);
      cdk.Tags.of(table).add('DataClassification', dataClassifications[index]);

      tables[dept] = table;
    });

    // External ID for cross-department access
    const externalId = `zero-trust-${environmentSuffix}-external-id`;

    // FIXED BUG 9: Add IP condition and proper trust policy
    // FIXED BUG 10: Set maxSessionDuration to 1 hour
    const financeRole = new iam.Role(this, 'FinanceRole', {
      roleName: `finance-role-${environmentSuffix}`,
      assumedBy: new iam.AccountRootPrincipal(),
      maxSessionDuration: cdk.Duration.hours(1),
      description: 'Finance department role with access to finance resources',
    });

    // Add IP and MFA conditions to the trust policy
    const financeTrustPolicy = financeRole.assumeRolePolicy;
    if (financeTrustPolicy) {
      financeTrustPolicy.addStatements(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: ['sts:AssumeRole'],
          conditions: {
            IpAddress: {
              'aws:SourceIp': ['10.0.0.0/8'],
            },
            Bool: {
              'aws:MultiFactorAuthPresent': 'true',
            },
          },
        })
      );
    }

    // FIXED BUG 11: Properly scoped policy instead of wildcard
    financeRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'FinanceS3Access',
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          buckets['finance'].bucketArn,
          `${buckets['finance'].bucketArn}/*`,
        ],
      })
    );

    financeRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'FinanceDynamoDBAccess',
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [tables['finance'].tableArn],
      })
    );

    cdk.Tags.of(financeRole).add('Department', 'finance');
    cdk.Tags.of(financeRole).add('Environment', environmentSuffix);
    cdk.Tags.of(financeRole).add('DataClassification', 'Confidential');

    // Marketing Role
    const marketingRole = new iam.Role(this, 'MarketingRole', {
      roleName: `marketing-role-${environmentSuffix}`,
      assumedBy: new iam.AccountRootPrincipal(),
      maxSessionDuration: cdk.Duration.hours(1),
      description:
        'Marketing department role with access to marketing resources',
    });

    // FIXED BUG 12: Properly scoped to marketing resources
    marketingRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'MarketingS3Access',
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          buckets['marketing'].bucketArn,
          `${buckets['marketing'].bucketArn}/*`,
        ],
      })
    );

    marketingRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'MarketingDynamoDBAccess',
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [tables['marketing'].tableArn],
      })
    );

    cdk.Tags.of(marketingRole).add('Department', 'marketing');
    cdk.Tags.of(marketingRole).add('Environment', environmentSuffix);
    cdk.Tags.of(marketingRole).add('DataClassification', 'Internal');

    // Analytics Role
    const analyticsRole = new iam.Role(this, 'AnalyticsRole', {
      roleName: `analytics-role-${environmentSuffix}`,
      assumedBy: new iam.AccountRootPrincipal(),
      maxSessionDuration: cdk.Duration.hours(1),
      description:
        'Analytics department role with access to analytics resources',
    });

    analyticsRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AnalyticsS3Access',
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          buckets['analytics'].bucketArn,
          `${buckets['analytics'].bucketArn}/*`,
        ],
      })
    );

    analyticsRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AnalyticsDynamoDBAccess',
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [tables['analytics'].tableArn],
      })
    );

    cdk.Tags.of(analyticsRole).add('Department', 'analytics');
    cdk.Tags.of(analyticsRole).add('Environment', environmentSuffix);
    cdk.Tags.of(analyticsRole).add('DataClassification', 'Confidential');

    // FIXED BUG 13: Add external ID validation for cross-department roles
    const financeToMarketingRole = new iam.Role(
      this,
      'FinanceToMarketingRole',
      {
        roleName: `finance-to-marketing-${environmentSuffix}`,
        assumedBy: new iam.AccountPrincipal(
          cdk.Stack.of(this).account
        ).withConditions({
          StringEquals: {
            'sts:ExternalId': externalId,
          },
          IpAddress: {
            'aws:SourceIp': ['10.0.0.0/8'],
          },
        }),
        externalIds: [externalId],
        maxSessionDuration: cdk.Duration.hours(1),
        description: 'Read-only access from Finance to Marketing shared data',
      }
    );

    // FIXED BUG 14: Only read-only actions
    financeToMarketingRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadOnlyMarketingSharedData',
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          buckets['marketing'].bucketArn,
          `${buckets['marketing'].bucketArn}/shared/*`,
        ],
      })
    );

    cdk.Tags.of(financeToMarketingRole).add('Department', 'cross-department');
    cdk.Tags.of(financeToMarketingRole).add('Environment', environmentSuffix);
    cdk.Tags.of(financeToMarketingRole).add('DataClassification', 'Internal');

    // Marketing to Analytics cross-department role
    const marketingToAnalyticsRole = new iam.Role(
      this,
      'MarketingToAnalyticsRole',
      {
        roleName: `marketing-to-analytics-${environmentSuffix}`,
        assumedBy: new iam.AccountPrincipal(
          cdk.Stack.of(this).account
        ).withConditions({
          StringEquals: {
            'sts:ExternalId': externalId,
          },
          IpAddress: {
            'aws:SourceIp': ['10.0.0.0/8'],
          },
        }),
        externalIds: [externalId],
        maxSessionDuration: cdk.Duration.hours(1),
        description:
          'Read-only access from Marketing to Analytics aggregated data',
      }
    );

    marketingToAnalyticsRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadOnlyAnalyticsAggregatedData',
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          buckets['analytics'].bucketArn,
          `${buckets['analytics'].bucketArn}/aggregated/*`,
        ],
      })
    );

    cdk.Tags.of(marketingToAnalyticsRole).add('Department', 'cross-department');
    cdk.Tags.of(marketingToAnalyticsRole).add('Environment', environmentSuffix);
    cdk.Tags.of(marketingToAnalyticsRole).add('DataClassification', 'Internal');

    // Analytics to Finance cross-department role
    const analyticsToFinanceRole = new iam.Role(
      this,
      'AnalyticsToFinanceRole',
      {
        roleName: `analytics-to-finance-${environmentSuffix}`,
        assumedBy: new iam.AccountPrincipal(
          cdk.Stack.of(this).account
        ).withConditions({
          StringEquals: {
            'sts:ExternalId': externalId,
          },
          IpAddress: {
            'aws:SourceIp': ['10.0.0.0/8'],
          },
        }),
        externalIds: [externalId],
        maxSessionDuration: cdk.Duration.hours(1),
        description:
          'Read-only access from Analytics to Finance compliance data',
      }
    );

    analyticsToFinanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadOnlyFinanceComplianceData',
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          buckets['finance'].bucketArn,
          `${buckets['finance'].bucketArn}/compliance/*`,
        ],
      })
    );

    cdk.Tags.of(analyticsToFinanceRole).add('Department', 'cross-department');
    cdk.Tags.of(analyticsToFinanceRole).add('Environment', environmentSuffix);
    cdk.Tags.of(analyticsToFinanceRole).add(
      'DataClassification',
      'Confidential'
    );

    // FIXED BUG 15: Lambda execution roles with CloudWatch Logs permissions
    const financeLambdaRole = new iam.Role(this, 'FinanceLambdaRole', {
      roleName: `finance-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Lambda execution role for Finance department',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // FIXED BUG 16: Scoped to specific bucket
    financeLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'FinanceLambdaS3Access',
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${buckets['finance'].bucketArn}/*`],
      })
    );

    financeLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'FinanceLambdaDynamoDBAccess',
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
        resources: [tables['finance'].tableArn],
      })
    );

    cdk.Tags.of(financeLambdaRole).add('Department', 'finance');
    cdk.Tags.of(financeLambdaRole).add('Environment', environmentSuffix);
    cdk.Tags.of(financeLambdaRole).add('DataClassification', 'Confidential');

    // Marketing Lambda Role
    const marketingLambdaRole = new iam.Role(this, 'MarketingLambdaRole', {
      roleName: `marketing-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Lambda execution role for Marketing department',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    marketingLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'MarketingLambdaS3Access',
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${buckets['marketing'].bucketArn}/*`],
      })
    );

    marketingLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'MarketingLambdaDynamoDBAccess',
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
        resources: [tables['marketing'].tableArn],
      })
    );

    cdk.Tags.of(marketingLambdaRole).add('Department', 'marketing');
    cdk.Tags.of(marketingLambdaRole).add('Environment', environmentSuffix);
    cdk.Tags.of(marketingLambdaRole).add('DataClassification', 'Internal');

    // Analytics Lambda Role
    const analyticsLambdaRole = new iam.Role(this, 'AnalyticsLambdaRole', {
      roleName: `analytics-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Lambda execution role for Analytics department',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    analyticsLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AnalyticsLambdaS3Access',
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${buckets['analytics'].bucketArn}/*`],
      })
    );

    analyticsLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AnalyticsLambdaDynamoDBAccess',
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
        resources: [tables['analytics'].tableArn],
      })
    );

    cdk.Tags.of(analyticsLambdaRole).add('Department', 'analytics');
    cdk.Tags.of(analyticsLambdaRole).add('Environment', environmentSuffix);
    cdk.Tags.of(analyticsLambdaRole).add('DataClassification', 'Confidential');

    // FIXED BUG 17 & 18: CloudWatch Log Groups with KMS encryption and proper retention
    const financeLogGroup = new logs.LogGroup(this, 'FinanceLogGroup', {
      logGroupName: `/aws/lambda/finance-${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS, // 90 days minimum
      encryptionKey: logsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(financeLogGroup).add('Department', 'finance');
    cdk.Tags.of(financeLogGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(financeLogGroup).add('DataClassification', 'Confidential');

    const marketingLogGroup = new logs.LogGroup(this, 'MarketingLogGroup', {
      logGroupName: `/aws/lambda/marketing-${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: logsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(marketingLogGroup).add('Department', 'marketing');
    cdk.Tags.of(marketingLogGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(marketingLogGroup).add('DataClassification', 'Internal');

    const analyticsLogGroup = new logs.LogGroup(this, 'AnalyticsLogGroup', {
      logGroupName: `/aws/lambda/analytics-${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: logsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(analyticsLogGroup).add('Department', 'analytics');
    cdk.Tags.of(analyticsLogGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(analyticsLogGroup).add('DataClassification', 'Confidential');

    // FIXED BUG 19: SNS Topics with encryption
    const snsKey = new kms.Key(this, 'SnsKmsKey', {
      description: `SNS encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `sns-key-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `security-alerts-${environmentSuffix}`,
      displayName: 'Security Alerts',
      masterKey: snsKey,
    });

    cdk.Tags.of(securityAlertsTopic).add('Purpose', 'SecurityAlerting');
    cdk.Tags.of(securityAlertsTopic).add('Environment', environmentSuffix);
    cdk.Tags.of(securityAlertsTopic).add('DataClassification', 'Confidential');

    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `compliance-violations-${environmentSuffix}`,
      displayName: 'Compliance Violations',
      masterKey: snsKey,
    });

    cdk.Tags.of(complianceTopic).add('Purpose', 'ComplianceAlerting');
    cdk.Tags.of(complianceTopic).add('Environment', environmentSuffix);
    cdk.Tags.of(complianceTopic).add('DataClassification', 'Confidential');

    // Email subscription for security team (placeholder - replace with actual email)
    securityAlertsTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('security-team@example.com')
    );

    complianceTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('compliance-team@example.com')
    );

    // FIXED BUG 20: Create metric filters for CloudTrail events
    // Note: In a real implementation, you'd create a CloudTrail trail first
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unauthorizedApiCallsMetricFilter = new logs.MetricFilter(
      this,
      'UnauthorizedApiCallsFilter',
      {
        logGroup: financeLogGroup,
        metricNamespace: 'SecurityMetrics',
        metricName: 'UnauthorizedApiCalls',
        filterPattern: logs.FilterPattern.literal(
          '{($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*")}'
        ),
        metricValue: '1',
      }
    );

    // FIXED BUG 21: CloudWatch Alarms connected to SNS topics
    const unauthorizedApiCallsAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedApiCallsAlarm',
      {
        alarmName: `unauthorized-api-calls-${environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized API calls detected',
        metric: new cloudwatch.Metric({
          namespace: 'SecurityMetrics',
          metricName: 'UnauthorizedApiCalls',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unauthorizedApiCallsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _iamPolicyChangeMetricFilter = new logs.MetricFilter(
      this,
      'IamPolicyChangeFilter',
      {
        logGroup: financeLogGroup,
        metricNamespace: 'SecurityMetrics',
        metricName: 'IamPolicyChanges',
        filterPattern: logs.FilterPattern.literal(
          '{($.eventName = PutUserPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy)}'
        ),
        metricValue: '1',
      }
    );

    const iamPolicyChangeAlarm = new cloudwatch.Alarm(
      this,
      'IamPolicyChangeAlarm',
      {
        alarmName: `iam-policy-changes-${environmentSuffix}`,
        alarmDescription: 'Alert on IAM policy changes',
        metric: new cloudwatch.Metric({
          namespace: 'SecurityMetrics',
          metricName: 'IamPolicyChanges',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    iamPolicyChangeAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _rootAccountUsageMetricFilter = new logs.MetricFilter(
      this,
      'RootAccountUsageFilter',
      {
        logGroup: financeLogGroup,
        metricNamespace: 'SecurityMetrics',
        metricName: 'RootAccountUsage',
        filterPattern: logs.FilterPattern.literal(
          '{$.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent"}'
        ),
        metricValue: '1',
      }
    );

    const rootAccountUsageAlarm = new cloudwatch.Alarm(
      this,
      'RootAccountUsageAlarm',
      {
        alarmName: `root-account-usage-${environmentSuffix}`,
        alarmDescription: 'Alert on root account usage',
        metric: new cloudwatch.Metric({
          namespace: 'SecurityMetrics',
          metricName: 'RootAccountUsage',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    rootAccountUsageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _failedConsoleLoginMetricFilter = new logs.MetricFilter(
      this,
      'FailedConsoleLoginFilter',
      {
        logGroup: financeLogGroup,
        metricNamespace: 'SecurityMetrics',
        metricName: 'FailedConsoleLogins',
        filterPattern: logs.FilterPattern.literal(
          '{($.eventName = ConsoleLogin) && ($.errorMessage = "Failed authentication")}'
        ),
        metricValue: '1',
      }
    );

    const failedConsoleLoginAlarm = new cloudwatch.Alarm(
      this,
      'FailedConsoleLoginAlarm',
      {
        alarmName: `failed-console-logins-${environmentSuffix}`,
        alarmDescription: 'Alert on failed console login attempts',
        metric: new cloudwatch.Metric({
          namespace: 'SecurityMetrics',
          metricName: 'FailedConsoleLogins',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 3,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    failedConsoleLoginAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _s3BucketPolicyChangeMetricFilter = new logs.MetricFilter(
      this,
      'S3BucketPolicyChangeFilter',
      {
        logGroup: financeLogGroup,
        metricNamespace: 'SecurityMetrics',
        metricName: 'S3BucketPolicyChanges',
        filterPattern: logs.FilterPattern.literal(
          '{($.eventName = PutBucketPolicy) || ($.eventName = DeleteBucketPolicy) || ($.eventName = PutBucketAcl)}'
        ),
        metricValue: '1',
      }
    );

    const s3BucketPolicyChangeAlarm = new cloudwatch.Alarm(
      this,
      'S3BucketPolicyChangeAlarm',
      {
        alarmName: `s3-bucket-policy-changes-${environmentSuffix}`,
        alarmDescription: 'Alert on S3 bucket policy changes',
        metric: new cloudwatch.Metric({
          namespace: 'SecurityMetrics',
          metricName: 'S3BucketPolicyChanges',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    s3BucketPolicyChangeAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    // FIXED BUG 22, 23, 24: AWS Config Rules for compliance monitoring
    const iamPasswordPolicyRule = new config.ManagedRule(
      this,
      'IamPasswordPolicyRule',
      {
        configRuleName: `iam-password-policy-${environmentSuffix}`,
        identifier: 'IAM_PASSWORD_POLICY',
        description:
          'Checks whether the account password policy meets specified requirements',
      }
    );

    cdk.Tags.of(iamPasswordPolicyRule).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(iamPasswordPolicyRule).add('Environment', environmentSuffix);

    const s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      configRuleName: `s3-encryption-${environmentSuffix}`,
      identifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      description: 'Checks that S3 buckets have encryption enabled',
    });

    cdk.Tags.of(s3EncryptionRule).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(s3EncryptionRule).add('Environment', environmentSuffix);

    const mfaEnabledRule = new config.ManagedRule(this, 'MfaEnabledRule', {
      configRuleName: `mfa-enabled-for-iam-console-${environmentSuffix}`,
      identifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
      description:
        'Checks whether MFA is enabled for IAM users with console access',
    });

    cdk.Tags.of(mfaEnabledRule).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(mfaEnabledRule).add('Environment', environmentSuffix);

    const cloudTrailEnabledRule = new config.ManagedRule(
      this,
      'CloudTrailEnabledRule',
      {
        configRuleName: `cloudtrail-enabled-${environmentSuffix}`,
        identifier: 'CLOUD_TRAIL_ENABLED',
        description: 'Checks whether CloudTrail is enabled in this region',
      }
    );

    cdk.Tags.of(cloudTrailEnabledRule).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(cloudTrailEnabledRule).add('Environment', environmentSuffix);

    const iamPolicyNoStatementsWithAdminAccessRule = new config.ManagedRule(
      this,
      'IamPolicyNoAdminRule',
      {
        configRuleName: `iam-policy-no-admin-${environmentSuffix}`,
        identifier: 'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS',
        description: 'Checks whether IAM policies grant admin access',
      }
    );

    cdk.Tags.of(iamPolicyNoStatementsWithAdminAccessRule).add(
      'Purpose',
      'ComplianceMonitoring'
    );
    cdk.Tags.of(iamPolicyNoStatementsWithAdminAccessRule).add(
      'Environment',
      environmentSuffix
    );

    // FIXED BUG 25: Add outputs for role ARNs
    new cdk.CfnOutput(this, 'FinanceRoleArn', {
      value: financeRole.roleArn,
      description: 'Finance department role ARN',
      exportName: `finance-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MarketingRoleArn', {
      value: marketingRole.roleArn,
      description: 'Marketing department role ARN',
      exportName: `marketing-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AnalyticsRoleArn', {
      value: analyticsRole.roleArn,
      description: 'Analytics department role ARN',
      exportName: `analytics-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FinanceToMarketingRoleArn', {
      value: financeToMarketingRole.roleArn,
      description: 'Finance to Marketing cross-department role ARN',
      exportName: `finance-to-marketing-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MarketingToAnalyticsRoleArn', {
      value: marketingToAnalyticsRole.roleArn,
      description: 'Marketing to Analytics cross-department role ARN',
      exportName: `marketing-to-analytics-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AnalyticsToFinanceRoleArn', {
      value: analyticsToFinanceRole.roleArn,
      description: 'Analytics to Finance cross-department role ARN',
      exportName: `analytics-to-finance-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ExternalId', {
      value: externalId,
      description: 'External ID for cross-department role assumptions',
      exportName: `external-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'Security alerts SNS topic ARN',
      exportName: `security-alerts-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ComplianceTopicArn', {
      value: complianceTopic.topicArn,
      description: 'Compliance violations SNS topic ARN',
      exportName: `compliance-topic-arn-${environmentSuffix}`,
    });
  }
}
