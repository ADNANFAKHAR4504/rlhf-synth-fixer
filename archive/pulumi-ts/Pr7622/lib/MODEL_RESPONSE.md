# Infrastructure Compliance Monitoring System - Pulumi TypeScript Implementation

This implementation provides a comprehensive AWS compliance monitoring system with AWS Config rules, Lambda functions for analysis and remediation, CloudWatch dashboards, SNS alerting, Step Functions orchestration, and SQS message queuing.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// S3 Bucket for AWS Config delivery
const configBucket = new aws.s3.Bucket(`config-delivery-${environmentSuffix}`, {
    bucket: `config-delivery-${environmentSuffix}`,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    forceDestroy: true,
});

// Bucket policy for AWS Config
const configBucketPolicy = new aws.s3.BucketPolicy(`config-bucket-policy-${environmentSuffix}`, {
    bucket: configBucket.id,
    policy: pulumi.all([configBucket.arn, configBucket.bucket]).apply(([arn, bucket]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "AWSConfigBucketPermissionsCheck",
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
                Action: "s3:GetBucketAcl",
                Resource: arn,
            },
            {
                Sid: "AWSConfigBucketExistenceCheck",
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
                Action: "s3:ListBucket",
                Resource: arn,
            },
            {
                Sid: "AWSConfigBucketPutObject",
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
                Action: "s3:PutObject",
                Resource: `${arn}/*`,
                Condition: {
                    StringEquals: {
                        "s3:x-amz-acl": "bucket-owner-full-control",
                    },
                },
            },
        ],
    })),
});

