# Cryptocurrency Price Alert System - Pulumi TypeScript Implementation

This implementation creates a serverless cryptocurrency price alert system using Pulumi with TypeScript.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

// Get the environment suffix from config
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Create SNS topic for price alerts with encryption
const alertTopic = new aws.sns.Topic(`price-alert-topic-${environmentSuffix}`, {
    displayName: "Cryptocurrency Price Alerts",
    kmsMasterKeyId: "alias/aws/sns",
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Create DynamoDB table for storing user alerts
const alertsTable = new aws.dynamodb.Table(`alerts-table-${environmentSuffix}`, {
    name: `crypto-alerts-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "userId",
    rangeKey: "alertId",
    attributes: [
        { name: "userId", type: "S" },
        { name: "alertId", type: "S" },
    ],
    pointInTimeRecovery: {
        enabled: true,
    },
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Create IAM role for webhook processor Lambda
const webhookLambdaRole = new aws.iam.Role(`webhook-lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(`webhook-lambda-basic-${environmentSuffix}`, {
    role: webhookLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Attach X-Ray write policy for tracing
new aws.iam.RolePolicyAttachment(`webhook-lambda-xray-${environmentSuffix}`, {
    role: webhookLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

// Create inline policy for DynamoDB access
const webhookLambdaPolicy = new aws.iam.RolePolicy(`webhook-lambda-policy-${environmentSuffix}`, {
    role: webhookLambdaRole.id,
    policy: pulumi.all([alertsTable.arn]).apply(([tableArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
            ],
            Resource: tableArn,
        }],
    })),
});

// Create KMS key for Lambda environment variables encryption
const lambdaKmsKey = new aws.kms.Key(`lambda-kms-key-${environmentSuffix}`, {
    description: "KMS key for Lambda environment variables encryption",
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Package webhook processor Lambda function
const webhookHandlerCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    // Create custom X-Ray subsegment
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('ProcessWebhook');

    try {
        // Parse webhook payload
        const body = JSON.parse(event.body || '{}');
        const { userId, alertId, cryptocurrency, targetPrice, currentPrice } = body;

        subsegment.addAnnotation('userId', userId);
        subsegment.addAnnotation('cryptocurrency', cryptocurrency);

        // Store or update alert in DynamoDB
        const params = {
            TableName: process.env.ALERTS_TABLE_NAME,
            Item: {
                userId,
                alertId,
                cryptocurrency,
                targetPrice,
                currentPrice,
                timestamp: new Date().toISOString(),
                status: 'active',
            },
        };

        await dynamodb.put(params).promise();

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Webhook processed successfully' }),
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        subsegment.addError(error);
        subsegment.close();

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
`;

// Write webhook handler to temp file
const webhookHandlerPath = "/tmp/webhook-handler.js";
fs.writeFileSync(webhookHandlerPath, webhookHandlerCode);

// Create webhook processor Lambda function
const webhookLambda = new aws.lambda.Function(`webhook-processor-${environmentSuffix}`, {
    name: `webhook-processor-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: webhookLambdaRole.arn,
    timeout: 30,
    memorySize: 1024,
    architectures: ["arm64"],
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(webhookHandlerCode),
    }),
    environment: {
        variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
        },
    },
    kmsKeyArn: lambdaKmsKey.arn,
    tracingConfig: {
        mode: "Active",
    },
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Create IAM role for price check Lambda
const priceCheckLambdaRole = new aws.iam.Role(`price-check-lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Attach policies for price check Lambda
new aws.iam.RolePolicyAttachment(`price-check-lambda-basic-${environmentSuffix}`, {
    role: priceCheckLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

new aws.iam.RolePolicyAttachment(`price-check-lambda-xray-${environmentSuffix}`, {
    role: priceCheckLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
});

// Create inline policy for DynamoDB and SNS access
const priceCheckLambdaPolicy = new aws.iam.RolePolicy(`price-check-lambda-policy-${environmentSuffix}`, {
    role: priceCheckLambdaRole.id,
    policy: pulumi.all([alertsTable.arn, alertTopic.arn]).apply(([tableArn, topicArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:GetItem",
                ],
                Resource: tableArn,
            },
            {
                Effect: "Allow",
                Action: ["sns:Publish"],
                Resource: topicArn,
            },
        ],
    })),
});

// Price check Lambda handler code
const priceCheckHandlerCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
    console.log('Starting price check...');

    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('CheckPrices');

    try {
        // Scan all active alerts
        const scanParams = {
            TableName: process.env.ALERTS_TABLE_NAME,
            FilterExpression: '#status = :active',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':active': 'active',
            },
        };

        const result = await dynamodb.scan(scanParams).promise();
        subsegment.addAnnotation('alertCount', result.Items.length);

        // Check each alert
        for (const alert of result.Items) {
            // Simulate price check (in production, would call real API)
            const currentPrice = Math.random() * 100000;

            if (currentPrice >= alert.targetPrice) {
                // Send SMS notification
                const message = \`Alert: \${alert.cryptocurrency} has reached your target price of $\${alert.targetPrice}. Current price: $\${currentPrice.toFixed(2)}\`;

                await sns.publish({
                    TopicArn: process.env.ALERT_TOPIC_ARN,
                    Message: message,
                    Subject: 'Crypto Price Alert Triggered',
                }).promise();

                console.log(\`Alert triggered for user \${alert.userId}: \${alert.cryptocurrency}\`);
            }
        }

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: \`Checked \${result.Items.length} alerts\` }),
        };
    } catch (error) {
        console.error('Error checking prices:', error);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
};
`;

// Create price check Lambda function
const priceCheckLambda = new aws.lambda.Function(`price-checker-${environmentSuffix}`, {
    name: `price-checker-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: priceCheckLambdaRole.arn,
    timeout: 60,
    memorySize: 512,
    architectures: ["arm64"],
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(priceCheckHandlerCode),
    }),
    environment: {
        variables: {
            ALERTS_TABLE_NAME: alertsTable.name,
            ALERT_TOPIC_ARN: alertTopic.arn,
        },
    },
    kmsKeyArn: lambdaKmsKey.arn,
    tracingConfig: {
        mode: "Active",
    },
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Create EventBridge rule to trigger price check every 5 minutes
const priceCheckRule = new aws.cloudwatch.EventRule(`price-check-rule-${environmentSuffix}`, {
    name: `price-check-schedule-${environmentSuffix}`,
    description: "Trigger price check Lambda every 5 minutes",
    scheduleExpression: "rate(5 minutes)",
    tags: {
        Environment: "production",
        Service: "price-alerts",
    },
});

// Grant EventBridge permission to invoke Lambda
const priceCheckLambdaPermission = new aws.lambda.Permission(`price-check-lambda-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: priceCheckLambda.name,
    principal: "events.amazonaws.com",
    sourceArn: priceCheckRule.arn,
});

// Create EventBridge target
const priceCheckTarget = new aws.cloudwatch.EventTarget(`price-check-target-${environmentSuffix}`, {
    rule: priceCheckRule.name,
    arn: priceCheckLambda.arn,
});

// Export stack outputs
export const webhookLambdaArn = webhookLambda.arn;
export const priceCheckLambdaArn = priceCheckLambda.arn;
export const alertsTableName = alertsTable.name;
export const alertTopicArn = alertTopic.arn;
export const webhookLambdaUrl = pulumi.interpolate`https://lambda.us-east-1.amazonaws.com/2015-03-31/functions/${webhookLambda.name}/invocations`;
```

## File: package.json

```json
{
  "name": "crypto-price-alerts",
  "version": "1.0.0",
  "description": "Serverless cryptocurrency price alert system",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "deploy": "pulumi up"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: Pulumi.yaml

```yaml
name: crypto-price-alerts
runtime: nodejs
description: Serverless cryptocurrency price alert system
config:
  aws:region:
    default: us-east-1
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
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

## Architecture Overview

This implementation creates:

1. **DynamoDB Table**: Stores user alerts with partition key `userId` and sort key `alertId`, with point-in-time recovery enabled
2. **SNS Topic**: Sends SMS notifications with AWS managed encryption
3. **Webhook Lambda**: Receives webhook events from exchanges, stores alerts in DynamoDB (ARM64, 1024MB, 30s timeout)
4. **Price Check Lambda**: Evaluates alerts every 5 minutes via EventBridge (ARM64, 512MB, 60s timeout)
5. **EventBridge Rule**: Triggers price check Lambda on schedule (rate: 5 minutes)
6. **IAM Roles**: Least privilege permissions for each Lambda function
7. **KMS Key**: Encrypts Lambda environment variables
8. **X-Ray Tracing**: Enabled on all Lambda functions with custom subsegments

All resources include `environmentSuffix` for uniqueness and proper tags for organization.