import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
// applicationautoscaling is no longer needed directly for this pattern
import { Construct } from 'constructs';
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

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, 'ProcessingLambda', {
      functionName: uniqueFunctionName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
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

    // Lambda Alias for Provisioned Concurrency
    const lambdaAlias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: uniqueAliasName,
      version: lambdaFunction.currentVersion,
      description: `Live alias for production traffic with provisioned concurrency (${stackName})`,
      provisionedConcurrentExecutions: 5, // Set to a safe value within account limits
    });
    // Explicitly tag Lambda alias
    Object.entries(commonTags).forEach(([k, v]) =>
      cdk.Tags.of(lambdaAlias).add(k, v)
    );

    // CORRECTED: Provisioned Concurrency Auto Scaling using the high-level helper method.
    // This is the recommended approach. It's cleaner and less verbose.
    const scaling = lambdaAlias.addAutoScaling({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // We then apply the target tracking policy directly to the scaling object.
    scaling.scaleOnUtilization({
      utilizationTarget: 0.7, // This is 70%
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
      policyName: `${stackName}-lambda-scaling-policy-nova-team-development`,
    });

    // --- The following manual definitions have been REMOVED ---
    // - new iam.Role(this, 'AutoScalingRole', ...
    // - new applicationautoscaling.ScalableTarget(...
    // - new applicationautoscaling.TargetTrackingScalingPolicy(...
    // --- They are redundant because addAutoScaling() handles them ---

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
      exportName: `${stackName}-nova-team-development-lambda-name`,
    });
    new cdk.CfnOutput(this, 'LambdaAliasName', {
      value: lambdaAlias.aliasName,
      description: 'Lambda alias name for provisioned concurrency',
      exportName: `${stackName}-nova-team-development-lambda-alias`,
    });
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda function',
      exportName: `${stackName}-nova-team-development-log-group`,
    });
  }
}
