I'll help you create a serverless greeting API using AWS CDK TypeScript. Here's the complete infrastructure code:

## lib/lambda/greeting-function.ts

```typescript
export const handler = async (event: any): Promise<any> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const greeting = process.env.GREETING_MESSAGE || 'Hello, World!';
  const name = event.queryStringParameters?.name || 'Guest';
  
  try {
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        message: `${greeting}, ${name}!`,
        timestamp: new Date().toISOString(),
        requestId: event.requestContext?.requestId || 'unknown'
      })
    };
    
    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process greeting request'
      })
    };
  }
};
```

## lib/greeting-api-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface GreetingApiStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class GreetingApiStack extends cdk.Stack {
  public readonly greetingApi: apigateway.RestApi;
  public readonly greetingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: GreetingApiStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new logs.LogGroup(this, 'GreetingFunctionLogGroup', {
      logGroupName: `/aws/lambda/greeting-function-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'GreetingFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: [logGroup.logGroupArn]
            })
          ]
        })
      }
    });

    // Create Lambda function
    this.greetingFunction = new lambda.Function(this, 'GreetingFunction', {
      functionName: `greeting-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'greeting-function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        GREETING_MESSAGE: 'Welcome to our serverless API',
        ENVIRONMENT: environmentSuffix
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup
    });

    // Enable SnapStart for improved cold start performance
    const cfnFunction = this.greetingFunction.node.defaultChild as lambda.CfnFunction;
    cfnFunction.snapStart = {
      applyOn: 'PublishedVersions'
    };

    // Create Lambda Function URL for direct HTTPS access
    const functionUrl = this.greetingFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ['Content-Type']
      }
    });

    // Create API Gateway REST API
    this.greetingApi = new apigateway.RestApi(this, 'GreetingApi', {
      restApiName: `greeting-api-${environmentSuffix}`,
      description: 'Serverless greeting API with Lambda integration',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      },
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      }
    });

    // Create Lambda integration
    const greetingIntegration = new apigateway.LambdaIntegration(this.greetingFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // Add GET method to API Gateway
    this.greetingApi.root.addMethod('GET', greetingIntegration, {
      operationName: 'GetGreeting',
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL
          }
        }
      ]
    });

    // Add greeting resource with name parameter
    const greetingResource = this.greetingApi.root.addResource('greeting');
    greetingResource.addMethod('GET', greetingIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.greetingApi.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL'
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.greetingFunction.functionArn,
      description: 'Lambda function ARN'
    });
  }
}
```

## lib/tap-stack.ts (updated)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GreetingApiStack } from './greeting-api-stack';

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

    // Create the greeting API stack
    new GreetingApiStack(this, 'GreetingApiStack', {
      environmentSuffix,
      env: props?.env
    });
  }
}
```

This infrastructure provides:

1. **AWS Lambda function** with proper error handling and environment variables
2. **API Gateway REST API** with GET endpoint integration  
3. **IAM role** with CloudWatch Logs permissions
4. **Function URLs** for direct HTTPS access
5. **SnapStart optimization** for reduced cold start times
6. **Environment variables** for customizable greeting messages
7. **CORS configuration** for cross-origin requests
8. **CloudWatch logging** and monitoring

The Lambda function will respond with personalized greetings and can be accessed via both API Gateway and Function URLs.