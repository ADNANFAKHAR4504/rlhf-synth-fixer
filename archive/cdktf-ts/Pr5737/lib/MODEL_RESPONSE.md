# Payment Processing API Infrastructure - CDKTF TypeScript Implementation

This implementation provides a complete, reusable CDKTF construct for deploying payment processing API infrastructure across multiple environments.

## File: lib/payment-api-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { ApiGatewayApiKey } from "@cdktf/provider-aws/lib/api-gateway-api-key";
import { ApiGatewayUsagePlan } from "@cdktf/provider-aws/lib/api-gateway-usage-plan";
import { ApiGatewayUsagePlanKey } from "@cdktf/provider-aws/lib/api-gateway-usage-plan-key";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";

export interface PaymentApiStackConfig {
  environment: "dev" | "staging" | "prod";
  environmentSuffix: string;
  region: string;
}

export class PaymentApiStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: PaymentApiStackConfig) {
    super(scope, id);

    const { environment, environmentSuffix, region } = config;

    // Provider configuration
    new AwsProvider(this, "aws", {
      region: region,
    });

    // Environment-specific configurations
    const envConfig = this.getEnvironmentConfig(environment);

    // Common tags
    const commonTags = {
      Environment: environment,
      Project: "payment-api",
      ManagedBy: "cdktf",
      EnvironmentSuffix: environmentSuffix,
    };

