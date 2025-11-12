### Reasoning Trace
---

This is a comprehensive task for creating an automated IAM security monitoring and remediation system using AWS CDK with TypeScript. Let me break down what needs to be implemented:

1. IAM Policy Analysis Lambda Function - Analyzes policies for overly permissive actions
2. KMS Encryption Keys - With automatic rotation and restricted usage
3. CloudWatch Log Groups - 90-day retention with KMS encryption
4. EventBridge Rules - Trigger on IAM policy changes with DLQ
5. IAM Roles with Session Policies - Restrict access with explicit deny statements
6. CloudWatch Alarms - Detect unusual IAM activity (>5 changes in 10 min)
7. SNS Topic - For security alerts
8. Scheduled Daily Audit Lambda - Daily audit of all IAM policies
9. Resource Tagging - Compliance tracking
10. Cross-Account IAM Roles - With external ID validation

The key constraints are:
- Lambda timeout ≤ 60 seconds
- Explicit deny statements in IAM policies
- KMS key usage restricted to specific services
- CloudWatch logs encrypted with customer-managed KMS
- EventBridge rules with DLQ

I need to create a complete CDK application with all these components in a single stack file. Let me start building this solution.
### Answer 
---

I'll create a comprehensive CDK application for an automated IAM security monitoring and remediation system. This solution implements all the required components with proper security controls and compliance features.

## Complete CDK Application Structure

### 1. Project Setup

```json
// package.json
{
  "name": "iam-security-monitor",
  "version": "1.0.0",
  "bin": {
    "iam-security-monitor": "bin/iam-security-monitor.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "20.8.9",
    "aws-cdk": "2.100.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0"
  }
}
```

### 2. Main CDK App File

```typescript
// bin/iam-security-monitor.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IamSecurityStack } from '../lib/iam-security-stack';

const app = new cdk.App();

// Get account and region from environment or use defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new IamSecurityStack(app, 'IamSecurityMonitorStack', {
  env,
  description: 'Automated IAM Security Monitoring and Remediation System',
  tags: {
    Project: 'IAM-Security-Monitor',
    ManagedBy: 'CDK',
    Environment: 'Production',
    Owner: 'SecurityTeam',
    DataClassification: 'Sensitive'
  }
});

app.synth();
```

### 3. Complete Stack Implementation

