# IDEAL RESPONSE - CDKTF TypeScript: Payment Processing API Stack

## Overview

This stack provisions an environment-isolated Payment Processing API on AWS using CDK for Terraform (CDKTF, TypeScript). It deploys API Gateway (REST), AWS Lambda (Node.js 18), DynamoDB, and S3 with practical defaults, per-environment naming, and Terraform state in S3.

- Project tag: `payment-api`
- Default deployment region: `ap-northeast-2`
- State backend bucket (encrypted): `iac-rlhf-tf-states` in `us-east-1`
- Environment isolation via `environment` and `environmentSuffix`

## Architecture

- API Gateway (REST)
  - Resource: `/payments`
  - Method: `POST`
  - Authorization: `NONE` (no API key required)
  - Proxy integration to Lambda
- AWS Lambda (Node.js 18)
  - Processes payment requests
  - Writes transaction to DynamoDB
  - Writes transaction logs and receipts to S3
  - Memory size: `prod=2048`, `staging=1024`, `dev=512`
  - Timeout: 30s
- DynamoDB
  - Table: `payment-transactions-{environmentSuffix}`
  - Keys: `transactionId` (PK), `timestamp` (SK)
  - GSIs:
    - `customer-index` (PK: `customerId`, SK: `timestamp`)
    - `date-index` (PK: `transactionDate`, SK: `timestamp`)
  - Billing:
    - `dev`: `PAY_PER_REQUEST`
    - `staging`: provisioned `5 RCU / 5 WCU`
    - `prod`: provisioned `10 RCU / 10 WCU`
  - PITR: enabled only in `prod`
- S3
  - Logs bucket: `payment-logs-{environmentSuffix}`
  - Receipts bucket: `payment-receipts-duoct-{environmentSuffix}`
  - Versioning: enabled
  - Server-side encryption: AES256
  - Public access blocked
  - Lifecycle expiration:
    - `prod`: 90 days
    - `staging`: 30 days
    - `dev`: 7 days
- Logging
  - CloudWatch Log Group for Lambda: `/aws/lambda/payment-processor-{environmentSuffix}`
  - Retention:
    - `prod`: 30 days
    - `staging`: 14 days
    - `dev`: 7 days
  - API Gateway: access logging not configured

## Provider and State

- AWS Provider
  - Region: `ap-northeast-2` by default (overridable)
  - Supports `defaultTags`
- Terraform Backend (S3)
  - Bucket: `iac-rlhf-tf-states`
  - Region: `us-east-1`
  - Key: `{environmentSuffix}/{stackId}.tfstate`
  - Encryption: enabled

## Configuration Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| environment | 'dev' \| 'staging' \| 'prod' | 'dev' | Controls sizing, retention, and some features |
| environmentSuffix | string | environment | Suffix used in resource names and state path |
| stateBucket | string | 'iac-rlhf-tf-states' | S3 bucket that stores Terraform state |
| stateBucketRegion | string | 'us-east-1' | Region of the state bucket |
| awsRegion | string | 'ap-northeast-2' | AWS region where resources will be created |
| defaultTags | AwsProviderDefaultTags | [] | Default tags applied to all AWS resources |

Tags applied to resources:
- `Environment`, `Project=payment-api`, `ManagedBy=cdktf`, `EnvironmentSuffix`

## Lambda Behavior

- Input: JSON body with fields:
  - `customerId` (string), `amount` (number), `currency` (string), `description` (optional)
- Actions:
  - Persist transaction to DynamoDB (PutItem)
  - Write transaction log JSON to logs bucket
  - Write receipt JSON to receipts bucket
- Response:
  - Success: 200 with `{ success, transactionId, receipt }`
  - Failure: 400 on missing body/fields; 500 on unhandled errors
- Env vars:
  - `TRANSACTIONS_TABLE`, `LOGS_BUCKET`, `RECEIPTS_BUCKET`, `ENVIRONMENT`

## API

- Endpoint output example:
  - `https://{apiId}.execute-api.{region}.amazonaws.com/{environment}/payments`
- Method: `POST`
- Authorization: `NONE` (no API key, authorizer, or IAM auth configured)
- Integration: Lambda proxy

## Outputs

- `api-endpoint`: API URL for `POST /payments`
- `logs-bucket-name`: Logs bucket name
- `receipts-bucket-name`: Receipts bucket name
- `transactions-table-name`: DynamoDB table name
- `lambda-function-name`: Lambda function name

## Usage

Install deps and generate providers:
```bash
npm install
cdktf get
```

Synthesize:
```bash
# example: staging in ap-northeast-2 with suffix 'staging'
cdktf synth
```

Deploy:
```bash
cdktf deploy
```

Destroy:
```bash
cdktf destroy
```

