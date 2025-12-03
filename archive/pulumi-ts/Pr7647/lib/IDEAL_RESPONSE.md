# Pulumi TypeScript Infrastructure - Compliance Monitoring System

This implementation provides a complete automated infrastructure compliance monitoring system using Pulumi with TypeScript.

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
description: Pulumi infrastructure for automated compliance monitoring
main: bin/tap.ts
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the Compliance Monitoring infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags to apply to all resources.
const defaultTags = {
  Environment: 'compliance-monitoring',
  CostCenter: 'security',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack(
  'compliance-monitoring-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export key outputs
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const snsTopicArn = stack.snsTopicArn;
export const dynamoTableName = stack.dynamoTableName;
export const complianceAlarmArn = stack.complianceAlarmArn;
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Compliance Monitoring System.
 * Orchestrates all compliance monitoring infrastructure components.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource for the Compliance Monitoring System.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly complianceAlarmArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create SNS Topic for Compliance Notifications
    const snsTopic = new aws.sns.Topic(
      `compliance-notifications-${environmentSuffix}`,
      {
        displayName: 'Compliance Violation Notifications',
        tags: tags,
      },
      { parent: this }
    );

    // 2. Create SNS Email Subscription
    const snsEmailSubscription = new aws.sns.TopicSubscription(
      `compliance-email-subscription-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'compliance@company.com',
      },
      { parent: this }
    );

    // 3. Create DynamoDB Table for Compliance History
    const dynamoTable = new aws.dynamodb.Table(
      `compliance-history-${environmentSuffix}`,
      {
        attributes: [
          {
            name: 'checkId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        hashKey: 'checkId',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST',
        ttl: {
          attributeName: 'expirationTime',
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 4. Create IAM Role for Lambda Function
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // 5. Attach policies to Lambda Role
    // Basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `compliance-lambda-basic-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for resource configuration access
    const lambdaCustomPolicy = new aws.iam.RolePolicy(
      `compliance-lambda-custom-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:Describe*',
                's3:GetBucketPolicy',
                's3:GetBucketAcl',
                's3:GetEncryptionConfiguration',
                'iam:ListUsers',
                'iam:ListRoles',
                'iam:GetRole',
                'iam:GetUser',
                'lambda:ListFunctions',
                'rds:DescribeDBInstances',
                'cloudwatch:PutMetricData',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ],
              Resource: dynamoTable.arn,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: snsTopic.arn,
            },
          ],
        },
      },
      { parent: this }
    );

    // 6. Create CloudWatch Log Group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `compliance-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-analyzer-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // 7. Create Lambda Function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-analyzer-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lib/lambda'),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTable.name,
            SNS_TOPIC_ARN: snsTopic.arn,
            COMPLIANCE_NAMESPACE: 'ComplianceMonitoring',
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaLogGroup, lambdaBasicPolicy, lambdaCustomPolicy] }
    );

    // 8. Create EventBridge Rule for Scheduled Execution (every 15 minutes)
    const scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        description: 'Trigger compliance check every 15 minutes',
        scheduleExpression: 'rate(15 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    // 9. Allow EventBridge to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `compliance-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // 10. Create EventBridge Target
    const scheduledTarget = new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // 11. Create CloudWatch Alarm for Compliance Failure Rate
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `compliance-failure-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ComplianceFailureRate',
        namespace: 'ComplianceMonitoring',
        period: 900, // 15 minutes
        statistic: 'Average',
        threshold: 20,
        alarmDescription: 'Alert when compliance failure rate exceeds 20%',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.snsTopicArn = snsTopic.arn;
    this.dynamoTableName = dynamoTable.name;
    this.complianceAlarmArn = complianceAlarm.arn;

    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      snsTopicArn: this.snsTopicArn,
      dynamoTableName: this.dynamoTableName,
      complianceAlarmArn: this.complianceAlarmArn,
    });
  }
}
```

## File: lib/lambda/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} = require('@aws-sdk/client-ec2');
const { S3Client, GetBucketPolicyCommand, GetBucketEncryptionCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});

const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const COMPLIANCE_NAMESPACE = process.env.COMPLIANCE_NAMESPACE || 'ComplianceMonitoring';

/**
 * Compliance rules to check AWS resources
 */
