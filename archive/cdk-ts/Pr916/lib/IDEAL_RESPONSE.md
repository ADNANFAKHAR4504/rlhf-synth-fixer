I'll help you create AWS serverless infrastructure using CDK TypeScript for a production environment. Here's the complete solution with separate files for better organization:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      env: props?.env,
    });

    // Create Monitoring stack
    new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      apiGateway: apiGatewayStack.restApi,
      env: props?.env,
    });

    // Add dependency
    apiGatewayStack.addDependency(lambdaStack);

    // Add outputs
    new cdk.CfnOutput(this, 'StackEnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this stack',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `${this.stackName}-Region`,
    });
  }
}
```

## lib/lambda-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `lambda-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLambdaInsightsExecutionRolePolicy'),
      ],
      inlinePolicies: {
        CloudWatchInsightsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create CloudWatch Log Group with retention policy for cost optimization
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      logGroupClass: logs.LogGroupClass.STANDARD, // Using standard class for tiered pricing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'ServerlessApiFunction', {
      functionName: `serverless-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify({
              message: 'Hello from serverless API!',
              timestamp: new Date().toISOString(),
              requestId: event.requestContext?.requestId || 'unknown',
            }),
          };
          
          return response;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0, // Enable Lambda Insights
    });

    // Create Function URL as alternative to API Gateway for simpler endpoint
    const functionUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowCredentials: false,
        allowedHeaders: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ['*'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'Lambda');

    // Output the function URL
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL',
      exportName: `${this.stackName}-FunctionUrl`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${this.stackName}-FunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${this.stackName}-FunctionArn`,
    });
  }
}
```

## lib/api-gateway-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  lambdaFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create API Gateway REST API
    this.restApi = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: `Serverless API for ${environmentSuffix} environment`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      cloudWatchRole: true,
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.lambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add resource and methods
    const apiResource = this.restApi.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Add health check endpoint
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Add main API endpoints
    const dataResource = v1Resource.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration);
    dataResource.addMethod('POST', lambdaIntegration);
    dataResource.addMethod('PUT', lambdaIntegration);
    dataResource.addMethod('DELETE', lambdaIntegration);

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'ApiGateway');

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.restApi.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayRestApiId', {
      value: this.restApi.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-RestApiId`,
    });
  }
}
```

## lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `serverless-api-alerts-${environmentSuffix}`,
      displayName: 'Serverless API Alerts',
    });

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `lambda-duration-${environmentSuffix}`,
      alarmDescription: 'Lambda function duration exceeds threshold',
      metric: props.lambdaFunction.metricDuration({
        statistic: 'Average',
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Error Rate Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Lambda function error rate is too high',
      metric: props.lambdaFunction.metricErrors({
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Throttles Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `lambda-throttles-${environmentSuffix}`,
      alarmDescription: 'Lambda function is being throttled',
      metric: props.lambdaFunction.metricThrottles({
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // API Gateway 4XX Errors Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxErrorAlarm', {
      alarmName: `api-4xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 4XX error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    api4xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // API Gateway 5XX Errors Alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxErrorAlarm', {
      alarmName: `api-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 5XX error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
    api5xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessApiDashboard', {
      dashboardName: `serverless-api-dashboard-${environmentSuffix}`,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          props.lambdaFunction.metricInvocations(),
          props.lambdaFunction.metricErrors(),
          props.lambdaFunction.metricThrottles(),
        ],
        right: [
          props.lambdaFunction.metricDuration(),
        ],
        width: 12,
        height: 6,
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'Monitoring');

    // Output SNS Topic ARN
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `${this.stackName}-AlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${this.stackName}-DashboardUrl`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName!,
      description: 'CloudWatch Dashboard Name',
      exportName: `${this.stackName}-DashboardName`,
    });
  }
}
```

This CDK TypeScript solution provides:

1. **Lambda Function** with proper IAM roles following least privilege principle
2. **Function URLs** for simpler endpoint creation as an alternative to API Gateway
3. **API Gateway** with CORS configuration for traditional REST API endpoints
4. **CloudWatch monitoring** with Lambda Insights enabled for performance tracking
5. **Cost-optimized logging** using CloudWatch Logs standard class for tiered pricing
6. **Comprehensive alarms** for error rates, duration, and throttling
7. **CloudWatch Dashboard** for visualization
8. **Proper tagging** with 'Environment: Production' on all resources
9. **Multiple deployment options** - both Function URLs and API Gateway endpoints
10. **Production-ready configuration** with appropriate timeouts, memory, and monitoring
11. **Proper CDK exports** for cross-stack references and integration testing
12. **Environment suffix support** for multi-environment deployments
13. **Throttling configuration** at API Gateway stage level for rate limiting
14. **CloudWatch Actions** properly imported and configured for SNS notifications