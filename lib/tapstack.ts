// lib/iac-aws-nova-model-breaking-stack.ts

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

    // Define common tags for all resources
    const commonTags = {
      project: 'IaC-AWS-Nova-Model-Breaking',
      owner: 'nova-team',
      environment: 'development'
    };

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('project', commonTags.project);
    cdk.Tags.of(this).add('owner', commonTags.owner);
    cdk.Tags.of(this).add('environment', commonTags.environment);

    // 1. CloudWatch Log Group for Lambda function
    // Centralized logging with 90-day retention policy
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/lambda-nova-team-development`,
      retention: logs.RetentionDays.THREE_MONTHS, // 90 days
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environment
    });

    // 2. IAM Role for Lambda function
    // Custom role with necessary permissions for logging and execution
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: 'lambda-execution-role-nova-team-development',
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
              resources: [lambdaLogGroup.logGroupArn + ':*']
            })
          ]
        })
      }
    });

    // 3. Lambda Function
    // Core compute layer with Node.js 18.x runtime for data processing
    const lambdaFunction = new lambda.Function(this, 'ProcessingLambda', {
      functionName: 'lambda-nova-team-development',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      logGroup: lambdaLogGroup,
      environment: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'info'
      },
      // Reserved concurrency to prevent function from consuming all account concurrency
      reservedConcurrentExecutions: 1000,
      description: 'High-performance Lambda function for processing web requests in nova-team development environment'
    });

    // 4. Lambda Alias for Provisioned Concurrency
    // Alias pointing to the latest version for traffic management and provisioned concurrency
    const lambdaAlias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'live',
      version: lambdaFunction.currentVersion,
      description: 'Live alias for production traffic with provisioned concurrency'
    });

    // 5. Provisioned Concurrency Configuration
    // Initial provisioned concurrency to handle baseline traffic with low latency
    const provisionedConcurrency = new lambda.CfnProvisionedConcurrencyConfig(this, 'ProvisionedConcurrency', {
      functionName: lambdaFunction.functionName,
      qualifier: lambdaAlias.aliasName,
      provisionedConcurrencyCount: 100 // Initial baseline capacity
    });

    // Ensure the alias is created before provisioned concurrency
    provisionedConcurrency.addDependency(lambdaAlias.node.defaultChild as lambda.CfnAlias);

    // 6. Application Auto Scaling Target
    // Scalable target for the Lambda alias provisioned concurrency
    const scalableTarget = new applicationautoscaling.ScalableTarget(this, 'LambdaScalableTarget', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
      resourceId: `function:${lambdaFunction.functionName}:${lambdaAlias.aliasName}`,
      scalableDimension: 'lambda:function:ProvisionedConcurrency',
      minCapacity: 50,  // Minimum provisioned concurrency
      maxCapacity: 1000, // Maximum provisioned concurrency to handle 1000+ concurrent requests
      role: iam.Role.fromRoleArn(this, 'ApplicationAutoScalingRole', 
        `arn:aws:iam::${this.account}:role/application-autoscaling-lambda-role`,
        { mutable: false }
      ) || new iam.Role(this, 'AutoScalingRole', {
        assumedBy: new iam.ServicePrincipal('application-autoscaling.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSApplicationAutoscalingLambdaConcurrencyPolicy')
        ]
      })
    });

    // Ensure scalable target is created after provisioned concurrency
    scalableTarget.node.addDependency(provisionedConcurrency);

    // 7. Auto Scaling Policy
    // Target tracking scaling policy to maintain 70% utilization
    const scalingPolicy = new applicationautoscaling.TargetTrackingScalingPolicy(this, 'LambdaScalingPolicy', {
      scalingTarget: scalableTarget,
      targetValue: 70.0, // Target 70% utilization
      predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
      scaleOutCooldown: cdk.Duration.seconds(300), // 5 minutes cooldown for scale out
      scaleInCooldown: cdk.Duration.seconds(300),  // 5 minutes cooldown for scale in
      disableScaleIn: false, // Allow scaling in to save costs
      policyName: 'lambda-scaling-policy-nova-team-development'
    });

    // 8. API Gateway HTTP API
    // Public-facing entry point for all incoming HTTP requests
    const httpApi = new apigateway.HttpApi(this, 'NovaHttpApi', {
      apiName: 'api-gateway-nova-team-development',
      description: 'HTTP API Gateway for nova-team development environment - high-throughput serverless architecture',
      corsPreflight: {
        allowOrigins: ['*'], // Configure based on your security requirements
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST, apigateway.CorsHttpMethod.PUT, apigateway.CorsHttpMethod.DELETE],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
      },
      // Enable throttling to protect backend
      defaultThrottle: {
        rateLimit: 10000, // Requests per second
        burstLimit: 20000 // Burst capacity
      }
    });

    // 9. Lambda Integration with API Gateway
    // Integration between API Gateway and Lambda function using the alias
    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      lambdaAlias, // Use alias instead of function directly for provisioned concurrency
      {
        payloadFormatVersion: apigateway.PayloadFormatVersion.VERSION_2_0,
        timeout: cdk.Duration.seconds(29) // Slightly less than Lambda timeout
      }
    );

    // 10. API Gateway Routes
    // Default route to handle all HTTP methods and paths
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.DELETE,
        apigateway.HttpMethod.PATCH,
        apigateway.HttpMethod.OPTIONS
      ],
      integration: lambdaIntegration
    });

    // Root path route
    httpApi.addRoutes({
      path: '/',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration: lambdaIntegration
    });

    // 11. CloudFormation Outputs
    // Export important resource identifiers and endpoints
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API Gateway endpoint URL',
      exportName: 'nova-team-development-api-url'
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: 'nova-team-development-lambda-name'
    });

    new cdk.CfnOutput(this, 'LambdaAliasName', {
      value: lambdaAlias.aliasName,
      description: 'Lambda alias name for provisioned concurrency',
      exportName: 'nova-team-development-lambda-alias'
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda function',
      exportName: 'nova-team-development-log-group'
    });

    // 12. Additional Monitoring and Alarms (Optional but recommended)
    // You can uncomment and customize these based on your monitoring requirements
    
    /*
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaFunction.metricErrors({
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function error rate alarm'
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      metric: lambdaFunction.metricDuration({
        period: cdk.Duration.minutes(5)
      }),
      threshold: 25000, // 25 seconds
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function duration alarm'
    });
    */
  }
}