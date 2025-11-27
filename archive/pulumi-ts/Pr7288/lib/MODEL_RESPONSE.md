# Fraud Detection Pipeline - Pulumi TypeScript Implementation

This document contains the complete Pulumi TypeScript implementation for the serverless fraud detection pipeline.

## File: Pulumi.yaml

```yaml
name: fraud-detection-pipeline
runtime: nodejs
description: Serverless fraud detection pipeline with EventBridge, Lambda, DynamoDB, and SNS
```

## File: package.json

```json
{
  "name": "fraud-detection-pipeline",
  "version": "1.0.0",
  "description": "Serverless fraud detection pipeline with Pulumi",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "deploy": "pulumi up",
    "destroy": "pulumi destroy"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.15.0"
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
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get environment suffix from config (required for resource naming)
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";
const emailAddress = config.get("emailAddress") || "alerts@example.com";

// Common tags for all resources
const commonTags = {
  Environment: "production",
  Service: "fraud-detection",
};

// KMS key for Lambda environment variable encryption
const kmsKey = new aws.kms.Key(`fraud-detection-kms-${environmentSuffix}`, {
  description: "KMS key for encrypting Lambda environment variables",
  deletionWindowInDays: 7, // Minimum allowed for destroyability
  tags: commonTags,
});

const kmsAlias = new aws.kms.Alias(`fraud-detection-kms-alias-${environmentSuffix}`, {
  name: `alias/fraud-detection-${environmentSuffix}`,
  targetKeyId: kmsKey.keyId,
});

// DynamoDB table for transactions with composite key
const transactionsTable = new aws.dynamodb.Table(`transactions-${environmentSuffix}`, {
  name: `transactions-${environmentSuffix}`,
  billingMode: "PAY_PER_REQUEST",
  hashKey: "transactionId",
  rangeKey: "timestamp",
  attributes: [
    { name: "transactionId", type: "S" },
    { name: "timestamp", type: "N" },
  ],
  pointInTimeRecovery: {
    enabled: true,
  },
  serverSideEncryption: {
    enabled: true,
  },
  tags: commonTags,
});

// SNS topic for fraud alerts
const fraudAlertsTopic = new aws.sns.Topic(`fraud-alerts-${environmentSuffix}`, {
  name: `fraud-alerts-${environmentSuffix}`,
  tags: commonTags,
});

// Email subscription for SNS topic
const emailSubscription = new aws.sns.TopicSubscription(`fraud-alerts-email-${environmentSuffix}`, {
  topic: fraudAlertsTopic.arn,
  protocol: "email",
  endpoint: emailAddress,
});

// EventBridge custom event bus
const fraudDetectionBus = new aws.cloudwatch.EventBus(`fraud-detection-bus-${environmentSuffix}`, {
  name: `fraud-detection-bus-${environmentSuffix}`,
  tags: commonTags,
});

// Dead-letter queues for Lambda functions
const transactionProcessorDLQ = new aws.sqs.Queue(`transaction-processor-dlq-${environmentSuffix}`, {
  name: `transaction-processor-dlq-${environmentSuffix}`,
  messageRetentionSeconds: 1209600, // 14 days
  tags: commonTags,
});

const fraudDetectorDLQ = new aws.sqs.Queue(`fraud-detector-dlq-${environmentSuffix}`, {
  name: `fraud-detector-dlq-${environmentSuffix}`,
  messageRetentionSeconds: 1209600, // 14 days
  tags: commonTags,
});

// IAM role for transaction-processor Lambda
const transactionProcessorRole = new aws.iam.Role(`transaction-processor-role-${environmentSuffix}`, {
  name: `transaction-processor-role-${environmentSuffix}`,
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
  tags: commonTags,
});

// Policy for transaction-processor Lambda
const transactionProcessorPolicy = new aws.iam.RolePolicy(`transaction-processor-policy-${environmentSuffix}`, {
  role: transactionProcessorRole.id,
  policy: pulumi.all([transactionsTable.arn, fraudDetectionBus.arn, transactionProcessorDLQ.arn, kmsKey.arn]).apply(
    ([tableArn, busArn, dlqArn, kmsArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:UpdateItem",
          ],
          Resource: tableArn,
        },
        {
          Effect: "Allow",
          Action: [
            "events:PutEvents",
          ],
          Resource: busArn,
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
          Resource: kmsArn,
        },
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: "arn:aws:logs:*:*:*",
        },
      ],
    })
  ),
});

// IAM role for fraud-detector Lambda
const fraudDetectorRole = new aws.iam.Role(`fraud-detector-role-${environmentSuffix}`, {
  name: `fraud-detector-role-${environmentSuffix}`,
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
  tags: commonTags,
});

// Policy for fraud-detector Lambda
const fraudDetectorPolicy = new aws.iam.RolePolicy(`fraud-detector-policy-${environmentSuffix}`, {
  role: fraudDetectorRole.id,
  policy: pulumi.all([transactionsTable.arn, fraudAlertsTopic.arn, fraudDetectorDLQ.arn, kmsKey.arn]).apply(
    ([tableArn, topicArn, dlqArn, kmsArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:Query",
          ],
          Resource: tableArn,
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
          Resource: kmsArn,
        },
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: "arn:aws:logs:*:*:*",
        },
      ],
    })
  ),
});

// CloudWatch Log Group for transaction-processor
const transactionProcessorLogGroup = new aws.cloudwatch.LogGroup(`transaction-processor-logs-${environmentSuffix}`, {
  name: `/aws/lambda/transaction-processor-${environmentSuffix}`,
  retentionInDays: 30,
  tags: commonTags,
});

// Lambda function: transaction-processor
const transactionProcessorFunction = new aws.lambda.Function(`transaction-processor-${environmentSuffix}`, {
  name: `transaction-processor-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: "index.handler",
  role: transactionProcessorRole.arn,
  timeout: 60,
  memorySize: 3008,
  architectures: ["arm64"],
  reservedConcurrentExecutions: 10,
  environment: {
    variables: {
      DYNAMODB_TABLE: transactionsTable.name,
      EVENT_BUS_NAME: fraudDetectionBus.name,
      REGION: region,
    },
  },
  kmsKeyArn: kmsKey.arn,
  deadLetterConfig: {
    targetArn: transactionProcessorDLQ.arn,
  },
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const dynamoDb = new DynamoDBClient({ region: process.env.REGION });
const eventBridge = new EventBridgeClient({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log("Received transaction event:", JSON.stringify(event));

  try {
    // Parse transaction data
    const transaction = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const transactionId = transaction.transactionId || \`txn-\${Date.now()}\`;
    const timestamp = transaction.timestamp || Date.now();
    const amount = parseFloat(transaction.amount || 0);

    // Store transaction in DynamoDB
    await dynamoDb.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: amount.toString() },
        userId: { S: transaction.userId || "unknown" },
        merchantId: { S: transaction.merchantId || "unknown" },
        status: { S: "pending" },
      },
    }));

    console.log(\`Transaction \${transactionId} stored in DynamoDB\`);

    // Publish event to EventBridge if amount > 10000
    if (amount > 10000) {
      await eventBridge.send(new PutEventsCommand({
        Entries: [{
          Source: "fraud-detection.transaction-processor",
          DetailType: "HighValueTransaction",
          Detail: JSON.stringify({
            transactionId,
            timestamp,
            amount,
            userId: transaction.userId,
            merchantId: transaction.merchantId,
          }),
          EventBusName: process.env.EVENT_BUS_NAME,
        }],
      }));

      console.log(\`High-value transaction event published for \${transactionId}\`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Transaction processed successfully",
        transactionId,
      }),
    };
  } catch (error) {
    console.error("Error processing transaction:", error);
    throw error;
  }
};
`),
    "package.json": new pulumi.asset.StringAsset(`{
  "name": "transaction-processor",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-eventbridge": "^3.450.0"
  }
}`),
  }),
  tags: commonTags,
}, { dependsOn: [transactionProcessorLogGroup] });

