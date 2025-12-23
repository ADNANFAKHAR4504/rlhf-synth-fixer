# Lambda Function Optimization - Initial Model Response

This document contains the initial model-generated code for Lambda function optimization. This version contains several issues that need to be addressed in the ideal response.

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// IAM Role for Lambda
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    }),
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// Attach basic execution policy
new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
});

// DynamoDB Table
const dynamoTable = new aws.dynamodb.Table(`transactions-table-${environmentSuffix}`, {
    name: `transactions-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "transactionId",
    attributes: [{
        name: "transactionId",
        type: "S"
    }],
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// SQS Queue for DLQ
const dlqQueue = new aws.sqs.Queue(`lambda-dlq-${environmentSuffix}`, {
    name: `lambda-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// Lambda Layer for shared dependencies
const sharedLayer = new aws.lambda.LayerVersion(`shared-dependencies-${environmentSuffix}`, {
    layerName: `shared-deps-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
        "nodejs": new pulumi.asset.FileArchive("./lambda-layer")
    }),
    compatibleRuntimes: ["nodejs18.x"],
    description: "Shared dependencies layer"
});

// Consolidated Lambda Function
const consolidatedLambda = new aws.lambda.Function(`optimized-lambda-${environmentSuffix}`, {
    name: `optimized-lambda-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
                const route = event.route || 'payment';

                switch(route) {
                    case 'payment':
                        return await processPayment(event);
                    case 'fraud':
                        return await detectFraud(event);
                    case 'notification':
                        return await sendNotification(event);
                    default:
                        throw new Error('Invalid route');
                }
            };

            async function processPayment(event) {
                console.log('Processing payment:', event);
                return { statusCode: 200, body: 'Payment processed' };
            }

            async function detectFraud(event) {
                console.log('Detecting fraud:', event);
                return { statusCode: 200, body: 'Fraud check complete' };
            }

            async function sendNotification(event) {
                console.log('Sending notification:', event);
                return { statusCode: 200, body: 'Notification sent' };
            }
        `)
    }),
    memorySize: 3008, // ISSUE: Too high - should be 1024 MB
    timeout: 30,
    environment: {
        variables: {
            DYNAMODB_TABLE: dynamoTable.name,
            REGION: region,
            ENVIRONMENT: environmentSuffix
        }
    },
    layers: [sharedLayer.arn],
    deadLetterConfig: {
        targetArn: dlqQueue.arn
    },
    tracingConfig: {
        mode: "Active" // X-Ray enabled
    },
    // ISSUE: Missing SnapStart configuration
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// ISSUE: Reserved concurrency not configured
// ISSUE: Should be set to 100

// IAM Policy for DynamoDB access
const dynamoPolicy = new aws.iam.RolePolicy(`lambda-dynamodb-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([dynamoTable.arn]).apply(([tableArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resource: tableArn
        }]
    }))
});

// IAM Policy for SQS access
const sqsPolicy = new aws.iam.RolePolicy(`lambda-sqs-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([dlqQueue.arn]).apply(([queueArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "sqs:SendMessage",
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes"
            ],
            Resource: queueArn
        }]
    }))
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup(`lambda-logs-${environmentSuffix}`, {
    name: `/aws/lambda/optimized-lambda-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// CloudWatch Alarm for Errors
const errorAlarm = new aws.cloudwatch.MetricAlarm(`lambda-error-alarm-${environmentSuffix}`, {
    name: `lambda-errors-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Sum",
    threshold: 10, // ISSUE: Should be based on error rate (1%), not absolute count
    dimensions: {
        FunctionName: consolidatedLambda.name
    },
    alarmDescription: "Triggers when Lambda error count exceeds threshold",
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// CloudWatch Alarm for Duration
const durationAlarm = new aws.cloudwatch.MetricAlarm(`lambda-duration-alarm-${environmentSuffix}`, {
    name: `lambda-duration-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Duration",
    namespace: "AWS/Lambda",
    period: 300,
    statistic: "Average",
    threshold: 3000,
    dimensions: {
        FunctionName: consolidatedLambda.name
    },
    alarmDescription: "Triggers when Lambda duration exceeds 3 seconds",
    tags: {
        Environment: environmentSuffix,
        ManagedBy: "Pulumi"
    }
});

// Exports
export const lambdaFunctionName = consolidatedLambda.name;
export const lambdaFunctionArn = consolidatedLambda.arn;
export const dynamoTableName = dynamoTable.name;
export const dlqQueueUrl = dlqQueue.url;
export const layerArn = sharedLayer.arn;
```

## Issues Identified

1. **Memory Size Too High**: Lambda configured with 3008 MB instead of optimized 1024 MB
2. **Missing SnapStart**: SnapStart configuration not implemented
3. **Missing Reserved Concurrency**: Should be set to 100 to prevent throttling
4. **Error Alarm Threshold**: Uses absolute count instead of error rate percentage
5. **DLQ Retry Configuration**: Missing retry attempts configuration (should be max 2)
6. **Layer Archive Path**: References `./lambda-layer` which may not exist
7. **Incomplete IAM Policies**: X-Ray permissions not added despite tracing being enabled

These issues need to be addressed in the IDEAL_RESPONSE.md.
