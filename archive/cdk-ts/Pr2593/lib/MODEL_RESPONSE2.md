You're absolutely right! The `throttleSettings` property doesn't exist directly in `StageOptions`. Here's the corrected TypeScript CDK file with the proper throttling configuration:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class ECommerceServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources - governance and cost tracking
    const commonTags = {
      Project: 'ECommerce',
      Environment: 'Production',
      Owner: 'DevOps-Team',
      CostCenter: 'Engineering',
    };

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Owner', commonTags.Owner);
    cdk.Tags.of(this).add('CostCenter', commonTags.CostCenter);

    // ===== S3 BUCKET FOR ARTIFACTS =====
    // Secure S3 bucket for storing deployable artifacts and static assets
    const artifactsBucket = new s3.Bucket(this, 'ECommerceArtifactsBucket', {
      bucketName: `ecommerce-artifacts-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      // Enforce server-side encryption with AES-256
      encryption: s3.BucketEncryption.S3_MANAGED,
      // Block all public access for security
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Enable versioning for artifact history
      versioned: true,
      // Lifecycle policy to manage costs
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      // Enable access logging for audit trails
      serverAccessLogsPrefix: 'access-logs/',
      // Removal policy for production (retain data)
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ===== DEAD LETTER QUEUE =====
    // DLQ for failed Lambda executions - failure management
    const deadLetterQueue = new sqs.Queue(this, 'ECommerceDLQ', {
      queueName: 'ecommerce-dlq',
      // Retain messages for 14 days for investigation
      messageRetentionPeriod: cdk.Duration.days(14),
      // Enable encryption at rest
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // ===== IAM ROLES FOR LAMBDA FUNCTIONS =====
    // Least-privilege IAM role for product management functions
    const productLambdaRole = new iam.Role(this, 'ProductLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for product management Lambda functions',
      managedPolicies: [
        // Basic Lambda execution permissions
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        // Custom policy for specific S3 and DLQ access
        ProductLambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${artifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [deadLetterQueue.queueArn],
            }),
          ],
        }),
      },
    });

    // Least-privilege IAM role for order management functions
    const orderLambdaRole = new iam.Role(this, 'OrderLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for order management Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        OrderLambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${artifactsBucket.bucketArn}/orders/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [deadLetterQueue.queueArn],
            }),
          ],
        }),
      },
    });

    // ===== LAMBDA FUNCTIONS =====
    // Product management Lambda function
    const productLambda = new lambda.Function(this, 'ProductLambda', {
      functionName: 'ecommerce-product-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      // Inline code for demonstration - in production, use lambda.Code.fromAsset()
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Product Lambda triggered:', JSON.stringify(event, null, 2));
          
          const httpMethod = event.httpMethod;
          const pathParameters = event.pathParameters;
          
          try {
            switch (httpMethod) {
              case 'GET':
                if (pathParameters && pathParameters.productId) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      productId: pathParameters.productId,
                      name: 'Sample Product',
                      price: 29.99,
                      description: 'A sample product from our e-commerce platform'
                    })
                  };
                } else {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      products: [
                        { id: '1', name: 'Product 1', price: 19.99 },
                        { id: '2', name: 'Product 2', price: 29.99 }
                      ]
                    })
                  };
                }
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'Product created successfully',
                    productId: Math.random().toString(36).substr(2, 9),
                    ...body
                  })
                };
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ error: 'Method not allowed' })
                };
            }
          } catch (error) {
            console.error('Error in product lambda:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      role: productLambdaRole,
      // Environment variables managed securely
      environment: {
        BUCKET_NAME: artifactsBucket.bucketName,
        DLQ_URL: deadLetterQueue.queueUrl,
        NODE_ENV: 'production',
      },
      // Timeout and memory configuration
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      // Concurrency controls to prevent overwhelming downstream services
      reservedConcurrentExecutions: 100,
      // Dead letter queue for failure management
      deadLetterQueue: deadLetterQueue,
      // Retry configuration
      retryAttempts: 2,
      // Enable tracing for debugging
      tracing: lambda.Tracing.ACTIVE,
    });

    // Order management Lambda function
    const orderLambda = new lambda.Function(this, 'OrderLambda', {
      functionName: 'ecommerce-order-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Order Lambda triggered:', JSON.stringify(event, null, 2));
          
          const httpMethod = event.httpMethod;
          const pathParameters = event.pathParameters;
          
          try {
            switch (httpMethod) {
              case 'GET':
                if (pathParameters && pathParameters.orderId) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      orderId: pathParameters.orderId,
                      customerId: 'customer-123',
                      items: [
                        { productId: '1', quantity: 2, price: 19.99 },
                        { productId: '2', quantity: 1, price: 29.99 }
                      ],
                      total: 69.97,
                      status: 'processing'
                    })
                  };
                } else {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      orders: [
                        { id: 'order-1', customerId: 'customer-123', total: 69.97, status: 'processing' },
                        { id: 'order-2', customerId: 'customer-456', total: 149.99, status: 'shipped' }
                      ]
                    })
                  };
                }
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'Order created successfully',
                    orderId: 'order-' + Math.random().toString(36).substr(2, 9),
                    status: 'created',
                    ...body
                  })
                };
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ error: 'Method not allowed' })
                };
            }
          } catch (error) {
            console.error('Error in order lambda:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      role: orderLambdaRole,
      environment: {
        BUCKET_NAME: artifactsBucket.bucketName,
        DLQ_URL: deadLetterQueue.queueUrl,
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      reservedConcurrentExecutions: 50,
      deadLetterQueue: deadLetterQueue,
      retryAttempts: 2,
      tracing: lambda.Tracing.ACTIVE,
    });

    // User authentication Lambda function
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      functionName: 'ecommerce-auth-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Auth Lambda triggered:', JSON.stringify(event, null, 2));
          
          const httpMethod = event.httpMethod;
          
          try {
            switch (httpMethod) {
              case 'POST':
                const body = JSON.parse(event.body || '{}');
                const { email, password } = body;
                
                // Simple auth simulation - in production, use proper authentication
                if (email && password) {
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      message: 'Authentication successful',
                      token: 'jwt-token-' + Math.random().toString(36).substr(2, 20),
                      userId: 'user-' + Math.random().toString(36).substr(2, 9),
                      email: email
                    })
                  };
                } else {
                  return {
                    statusCode: 400,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Email and password required' })
                  };
                }
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ error: 'Method not allowed' })
                };
            }
          } catch (error) {
            console.error('Error in auth lambda:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      role: productLambdaRole, // Reusing role as it has similar permissions
      environment: {
        BUCKET_NAME: artifactsBucket.bucketName,
        DLQ_URL: deadLetterQueue.queueUrl,
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(15),
      memorySize: 128,
      reservedConcurrentExecutions: 25,
      deadLetterQueue: deadLetterQueue,
      retryAttempts: 2,
      tracing: lambda.Tracing.ACTIVE,
    });

    // ===== CLOUDWATCH LOG GROUPS =====
    // Custom log groups with retention policies for cost management
    const productLogGroup = new logs.LogGroup(this, 'ProductLambdaLogGroup', {
      logGroupName: `/aws/lambda/${productLambda.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const orderLogGroup = new logs.LogGroup(this, 'OrderLambdaLogGroup', {
      logGroupName: `/aws/lambda/${orderLambda.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const authLogGroup = new logs.LogGroup(this, 'AuthLambdaLogGroup', {
      logGroupName: `/aws/lambda/${authLambda.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===== API GATEWAY =====
    // Regional API Gateway with comprehensive configuration
    const api = new apigateway.RestApi(this, 'ECommerceApi', {
      restApiName: 'ecommerce-api',
      description: 'E-Commerce Platform API Gateway',
      // Regional endpoint for better performance and lower latency
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      // Enable CloudWatch logging
      cloudWatchRole: true,
      deployOptions: {
        // Enable detailed CloudWatch metrics
        metricsEnabled: true,
        // Enable CloudWatch logging
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        // Enable data trace logging (be careful with sensitive data)
        dataTraceEnabled: true,
        // Stage name
        stageName: 'prod',
      },
      // Default CORS configuration
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      // API key configuration for additional security
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // ===== USAGE PLAN AND API KEY FOR THROTTLING =====
    // Create API key for authentication and throttling
    const apiKey = new apigateway.ApiKey(this, 'ECommerceApiKey', {
      apiKeyName: 'ecommerce-api-key',
      description: 'API Key for E-Commerce platform',
    });

    // Create usage plan with throttling and quota limits
    const usagePlan = new apigateway.UsagePlan(this, 'ECommerceUsagePlan', {
      name: 'ecommerce-usage-plan',
      description: 'Usage plan for E-Commerce API with throttling',
      throttle: {
        rateLimit: 1000, // requests per second
        burstLimit: 2000, // maximum concurrent requests
      },
      quota: {
        limit: 100000, // total requests per period
        period: apigateway.Period.DAY,
      },
    });

    // Associate the usage plan with the API stage
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Associate the API key with the usage plan
    usagePlan.addApiKey(apiKey);

    // ===== API GATEWAY INTEGRATIONS =====
    // Lambda integrations with error handling
    const productIntegration = new apigateway.LambdaIntegration(productLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true,
    });

    const orderIntegration = new apigateway.LambdaIntegration(orderLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true,
    });

    const authIntegration = new apigateway.LambdaIntegration(authLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true,
    });

    // ===== API GATEWAY RESOURCES AND METHODS =====
    // Products resource and methods
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', productIntegration, {
      apiKeyRequired: true, // Require API key for throttling
    });
    productsResource.addMethod('POST', productIntegration, {
      apiKeyRequired: true,
    });

    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', productIntegration, {
      apiKeyRequired: true,
    });

    // Orders resource and methods
    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('GET', orderIntegration, {
      apiKeyRequired: true,
    });
    ordersResource.addMethod('POST', orderIntegration, {
      apiKeyRequired: true,
    });

    const orderResource = ordersResource.addResource('{orderId}');
    orderResource.addMethod('GET', orderIntegration, {
      apiKeyRequired: true,
    });

    // Authentication resource (no API key required for login)
    const authResource = api.root.addResource('auth');
    authResource.addMethod('POST', authIntegration);

    // ===== CUSTOM DOMAIN (Optional - requires existing certificate) =====
    // Uncomment and configure if you have a domain and certificate
    /*
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      'ApiCertificate',
      'arn:aws:acm:region:account:certificate/certificate-id'
    );

    const domainName = new apigateway.DomainName(this, 'ECommerceDomain', {
      domainName: 'api.yourdomain.com',
      certificate: certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2
    });

    domainName.addBasePathMapping(api, {
      basePath: 'v1'
    });
    */

    // ===== CLOUDWATCH ALARMS =====
    // Error rate alarms for Lambda functions
    const productErrorAlarm = new cloudwatch.Alarm(
      this,
      'ProductLambdaErrorAlarm',
      {
        alarmName: 'ecommerce-product-lambda-errors',
        alarmDescription: 'Alarm for product Lambda function errors',
        metric: productLambda.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const orderErrorAlarm = new cloudwatch.Alarm(
      this,
      'OrderLambdaErrorAlarm',
      {
        alarmName: 'ecommerce-order-lambda-errors',
        alarmDescription: 'Alarm for order Lambda function errors',
        metric: orderLambda.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Throttling alarms
    const productThrottleAlarm = new cloudwatch.Alarm(
      this,
      'ProductLambdaThrottleAlarm',
      {
        alarmName: 'ecommerce-product-lambda-throttles',
        alarmDescription: 'Alarm for product Lambda function throttling',
        metric: productLambda.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // API Gateway 4XX and 5XX error alarms
    const api4xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      alarmName: 'ecommerce-api-4xx-errors',
      alarmDescription: 'Alarm for API Gateway 4XX errors',
      metric: api.metricClientError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const api5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: 'ecommerce-api-5xx-errors',
      alarmDescription: 'Alarm for API Gateway 5XX errors',
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ===== OUTPUTS =====
    // CloudFormation outputs for easy access to created resources
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'ECommerceApiUrl',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication',
      exportName: 'ECommerceApiKeyId',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: artifactsBucket.bucketName,
      description: 'S3 Bucket for artifacts',
      exportName: 'ECommerceS3Bucket',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: 'ECommerceDLQUrl',
    });

    new cdk.CfnOutput(this, 'ProductLambdaArn', {
      value: productLambda.functionArn,
      description: 'Product Lambda Function ARN',
      exportName: 'ProductLambdaArn',
    });

    new cdk.CfnOutput(this, 'OrderLambdaArn', {
      value: orderLambda.functionArn,
      description: 'Order Lambda Function ARN',
      exportName: 'OrderLambdaArn',
    });

    new cdk.CfnOutput(this, 'AuthLambdaArn', {
      value: authLambda.functionArn,
      description: 'Auth Lambda Function ARN',
      exportName: 'AuthLambdaArn',
    });
  }
}

// App instantiation
const app = new cdk.App();
new ECommerceServerlessStack(app, 'ECommerceServerlessStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Secure serverless e-commerce platform infrastructure',
});
```

## Key Changes Made

### ✅ **Fixed Throttling Configuration**

- **Removed** the invalid `throttleSettings` from `deployOptions`
- **Added** proper throttling using `UsagePlan` and `ApiKey`
- **Configured** rate limiting (1000 req/sec) and burst limiting (2000 concurrent)
- **Added** daily quota limits (100,000 requests per day)

### 🔑 **Enhanced API Security**

- **API Key authentication** required for most endpoints (except auth)
- **Usage plan** association for proper throttling control
- **Quota management** to prevent abuse

### 🚀 **Testing the API with Throttling**

After deployment, you'll need to use the API key:

```bash
# Get the API key value from AWS Console or CLI
aws apigateway get-api-key --api-key <key-id> --include-value

# Test with API key
curl -H "X-API-Key: <your-api-key>" \
     https://your-api-id.execute-api.region.amazonaws.com/prod/products

# Auth endpoint doesn't require API key
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}' \
     https://your-api-id.execute-api.region.amazonaws.com/prod/auth
```

### 📊 **Throttling Features**

- **Rate limiting**: 1000 requests per second
- **Burst capacity**: 2000 concurrent requests
- **Daily quota**: 100,000 requests per day
- **API key required**: For all endpoints except authentication
- **Usage plan monitoring**: CloudWatch metrics for API usage

This corrected version now properly implements throttling using AWS API Gateway's recommended approach with Usage Plans and API Keys, which is the correct way to handle throttling in CDK.
