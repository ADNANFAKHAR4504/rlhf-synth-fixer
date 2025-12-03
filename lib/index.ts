/**
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

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = config.get('region') || 'us-east-1';

// Compliance thresholds
const complianceConfig = {
  lifecycleAgeThreshold: 90, // days
  alarmThreshold: 1, // number of violations to trigger alarm
};

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
  }
);

// SQS Queue for compliance check results
const complianceQueue = new aws.sqs.Queue(
  `compliance-queue-${environmentSuffix}`,
  {
    name: `s3-compliance-results-${environmentSuffix}`,
    visibilityTimeoutSeconds: 300,
    messageRetentionSeconds: 86400, // 1 day
    tags: {
      Environment: environmentSuffix,
      Purpose: 'S3 Compliance Results',
      ManagedBy: 'Pulumi',
    },
  }
);

// Subscribe SQS to SNS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queueSubscription = new aws.sns.TopicSubscription(
  `queue-subscription-${environmentSuffix}`,
  {
    topic: complianceTopic.arn,
    protocol: 'sqs',
    endpoint: complianceQueue.arn,
  }
);

// Allow SNS to send messages to SQS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              Principal: {
                Service: 'sns.amazonaws.com',
              },
              Action: 'sqs:SendMessage',
              Resource: queueArn,
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': topicArn,
                },
              },
            },
          ],
        })
      ),
  }
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
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      Environment: environmentSuffix,
      Purpose: 'Lambda Execution Role',
      ManagedBy: 'Pulumi',
    },
  }
);

// Attach policies to Lambda role
const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
  `lambda-basic-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
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
  }
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
        LIFECYCLE_AGE_THRESHOLD:
          complianceConfig.lifecycleAgeThreshold.toString(),
        AWS_REGION: region,
      },
    },
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lib/lambda/compliance-checker'),
    }),
    tags: {
      Environment: environmentSuffix,
      Purpose: 'S3 Compliance Checker',
      ManagedBy: 'Pulumi',
    },
  },
  { dependsOn: [lambdaRole, lambdaBasicPolicy, lambdaCustomPolicy] }
);

// IAM Role for Step Functions
const stepFunctionsRole = new aws.iam.Role(`sfn-role-${environmentSuffix}`, {
  name: `s3-compliance-sfn-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'states.amazonaws.com',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  }),
  tags: {
    Environment: environmentSuffix,
    Purpose: 'Step Functions Execution Role',
    ManagedBy: 'Pulumi',
  },
});

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
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      })
    ),
  }
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
          CheckSuccess: {
            Type: 'Succeed',
          },
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
  { dependsOn: [stepFunctionsRole, stepFunctionsPolicy] }
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
  }
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
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      Environment: environmentSuffix,
      Purpose: 'EventBridge Schedule Role',
      ManagedBy: 'Pulumi',
    },
  }
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
  }
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
  { dependsOn: [complianceScheduleRole, schedulePolicy] }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scheduleTarget = new aws.cloudwatch.EventTarget(
  `schedule-target-${environmentSuffix}`,
  {
    rule: complianceSchedule.name,
    arn: stateMachine.arn,
    roleArn: complianceScheduleRole.arn,
  }
);

// Exports
export const snsTopicArn = complianceTopic.arn;
export const sqsQueueUrl = complianceQueue.url;
export const sqsQueueArn = complianceQueue.arn;
export const lambdaFunctionName = complianceLambda.name;
export const lambdaFunctionArn = complianceLambda.arn;
export const stateMachineArn = stateMachine.arn;
export const stateMachineName = stateMachine.name;
export const complianceAlarmArn = complianceAlarm.arn;
export const complianceAlarmName = complianceAlarm.name;
export const eventRuleName = complianceSchedule.name;
export const eventRuleArn = complianceSchedule.arn;
export const regionDeployed = region;
export const environmentSuffixOutput = environmentSuffix;
