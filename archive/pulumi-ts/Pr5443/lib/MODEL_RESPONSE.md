# Serverless Webhook Processing System - Pulumi TypeScript Implementation

This implementation creates a complete serverless webhook processing infrastructure using Pulumi with TypeScript, deployed to the eu-west-1 region.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.get("environmentSuffix") || pulumi.getStack();
const region = "eu-west-1";
const lambdaRuntime = aws.lambda.Runtime.NodeJS18dX;

// Configure AWS provider for eu-west-1
const provider = new aws.Provider("eu-west-1-provider", {
    region: region,
});

// DynamoDB Table for webhook events
const webhookTable = new aws.dynamodb.Table(`webhook-events-${environmentSuffix}`, {
    name: `webhook-events-${environmentSuffix}`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "eventId",
    rangeKey: "timestamp",
    attributes: [
        { name: "eventId", type: "S" },
        { name: "timestamp", type: "N" },
    ],
    serverSideEncryption: {
        enabled: true,
    },
    pointInTimeRecovery: {
        enabled: true,
    },
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// SQS Dead Letter Queue for failed Lambda executions
const deadLetterQueue = new aws.sqs.Queue(`webhook-dlq-${environmentSuffix}`, {
    name: `webhook-dlq-${environmentSuffix}`,
    messageRetentionSeconds: 1209600, // 14 days
    kmsMasterKeyId: "alias/aws/sqs",
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// SNS Topic for failure notifications
const failureNotificationTopic = new aws.sns.Topic(`webhook-failures-${environmentSuffix}`, {
    name: `webhook-failures-${environmentSuffix}`,
    kmsMasterKeyId: "alias/aws/sns",
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// SNS Topic Subscription (email placeholder - will need actual email)
const topicSubscription = new aws.sns.TopicSubscription(`webhook-failures-email-${environmentSuffix}`, {
    topic: failureNotificationTopic.arn,
    protocol: "email",
    endpoint: "webhook-alerts@example.com", // Replace with actual email
}, { provider });

// IAM Role for Lambda execution
const lambdaRole = new aws.iam.Role(`webhook-lambda-role-${environmentSuffix}`, {
    name: `webhook-lambda-role-${environmentSuffix}`,
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
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// IAM Policy for Lambda - DynamoDB access
const lambdaDynamoPolicy = new aws.iam.RolePolicy(`webhook-lambda-dynamo-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([webhookTable.arn]).apply(([tableArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
            ],
            Resource: tableArn,
        }],
    })),
}, { provider });

// IAM Policy for Lambda - CloudWatch Logs
const lambdaLogsPolicy = new aws.iam.RolePolicy(`webhook-lambda-logs-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ],
            Resource: "arn:aws:logs:*:*:*",
        }],
    }),
}, { provider });

// IAM Policy for Lambda - X-Ray tracing
const lambdaXRayPolicy = new aws.iam.RolePolicy(`webhook-lambda-xray-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
            ],
            Resource: "*",
        }],
    }),
}, { provider });

// IAM Policy for Lambda - SQS DLQ access
const lambdaSQSPolicy = new aws.iam.RolePolicy(`webhook-lambda-sqs-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([deadLetterQueue.arn]).apply(([queueArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "sqs:SendMessage",
            ],
            Resource: queueArn,
        }],
    })),
}, { provider });

// IAM Policy for Lambda - SNS publish
const lambdaSNSPolicy = new aws.iam.RolePolicy(`webhook-lambda-sns-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([failureNotificationTopic.arn]).apply(([topicArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "sns:Publish",
            ],
            Resource: topicArn,
        }],
    })),
}, { provider });

// Lambda function code
const lambdaCode = `
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    try {
        // Parse the incoming webhook payload
        const body = JSON.parse(event.body);

        // Validate required fields
        if (!body.source || !body.data) {
            console.error('Missing required fields: source or data');
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid payload: missing required fields (source, data)'
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }

        // Generate eventId and timestamp
        const eventId = \`\${body.source}-\${Date.now()}-\${Math.random().toString(36).substring(7)}\`;
        const timestamp = Date.now();

        // Store in DynamoDB
        const putCommand = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                eventId: { S: eventId },
                timestamp: { N: timestamp.toString() },
                source: { S: body.source },
                data: { S: JSON.stringify(body.data) },
                receivedAt: { S: new Date().toISOString() },
                rawPayload: { S: event.body },
            },
        });

        await dynamoClient.send(putCommand);

        console.log(\`Successfully stored webhook event: \${eventId}\`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                eventId: eventId,
                timestamp: timestamp,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };

    } catch (error) {
        console.error('Error processing webhook:', error);

        // Publish failure notification to SNS
        try {
            await snsClient.send(new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Subject: 'Webhook Processing Failure',
                Message: JSON.stringify({
                    error: error.message,
                    event: event,
                    timestamp: new Date().toISOString(),
                }),
            }));
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }

        // Throw error to trigger DLQ
        throw error;
    }
};
`;

// Create Lambda function directory and write code
const lambdaDir = path.join(process.cwd(), "lambda");
if (!fs.existsSync(lambdaDir)) {
    fs.mkdirSync(lambdaDir, { recursive: true });
}
fs.writeFileSync(path.join(lambdaDir, "index.js"), lambdaCode);

// Package Lambda code
const lambdaArchive = new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.StringAsset(lambdaCode),
});