    // S3 Bucket for transaction logs
    const logsBucket = new S3Bucket(this, "logs-bucket", {
      bucket: `payment-logs-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: "transaction-logs",
      },
    });

    // Enable versioning on logs bucket
    new S3BucketVersioningA(this, "logs-bucket-versioning", {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Enable encryption on logs bucket
    new S3BucketServerSideEncryptionConfigurationA(this, "logs-bucket-encryption", {
      bucket: logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // Lifecycle policy for logs bucket
    new S3BucketLifecycleConfiguration(this, "logs-bucket-lifecycle", {
      bucket: logsBucket.id,
      rule: [
        {
          id: "expire-old-logs",
          status: "Enabled",
          expiration: {
            days: envConfig.s3RetentionDays,
          },
        },
      ],
    });

    // S3 Bucket for receipts
    const receiptsBucket = new S3Bucket(this, "receipts-bucket", {
      bucket: `payment-receipts-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: "payment-receipts",
      },
    });

    // Enable versioning on receipts bucket
    new S3BucketVersioningA(this, "receipts-bucket-versioning", {
      bucket: receiptsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Enable encryption on receipts bucket
    new S3BucketServerSideEncryptionConfigurationA(this, "receipts-bucket-encryption", {
      bucket: receiptsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // Lifecycle policy for receipts bucket
    new S3BucketLifecycleConfiguration(this, "receipts-bucket-lifecycle", {
      bucket: receiptsBucket.id,
      rule: [
        {
          id: "expire-old-receipts",
          status: "Enabled",
          expiration: {
            days: envConfig.s3RetentionDays,
          },
        },
      ],
    });

    // DynamoDB Table for transactions
    const transactionsTable = new DynamodbTable(this, "transactions-table", {
      name: `payment-transactions-${environmentSuffix}`,
      billingMode: envConfig.dynamodbBillingMode,
      hashKey: "transactionId",
      rangeKey: "timestamp",
      attribute: [
        {
          name: "transactionId",
          type: "S",
        },
        {
          name: "timestamp",
          type: "N",
        },
        {
          name: "customerId",
          type: "S",
        },
        {
          name: "transactionDate",
          type: "S",
        },
      ],
      globalSecondaryIndex: [
        {
          name: "customer-index",
          hashKey: "customerId",
          rangeKey: "timestamp",
          projectionType: "ALL",
          readCapacity: envConfig.dynamodbReadCapacity,
          writeCapacity: envConfig.dynamodbWriteCapacity,
        },
        {
          name: "date-index",
          hashKey: "transactionDate",
          rangeKey: "timestamp",
          projectionType: "ALL",
          readCapacity: envConfig.dynamodbReadCapacity,
          writeCapacity: envConfig.dynamodbWriteCapacity,
        },
      ],
      readCapacity: envConfig.dynamodbReadCapacity,
      writeCapacity: envConfig.dynamodbWriteCapacity,
      pointInTimeRecovery: {
        enabled: environment === "prod",
      },
      tags: {
        ...commonTags,
        Purpose: "transaction-storage",
      },
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new CloudwatchLogGroup(this, "lambda-log-group", {
      name: `/aws/lambda/payment-processor-${environmentSuffix}`,
      retentionInDays: envConfig.logRetentionDays,
      tags: commonTags,
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, "lambda-role", {
      name: `payment-processor-role-${environmentSuffix}`,
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
      tags: commonTags,
    });

    // IAM Policy for Lambda
    const lambdaPolicy = new IamPolicy(this, "lambda-policy", {
      name: `payment-processor-policy-${environmentSuffix}`,
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
            Resource: `${lambdaLogGroup.arn}:*`,
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:UpdateItem",
            ],
            Resource: [
              transactionsTable.arn,
              `${transactionsTable.arn}/index/*`,
            ],
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject", "s3:GetObject"],
            Resource: [
              `${logsBucket.arn}/*`,
              `${receiptsBucket.arn}/*`,
            ],
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, "lambda-policy-attachment", {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Lambda Function
    const lambdaFunction = new LambdaFunction(this, "payment-processor", {
      functionName: `payment-processor-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "nodejs18.x",
      memorySize: envConfig.lambdaMemory,
      timeout: 30,
      environment: {
        variables: {
          TRANSACTIONS_TABLE: transactionsTable.name,
          LOGS_BUCKET: logsBucket.bucket,
          RECEIPTS_BUCKET: receiptsBucket.bucket,
          ENVIRONMENT: environment,
        },
      },
      filename: "lambda/payment-processor.zip",
      sourceCodeHash: "${filebase64sha256(\"lambda/payment-processor.zip\")}",
      tags: commonTags,
      dependsOn: [lambdaLogGroup],
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, "payment-api", {
      name: `payment-api-${environmentSuffix}`,
      description: `Payment Processing API - ${environment}`,
      tags: commonTags,
    });

    // API Gateway Resource
    const paymentsResource = new ApiGatewayResource(this, "payments-resource", {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "payments",
    });

    // API Gateway Method
    const postMethod = new ApiGatewayMethod(this, "post-method", {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: "POST",
      authorization: "NONE",
      apiKeyRequired: true,
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, "api-lambda-permission", {
      statementId: "AllowAPIGatewayInvoke",
      action: "lambda:InvokeFunction",
      functionName: lambdaFunction.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Integration
    new ApiGatewayIntegration(this, "lambda-integration", {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, "api-deployment", {
      restApiId: api.id,
      dependsOn: [postMethod],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, "api-stage", {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: environment,
      tags: commonTags,
    });

    // API Gateway Usage Plan
    const usagePlan = new ApiGatewayUsagePlan(this, "usage-plan", {
      name: `payment-api-plan-${environmentSuffix}`,
      description: `Usage plan for ${environment} environment`,
      apiStages: [
        {
          apiId: api.id,
          stage: stage.stageName,
        },
      ],
      throttleSettings: {
        rateLimit: envConfig.apiRateLimit,
        burstLimit: envConfig.apiBurstLimit,
      },
      tags: commonTags,
    });

    // API Gateway API Key
    const apiKey = new ApiGatewayApiKey(this, "api-key", {
      name: `payment-api-key-${environmentSuffix}`,
      description: `API key for ${environment} environment`,
      enabled: true,
      tags: commonTags,
    });

    // Associate API Key with Usage Plan
    new ApiGatewayUsagePlanKey(this, "usage-plan-key", {
      keyId: apiKey.id,
      keyType: "API_KEY",
      usagePlanId: usagePlan.id,
    });

    // Outputs
    new TerraformOutput(this, "api-endpoint", {
      value: `${api.executionArn}/${environment}/payments`,
      description: "Payment API endpoint URL",
    });

    new TerraformOutput(this, "api-key-id", {
      value: apiKey.id,
      description: "API Key ID",
      sensitive: true,
    });

    new TerraformOutput(this, "logs-bucket-name", {
      value: logsBucket.bucket,
      description: "S3 bucket for transaction logs",
    });

    new TerraformOutput(this, "receipts-bucket-name", {
      value: receiptsBucket.bucket,
      description: "S3 bucket for payment receipts",
    });

    new TerraformOutput(this, "transactions-table-name", {
      value: transactionsTable.name,
      description: "DynamoDB table for transactions",
    });

    new TerraformOutput(this, "lambda-function-name", {
      value: lambdaFunction.functionName,
      description: "Lambda function name",
    });
  }

  private getEnvironmentConfig(environment: string) {
    const configs = {
      dev: {
        s3RetentionDays: 7,
        dynamodbBillingMode: "PAY_PER_REQUEST",
        dynamodbReadCapacity: undefined,
        dynamodbWriteCapacity: undefined,
        lambdaMemory: 512,
        logRetentionDays: 7,
        apiRateLimit: 100,
        apiBurstLimit: 200,
      },
      staging: {
        s3RetentionDays: 30,
        dynamodbBillingMode: "PROVISIONED",
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        lambdaMemory: 1024,
        logRetentionDays: 14,
        apiRateLimit: 500,
        apiBurstLimit: 1000,
      },
      prod: {
        s3RetentionDays: 90,
        dynamodbBillingMode: "PROVISIONED",
        dynamodbReadCapacity: 10,
        dynamodbWriteCapacity: 10,
        lambdaMemory: 2048,
        logRetentionDays: 30,
        apiRateLimit: 1000,
        apiBurstLimit: 2000,
      },
    };

    return configs[environment as keyof typeof configs];
  }
}
```

## File: lib/lambda/payment-processor/index.ts

```typescript
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDb = new DynamoDBClient({});
const s3 = new S3Client({});

const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE!;
const LOGS_BUCKET = process.env.LOGS_BUCKET!;
const RECEIPTS_BUCKET = process.env.RECEIPTS_BUCKET!;
const ENVIRONMENT = process.env.ENVIRONMENT!;

interface PaymentRequest {
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const payment: PaymentRequest = JSON.parse(event.body);

    // Validate request
    if (!payment.customerId || !payment.amount || !payment.currency) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "customerId, amount, and currency are required",
        }),
      };
    }

    // Generate transaction ID and timestamp
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();
    const transactionDate = new Date().toISOString().split("T")[0];

    // Store transaction in DynamoDB
    await dynamoDb.send(
      new PutItemCommand({
        TableName: TRANSACTIONS_TABLE,
        Item: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          customerId: { S: payment.customerId },
          transactionDate: { S: transactionDate },
          amount: { N: payment.amount.toString() },
          currency: { S: payment.currency },
          description: { S: payment.description || "" },
          status: { S: "processed" },
          environment: { S: ENVIRONMENT },
        },
      })
    );

    // Create transaction log
    const logData = {
      transactionId,
      timestamp,
      customerId: payment.customerId,
      amount: payment.amount,
      currency: payment.currency,
      status: "processed",
      environment: ENVIRONMENT,
    };

    // Store log in S3
    await s3.send(
      new PutObjectCommand({
        Bucket: LOGS_BUCKET,
        Key: `${transactionDate}/${transactionId}.json`,
        Body: JSON.stringify(logData),
        ContentType: "application/json",
      })
    );

    // Create receipt
    const receipt = {
      transactionId,
      date: new Date().toISOString(),
      customerId: payment.customerId,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      status: "success",
    };

    // Store receipt in S3
    await s3.send(
      new PutObjectCommand({
        Bucket: RECEIPTS_BUCKET,
        Key: `receipts/${transactionId}.json`,
        Body: JSON.stringify(receipt),
        ContentType: "application/json",
      })
    );

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        transactionId,
        receipt,
      }),
    };
  } catch (error) {
    console.error("Payment processing error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process payment",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
```

## File: main.ts

```typescript
import { App } from "cdktf";
import { PaymentApiStack } from "./lib/payment-api-stack";

const app = new App();

// Deploy for development environment
new PaymentApiStack(app, "payment-api-dev", {
  environment: "dev",
  environmentSuffix: "dev-001",
  region: "ap-northeast-2",
});

// Deploy for staging environment
new PaymentApiStack(app, "payment-api-staging", {
  environment: "staging",
  environmentSuffix: "staging-001",
  region: "ap-northeast-2",
});

// Deploy for production environment
new PaymentApiStack(app, "payment-api-prod", {
  environment: "prod",
  environmentSuffix: "prod-001",
  region: "ap-northeast-2",
});

app.synth();
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "payment-api-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: package.json

```json
{
  "name": "payment-api-infrastructure",
  "version": "1.0.0",
  "description": "CDKTF infrastructure for payment processing API",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts"
  },
  "keywords": [
    "cdktf",
    "terraform",
    "aws",
    "payment-api"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-s3": "^3.450.0",
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0",
    "@cdktf/provider-aws": "^19.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.130",
    "@types/jest": "^29.5.8",
    "@types/node": "^20.9.0",
    "@typescript-eslint/eslint-plugin": "^6.11.0",
    "@typescript-eslint/parser": "^6.11.0",
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
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
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "cdktf.out"
  ]
}
```

## File: lib/README.md

```markdown
# Payment Processing API Infrastructure

CDKTF TypeScript implementation for multi-environment payment processing API infrastructure.

## Architecture

This infrastructure deploys a complete payment processing API with:

- **S3 Buckets**: Transaction logs and payment receipts storage with lifecycle policies
- **DynamoDB**: Transaction records with GSI for customer and date queries
- **Lambda**: Payment processor with environment-specific memory allocation
- **API Gateway**: REST API with throttling, API keys, and stage management
- **CloudWatch**: Log groups with retention policies for monitoring

## Environment Configuration

The stack supports three environments with different configurations:

### Development (dev)
- S3 retention: 7 days
- DynamoDB: On-demand billing
- Lambda: 512MB memory
- Logs: 7 days retention
- API: 100 requests/sec, 200 burst

### Staging (staging)
- S3 retention: 30 days
- DynamoDB: Provisioned (5 RCU/WCU)
- Lambda: 1GB memory
- Logs: 14 days retention
- API: 500 requests/sec, 1000 burst

### Production (prod)
- S3 retention: 90 days
- DynamoDB: Provisioned (10 RCU/WCU) with PITR
- Lambda: 2GB memory
- Logs: 30 days retention
- API: 1000 requests/sec, 2000 burst

## Prerequisites

- Node.js 18.x or higher
- CDKTF CLI installed (`npm install -g cdktf-cli`)
- AWS credentials configured
- Terraform installed

## Installation

```bash
npm install
```

## Building Lambda Package

```bash
cd lib/lambda/payment-processor
npm install
zip -r ../payment-processor.zip .
cd ../..
```

## Deployment

### Synthesize the configuration

```bash
npm run synth
```

### Deploy to specific environment

```bash
# Deploy to development
cdktf deploy payment-api-dev

# Deploy to staging
cdktf deploy payment-api-staging

# Deploy to production
cdktf deploy payment-api-prod
```

### Deploy all environments

```bash
cdktf deploy
```

## Testing the API

After deployment, you can test the payment API:

```bash
# Get API key from outputs
API_KEY=$(cdktf output payment-api-dev -json | jq -r '.api_key_id')

# Make a payment request
curl -X POST https://API_ID.execute-api.ap-northeast-2.amazonaws.com/dev/payments \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-12345",
    "amount": 99.99,
    "currency": "USD",
    "description": "Test payment"
  }'
```

## Resource Naming

All resources include the `environmentSuffix` parameter for unique identification:

- S3 Buckets: `payment-logs-{environmentSuffix}`, `payment-receipts-{environmentSuffix}`
- DynamoDB: `payment-transactions-{environmentSuffix}`
- Lambda: `payment-processor-{environmentSuffix}`
- API Gateway: `payment-api-{environmentSuffix}`

## Security Features

- S3 buckets encrypted with AES256
- IAM roles follow least privilege principle
- API Gateway requires API keys for authentication
- CloudWatch logging enabled for all Lambda functions
- DynamoDB point-in-time recovery for production

## Monitoring

CloudWatch log groups are created with environment-specific retention:

- Lambda logs: `/aws/lambda/payment-processor-{environmentSuffix}`
- API Gateway logs: Integrated with API stages

## Cleanup

To destroy the infrastructure:

```bash
# Destroy specific environment
cdktf destroy payment-api-dev

# Destroy all environments
cdktf destroy
```

**Note**: Ensure S3 buckets are empty before destroying the stack.

## Outputs

Each deployment provides the following outputs:

- `api-endpoint`: Payment API endpoint URL
- `api-key-id`: API key for authentication (sensitive)
- `logs-bucket-name`: S3 bucket for transaction logs
- `receipts-bucket-name`: S3 bucket for payment receipts
- `transactions-table-name`: DynamoDB table name
- `lambda-function-name`: Lambda function name

## Troubleshooting

### Lambda deployment issues

If Lambda deployment fails, ensure the ZIP file exists:

```bash
ls -lh lib/lambda/payment-processor.zip
```

### API Gateway 403 errors

Verify API key is included in request headers:

```bash
-H "x-api-key: YOUR_API_KEY"
```

### DynamoDB throttling

For production workloads, adjust read/write capacity in `getEnvironmentConfig()` method.

## Cost Optimization

- Development uses on-demand DynamoDB billing
- Short retention periods for development/staging
- Lifecycle policies automatically delete old data
- Serverless Lambda for compute

## License

MIT
```

## File: .gitignore

```
# CDKTF
cdktf.out/
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl

# Node
node_modules/
dist/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Build
*.zip
lib/lambda/*.zip

# Tests
coverage/
.nyc_output/
```
