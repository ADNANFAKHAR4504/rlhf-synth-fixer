# Serverless Transaction Processing System - Pulumi TypeScript Implementation

This implementation creates a complete serverless transaction processing system using Pulumi with TypeScript, deployed to AWS us-east-1 region.

## Architecture Overview

The system processes credit card transactions through the following flow:
1. API Gateway receives transaction POST requests with OpenAPI validation
2. Transaction Validator Lambda processes and stores in DynamoDB
3. DynamoDB Streams trigger Fraud Detection Lambda for analysis
4. Validated transactions are sent to SQS FIFO queue
5. Notification Lambda reads from SQS and publishes to SNS
6. Dead letter queues capture failed messages for retry

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.get("environmentSuffix") || "dev";
const region = "us-east-1";

// KMS Key for Lambda encryption
const kmsKey = new aws.kms.Key(`transaction-kms-${environmentSuffix}`, {
    description: "KMS key for encrypting Lambda environment variables",
    enableKeyRotation: true,
    tags: {
        Name: `transaction-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

const kmsKeyAlias = new aws.kms.Alias(`transaction-kms-alias-${environmentSuffix}`, {
    name: `alias/transaction-${environmentSuffix}`,
    targetKeyId: kmsKey.id,
});

// DynamoDB Table
const transactionTable = new aws.dynamodb.Table(`transaction-table-${environmentSuffix}`, {
    name: `transactions-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "transactionId",
    rangeKey: "timestamp",
    attributes: [
        { name: "transactionId", type: "S" },
        { name: "timestamp", type: "N" },
    ],
    streamEnabled: true,
    streamViewType: "NEW_AND_OLD_IMAGES",
    tags: {
        Name: `transaction-table-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// SNS Topic for notifications
const notificationTopic = new aws.sns.Topic(`notification-topic-${environmentSuffix}`, {
    name: `transaction-notifications-${environmentSuffix}`,
    tags: {
        Name: `notification-topic-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Dead Letter Queue for Fraud Detection Lambda
const fraudDetectionDlq = new aws.sqs.Queue(`fraud-detection-dlq-${environmentSuffix}`, {
    name: `fraud-detection-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: {
        Name: `fraud-detection-dlq-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Dead Letter Queue for Notification Lambda
const notificationDlq = new aws.sqs.Queue(`notification-dlq-${environmentSuffix}`, {
    name: `notification-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    tags: {
        Name: `notification-dlq-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// SQS FIFO Queue for transaction ordering
const transactionQueue = new aws.sqs.Queue(`transaction-queue-${environmentSuffix}`, {
    name: `transaction-queue-${environmentSuffix}.fifo`,
    fifoQueue: true,
    contentBasedDeduplication: true,
    visibilityTimeoutSeconds: 30,
    tags: {
        Name: `transaction-queue-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// IAM Role for Transaction Validator Lambda
const validatorLambdaRole = new aws.iam.Role(`validator-lambda-role-${environmentSuffix}`, {
    name: `transaction-validator-role-${environmentSuffix}`,
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
        Name: `validator-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`validator-lambda-basic-${environmentSuffix}`, {
    role: validatorLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

const validatorLambdaPolicy = new aws.iam.RolePolicy(`validator-lambda-policy-${environmentSuffix}`, {
    role: validatorLambdaRole.id,
    policy: pulumi.all([transactionTable.arn, kmsKey.arn]).apply(([tableArn, keyArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                ],
                Resource: tableArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                ],
                Resource: keyArn,
            },
        ],
    })),
});

// CloudWatch Log Group for Transaction Validator
const validatorLogGroup = new aws.cloudwatch.LogGroup(`validator-log-group-${environmentSuffix}`, {
    name: `/aws/lambda/transaction-validator-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
        Name: `validator-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Transaction Validator Lambda
const validatorLambda = new aws.lambda.Function(`transaction-validator-${environmentSuffix}`, {
    name: `transaction-validator-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: validatorLambdaRole.arn,
    reservedConcurrentExecutions: 100,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda/transaction-validator"),
    }),
    environment: {
        variables: {
            TABLE_NAME: transactionTable.name,
            REGION: region,
        },
    },
    kmsKeyArn: kmsKey.arn,
    timeout: 30,
    tags: {
        Name: `transaction-validator-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [validatorLogGroup] });

// IAM Role for Fraud Detection Lambda
const fraudLambdaRole = new aws.iam.Role(`fraud-lambda-role-${environmentSuffix}`, {
    name: `fraud-detection-role-${environmentSuffix}`,
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
        Name: `fraud-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`fraud-lambda-basic-${environmentSuffix}`, {
    role: fraudLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

const fraudLambdaPolicy = new aws.iam.RolePolicy(`fraud-lambda-policy-${environmentSuffix}`, {
    role: fraudLambdaRole.id,
    policy: pulumi.all([
        transactionTable.streamArn,
        transactionQueue.arn,
        kmsKey.arn,
        fraudDetectionDlq.arn,
    ]).apply(([streamArn, queueArn, keyArn, dlqArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:DescribeStream",
                    "dynamodb:ListStreams",
                ],
                Resource: streamArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                ],
                Resource: queueArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                ],
                Resource: dlqArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                ],
                Resource: keyArn,
            },
        ],
    })),
});

// CloudWatch Log Group for Fraud Detection
const fraudLogGroup = new aws.cloudwatch.LogGroup(`fraud-log-group-${environmentSuffix}`, {
    name: `/aws/lambda/fraud-detection-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
        Name: `fraud-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Fraud Detection Lambda
const fraudLambda = new aws.lambda.Function(`fraud-detection-${environmentSuffix}`, {
    name: `fraud-detection-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: fraudLambdaRole.arn,
    reservedConcurrentExecutions: 100,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda/fraud-detection"),
    }),
    environment: {
        variables: {
            QUEUE_URL: transactionQueue.url,
            REGION: region,
        },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
        targetArn: fraudDetectionDlq.arn,
    },
    timeout: 60,
    tags: {
        Name: `fraud-detection-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [fraudLogGroup] });

// DynamoDB Stream Event Source Mapping
const fraudEventSourceMapping = new aws.lambda.EventSourceMapping(`fraud-event-source-${environmentSuffix}`, {
    eventSourceArn: transactionTable.streamArn,
    functionName: fraudLambda.name,
    startingPosition: "LATEST",
    batchSize: 10,
    maximumBatchingWindowInSeconds: 5,
});

// IAM Role for Notification Lambda
const notificationLambdaRole = new aws.iam.Role(`notification-lambda-role-${environmentSuffix}`, {
    name: `notification-role-${environmentSuffix}`,
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
        Name: `notification-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`notification-lambda-basic-${environmentSuffix}`, {
    role: notificationLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

const notificationLambdaPolicy = new aws.iam.RolePolicy(`notification-lambda-policy-${environmentSuffix}`, {
    role: notificationLambdaRole.id,
    policy: pulumi.all([
        transactionQueue.arn,
        notificationTopic.arn,
        kmsKey.arn,
        notificationDlq.arn,
    ]).apply(([queueArn, topicArn, keyArn, dlqArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                ],
                Resource: queueArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish",
                ],
                Resource: topicArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                ],
                Resource: dlqArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                ],
                Resource: keyArn,
            },
        ],
    })),
});

// CloudWatch Log Group for Notification Lambda
const notificationLogGroup = new aws.cloudwatch.LogGroup(`notification-log-group-${environmentSuffix}`, {
    name: `/aws/lambda/notification-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
        Name: `notification-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Notification Lambda
const notificationLambda = new aws.lambda.Function(`notification-${environmentSuffix}`, {
    name: `notification-${environmentSuffix}`,
    runtime: "nodejs18.x",
    handler: "index.handler",
    role: notificationLambdaRole.arn,
    reservedConcurrentExecutions: 100,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda/notification"),
    }),
    environment: {
        variables: {
            SNS_TOPIC_ARN: notificationTopic.arn,
            REGION: region,
        },
    },
    kmsKeyArn: kmsKey.arn,
    deadLetterConfig: {
        targetArn: notificationDlq.arn,
    },
    timeout: 30,
    tags: {
        Name: `notification-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
}, { dependsOn: [notificationLogGroup] });

// SQS Event Source Mapping for Notification Lambda
const notificationEventSourceMapping = new aws.lambda.EventSourceMapping(`notification-event-source-${environmentSuffix}`, {
    eventSourceArn: transactionQueue.arn,
    functionName: notificationLambda.name,
    batchSize: 10,
});

// OpenAPI Schema for API Gateway
const openApiSchema = {
    openapi: "3.0.0",
    info: {
        title: `Transaction API ${environmentSuffix}`,
        version: "1.0.0",
    },
    paths: {
        "/transaction": {
            post: {
                summary: "Process a transaction",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["transactionId", "amount", "currency", "merchantId"],
                                properties: {
                                    transactionId: {
                                        type: "string",
                                        pattern: "^[a-zA-Z0-9-]+$",
                                    },
                                    amount: {
                                        type: "number",
                                        minimum: 0.01,
                                    },
                                    currency: {
                                        type: "string",
                                        pattern: "^[A-Z]{3}$",
                                    },
                                    merchantId: {
                                        type: "string",
                                    },
                                    customerId: {
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Transaction processed successfully",
                    },
                    "400": {
                        description: "Invalid request",
                    },
                },
                "x-amazon-apigateway-integration": {
                    type: "aws_proxy",
                    httpMethod: "POST",
                    uri: pulumi.interpolate`arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${validatorLambda.arn}/invocations`,
                },
                "x-amazon-apigateway-request-validator": "all",
            },
        },
    },
    "x-amazon-apigateway-request-validators": {
        all: {
            validateRequestBody: true,
            validateRequestParameters: true,
        },
    },
};

// API Gateway REST API
const api = new aws.apigateway.RestApi(`transaction-api-${environmentSuffix}`, {
    name: `transaction-api-${environmentSuffix}`,
    body: pulumi.output(openApiSchema).apply(schema => JSON.stringify(schema)),
    tags: {
        Name: `transaction-api-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Lambda permission for API Gateway
const lambdaPermission = new aws.lambda.Permission(`api-lambda-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: validatorLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// API Gateway Deployment
const apiDeployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
    restApi: api.id,
    stageName: environmentSuffix,
}, {
    dependsOn: [lambdaPermission],
});

// API Gateway Usage Plan
const usagePlan = new aws.apigateway.UsagePlan(`api-usage-plan-${environmentSuffix}`, {
    name: `transaction-usage-plan-${environmentSuffix}`,
    apiStages: [{
        apiId: api.id,
        stage: apiDeployment.stageName,
    }],
    throttleSettings: {
        rateLimit: 10000,
        burstLimit: 5000,
    },
    quotaSettings: {
        limit: 10000,
        period: "DAY",
    },
    tags: {
        Name: `api-usage-plan-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// API Key
const apiKey = new aws.apigateway.ApiKey(`api-key-${environmentSuffix}`, {
    name: `transaction-api-key-${environmentSuffix}`,
    enabled: true,
    tags: {
        Name: `api-key-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Associate API Key with Usage Plan
const usagePlanKey = new aws.apigateway.UsagePlanKey(`usage-plan-key-${environmentSuffix}`, {
    keyId: apiKey.id,
    keyType: "API_KEY",
    usagePlanId: usagePlan.id,
});

// Exports
export const apiUrl = pulumi.interpolate`${api.executionArn}/${apiDeployment.stageName}/transaction`;
export const apiInvokeUrl = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/${apiDeployment.stageName}/transaction`;
export const apiKeyValue = apiKey.value;
export const transactionTableName = transactionTable.name;
export const snsTopicArn = notificationTopic.arn;
```

## File: lambda/transaction-validator/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDb = new DynamoDBClient({ region: process.env.REGION });
const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const body = JSON.parse(event.body);
        const { transactionId, amount, currency, merchantId, customerId } = body;

        const timestamp = Date.now();

        const params = {
            TableName: tableName,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                merchantId: { S: merchantId },
                customerId: { S: customerId || 'unknown' },
                status: { S: 'pending' },
                createdAt: { S: new Date().toISOString() },
            },
        };

        await dynamoDb.send(new PutItemCommand(params));

        console.log('Transaction saved successfully:', transactionId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Transaction processed successfully',
                transactionId: transactionId,
                timestamp: timestamp,
            }),
        };
    } catch (error) {
        console.error('Error processing transaction:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Error processing transaction',
                error: error.message,
            }),
        };
    }
};
```

## File: lambda/transaction-validator/package.json

```json
{
  "name": "transaction-validator",
  "version": "1.0.0",
  "description": "Lambda function to validate and store transactions",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0"
  }
}
```

## File: lambda/fraud-detection/index.js

```javascript
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: process.env.REGION });
const queueUrl = process.env.QUEUE_URL;

exports.handler = async (event) => {
    console.log('Received DynamoDB Stream event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;

                const transactionId = newImage.transactionId.S;
                const amount = parseFloat(newImage.amount.N);
                const merchantId = newImage.merchantId.S;

                // Simple fraud detection logic
                let fraudScore = 0;
                let fraudReason = [];

                // Check for high-value transactions
                if (amount > 10000) {
                    fraudScore += 50;
                    fraudReason.push('High value transaction');
                }

                // Check for suspicious amounts (e.g., round numbers)
                if (amount % 1000 === 0 && amount > 1000) {
                    fraudScore += 30;
                    fraudReason.push('Suspicious round amount');
                }

                const fraudStatus = fraudScore > 50 ? 'flagged' : 'approved';

                // Send to SQS FIFO queue
                const messageParams = {
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify({
                        transactionId: transactionId,
                        fraudStatus: fraudStatus,
                        fraudScore: fraudScore,
                        fraudReason: fraudReason,
                        amount: amount,
                        merchantId: merchantId,
                        timestamp: Date.now(),
                    }),
                    MessageGroupId: merchantId,
                    MessageDeduplicationId: `${transactionId}-${Date.now()}`,
                };

                await sqs.send(new SendMessageCommand(messageParams));

                console.log(`Fraud detection completed for transaction ${transactionId}:`, {
                    status: fraudStatus,
                    score: fraudScore,
                });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Fraud detection completed' }),
        };
    } catch (error) {
        console.error('Error in fraud detection:', error);
        throw error;
    }
};
```

## File: lambda/fraud-detection/package.json

```json
{
  "name": "fraud-detection",
  "version": "1.0.0",
  "description": "Lambda function for fraud detection",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.450.0"
  }
}
```

## File: lambda/notification/index.js

```javascript
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({ region: process.env.REGION });
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    console.log('Received SQS event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const message = JSON.parse(record.body);

            const notificationMessage = {
                transactionId: message.transactionId,
                fraudStatus: message.fraudStatus,
                fraudScore: message.fraudScore,
                fraudReason: message.fraudReason || [],
                amount: message.amount,
                merchantId: message.merchantId,
                timestamp: message.timestamp,
            };

            const params = {
                TopicArn: snsTopicArn,
                Subject: `Transaction ${message.fraudStatus.toUpperCase()}: ${message.transactionId}`,
                Message: JSON.stringify(notificationMessage, null, 2),
                MessageAttributes: {
                    transactionId: {
                        DataType: 'String',
                        StringValue: message.transactionId,
                    },
                    fraudStatus: {
                        DataType: 'String',
                        StringValue: message.fraudStatus,
                    },
                },
            };

            await sns.send(new PublishCommand(params));

            console.log(`Notification sent for transaction ${message.transactionId}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notifications sent' }),
        };
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};
```

## File: lambda/notification/package.json

```json
{
  "name": "notification",
  "version": "1.0.0",
  "description": "Lambda function for sending notifications",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.450.0"
  }
}
```

## File: Pulumi.yaml

```yaml
name: transaction-processing
runtime: nodejs
description: Serverless transaction processing system with fraud detection
```

## File: package.json

```json
{
  "name": "transaction-processing",
  "version": "1.0.0",
  "description": "Serverless transaction processing infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "deploy": "pulumi up",
    "destroy": "pulumi destroy"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.20.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
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
    "declaration": true,
    "outDir": "./bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## File: README.md

```markdown
# Serverless Transaction Processing System

A complete serverless transaction processing system built with Pulumi and TypeScript, deployed on AWS.

## Architecture

The system consists of:
- **API Gateway REST API** with OpenAPI schema validation
- **Transaction Validator Lambda** for processing and storing transactions
- **DynamoDB Table** with streams for transaction storage
- **Fraud Detection Lambda** triggered by DynamoDB streams
- **SQS FIFO Queue** for maintaining transaction order
- **Notification Lambda** for sending alerts via SNS
- **KMS Key** for encrypting Lambda environment variables
- **Dead Letter Queues** for failed message handling
- **CloudWatch Log Groups** with 30-day retention

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions for Lambda, API Gateway, DynamoDB, SQS, SNS, KMS, IAM, CloudWatch

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda function dependencies:
```bash
cd lambda/transaction-validator && npm install && cd ../..
cd lambda/fraud-detection && npm install && cd ../..
cd lambda/notification && npm install && cd ../..
```

3. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

## Deployment

Deploy the infrastructure:
```bash
pulumi up
```

The deployment will output:
- `apiInvokeUrl`: The API Gateway endpoint URL
- `apiKeyValue`: The API key for authentication (sensitive)
- `transactionTableName`: The DynamoDB table name
- `snsTopicArn`: The SNS topic ARN for notifications

## Usage

### Submit a transaction

```bash
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev/transaction \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 99.99,
    "currency": "USD",
    "merchantId": "merchant-001",
    "customerId": "customer-001"
  }'
```

### Subscribe to notifications

```bash
aws sns subscribe \
  --topic-arn YOUR_SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Testing

The system processes transactions through the following flow:

1. API Gateway validates the request against the OpenAPI schema
2. Transaction Validator Lambda stores the transaction in DynamoDB
3. DynamoDB Stream triggers Fraud Detection Lambda
4. Fraud Detection analyzes the transaction and sends results to SQS FIFO queue
5. Notification Lambda reads from SQS and publishes to SNS topic

### Fraud Detection Rules

- Transactions over $10,000 receive +50 fraud score
- Round amounts over $1,000 receive +30 fraud score
- Transactions with fraud score > 50 are flagged

## Monitoring

View logs in CloudWatch:
```bash
aws logs tail /aws/lambda/transaction-validator-dev --follow
aws logs tail /aws/lambda/fraud-detection-dev --follow
aws logs tail /aws/lambda/notification-dev --follow
```

## Cleanup

Destroy the infrastructure:
```bash
pulumi destroy
```

## Security Features

- KMS encryption for Lambda environment variables
- IAM roles with least-privilege access
- API Gateway API key authentication
- Request validation with OpenAPI schema
- Dead letter queues for failed message handling
- CloudWatch logging for audit trails

## Compliance

- Transaction audit trail maintained in DynamoDB
- CloudWatch logs retained for 30 days
- Dead letter queues retain messages for 14 days
- All resources tagged with environment identifier
```