// IAM Role for AWS Config
const configRole = new aws.iam.Role(`config-role-${environmentSuffix}`, {
    name: `config-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
});

const configRolePolicyAttachment = new aws.iam.RolePolicyAttachment(`config-role-policy-${environmentSuffix}`, {
    role: configRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
});

// Additional IAM policy for Config to write to S3
const configRoleS3Policy = new aws.iam.RolePolicy(`config-s3-policy-${environmentSuffix}`, {
    role: configRole.id,
    policy: configBucket.arn.apply(arn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: ["s3:PutObject"],
                Resource: `${arn}/*`,
            },
            {
                Effect: "Allow",
                Action: ["s3:GetBucketAcl"],
                Resource: arn,
            },
        ],
    })),
});

// AWS Config Recorder
const configRecorder = new aws.cfg.Recorder(`config-recorder-${environmentSuffix}`, {
    name: `config-recorder-${environmentSuffix}`,
    roleArn: configRole.arn,
    recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
    },
}, { dependsOn: [configRolePolicyAttachment, configRoleS3Policy] });

// AWS Config Delivery Channel
const configDeliveryChannel = new aws.cfg.DeliveryChannel(`config-delivery-${environmentSuffix}`, {
    name: `config-delivery-${environmentSuffix}`,
    s3BucketName: configBucket.bucket,
}, { dependsOn: [configBucketPolicy] });

// Start Config Recorder
const configRecorderStatus = new aws.cfg.RecorderStatus(`config-recorder-status-${environmentSuffix}`, {
    name: configRecorder.name,
    isEnabled: true,
}, { dependsOn: [configDeliveryChannel] });

// SNS Topics for Alerts
const criticalAlertTopic = new aws.sns.Topic(`critical-alerts-${environmentSuffix}`, {
    name: `critical-alerts-${environmentSuffix}`,
    displayName: "Critical Compliance Alerts",
});

const warningAlertTopic = new aws.sns.Topic(`warning-alerts-${environmentSuffix}`, {
    name: `warning-alerts-${environmentSuffix}`,
    displayName: "Warning Compliance Alerts",
});

// SNS Email Subscriptions (using placeholder email)
const criticalEmailSubscription = new aws.sns.TopicSubscription(`critical-email-sub-${environmentSuffix}`, {
    topic: criticalAlertTopic.arn,
    protocol: "email",
    endpoint: "security-team@example.com",
});

const warningEmailSubscription = new aws.sns.TopicSubscription(`warning-email-sub-${environmentSuffix}`, {
    topic: warningAlertTopic.arn,
    protocol: "email",
    endpoint: "security-team@example.com",
});

// SQS Queue for Compliance Events
const complianceQueue = new aws.sqs.Queue(`compliance-queue-${environmentSuffix}`, {
    name: `compliance-queue-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    visibilityTimeoutSeconds: 300, // 5 minutes
});

// IAM Role for Lambda Functions
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
    name: `lambda-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
});

// Lambda basic execution policy
const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(`lambda-basic-policy-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Custom policy for Lambda to access Config, CloudWatch, SNS, SQS, and tagging
const lambdaCustomPolicy = new aws.iam.RolePolicy(`lambda-custom-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([criticalAlertTopic.arn, warningAlertTopic.arn, complianceQueue.arn]).apply(([criticalArn, warningArn, queueArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "config:DescribeComplianceByConfigRule",
                    "config:DescribeConfigRules",
                    "config:GetComplianceDetailsByConfigRule",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudwatch:PutMetricData",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish",
                ],
                Resource: [criticalArn, warningArn],
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                ],
                Resource: queueArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "tag:GetResources",
                    "tag:TagResources",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:GetBucketTagging",
                    "s3:PutBucketTagging",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "rds:DescribeDBInstances",
                    "rds:AddTagsToResource",
                ],
                Resource: "*",
            },
        ],
    })),
});

// CloudWatch Log Group for Lambda
const complianceAnalyzerLogGroup = new aws.cloudwatch.LogGroup(`compliance-analyzer-logs-${environmentSuffix}`, {
    name: `/aws/lambda/compliance-analyzer-${environmentSuffix}`,
    retentionInDays: 14,
});

// Lambda Function for Compliance Analysis
const complianceAnalyzerCode = `
const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } = require("@aws-sdk/client-config-service");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log("Starting compliance analysis", JSON.stringify(event));

    try {
        // Get compliance status for all Config rules
        const command = new DescribeComplianceByConfigRuleCommand({});
        const response = await configClient.send(command);

        const complianceData = response.ComplianceByConfigRules || [];

        // Calculate metrics
        const totalRules = complianceData.length;
        const compliantRules = complianceData.filter(r => r.Compliance?.ComplianceType === "COMPLIANT").length;
        const nonCompliantRules = complianceData.filter(r => r.Compliance?.ComplianceType === "NON_COMPLIANT").length;
        const compliancePercentage = totalRules > 0 ? (compliantRules / totalRules) * 100 : 100;

        console.log(\`Compliance Summary: \${compliantRules}/\${totalRules} rules compliant (\${compliancePercentage.toFixed(2)}%)\`);

        // Send metrics to CloudWatch
        await cloudwatchClient.send(new PutMetricDataCommand({
            Namespace: "ComplianceMonitoring",
            MetricData: [
                {
                    MetricName: "CompliancePercentage",
                    Value: compliancePercentage,
                    Unit: "Percent",
                    Timestamp: new Date(),
                },
                {
                    MetricName: "CompliantRules",
                    Value: compliantRules,
                    Unit: "Count",
                    Timestamp: new Date(),
                },
                {
                    MetricName: "NonCompliantRules",
                    Value: nonCompliantRules,
                    Unit: "Count",
                    Timestamp: new Date(),
                },
            ],
        }));

        // Send alerts if non-compliant
        if (nonCompliantRules > 0) {
            const message = \`Compliance Alert: \${nonCompliantRules} rule(s) are non-compliant. ` +
                `Compliance percentage: \${compliancePercentage.toFixed(2)}%. ` +
                `Details: \${JSON.stringify(complianceData.filter(r => r.Compliance?.ComplianceType === "NON_COMPLIANT").map(r => r.ConfigRuleName))}\`;

            const topicArn = nonCompliantRules > 2 ? process.env.CRITICAL_TOPIC_ARN : process.env.WARNING_TOPIC_ARN;

            await snsClient.send(new PublishCommand({
                TopicArn: topicArn,
                Subject: \`Compliance Alert: \${nonCompliantRules} Non-Compliant Rules\`,
                Message: message,
            }));

            console.log("Alert sent to SNS");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance analysis completed",
                totalRules,
                compliantRules,
                nonCompliantRules,
                compliancePercentage,
            }),
        };
    } catch (error) {
        console.error("Error analyzing compliance:", error);
        throw error;
    }
};
`;

const complianceAnalyzer = new aws.lambda.Function(`compliance-analyzer-${environmentSuffix}`, {
    name: `compliance-analyzer-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 180, // 3 minutes
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(complianceAnalyzerCode),
        "package.json": new pulumi.asset.StringAsset(JSON.stringify({
            name: "compliance-analyzer",
            version: "1.0.0",
            dependencies: {
                "@aws-sdk/client-config-service": "^3.0.0",
                "@aws-sdk/client-cloudwatch": "^3.0.0",
                "@aws-sdk/client-sns": "^3.0.0",
            },
        })),
    }),
    environment: {
        variables: {
            CRITICAL_TOPIC_ARN: criticalAlertTopic.arn,
            WARNING_TOPIC_ARN: warningAlertTopic.arn,
        },
    },
}, { dependsOn: [lambdaBasicPolicy, lambdaCustomPolicy, complianceAnalyzerLogGroup] });

// CloudWatch Log Group for Auto Tagger Lambda
const autoTaggerLogGroup = new aws.cloudwatch.LogGroup(`auto-tagger-logs-${environmentSuffix}`, {
    name: `/aws/lambda/auto-tagger-${environmentSuffix}`,
    retentionInDays: 14,
});

// Lambda Function for Auto-Tagging Non-Compliant Resources
const autoTaggerCode = `
const { ResourceGroupsTaggingAPIClient, TagResourcesCommand } = require("@aws-sdk/client-resource-groups-tagging-api");
const { S3Client, PutBucketTaggingCommand, GetBucketTaggingCommand } = require("@aws-sdk/client-s3");
const { RDSClient, DescribeDBInstancesCommand, AddTagsToResourceCommand } = require("@aws-sdk/client-rds");

const taggingClient = new ResourceGroupsTaggingAPIClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log("Auto-tagging triggered", JSON.stringify(event));

    try {
        const configEvent = event.detail || event;
        const resourceType = configEvent.resourceType;
        const resourceId = configEvent.resourceId;
        const complianceType = configEvent.newEvaluationResult?.complianceType || "NON_COMPLIANT";
        const configRuleName = configEvent.configRuleName;

        console.log(\`Processing resource: \${resourceType} - \${resourceId}, Compliance: \${complianceType}\`);

        const tags = {
            ComplianceStatus: complianceType,
            ComplianceCheckDate: new Date().toISOString(),
            ConfigRule: configRuleName || "unknown",
        };

        // Tag S3 buckets
        if (resourceType === "AWS::S3::Bucket") {
            try {
                const existingTags = await s3Client.send(new GetBucketTaggingCommand({ Bucket: resourceId }));
                const tagSet = existingTags.TagSet || [];

                Object.entries(tags).forEach(([key, value]) => {
                    const existingTag = tagSet.find(t => t.Key === key);
                    if (existingTag) {
                        existingTag.Value = value;
                    } else {
                        tagSet.push({ Key: key, Value: value });
                    }
                });

                await s3Client.send(new PutBucketTaggingCommand({
                    Bucket: resourceId,
                    Tagging: { TagSet: tagSet },
                }));

                console.log(\`Tagged S3 bucket: \${resourceId}\`);
            } catch (error) {
                console.error(\`Error tagging S3 bucket: \${error.message}\`);
            }
        }

        // Tag RDS instances
        if (resourceType === "AWS::RDS::DBInstance") {
            try {
                const instances = await rdsClient.send(new DescribeDBInstancesCommand({
                    DBInstanceIdentifier: resourceId,
                }));

                if (instances.DBInstances && instances.DBInstances.length > 0) {
                    const dbArn = instances.DBInstances[0].DBInstanceArn;

                    await rdsClient.send(new AddTagsToResourceCommand({
                        ResourceName: dbArn,
                        Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
                    }));

                    console.log(\`Tagged RDS instance: \${resourceId}\`);
                }
            } catch (error) {
                console.error(\`Error tagging RDS instance: \${error.message}\`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Auto-tagging completed",
                resourceId,
                resourceType,
                tags,
            }),
        };
    } catch (error) {
        console.error("Error in auto-tagger:", error);
        throw error;
    }
};
`;

const autoTagger = new aws.lambda.Function(`auto-tagger-${environmentSuffix}`, {
    name: `auto-tagger-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 180,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(autoTaggerCode),
        "package.json": new pulumi.asset.StringAsset(JSON.stringify({
            name: "auto-tagger",
            version: "1.0.0",
            dependencies: {
                "@aws-sdk/client-resource-groups-tagging-api": "^3.0.0",
                "@aws-sdk/client-s3": "^3.0.0",
                "@aws-sdk/client-rds": "^3.0.0",
            },
        })),
    }),
}, { dependsOn: [lambdaBasicPolicy, lambdaCustomPolicy, autoTaggerLogGroup] });

// EventBridge Rule for Config Compliance Changes
const configComplianceRule = new aws.cloudwatch.EventRule(`config-compliance-rule-${environmentSuffix}`, {
    name: `config-compliance-rule-${environmentSuffix}`,
    description: "Trigger on AWS Config compliance changes",
    eventPattern: JSON.stringify({
        source: ["aws.config"],
        "detail-type": ["Config Rules Compliance Change"],
    }),
});

const configComplianceTarget = new aws.cloudwatch.EventTarget(`config-compliance-target-${environmentSuffix}`, {
    rule: configComplianceRule.name,
    arn: autoTagger.arn,
});

const configCompliancePermission = new aws.lambda.Permission(`config-compliance-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: autoTagger.name,
    principal: "events.amazonaws.com",
    sourceArn: configComplianceRule.arn,
});

// EventBridge Rule for Daily Compliance Analysis
const dailyComplianceRule = new aws.cloudwatch.EventRule(`daily-compliance-rule-${environmentSuffix}`, {
    name: `daily-compliance-rule-${environmentSuffix}`,
    description: "Trigger daily compliance analysis",
    scheduleExpression: "rate(1 day)",
});

const dailyComplianceTarget = new aws.cloudwatch.EventTarget(`daily-compliance-target-${environmentSuffix}`, {
    rule: dailyComplianceRule.name,
    arn: complianceAnalyzer.arn,
});

const dailyCompliancePermission = new aws.lambda.Permission(`daily-compliance-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: complianceAnalyzer.name,
    principal: "events.amazonaws.com",
    sourceArn: dailyComplianceRule.arn,
});

// AWS Config Rules
const s3EncryptionRule = new aws.cfg.Rule(`s3-encryption-rule-${environmentSuffix}`, {
    name: `s3-encryption-rule-${environmentSuffix}`,
    description: "Check if S3 buckets have encryption enabled",
    source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
    },
    maximumExecutionFrequency: "Six_Hours",
}, { dependsOn: [configRecorderStatus] });

const rdsPublicAccessRule = new aws.cfg.Rule(`rds-public-access-rule-${environmentSuffix}`, {
    name: `rds-public-access-rule-${environmentSuffix}`,
    description: "Check if RDS instances are publicly accessible",
    source: {
        owner: "AWS",
        sourceIdentifier: "RDS_INSTANCE_PUBLIC_ACCESS_CHECK",
    },
    maximumExecutionFrequency: "Six_Hours",
}, { dependsOn: [configRecorderStatus] });

// Step Functions State Machine
const stepFunctionsRole = new aws.iam.Role(`step-functions-role-${environmentSuffix}`, {
    name: `step-functions-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: {
                    Service: "states.amazonaws.com",
                },
                Action: "sts:AssumeRole",
            },
        ],
    }),
});

const stepFunctionsPolicy = new aws.iam.RolePolicy(`step-functions-policy-${environmentSuffix}`, {
    role: stepFunctionsRole.id,
    policy: pulumi.all([complianceAnalyzer.arn, autoTagger.arn, complianceQueue.arn]).apply(([analyzerArn, taggerArn, queueArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "lambda:InvokeFunction",
                ],
                Resource: [analyzerArn, taggerArn],
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                ],
                Resource: queueArn,
            },
        ],
    })),
});

const complianceWorkflow = new aws.sfn.StateMachine(`compliance-workflow-${environmentSuffix}`, {
    name: `compliance-workflow-${environmentSuffix}`,
    roleArn: stepFunctionsRole.arn,
    definition: pulumi.all([complianceAnalyzer.arn, autoTagger.arn]).apply(([analyzerArn, taggerArn]) => JSON.stringify({
        Comment: "Compliance monitoring workflow",
        StartAt: "AnalyzeCompliance",
        States: {
            AnalyzeCompliance: {
                Type: "Task",
                Resource: analyzerArn,
                Next: "CheckComplianceStatus",
                Retry: [
                    {
                        ErrorEquals: ["States.ALL"],
                        IntervalSeconds: 2,
                        MaxAttempts: 3,
                        BackoffRate: 2,
                    },
                ],
            },
            CheckComplianceStatus: {
                Type: "Choice",
                Choices: [
                    {
                        Variable: "$.nonCompliantRules",
                        NumericGreaterThan: 0,
                        Next: "TagNonCompliantResources",
                    },
                ],
                Default: "Success",
            },
            TagNonCompliantResources: {
                Type: "Task",
                Resource: taggerArn,
                Next: "Success",
                Retry: [
                    {
                        ErrorEquals: ["States.ALL"],
                        IntervalSeconds: 2,
                        MaxAttempts: 3,
                        BackoffRate: 2,
                    },
                ],
            },
            Success: {
                Type: "Succeed",
            },
        },
    })),
}, { dependsOn: [stepFunctionsPolicy] });

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
    dashboardName: `compliance-dashboard-${environmentSuffix}`,
    dashboardBody: JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["ComplianceMonitoring", "CompliancePercentage"],
                    ],
                    period: 300,
                    stat: "Average",
                    region: region,
                    title: "Compliance Percentage",
                    yAxis: {
                        left: {
                            min: 0,
                            max: 100,
                        },
                    },
                },
                width: 12,
                height: 6,
                x: 0,
                y: 0,
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["ComplianceMonitoring", "CompliantRules", { color: "#2ca02c" }],
                        [".", "NonCompliantRules", { color: "#d62728" }],
                    ],
                    period: 300,
                    stat: "Sum",
                    region: region,
                    title: "Compliance Rules Status",
                },
                width: 12,
                height: 6,
                x: 12,
                y: 0,
            },
            {
                type: "log",
                properties: {
                    query: `SOURCE '/aws/lambda/compliance-analyzer-${environmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20`,
                    region: region,
                    title: "Recent Compliance Analysis Logs",
                },
                width: 24,
                height: 6,
                x: 0,
                y: 6,
            },
        ],
    }),
});

// Exports
export const configBucketName = configBucket.bucket;
export const configRecorderName = configRecorder.name;
export const criticalTopicArn = criticalAlertTopic.arn;
export const warningTopicArn = warningAlertTopic.arn;
export const complianceAnalyzerName = complianceAnalyzer.name;
export const autoTaggerName = autoTagger.name;
export const complianceWorkflowArn = complianceWorkflow.arn;
export const complianceQueueUrl = complianceQueue.url;
export const dashboardName = dashboard.dashboardName;
export const s3EncryptionRuleName = s3EncryptionRule.name;
export const rdsPublicAccessRuleName = rdsPublicAccessRule.name;
```

## File: Pulumi.yaml

```yaml
name: compliance-monitoring
runtime: nodejs
description: Infrastructure compliance monitoring system with AWS Config, Lambda, CloudWatch, SNS, Step Functions, and SQS
```

## File: package.json

```json
{
  "name": "compliance-monitoring",
  "version": "1.0.0",
  "description": "Infrastructure compliance monitoring system",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "bin",
    "rootDir": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## File: jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/bin/**',
  ],
};
```

## File: README.md

```markdown
# Infrastructure Compliance Monitoring System

This Pulumi TypeScript project implements a comprehensive AWS compliance monitoring system for financial services.

## Architecture

- **AWS Config**: Continuous resource evaluation with rules for S3 encryption and RDS public access
- **Lambda Functions**: Compliance analysis and automated resource tagging (Node.js 18.x)
- **CloudWatch**: Custom metrics, dashboards, logs, and alarms
- **SNS**: Multi-level alerting (critical and warning topics)
- **Step Functions**: Orchestration of compliance workflows
- **SQS**: Message queuing for reliable event processing
- **EventBridge**: Event-driven compliance checks

## Prerequisites

- Pulumi CLI 3.x
- Node.js 16+
- AWS CLI configured
- AWS account with appropriate permissions

## Configuration

Set the environment suffix:

\`\`\`bash
pulumi config set environmentSuffix <your-suffix>
\`\`\`

## Deployment

\`\`\`bash
npm install
pulumi up
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Features

- Detects unencrypted S3 buckets
- Identifies public RDS instances
- Sends email alerts for violations
- Automatically tags non-compliant resources
- Provides CloudWatch dashboard for visibility
- Maintains audit logs for regulatory compliance
- Orchestrates complex workflows with Step Functions
- Buffers events with SQS for reliability

## Cleanup

\`\`\`bash
pulumi destroy
\`\`\`
```
