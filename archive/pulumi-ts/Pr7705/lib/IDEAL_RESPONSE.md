# S3 Compliance Analysis Tool - IDEAL RESPONSE

This document describes the corrected, production-ready implementation that addresses all failures identified in MODEL_FAILURES.md.

## Overview

This implementation provides an S3 bucket compliance analysis system using Pulumi TypeScript that:
- Analyzes existing S3 buckets for compliance violations
- Checks versioning, encryption, lifecycle policies, public access, and CloudWatch metrics
- Tags non-compliant buckets with compliance-status: failed
- Sends notifications for high-severity violations (3+ violations)
- Generates compliance reports in JSON format
- Uses Step Functions for orchestration with retry logic
- Scheduled daily via EventBridge

## Architecture

### AWS Services Used
- **S3**: Target for compliance analysis
- **Lambda**: Compliance checker function (Node.js 18.x)
- **Step Functions**: Workflow orchestration with retry/catch
- **SQS**: Queue for compliance results
- **SNS**: Notifications for high-severity violations
- **CloudWatch**: Alarms and metrics
- **EventBridge**: Daily scheduling
- **IAM**: Roles and policies

### Resource Naming Strategy
All resources use `${environmentSuffix}` for unique, idempotent naming to allow multiple deployments.

## Implementation Structure

```
/
├── Pulumi.yaml                       # Pulumi project config (main: bin/tap.ts)

bin/
└── tap.ts                            # Pulumi entry point (instantiates TapStack)

lib/
├── TapStack.ts                       # Main Pulumi TapStack component
├── lambda/
│   └── compliance-checker/
│       ├── index.js                  # Lambda handler
│       └── package.json              # Lambda dependencies
└── IDEAL_RESPONSE.md                 # This file
```

## Complete Source Code

### File: Pulumi.yaml

```yaml
name: TapStack
runtime: nodejs
description: S3 bucket compliance analysis and reporting system
main: bin/tap.ts
```

### File: bin/tap.ts (Entry Point)

```typescript
/**
 * Pulumi application entry point for the TAP infrastructure.
 *
 * This module instantiates the TapStack with appropriate configuration
 * based on the deployment environment.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/TapStack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: process.env.REPOSITORY || 'unknown',
  Author: process.env.COMMIT_AUTHOR || 'unknown',
  PRNumber: process.env.PR_NUMBER || 'unknown',
  Team: process.env.TEAM || 'unknown',
  CreatedAt: new Date().toISOString(),
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: { tags: defaultTags },
});

new TapStack('pulumi-infra', { environmentSuffix, tags: defaultTags }, { provider });
```

### File: lib/TapStack.ts

