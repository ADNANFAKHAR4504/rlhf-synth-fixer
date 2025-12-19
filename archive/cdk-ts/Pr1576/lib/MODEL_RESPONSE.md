bin/tap.ts

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Deploy the stack to us-west-2 region as specified in constraints
new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2', // Fixed region as per constraints
  },
  description: 'Secure Serverless Web Application Stack',
});

lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for encryption at rest - all data encryption
    const kmsKey = new kms.Key(this, 'TapAppKMSKey', {
      description: 'KMS key for TAP application encryption',
      enableKeyRotation: true,
      keyPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'TapAppKMSKeyAlias', {
      aliasName: 'alias/tap-app-key',
      targetKey: kmsKey,
    });

    // Secrets Manager for application secrets
    const appSecrets = new secretsmanager.Secret(this, 'TapAppSecrets', {
      secretName: 'tap-app/secrets',
      description: 'Application secrets for TAP serverless app',
      encryptionKey: kmsKey,
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
      billingMode: dynamodb.BillingMode.ON_DEMAND, // On-demand capacity as required
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // S3 Bucket for file uploads with encryption
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `tap-files-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // CloudWatch Log Groups for Lambda functions
    const createItemLogGroup = new logs.LogGroup(this, 'CreateItemLogGroup', {
      logGroupName: '/aws/lambda/tap-create-item',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const getItemsLogGroup = new logs.LogGroup(this, 'GetItemsLogGroup', {
      logGroupName: '/aws/lambda/tap-get-items',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const uploadFileLogGroup = new logs.LogGroup(this, 'UploadFileLogGroup', {
      logGroupName: '/aws/lambda/tap-upload-file',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda functions with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [itemsTable.tableArn],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${filesBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [filesBucket.bucketArn],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [appSecrets.secretArn],
            }),
          ],
        }),
        CloudWatchLogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                createItemLogGroup.logGroupArn,
                getItemsLogGroup.logGroupArn,
                uploadFileLogGroup.logGroupArn,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda function to create items in DynamoDB
    const createItemFunction = new lambda.Function(this, 'CreateItemFunction', {
      functionName: 'tap-create-item',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/create-item'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        TABLE_NAME: itemsTable.tableName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: createItemLogGroup,
    });

    // Lambda function to get items from DynamoDB
    const getItemsFunction = new lambda.Function(this, 'GetItemsFunction', {
      functionName: 'tap-get-items',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/get-items'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        TABLE_NAME: itemsTable.tableName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: getItemsLogGroup,
    });

    // Lambda function to upload files to S3
    const uploadFileFunction = new lambda.Function(this, 'UploadFileFunction', {
      functionName: 'tap-upload-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/upload-file'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        BUCKET_NAME: filesBucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: uploadFileLogGroup,
    });

    // API Gateway Request Validators
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: new apigateway.RestApi(this, 'TempApi'), // Temporary, will be replaced
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // API Gateway with CORS enabled
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
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create proper request validator for the actual API
    const actualRequestValidator = new apigateway.RequestValidator(this, 'ActualRequestValidator', {
      restApi: api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Request models for validation
    const createItemModel = api.addModel('CreateItemModel', {
      contentType: 'application/json',
      modelName: 'CreateItemModel',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Create Item Schema',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          name: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 100,
          },
          description: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 500,
          },
        },
        required: ['name'],
      },
    });

    // API Gateway resources and methods
    const itemsResource = api.root.addResource('items');
    
    // POST /items - Create item
    itemsResource.addMethod('POST', new apigateway.LambdaIntegration(createItemFunction), {
      requestValidator: actualRequestValidator,
      requestModels: {
        'application/json': createItemModel,
      },
    });

    // GET /items - Get all items
    itemsResource.addMethod('GET', new apigateway.LambdaIntegration(getItemsFunction));

    // Files resource for uploads
    const filesResource = api.root.addResource('files');
    
    // POST /files - Upload file
    filesResource.addMethod('POST', new apigateway.LambdaIntegration(uploadFileFunction), {
      requestValidator: actualRequestValidator,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: itemsTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket name for file uploads',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: appSecrets.secretArn,
      description: 'Secrets Manager secret ARN',
    });
  }
}

lambda/create-item.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

interface CreateItemRequest {
  name: string;
  description?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Create Item function invoked', JSON.stringify(event, null, 2));

  try {
    // Validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const requestBody: CreateItemRequest = JSON.parse(event.body);

    if (!requestBody.name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Name is required' }),
      };
    }

    // Verify access to secrets (demonstrates secrets manager integration)
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ARN,
      });
      await secretsClient.send(secretCommand);
      console.log('Successfully accessed application secrets');
    } catch (error) {
      console.error('Failed to access secrets:', error);
    }

    // Create item in DynamoDB
    const item = {
      id: randomUUID(),
      name: requestBody.name,
      description: requestBody.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const putCommand = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(item),
    });

    await dynamoClient.send(putCommand);

    console.log('Item created successfully:', item.id);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Item created successfully',
        item: item,
      }),
    };
  } catch (error) {
    console.error('Error creating item:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

lambda/get-items.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Get Items function invoked', JSON.stringify(event, null, 2));

  try {
    // Verify access to secrets (demonstrates secrets manager integration)
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ARN,
      });
      await secretsClient.send(secretCommand);
      console.log('Successfully accessed application secrets');
    } catch (error) {
      console.error('Failed to access secrets:', error);
    }

    // Scan DynamoDB table for all items
    const scanCommand = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    });

    const result = await dynamoClient.send(scanCommand);

    // Convert DynamoDB items to regular JavaScript objects
    const items = result.Items?.map(item => unmarshall(item)) || [];

    console.log(`Retrieved ${items.length} items from DynamoDB`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items: items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error retrieving items:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

lambda/upload-file.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Upload File function invoked', JSON.stringify(event, null, 2));

  try {
    // Verify access to secrets (demonstrates secrets manager integration)
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ARN,
      });
      await secretsClient.send(secretCommand);
      console.log('Successfully accessed application secrets');
    } catch (error) {
      console.error('Failed to access secrets:', error);
    }

    // Parse request for file upload parameters
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const fileName = requestBody.fileName || `file-${randomUUID()}`;
    const contentType = requestBody.contentType || 'application/octet-stream';

    // Generate a unique key for the file
    const fileKey = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    // Create a presigned URL for direct upload to S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.KMS_KEY_ID,
    });

    // Generate presigned URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 300 });

    // Also generate a presigned URL for downloading the file (valid for 1 hour)
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

    console.log('Generated presigned URLs for file:', fileKey);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Presigned URLs generated successfully',
        uploadUrl: uploadUrl,
        downloadUrl: downloadUrl,
        fileKey: fileKey,
        expiresIn: '5 minutes (upload) / 1 hour (download)',
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URLs:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};








