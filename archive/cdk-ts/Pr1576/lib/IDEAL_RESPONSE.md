# TAP Stack Infrastructure as Code

This document contains the complete AWS CDK TypeScript implementation for the TAP (Test Automation Platform) infrastructure stack.

## Table of Contents

- [Entry Point (bin/tap.ts)](#entry-point-bintapts)
- [Main Stack (lib/tap-stack.ts)](#main-stack-libtap-stackts)
- [Lambda Functions](#lambda-functions)
- [Infrastructure Overview](#infrastructure-overview)

---

## Entry Point (bin/tap.ts)

The main entry point for the CDK application that configures environment variables and creates the stack.

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

// Set AWS_REGION environment variable for CI/CD pipeline
process.env.AWS_REGION = 'us-west-2';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2', // Set to us-west-2 as per updated PROMPT.md requirements
  },
});
```

---

## Main Stack (lib/tap-stack.ts)

The core infrastructure stack that defines all AWS resources including KMS, DynamoDB, S3, Lambda functions, and API Gateway.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // KMS Key for encryption at rest - all data encryption
    const kmsKey = new kms.Key(this, 'TapAppKMSKey', {
      description: 'KMS key for TAP application encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow Secrets Manager Service',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
            ],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Add tags to KMS key
    cdk.Tags.of(kmsKey).add('Environment', props?.environmentSuffix || 'dev');
    cdk.Tags.of(kmsKey).add('Purpose', 'encryption');
    cdk.Tags.of(kmsKey).add('Compliance', 'encryption-at-rest');

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'TapAppKMSKeyAlias', {
      aliasName: 'alias/tap-app-key',
      targetKey: kmsKey,
    });

    // Secrets Manager for application secrets
    const appSecrets = new secretsmanager.Secret(this, 'TapAppSecrets', {
      secretName: 'tap-app/secrets',
      description: 'Application secrets for TAP serverless app',
      encryptionKey: kmsKey, // Enable KMS encryption for compliance
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // DynamoDB Table with encryption and on-demand capacity
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'tap-items-table',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity for cost optimization
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Add tags to DynamoDB table
    cdk.Tags.of(itemsTable).add(
      'Environment',
      props?.environmentSuffix || 'dev'
    );
    cdk.Tags.of(itemsTable).add('Purpose', 'data-storage');
    cdk.Tags.of(itemsTable).add('Compliance', 'encryption-at-rest');

    // Separate S3 bucket for access logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `tap-logs-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90), // Logs expire after 90 days
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // S3 Bucket for file uploads
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `tap-files-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: logsBucket, // Use separate bucket for logs
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: false, // Disabled for testing compatibility
    });

    // Add tags to S3 bucket
    cdk.Tags.of(filesBucket).add(
      'Environment',
      props?.environmentSuffix || 'dev'
    );
    cdk.Tags.of(filesBucket).add('Purpose', 'file-storage');
    cdk.Tags.of(filesBucket).add('Compliance', 'encryption-at-rest');

    // CloudWatch Log Groups for Lambda functions
    const createItemLogGroup = new logs.LogGroup(this, 'CreateItemLogGroup', {
      logGroupName: '/aws/lambda/tap-create-item',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const getItemsLogGroup = new logs.LogGroup(this, 'GetItemsLogGroup', {
      logGroupName: '/aws/lambda/tap-get-items',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const uploadFileLogGroup = new logs.LogGroup(this, 'UploadFileLogGroup', {
      logGroupName: '/aws/lambda/tap-upload-file',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda execution
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add custom policies for Lambda functions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [itemsTable.tableArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [filesBucket.bucketArn, `${filesBucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [appSecrets.secretArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:Decrypt',
          'kms:GenerateDataKey',
          'kms:DescribeKey',
        ],
        resources: [kmsKey.keyArn],
      })
    );

    // Lambda Functions
    const createItemFunction = new lambda.Function(this, 'CreateItemFunction', {
      functionName: 'tap-create-item',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create_item.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: itemsTable.tableName,
        BUCKET_NAME: filesBucket.bucketName,
        SECRET_ARN: appSecrets.secretArn,
        KMS_KEY_ID: kmsKey.keyId,
      },
      role: lambdaRole,
    });

    const getItemsFunction = new lambda.Function(this, 'GetItemsFunction', {
      functionName: 'tap-get-items',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_item.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: itemsTable.tableName,
        BUCKET_NAME: filesBucket.bucketName,
        SECRET_ARN: appSecrets.secretArn,
        KMS_KEY_ID: kmsKey.keyId,
      },
      role: lambdaRole,
    });

    const uploadFileFunction = new lambda.Function(this, 'UploadFileFunction', {
      functionName: 'tap-upload-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'upload_file.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: itemsTable.tableName,
        BUCKET_NAME: filesBucket.bucketName,
        SECRET_ARN: appSecrets.secretArn,
        KMS_KEY_ID: kmsKey.keyId,
      },
      role: lambdaRole,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'TAP Serverless API',
      description: 'Secure serverless web application API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // API Resources and Methods
    const itemsResource = api.root.addResource('items');
    const itemResource = itemsResource.addResource('{id}');

    // Create Item
    itemsResource.addMethod('POST', new apigateway.LambdaIntegration(createItemFunction));

    // Get Items
    itemsResource.addMethod('GET', new apigateway.LambdaIntegration(getItemsFunction));

    // Get Item by ID
    itemResource.addMethod('GET', new apigateway.LambdaIntegration(getItemsFunction));

    // Update Item
    itemResource.addMethod('PUT', new apigateway.LambdaIntegration(createItemFunction));

    // Delete Item
    itemResource.addMethod('DELETE', new apigateway.LambdaIntegration(createItemFunction));

    // File Upload
    const filesResource = api.root.addResource('files');
    filesResource.addMethod('POST', new apigateway.LambdaIntegration(uploadFileFunction));

    // Add tags to all resources
    cdk.Tags.of(api).add('Environment', props?.environmentSuffix || 'dev');
    cdk.Tags.of(api).add('Purpose', 'api-gateway');
    cdk.Tags.of(createItemFunction).add('Environment', props?.environmentSuffix || 'dev');
    cdk.Tags.of(getItemsFunction).add('Environment', props?.environmentSuffix || 'dev');
    cdk.Tags.of(uploadFileFunction).add('Environment', props?.environmentSuffix || 'dev');

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'TapApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: itemsTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'TapDynamoDBTableName',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket for file uploads',
      exportName: 'TapS3BucketName',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: 'TapKMSKeyId',
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: appSecrets.secretArn,
      description: 'Secrets Manager secret ARN',
      exportName: 'TapSecretsManagerArn',
    });
  }
}
```

---

## Lambda Functions

The Lambda functions are stored in the `lambda/` directory and handle the core business logic.

### create_item.handler

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });
const kmsClient = new KMSClient({ region: 'us-west-2' });

export const handler = async (
  event: any,
  context: any
): Promise<{ statusCode: number; body: string }> => {
  try {
    const { id, name, description, fileUrl } = JSON.parse(event.body);
    
    // Validate input
    if (!id || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: id and name' }),
      };
    }

    // Create item in DynamoDB
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          id,
          name,
          description: description || '',
          fileUrl: fileUrl || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Item created successfully', id }),
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### get_item.handler

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (
  event: any,
  context: any
): Promise<{ statusCode: number; body: string }> => {
  try {
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    if (event.pathParameters && event.pathParameters.id) {
      // Get specific item by ID
      const { id } = event.pathParameters;
      const result = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { id },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Item not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    } else {
      // Get all items
      const result = await docClient.send(
        new ScanCommand({
          TableName: process.env.TABLE_NAME,
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items || []),
      };
    }
  } catch (error) {
    console.error('Error getting items:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### upload_file.handler

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const s3Client = new S3Client({ region: 'us-west-2' });
const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (
  event: any,
  context: any
): Promise<{ statusCode: number; body: string }> => {
  try {
    const { itemId, fileName, fileContent, contentType } = JSON.parse(event.body);
    
    if (!itemId || !fileName || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Upload file to S3
    const key = `uploads/${itemId}/${fileName}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileContent, 'base64'),
        ContentType: contentType || 'application/octet-stream',
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: process.env.KMS_KEY_ID,
      })
    );

    // Update item in DynamoDB with file URL
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: itemId },
        UpdateExpression: 'SET fileUrl = :fileUrl, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':fileUrl': `s3://${process.env.BUCKET_NAME}/${key}`,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'File uploaded successfully',
        fileUrl: `s3://${process.env.BUCKET_NAME}/${key}`,
      }),
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

