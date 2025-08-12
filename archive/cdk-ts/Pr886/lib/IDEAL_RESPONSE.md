# AWS CDK TypeScript Serverless Web Application Infrastructure - Ideal Response

## Complete Infrastructure Implementation

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or environment variable
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // S3 bucket for Lambda deployment artifacts with encryption
    const lambdaArtifactsBucket = new s3.Bucket(this, 'LambdaArtifactsBucket', {
      bucketName: `lambda-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for Lambda function with CloudWatch Logs permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `serverless-api-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                lambdaLogGroup.logGroupArn,
                `${lambdaLogGroup.logGroupArn}:*`,
              ],
            }),
          ],
        }),
        S3Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${lambdaArtifactsBucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    // Lambda function with Python 3.8 runtime
    const serverlessApiFunction = new lambda.Function(
      this,
      'ServerlessApiFunction',
      {
        functionName: `serverless-api-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: 'index.handler',
        role: lambdaExecutionRole,
        logGroup: lambdaLogGroup,
        code: lambda.Code.fromInline(`
import json
import datetime
import os

def handler(event, context):
    """
    Lambda function handler that returns a JSON response with message and timestamp.
    """
    try:
        # Get current timestamp
        current_time = datetime.datetime.now().isoformat()
        
        # Extract path and method from event
        path = event.get('rawPath', '/')
        request_context = event.get('requestContext', {})
        http_context = request_context.get('http', {})
        method = http_context.get('method', 'GET')
        
        # Create response
        response_body = {
            'message': 'Hello from serverless API!',
            'timestamp': current_time,
            'requestId': context.aws_request_id,
            'path': path,
            'method': method,
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'X-Request-Id': context.aws_request_id
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'requestId': context.aws_request_id
            })
        }
      `),
        environment: {
          BUCKET_NAME: lambdaArtifactsBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
        tracing: lambda.Tracing.ACTIVE,
        description: `Serverless API Lambda function for ${environmentSuffix} environment`,
      }
    );

    // API Gateway HTTP API v2
    const httpApi = new apigatewayv2.HttpApi(this, 'ServerlessHttpApi', {
      apiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless API using HTTP API v2 with Lambda integration',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(24),
        allowCredentials: false,
      },
    });

    // Lambda integration for API Gateway
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        serverlessApiFunction,
        {
          payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        }
      );

    // Add routes to the HTTP API
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Grant API Gateway permission to invoke Lambda
    serverlessApiFunction.addPermission('ApiGatewayInvokePermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${httpApi.httpApiId}/*`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
      description: 'HTTP API Gateway URL',
      exportName: `ServerlessApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: serverlessApiFunction.functionName,
      description: 'Lambda function name',
      exportName: `ServerlessLambdaFunction-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: serverlessApiFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `ServerlessLambdaArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: lambdaArtifactsBucket.bucketName,
      description: 'S3 bucket for Lambda artifacts',
      exportName: `ServerlessS3Bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name',
      exportName: `ServerlessLogGroup-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: httpApi.httpApiId,
      description: 'HTTP API Gateway ID',
      exportName: `ServerlessApiId-${environmentSuffix}`,
    });
  }
}
```

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = 
  app.node.tryGetContext('environmentSuffix') || 
  process.env.ENVIRONMENT_SUFFIX || 
  'dev';

const stackName = `TapStack${environmentSuffix}`;

// Repository and author information
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all resources in the app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('Project', 'ServerlessAPI');

// Create the stack
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Serverless API infrastructure stack for ${environmentSuffix} environment`,
});
```

## Key Improvements in the Ideal Response

### 1. **Enhanced Environment Configuration**
- Added support for `ENVIRONMENT_SUFFIX` environment variable
- Proper fallback chain: props → context → environment → default

### 2. **S3 Bucket Enhancements**
- Added lifecycle rules for old version cleanup
- Automatic cleanup of incomplete multipart uploads
- Consistent naming with environment suffix

### 3. **Lambda Function Improvements**
- Added X-Ray tracing support
- Better error logging with print statements
- Added request ID to response headers
- Environment variable for tracking deployment environment
- More detailed function description

### 4. **API Gateway Enhancements**
- Added max age for CORS preflight caching
- Explicit payload format version in integration
- Better CORS configuration with credentials flag

### 5. **IAM Role Improvements**
- Named role for easier identification
- Proper resource naming with environment suffix

### 6. **Additional Outputs**
- Lambda function ARN for cross-stack references
- API Gateway ID for programmatic access
- All outputs properly exported with naming convention

### 7. **Tagging Strategy**
- Comprehensive tagging for cost allocation
- Project and management tags
- Consistent tag application across all resources

### 8. **Stack Configuration**
- Stack description for better AWS Console visibility
- Proper region defaulting to us-east-1
- Better environment handling

## Production Readiness Features

1. **Monitoring**: Lambda Insights and X-Ray tracing enabled
2. **Security**: Least privilege IAM policies, encrypted S3 bucket
3. **Cost Optimization**: S3 lifecycle rules, appropriate Lambda sizing
4. **Reliability**: Error handling, proper timeout configuration
5. **Scalability**: API Gateway HTTP API v2 for better performance
6. **Maintainability**: Clear resource naming, comprehensive outputs
7. **Compliance**: Proper tagging, CloudWatch logs retention policy

This implementation fully satisfies all requirements while following AWS best practices for production deployment.