```typescript
// lib/iam-security-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import * as path from 'path';

export class IamSecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // 1. KMS ENCRYPTION KEYS
    // ==========================================
    
    const logEncryptionKey = new kms.Key(this, 'LogEncryptionKey', {
      description: 'KMS key for encrypting security audit logs',
      enableKeyRotation: true, // Automatic key rotation enabled
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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
          // CloudWatch Logs service access (specific service only)
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey'
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`
              }
            }
          }),
          // Lambda service access (specific service only)
          new iam.PolicyStatement({
            sid: 'Allow Lambda Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey'
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    logEncryptionKey.addAlias('alias/iam-security-logs');

    // ==========================================
    // 2. CLOUDWATCH LOG GROUPS
    // ==========================================
    
    const securityLogGroup = new logs.LogGroup(this, 'SecurityAuditLogGroup', {
      logGroupName: '/aws/security/iam-audit',
      retention: logs.RetentionDays.THREE_MONTHS, // 90-day retention
      encryptionKey: logEncryptionKey, // KMS encryption with customer-managed key
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/iam-policy-analyzer',
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: logEncryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const scheduledAuditLogGroup = new logs.LogGroup(this, 'ScheduledAuditLogGroup', {
      logGroupName: '/aws/lambda/daily-iam-auditor',
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: logEncryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ==========================================
    // 3. SNS TOPIC FOR SECURITY ALERTS
    // ==========================================
    
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'IAM Security Alerts',
      masterKey: logEncryptionKey,
    });

    // Add email subscription (replace with actual email)
    securityAlertsTopic.addSubscription(
      new subscriptions.EmailSubscription('security-team@example.com')
    );

    // ==========================================
    // 4. DEAD LETTER QUEUES
    // ==========================================
    
    const eventDLQ = new sqs.Queue(this, 'EventProcessingDLQ', {
      queueName: 'iam-security-event-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: logEncryptionKey,
    });

    // ==========================================
    // 5. IAM ROLES WITH SESSION POLICIES
    // ==========================================
    
    // Lambda execution role with explicit deny statements
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for IAM policy analyzer Lambda',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        IAMPolicyAnalysis: new iam.PolicyDocument({
          statements: [
            // Allow reading IAM policies
            new iam.PolicyStatement({
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
                'iam:ListAttachedRolePolicies',
                'iam:ListAttachedUserPolicies',
                'iam:ListRolePolicies',
                'iam:ListUserPolicies',
              ],
              resources: ['*'],
            }),
            // Allow writing to CloudWatch Logs
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                securityLogGroup.logGroupArn,
                `${securityLogGroup.logGroupArn}:*`,
              ],
            }),
            // Allow publishing to SNS
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [securityAlertsTopic.topicArn],
            }),
            // Allow CloudWatch metrics
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'],
            }),
            // Explicit deny for sensitive actions
            new iam.PolicyStatement({
              sid: 'DenySensitiveActions',
              effect: iam.Effect.DENY,
              actions: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                'iam:DeletePolicy',
                'iam:CreateAccessKey',
                'iam:DeleteAccessKey',
                'iam:PutUserPolicy',
                'iam:PutRolePolicy',
                'iam:AttachUserPolicy',
                'iam:AttachRolePolicy',
                'iam:DetachUserPolicy',
                'iam:DetachRolePolicy',
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
    // 6. LAMBDA FUNCTIONS
    // ==========================================
    
    // Real-time IAM Policy Analyzer Lambda
    const policyAnalyzerLambda = new lambda.Function(this, 'PolicyAnalyzerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60), // 60 seconds or less
      memorySize: 512,
      role: lambdaExecutionRole,
      logGroup: lambdaLogGroup,
      environment: {
        SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
        LOG_GROUP_NAME: securityLogGroup.logGroupName,
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const iam = new AWS.IAM();
        const sns = new AWS.SNS();
        const cloudwatchLogs = new AWS.CloudWatchLogs();
        
        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));
          
          try {
            // Extract policy details from the event
            const detail = event.detail || {};
            const eventName = detail.eventName || '';
            const requestParameters = detail.requestParameters || {};
            
            let policyDocument = null;
            let policyName = '';
            let violations = [];
            
            // Handle different IAM events
            if (eventName === 'CreatePolicy' || eventName === 'CreatePolicyVersion') {
              policyDocument = requestParameters.policyDocument;
              policyName = requestParameters.policyName || 'Unknown';
            } else if (eventName === 'PutUserPolicy' || eventName === 'PutRolePolicy') {
              policyDocument = requestParameters.policyDocument;
              policyName = requestParameters.policyName || 'Unknown';
            }
            
            if (policyDocument) {
              // Parse and analyze the policy
              const policy = typeof policyDocument === 'string' 
                ? JSON.parse(policyDocument) 
                : policyDocument;
              
              // Check for overly permissive actions
              for (const statement of policy.Statement || []) {
                const actions = Array.isArray(statement.Action) 
                  ? statement.Action 
                  : [statement.Action];
                const resources = Array.isArray(statement.Resource) 
                  ? statement.Resource 
                  : [statement.Resource];
                
                // Check for wildcard in actions
                if (actions.includes('*') || actions.some(a => a === '*')) {
                  violations.push({
                    type: 'WILDCARD_ACTION',
                    statement: statement.Sid || 'Unnamed',
                    severity: 'HIGH',
                    message: 'Policy contains wildcard (*) in Action field'
                  });
                }
                
                // Check for wildcard in resources
                if (resources.includes('*') || resources.some(r => r === '*')) {
                  violations.push({
                    type: 'WILDCARD_RESOURCE',
                    statement: statement.Sid || 'Unnamed',
                    severity: 'HIGH',
                    message: 'Policy contains wildcard (*) in Resource field'
                  });
                }
                
                // Check for dangerous action patterns
                const dangerousPatterns = ['iam:*', 'kms:*', 'ec2:Terminate*', 's3:Delete*'];
                for (const action of actions) {
                  if (dangerousPatterns.some(pattern => {
                    const regex = new RegExp(pattern.replace('*', '.*'));
                    return regex.test(action);
                  })) {
                    violations.push({
                      type: 'DANGEROUS_ACTION',
                      statement: statement.Sid || 'Unnamed',
                      action: action,
                      severity: 'MEDIUM',
                      message: \`Policy contains potentially dangerous action: \${action}\`
                    });
                  }
                }
              }
              
              // Log findings
              const logEntry = {
                timestamp: new Date().toISOString(),
                eventName,
                policyName,
                violations,
                eventDetails: detail
              };
              
              // Write to CloudWatch Logs
              const logGroupName = process.env.LOG_GROUP_NAME;
              const logStreamName = \`policy-analysis-\${Date.now()}\`;
              
              await cloudwatchLogs.createLogStream({
                logGroupName,
                logStreamName
              }).promise().catch(() => {}); // Ignore if stream exists
              
              await cloudwatchLogs.putLogEvents({
                logGroupName,
                logStreamName,
                logEvents: [{
                  message: JSON.stringify(logEntry),
                  timestamp: Date.now()
                }]
              }).promise();
              
              // Send alert if violations found
              if (violations.length > 0) {
                const message = {
                  default: JSON.stringify(logEntry, null, 2),
                  email: \`
IAM Security Alert: Policy Violations Detected

Policy Name: \${policyName}
Event: \${eventName}
Time: \${new Date().toISOString()}

Violations Found:
\${violations.map(v => \`- [\${v.severity}] \${v.message}\`).join('\\n')}

Please review this policy immediately.
                  \`
                };
                
                await sns.publish({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: \`[IAM Security] Policy Violations Detected in \${policyName}\`,
                  Message: JSON.stringify(message),
                  MessageStructure: 'json'
                }).promise();
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Policy analysis complete',
                violations: violations.length
              })
            };
            
          } catch (error) {
            console.error('Error analyzing policy:', error);
            throw error;
          }
        };
      `),
    });

    // Daily Scheduled Audit Lambda
    const dailyAuditLambda = new lambda.Function(this, 'DailyAuditLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60), // 60 seconds or less
      memorySize: 1024,
      role: lambdaExecutionRole,
      logGroup: scheduledAuditLogGroup,
      environment: {
        SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
        LOG_GROUP_NAME: securityLogGroup.logGroupName,
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const iam = new AWS.IAM();
        const sns = new AWS.SNS();
        const cloudwatchLogs = new AWS.CloudWatchLogs();
        const cloudwatch = new AWS.CloudWatch();
        
        exports.handler = async (event) => {
          console.log('Starting daily IAM audit...');
          
          const auditResults = {
            timestamp: new Date().toISOString(),
            totalPolicies: 0,
            violationsFound: 0,
            policies: []
          };
          
          try {
            // List all customer managed policies
            const policies = await iam.listPolicies({
              Scope: 'Local',
              MaxItems: 100
            }).promise();
            
            auditResults.totalPolicies = policies.Policies.length;
            
            // Analyze each policy
            for (const policy of policies.Policies) {
              try {
                // Get the policy version
                const policyVersion = await iam.getPolicyVersion({
                  PolicyArn: policy.Arn,
                  VersionId: policy.DefaultVersionId
                }).promise();
                
                const policyDocument = JSON.parse(
                  decodeURIComponent(policyVersion.PolicyVersion.Document)
                );
                
                const violations = [];
                
                // Analyze statements
                for (const statement of policyDocument.Statement || []) {
                  const actions = Array.isArray(statement.Action) 
                    ? statement.Action 
                    : [statement.Action];
                  const resources = Array.isArray(statement.Resource) 
                    ? statement.Resource 
                    : [statement.Resource];
                  
                  // Check for wildcards
                  if (actions.includes('*')) {
                    violations.push({
                      type: 'WILDCARD_ACTION',
                      severity: 'HIGH'
                    });
                  }
                  
                  if (resources.includes('*')) {
                    violations.push({
                      type: 'WILDCARD_RESOURCE',
                      severity: 'HIGH'
                    });
                  }
                }
                
                if (violations.length > 0) {
                  auditResults.violationsFound++;
                  auditResults.policies.push({
                    policyName: policy.PolicyName,
                    policyArn: policy.Arn,
                    violations
                  });
                }
                
              } catch (policyError) {
                console.error(\`Error analyzing policy \${policy.PolicyName}:\`, policyError);
              }
            }
            
            // Log audit results
            const logGroupName = process.env.LOG_GROUP_NAME;
            const logStreamName = \`daily-audit-\${Date.now()}\`;
            
            await cloudwatchLogs.createLogStream({
              logGroupName,
              logStreamName
            }).promise().catch(() => {});
            
            await cloudwatchLogs.putLogEvents({
              logGroupName,
              logStreamName,
              logEvents: [{
                message: JSON.stringify(auditResults),
                timestamp: Date.now()
              }]
            }).promise();
            
            // Publish metrics
            await cloudwatch.putMetricData({
              Namespace: 'IAMSecurity',
              MetricData: [
                {
                  MetricName: 'PoliciesAudited',
                  Value: auditResults.totalPolicies,
                  Unit: 'Count',
                  Timestamp: new Date()
                },
                {
                  MetricName: 'ViolationsFound',
                  Value: auditResults.violationsFound,
                  Unit: 'Count',
                  Timestamp: new Date()
                }
              ]
            }).promise();
            
            // Send summary notification
            if (auditResults.violationsFound > 0) {
              await sns.publish({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Subject: '[IAM Security] Daily Audit Report - Violations Found',
                Message: \`
Daily IAM Security Audit Report

Date: \${auditResults.timestamp}
Total Policies Audited: \${auditResults.totalPolicies}
Violations Found: \${auditResults.violationsFound}

Policies with Violations:
\${auditResults.policies.map(p => 
  \`- \${p.policyName}: \${p.violations.length} violation(s)\`
).join('\\n')}

Please review and remediate these policies.
                \`
              }).promise();
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify(auditResults)
            };
            
          } catch (error) {
            console.error('Error during daily audit:', error);
            
            // Send error notification
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: '[IAM Security] Daily Audit Failed',
              Message: \`Daily IAM audit failed with error: \${error.message}\`
            }).promise();
            
            throw error;
          }
        };
      `),
    });

    // ==========================================
    // 7. EVENTBRIDGE RULES WITH DLQ
    // ==========================================
    
    // Rule for IAM policy creation/modification
    const iamPolicyChangeRule = new events.Rule(this, 'IAMPolicyChangeRule', {
      description: 'Triggers on IAM policy creation or modification',
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

    // Add Lambda target with DLQ
    iamPolicyChangeRule.addTarget(
      new targets.LambdaFunction(policyAnalyzerLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // Scheduled rule for daily audit
    const dailyAuditRule = new events.Rule(this, 'DailyAuditRule', {
      description: 'Triggers daily IAM policy audit',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // Run at 2 AM UTC daily
      }),
    });

    dailyAuditRule.addTarget(
      new targets.LambdaFunction(dailyAuditLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // ==========================================
    // 8. CLOUDWATCH ALARMS
    // ==========================================
    
    // Metric for IAM policy changes
    const iamPolicyChangeMetric = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'SuccessfulRuleMatches',
      dimensionsMap: {
        RuleName: iamPolicyChangeRule.ruleName,
      },
      statistic: cloudwatch.Stats.SUM,
    });

    // Alarm for unusual IAM activity
    const unusualActivityAlarm = new cloudwatch.Alarm(this, 'UnusualIAMActivityAlarm', {
      alarmDescription: 'Triggers when more than 5 IAM policy changes occur in 10 minutes',
      metric: iamPolicyChangeMetric,
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      period: cdk.Duration.minutes(10),
    });

    // Add SNS action to alarm
    unusualActivityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Lambda error alarm
    const lambdaErrorMetric = policyAnalyzerLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmDescription: 'Triggers when Lambda function errors occur',
      metric: lambdaErrorMetric,
      threshold: 1,
      evaluationPeriods: 1,
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // ==========================================
    // 9. CROSS-ACCOUNT AUDIT ROLE
    // ==========================================
    
    const crossAccountAuditRole = new iam.Role(this, 'CrossAccountAuditRole', {
      roleName: 'IAMSecurityAuditRole',
      assumedBy: new iam.AccountPrincipal('123456789012'), // Replace with actual audit account ID
      externalIds: ['unique-external-id-for-security'], // External ID validation
      description: 'Cross-account role for security auditing',
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        AuditPolicy: new iam.PolicyDocument({
          statements: [
            // Read-only access to IAM
            new iam.PolicyStatement({
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
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:Describe*',
                'logs:Get*',
                'logs:List*',
                'logs:FilterLogEvents',
              ],
              resources: ['*'],
            }),
            // Read CloudTrail events
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudtrail:LookupEvents',
                'cloudtrail:GetTrailStatus',
              ],
              resources: ['*'],
            }),
            // Explicit deny for modification actions
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
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==========================================
    // 10. TAGGING ASPECT FOR COMPLIANCE
    // ==========================================
    
    cdk.Aspects.of(this).add(new ComplianceTaggingAspect());

    // ==========================================
    // 11. OUTPUTS
    // ==========================================
    
    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'ARN of the SNS topic for security alerts',
      exportName: 'SecurityAlertsTopicArn',
    });

    new cdk.CfnOutput(this, 'CrossAccountAuditRoleArn', {
      value: crossAccountAuditRole.roleArn,
      description: 'ARN of the cross-account audit role',
      exportName: 'CrossAccountAuditRoleArn',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: logEncryptionKey.keyArn,
      description: 'ARN of the KMS key for log encryption',
      exportName: 'LogEncryptionKeyArn',
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: eventDLQ.queueUrl,
      description: 'URL of the dead letter queue for failed events',
      exportName: 'EventDLQUrl',
    });
  }
}

// Custom Aspect for enforcing compliance tags
class ComplianceTaggingAspect implements cdk.IAspect {
  public visit(node: cdk.IConstruct): void {
    if (cdk.TagManager.isTaggable(node)) {
      const tags = cdk.Tags.of(node);
      
      // Add mandatory compliance tags if not already present
      tags.add('Environment', 'Production', {
        priority: 100,
        applyToLaunchedInstances: true,
      });
      
      tags.add('Owner', 'SecurityTeam', {
        priority: 100,
        applyToLaunchedInstances: true,
      });
      
      tags.add('DataClassification', 'Sensitive', {
        priority: 100,
        applyToLaunchedInstances: true,
      });
      
      tags.add('Compliance', 'Required', {
        priority: 90,
        applyToLaunchedInstances: true,
      });
      
      tags.add('ManagedBy', 'CDK', {
        priority: 90,
        applyToLaunchedInstances: true,
      });
    }
  }
}
```

### 4. CDK Configuration

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/iam-security-monitor.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.js",
      "**/*.d.ts",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

### 5. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "skipLibCheck": true,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Configure AWS credentials:**
```bash
aws configure
```

3. **Bootstrap CDK (first time only):**
```bash
npx cdk bootstrap
```

4. **Synthesize the CloudFormation template:**
```bash
npx cdk synth
```

5. **Deploy the stack:**
```bash
npx cdk deploy
```

## Key Features Implemented

### Security Controls
- ✅ **KMS encryption** with automatic rotation for all logs
- ✅ **Restricted KMS key policies** limiting access to specific services
- ✅ **Explicit deny statements** in all IAM policies for sensitive actions
- ✅ **External ID validation** for cross-account roles
- ✅ **Dead letter queues** for EventBridge rule failures

### Monitoring & Alerting
- ✅ **Real-time policy analysis** for wildcards and dangerous patterns
- ✅ **CloudWatch alarms** for unusual activity (>5 changes in 10 minutes)
- ✅ **SNS notifications** for security violations
- ✅ **Daily scheduled audits** of all IAM policies
- ✅ **Comprehensive logging** with 90-day retention

### Compliance Features
- ✅ **Mandatory resource tagging** via CDK Aspects
- ✅ **Cross-account audit roles** with read-only access
- ✅ **Audit trail** in encrypted CloudWatch logs
- ✅ **Lambda timeout constraints** (60 seconds max)
- ✅ **Metric publishing** for audit tracking

### Resilience
- ✅ **Retry policies** for Lambda invocations
- ✅ **Dead letter queues** for failed events
- ✅ **Error handling** in Lambda functions
- ✅ **CloudWatch alarms** for Lambda errors

This solution provides a comprehensive, production-ready IAM security monitoring system that automatically detects and alerts on policy violations while maintaining compliance with security best practices.
