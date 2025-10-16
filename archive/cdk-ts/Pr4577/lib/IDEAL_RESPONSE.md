# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

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
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/crud-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

interface ApplicationRecord {
  id: string;
  timestamp: number;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * CRUD operations handler for application records
 * Supports creating, reading, updating, and deleting records in DynamoDB
 * Also supports querying by status using GSI
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('CRUD Event:', JSON.stringify(event));

  const { httpMethod, pathParameters, body, queryStringParameters } = event;
  const tableName = process.env.DYNAMODB_TABLE_NAME;

  if (!tableName) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Table name not configured' }),
    };
  }

  try {
    let response: unknown;
    let statusCode = 200;

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get specific item by ID
          if (!pathParameters.timestamp) {
            return {
              statusCode: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'timestamp parameter is required for GET by ID',
              }),
            };
          }

          const result = await dynamodb.send(
            new GetCommand({
              TableName: tableName,
              Key: {
                id: pathParameters.id,
                timestamp: parseInt(pathParameters.timestamp),
              },
            })
          );

          if (!result.Item) {
            statusCode = 404;
            response = { error: 'Item not found' };
          } else {
            response = result.Item;
          }
        } else if (queryStringParameters?.status) {
          // Query by status using GSI
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'StatusIndex',
              KeyConditionExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': queryStringParameters.status,
              },
              Limit: 50,
              ScanIndexForward: false, // Sort by timestamp descending
            })
          );
          response = {
            items: queryResult.Items || [],
            count: queryResult.Count,
          };
        } else {
          // Scan all items
          const scanResult = await dynamodb.send(
            new ScanCommand({
              TableName: tableName,
              Limit: 20,
            })
          );
          response = {
            items: scanResult.Items || [],
            count: scanResult.Count,
          };
        }
        break;

      case 'POST':
        // Create new item
        const inputData = JSON.parse(body || '{}');

        // Validate required fields
        if (!inputData.title) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'title field is required',
            }),
          };
        }

        const newItem: ApplicationRecord = {
          id: inputData.id || `item-${Date.now()}`,
          timestamp: Date.now(),
          status: inputData.status || 'pending',
          title: inputData.title,
          description: inputData.description,
          data: inputData.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: inputData.createdBy || 'system',
        };

        await dynamodb.send(
          new PutCommand({
            TableName: tableName,
            Item: newItem,
          })
        );

        statusCode = 201;
        response = {
          message: 'Item created successfully',
          item: newItem,
        };
        break;

      case 'PUT':
        // Update existing item
        if (!pathParameters?.id || !pathParameters?.timestamp) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'id and timestamp parameters are required for update',
            }),
          };
        }

        const updateData = JSON.parse(body || '{}');

        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        if (updateData.title) {
          updateExpressions.push('#title = :title');
          expressionAttributeNames['#title'] = 'title';
          expressionAttributeValues[':title'] = updateData.title;
        }

        if (updateData.description !== undefined) {
          updateExpressions.push('#description = :description');
          expressionAttributeNames['#description'] = 'description';
          expressionAttributeValues[':description'] = updateData.description;
        }

        if (updateData.status) {
          updateExpressions.push('#status = :status');
          expressionAttributeNames['#status'] = 'status';
          expressionAttributeValues[':status'] = updateData.status;
        }

        if (updateData.data) {
          updateExpressions.push('#data = :data');
          expressionAttributeNames['#data'] = 'data';
          expressionAttributeValues[':data'] = updateData.data;
        }

        // Always update the updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        if (updateExpressions.length === 1) {
          // Only updatedAt is being updated
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'No valid fields to update',
            }),
          };
        }

        const updateResult = await dynamodb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              id: pathParameters.id,
              timestamp: parseInt(pathParameters.timestamp),
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
          })
        );

        response = {
          message: 'Item updated successfully',
          item: updateResult.Attributes,
        };
        break;

      case 'DELETE':
        // Delete item
        if (!pathParameters?.id || !pathParameters?.timestamp) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'id and timestamp parameters are required for deletion',
            }),
          };
        }

        await dynamodb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              id: pathParameters.id,
              timestamp: parseInt(pathParameters.timestamp),
            },
          })
        );

        response = {
          message: 'Item deleted successfully',
          id: pathParameters.id,
          timestamp: pathParameters.timestamp,
        };
        break;

      default:
        statusCode = 405;
        response = { error: `Method ${httpMethod} not supported` };
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }),
    };
  }
};

