import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

/**
 * IAM Security Monitoring and Remediation Stack
 *
 * Implements automated IAM security monitoring with:
 * - Real-time policy analysis via Lambda functions
 * - KMS encryption with automatic key rotation
 * - CloudWatch logging with 90-day retention
 * - EventBridge rules for IAM policy changes
 * - CloudWatch alarms for unusual activity
 * - SNS notifications for security alerts
 * - Daily scheduled audits
 * - Cross-account audit roles
 * - Compliance tagging
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = this.region;
    const account = this.account;

    // Resource naming with environment suffix and region
    const resourcePrefix = `iam-security-${environmentSuffix}-${region}`;

    // ==========================================
    // 1. KMS ENCRYPTION KEYS
    // ==========================================

    const logEncryptionKey = new kms.Key(this, 'LogEncryptionKey', {
      description: `KMS key for encrypting security audit logs (${environmentSuffix})`,
      enableKeyRotation: true, // Automatic key rotation enabled per requirement
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      alias: `alias/${resourcePrefix}-logs`,
      policy: new iam.PolicyDocument({
        statements: [
          // Root account access
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // CloudWatch Logs service access (restricted to specific service only)
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${region}.amazonaws.com`),
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
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${account}:*`,
              },
            },
          }),
          // Lambda service access (restricted to specific service only)
          new iam.PolicyStatement({
            sid: 'Allow Lambda Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `lambda.${region}.amazonaws.com`,
              },
            },
          }),
          // Explicit deny for key deletion
          new iam.PolicyStatement({
            sid: 'Deny Key Deletion',
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: [
              'kms:ScheduleKeyDeletion',
              'kms:Delete*',
              'kms:DisableKey',
            ],
            resources: ['*'],
            conditions: {
              StringNotEquals: {
                'aws:PrincipalArn': `arn:aws:iam::${account}:root`,
              },
            },
          }),
        ],
      }),
    });

    // ==========================================
    // 2. CLOUDWATCH LOG GROUPS
    // ==========================================

    const securityLogGroup = new logs.LogGroup(this, 'SecurityAuditLogGroup', {
      logGroupName: `/aws/security/${resourcePrefix}-audit`,
      retention: logs.RetentionDays.THREE_MONTHS, // 90-day retention per requirement
      encryptionKey: logEncryptionKey, // KMS encryption with customer-managed key
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const policyAnalyzerLogGroup = new logs.LogGroup(
      this,
      'PolicyAnalyzerLogGroup',
      {
        logGroupName: `/aws/lambda/${resourcePrefix}-policy-analyzer`,
        retention: logs.RetentionDays.THREE_MONTHS,
        encryptionKey: logEncryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const dailyAuditorLogGroup = new logs.LogGroup(
      this,
      'DailyAuditorLogGroup',
      {
        logGroupName: `/aws/lambda/${resourcePrefix}-daily-auditor`,
        retention: logs.RetentionDays.THREE_MONTHS,
        encryptionKey: logEncryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // ==========================================
    // 3. SNS TOPIC FOR SECURITY ALERTS
    // ==========================================

    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `${resourcePrefix}-alerts`,
      displayName: `IAM Security Alerts (${environmentSuffix})`,
      masterKey: logEncryptionKey,
    });

    // Note: Email subscription can be added manually via AWS Console or CLI
    // to avoid hardcoding email addresses in the code

    // ==========================================
    // 4. DEAD LETTER QUEUES
    // ==========================================

    const eventDLQ = new sqs.Queue(this, 'EventProcessingDLQ', {
      queueName: `${resourcePrefix}-event-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: logEncryptionKey,
    });

    // ==========================================
    // 5. IAM ROLES WITH SESSION POLICIES
    // ==========================================

    // Lambda execution role with explicit deny statements for sensitive actions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${resourcePrefix}-lambda-execution`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Execution role for IAM policy analyzer Lambda (${environmentSuffix})`,
      maxSessionDuration: cdk.Duration.hours(1), // Restrict session duration
      inlinePolicies: {
        IAMPolicyAnalysis: new iam.PolicyDocument({
          statements: [
            // Allow reading IAM policies
            new iam.PolicyStatement({
              sid: 'AllowIAMReadAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:GetPolicy',
                'iam:GetPolicyVersion',
                'iam:ListPolicies',
                'iam:ListPolicyVersions',
                'iam:GetRole',
                'iam:ListRoles',
                'iam:GetUser',
                'iam:ListUsers',
                'iam:GetGroup',
                'iam:ListGroups',
                'iam:ListAttachedRolePolicies',
                'iam:ListAttachedUserPolicies',
                'iam:ListAttachedGroupPolicies',
                'iam:ListRolePolicies',
                'iam:ListUserPolicies',
                'iam:ListGroupPolicies',
              ],
              resources: ['*'],
            }),
            // Allow writing to CloudWatch Logs
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchLogsWrite',
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              resources: [
                securityLogGroup.logGroupArn,
                `${securityLogGroup.logGroupArn}:*`,
                policyAnalyzerLogGroup.logGroupArn,
                `${policyAnalyzerLogGroup.logGroupArn}:*`,
                dailyAuditorLogGroup.logGroupArn,
                `${dailyAuditorLogGroup.logGroupArn}:*`,
              ],
            }),
            // Allow publishing to SNS
            new iam.PolicyStatement({
              sid: 'AllowSNSPublish',
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [securityAlertsTopic.topicArn],
            }),
            // Allow CloudWatch metrics
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchMetrics',
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'IAMSecurity',
                },
              },
            }),
            // Explicit deny for sensitive actions (per requirement)
            new iam.PolicyStatement({
              sid: 'DenySensitiveActions',
              effect: iam.Effect.DENY,
              actions: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                'iam:DeleteGroup',
                'iam:DeletePolicy',
                'iam:CreateAccessKey',
                'iam:DeleteAccessKey',
                'iam:PutUserPolicy',
                'iam:PutRolePolicy',
                'iam:PutGroupPolicy',
                'iam:AttachUserPolicy',
                'iam:AttachRolePolicy',
                'iam:AttachGroupPolicy',
                'iam:DetachUserPolicy',
                'iam:DetachRolePolicy',
                'iam:DetachGroupPolicy',
                'iam:CreatePolicy',
                'iam:CreatePolicyVersion',
                'kms:Delete*',
                'kms:ScheduleKeyDeletion',
                'kms:DisableKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==========================================
    // 6. LAMBDA FUNCTIONS (Node.js 22)
    // ==========================================

    // Real-time IAM Policy Analyzer Lambda
    const policyAnalyzerLambda = new NodejsFunction(
      this,
      'PolicyAnalyzerLambda',
      {
        functionName: `${resourcePrefix}-policy-analyzer`,
        runtime: lambda.Runtime.NODEJS_22_X, // Node.js 22 per requirement
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'policy-analyzer.ts'),
        timeout: cdk.Duration.seconds(60), // 60 seconds or less per constraint
        memorySize: 512,
        role: lambdaExecutionRole,
        logGroup: policyAnalyzerLogGroup,
        environment: {
          SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
          LOG_GROUP_NAME: securityLogGroup.logGroupName,
          ENVIRONMENT: environmentSuffix,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node22',
          externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
        },
      }
    );

    // Daily Scheduled Audit Lambda
    const dailyAuditorLambda = new NodejsFunction(this, 'DailyAuditorLambda', {
      functionName: `${resourcePrefix}-daily-auditor`,
      runtime: lambda.Runtime.NODEJS_22_X, // Node.js 22 per requirement
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 'daily-auditor.ts'),
      timeout: cdk.Duration.seconds(60), // 60 seconds or less per constraint
      memorySize: 1024,
      role: lambdaExecutionRole,
      logGroup: dailyAuditorLogGroup,
      environment: {
        SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
        LOG_GROUP_NAME: securityLogGroup.logGroupName,
        ENVIRONMENT: environmentSuffix,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
      },
    });

    // ==========================================
    // 7. EVENTBRIDGE RULES WITH DLQ
    // ==========================================

    // Rule for IAM policy creation/modification
    const iamPolicyChangeRule = new events.Rule(this, 'IAMPolicyChangeRule', {
      ruleName: `${resourcePrefix}-policy-changes`,
      description: `Triggers on IAM policy creation or modification (${environmentSuffix})`,
      eventPattern: {
        source: ['aws.iam'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['iam.amazonaws.com'],
          eventName: [
            'CreatePolicy',
            'CreatePolicyVersion',
            'PutUserPolicy',
            'PutRolePolicy',
            'PutGroupPolicy',
            'AttachUserPolicy',
            'AttachRolePolicy',
            'AttachGroupPolicy',
          ],
        },
      },
    });

    // Add Lambda target with DLQ (per requirement)
    iamPolicyChangeRule.addTarget(
      new targets.LambdaFunction(policyAnalyzerLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // Scheduled rule for daily audit
    const dailyAuditRule = new events.Rule(this, 'DailyAuditRule', {
      ruleName: `${resourcePrefix}-daily-audit`,
      description: `Triggers daily IAM policy audit (${environmentSuffix})`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // Run at 2 AM UTC daily
      }),
    });

    dailyAuditRule.addTarget(
      new targets.LambdaFunction(dailyAuditorLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // ==========================================
    // 8. CLOUDWATCH ALARMS
    // ==========================================

    // Metric for IAM policy changes (more than 5 changes in 10 minutes per requirement)
    const iamPolicyChangeMetric = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'Invocations',
      dimensionsMap: {
        RuleName: iamPolicyChangeRule.ruleName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(10),
    });

    // Alarm for unusual IAM activity (per requirement: >5 policy changes in 10 minutes)
    const unusualActivityAlarm = new cloudwatch.Alarm(
      this,
      'UnusualIAMActivityAlarm',
      {
        alarmName: `${resourcePrefix}-unusual-activity`,
        alarmDescription: `Triggers when more than 5 IAM policy changes occur in 10 minutes (${environmentSuffix})`,
        metric: iamPolicyChangeMetric,
        threshold: 5,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // Add SNS action to alarm
    unusualActivityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Lambda error alarm
    const policyAnalyzerErrorMetric = policyAnalyzerLambda.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: cloudwatch.Stats.SUM,
    });

    const policyAnalyzerErrorAlarm = new cloudwatch.Alarm(
      this,
      'PolicyAnalyzerErrorAlarm',
      {
        alarmName: `${resourcePrefix}-policy-analyzer-errors`,
        alarmDescription: `Triggers when policy analyzer Lambda errors occur (${environmentSuffix})`,
        metric: policyAnalyzerErrorMetric,
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    policyAnalyzerErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Daily auditor error alarm
    const dailyAuditorErrorMetric = dailyAuditorLambda.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: cloudwatch.Stats.SUM,
    });

    const dailyAuditorErrorAlarm = new cloudwatch.Alarm(
      this,
      'DailyAuditorErrorAlarm',
      {
        alarmName: `${resourcePrefix}-daily-auditor-errors`,
        alarmDescription: `Triggers when daily auditor Lambda errors occur (${environmentSuffix})`,
        metric: dailyAuditorErrorMetric,
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    dailyAuditorErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // ==========================================
    // 9. CROSS-ACCOUNT AUDIT ROLE
    // ==========================================

    // Cross-account role for security auditing (per requirement)
    // Note: The external account ID should be provided via context or parameter
    // For now, we create the role but leave it assumable only from the same account
    // Users can update the trust policy after deployment
    const crossAccountAuditRole = new iam.Role(this, 'CrossAccountAuditRole', {
      roleName: `${resourcePrefix}-cross-account-audit`,
      assumedBy: new iam.AccountPrincipal(account), // Default to same account, can be updated
      externalIds: [`iam-security-audit-${environmentSuffix}`], // External ID validation per requirement
      description: `Cross-account role for security auditing (${environmentSuffix})`,
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        AuditPolicy: new iam.PolicyDocument({
          statements: [
            // Read-only access to IAM
            new iam.PolicyStatement({
              sid: 'AllowIAMReadOnlyAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:Get*',
                'iam:List*',
                'iam:GenerateCredentialReport',
                'iam:GenerateServiceLastAccessedDetails',
                'iam:SimulateCustomPolicy',
                'iam:SimulatePrincipalPolicy',
              ],
              resources: ['*'],
            }),
            // Read CloudWatch Logs
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchLogsRead',
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:Describe*',
                'logs:Get*',
                'logs:List*',
                'logs:FilterLogEvents',
                'logs:StartQuery',
                'logs:StopQuery',
                'logs:TestMetricFilter',
              ],
              resources: ['*'],
            }),
            // Read CloudTrail events
            new iam.PolicyStatement({
              sid: 'AllowCloudTrailRead',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudtrail:LookupEvents',
                'cloudtrail:GetTrailStatus',
                'cloudtrail:DescribeTrails',
                'cloudtrail:GetEventSelectors',
              ],
              resources: ['*'],
            }),
            // Explicit deny for all modification actions (per requirement)
            new iam.PolicyStatement({
              sid: 'DenyAllModifications',
              effect: iam.Effect.DENY,
              actions: [
                'iam:Create*',
                'iam:Delete*',
                'iam:Put*',
                'iam:Update*',
                'iam:Attach*',
                'iam:Detach*',
                'iam:Remove*',
                'iam:Add*',
                'iam:Change*',
                'iam:Set*',
                'iam:Enable*',
                'iam:Disable*',
                'logs:Create*',
                'logs:Delete*',
                'logs:Put*',
                'cloudtrail:Create*',
                'cloudtrail:Delete*',
                'cloudtrail:Put*',
                'cloudtrail:Update*',
                'cloudtrail:Start*',
                'cloudtrail:Stop*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==========================================
    //Note: Compliance tagging is handled in bin/tap.ts at the app level
    // ==========================================
    // 11. CLOUDFORMATION OUTPUTS
    // ==========================================

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'ARN of the SNS topic for security alerts',
      exportName: `${resourcePrefix}-alerts-topic-arn`,
    });

    new cdk.CfnOutput(this, 'CrossAccountAuditRoleArn', {
      value: crossAccountAuditRole.roleArn,
      description: 'ARN of the cross-account audit role',
      exportName: `${resourcePrefix}-audit-role-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: logEncryptionKey.keyArn,
      description: 'ARN of the KMS key for log encryption',
      exportName: `${resourcePrefix}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: logEncryptionKey.keyId,
      description: 'ID of the KMS key for log encryption',
      exportName: `${resourcePrefix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: eventDLQ.queueUrl,
      description: 'URL of the dead letter queue for failed events',
      exportName: `${resourcePrefix}-dlq-url`,
    });

    new cdk.CfnOutput(this, 'PolicyAnalyzerLambdaArn', {
      value: policyAnalyzerLambda.functionArn,
      description: 'ARN of the policy analyzer Lambda function',
      exportName: `${resourcePrefix}-policy-analyzer-arn`,
    });

    new cdk.CfnOutput(this, 'DailyAuditorLambdaArn', {
      value: dailyAuditorLambda.functionArn,
      description: 'ARN of the daily auditor Lambda function',
      exportName: `${resourcePrefix}-daily-auditor-arn`,
    });

    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: securityLogGroup.logGroupName,
      description: 'Name of the security audit log group',
      exportName: `${resourcePrefix}-log-group-name`,
    });

    new cdk.CfnOutput(this, 'IAMPolicyChangeRuleName', {
      value: iamPolicyChangeRule.ruleName,
      description: 'Name of the EventBridge rule for IAM policy changes',
      exportName: `${resourcePrefix}-policy-change-rule`,
    });

    new cdk.CfnOutput(this, 'UnusualActivityAlarmName', {
      value: unusualActivityAlarm.alarmName,
      description: 'Name of the CloudWatch alarm for unusual IAM activity',
      exportName: `${resourcePrefix}-unusual-activity-alarm`,
    });
  }
}