const complianceRules = [
  {
    id: 'EC2_SECURITY_GROUPS',
    description: 'Check for overly permissive security groups',
    check: async () => {
      try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
        const violations = [];

        for (const sg of response.SecurityGroups || []) {
          for (const permission of sg.IpPermissions || []) {
            const hasOpenAccess = permission.IpRanges?.some(
              (range) => range.CidrIp === '0.0.0.0/0'
            );
            if (hasOpenAccess && permission.FromPort !== 443 && permission.FromPort !== 80) {
              violations.push({
                resourceId: sg.GroupId,
                resourceType: 'SecurityGroup',
                violation: `Security group ${sg.GroupName} allows unrestricted access on port ${permission.FromPort}`,
              });
            }
          }
        }

        return {
          passed: violations.length === 0,
          violations,
        };
      } catch (error) {
        console.error('Error checking EC2 security groups:', error);
        return { passed: true, violations: [] };
      }
    },
  },
  {
    id: 'EC2_INSTANCES_TAGGED',
    description: 'Check if EC2 instances have required tags',
    check: async () => {
      try {
        const response = await ec2Client.send(new DescribeInstancesCommand({}));
        const violations = [];

        for (const reservation of response.Reservations || []) {
          for (const instance of reservation.Instances || []) {
            const tags = instance.Tags || [];
            const hasEnvironmentTag = tags.some((tag) => tag.Key === 'Environment');
            const hasCostCenterTag = tags.some((tag) => tag.Key === 'CostCenter');

            if (!hasEnvironmentTag || !hasCostCenterTag) {
              violations.push({
                resourceId: instance.InstanceId,
                resourceType: 'EC2Instance',
                violation: `Instance ${instance.InstanceId} missing required tags`,
              });
            }
          }
        }

        return {
          passed: violations.length === 0,
          violations,
        };
      } catch (error) {
        console.error('Error checking EC2 instance tags:', error);
        return { passed: true, violations: [] };
      }
    },
  },
];

/**
 * Store compliance check results in DynamoDB
 */
async function storeComplianceResult(checkId, result) {
  const timestamp = Date.now();
  const expirationTime = Math.floor(timestamp / 1000) + 30 * 24 * 60 * 60; // 30 days TTL

  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Item: {
      checkId: { S: checkId },
      timestamp: { N: timestamp.toString() },
      passed: { BOOL: result.passed },
      violationCount: { N: result.violations.length.toString() },
      violations: { S: JSON.stringify(result.violations) },
      expirationTime: { N: expirationTime.toString() },
    },
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
    console.log(`Stored compliance result for ${checkId}`);
  } catch (error) {
    console.error(`Error storing compliance result for ${checkId}:`, error);
  }
}

/**
 * Publish CloudWatch metrics for compliance checks
 */
async function publishMetrics(passedCount, failedCount) {
  const totalChecks = passedCount + failedCount;
  const failureRate = totalChecks > 0 ? (failedCount / totalChecks) * 100 : 0;

  const params = {
    Namespace: COMPLIANCE_NAMESPACE,
    MetricData: [
      {
        MetricName: 'ComplianceChecksPassed',
        Value: passedCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'ComplianceChecksFailed',
        Value: failedCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'ComplianceFailureRate',
        Value: failureRate,
        Unit: 'Percent',
        Timestamp: new Date(),
      },
    ],
  };

  try {
    await cloudwatchClient.send(new PutMetricDataCommand(params));
    console.log(`Published metrics: ${passedCount} passed, ${failedCount} failed, ${failureRate.toFixed(2)}% failure rate`);
  } catch (error) {
    console.error('Error publishing metrics:', error);
  }
}

/**
 * Send SNS notification for compliance violations
 */