// CloudWatch Log Group for fraud-detector
const fraudDetectorLogGroup = new aws.cloudwatch.LogGroup(`fraud-detector-logs-${environmentSuffix}`, {
  name: `/aws/lambda/fraud-detector-${environmentSuffix}`,
  retentionInDays: 30,
  tags: commonTags,
});

// Lambda function: fraud-detector
const fraudDetectorFunction = new aws.lambda.Function(`fraud-detector-${environmentSuffix}`, {
  name: `fraud-detector-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: "index.handler",
  role: fraudDetectorRole.arn,
  timeout: 60,
  memorySize: 1024,
  architectures: ["arm64"],
  reservedConcurrentExecutions: 5,
  environment: {
    variables: {
      DYNAMODB_TABLE: transactionsTable.name,
      SNS_TOPIC_ARN: fraudAlertsTopic.arn,
      REGION: region,
    },
  },
  kmsKeyArn: kmsKey.arn,
  deadLetterConfig: {
    targetArn: fraudDetectorDLQ.arn,
  },
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(`
const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoDb = new DynamoDBClient({ region: process.env.REGION });
const sns = new SNSClient({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log("Received event for fraud detection:", JSON.stringify(event));

  try {
    // Parse EventBridge event
    const detail = event.detail;
    const transactionId = detail.transactionId;
    const amount = parseFloat(detail.amount);
    const userId = detail.userId;

    // Simple fraud detection patterns
    let fraudScore = 0;
    const fraudReasons = [];

    // Pattern 1: High transaction amount
    if (amount > 50000) {
      fraudScore += 40;
      fraudReasons.push("Extremely high transaction amount");
    } else if (amount > 10000) {
      fraudScore += 20;
      fraudReasons.push("High transaction amount");
    }

    // Pattern 2: Query recent transactions for velocity check
    try {
      const recentTransactions = await dynamoDb.send(new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE,
        KeyConditionExpression: "transactionId = :tid",
        ExpressionAttributeValues: {
          ":tid": { S: transactionId },
        },
        Limit: 10,
      }));

      // In production, this would check multiple transactions by userId
      // For demo purposes, we'll use a simplified check
      if (recentTransactions.Items && recentTransactions.Items.length > 0) {
        console.log(\`Found \${recentTransactions.Items.length} recent transactions\`);
      }
    } catch (error) {
      console.error("Error querying recent transactions:", error);
    }

    // Pattern 3: Round number detection (common in fraud)
    if (amount % 1000 === 0) {
      fraudScore += 10;
      fraudReasons.push("Round number amount (common fraud pattern)");
    }

    // Pattern 4: Weekend transaction (higher fraud risk)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      fraudScore += 15;
      fraudReasons.push("Weekend transaction");
    }

    console.log(\`Fraud score for transaction \${transactionId}: \${fraudScore}\`);

    // Send alert if fraud score is high
    if (fraudScore >= 30) {
      const message = \`
FRAUD ALERT - High Risk Transaction Detected

Transaction ID: \${transactionId}
User ID: \${userId}
Amount: $\${amount.toFixed(2)}
Fraud Score: \${fraudScore}/100
Timestamp: \${new Date().toISOString()}

Fraud Indicators:
\${fraudReasons.map(r => \`- \${r}\`).join('\\n')}

Action Required: Review this transaction immediately.
      \`;

      await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: \`FRAUD ALERT: Transaction \${transactionId}\`,
        Message: message,
      }));

      console.log(\`Fraud alert sent for transaction \${transactionId}\`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        transactionId,
        fraudScore,
        riskLevel: fraudScore >= 30 ? "HIGH" : "LOW",
      }),
    };
  } catch (error) {
    console.error("Error in fraud detection:", error);
    throw error;
  }
};
`),
    "package.json": new pulumi.asset.StringAsset(`{
  "name": "fraud-detector",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0"
  }
}`),
  }),
  tags: commonTags,
}, { dependsOn: [fraudDetectorLogGroup] });

// IAM role for EventBridge to invoke Lambda
const eventBridgeRole = new aws.iam.Role(`eventbridge-role-${environmentSuffix}`, {
  name: `eventbridge-fraud-detection-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "events.amazonaws.com",
      },
    }],
  }),
  tags: commonTags,
});

const eventBridgePolicy = new aws.iam.RolePolicy(`eventbridge-policy-${environmentSuffix}`, {
  role: eventBridgeRole.id,
  policy: pulumi.all([fraudDetectorFunction.arn, fraudDetectorDLQ.arn]).apply(
    ([lambdaArn, dlqArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "lambda:InvokeFunction",
          Resource: lambdaArn,
        },
        {
          Effect: "Allow",
          Action: "sqs:SendMessage",
          Resource: dlqArn,
        },
      ],
    })
  ),
});

// EventBridge rule to trigger fraud-detector for high-value transactions
const fraudDetectionRule = new aws.cloudwatch.EventRule(`fraud-detection-rule-${environmentSuffix}`, {
  name: `fraud-detection-rule-${environmentSuffix}`,
  eventBusName: fraudDetectionBus.name,
  description: "Trigger fraud detector for transactions with amount > 10000",
  eventPattern: JSON.stringify({
    source: ["fraud-detection.transaction-processor"],
    "detail-type": ["HighValueTransaction"],
    detail: {
      amount: [{ numeric: [">", 10000] }],
    },
  }),
  tags: commonTags,
});

// EventBridge target for fraud-detector Lambda with DLQ
const fraudDetectionTarget = new aws.cloudwatch.EventTarget(`fraud-detection-target-${environmentSuffix}`, {
  rule: fraudDetectionRule.name,
  eventBusName: fraudDetectionBus.name,
  arn: fraudDetectorFunction.arn,
  roleArn: eventBridgeRole.arn,
  deadLetterConfig: {
    arn: fraudDetectorDLQ.arn,
  },
  retryPolicy: {
    maximumRetryAttempts: 2,
    maximumEventAge: 3600, // 1 hour
  },
});

// Permission for EventBridge to invoke fraud-detector Lambda
const fraudDetectorEventPermission = new aws.lambda.Permission(`fraud-detector-event-permission-${environmentSuffix}`, {
  action: "lambda:InvokeFunction",
  function: fraudDetectorFunction.name,
  principal: "events.amazonaws.com",
  sourceArn: fraudDetectionRule.arn,
});

// Exports
export const eventBridgeBusArn = fraudDetectionBus.arn;
export const snsTopicArn = fraudAlertsTopic.arn;
export const dynamoDbTableName = transactionsTable.name;
export const transactionProcessorFunctionName = transactionProcessorFunction.name;
export const fraudDetectorFunctionName = fraudDetectorFunction.name;
export const transactionProcessorFunctionArn = transactionProcessorFunction.arn;
export const kmsKeyId = kmsKey.id;
```

## File: Pulumi.dev.yaml

```yaml
config:
  fraud-detection-pipeline:environmentSuffix: dev-001
  fraud-detection-pipeline:emailAddress: alerts@example.com
  aws:region: us-east-1
```

## Implementation Summary

This Pulumi TypeScript implementation creates a complete serverless fraud detection pipeline with the following components:

### Infrastructure Components

1. **DynamoDB Table**: `transactions` table with composite key (transactionId + timestamp), point-in-time recovery, and encryption at rest
2. **Lambda Functions**:
   - `transaction-processor`: 3008MB memory, ARM64 architecture, reserved concurrency of 10
   - `fraud-detector`: 1024MB memory, ARM64 architecture, reserved concurrency of 5
3. **EventBridge**: Custom event bus with rule to route high-value transactions (>$10,000)
4. **SNS Topic**: Fraud alerts topic with email subscription
5. **SQS Dead-Letter Queues**: Separate DLQs for both Lambda functions
6. **KMS Key**: For encrypting Lambda environment variables
7. **IAM Roles**: Least-privilege roles for each Lambda function and EventBridge
8. **CloudWatch Logs**: 30-day retention for both Lambda functions

### Key Features

- All resources include `environmentSuffix` in their names for uniqueness
- All resources tagged with `Environment='production'` and `Service='fraud-detection'`
- ARM64 (Graviton2) architecture for cost optimization
- Reserved concurrent executions to prevent cold starts
- KMS encryption for Lambda environment variables
- Dead-letter queues configured for failed invocations
- Point-in-time recovery enabled for DynamoDB
- Proper IAM policies with least privilege access
- CloudWatch Logs with exactly 30-day retention

### Fraud Detection Logic

The fraud-detector Lambda implements pattern matching for:
- High transaction amounts (>$50k gets 40 points, >$10k gets 20 points)
- Round number detection (fraud pattern indicator)
- Weekend transactions (higher risk)
- Fraud score threshold of 30+ triggers SNS alert

### Destroyability

All resources are fully destroyable:
- No retention policies preventing deletion
- KMS key has minimum 7-day deletion window
- No deletion protection enabled
- All resources can be cleaned up with `pulumi destroy`
