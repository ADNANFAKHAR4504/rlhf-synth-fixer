import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  lambdaSecurityGroup: ec2.SecurityGroup;
  documentBucket: s3.Bucket;
  documentsTable: dynamodb.Table;
  apiKeysTable: dynamodb.Table;
}

export class ComputeStack extends Construct {
  public readonly authorizerFunction: lambda.Function;
  public readonly documentProcessorFunction: lambda.Function;
  public readonly apiHandlerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Lambda Execution Roles with Least Privilege
    const authorizerRole = new iam.Role(this, 'ProdAuthorizerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDbAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:GetItem'],
              resources: [props.apiKeysTable.tableArn],
            }),
          ],
        }),
      },
    });

    const documentProcessorRole = new iam.Role(
      this,
      'ProdDocumentProcessorRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          S3Access: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject'],
                resources: [`${props.documentBucket.bucketArn}/*`],
              }),
            ],
          }),
          DynamoDbAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                resources: [props.documentsTable.tableArn],
              }),
            ],
          }),
        },
      }
    );

    const apiHandlerRole = new iam.Role(this, 'ProdApiHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:GetObject'],
              resources: [`${props.documentBucket.bucketArn}/*`],
            }),
          ],
        }),
        DynamoDbAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
              resources: [props.documentsTable.tableArn],
            }),
          ],
        }),
      },
    });

    // Lambda Functions with VPC Configuration
    this.authorizerFunction = new lambda.Function(
      this,
      'ProdAuthorizerFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: authorizerRole,
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [props.lambdaSecurityGroup],
        environment: {
          API_KEYS_TABLE: props.apiKeysTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        exports.handler = async (event) => {
          console.log('Authorizer event:', JSON.stringify(event, null, 2));
          
          const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'];
          const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
          
          if (!apiKey) {
            console.log('No API key provided');
            throw new Error('Unauthorized');
          }

          try {
            const result = await docClient.send(new GetCommand({
              TableName: process.env.API_KEYS_TABLE,
              Key: { apiKey }
            }));

            if (!result.Item || result.Item.status !== 'active') {
              console.log('API key not found or inactive:', apiKey);
              throw new Error('Unauthorized');
            }

            const permissions = result.Item.permissions || 'read';
            const userId = result.Item.userId || 'anonymous';
            
            console.log('Found user:', userId, 'with permissions:', permissions, 'for method:', httpMethod);
            
            // Check permissions based on HTTP method
            let allow = true;
            if (httpMethod === 'POST' || httpMethod === 'PUT' || httpMethod === 'DELETE') {
              // Write operations require read-write or admin permissions
              allow = permissions === 'read-write' || permissions === 'admin';
            } else if (httpMethod === 'GET') {
              // Read operations allowed for all permission levels
              allow = true;
            }
            
            if (!allow) {
              console.log('Insufficient permissions:', permissions, 'for method:', httpMethod);
              throw new Error('Forbidden');
            }

            const policy = {
              principalId: userId,
              policyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: event.methodArn
                  }
                ]
              },
              context: {
                userId: userId,
                permissions: permissions
              }
            };

            console.log('Authorization successful for user:', userId, 'with permissions:', permissions);
            return policy;
          } catch (error) {
            console.error('Authorization failed:', error.message);
            throw new Error('Unauthorized');
          }
        };
      `),
      }
    );

    this.documentProcessorFunction = new lambda.Function(
      this,
      'ProdDocumentProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: documentProcessorRole,
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [props.lambdaSecurityGroup],
        environment: {
          DOCUMENTS_TABLE: props.documentsTable.tableName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        code: lambda.Code.fromInline(`
        const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

        const s3Client = new S3Client({});
        const dynamoClient = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(dynamoClient);

        exports.handler = async (event) => {
          console.log('Document processor event:', JSON.stringify(event, null, 2));

          for (const record of event.Records) {
            if (record.eventName && record.eventName.startsWith('ObjectCreated')) {
              const bucket = record.s3.bucket.name;
              const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
              
              try {
                // Get object metadata
                const objectInfo = await s3Client.send(new HeadObjectCommand({
                  Bucket: bucket,
                  Key: key
                }));

                // Extract document metadata
                const documentId = key.split('/').pop().split('.')[0];
                const metadata = {
                  documentId,
                  fileName: key.split('/').pop(),
                  bucket,
                  key,
                  size: objectInfo.ContentLength,
                  contentType: objectInfo.ContentType,
                  uploadedAt: new Date().toISOString(),
                  status: 'processed',
                  processedAt: new Date().toISOString()
                };

                // Store metadata in DynamoDB
                await docClient.send(new PutCommand({
                  TableName: process.env.DOCUMENTS_TABLE,
                  Item: metadata
                }));

                console.log('Successfully processed document:', documentId);
              } catch (error) {
                console.error('Error processing document:', error);
                
                // Store error information
                await docClient.send(new PutCommand({
                  TableName: process.env.DOCUMENTS_TABLE,
                  Item: {
                    documentId: key.split('/').pop().split('.')[0],
                    fileName: key.split('/').pop(),
                    bucket,
                    key,
                    status: 'error',
                    error: error.message,
                    processedAt: new Date().toISOString()
                  }
                }));
              }
            }
          }
        };
      `),
      }
    );

    this.apiHandlerFunction = new lambda.Function(
      this,
      'ProdApiHandlerFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: apiHandlerRole,
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [props.lambdaSecurityGroup],
        environment: {
          DOCUMENTS_BUCKET: props.documentBucket.bucketName,
          DOCUMENTS_TABLE: props.documentsTable.tableName,
        },
        timeout: cdk.Duration.minutes(2),
        code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const { randomUUID } = require('crypto');

        const s3Client = new S3Client({});
        const dynamoClient = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(dynamoClient);

        exports.handler = async (event) => {
          console.log('API handler event:', JSON.stringify(event, null, 2));

          const { httpMethod, path, body, requestContext } = event;
          const userId = requestContext.authorizer?.userId || 'anonymous';

          try {
            if (httpMethod === 'POST' && path === '/documents') {
              // Document upload
              const requestBody = JSON.parse(body || '{}');
              const { fileName, content, contentType } = requestBody;

              if (!fileName || !content) {
                return {
                  statusCode: 400,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'fileName and content are required' })
                };
              }

              const documentId = randomUUID();
              const key = \`documents/\$\{userId\}/\$\{documentId\}-\$\{fileName\}\`;

              // Upload to S3
              await s3Client.send(new PutObjectCommand({
                Bucket: process.env.DOCUMENTS_BUCKET,
                Key: key,
                Body: Buffer.from(content, 'base64'),
                ContentType: contentType || 'application/octet-stream',
                Metadata: {
                  userId,
                  documentId
                }
              }));

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  documentId,
                  message: 'Document uploaded successfully',
                  key
                })
              };
            }

            if (httpMethod === 'GET' && path.startsWith('/documents/')) {
              // Document retrieval
              const documentId = path.split('/')[2];

              const result = await docClient.send(new GetCommand({
                TableName: process.env.DOCUMENTS_TABLE,
                Key: { documentId }
              }));

              if (!result.Item) {
                return {
                  statusCode: 404,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'Document not found' })
                };
              }

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.Item)
              };
            }

            if (httpMethod === 'GET' && path === '/documents') {
              // List documents
              const result = await docClient.send(new ScanCommand({
                TableName: process.env.DOCUMENTS_TABLE,
                Limit: 50
              }));

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  documents: result.Items,
                  count: result.Count
                })
              };
            }

            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Not found' })
            };

          } catch (error) {
            console.error('API handler error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      }
    );

    // S3 Event Trigger for Document Processing
    props.documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.documentProcessorFunction),
      { prefix: 'documents/' }
    );

    // DynamoDB Stream Event Source for Real-time Processing
    this.documentProcessorFunction.addEventSource(
      new events.DynamoEventSource(props.documentsTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
      })
    );

    // CloudWatch Alarms for Monitoring
    this.authorizerFunction
      .metricErrors({
        period: cdk.Duration.minutes(5),
      })
      .createAlarm(this, 'ProdAuthorizerErrorAlarm', {
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

    this.documentProcessorFunction
      .metricErrors({
        period: cdk.Duration.minutes(5),
      })
      .createAlarm(this, 'ProdProcessorErrorAlarm', {
        threshold: 3,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
  }
}
