"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputeStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const events = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3n = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
const constructs_1 = require("constructs");
class ComputeStack extends constructs_1.Construct {
    authorizerFunction;
    documentProcessorFunction;
    apiHandlerFunction;
    constructor(scope, id, props) {
        super(scope, id);
        // Lambda Execution Roles with Least Privilege
        const authorizerRole = new iam.Role(this, 'ProdAuthorizerRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
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
        const documentProcessorRole = new iam.Role(this, 'ProdDocumentProcessorRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
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
        });
        const apiHandlerRole = new iam.Role(this, 'ProdApiHandlerRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
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
        this.authorizerFunction = new lambda.Function(this, 'ProdAuthorizerFunction', {
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
        });
        this.documentProcessorFunction = new lambda.Function(this, 'ProdDocumentProcessorFunction', {
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
        });
        this.apiHandlerFunction = new lambda.Function(this, 'ProdApiHandlerFunction', {
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
        });
        // S3 Event Trigger for Document Processing
        props.documentBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(this.documentProcessorFunction), { prefix: 'documents/' });
        // DynamoDB Stream Event Source for Real-time Processing
        this.documentProcessorFunction.addEventSource(new events.DynamoEventSource(props.documentsTable, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 10,
        }));
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
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUV6RCx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCw2RUFBK0Q7QUFDL0QsdURBQXlDO0FBQ3pDLHNFQUF3RDtBQUN4RCwyQ0FBdUM7QUFXdkMsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFDekIsa0JBQWtCLENBQWtCO0lBQ3BDLHlCQUF5QixDQUFrQjtJQUMzQyxrQkFBa0IsQ0FBa0I7SUFFcEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLDhDQUE4QztRQUM5QyxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzlELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxlQUFlLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDeEMsOENBQThDLENBQy9DO2FBQ0Y7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsY0FBYyxFQUFFLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQztvQkFDckMsVUFBVSxFQUFFO3dCQUNWLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQzs0QkFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSzs0QkFDeEIsT0FBTyxFQUFFLENBQUMsa0JBQWtCLENBQUM7NEJBQzdCLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDO3lCQUN6QyxDQUFDO3FCQUNIO2lCQUNGLENBQUM7YUFDSDtT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QyxnQkFBZ0IsQ0FBQyxNQUFNO1lBQ2hELFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUNILENBQUM7UUFFRixtQ0FBbUM7UUFDbkMsSUFBSSxDQUFDLGtCQUFrQjthQUNwQixZQUFZLENBQUM7WUFDWixNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ2hDLENBQUM7YUFDRCxXQUFXLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQzdDLFNBQVMsRUFBRSxDQUFDO1lBQ1osaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixnQkFBZ0IsRUFBRSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsYUFBYTtTQUM1RCxDQUFDLENBQUM7UUFFTCxJQUFJLENBQUMseUJBQXlCO2FBQzNCLFlBQVksQ0FBQztZQUNaLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDaEMsQ0FBQzthQUNELFdBQVcsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDNUMsU0FBUyxFQUFFLENBQUM7WUFDWixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhO1NBQzVELENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDRjtBQW5iRCxvQ0FtYkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNuIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1ub3RpZmljYXRpb25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbXB1dGVTdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgdnBjOiBlYzIuVnBjO1xuICBsYW1iZGFTZWN1cml0eUdyb3VwOiBlYzIuU2VjdXJpdHlHcm91cDtcbiAgZG9jdW1lbnRCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgZG9jdW1lbnRzVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBhcGlLZXlzVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgQ29tcHV0ZVN0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhvcml6ZXJGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9jdW1lbnRQcm9jZXNzb3JGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpSGFuZGxlckZ1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvbXB1dGVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIExhbWJkYSBFeGVjdXRpb24gUm9sZXMgd2l0aCBMZWFzdCBQcml2aWxlZ2VcbiAgICBjb25zdCBhdXRob3JpemVyUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnUHJvZEF1dGhvcml6ZXJSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUm9sZSdcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICBEeW5hbW9EYkFjY2VzczogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFsnZHluYW1vZGI6R2V0SXRlbSddLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtwcm9wcy5hcGlLZXlzVGFibGUudGFibGVBcm5dLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZG9jdW1lbnRQcm9jZXNzb3JSb2xlID0gbmV3IGlhbS5Sb2xlKFxuICAgICAgdGhpcyxcbiAgICAgICdQcm9kRG9jdW1lbnRQcm9jZXNzb3JSb2xlJyxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgICdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhVlBDQWNjZXNzRXhlY3V0aW9uUm9sZSdcbiAgICAgICAgICApLFxuICAgICAgICBdLFxuICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgIFMzQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Ake3Byb3BzLmRvY3VtZW50QnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgRHluYW1vRGJBY2Nlc3M6IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnZHluYW1vZGI6UHV0SXRlbScsICdkeW5hbW9kYjpVcGRhdGVJdGVtJ10sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcHJvcHMuZG9jdW1lbnRzVGFibGUudGFibGVBcm5dLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGFwaUhhbmRsZXJSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdQcm9kQXBpSGFuZGxlclJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Sb2xlJ1xuICAgICAgICApLFxuICAgICAgXSxcbiAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgIFMzQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpQdXRPYmplY3QnLCAnczM6R2V0T2JqZWN0J10sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW2Ake3Byb3BzLmRvY3VtZW50QnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIER5bmFtb0RiQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydkeW5hbW9kYjpHZXRJdGVtJywgJ2R5bmFtb2RiOlF1ZXJ5JywgJ2R5bmFtb2RiOlNjYW4nXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcHJvcHMuZG9jdW1lbnRzVGFibGUudGFibGVBcm5dLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9ucyB3aXRoIFZQQyBDb25maWd1cmF0aW9uXG4gICAgdGhpcy5hdXRob3JpemVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdQcm9kQXV0aG9yaXplckZ1bmN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgcm9sZTogYXV0aG9yaXplclJvbGUsXG4gICAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgICB2cGNTdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQgfSxcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtwcm9wcy5sYW1iZGFTZWN1cml0eUdyb3VwXSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBBUElfS0VZU19UQUJMRTogcHJvcHMuYXBpS2V5c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkNsaWVudCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJyk7XG4gICAgICAgIGNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgR2V0Q29tbWFuZCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvbGliLWR5bmFtb2RiJyk7XG5cbiAgICAgICAgY29uc3QgY2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbiAgICAgICAgY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG5cbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0F1dGhvcml6ZXIgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBhcGlLZXkgPSBldmVudC5oZWFkZXJzPy5bJ3gtYXBpLWtleSddIHx8IGV2ZW50LmhlYWRlcnM/LlsnWC1BcGktS2V5J107XG4gICAgICAgICAgY29uc3QgaHR0cE1ldGhvZCA9IGV2ZW50Lmh0dHBNZXRob2QgfHwgZXZlbnQucmVxdWVzdENvbnRleHQ/Lmh0dHBNZXRob2Q7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBBUEkga2V5IHByb3ZpZGVkJyk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuQVBJX0tFWVNfVEFCTEUsXG4gICAgICAgICAgICAgIEtleTogeyBhcGlLZXkgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5JdGVtIHx8IHJlc3VsdC5JdGVtLnN0YXR1cyAhPT0gJ2FjdGl2ZScpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FQSSBrZXkgbm90IGZvdW5kIG9yIGluYWN0aXZlOicsIGFwaUtleSk7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hdXRob3JpemVkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gcmVzdWx0Lkl0ZW0ucGVybWlzc2lvbnMgfHwgJ3JlYWQnO1xuICAgICAgICAgICAgY29uc3QgdXNlcklkID0gcmVzdWx0Lkl0ZW0udXNlcklkIHx8ICdhbm9ueW1vdXMnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgdXNlcjonLCB1c2VySWQsICd3aXRoIHBlcm1pc3Npb25zOicsIHBlcm1pc3Npb25zLCAnZm9yIG1ldGhvZDonLCBodHRwTWV0aG9kKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2hlY2sgcGVybWlzc2lvbnMgYmFzZWQgb24gSFRUUCBtZXRob2RcbiAgICAgICAgICAgIGxldCBhbGxvdyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaHR0cE1ldGhvZCA9PT0gJ1BPU1QnIHx8IGh0dHBNZXRob2QgPT09ICdQVVQnIHx8IGh0dHBNZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgIC8vIFdyaXRlIG9wZXJhdGlvbnMgcmVxdWlyZSByZWFkLXdyaXRlIG9yIGFkbWluIHBlcm1pc3Npb25zXG4gICAgICAgICAgICAgIGFsbG93ID0gcGVybWlzc2lvbnMgPT09ICdyZWFkLXdyaXRlJyB8fCBwZXJtaXNzaW9ucyA9PT0gJ2FkbWluJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaHR0cE1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICAgICAgLy8gUmVhZCBvcGVyYXRpb25zIGFsbG93ZWQgZm9yIGFsbCBwZXJtaXNzaW9uIGxldmVsc1xuICAgICAgICAgICAgICBhbGxvdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghYWxsb3cpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luc3VmZmljaWVudCBwZXJtaXNzaW9uczonLCBwZXJtaXNzaW9ucywgJ2ZvciBtZXRob2Q6JywgaHR0cE1ldGhvZCk7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRm9yYmlkZGVuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBvbGljeSA9IHtcbiAgICAgICAgICAgICAgcHJpbmNpcGFsSWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAgcG9saWN5RG9jdW1lbnQ6IHtcbiAgICAgICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ2V4ZWN1dGUtYXBpOkludm9rZScsXG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGV2ZW50Lm1ldGhvZEFyblxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zOiBwZXJtaXNzaW9uc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQXV0aG9yaXphdGlvbiBzdWNjZXNzZnVsIGZvciB1c2VyOicsIHVzZXJJZCwgJ3dpdGggcGVybWlzc2lvbnM6JywgcGVybWlzc2lvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHBvbGljeTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQXV0aG9yaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLmRvY3VtZW50UHJvY2Vzc29yRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdQcm9kRG9jdW1lbnRQcm9jZXNzb3JGdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIHJvbGU6IGRvY3VtZW50UHJvY2Vzc29yUm9sZSxcbiAgICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCB9LFxuICAgICAgICBzZWN1cml0eUdyb3VwczogW3Byb3BzLmxhbWJkYVNlY3VyaXR5R3JvdXBdLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIERPQ1VNRU5UU19UQUJMRTogcHJvcHMuZG9jdW1lbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgY29uc3QgeyBTM0NsaWVudCwgSGVhZE9iamVjdENvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2NsaWVudC1zMycpO1xuICAgICAgICBjb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBQdXRDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9saWItZHluYW1vZGInKTtcblxuICAgICAgICBjb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7fSk7XG4gICAgICAgIGNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG4gICAgICAgIGNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xuXG4gICAgICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdEb2N1bWVudCBwcm9jZXNzb3IgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICAgICAgICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIGV2ZW50LlJlY29yZHMpIHtcbiAgICAgICAgICAgIGlmIChyZWNvcmQuZXZlbnROYW1lICYmIHJlY29yZC5ldmVudE5hbWUuc3RhcnRzV2l0aCgnT2JqZWN0Q3JlYXRlZCcpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGJ1Y2tldCA9IHJlY29yZC5zMy5idWNrZXQubmFtZTtcbiAgICAgICAgICAgICAgY29uc3Qga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlY29yZC5zMy5vYmplY3Qua2V5LnJlcGxhY2UoL1xcXFwrL2csICcgJykpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgb2JqZWN0IG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0SW5mbyA9IGF3YWl0IHMzQ2xpZW50LnNlbmQobmV3IEhlYWRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0LFxuICAgICAgICAgICAgICAgICAgS2V5OiBrZXlcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGRvY3VtZW50IG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRJZCA9IGtleS5zcGxpdCgnLycpLnBvcCgpLnNwbGl0KCcuJylbMF07XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICBkb2N1bWVudElkLFxuICAgICAgICAgICAgICAgICAgZmlsZU5hbWU6IGtleS5zcGxpdCgnLycpLnBvcCgpLFxuICAgICAgICAgICAgICAgICAgYnVja2V0LFxuICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgc2l6ZTogb2JqZWN0SW5mby5Db250ZW50TGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IG9iamVjdEluZm8uQ29udGVudFR5cGUsXG4gICAgICAgICAgICAgICAgICB1cGxvYWRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdwcm9jZXNzZWQnLFxuICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSBtZXRhZGF0YSBpbiBEeW5hbW9EQlxuICAgICAgICAgICAgICAgIGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBQdXRDb21tYW5kKHtcbiAgICAgICAgICAgICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuRE9DVU1FTlRTX1RBQkxFLFxuICAgICAgICAgICAgICAgICAgSXRlbTogbWV0YWRhdGFcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnU3VjY2Vzc2Z1bGx5IHByb2Nlc3NlZCBkb2N1bWVudDonLCBkb2N1bWVudElkKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGRvY3VtZW50OicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBTdG9yZSBlcnJvciBpbmZvcm1hdGlvblxuICAgICAgICAgICAgICAgIGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBQdXRDb21tYW5kKHtcbiAgICAgICAgICAgICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuRE9DVU1FTlRTX1RBQkxFLFxuICAgICAgICAgICAgICAgICAgSXRlbToge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudElkOiBrZXkuc3BsaXQoJy8nKS5wb3AoKS5zcGxpdCgnLicpWzBdLFxuICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZToga2V5LnNwbGl0KCcvJykucG9wKCksXG4gICAgICAgICAgICAgICAgICAgIGJ1Y2tldCxcbiAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgYCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuYXBpSGFuZGxlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICAnUHJvZEFwaUhhbmRsZXJGdW5jdGlvbicsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIHJvbGU6IGFwaUhhbmRsZXJSb2xlLFxuICAgICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVEIH0sXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbcHJvcHMubGFtYmRhU2VjdXJpdHlHcm91cF0sXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgRE9DVU1FTlRTX0JVQ0tFVDogcHJvcHMuZG9jdW1lbnRCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICBET0NVTUVOVFNfVEFCTEU6IHByb3BzLmRvY3VtZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMiksXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuICAgICAgICBjb25zdCB7IFMzQ2xpZW50LCBQdXRPYmplY3RDb21tYW5kIH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtczMnKTtcbiAgICAgICAgY29uc3QgeyBEeW5hbW9EQkNsaWVudCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJyk7XG4gICAgICAgIGNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgR2V0Q29tbWFuZCwgU2NhbkNvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYicpO1xuICAgICAgICBjb25zdCB7IHJhbmRvbVVVSUQgfSA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuXG4gICAgICAgIGNvbnN0IHMzQ2xpZW50ID0gbmV3IFMzQ2xpZW50KHt9KTtcbiAgICAgICAgY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbiAgICAgICAgY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0NsaWVudCk7XG5cbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0FQSSBoYW5kbGVyIGV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG5cbiAgICAgICAgICBjb25zdCB7IGh0dHBNZXRob2QsIHBhdGgsIGJvZHksIHJlcXVlc3RDb250ZXh0IH0gPSBldmVudDtcbiAgICAgICAgICBjb25zdCB1c2VySWQgPSByZXF1ZXN0Q29udGV4dC5hdXRob3JpemVyPy51c2VySWQgfHwgJ2Fub255bW91cyc7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGh0dHBNZXRob2QgPT09ICdQT1NUJyAmJiBwYXRoID09PSAnL2RvY3VtZW50cycpIHtcbiAgICAgICAgICAgICAgLy8gRG9jdW1lbnQgdXBsb2FkXG4gICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RCb2R5ID0gSlNPTi5wYXJzZShib2R5IHx8ICd7fScpO1xuICAgICAgICAgICAgICBjb25zdCB7IGZpbGVOYW1lLCBjb250ZW50LCBjb250ZW50VHlwZSB9ID0gcmVxdWVzdEJvZHk7XG5cbiAgICAgICAgICAgICAgaWYgKCFmaWxlTmFtZSB8fCAhY29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdmaWxlTmFtZSBhbmQgY29udGVudCBhcmUgcmVxdWlyZWQnIH0pXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50SWQgPSByYW5kb21VVUlEKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGtleSA9IFxcYGRvY3VtZW50cy9cXCRcXHt1c2VySWRcXH0vXFwkXFx7ZG9jdW1lbnRJZFxcfS1cXCRcXHtmaWxlTmFtZVxcfVxcYDtcblxuICAgICAgICAgICAgICAvLyBVcGxvYWQgdG8gUzNcbiAgICAgICAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgQnVja2V0OiBwcm9jZXNzLmVudi5ET0NVTUVOVFNfQlVDS0VULFxuICAgICAgICAgICAgICAgIEtleToga2V5LFxuICAgICAgICAgICAgICAgIEJvZHk6IEJ1ZmZlci5mcm9tKGNvbnRlbnQsICdiYXNlNjQnKSxcbiAgICAgICAgICAgICAgICBDb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICAgICAgICAgICAgICAgTWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICAgICAgICAgIGRvY3VtZW50SWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBkb2N1bWVudElkLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0RvY3VtZW50IHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgICAgICAgICAgICBrZXlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaHR0cE1ldGhvZCA9PT0gJ0dFVCcgJiYgcGF0aC5zdGFydHNXaXRoKCcvZG9jdW1lbnRzLycpKSB7XG4gICAgICAgICAgICAgIC8vIERvY3VtZW50IHJldHJpZXZhbFxuICAgICAgICAgICAgICBjb25zdCBkb2N1bWVudElkID0gcGF0aC5zcGxpdCgnLycpWzJdO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19UQUJMRSxcbiAgICAgICAgICAgICAgICBLZXk6IHsgZG9jdW1lbnRJZCB9XG4gICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5JdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0RvY3VtZW50IG5vdCBmb3VuZCcgfSlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW0pXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChodHRwTWV0aG9kID09PSAnR0VUJyAmJiBwYXRoID09PSAnL2RvY3VtZW50cycpIHtcbiAgICAgICAgICAgICAgLy8gTGlzdCBkb2N1bWVudHNcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IFNjYW5Db21tYW5kKHtcbiAgICAgICAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19UQUJMRSxcbiAgICAgICAgICAgICAgICBMaW1pdDogNTBcbiAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGRvY3VtZW50czogcmVzdWx0Lkl0ZW1zLFxuICAgICAgICAgICAgICAgICAgY291bnQ6IHJlc3VsdC5Db3VudFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdOb3QgZm91bmQnIH0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FQSSBoYW5kbGVyIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBTMyBFdmVudCBUcmlnZ2VyIGZvciBEb2N1bWVudCBQcm9jZXNzaW5nXG4gICAgcHJvcHMuZG9jdW1lbnRCdWNrZXQuYWRkRXZlbnROb3RpZmljYXRpb24oXG4gICAgICBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsXG4gICAgICBuZXcgczNuLkxhbWJkYURlc3RpbmF0aW9uKHRoaXMuZG9jdW1lbnRQcm9jZXNzb3JGdW5jdGlvbiksXG4gICAgICB7IHByZWZpeDogJ2RvY3VtZW50cy8nIH1cbiAgICApO1xuXG4gICAgLy8gRHluYW1vREIgU3RyZWFtIEV2ZW50IFNvdXJjZSBmb3IgUmVhbC10aW1lIFByb2Nlc3NpbmdcbiAgICB0aGlzLmRvY3VtZW50UHJvY2Vzc29yRnVuY3Rpb24uYWRkRXZlbnRTb3VyY2UoXG4gICAgICBuZXcgZXZlbnRzLkR5bmFtb0V2ZW50U291cmNlKHByb3BzLmRvY3VtZW50c1RhYmxlLCB7XG4gICAgICAgIHN0YXJ0aW5nUG9zaXRpb246IGxhbWJkYS5TdGFydGluZ1Bvc2l0aW9uLkxBVEVTVCxcbiAgICAgICAgYmF0Y2hTaXplOiAxMCxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm1zIGZvciBNb25pdG9yaW5nXG4gICAgdGhpcy5hdXRob3JpemVyRnVuY3Rpb25cbiAgICAgIC5tZXRyaWNFcnJvcnMoe1xuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgfSlcbiAgICAgIC5jcmVhdGVBbGFybSh0aGlzLCAnUHJvZEF1dGhvcml6ZXJFcnJvckFsYXJtJywge1xuICAgICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5kb2N1bWVudFByb2Nlc3NvckZ1bmN0aW9uXG4gICAgICAubWV0cmljRXJyb3JzKHtcbiAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIH0pXG4gICAgICAuY3JlYXRlQWxhcm0odGhpcywgJ1Byb2RQcm9jZXNzb3JFcnJvckFsYXJtJywge1xuICAgICAgICB0aHJlc2hvbGQ6IDMsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIH0pO1xuICB9XG59XG4iXX0=