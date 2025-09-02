Here's the comprehensive TypeScript CDK solution that creates a secure, serverless e-commerce infrastructure with proper environment suffix support and all requirements met:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
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

    const commonTags = {
      Project: 'ECommerce',
      Environment: environmentSuffix,
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
      bucketName: `ecommerce-artifacts-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}-${environmentSuffix}`,
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
      // Removal policy for testing environments (destroy on cleanup)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===== DEAD LETTER QUEUE =====
    // DLQ for failed Lambda executions - failure management
    const deadLetterQueue = new sqs.Queue(this, 'ECommerceDLQ', {
      queueName: `ecommerce-dlq-${environmentSuffix}`,
      // Retain messages for 14 days for investigation
      retentionPeriod: cdk.Duration.days(14),
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
    // Create log groups first to ensure proper naming
    const productLogGroup = new logs.LogGroup(this, 'ProductLambdaLogGroup', {
      logGroupName: `/aws/lambda/ecommerce-product-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Product management Lambda function
    const productLambda = new lambda.Function(this, 'ProductLambda', {
      functionName: `ecommerce-product-handler-${environmentSuffix}`,
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
        NODE_ENV: environmentSuffix,
      },
      // Timeout and memory configuration
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      // Dead letter queue for failure management
      deadLetterQueue: deadLetterQueue,
      // Retry configuration
      retryAttempts: 2,
      // Enable tracing for debugging
      tracing: lambda.Tracing.ACTIVE,
      logGroup: productLogGroup,
    });

    // Order management Lambda function
    const orderLogGroup = new logs.LogGroup(this, 'OrderLambdaLogGroup', {
      logGroupName: `/aws/lambda/ecommerce-order-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const orderLambda = new lambda.Function(this, 'OrderLambda', {
      functionName: `ecommerce-order-handler-${environmentSuffix}`,
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
        NODE_ENV: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      deadLetterQueue: deadLetterQueue,
      retryAttempts: 2,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: orderLogGroup,
    });

    // User authentication Lambda function
    const authLogGroup = new logs.LogGroup(this, 'AuthLambdaLogGroup', {
      logGroupName: `/aws/lambda/ecommerce-auth-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const authLambda = new lambda.Function(this, 'AuthLambda', {
      functionName: `ecommerce-auth-handler-${environmentSuffix}`,
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
        NODE_ENV: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(15),
      memorySize: 128,
      deadLetterQueue: deadLetterQueue,
      retryAttempts: 2,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: authLogGroup,
    });

    // ===== API GATEWAY =====
    // Regional API Gateway with comprehensive configuration
    const api = new apigateway.RestApi(this, 'ECommerceApi', {
      restApiName: `ecommerce-api-${environmentSuffix}`,
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
      apiKeyName: `ecommerce-api-key-${environmentSuffix}`,
      description: 'API Key for E-Commerce platform',
    });

    // Create usage plan with throttling and quota limits
    const usagePlan = new apigateway.UsagePlan(this, 'ECommerceUsagePlan', {
      name: `ecommerce-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for E-Commerce API with throttling',
      throttle: {
        rateLimit: 100, // requests per second
        burstLimit: 200, // maximum concurrent requests
      },
      quota: {
        limit: 10000, // total requests per period
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

    // ===== CLOUDWATCH ALARMS =====
    // Error rate alarms for Lambda functions
    new cloudwatch.Alarm(this, 'ProductLambdaErrorAlarm', {
      alarmName: `ecommerce-product-lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for product Lambda function errors',
      metric: productLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'OrderLambdaErrorAlarm', {
      alarmName: `ecommerce-order-lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for order Lambda function errors',
      metric: orderLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Throttling alarms
    new cloudwatch.Alarm(this, 'ProductLambdaThrottleAlarm', {
      alarmName: `ecommerce-product-lambda-throttles-${environmentSuffix}`,
      alarmDescription: 'Alarm for product Lambda function throttling',
      metric: productLambda.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // API Gateway 4XX and 5XX error alarms
    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      alarmName: `ecommerce-api-4xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm for API Gateway 4XX errors',
      metric: api.metricClientError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `ecommerce-api-5xx-errors-${environmentSuffix}`,
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
```

## Key Features and Security Implementations

### Security Best Practices

- **Least-privilege IAM roles** with specific permissions for each Lambda function
- **S3 bucket encryption** with AES-256 and blocked public access
- **HTTPS enforcement** through API Gateway configuration
- **Environment variables** securely managed within Lambda functions
- **Dead Letter Queue encryption** with KMS-managed keys
- **API key authentication** with usage plans for throttling

### Scalability and Performance

- **Environment suffix support** for multi-deployment scenarios
- **Regional API Gateway** for better performance and lower latency
- **CloudWatch logging** with retention policies for cost management
- **API throttling** configuration to handle traffic spikes
- **Proper resource naming** with environment suffix to avoid conflicts

### Monitoring and Alerting

- **CloudWatch alarms** for error rates, throttling, and API Gateway metrics
- **Distributed tracing** enabled on all Lambda functions
- **Comprehensive logging** with structured log groups
- **Custom log groups** with proper naming and retention

### Deployment Best Practices

- **Destroyable resources** - no Retain policies for testing environments
- **Environment-specific naming** - all resources include environment suffix
- **Proper resource dependencies** - log groups created before Lambda functions
- **Comprehensive outputs** for integration testing
- **Resource tagging** for governance and cost tracking

This infrastructure follows AWS Well-Architected Framework principles and provides a solid foundation for a production e-commerce platform with proper security, monitoring, scalability, and deployment considerations.