```typescript
/**
 * TapStack.ts
 *
 * S3 Compliance Analysis Tool - Pulumi TypeScript Implementation
 *
 * This module implements an S3 bucket compliance analysis system that:
 * - Analyzes existing S3 buckets for compliance violations
 * - Checks versioning, encryption, lifecycle policies, public access, and CloudWatch metrics
 * - Tags non-compliant buckets with compliance-status: failed
 * - Sends notifications for high-severity violations
 * - Generates compliance reports
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

// Interfaces for type safety
export interface ComplianceViolation {
  bucketName: string;
  bucketArn: string;
  violations: string[];
}

export interface ComplianceReport {
  totalBuckets: number;
  compliantBuckets: number;
  nonCompliantBuckets: number;
  violations: ComplianceViolation[];
  timestamp: string;
}

/**
 * TapStack - Main Pulumi component for S3 Compliance Analysis
 */
export class TapStack extends pulumi.ComponentResource {
  // Public outputs
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly sqsQueueUrl: pulumi.Output<string>;
  public readonly sqsQueueArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly stateMachineArn: pulumi.Output<string>;
  public readonly stateMachineName: pulumi.Output<string>;
  public readonly complianceAlarmArn: pulumi.Output<string>;
  public readonly complianceAlarmName: pulumi.Output<string>;
  public readonly eventRuleName: pulumi.Output<string>;
  public readonly eventRuleArn: pulumi.Output<string>;
  public readonly regionDeployed: string;
  public readonly environmentSuffixOutput: string;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = process.env.AWS_REGION || 'us-east-1';

    // Compliance thresholds
    const complianceConfig = {
      lifecycleAgeThreshold: 90,
      alarmThreshold: 1,
    };

    // SNS Topic for notifications
    const complianceTopic = new aws.sns.Topic(
      `compliance-topic-${environmentSuffix}`,
      {
        name: `s3-compliance-notifications-${environmentSuffix}`,
        displayName: 'S3 Compliance Notifications',
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Notifications',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // SQS Queue for compliance check results
    const complianceQueue = new aws.sqs.Queue(
      `compliance-queue-${environmentSuffix}`,
      {
        name: `s3-compliance-results-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300,
        messageRetentionSeconds: 86400,
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Results',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Subscribe SQS to SNS
    const queueSubscription = new aws.sns.TopicSubscription(
      `queue-subscription-${environmentSuffix}`,
      {
        topic: complianceTopic.arn,
        protocol: 'sqs',
        endpoint: complianceQueue.arn,
      },
      { parent: this }
    );

    // Allow SNS to send messages to SQS
    const queuePolicy = new aws.sqs.QueuePolicy(
      `queue-policy-${environmentSuffix}`,
      {
        queueUrl: complianceQueue.url,
        policy: pulumi
          .all([complianceQueue.arn, complianceTopic.arn])
          .apply(([queueArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'sns.amazonaws.com' },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: {
                    ArnEquals: { 'aws:SourceArn': topicArn },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        name: `s3-compliance-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Environment: environmentSuffix,
          Purpose: 'Lambda Execution Role',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for S3 access and SNS/SQS
    const lambdaCustomPolicy = new aws.iam.RolePolicy(
      `lambda-custom-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policy: pulumi
          .all([complianceTopic.arn, complianceQueue.arn])
          .apply(([topicArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ListAllMyBuckets',
                    's3:GetBucketVersioning',
                    's3:GetBucketEncryption',
                    's3:GetBucketLifecycleConfiguration',
                    's3:GetBucketPolicy',
                    's3:GetBucketPolicyStatus',
                    's3:GetBucketTagging',
                    's3:PutBucketTagging',
                    's3:GetBucketLocation',
                    's3:GetBucketMetricsConfiguration',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda function for compliance checking
    const complianceLambda = new aws.lambda.Function(
      `compliance-checker-${environmentSuffix}`,
      {
        name: `s3-compliance-checker-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            SNS_TOPIC_ARN: complianceTopic.arn,
            SQS_QUEUE_URL: complianceQueue.url,
            LIFECYCLE_AGE_THRESHOLD: complianceConfig.lifecycleAgeThreshold.toString(),
          },
        },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'compliance-checker')
          ),
        }),
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Checker',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [lambdaRole, lambdaBasicPolicy, lambdaCustomPolicy] }
    );

    // IAM Role for Step Functions
    const stepFunctionsRole = new aws.iam.Role(
      `sfn-role-${environmentSuffix}`,
      {
        name: `s3-compliance-sfn-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'states.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Environment: environmentSuffix,
          Purpose: 'Step Functions Execution Role',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    const stepFunctionsPolicy = new aws.iam.RolePolicy(
      `sfn-policy-${environmentSuffix}`,
      {
        role: stepFunctionsRole.name,
        policy: complianceLambda.arn.apply(lambdaArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: lambdaArn,
              },
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Step Functions State Machine
    const stateMachine = new aws.sfn.StateMachine(
      `compliance-sfn-${environmentSuffix}`,
      {
        name: `s3-compliance-workflow-${environmentSuffix}`,
        roleArn: stepFunctionsRole.arn,
        definition: complianceLambda.arn.apply(lambdaArn =>
          JSON.stringify({
            Comment: 'S3 Compliance Checking Workflow',
            StartAt: 'CheckCompliance',
            States: {
              CheckCompliance: {
                Type: 'Task',
                Resource: lambdaArn,
                Retry: [
                  {
                    ErrorEquals: ['States.TaskFailed'],
                    IntervalSeconds: 2,
                    MaxAttempts: 3,
                    BackoffRate: 2.0,
                  },
                ],
                Catch: [
                  {
                    ErrorEquals: ['States.ALL'],
                    Next: 'CheckFailed',
                  },
                ],
                Next: 'CheckSuccess',
              },
              CheckSuccess: { Type: 'Succeed' },
              CheckFailed: {
                Type: 'Fail',
                Error: 'ComplianceCheckFailed',
                Cause: 'Failed to complete compliance check after retries',
              },
            },
          })
        ),
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Workflow',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [stepFunctionsRole, stepFunctionsPolicy] }
    );

    // CloudWatch Alarm for non-compliant buckets
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `compliance-alarm-${environmentSuffix}`,
      {
        name: `s3-non-compliant-buckets-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'NonCompliantBuckets',
        namespace: 'S3Compliance',
        period: 300,
        statistic: 'Average',
        threshold: complianceConfig.alarmThreshold,
        alarmDescription: 'Alert when non-compliant S3 buckets are detected',
        alarmActions: [complianceTopic.arn],
        treatMissingData: 'notBreaching',
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Monitoring',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // EventBridge rule to trigger compliance checks daily
    const complianceScheduleRole = new aws.iam.Role(
      `schedule-role-${environmentSuffix}`,
      {
        name: `s3-compliance-schedule-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'events.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Environment: environmentSuffix,
          Purpose: 'EventBridge Schedule Role',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    const schedulePolicy = new aws.iam.RolePolicy(
      `schedule-policy-${environmentSuffix}`,
      {
        role: complianceScheduleRole.name,
        policy: stateMachine.arn.apply(sfnArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['states:StartExecution'],
                Resource: sfnArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const complianceSchedule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        name: `s3-compliance-daily-check-${environmentSuffix}`,
        description: 'Trigger S3 compliance check daily',
        scheduleExpression: 'rate(1 day)',
        tags: {
          Environment: environmentSuffix,
          Purpose: 'S3 Compliance Schedule',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [complianceScheduleRole, schedulePolicy] }
    );

    const scheduleTarget = new aws.cloudwatch.EventTarget(
      `schedule-target-${environmentSuffix}`,
      {
        rule: complianceSchedule.name,
        arn: stateMachine.arn,
        roleArn: complianceScheduleRole.arn,
      },
      { parent: this }
    );

    // Set outputs
    this.snsTopicArn = complianceTopic.arn;
    this.sqsQueueUrl = complianceQueue.url;
    this.sqsQueueArn = complianceQueue.arn;
    this.lambdaFunctionName = complianceLambda.name;
    this.lambdaFunctionArn = complianceLambda.arn;
    this.stateMachineArn = stateMachine.arn;
    this.stateMachineName = stateMachine.name;
    this.complianceAlarmArn = complianceAlarm.arn;
    this.complianceAlarmName = complianceAlarm.name;
    this.eventRuleName = complianceSchedule.name;
    this.eventRuleArn = complianceSchedule.arn;
    this.regionDeployed = region;
    this.environmentSuffixOutput = environmentSuffix;

    // Register outputs
    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
      sqsQueueUrl: this.sqsQueueUrl,
      sqsQueueArn: this.sqsQueueArn,
      lambdaFunctionName: this.lambdaFunctionName,
      lambdaFunctionArn: this.lambdaFunctionArn,
      stateMachineArn: this.stateMachineArn,
      stateMachineName: this.stateMachineName,
      complianceAlarmArn: this.complianceAlarmArn,
      complianceAlarmName: this.complianceAlarmName,
      eventRuleName: this.eventRuleName,
      eventRuleArn: this.eventRuleArn,
      regionDeployed: this.regionDeployed,
      environmentSuffixOutput: this.environmentSuffixOutput,
    });
  }
}
```

### File: lib/lambda/compliance-checker/index.js

```js
/**
 * S3 Compliance Checker Lambda Function
 *
 * Analyzes S3 buckets for compliance violations:
 * - Versioning enabled
 * - Server-side encryption (AES256 or KMS)
 * - Lifecycle policies for objects older than 90 days
 * - No public access
 * - CloudWatch metrics configuration
 */
const {
  S3Client,
  ListBucketsCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketTaggingCommand,
  PutBucketTaggingCommand,
  GetBucketLocationCommand,
  GetBucketMetricsConfigurationCommand,
} = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const fs = require('fs').promises;

// SDK clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

// Constants
const LIFECYCLE_THRESHOLD = parseInt(process.env.LIFECYCLE_AGE_THRESHOLD || '90');
const TARGET_REGION = process.env.AWS_REGION || 'us-east-1';
const MAX_RETRIES = 3;

// Retry wrapper with exponential backoff
async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryableError(error) && attempt < retries - 1) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
        continue;
      }
      throw error;
    }
  }
}

function isRetryableError(error) {
  return ['ThrottlingException', 'RequestTimeout', 'ServiceUnavailable'].includes(error.name);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main handler
exports.handler = async event => {
  console.log('Starting S3 compliance check...');

  try {
    const allBuckets = await listAllBuckets();
    console.log(`Found ${allBuckets.length} total buckets`);

    const regionBuckets = [];
    for (const bucket of allBuckets) {
      const location = await getBucketLocation(bucket.Name);
      if (location === TARGET_REGION) {
        regionBuckets.push(bucket);
      }
    }

    console.log(`Analyzing ${regionBuckets.length} buckets in ${TARGET_REGION}`);

    const violations = [];
    let compliantCount = 0;

    for (const bucket of regionBuckets) {
      const bucketName = bucket.Name;
      console.log(`Checking bucket: ${bucketName}`);

      const checks = await Promise.all([
        checkVersioning(bucketName),
        checkEncryption(bucketName),
        checkLifecycle(bucketName),
        checkPublicAccess(bucketName),
        checkCloudWatchMetrics(bucketName),
      ]);

      const [hasVersioning, hasEncryption, hasLifecycle, noPublicAccess, hasMetrics] = checks;

      const bucketViolations = [];
      if (!hasVersioning) bucketViolations.push('Versioning not enabled');
      if (!hasEncryption) bucketViolations.push('Server-side encryption not configured');
      if (!hasLifecycle) bucketViolations.push(`Lifecycle policy missing for objects older than ${LIFECYCLE_THRESHOLD} days`);
      if (!noPublicAccess) bucketViolations.push('Bucket policy allows public access');
      if (!hasMetrics) bucketViolations.push('CloudWatch metrics not configured');

      if (bucketViolations.length > 0) {
        violations.push({
          bucketName,
          bucketArn: `arn:aws:s3:::${bucketName}`,
          violations: bucketViolations,
        });

        await tagBucketIdempotent(bucketName, false);

        if (bucketViolations.length >= 3) {
          const snsCommand = new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: `High-Severity S3 Compliance Violation: ${bucketName}`,
            Message: JSON.stringify({
              bucketName,
              violationCount: bucketViolations.length,
              violations: bucketViolations,
              timestamp: new Date().toISOString(),
            }, null, 2),
          });
          await withRetry(() => snsClient.send(snsCommand));
        }
      } else {
        compliantCount++;
        await tagBucketIdempotent(bucketName, true);
      }
    }

    const report = {
      totalBuckets: regionBuckets.length,
      compliantBuckets: compliantCount,
      nonCompliantBuckets: violations.length,
      violations,
      timestamp: new Date().toISOString(),
    };

    const reportJson = JSON.stringify(report, null, 2);
    await fs.writeFile('/tmp/compliance-report.json', reportJson);

    const sqsCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: reportJson,
    });
    await withRetry(() => sqsClient.send(sqsCommand));

    await publishMetrics(regionBuckets.length, compliantCount);

    console.log('Compliance check completed');
    console.log(`Total: ${regionBuckets.length}, Compliant: ${compliantCount}, Non-compliant: ${violations.length}`);

    return { statusCode: 200, body: reportJson };
  } catch (error) {
    console.error(`Error during compliance check: ${error.message}`);
    throw error;
  }
};

// Get bucket location
async function getBucketLocation(bucketName) {
  try {
    const command = new GetBucketLocationCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    return response.LocationConstraint || 'us-east-1';
  } catch (error) {
    console.error(`Error getting location for bucket ${bucketName}: ${error.message}`);
    return null;
  }
}

// Check if versioning is enabled
async function checkVersioning(bucketName) {
  try {
    const command = new GetBucketVersioningCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    return response.Status === 'Enabled';
  } catch (error) {
    console.error(`Error checking versioning for ${bucketName}: ${error.message}`);
    return false;
  }
}

// Check if server-side encryption is configured
async function checkEncryption(bucketName) {
  try {
    const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    if (response.ServerSideEncryptionConfiguration?.Rules) {
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      const algorithm = rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      return algorithm === 'AES256' || algorithm === 'aws:kms';
    }
    return false;
  } catch (error) {
    if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
      return false;
    }
    console.error(`Error checking encryption for ${bucketName}: ${error.message}`);
    return false;
  }
}

// Check if lifecycle policy exists
async function checkLifecycle(bucketName) {
  try {
    const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    if (response.Rules && response.Rules.length > 0) {
      return response.Rules.some(rule => {
        if (rule.Status !== 'Enabled') return false;
        const hasValidTransition = rule.Transitions?.some(t => t.Days && t.Days <= LIFECYCLE_THRESHOLD);
        const hasValidExpiration = rule.Expiration?.Days && rule.Expiration.Days <= LIFECYCLE_THRESHOLD;
        return hasValidTransition || hasValidExpiration;
      });
    }
    return false;
  } catch (error) {
    if (error.name === 'NoSuchLifecycleConfiguration') {
      return false;
    }
    console.error(`Error checking lifecycle for ${bucketName}: ${error.message}`);
    return false;
  }
}

// Check if bucket policy allows public access
async function checkPublicAccess(bucketName) {
  try {
    const command = new GetBucketPolicyCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    if (response.Policy) {
      const policy = JSON.parse(response.Policy);
      const hasPublicAccess = policy.Statement?.some(
        stmt => stmt.Effect === 'Allow' &&
          (stmt.Principal === '*' || stmt.Principal?.AWS === '*') &&
          !stmt.Condition
      );
      return !hasPublicAccess;
    }
    return true;
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      return true;
    }
    console.error(`Error checking public access for ${bucketName}: ${error.message}`);
    return true;
  }
}

// Check if CloudWatch metrics are configured
async function checkCloudWatchMetrics(bucketName) {
  try {
    const command = new GetBucketMetricsConfigurationCommand({
      Bucket: bucketName,
      Id: 'EntireBucket',
    });
    const response = await withRetry(() => s3Client.send(command));
    return response.MetricsConfiguration !== undefined;
  } catch (error) {
    if (error.name === 'NoSuchConfiguration') {
      return false;
    }
    console.error(`Error checking CloudWatch metrics for ${bucketName}: ${error.message}`);
    return false;
  }
}

// Tag bucket with compliance status (idempotent)
async function tagBucketIdempotent(bucketName, compliant) {
  try {
    let existingTags = [];
    try {
      const getCommand = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await withRetry(() => s3Client.send(getCommand));
      existingTags = response.TagSet || [];
    } catch (error) {
      if (error.name !== 'NoSuchTagSet') {
        throw error;
      }
    }

    const existingStatus = existingTags.find(t => t.Key === 'compliance-status');
    const newStatus = compliant ? 'passed' : 'failed';

    if (existingStatus?.Value !== newStatus) {
      const filteredTags = existingTags.filter(t => t.Key !== 'compliance-status');
      const newTags = [...filteredTags, { Key: 'compliance-status', Value: newStatus }];

      const putCommand = new PutBucketTaggingCommand({
        Bucket: bucketName,
        Tagging: { TagSet: newTags },
      });
      await withRetry(() => s3Client.send(putCommand));
    }
  } catch (error) {
    console.error(`Error tagging bucket ${bucketName}: ${error.message}`);
  }
}

// List all buckets with pagination support
async function listAllBuckets() {
  const buckets = [];
  let nextToken = undefined;

  do {
    const command = new ListBucketsCommand({ ContinuationToken: nextToken });
    const response = await withRetry(() => s3Client.send(command));

    if (response.Buckets) {
      buckets.push(...response.Buckets);
    }

    nextToken = response.NextContinuationToken;
  } while (nextToken);

  return buckets;
}

// Publish metrics to CloudWatch
async function publishMetrics(totalBuckets, compliantBuckets) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: 'S3Compliance',
      MetricData: [
        { MetricName: 'TotalBuckets', Value: totalBuckets, Unit: 'Count', Timestamp: new Date() },
        { MetricName: 'CompliantBuckets', Value: compliantBuckets, Unit: 'Count', Timestamp: new Date() },
        { MetricName: 'NonCompliantBuckets', Value: totalBuckets - compliantBuckets, Unit: 'Count', Timestamp: new Date() },
      ],
    });
    await cloudwatchClient.send(command);
  } catch (error) {
    console.error(`Error publishing metrics: ${error.message}`);
  }
}
```

### File: lib/lambda/compliance-checker/package.json

```json
{
  "name": "s3-compliance-checker",
  "version": "1.0.0",
  "description": "Lambda function for S3 bucket compliance checking",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-sns": "^3.400.0",
    "@aws-sdk/client-sqs": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  }
}
```

## Key Features

| Feature | Description |
|---------|-------------|
| Project Structure | TapStack ComponentResource class pattern |
| Pagination | Supports 1000+ buckets |
| Lambda Code | Fully functional with AWS SDK v3 |
| Error Handling | Exponential backoff retry logic |
| CloudWatch Metrics | Uses GetBucketMetricsConfiguration |
| Idempotency | Checks existing state before updating |

## Conclusion

This implementation uses the correct TapStack ComponentResource pattern required by the project structure and delivers a production-ready S3 compliance analysis tool with all required AWS services integrated.
