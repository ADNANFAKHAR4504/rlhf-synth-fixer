Model response below:
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
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

    // Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/lambda-nova-team-development',
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, 'ProcessingLambda', {
      functionName: 'lambda-nova-team-development',
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
      reservedConcurrentExecutions: 1000,
      description:
        'High-performance Lambda function for processing web requests in nova-team development environment',
    });

    // Lambda Alias for Provisioned Concurrency
    const lambdaAlias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'live',
      version: lambdaFunction.currentVersion,
      description:
        'Live alias for production traffic with provisioned concurrency',
    });

    // Provisioned Concurrency (use provisionedConcurrentExecutions on version or alias if needed)
    // If you want provisioned concurrency, set it on the alias or version directly:
    lambdaAlias.addAutoScaling({
      minCapacity: 1,
      maxCapacity: 100,
    });

    // Application Auto Scaling Role (created if not already present)
    const autoScalingRole = new iam.Role(this, 'AutoScalingRole', {
      assumedBy: new iam.ServicePrincipal(
        'application-autoscaling.amazonaws.com'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSApplicationAutoscalingLambdaConcurrencyPolicy'
        ),
      ],
    });

    // Application Auto Scaling Target
    const scalableTarget = new applicationautoscaling.ScalableTarget(
      this,
      'LambdaScalableTarget',
      {
        serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
        resourceId: `function:${lambdaFunction.functionName}:${lambdaAlias.aliasName}`,
        scalableDimension: 'lambda:function:ProvisionedConcurrency',
        minCapacity: 50,
        maxCapacity: 1000,
        role: autoScalingRole,
      }
    );
    scalableTarget.node.addDependency(lambdaAlias);

    // Auto Scaling Policy
    new applicationautoscaling.TargetTrackingScalingPolicy(
      this,
      'LambdaScalingPolicy',
      {
        scalingTarget: scalableTarget,
        targetValue: 70.0,
        predefinedMetric:
          applicationautoscaling.PredefinedMetric
            .LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
        scaleOutCooldown: cdk.Duration.seconds(300),
        scaleInCooldown: cdk.Duration.seconds(300),
        disableScaleIn: false,
        policyName: 'lambda-scaling-policy-nova-team-development',
      }
    );

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
      // Removed defaultThrottle: not supported in HttpApiProps
    });

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
      exportName: 'nova-team-development-lambda-name',
    });
    new cdk.CfnOutput(this, 'LambdaAliasName', {
      value: lambdaAlias.aliasName,
      description: 'Lambda alias name for provisioned concurrency',
      exportName: 'nova-team-development-lambda-alias',
    });
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda function',
      exportName: 'nova-team-development-log-group',
    });
  }
}
```