Programmatic usage example:
```typescript
import { App } from 'cdktf';
import { TapStack } from './lib/tap-stack';

const app = new App();
new TapStack(app, 'TapStack-staging', {
  environment: 'staging',
  environmentSuffix: 'staging',
  awsRegion: 'ap-northeast-2',
  stateBucket: 'iac-rlhf-tf-states',
  stateBucketRegion: 'us-east-1',
  defaultTags: {
    tags: {
      Repository: 'iac-test-automations',
      Owner: 'team',
    },
  },
});
app.synth();
```

## Security Notes

- Current state:
  - API Gateway method authorization is `NONE` (no API key or authorizer)
  - S3 buckets: encryption enabled, versioning enabled, public access blocked
  - Lambda execution role:
    - AWS managed basic execution role for logs
    - Inline least-privilege policy for DynamoDB (table and indexes) and S3 Put/Get on the two buckets
  - Terraform state: encrypted in S3
- Consider hardening for production:
  - Require API key and usage plan (throttling/quotas)
  - Add access logs for API Gateway (JSON to CloudWatch)
  - Add authorizer (Cognito or Lambda authorizer) if needed
  - Structured JSON logging in Lambda and correlation IDs
  - WAF in front of API Gateway for additional protection
  - Dead-letter queue and retries if needed for resiliency

## Observability

- Lambda logs to CloudWatch with environment-based retention
- API Gateway access logging is not configured in the current stack
- DynamoDB metrics and S3 access logs are not explicitly configured

## Cost Considerations

- `dev` uses `PAY_PER_REQUEST` for DynamoDB
- Lower retention and lifecycle policies in non-prod reduce storage costs
- Force-destroy for non-prod buckets simplifies teardown

## Testing Guidance

Recommended test coverage (aligns with current behavior):
- Provider region and default tags configured as expected
- S3 backend configured with encryption and environment-specific key
- S3 buckets: names, versioning, encryption, lifecycle, and public access block
- DynamoDB table: keys, GSIs, billing mode per environment, PITR in prod only
- Lambda: memory/timeout/env vars, role attachments and inline policy
- API Gateway: resource, method (authorization `NONE`), proxy integration, deployment/stage
- Outputs: endpoint and resource names

## Change Log Alignment

- This document describes the actual implementation in `lib/tap-stack.ts`, including:
  - No API authentication on `POST /payments`
  - No API Gateway access logs
  - Inline Lambda code with basic error handling
- Any future security or observability enhancements should be reflected here when implemented.

## Full Source: tap-stack.ts

The full source of the stack for reference:

