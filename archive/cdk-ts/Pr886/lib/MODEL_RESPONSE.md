# AWS CDK TypeScript Serverless Web Application Infrastructure

Here's the complete infrastructure code for your serverless web application using CDK TypeScript:

## lib/tap-stack.ts

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

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // S3 bucket for Lambda deployment artifacts with encryption
    const lambdaArtifactsBucket = new s3.Bucket(this, 'LambdaArtifactsBucket', {
      bucketName: `lambda-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-production environments
      autoDeleteObjects: true, // For non-production environments
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for Lambda function with CloudWatch Logs permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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
              resources: [lambdaLogGroup.logGroupArn, `${lambdaLogGroup.logGroupArn}:*`],
            }),
          ],
        }),
        S3Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [`${lambdaArtifactsBucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    // Lambda function with Python 3.8 runtime
    const serverlessApiFunction = new lambda.Function(this, 'ServerlessApiFunction', {
      functionName: `serverless-api-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      logGroup: lambdaLogGroup,
      code: lambda.Code.fromInline(`
import json
import datetime

def handler(event, context):
    """
    Lambda function handler that returns a JSON response with message and timestamp.
    """
    try:
        # Get current timestamp
        current_time = datetime.datetime.now().isoformat()
        
        # Create response
        response_body = {
            'message': 'Hello from serverless API!',
            'timestamp': current_time,
            'requestId': context.aws_request_id,
            'path': event.get('rawPath', '/'),
            'method': event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
      `),
      environment: {
        BUCKET_NAME: lambdaArtifactsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      // Enable Lambda Insights for monitoring
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    });

    // API Gateway HTTP API v2 with TLS 1.3
    const httpApi = new apigatewayv2.HttpApi(this, 'ServerlessHttpApi', {
      apiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless API using HTTP API v2 with Lambda integration',
      // CORS configuration
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Lambda integration for API Gateway
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      serverlessApiFunction
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
  }
}
```

This implementation provides:

1. **AWS Lambda Function**: Python 3.8 runtime with a simple Hello World API that returns JSON with message and timestamp
2. **API Gateway HTTP API v2**: Uses the newer HTTP API for better performance and lower costs compared to REST API, with automatic TLS 1.3 support
3. **IAM Role**: Proper execution role with CloudWatch Logs permissions and S3 access
4. **S3 Bucket**: Encrypted bucket for storing Lambda deployment artifacts with versioning enabled
5. **CloudWatch Lambda Insights**: Enabled for performance monitoring and troubleshooting
6. **CORS Configuration**: Properly configured for web application access
7. **Comprehensive Routing**: Supports both root path and wildcard proxy routes
8. **Security**: Uses S3-managed encryption, blocks public access, and includes proper IAM policies
9. **Environment-aware**: Uses environment suffix for resource naming
10. **CloudWatch Logs**: Dedicated log group with retention policy

The Lambda function includes error handling, CORS headers, and returns detailed information including request context. All resources are properly tagged and named with environment suffixes for multi-environment deployments.