---

## Infrastructure Overview

### Security Features

- **KMS Encryption**: All data is encrypted at rest using AWS KMS
- **IAM Least Privilege**: Lambda functions have minimal required permissions
- **S3 Security**: Buckets are private with encryption enabled
- **Secrets Management**: Application secrets stored securely in AWS Secrets Manager

### Scalability Features

- **DynamoDB On-Demand**: Automatic scaling based on demand
- **Lambda Auto-scaling**: Serverless functions scale automatically
- **S3 Lifecycle**: Automatic log rotation and cleanup

### Monitoring & Logging

- **CloudWatch Logs**: Centralized logging for all Lambda functions
- **S3 Access Logs**: Detailed access logging for audit purposes
- **API Gateway Logging**: Request/response logging for debugging

### Cost Optimization

- **On-Demand Billing**: Pay only for resources used
- **Log Retention**: Configurable log retention periods
- **Resource Cleanup**: Automatic cleanup of demo resources

---

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- AWS CDK CLI installed globally

### Commands

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
npm run cdk:synth

# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy to AWS
npm run cdk:deploy

# Destroy infrastructure
npm run cdk:destroy
```

### Environment Variables

- `CDK_DEFAULT_ACCOUNT`: AWS account ID
- `CDK_DEFAULT_REGION`: AWS region (set to us-west-2)
- `ENVIRONMENT_SUFFIX`: Environment identifier (dev, staging, prod)

---

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### All Tests

```bash
npm run test
```

---

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Functions│───▶│   DynamoDB      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   S3 Buckets    │    │   KMS Keys      │    │ Secrets Manager │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

This infrastructure provides a secure, scalable, and cost-effective foundation for the TAP application with proper separation of concerns and industry best practices.