// Lambda function
const webhookFunction = new aws.lambda.Function(`webhook-processor-${environmentSuffix}`, {
    name: `webhook-processor-${environmentSuffix}`,
    runtime: lambdaRuntime,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 30,
    memorySize: 512,
    code: lambdaArchive,
    environment: {
        variables: {
            DYNAMODB_TABLE: webhookTable.name,
            AWS_REGION: region,
            SNS_TOPIC_ARN: failureNotificationTopic.arn,
        },
    },
    deadLetterConfig: {
        targetArn: deadLetterQueue.arn,
    },
    tracingConfig: {
        mode: "Active",
    },
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, {
    provider,
    dependsOn: [
        lambdaDynamoPolicy,
        lambdaLogsPolicy,
        lambdaXRayPolicy,
        lambdaSQSPolicy,
        lambdaSNSPolicy,
    ],
});

// CloudWatch Log Group for Lambda
const lambdaLogGroup = new aws.cloudwatch.LogGroup(`webhook-lambda-logs-${environmentSuffix}`, {
    name: pulumi.interpolate`/aws/lambda/${webhookFunction.name}`,
    retentionInDays: 7,
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// CloudWatch Alarm for Lambda errors
const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(`webhook-lambda-error-alarm-${environmentSuffix}`, {
    name: `webhook-lambda-error-alarm-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 300, // 5 minutes
    statistic: "Average",
    threshold: 5, // 5% error rate
    treatMissingData: "notBreaching",
    dimensions: {
        FunctionName: webhookFunction.name,
    },
    alarmDescription: "Triggers when Lambda error rate exceeds 5% over 5 minutes",
    alarmActions: [failureNotificationTopic.arn],
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// API Gateway REST API
const api = new aws.apigateway.RestApi(`webhook-api-${environmentSuffix}`, {
    name: `webhook-api-${environmentSuffix}`,
    description: "Webhook processing API",
    endpointConfiguration: {
        types: "EDGE",
    },
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// API Gateway Request Validator
const requestValidator = new aws.apigateway.RequestValidator(`webhook-validator-${environmentSuffix}`, {
    restApi: api.id,
    name: `webhook-validator-${environmentSuffix}`,
    validateRequestBody: true,
    validateRequestParameters: false,
}, { provider });

// API Gateway Model for request validation
const webhookModel = new aws.apigateway.Model(`webhook-model-${environmentSuffix}`, {
    restApi: api.id,
    name: `webhookModel${environmentSuffix.replace(/[^a-zA-Z0-9]/g, "")}`,
    contentType: "application/json",
    schema: JSON.stringify({
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        required: ["source", "data"],
        properties: {
            source: {
                type: "string",
            },
            data: {
                type: "object",
            },
        },
    }),
}, { provider });

// API Gateway Resource - /webhook
const webhookResource = new aws.apigateway.Resource(`webhook-resource-${environmentSuffix}`, {
    restApi: api.id,
    parentId: api.rootResourceId,
    pathPart: "webhook",
}, { provider });

// API Gateway Method - POST /webhook
const webhookMethod = new aws.apigateway.Method(`webhook-post-method-${environmentSuffix}`, {
    restApi: api.id,
    resourceId: webhookResource.id,
    httpMethod: "POST",
    authorization: "NONE",
    requestValidatorId: requestValidator.id,
    requestModels: {
        "application/json": webhookModel.name,
    },
}, { provider });

// API Gateway Integration with Lambda
const webhookIntegration = new aws.apigateway.Integration(`webhook-integration-${environmentSuffix}`, {
    restApi: api.id,
    resourceId: webhookResource.id,
    httpMethod: webhookMethod.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: webhookFunction.invokeArn,
}, { provider });

// API Gateway Method Response - 200
const methodResponse200 = new aws.apigateway.MethodResponse(`webhook-method-response-200-${environmentSuffix}`, {
    restApi: api.id,
    resourceId: webhookResource.id,
    httpMethod: webhookMethod.httpMethod,
    statusCode: "200",
    responseModels: {
        "application/json": "Empty",
    },
}, { provider });

// API Gateway Method Response - 400
const methodResponse400 = new aws.apigateway.MethodResponse(`webhook-method-response-400-${environmentSuffix}`, {
    restApi: api.id,
    resourceId: webhookResource.id,
    httpMethod: webhookMethod.httpMethod,
    statusCode: "400",
    responseModels: {
        "application/json": "Error",
    },
}, { provider });

// Lambda permission for API Gateway
const lambdaPermission = new aws.lambda.Permission(`webhook-lambda-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: webhookFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
}, { provider });

// API Gateway Deployment
const deployment = new aws.apigateway.Deployment(`webhook-deployment-${environmentSuffix}`, {
    restApi: api.id,
    stageName: "prod",
}, {
    provider,
    dependsOn: [
        webhookIntegration,
        methodResponse200,
        methodResponse400,
    ],
});

// API Gateway Stage
const stage = new aws.apigateway.Stage(`webhook-stage-${environmentSuffix}`, {
    restApi: api.id,
    deployment: deployment.id,
    stageName: "prod",
    xrayTracingEnabled: true,
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// API Gateway Usage Plan
const usagePlan = new aws.apigateway.UsagePlan(`webhook-usage-plan-${environmentSuffix}`, {
    name: `webhook-usage-plan-${environmentSuffix}`,
    description: "Usage plan limiting to 1000 requests per day",
    apiStages: [{
        apiId: api.id,
        stage: stage.stageName,
    }],
    quotaSettings: {
        limit: 1000,
        period: "DAY",
    },
    throttleSettings: {
        burstLimit: 100,
        rateLimit: 50,
    },
    tags: {
        Environment: environmentSuffix,
        Service: "webhook-processor",
    },
}, { provider });

// Exports
export const apiUrl = pulumi.interpolate`${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}/webhook`;
export const apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}/webhook`;
export const dynamoTableName = webhookTable.name;
export const lambdaFunctionName = webhookFunction.name;
export const dlqUrl = deadLetterQueue.url;
export const snsTopicArn = failureNotificationTopic.arn;
export const lambdaRoleArn = lambdaRole.arn;
export const region_output = region;
```

## File: Pulumi.yaml

```yaml
name: webhook-processor
runtime: nodejs
description: Serverless webhook processing system with Pulumi TypeScript
main: index.ts
```

## File: package.json

```json
{
  "name": "webhook-processor",
  "version": "1.0.0",
  "description": "Serverless webhook processing infrastructure with Pulumi",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "deploy": "pulumi up"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
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
    "outDir": "bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

## Deployment Instructions

1. **Prerequisites**:
   - Install Pulumi CLI 3.x: `curl -fsSL https://get.pulumi.com | sh`
   - Install Node.js 16+ and npm
   - Configure AWS CLI with credentials for eu-west-1

2. **Configuration**:
   ```bash
   pulumi stack init dev
   pulumi config set environmentSuffix dev
   pulumi config set aws:region eu-west-1
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Deploy Infrastructure**:
   ```bash
   pulumi up
   ```

5. **Update SNS Email Subscription**:
   After deployment, check your email and confirm the SNS subscription for webhook failure notifications.

6. **Test the Webhook Endpoint**:
   ```bash
   curl -X POST https://<api-id>.execute-api.eu-west-1.amazonaws.com/prod/webhook \
     -H "Content-Type: application/json" \
     -d '{"source": "test-service", "data": {"message": "Hello webhook"}}'
   ```

7. **Monitor**:
   - CloudWatch Logs: Check `/aws/lambda/webhook-processor-<environmentSuffix>`
   - CloudWatch Alarms: Monitor error rate alerts
   - DynamoDB: Query webhook-events table for stored events
   - SQS DLQ: Check for failed messages

8. **Destroy Infrastructure**:
   ```bash
   pulumi destroy
   ```

## Architecture Overview

The system processes webhooks through the following flow:

1. API Gateway receives POST request at /webhook endpoint
2. Request validation ensures 'source' and 'data' fields are present
3. Lambda function processes the webhook and stores in DynamoDB
4. On success: Returns 200 with eventId
5. On validation failure: Returns 400 error
6. On processing failure: Message sent to SQS DLQ and SNS notification triggered
7. CloudWatch monitors Lambda error rate and triggers alarm if > 5%
8. X-Ray provides distributed tracing for request flow

All resources use the environmentSuffix for unique naming, enabling multi-environment deployments without conflicts.