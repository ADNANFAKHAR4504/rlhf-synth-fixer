# Payment Webhook Processing Infrastructure

This implementation provides a serverless payment webhook processing system using Pulumi TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

export interface TapStackArgs {
  environmentSuffix: pulumi.Input<string>;
  region?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly functionUrl: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:webhook:TapStack", name, {}, opts);

    const envSuffix = pulumi.output(args.environmentSuffix);
    const region = args.region || "us-east-1";

    // DynamoDB table for transaction storage
    const transactionsTable = new aws.dynamodb.Table(
      `envmig-transactions-${envSuffix}`,
      {
        name: pulumi.interpolate`envmig-transactions-${envSuffix}`,
        billingMode: "PAY_PER_REQUEST",
        hashKey: "transactionId",
        rangeKey: "timestamp",
        attributes: [
          {
            name: "transactionId",
            type: "S",
          },
          {
            name: "timestamp",
            type: "N",
          },
        ],
        tags: {
          Environment: "prod",
          MigrationPhase: "testing",
          Name: pulumi.interpolate`envmig-transactions-${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Secrets Manager for API keys
    const apiSecret = new aws.secretsmanager.Secret(
      `envmig-apikeys-${envSuffix}`,
      {
        name: pulumi.interpolate`envmig-apikeys-${envSuffix}`,
        description: "Payment provider API keys for webhook processing",
        tags: {
          Environment: "prod",
          MigrationPhase: "testing",
          Name: pulumi.interpolate`envmig-apikeys-${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Store a placeholder secret value
    const apiSecretVersion = new aws.secretsmanager.SecretVersion(
      `envmig-apikeys-version-${envSuffix}`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          stripeKey: "sk_test_placeholder",
          paypalKey: "paypal_placeholder",
        }),
      },
      { parent: this }
    );

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `envmig-webhook-role-${envSuffix}`,
      {
        name: pulumi.interpolate`envmig-webhook-role-${envSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
            },
          ],
        }),
        tags: {
          Environment: "prod",
          MigrationPhase: "testing",
          Name: pulumi.interpolate`envmig-webhook-role-${envSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM policy for DynamoDB access
    const dynamoPolicy = new aws.iam.RolePolicy(
      `envmig-webhook-dynamo-policy-${envSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([transactionsTable.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "dynamodb:PutItem",
                  "dynamodb:UpdateItem",
                  "dynamodb:GetItem",
                  "dynamodb:Query",
                ],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM policy for Secrets Manager access
    const secretsPolicy = new aws.iam.RolePolicy(
      `envmig-webhook-secrets-policy-${envSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([apiSecret.arn]).apply(([secretArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "secretsmanager:GetSecretValue",
                  "secretsmanager:DescribeSecret",
                ],
                Resource: secretArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(
      `envmig-webhook-logs-policy-${envSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
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
        }),
      },
      { parent: this }
    );

    // IAM policy for X-Ray
    const xrayPolicy = new aws.iam.RolePolicy(
      `envmig-webhook-xray-policy-${envSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
              ],
              Resource: "*",
            },
          ],
        }),
      },
      { parent: this }
    );

    // CloudWatch Logs group
    const logGroup = new aws.cloudwatch.LogGroup(
      `envmig-webhook-logs-${envSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/envmig-webhook-${envSuffix}`,
        retentionInDays: 7,
        tags: {
          Environment: "prod",
          MigrationPhase: "testing",
          Name: pulumi.interpolate`envmig-webhook-logs-${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const dynamoClient = new DynamoDBClient({ region: "${region}" });
const secretsClient = new SecretsManagerClient({ region: "${region}" });

let cachedSecrets = null;

async function getSecrets() {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN,
    });
    const response = await secretsClient.send(command);
    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets;
  } catch (error) {
    console.error("Error fetching secrets:", error);
    throw error;
  }
}

async function validateWebhook(body, provider) {
  // Placeholder validation logic
  // In production, this would verify signatures from payment providers
  return body && body.transactionId;
}

exports.handler = async (event) => {
  console.log("Received webhook:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || "{}");
    const provider = body.provider || "unknown";

    // Validate webhook
    const isValid = await validateWebhook(body, provider);
    if (!isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid webhook payload" }),
      };
    }

    // Get secrets for authentication (if needed)
    const secrets = await getSecrets();
    console.log("Secrets loaded successfully");

    // Store transaction in DynamoDB
    const timestamp = Date.now();
    const command = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: body.transactionId || \`txn-\${timestamp}\` },
        timestamp: { N: timestamp.toString() },
        provider: { S: provider },
        amount: { N: (body.amount || 0).toString() },
        currency: { S: body.currency || "USD" },
        status: { S: body.status || "pending" },
        payload: { S: JSON.stringify(body) },
        processedAt: { S: new Date().toISOString() },
      },
    });

    await dynamoClient.send(command);
    console.log("Transaction stored successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Webhook processed successfully",
        transactionId: body.transactionId,
      }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
`;

    // Create Lambda function directory
    const functionDir = path.join(__dirname, "lambda");
    if (!fs.existsSync(functionDir)) {
      fs.mkdirSync(functionDir, { recursive: true });
    }

    // Write Lambda function code
    fs.writeFileSync(path.join(functionDir, "index.js"), lambdaCode);

    // Write package.json for Lambda dependencies
    const packageJson = {
      name: "webhook-processor",
      version: "1.0.0",
      dependencies: {
        "@aws-sdk/client-dynamodb": "^3.470.0",
        "@aws-sdk/client-secrets-manager": "^3.470.0",
      },
    };
    fs.writeFileSync(
      path.join(functionDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Lambda function
    const webhookFunction = new aws.lambda.Function(
      `envmig-webhook-${envSuffix}`,
      {
        name: pulumi.interpolate`envmig-webhook-${envSuffix}`,
        runtime: "nodejs18.x",
        handler: "index.handler",
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          ".": new pulumi.asset.FileArchive(functionDir),
        }),
        memorySize: 512,
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: transactionsTable.name,
            SECRET_ARN: apiSecret.arn,
            ENVIRONMENT: "prod",
            MIGRATION_PHASE: "testing",
          },
        },
        tracingConfig: {
          mode: "Active",
        },
        tags: {
          Environment: "prod",
          MigrationPhase: "testing",
          Name: pulumi.interpolate`envmig-webhook-${envSuffix}`,
        },
      },
      {
        parent: this,
        dependsOn: [logGroup, dynamoPolicy, secretsPolicy, logsPolicy, xrayPolicy],
      }
    );

    // Lambda function URL
    const functionUrl = new aws.lambda.FunctionUrl(
      `envmig-webhook-url-${envSuffix}`,
      {
        functionName: webhookFunction.name,
        authorizationType: "AWS_IAM",
        cors: {
          allowCredentials: true,
          allowOrigins: ["*"],
          allowMethods: ["POST"],
          allowHeaders: ["content-type", "x-amz-date", "authorization"],
          maxAge: 86400,
        },
      },
      { parent: this }
    );

    // Outputs
    this.functionUrl = functionUrl.functionUrl;
    this.tableArn = transactionsTable.arn;
    this.lambdaArn = webhookFunction.arn;

    this.registerOutputs({
      functionUrl: this.functionUrl,
      tableArn: this.tableArn,
      lambdaArn: this.lambdaArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = config.get("region") || "us-east-1";

const stack = new TapStack("payment-webhook-migration", {
  environmentSuffix,
  region,
});

export const functionUrl = stack.functionUrl;
export const tableArn = stack.tableArn;
export const lambdaArn = stack.lambdaArn;
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: Payment webhook processing infrastructure for migration
config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming (e.g., dev, staging, prod)
  region:
    type: string
    description: AWS region for deployment
    default: us-east-1
```

## File: package.json

```json
{
  "name": "tap",
  "version": "1.0.0",
  "description": "Payment webhook processing infrastructure",
  "main": "bin/tap.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.97.0",
    "@pulumi/aws": "^6.13.0"
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
    "outDir": "./",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["bin/**/*", "lib/**/*", "test/**/*"],
  "exclude": ["node_modules"]
}
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   cd lib/lambda && npm install && cd ../..
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Configure Pulumi:
   ```bash
   pulumi config set environmentSuffix dev
   pulumi config set region us-east-1
   pulumi config set aws:region us-east-1
   ```

4. Deploy:
   ```bash
   pulumi up
   ```

5. Test the webhook endpoint:
   ```bash
   FUNCTION_URL=$(pulumi stack output functionUrl)
   aws lambda invoke-function-url \
     --function-url $FUNCTION_URL \
     --payload '{"transactionId":"test-123","amount":100,"currency":"USD","status":"completed","provider":"stripe"}' \
     response.json
   ```

## Architecture

The infrastructure consists of:
- Lambda function with function URL for webhook processing
- DynamoDB table for transaction storage with on-demand billing
- Secrets Manager for storing payment provider API keys
- CloudWatch Logs with 7-day retention
- X-Ray tracing for performance monitoring
- IAM roles with least-privilege access

All resources are tagged with Environment=prod and MigrationPhase=testing for cost tracking and management.