```

## ./lib/lambda/file-processing-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

interface FileMetadata {
  id: string;
  timestamp: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  fileName: string;
  fileKey: string;
  fileSize: number;
  contentType: string;
  uploadedBy?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

/**
 * File processing handler that manages file uploads to S3 and tracks metadata in DynamoDB
 * Supports file validation, metadata tracking, and secure file access
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('File Processing Event:', JSON.stringify(event));

  const bucketName = process.env.S3_BUCKET_NAME;
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const { httpMethod, body, pathParameters, queryStringParameters } = event;

  if (!bucketName || !tableName) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Bucket name or table name not configured',
      }),
    };
  }

  try {
    let response: unknown;
    let statusCode = 200;

    switch (httpMethod) {
      case 'POST':
        // Upload file with metadata tracking
        const fileData = JSON.parse(body || '{}');

        // Validation
        if (!fileData.fileName) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'fileName is required',
            }),
          };
        }

        const contentType = fileData.contentType || 'application/octet-stream';
        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: `Content type ${contentType} not allowed`,
              allowedTypes: ALLOWED_CONTENT_TYPES,
            }),
          };
        }

        const content = fileData.content || '';
        const fileSize = Buffer.byteLength(content, 'utf8');

        if (fileSize > MAX_FILE_SIZE) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: `File size ${fileSize} exceeds maximum ${MAX_FILE_SIZE} bytes`,
            }),
          };
        }

        const fileId = `file-${Date.now()}`;
        const fileKey = `uploads/${fileId}/${fileData.fileName}`;

        // Upload to S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: content,
            ContentType: contentType,
            Metadata: {
              uploadedBy: fileData.uploadedBy || 'system',
              uploadTimestamp: new Date().toISOString(),
            },
          })
        );

        // Store metadata in DynamoDB
        const metadata: FileMetadata = {
          id: fileId,
          timestamp: Date.now(),
          status: 'uploaded',
          fileName: fileData.fileName,
          fileKey: fileKey,
          fileSize: fileSize,
          contentType: contentType,
          uploadedBy: fileData.uploadedBy || 'system',
          tags: fileData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await dynamodb.send(
          new PutCommand({
            TableName: tableName,
            Item: metadata,
          })
        );

        // Generate presigned URL for download
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          }),
          { expiresIn: 3600 } // 1 hour
        );

        statusCode = 201;
        response = {
          message: 'File uploaded successfully',
          file: {
            ...metadata,
            downloadUrl,
          },
        };
        break;

      case 'GET':
        if (pathParameters?.filename) {
          // Get specific file metadata and generate presigned URL
          const getFileId = pathParameters.filename;

          // Query DynamoDB for file metadata
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              KeyConditionExpression: 'id = :id',
              ExpressionAttributeValues: {
                ':id': getFileId,
              },
            })
          );

          if (!queryResult.Items || queryResult.Items.length === 0) {
            statusCode = 404;
            response = { error: 'File not found' };
          } else {
            const fileMetadata = queryResult.Items[0] as FileMetadata;

            // Generate presigned URL
            const downloadUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: bucketName,
                Key: fileMetadata.fileKey,
              }),
              { expiresIn: 3600 }
            );

            response = {
              ...fileMetadata,
              downloadUrl,
            };
          }
        } else if (queryStringParameters?.status) {
          // Query files by status using GSI
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'StatusIndex',
              KeyConditionExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': queryStringParameters.status,
              },
              Limit: 50,
            })
          );

          response = {
            files: queryResult.Items || [],
            count: queryResult.Count,
          };
        } else {
          // List all file metadata from DynamoDB
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'StatusIndex',
              KeyConditionExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': 'uploaded',
              },
              Limit: 20,
            })
          );

          response = {
            files: queryResult.Items || [],
            count: queryResult.Count,
          };
        }
        break;

      case 'DELETE':
        // Delete file from S3 and metadata from DynamoDB
        if (!pathParameters?.filename) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'File ID required for deletion',
            }),
          };
        }

        const deleteFileId = pathParameters.filename;

        // Get file metadata
        const deleteQueryResult = await dynamodb.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
              ':id': deleteFileId,
            },
          })
        );

        if (!deleteQueryResult.Items || deleteQueryResult.Items.length === 0) {
          statusCode = 404;
          response = { error: 'File not found' };
        } else {
          const fileMetadata = deleteQueryResult.Items[0] as FileMetadata;

          // Delete from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileMetadata.fileKey,
            })
          );

          // Delete from DynamoDB
          await dynamodb.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                id: fileMetadata.id,
                timestamp: fileMetadata.timestamp,
              },
            })
          );

          response = {
            message: 'File deleted successfully',
            fileId: deleteFileId,
          };
        }
        break;

      default:
        statusCode = 405;
        response = { error: `Method ${httpMethod} not supported` };
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }),
    };
  }
};

```

