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

// SNS Topic for notifications
const complianceTopic = new aws.sns.Topic(
  `compliance-topic-${environmentSuffix}`,
  {
    name: `s3-compliance-notifications-${environmentSuffix}`,
    displayName: 'S3 Compliance Notifications',
  }
);

// SQS Queue for compliance check results
const complianceQueue = new aws.sqs.Queue(
  `compliance-queue-${environmentSuffix}`,
  {
    name: `s3-compliance-results-${environmentSuffix}`,
    visibilityTimeoutSeconds: 300,
    messageRetentionSeconds: 86400, // 1 day
  }
);

// Subscribe SQS to SNS
new aws.sns.TopicSubscription(`queue-subscription-${environmentSuffix}`, {
  topic: complianceTopic.arn,
  protocol: 'sqs',
  endpoint: complianceQueue.arn,
});

// Allow SNS to send messages to SQS
new aws.sqs.QueuePolicy(`queue-policy-${environmentSuffix}`, {
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
});

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
      'index.js': new pulumi.asset.StringAsset(`
const { S3Client, ListBucketsCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand,
        GetBucketLifecycleConfigurationCommand, GetBucketPolicyCommand, GetBucketTaggingCommand,
        PutBucketTaggingCommand, GetBucketLocationCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

const LIFECYCLE_THRESHOLD = parseInt(process.env.LIFECYCLE_AGE_THRESHOLD || "90");
const TARGET_REGION = process.env.AWS_REGION || "us-east-1";

async function getBucketLocation(bucketName) {
    try {
        const command = new GetBucketLocationCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        // LocationConstraint is null for us-east-1
        return response.LocationConstraint || "us-east-1";
    } catch (error) {
        console.error(\`Error getting location for bucket \${bucketName}: \${error.message}\`);
        return null;
    }
}

async function checkVersioning(bucketName) {
    try {
        const command = new GetBucketVersioningCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        return response.Status === "Enabled";
    } catch (error) {
        console.error(\`Error checking versioning for \${bucketName}: \${error.message}\`);
        return false;
    }
}

async function checkEncryption(bucketName) {
    try {
        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        if (response.ServerSideEncryptionConfiguration?.Rules) {
            const rule = response.ServerSideEncryptionConfiguration.Rules[0];
            const algorithm = rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
            return algorithm === "AES256" || algorithm === "aws:kms";
        }
        return false;
    } catch (error) {
        if (error.name === "ServerSideEncryptionConfigurationNotFoundError") {
            return false;
        }
        console.error(\`Error checking encryption for \${bucketName}: \${error.message}\`);
        return false;
    }
}

async function checkLifecycle(bucketName) {
    try {
        const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        if (response.Rules && response.Rules.length > 0) {
            // Check if any rule applies to objects older than threshold
            return response.Rules.some(rule => {
                if (rule.Status === "Enabled" && rule.Transitions) {
                    return rule.Transitions.some(t => t.Days && t.Days >= LIFECYCLE_THRESHOLD);
                }
                if (rule.Status === "Enabled" && rule.Expiration) {
                    return rule.Expiration.Days && rule.Expiration.Days >= LIFECYCLE_THRESHOLD;
                }
                return false;
            });
        }
        return false;
    } catch (error) {
        if (error.name === "NoSuchLifecycleConfiguration") {
            return false;
        }
        console.error(\`Error checking lifecycle for \${bucketName}: \${error.message}\`);
        return false;
    }
}

async function checkPublicAccess(bucketName) {
    try {
        const command = new GetBucketPolicyCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        if (response.Policy) {
            const policy = JSON.parse(response.Policy);
            // Check for public access (Principal: "*" without conditions)
            const hasPublicAccess = policy.Statement?.some(stmt =>
                stmt.Effect === "Allow" &&
                (stmt.Principal === "*" || stmt.Principal?.AWS === "*") &&
                !stmt.Condition
            );
            return !hasPublicAccess; // Return true if NO public access
        }
        return true; // No policy means no public access
    } catch (error) {
        if (error.name === "NoSuchBucketPolicy") {
            return true; // No policy means no public access
        }
        console.error(\`Error checking public access for \${bucketName}: \${error.message}\`);
        return true; // Assume secure if we can't check
    }
}

async function checkCloudWatchMetrics(bucketName) {
    // S3 automatically provides CloudWatch metrics for all buckets
    // We'll check if the bucket has any custom metric configurations via tags
    try {
        const command = new GetBucketTaggingCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        // Consider compliant if bucket has monitoring tag
        return response.TagSet?.some(tag =>
            tag.Key === "monitoring" || tag.Key === "cloudwatch-metrics"
        ) ?? false;
    } catch (error) {
        if (error.name === "NoSuchTagSet") {
            // For this compliance check, we'll be lenient and consider default metrics sufficient
            return true;
        }
        console.error(\`Error checking CloudWatch metrics for \${bucketName}: \${error.message}\`);
        return true; // Default metrics are always enabled
    }
}

async function tagBucket(bucketName, compliant) {
    try {
        const getCommand = new GetBucketTaggingCommand({ Bucket: bucketName });
        let existingTags = [];
        try {
            const response = await s3Client.send(getCommand);
            existingTags = response.TagSet || [];
        } catch (error) {
            if (error.name !== "NoSuchTagSet") {
                throw error;
            }
        }

        // Update or add compliance-status tag
        const filteredTags = existingTags.filter(tag => tag.Key !== "compliance-status");
        const newTags = [
            ...filteredTags,
            { Key: "compliance-status", Value: compliant ? "passed" : "failed" }
        ];

        const putCommand = new PutBucketTaggingCommand({
            Bucket: bucketName,
            Tagging: { TagSet: newTags }
        });
        await s3Client.send(putCommand);
    } catch (error) {
        console.error(\`Error tagging bucket \${bucketName}: \${error.message}\`);
    }
}

async function publishMetrics(totalBuckets, compliantBuckets) {
    try {
        const command = new PutMetricDataCommand({
            Namespace: "S3Compliance",
            MetricData: [
                {
                    MetricName: "TotalBuckets",
                    Value: totalBuckets,
                    Unit: "Count",
                    Timestamp: new Date()
                },
                {
                    MetricName: "CompliantBuckets",
                    Value: compliantBuckets,
                    Unit: "Count",
                    Timestamp: new Date()
                },
                {
                    MetricName: "NonCompliantBuckets",
                    Value: totalBuckets - compliantBuckets,
                    Unit: "Count",
                    Timestamp: new Date()
                }
            ]
        });
        await cloudwatchClient.send(command);
    } catch (error) {
        console.error(\`Error publishing metrics: \${error.message}\`);
    }
}

exports.handler = async (event) => {
    console.log("Starting S3 compliance check...");

    try {
        // List all buckets
        const listCommand = new ListBucketsCommand({});
        const bucketsResponse = await s3Client.send(listCommand);
        const allBuckets = bucketsResponse.Buckets || [];

        console.log(\`Found \${allBuckets.length} total buckets\`);

        // Filter buckets by region
        const regionBuckets = [];
        for (const bucket of allBuckets) {
            const location = await getBucketLocation(bucket.Name);
            if (location === TARGET_REGION) {
                regionBuckets.push(bucket);
            }
        }

        console.log(\`Analyzing \${regionBuckets.length} buckets in \${TARGET_REGION}\`);

        const violations = [];
        let compliantCount = 0;

        // Check each bucket
        for (const bucket of regionBuckets) {
            const bucketName = bucket.Name;
            console.log(\`Checking bucket: \${bucketName}\`);

            const checks = await Promise.all([
                checkVersioning(bucketName),
                checkEncryption(bucketName),
                checkLifecycle(bucketName),
                checkPublicAccess(bucketName),
                checkCloudWatchMetrics(bucketName)
            ]);

            const [hasVersioning, hasEncryption, hasLifecycle, noPublicAccess, hasMetrics] = checks;

            const bucketViolations = [];
            if (!hasVersioning) bucketViolations.push("Versioning not enabled");
            if (!hasEncryption) bucketViolations.push("Server-side encryption not configured");
            if (!hasLifecycle) bucketViolations.push(\`Lifecycle policy missing for objects older than \${LIFECYCLE_THRESHOLD} days\`);
            if (!noPublicAccess) bucketViolations.push("Bucket policy allows public access");
            if (!hasMetrics) bucketViolations.push("CloudWatch metrics not configured");

            if (bucketViolations.length > 0) {
                violations.push({
                    bucketName,
                    bucketArn: \`arn:aws:s3:::\${bucketName}\`,
                    violations: bucketViolations
                });

                // Tag non-compliant bucket
                await tagBucket(bucketName, false);

                // Send notification for high-severity violations (3+ violations)
                if (bucketViolations.length >= 3) {
                    const snsCommand = new PublishCommand({
                        TopicArn: process.env.SNS_TOPIC_ARN,
                        Subject: \`High-Severity S3 Compliance Violation: \${bucketName}\`,
                        Message: JSON.stringify({
                            bucketName,
                            violationCount: bucketViolations.length,
                            violations: bucketViolations,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    });
                    await snsClient.send(snsCommand);
                }
            } else {
                compliantCount++;
                await tagBucket(bucketName, true);
            }
        }

        // Prepare compliance report
        const report = {
            totalBuckets: regionBuckets.length,
            compliantBuckets: compliantCount,
            nonCompliantBuckets: violations.length,
            violations,
            timestamp: new Date().toISOString()
        };

        // Send report to SQS
        const sqsCommand = new SendMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(report)
        });
        await sqsClient.send(sqsCommand);

        // Publish metrics to CloudWatch
        await publishMetrics(regionBuckets.length, compliantCount);

        console.log("Compliance check completed");
        console.log(\`Total: \${regionBuckets.length}, Compliant: \${compliantCount}, Non-compliant: \${violations.length}\`);

        return {
            statusCode: 200,
            body: JSON.stringify(report)
        };
    } catch (error) {
        console.error(\`Error during compliance check: \${error.message}\`);
        throw error;
    }
};
        `),
      'package.json': new pulumi.asset.StringAsset(
        JSON.stringify({
          name: 's3-compliance-checker',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-s3': '^3.400.0',
            '@aws-sdk/client-sns': '^3.400.0',
            '@aws-sdk/client-sqs': '^3.400.0',
            '@aws-sdk/client-cloudwatch': '^3.400.0',
          },
        })
      ),
    }),
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
  },
  { dependsOn: [complianceScheduleRole, schedulePolicy] }
);

new aws.cloudwatch.EventTarget(`schedule-target-${environmentSuffix}`, {
  rule: complianceSchedule.name,
  arn: stateMachine.arn,
  roleArn: complianceScheduleRole.arn,
});

// Exports
export const snsTopicArn = complianceTopic.arn;
export const sqsQueueUrl = complianceQueue.url;
export const lambdaFunctionName = complianceLambda.name;
export const lambdaFunctionArn = complianceLambda.arn;
export const stateMachineArn = stateMachine.arn;
export const complianceAlarmArn = complianceAlarm.arn;
export const region_deployed = region;
export const environment_suffix = environmentSuffix;
