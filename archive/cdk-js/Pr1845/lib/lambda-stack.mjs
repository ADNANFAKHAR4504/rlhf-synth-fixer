import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';

export class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix = 'dev' } = props;

    // Create KMS key for environment variable encryption
    this.lambdaKmsKey = new kms.Key(this, 'LambdaKMSKey', {
      alias: `prod-lambda-encryption-${environmentSuffix}`,
      description: 'KMS key for Lambda function environment variable encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create S3 bucket for failed event destinations
    this.deadLetterBucket = new s3.Bucket(this, 'DeadLetterBucket', {
      bucketName: `prod-lambda-failed-events-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM role for Lambda functions with least privilege
    this.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `prod-lambda-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        LambdaMinimalPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
              ],
              resources: [this.lambdaKmsKey.keyArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
              ],
              resources: [this.deadLetterBucket.arnForObjects('*')],
            }),
          ],
        }),
      },
    });

    // User Management Lambda Function
    this.userManagementFunction = new lambda.Function(this, 'UserManagementFunction', {
      functionName: `prod-user-management-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log('User Management Function called', JSON.stringify(event, null, 2));
          
          const method = event.httpMethod || event.requestContext?.http?.method;
          const path = event.path || event.requestContext?.http?.path;
          
          try {
            switch (method) {
              case 'GET':
                if (path.includes('/users')) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                      message: 'User list retrieved successfully',
                      users: [
                        { id: 1, name: 'John Doe', email: 'john@example.com' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                      ],
                      timestamp: new Date().toISOString(),
                    }),
                  };
                }
                break;
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({
                    message: 'User created successfully',
                    user: { id: Date.now(), ...body },
                    timestamp: new Date().toISOString(),
                  }),
                };
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({ message: 'Method not allowed' }),
                };
            }
          } catch (error) {
            console.error('Error in user management function:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message,
                timestamp: new Date().toISOString(),
              }),
            };
          }
        };
      `),
      role: this.lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ENVIRONMENT: environmentSuffix,
        REGION: this.region,
        DEAD_LETTER_BUCKET: this.deadLetterBucket.bucketName,
      },
      environmentEncryption: this.lambdaKmsKey,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      deadLetterQueueEnabled: true,
      description: 'Handles user management operations',
    });

    // Add tags for Resource Group discovery
    cdk.Tags.of(this.userManagementFunction).add('Environment', environmentSuffix);
    cdk.Tags.of(this.userManagementFunction).add('Application', 'ServerlessApp');

    // Product Catalog Lambda Function
    this.productCatalogFunction = new lambda.Function(this, 'ProductCatalogFunction', {
      functionName: `prod-product-catalog-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log('Product Catalog Function called', JSON.stringify(event, null, 2));
          
          const method = event.httpMethod || event.requestContext?.http?.method;
          const path = event.path || event.requestContext?.http?.path;
          
          try {
            switch (method) {
              case 'GET':
                if (path.includes('/products')) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                      message: 'Product catalog retrieved successfully',
                      products: [
                        { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
                        { id: 2, name: 'Book', price: 19.99, category: 'Education' }
                      ],
                      timestamp: new Date().toISOString(),
                    }),
                  };
                }
                break;
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({
                    message: 'Product created successfully',
                    product: { id: Date.now(), ...body },
                    timestamp: new Date().toISOString(),
                  }),
                };
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({ message: 'Method not allowed' }),
                };
            }
          } catch (error) {
            console.error('Error in product catalog function:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message,
                timestamp: new Date().toISOString(),
              }),
            };
          }
        };
      `),
      role: this.lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ENVIRONMENT: environmentSuffix,
        REGION: this.region,
        DEAD_LETTER_BUCKET: this.deadLetterBucket.bucketName,
      },
      environmentEncryption: this.lambdaKmsKey,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      deadLetterQueueEnabled: true,
      description: 'Handles product catalog operations',
    });

    // Add tags for Resource Group discovery
    cdk.Tags.of(this.productCatalogFunction).add('Environment', environmentSuffix);
    cdk.Tags.of(this.productCatalogFunction).add('Application', 'ServerlessApp');

    // Order Processing Lambda Function
    this.orderProcessingFunction = new lambda.Function(this, 'OrderProcessingFunction', {
      functionName: `prod-order-processing-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log('Order Processing Function called', JSON.stringify(event, null, 2));
          
          const method = event.httpMethod || event.requestContext?.http?.method;
          const path = event.path || event.requestContext?.http?.path;
          
          try {
            switch (method) {
              case 'GET':
                if (path.includes('/orders')) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                      message: 'Orders retrieved successfully',
                      orders: [
                        { id: 1, userId: 1, productId: 1, quantity: 2, status: 'processing' },
                        { id: 2, userId: 2, productId: 2, quantity: 1, status: 'completed' }
                      ],
                      timestamp: new Date().toISOString(),
                    }),
                  };
                }
                break;
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({
                    message: 'Order created successfully',
                    order: { id: Date.now(), status: 'processing', ...body },
                    timestamp: new Date().toISOString(),
                  }),
                };
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({ message: 'Method not allowed' }),
                };
            }
          } catch (error) {
            console.error('Error in order processing function:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message,
                timestamp: new Date().toISOString(),
              }),
            };
          }
        };
      `),
      role: this.lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ENVIRONMENT: environmentSuffix,
        REGION: this.region,
        DEAD_LETTER_BUCKET: this.deadLetterBucket.bucketName,
      },
      environmentEncryption: this.lambdaKmsKey,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      deadLetterQueueEnabled: true,
      description: 'Handles order processing operations',
    });

    // Add tags for Resource Group discovery
    cdk.Tags.of(this.orderProcessingFunction).add('Environment', environmentSuffix);
    cdk.Tags.of(this.orderProcessingFunction).add('Application', 'ServerlessApp');

    // Create aliases for blue-green deployments
    this.userManagementAlias = new lambda.Alias(this, 'UserManagementAlias', {
      aliasName: 'LIVE',
      version: this.userManagementFunction.currentVersion,
    });

    this.productCatalogAlias = new lambda.Alias(this, 'ProductCatalogAlias', {
      aliasName: 'LIVE',
      version: this.productCatalogFunction.currentVersion,
    });

    this.orderProcessingAlias = new lambda.Alias(this, 'OrderProcessingAlias', {
      aliasName: 'LIVE',
      version: this.orderProcessingFunction.currentVersion,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserManagementFunctionArn', {
      value: this.userManagementFunction.functionArn,
      description: 'User Management Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'ProductCatalogFunctionArn', {
      value: this.productCatalogFunction.functionArn,
      description: 'Product Catalog Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'OrderProcessingFunctionArn', {
      value: this.orderProcessingFunction.functionArn,
      description: 'Order Processing Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'DeadLetterBucketName', {
      value: this.deadLetterBucket.bucketName,
      description: 'S3 bucket for failed Lambda events',
    });

    new cdk.CfnOutput(this, 'LambdaKMSKeyId', {
      value: this.lambdaKmsKey.keyId,
      description: 'KMS key for Lambda environment variable encryption',
    });
  }
}