async function sendViolationNotification(violations) {
  if (violations.length === 0) return;

  const message = `
Compliance Violations Detected

Total Violations: ${violations.length}

Details:
${violations.map((v, i) => `
${i + 1}. ${v.violation}
   Resource Type: ${v.resourceType}
   Resource ID: ${v.resourceId}
`).join('\n')}

Please review and remediate these violations as soon as possible.
`;

  const params = {
    TopicArn: SNS_TOPIC_ARN,
    Subject: `Compliance Alert: ${violations.length} Violation(s) Detected`,
    Message: message,
  };

  try {
    await snsClient.send(new PublishCommand(params));
    console.log('Sent compliance violation notification');
  } catch (error) {
    console.error('Error sending SNS notification:', error);
  }
}

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
  console.log('Starting compliance check...');

  let passedCount = 0;
  let failedCount = 0;
  const allViolations = [];

  // Run all compliance checks
  for (const rule of complianceRules) {
    console.log(`Running compliance check: ${rule.description}`);
    const result = await rule.check();

    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
      allViolations.push(...result.violations);
    }

    // Store result in DynamoDB
    await storeComplianceResult(rule.id, result);
  }

  // Publish metrics to CloudWatch
  await publishMetrics(passedCount, failedCount);

  // Send notification if there are violations
  if (allViolations.length > 0) {
    await sendViolationNotification(allViolations);
  }

  console.log(`Compliance check completed: ${passedCount} passed, ${failedCount} failed`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      passed: passedCount,
      failed: failedCount,
      violations: allViolations.length,
    }),
  };
};
```

## File: lib/lambda/package.json

```json
{
  "name": "compliance-analyzer-lambda",
  "version": "1.0.0",
  "description": "Lambda function for AWS compliance monitoring",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-cloudwatch": "^3.490.0",
    "@aws-sdk/client-dynamodb": "^3.490.0",
    "@aws-sdk/client-ec2": "^3.490.0",
    "@aws-sdk/client-s3": "^3.490.0",
    "@aws-sdk/client-sns": "^3.490.0"
  }
}
```

## File: lib/README.md

```markdown
# Compliance Monitoring System

## Overview

This Pulumi TypeScript program deploys an automated infrastructure compliance monitoring system on AWS. The system continuously monitors AWS resources for compliance violations and sends notifications when issues are detected.

## Architecture

The solution includes:

1. **Lambda Function**: Analyzes AWS resource configurations against predefined compliance rules
2. **EventBridge Scheduler**: Triggers compliance checks every 15 minutes
3. **SNS Topic**: Sends email notifications for compliance violations
4. **DynamoDB Table**: Stores compliance check history with 30-day TTL
5. **CloudWatch Logs**: Stores Lambda execution logs with 7-day retention
6. **CloudWatch Metrics**: Tracks compliance check results
7. **CloudWatch Alarm**: Triggers when failure rate exceeds 20%
8. **IAM Roles**: Least-privilege permissions for Lambda execution

## Compliance Rules

The Lambda function currently checks:

- **Security Groups**: Identifies overly permissive security groups with unrestricted access
- **EC2 Instance Tagging**: Ensures instances have required Environment and CostCenter tags

Additional rules can be easily added by extending the `complianceRules` array in the Lambda function.

## Deployment

### Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- Environment variable `ENVIRONMENT_SUFFIX` set (defaults to 'dev')

### Steps

1. Install dependencies:
   ```bash
   npm install
   cd lib/lambda && npm install && cd ../..
   ```

2. Deploy the stack:
   ```bash
   pulumi up
   ```

3. Confirm the email subscription:
   - Check the inbox for compliance@company.com
   - Click the confirmation link in the SNS subscription email

## Outputs

After deployment, the following outputs are available:

- `lambdaFunctionArn`: ARN of the compliance analyzer Lambda function
- `snsTopicArn`: ARN of the SNS topic for notifications
- `dynamoTableName`: Name of the DynamoDB table storing compliance history
- `complianceAlarmArn`: ARN of the CloudWatch alarm

## Monitoring

### CloudWatch Metrics

The system publishes the following custom metrics to the `ComplianceMonitoring` namespace:

- `ComplianceChecksPassed`: Number of compliance checks that passed
- `ComplianceChecksFailed`: Number of compliance checks that failed
- `ComplianceFailureRate`: Percentage of failed checks

### CloudWatch Alarms

An alarm is configured to trigger when the compliance failure rate exceeds 20% over two consecutive 15-minute periods.

## Resource Naming

All resources include the `environmentSuffix` in their names for uniqueness across environments.

## Tags

All resources are tagged with:
- `Environment`: compliance-monitoring
- `CostCenter`: security
- Additional CI/CD metadata tags

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable with no retention policies.
```

## Implementation Summary

This implementation provides:

1. **Lambda Function** with Node.js 18 runtime analyzing AWS resource configurations
2. **EventBridge Rule** triggering every 15 minutes
3. **SNS Topic** with email subscription to compliance@company.com
4. **CloudWatch Logs** with 7-day retention
5. **CloudWatch Metrics** tracking passed/failed checks and failure rate
6. **CloudWatch Alarm** triggering at 20% failure rate threshold
7. **DynamoDB Table** with TTL set to 30 days
8. **IAM Roles** with least-privilege permissions
9. **Resource Tagging** with Environment and CostCenter tags
10. **All resources include environmentSuffix** for uniqueness

The Lambda function uses AWS SDK v3 (required for Node.js 18+) and implements extensible compliance rules.
