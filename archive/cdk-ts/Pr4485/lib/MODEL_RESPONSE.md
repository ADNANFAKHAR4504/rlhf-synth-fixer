### Reasoning Trace
---

The user wants me to update their existing `lib/tap-stack.ts` file to add various AWS resources directly into the TapStack class. They specifically mentioned:
- Do NOT create separate stack files
- Add all resources directly into the TapStack class where the comments indicate
- Use the existing environmentSuffix for naming

I need to add:
1. Lambda Function (Node.js 22.x)
2. S3 Bucket (secure, Lambda-only access)
3. DynamoDB Table (on-demand)
4. API Gateway (HTTP API with CORS)
5. IAM Permissions (using managed policies where possible)
6. CloudWatch Logging
7. SNS Topic for errors
8. Make it idempotent

I'll need to import the necessary CDK constructs and add all the resources directly in the constructor after the environmentSuffix variable.
### Answer 
---

I'll update your `lib/tap-stack.ts` file to include all the requested AWS resources. Here's the complete updated code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

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

    // Determine removal policy based on environment
    const removalPolicy = environmentSuffix === 'prod' 
      ? cdk.RemovalPolicy.RETAIN 
      : cdk.RemovalPolicy.DESTROY;

    // ==========================================
    // S3 Bucket - Secure, Lambda-only access
    // ==========================================
    const dataBucket = new s3.Bucket(this, `DataBucket-${environmentSuffix}`, {
      bucketName: `tap-data-bucket-${environmentSuffix}-${this.account}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy,
      autoDeleteObjects: environmentSuffix !== 'prod', // Auto-delete objects in non-prod
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        }
      ]
    });

    // ==========================================
    // DynamoDB Table - On-demand billing
    // ==========================================
    const dataTable = new dynamodb.Table(this, `DataTable-${environmentSuffix}`, {
      tableName: `tap-data-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: environmentSuffix === 'prod',
      removalPolicy,
      contributorInsightsEnabled: true,
    });

    // ==========================================
    // SNS Topic for Error Alerts
    // ==========================================
    const errorTopic = new sns.Topic(this, `ErrorTopic-${environmentSuffix}`, {
      topicName: `tap-error-alerts-${environmentSuffix}`,
      displayName: `TAP Error Alerts (${environmentSuffix})`,
    });

    // Optional: Add an email subscription (you can change this email)
    // Uncomment and update the email address if needed
    // errorTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription('your-email@example.com')
    // );

    // ==========================================
    // CloudWatch Log Groups
    // ==========================================
    const lambdaLogGroup = new logs.LogGroup(this, `LambdaLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/lambda/tap-function-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy,
    });

    const apiLogGroup = new logs.LogGroup(this, `ApiLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/apigateway/tap-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy,
    });

    // ==========================================
    // IAM Role for Lambda with AWS Managed Policies
    // ==========================================
    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      roleName: `tap-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for TAP Lambda function',
      managedPolicies: [
        // AWS Managed Policy for basic Lambda execution (CloudWatch Logs)
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant S3 read permissions to Lambda role
    dataBucket.grantRead(lambdaRole);

    // Grant DynamoDB read/write permissions to Lambda role
    dataTable.grantReadWriteData(lambdaRole);

    // Grant SNS publish permissions to Lambda role
    errorTopic.grantPublish(lambdaRole);

    // ==========================================
    // Lambda Function
    // ==========================================
    const apiFunction = new lambda.Function(this, `ApiFunction-${environmentSuffix}`, {
      functionName: `tap-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('@aws-sdk/client-sns');
        const snsClient = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          try {
            // Your business logic here
            // Access S3 bucket: process.env.S3_BUCKET_NAME
            // Access DynamoDB table: process.env.DYNAMODB_TABLE_NAME
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Success',
                environment: process.env.ENVIRONMENT,
                bucket: process.env.S3_BUCKET_NAME,
                table: process.env.DYNAMODB_TABLE_NAME
              })
            };
          } catch (error) {
            console.error('Error occurred:', error);
            
            // Send error to SNS topic
            try {
              await snsClient.publish({
                TopicArn: process.env.ERROR_TOPIC_ARN,
                Subject: \`Error in Lambda Function (\${process.env.ENVIRONMENT})\`,
                Message: JSON.stringify({
                  error: error.message,
                  stack: error.stack,
                  timestamp: new Date().toISOString(),
                  environment: process.env.ENVIRONMENT
                }, null, 2)
              });
            } catch (snsError) {
              console.error('Failed to send SNS notification:', snsError);
            }
            
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
      environment: {
        S3_BUCKET_NAME: dataBucket.bucketName,
        DYNAMODB_TABLE_NAME: dataTable.tableName,
        ERROR_TOPIC_ARN: errorTopic.topicArn,
        ENVIRONMENT: environmentSuffix,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: lambdaLogGroup,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      retryAttempts: 2,
      reservedConcurrentExecutions: environmentSuffix === 'prod' ? 100 : 10,
    });

    // ==========================================
    // API Gateway HTTP API with CORS
    // ==========================================
    const httpApi = new apigatewayv2.HttpApi(this, `HttpApi-${environmentSuffix}`, {
      apiName: `tap-api-${environmentSuffix}`,
      description: `TAP HTTP API (${environmentSuffix})`,
      corsPreflight: {
        allowOrigins: ['https://example.com'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(24),
      },
    });

    // Lambda integration for API Gateway
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      `LambdaIntegration-${environmentSuffix}`,
      apiFunction
    );

    // Add routes to the API
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Add a default route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // ==========================================
    // API Gateway Logging
    // ==========================================
    const apiLogRole = new iam.Role(this, `ApiLogRole-${environmentSuffix}`, {
      roleName: `tap-api-log-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
    });

    // Configure API Gateway stage with logging
    const defaultStage = httpApi.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          error: '$context.error.message',
          integrationError: '$context.integrationErrorMessage',
        }),
      };
    }

    // Grant API Gateway permission to write to CloudWatch Logs
    apiLogGroup.grantWrite(apiLogRole);

    // ==========================================
    // Stack Outputs
    // ==========================================
    new cdk.CfnOutput(this, `ApiUrl-${environmentSuffix}`, {
      value: httpApi.apiEndpoint,
      description: `HTTP API endpoint URL (${environmentSuffix})`,
      exportName: `tap-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `BucketName-${environmentSuffix}`, {
      value: dataBucket.bucketName,
      description: `S3 bucket name (${environmentSuffix})`,
      exportName: `tap-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TableName-${environmentSuffix}`, {
      value: dataTable.tableName,
      description: `DynamoDB table name (${environmentSuffix})`,
      exportName: `tap-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ErrorTopicArn-${environmentSuffix}`, {
      value: errorTopic.topicArn,
      description: `SNS error topic ARN (${environmentSuffix})`,
      exportName: `tap-error-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `LambdaFunctionName-${environmentSuffix}`, {
      value: apiFunction.functionName,
      description: `Lambda function name (${environmentSuffix})`,
      exportName: `tap-lambda-name-${environmentSuffix}`,
    });

    // ==========================================
    // Tags for all resources
    // ==========================================
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## Key Features Implemented:

### 1. **Lambda Function**
- Uses Node.js 22.x runtime
- Has environment variables for S3 bucket and DynamoDB table names
- Includes error handling that publishes to SNS topic
- Configured with X-Ray tracing for observability

### 2. **S3 Bucket**
- Completely locked down with `blockPublicAccess.BLOCK_ALL`
- SSL enforced
- Server-side encryption enabled
- Only Lambda has read access via IAM role

### 3. **DynamoDB Table**
- Configured with on-demand billing mode
- AWS-managed encryption
- Point-in-time recovery for production environments

### 4. **API Gateway**
- HTTP API (not REST API) for better performance and lower cost
- CORS configured for `https://example.com` (update as needed)
- CloudWatch logging enabled with detailed access logs
- Catch-all routes configured

### 5. **IAM Permissions**
- Uses AWS Managed Policy `AWSLambdaBasicExecutionRole` for Lambda
- Uses CDK's built-in grant methods for S3 and DynamoDB permissions
- API Gateway has its own role for CloudWatch logging

### 6. **CloudWatch Logging**
- Separate log groups for Lambda and API Gateway
- Configurable retention (set to 1 week, adjust as needed)
- Structured logging for API Gateway

### 7. **Error Handling**
- SNS topic created for error alerts
- Lambda publishes errors to SNS automatically
- You can uncomment the email subscription and add your email

### 8. **Idempotency**
- All resources have unique names using `environmentSuffix`
- Stack can be deployed multiple times without conflicts
- Removal policies respect environment (RETAIN for prod, DESTROY for dev)

## Usage:

Deploy with different environments:
```bash
# Deploy to dev (default)
cdk deploy

# Deploy to staging
cdk deploy -c environmentSuffix=staging

# Deploy to production
cdk deploy -c environmentSuffix=prod
```

The stack is fully idempotent and follows AWS CDK best practices. All resource names include the environment suffix to ensure uniqueness across deployments.