```1:558:/home/gcv/Projects/iac-test-automations/lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// AWS resources
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

// Archive provider for creating Lambda zip
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import path from 'path';

interface TapStackProps {
  environment?: 'dev' | 'staging' | 'prod';
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'ap-northeast-2'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';
    const environmentSuffix = props?.environmentSuffix || environment;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-northeast-2';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure Archive Provider for Lambda zip creation
    new ArchiveProvider(this, 'archive');

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Payment API resources
    const commonTags = {
      Environment: environment,
      Project: 'payment-api',
      ManagedBy: 'cdktf',
      EnvironmentSuffix: environmentSuffix,
    };

    // S3 buckets: logs and receipts
    const logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `payment-logs-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: 'transaction-logs',
      },
      forceDestroy: environment !== 'prod',
    });

    new S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: logsBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, 'logs-bucket-lifecycle', {
      bucket: logsBucket.id,
      rule: [
        {
          id: 'expire-old-logs',
          status: 'Enabled',
          filter: [{}], // Required for AWS provider 5.x+
          expiration: [
            {
              days:
                environment === 'prod'
                  ? 90
                  : environment === 'staging'
                    ? 30
                    : 7,
            },
          ],
        },
      ],
    });

    const receiptsBucket = new S3Bucket(this, 'receipts-bucket', {
      bucket: `payment-receipts-duoct-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: 'payment-receipts',
      },
      forceDestroy: environment !== 'prod',
    });

    new S3BucketVersioningA(this, 'receipts-bucket-versioning', {
      bucket: receiptsBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'receipts-bucket-encryption',
      {
        bucket: receiptsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'receipts-bucket-pab', {
      bucket: receiptsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, 'receipts-bucket-lifecycle', {
      bucket: receiptsBucket.id,
      rule: [
        {
          id: 'expire-old-receipts',
          status: 'Enabled',
          filter: [{}], // Required for AWS provider 5.x+
          expiration: [
            {
              days:
                environment === 'prod'
                  ? 90
                  : environment === 'staging'
                    ? 30
                    : 7,
            },
          ],
        },
      ],
    });

    // DynamoDB table for transactions
    const transactionsTable = new DynamodbTable(this, 'transactions-table', {
      name: `payment-transactions-${environmentSuffix}`,
      billingMode: environment === 'dev' ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      readCapacity:
        environment === 'prod' ? 10 : environment === 'staging' ? 5 : undefined,
      writeCapacity:
        environment === 'prod' ? 10 : environment === 'staging' ? 5 : undefined,
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        { name: 'transactionId', type: 'S' },
        { name: 'timestamp', type: 'N' },
        { name: 'customerId', type: 'S' },
        { name: 'transactionDate', type: 'S' },
      ],
      globalSecondaryIndex: [
        {
          name: 'customer-index',
          hashKey: 'customerId',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
          writeCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
        },
        {
          name: 'date-index',
          hashKey: 'transactionDate',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
          writeCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
        },
      ],
      pointInTimeRecovery: { enabled: environment === 'prod' },
      tags: { ...commonTags, Purpose: 'transaction-storage' },
    });

    // CloudWatch log group for Lambda
    const logRetentionDays =
      environment === 'prod' ? 30 : environment === 'staging' ? 14 : 7;

    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/payment-processor-${environmentSuffix}`,
      retentionInDays: logRetentionDays,
      tags: commonTags,
    });

    // IAM role and policies for Lambda
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `payment-processor-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    // Basic execution role for logs
    new IamRolePolicyAttachment(this, 'lambda-basic-exec', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Least-privilege inline policy for DynamoDB and S3
    new IamRolePolicy(this, 'lambda-inline-policy', {
      name: `payment-processor-inline-${environmentSuffix}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
              'dynamodb:DescribeTable',
            ],
            Resource: [
              transactionsTable.arn,
              `${transactionsTable.arn}/index/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: [`${logsBucket.arn}/*`, `${receiptsBucket.arn}/*`],
          },
        ],
      }),
    });

    // Create Lambda function code inline - using string concatenation to avoid Terraform interpolation issues
    const lambdaCode = `const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const dynamoDb = new DynamoDBClient({});
const s3 = new S3Client({});

const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE;
const LOGS_BUCKET = process.env.LOGS_BUCKET;
const RECEIPTS_BUCKET = process.env.RECEIPTS_BUCKET;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const payment = JSON.parse(event.body);

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
    const transactionId = "txn-" + Date.now() + "-" + Math.random().toString(36).substring(7);
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
        Key: transactionDate + "/" + transactionId + ".json",
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
        Key: "receipts/" + transactionId + ".json",
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
};`;

    // Create Lambda zip file from inline code
    const lambdaZip = new DataArchiveFile(this, 'lambda-zip', {
      type: 'zip',
      outputPath: path.join(__dirname, '..', 'lambda', 'payment-processor.zip'),
      source: [
        {
          content: lambdaCode,
          filename: 'index.js',
        },
      ],
    });

    // Lambda function
    const lambdaFn = new LambdaFunction(this, 'payment-processor', {
      functionName: `payment-processor-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      memorySize:
        environment === 'prod' ? 2048 : environment === 'staging' ? 1024 : 512,
      timeout: 30,
      environment: {
        variables: {
          TRANSACTIONS_TABLE: transactionsTable.name,
          LOGS_BUCKET: logsBucket.bucket,
          RECEIPTS_BUCKET: receiptsBucket.bucket,
          ENVIRONMENT: environment,
        },
      },
      filename: lambdaZip.outputPath,
      sourceCodeHash: lambdaZip.outputBase64Sha256,
      tags: commonTags,
      dependsOn: [lambdaLogGroup],
    });

    // API Gateway: /payments POST -> Lambda (proxy)
    const api = new ApiGatewayRestApi(this, 'payment-api', {
      name: `payment-api-${environmentSuffix}`,
      description: `Payment Processing API - ${environment}`,
      tags: commonTags,
    });

    const paymentsResource = new ApiGatewayResource(this, 'payments-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'payments',
    });

    const postMethod = new ApiGatewayMethod(this, 'post-method', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFn.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    const integration = new ApiGatewayIntegration(this, 'lambda-integration', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFn.invokeArn,
    });

    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [postMethod],
      lifecycle: { createBeforeDestroy: true },
      triggers: { redeploy: integration.id },
    });

    // Instantiate Stage without assigning (avoid unused variable lint)
    new ApiGatewayStage(this, 'api-stage', {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: environment,
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${awsRegion}.amazonaws.com/${environment}/payments`,
      description: 'Payment API endpoint URL',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket,
      description: 'S3 bucket for transaction logs',
    });

    new TerraformOutput(this, 'receipts-bucket-name', {
      value: receiptsBucket.bucket,
      description: 'S3 bucket for payment receipts',
    });

    new TerraformOutput(this, 'transactions-table-name', {
      value: transactionsTable.name,
      description: 'DynamoDB table for transactions',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambdaFn.functionName,
      description: 'Lambda function name',
    });
  }
}
```