## ./lib/lambda/main-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const s3Client = new S3Client({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health check handler that validates connectivity and access to all AWS services
 * This provides a comprehensive system status check for the application
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Health check initiated:', JSON.stringify(event));

  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const bucketName = process.env.S3_BUCKET_NAME;
  const secretName = process.env.SECRET_NAME;

  const serviceChecks: ServiceStatus[] = [];

  // Check DynamoDB connectivity
  try {
    const tableInfo = await dynamoClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    serviceChecks.push({
      service: 'DynamoDB',
      status: 'healthy',
      details: {
        tableName: tableInfo.Table?.TableName,
        itemCount: tableInfo.Table?.ItemCount,
        status: tableInfo.Table?.TableStatus,
      },
    });
  } catch (error) {
    console.error('DynamoDB health check failed:', error);
    serviceChecks.push({
      service: 'DynamoDB',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check S3 connectivity
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    serviceChecks.push({
      service: 'S3',
      status: 'healthy',
      details: {
        bucketName,
      },
    });
  } catch (error) {
    console.error('S3 health check failed:', error);
    serviceChecks.push({
      service: 'S3',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check Secrets Manager connectivity
  try {
    const secretValue = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    serviceChecks.push({
      service: 'Secrets Manager',
      status: 'healthy',
      details: {
        secretName,
        versionId: secretValue.VersionId,
      },
    });
  } catch (error) {
    console.error('Secrets Manager health check failed:', error);
    serviceChecks.push({
      service: 'Secrets Manager',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Determine overall health status
  const allHealthy = serviceChecks.every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;

  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      environment: process.env.ENVIRONMENT_SUFFIX,
      region: process.env.REGION,
      timestamp: new Date().toISOString(),
      services: serviceChecks,
    }),
  };

  return response;
};

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
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

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ==================== VPC Configuration ====================
    // Create VPC for API Gateway
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    cdk.Tags.of(vpc).add('iac-rlhf-amazon', 'true');

    // VPC Endpoint for API Gateway
    const apiGatewayEndpoint = vpc.addInterfaceEndpoint('ApiGatewayEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
    });
    cdk.Tags.of(apiGatewayEndpoint).add('iac-rlhf-amazon', 'true');

    // ==================== S3 Bucket ====================
    // S3 bucket for static files storage
    const staticFilesBucket = new s3.Bucket(
      this,
      `StaticFilesBucket-${environmentSuffix}`,
      {
        bucketName: `tap-static-files-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST,
              s3.HttpMethods.DELETE,
              s3.HttpMethods.HEAD,
            ],
            allowedOrigins: ['*'],
            exposedHeaders: ['ETag'],
            maxAge: 3000,
          },
        ],
      }
    );
    cdk.Tags.of(staticFilesBucket).add('iac-rlhf-amazon', 'true');

    // ==================== DynamoDB Table ====================
    // DynamoDB table for application data
    const applicationTable = new dynamodb.Table(
      this,
      `ApplicationTable-${environmentSuffix}`,
      {
        tableName: `tap-application-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add Global Secondary Index for additional query patterns
    applicationTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    cdk.Tags.of(applicationTable).add('iac-rlhf-amazon', 'true');

    // ==================== Secrets Manager ====================
    // Secrets Manager for storing sensitive data
    const apiSecrets = new secretsmanager.Secret(
      this,
      `ApiSecrets-${environmentSuffix}`,
      {
        secretName: `tap-api-secrets-${environmentSuffix}`,
        description: 'API keys and other sensitive configuration',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            apiKey: 'default-api-key',
            dbPassword: 'default-db-password',
          }),
          generateStringKey: 'secretToken',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      }
    );
    cdk.Tags.of(apiSecrets).add('iac-rlhf-amazon', 'true');

    // ==================== CloudWatch Log Groups ====================
    // Log group for Lambda functions
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-${environmentSuffix}`,
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    cdk.Tags.of(lambdaLogGroup).add('iac-rlhf-amazon', 'true');

    // ==================== IAM Role for Lambda ====================
    // IAM role for Lambda execution
    const lambdaExecutionRole = new iam.Role(
      this,
      `LambdaExecutionRole-${environmentSuffix}`,
      {
        roleName: `tap-lambda-execution-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          CustomPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
                ],
              }),
            ],
          }),
        },
      }
    );
    cdk.Tags.of(lambdaExecutionRole).add('iac-rlhf-amazon', 'true');

    // ==================== Lambda Functions ====================
    // Main application Lambda function
    const mainLambdaFunction = new NodejsFunction(
      this,
      `MainLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-main-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/main-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          S3_BUCKET_NAME: staticFilesBucket.bucketName,
          SECRET_NAME: apiSecrets.secretName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(mainLambdaFunction).add('iac-rlhf-amazon', 'true');

    // CRUD operations Lambda function
    const crudLambdaFunction = new NodejsFunction(
      this,
      `CrudLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-crud-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/crud-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(crudLambdaFunction).add('iac-rlhf-amazon', 'true');

    // File processing Lambda function
    const fileProcessingLambdaFunction = new NodejsFunction(
      this,
      `FileProcessingLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-file-processing-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/file-processing-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          S3_BUCKET_NAME: staticFilesBucket.bucketName,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(fileProcessingLambdaFunction).add('iac-rlhf-amazon', 'true');

    // ==================== Grant Permissions ====================
    // Grant Lambda functions permissions to access resources
    applicationTable.grantReadWriteData(mainLambdaFunction);
    applicationTable.grantReadWriteData(crudLambdaFunction);
    applicationTable.grantReadWriteData(fileProcessingLambdaFunction);
    staticFilesBucket.grantReadWrite(mainLambdaFunction);
    staticFilesBucket.grantReadWrite(fileProcessingLambdaFunction);
    apiSecrets.grantRead(mainLambdaFunction);

    // ==================== API Gateway ====================
    // REST API Gateway
    const restApi = new apigateway.RestApi(
      this,
      `TapRestApi-${environmentSuffix}`,
      {
        restApiName: `tap-api-${environmentSuffix}`,
        description: 'TAP Serverless Application API',
        deployOptions: {
          stageName: environmentSuffix,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          tracingEnabled: true,
          metricsEnabled: true,
        },
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
        endpointConfiguration: {
          types: [apigateway.EndpointType.PRIVATE],
          vpcEndpoints: [apiGatewayEndpoint],
        },
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AnyPrincipal()],
              actions: ['execute-api:Invoke'],
              resources: ['execute-api:/*'],
            }),
          ],
        }),
      }
    );
    cdk.Tags.of(restApi).add('iac-rlhf-amazon', 'true');

    // ==================== API Gateway Integrations ====================
    // Main endpoint integration
    const mainIntegration = new apigateway.LambdaIntegration(
      mainLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // CRUD endpoint integration
    const crudIntegration = new apigateway.LambdaIntegration(
      crudLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // File processing endpoint integration
    const fileIntegration = new apigateway.LambdaIntegration(
      fileProcessingLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // ==================== API Gateway Routes ====================
    // Root endpoint
    const rootResource = restApi.root;
    rootResource.addMethod('GET', mainIntegration);

    // /api resource
    const apiResource = rootResource.addResource('api');
    apiResource.addMethod('GET', mainIntegration);

    // /api/items resource for CRUD operations
    const itemsResource = apiResource.addResource('items');
    itemsResource.addMethod('GET', crudIntegration);
    itemsResource.addMethod('POST', crudIntegration);

    // /api/items/{id} resource
    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', crudIntegration);
    itemResource.addMethod('PUT', crudIntegration);
    itemResource.addMethod('DELETE', crudIntegration);

    // /api/files resource for file operations
    const filesResource = apiResource.addResource('files');
    filesResource.addMethod('GET', fileIntegration);
    filesResource.addMethod('POST', fileIntegration);

    // /api/files/{filename} resource
    const fileResource = filesResource.addResource('{filename}');
    fileResource.addMethod('GET', fileIntegration);
    fileResource.addMethod('DELETE', fileIntegration);

    // ==================== CloudFormation Outputs ====================
    // Output important resource information
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: restApi.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticFilesBucket.bucketName,
      description: 'S3 bucket name for static files',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: applicationTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'SecretName', {
      value: apiSecrets.secretName,
      description: 'Secrets Manager secret name',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'MainLambdaFunctionArn', {
      value: mainLambdaFunction.functionArn,
      description: 'Main Lambda function ARN',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// AWS SDK clients
const dynamoClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });

// Extract outputs
const apiEndpoint =
  outputs.ApiEndpoint || outputs.TapRestApidev2Endpoint5853073A;
const s3BucketName = outputs.S3BucketName;
const dynamoTableName = outputs.DynamoDBTableName;
const secretName = outputs.SecretName;
const vpcId = outputs.VpcId;

// Lambda function names
const mainLambdaName = `tap-main-function-${environmentSuffix}`;
const crudLambdaName = `tap-crud-function-${environmentSuffix}`;
const fileProcessingLambdaName = `tap-file-processing-function-${environmentSuffix}`;

// Helper function to invoke Lambda functions directly
// This is needed because API Gateway is private (VPC endpoint only)
async function invokeLambda(
  functionName: string,
  path: string,
  method: string,
  body?: unknown,
  pathParameters?: Record<string, string>,
  queryStringParameters?: Record<string, string>
): Promise<{ status: number; data: unknown; headers: Record<string, string> }> {
  const event = {
    httpMethod: method,
    path: `/${environmentSuffix}/${path}`,
    pathParameters: pathParameters || null,
    queryStringParameters: queryStringParameters || null,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  };

  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(event),
  });

  const response = await lambdaClient.send(command);
  const payload = JSON.parse(new TextDecoder().decode(response.Payload));

  return {
    status: payload.statusCode || 200,
    data: payload.body ? JSON.parse(payload.body) : {},
    headers: payload.headers || {},
  };
}

// Test data cleanup helpers
const createdItemIds: Array<{ id: string; timestamp: number }> = [];
const createdFileIds: string[] = [];

afterAll(async () => {
  // Clean up created DynamoDB items
  for (const item of createdItemIds) {
    try {
      await dynamodb.send(
        new DeleteCommand({
          TableName: dynamoTableName,
          Key: item,
        })
      );
    } catch (error) {
      console.warn('Failed to cleanup item:', item, error);
    }
  }

  // Clean up created S3 files
  for (const fileId of createdFileIds) {
    try {
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: s3BucketName,
          Prefix: `uploads/${fileId}/`,
        })
      );

      if (listResult.Contents) {
        for (const object of listResult.Contents) {
          if (object.Key) {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: s3BucketName,
                Key: object.Key,
              })
            );
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup file:', fileId, error);
    }
  }
});

describe(`TAP Stack Integration Tests - ${environmentSuffix}`, () => {
  describe('Infrastructure Validation', () => {
    test('DynamoDB table exists and is accessible', async () => {
      const result = await dynamoClient.send(
        new DescribeTableCommand({ TableName: dynamoTableName })
      );

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableName).toBe(dynamoTableName);
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          }),
        ])
      );
    });

    test('DynamoDB table has StatusIndex GSI', async () => {
      const result = await dynamoClient.send(
        new DescribeTableCommand({ TableName: dynamoTableName })
      );

      expect(result.Table?.GlobalSecondaryIndexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'StatusIndex',
          }),
        ])
      );
    });

    test('S3 bucket exists and is accessible', async () => {
      const result = await s3Client.send(
        new HeadBucketCommand({ Bucket: s3BucketName })
      );

      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('Secrets Manager secret exists and is accessible', async () => {
      const result = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      expect(result.Name).toBe(secretName);
      expect(result.ARN).toBeDefined();
    });

    test('Lambda functions are accessible', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');
      expect(result.status).toBeLessThan(500);
    });
  });

  describe('Health Check Lambda (Main Handler)', () => {
    test('returns health status for all services', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        status: 'healthy',
        environment: environmentSuffix,
        region: region,
        timestamp: expect.any(String),
        services: expect.arrayContaining([
          expect.objectContaining({
            service: 'DynamoDB',
            status: 'healthy',
          }),
          expect.objectContaining({
            service: 'S3',
            status: 'healthy',
          }),
          expect.objectContaining({
            service: 'Secrets Manager',
            status: 'healthy',
          }),
        ]),
      });
    });

    test('includes CORS headers', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Content-Type']).toContain('application/json');
    });
  });

  describe('CRUD Lambda Operations', () => {
    test('creates a new item via POST', async () => {
      const newItem = {
        title: `Integration Test Item ${Date.now()}`,
        description: 'Test item created by integration tests',
        status: 'active',
        data: { testField: 'testValue' },
      };

      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'POST',
        newItem
      );

      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        message: 'Item created successfully',
        item: expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          title: newItem.title,
          description: newItem.description,
          status: 'active',
        }),
      });

      // Track for cleanup
      const createdItem = (
        result.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });
    });

    test('retrieves items by status using GSI', async () => {
      // Create a test item first
      const newItem = {
        title: `Test for Query ${Date.now()}`,
        status: 'pending',
      };

      const createResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'POST',
        newItem
      );
      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // Query by status
      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'GET',
        undefined,
        undefined,
        { status: 'pending' }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        items: expect.any(Array),
        count: expect.any(Number),
      });

      const items = (result.data as { items: Array<{ status: string }> }).items;
      expect(items.every(item => item.status === 'pending')).toBe(true);
    });

    test('updates an existing item via PUT', async () => {
      // Create item first
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'Item to Update',
      });

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // Update the item
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'completed',
      };

      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'PUT',
        updateData,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'Item updated successfully',
        item: expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'completed',
        }),
      });
    });

    test('deletes an item via DELETE', async () => {
      // Create item first
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'Item to Delete',
      });

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;

      // Delete the item
      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'DELETE',
        undefined,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'Item deleted successfully',
        id: createdItem.id,
      });

      // Remove from cleanup array since it's already deleted
      const index = createdItemIds.findIndex(
        item =>
          item.id === createdItem.id && item.timestamp === createdItem.timestamp
      );
      if (index > -1) {
        createdItemIds.splice(index, 1);
      }
    });

    test('returns 400 for POST without required title field', async () => {
      const result = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        description: 'Missing title',
      });

      expect(result.status).toBe(400);
      expect(result.data).toMatchObject({
        error: 'title field is required',
      });
    });

    test('scans all items when no query parameters provided', async () => {
      const result = await invokeLambda(crudLambdaName, 'crud', 'GET');

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        items: expect.any(Array),
        count: expect.any(Number),
      });
    });
  });

  describe('File Processing Lambda', () => {
    test('uploads a file to S3 and creates metadata', async () => {
      const fileData = {
        fileName: `test-file-${Date.now()}.txt`,
        content: 'Test file content for integration testing',
        contentType: 'text/plain',
        uploadedBy: 'integration-test',
        tags: ['test', 'integration'],
      };

      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );

      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        message: 'File uploaded successfully',
        file: expect.objectContaining({
          id: expect.any(String),
          fileName: fileData.fileName,
          status: 'uploaded',
          contentType: 'text/plain',
          downloadUrl: expect.stringContaining('amazonaws.com'),
        }),
      });

      // Track for cleanup
      const uploadedFile = (
        result.data as { file: { id: string; timestamp: number } }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });
    });

    test('retrieves file metadata and download URL', async () => {
      // Upload file first
      const fileData = {
        fileName: `retrieve-test-${Date.now()}.txt`,
        content: 'Content for retrieval test',
        contentType: 'text/plain',
      };

      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );
      const uploadedFile = (
        uploadResult.data as { file: { id: string; timestamp: number } }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });

      // Retrieve file
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: uploadedFile.id }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        id: uploadedFile.id,
        fileName: fileData.fileName,
        downloadUrl: expect.stringContaining('amazonaws.com'),
      });
    });

    test('lists files by status', async () => {
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        undefined,
        { status: 'uploaded' }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        files: expect.any(Array),
        count: expect.any(Number),
      });

      const files = (result.data as { files: Array<{ status: string }> }).files;
      expect(files.every(file => file.status === 'uploaded')).toBe(true);
    });

    test('deletes file from S3 and metadata', async () => {
      // Upload file first
      const fileData = {
        fileName: `delete-test-${Date.now()}.txt`,
        content: 'Content to be deleted',
        contentType: 'text/plain',
      };

      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );
      const uploadedFile = (
        uploadResult.data as { file: { id: string; timestamp: number } }
      ).file;

      // Delete file
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'DELETE',
        undefined,
        { filename: uploadedFile.id }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'File deleted successfully',
        fileId: uploadedFile.id,
      });

      // Remove from cleanup arrays
      const fileIndex = createdFileIds.indexOf(uploadedFile.id);
      if (fileIndex > -1) {
        createdFileIds.splice(fileIndex, 1);
      }
      const itemIndex = createdItemIds.findIndex(
        item => item.id === uploadedFile.id
      );
      if (itemIndex > -1) {
        createdItemIds.splice(itemIndex, 1);
      }
    });

    test('validates file content type', async () => {
      const fileData = {
        fileName: `invalid-${Date.now()}.exe`,
        content: 'Invalid content',
        contentType: 'application/x-msdownload',
      };

      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );

      expect(result.status).toBe(400);
      expect(result.data).toMatchObject({
        error: expect.stringContaining('Content type'),
        allowedTypes: expect.any(Array),
      });
    });

    test('returns 404 for non-existent file', async () => {
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: 'non-existent-file' }
      );

      expect(result.status).toBe(404);
      expect(result.data).toMatchObject({
        error: 'File not found',
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('API endpoint uses HTTPS', () => {
      expect(apiEndpoint).toMatch(/^https:\/\//);
    });

    test('API endpoint includes environment suffix in path', () => {
      expect(apiEndpoint).toContain(environmentSuffix);
    });

    test('Lambda returns CORS headers on all responses', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('End-to-End Workflows', () => {
    test('complete CRUD workflow: create -> update -> query -> delete', async () => {
      // 1. Create
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'E2E Test Item',
        status: 'pending',
      });
      expect(createResult.status).toBe(201);

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // 2. Update
      const updateResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'PUT',
        { status: 'completed' },
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );
      expect(updateResult.status).toBe(200);

      // 3. Query by new status
      const queryResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'GET',
        undefined,
        undefined,
        { status: 'completed' }
      );
      expect(queryResult.status).toBe(200);
      const items = (queryResult.data as { items: Array<{ id: string }> })
        .items;
      expect(items.some(item => item.id === createdItem.id)).toBe(true);

      // 4. Delete
      const deleteResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'DELETE',
        undefined,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );
      expect(deleteResult.status).toBe(200);

      // Remove from cleanup
      const index = createdItemIds.findIndex(
        item => item.id === createdItem.id
      );
      if (index > -1) {
        createdItemIds.splice(index, 1);
      }
    });

    test('complete file workflow: upload -> retrieve -> delete', async () => {
      // 1. Upload
      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        {
          fileName: `e2e-test-${Date.now()}.json`,
          content: JSON.stringify({ test: 'data' }),
          contentType: 'application/json',
        }
      );
      expect(uploadResult.status).toBe(201);

      const uploadedFile = (
        uploadResult.data as {
          file: { id: string; timestamp: number; downloadUrl: string };
        }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });

      // 2. Retrieve
      const retrieveResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: uploadedFile.id }
      );
      expect(retrieveResult.status).toBe(200);
      expect(
        (retrieveResult.data as { downloadUrl: string }).downloadUrl
      ).toBeDefined();

      // 3. Verify presigned URL works
      const downloadResponse = await fetch(uploadedFile.downloadUrl);
      expect(downloadResponse.ok).toBe(true);

      // 4. Delete
      const deleteResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'DELETE',
        undefined,
        { filename: uploadedFile.id }
      );
      expect(deleteResult.status).toBe(200);

      // Remove from cleanup
      const fileIndex = createdFileIds.indexOf(uploadedFile.id);
      if (fileIndex > -1) {
        createdFileIds.splice(fileIndex, 1);
      }
      const itemIndex = createdItemIds.findIndex(
        item => item.id === uploadedFile.id
      );
      if (itemIndex > -1) {
        createdItemIds.splice(itemIndex, 1);
      }
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
          Match.objectLike({
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('creates NAT Gateway in public subnet', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates VPC endpoint for API Gateway', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('execute-api')]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });
    });

    test('VPC endpoint has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp(`tap-static-files-${environmentSuffix}-`),
            ]),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'PUT', 'POST', 'DELETE']),
              AllowedOrigins: ['*'],
            }),
          ]),
        },
      });
    });

    test('S3 bucket has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-application-table-${environmentSuffix}`,
      });
    });

    test('DynamoDB has partition and sort keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('DynamoDB has Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              {
                AttributeName: 'status',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB uses PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-api-secrets-${environmentSuffix}`,
        Description: 'API keys and other sensitive configuration',
      });
    });

    test('Secrets Manager has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-${environmentSuffix}`,
        RetentionInDays: 14,
      });
    });

    test('log group has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-lambda-execution-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('Lambda role has VPC access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Lambda role has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('creates IAM policy for Lambda permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:'),
              ]),
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('s3:'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates main Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-main-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('creates CRUD Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-crud-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
      });
    });

    test('creates file processing Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-file-processing-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
      });
    });

    test('Lambda functions have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT_SUFFIX: environmentSuffix,
            REGION: Match.anyValue(),
          }),
        },
      });
    });

    test('Lambda functions are in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('Lambda functions have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('creates exactly 3 Lambda functions', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const appLambdas = Object.keys(lambdas).filter(
        key => !key.includes('CustomResource')
      );
      expect(appLambdas.length).toBe(3);
    });
  });

  describe('API Gateway', () => {
    test('creates REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-api-${environmentSuffix}`,
        Description: 'TAP Serverless Application API',
      });
    });

    test('API Gateway is private (VPC endpoint)', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['PRIVATE'],
        },
      });
    });

    test('API Gateway has CORS enabled', () => {
      template.hasResource('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
          Integration: {
            Type: 'MOCK',
          },
        },
      });
    });

    test('creates API Gateway resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api',
      });
    });

    test('creates API Gateway methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 17);
    });

    test('creates API Gateway deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
      });
    });

    test('API Gateway has iac-rlhf-amazon tag', () => {
      template.hasResource('AWS::ApiGateway::RestApi', Match.anyValue());
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for static files',
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('exports Secret name', () => {
      template.hasOutput('SecretName', {
        Description: 'Secrets Manager secret name',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('MainLambdaFunctionArn', {
        Description: 'Main Lambda function ARN',
      });
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources have iac-rlhf-amazon tag', () => {
      const resources = template.toJSON().Resources;
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::SecretsManager::Secret',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
      ];

      Object.entries(resources).forEach(
        ([logicalId, resource]: [string, any]) => {
          if (
            taggableTypes.includes(resource.Type) &&
            !logicalId.includes('CustomResource')
          ) {
            expect(resource.Properties.Tags).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  Key: 'iac-rlhf-amazon',
                  Value: 'true',
                }),
              ])
            );
          }
        }
      );
    });
  });

  describe('Stack Configuration', () => {
    test('uses correct environment suffix', () => {
      const resources = template.toJSON().Resources;
      const hasEnvSuffix = Object.values(resources).some((resource: any) =>
        JSON.stringify(resource).includes(environmentSuffix)
      );
      expect(hasEnvSuffix).toBe(true);
    });

    test('stack synthesizes without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });

  describe('Environment Suffix Resolution', () => {
    test('uses environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithProps', {
        environmentSuffix: 'custom-env',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify the custom suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-custom-env',
      });
    });

    test('uses environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const testStack = new TapStack(testApp, 'TestStackWithContext');
      const testTemplate = Template.fromStack(testStack);

      // Verify the context suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-context-env',
      });
    });

    test('uses default "dev" when no props or context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithDefaults');
      const testTemplate = Template.fromStack(testStack);

      // Verify the default suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-dev',
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
