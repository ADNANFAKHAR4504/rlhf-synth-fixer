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

    // Add tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Author', 'unknown');
    cdk.Tags.of(this).add('Repository', 'unknown');

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new logs.LogGroup(this, 'GreetingFunctionLogGroup', {
      logGroupName: `/aws/lambda/greeting-function-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'GreetingFunctionRole', {
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
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
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
        ENVIRONMENT: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
    });

    // Note: SnapStart is only supported for Java runtimes, not Node.js
    // For Node.js, we optimize cold starts through:
    // - Proper memory allocation (256MB)
    // - Minimal dependencies
    // - Function URLs for direct access
    // - Optimized handler code

    // Create Lambda Function URL for direct HTTPS access
    const functionUrl = this.greetingFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ['Content-Type'],
      },
    });

    // Create API Gateway REST API
    this.greetingApi = new apigateway.RestApi(this, 'GreetingApi', {
      restApiName: `greeting-api-${environmentSuffix}`,
      description: 'Serverless greeting API with Lambda integration',
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
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        methodOptions: {
          '/*/*': {
            throttlingRateLimit: 100,
            throttlingBurstLimit: 200,
          },
        },
      },
    });

    // Create Lambda integration
    const greetingIntegration = new apigateway.LambdaIntegration(
      this.greetingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add GET method to API Gateway
    this.greetingApi.root.addMethod('GET', greetingIntegration, {
      operationName: 'GetGreeting',
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Add greeting resource with name parameter
    const greetingResource = this.greetingApi.root.addResource('greeting');
    greetingResource.addMethod('GET', greetingIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.greetingApi.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.greetingFunction.functionArn,
      description: 'Lambda function ARN',
    });
  }
}
