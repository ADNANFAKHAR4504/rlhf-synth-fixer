import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags
    const commonTags = {
      project: 'IaC-AWS-Nova-Model-Breaking',
      owner: 'nova-team',
      environment: 'development',
    };
    cdk.Tags.of(this).add('project', commonTags.project);
    cdk.Tags.of(this).add('owner', commonTags.owner);
    cdk.Tags.of(this).add('environment', commonTags.environment);

    // Use stack name and unique suffix for uniqueness
    const stackName = cdk.Stack.of(this).stackName;
    const uniqueSuffix = this.node.addr.slice(-8);
    const uniqueFunctionName = `${stackName}-lambda-nova-destruction-dev-${uniqueSuffix}`;
    const uniqueAliasName = `${stackName}-live-${uniqueSuffix}`;

    // Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${uniqueFunctionName}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // Explicitly tag log group
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(lambdaLogGroup).add(k, v)
    );

    // IAM Role for Lambda
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: 'lambda-execution-role-nova-team-development',
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
              resources: [lambdaLogGroup.logGroupArn + ':*'],
            }),
          ],
        }),
      },
    });
    // Explicitly tag IAM role
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(lambdaExecutionRole).add(k, v)
    );

    // Lambda Function - Use inline code for LocalStack compatibility
    const lambdaCode = fs.readFileSync(
      path.join(__dirname, 'lambda', 'index.js'),
      'utf8'
    );

    const lambdaFunction = new lambda.Function(this, 'ProcessingLambda', {
      functionName: uniqueFunctionName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(lambdaCode),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'info',
      },
      description:
        'High-performance Lambda function for processing web requests in nova-team development environment',
    });
    // Explicitly tag Lambda function
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(lambdaFunction).add(k, v)
    );

    // For LocalStack: Skip provisioned concurrency and auto scaling (limited support)
    // Use Lambda version/alias for production-like setup without provisioned concurrency
    const lambdaVersion = lambdaFunction.currentVersion;

    const lambdaAlias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: uniqueAliasName,
      version: lambdaVersion,
      description: `Live alias for production traffic (${stackName})`,
      // Removed: provisionedConcurrentExecutions (not well supported in LocalStack)
    });
    // Explicitly tag Lambda alias
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(lambdaAlias).add(k, v)
    );

    // Note: Auto scaling removed for LocalStack compatibility
    // In production, add back:
    // const scaling = lambdaAlias.addAutoScaling({ minCapacity: 100, maxCapacity: 1200 });
    // scaling.scaleOnUtilization({ utilizationTarget: 0.8, ... });

    // API Gateway HTTP API
    const httpApi = new apigateway.HttpApi(this, 'NovaHttpApi', {
      apiName: 'api-gateway-nova-team-development',
      description:
        'HTTP API Gateway for nova-team development environment - high-throughput serverless architecture',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(httpApi).add(k, v)
    );

    // Lambda Integration with API Gateway
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      lambdaAlias,
      {
        payloadFormatVersion: apigateway.PayloadFormatVersion.VERSION_2_0,
        timeout: cdk.Duration.seconds(29),
      }
    );

    // API Gateway Routes
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.DELETE,
        apigateway.HttpMethod.PATCH,
        apigateway.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });
    httpApi.addRoutes({
      path: '/',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: lambdaIntegration,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API Gateway endpoint URL',
      exportName: 'nova-team-development-api-url',
    });
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `${stackName}-lambda-function-name`,
    });
    new cdk.CfnOutput(this, 'LambdaAliasName', {
      value: lambdaAlias.aliasName,
      description: 'Lambda alias name for provisioned concurrency',
      exportName: `${stackName}-lambda-alias-name`,
    });
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda function',
      exportName: `${stackName}-lambda-log-group`,
    });
    // Add outputs for integration tests
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: 'your-s3-bucket-name', // Replace with actual bucket name if created in this stack
      description: 'S3 bucket name for processed data',
      exportName: `${stackName}-s3-bucket-name`,
    });
    new cdk.CfnOutput(this, 'DLQUrl', {
      value: 'your-dlq-url', // Replace with actual DLQ URL if created in this stack
      description: 'SQS Dead Letter Queue URL',
      exportName: `${stackName}-dlq-url`,
    });
  }
}
