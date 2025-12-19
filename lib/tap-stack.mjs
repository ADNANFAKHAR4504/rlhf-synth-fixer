import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const workoutLogsTable = new dynamodb.Table(this, 'WorkoutLogsTable', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'workoutTimestamp',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      readCapacity: 5,
      writeCapacity: 5,
    });

    // Auto Scaling - commented out for LocalStack compatibility
    // Application Auto Scaling service is not enabled in LocalStack
    // const readScaling = workoutLogsTable.autoScaleReadCapacity({
    //   minCapacity: 5,
    //   maxCapacity: 100
    // });

    // readScaling.scaleOnUtilization({
    //   targetUtilizationPercent: 70
    // });

    // const writeScaling = workoutLogsTable.autoScaleWriteCapacity({
    //   minCapacity: 5,
    //   maxCapacity: 100
    // });

    // writeScaling.scaleOnUtilization({
    //   targetUtilizationPercent: 70
    // });

    const apiRateLimitParam = new ssm.StringParameter(this, 'ApiRateLimit', {
      parameterName: `/fitness-tracking/api-rate-limit-${environmentSuffix}`,
      stringValue: '1000',
      tier: ssm.ParameterTier.STANDARD,
    });

    const workoutLogProcessorFunction = new lambda.Function(this, 'WorkoutLogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/workout-processor'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: workoutLogsTable.tableName,
        API_RATE_LIMIT_PARAM: apiRateLimitParam.parameterName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });
    
    workoutLogsTable.grantReadWriteData(workoutLogProcessorFunction);
    apiRateLimitParam.grantRead(workoutLogProcessorFunction);

    const api = new apigateway.RestApi(this, 'FitnessTrackingApi', {
      restApiName: `Fitness-Tracking-API-${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
    });

    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `fitness-api-key-${environmentSuffix}`,
    });

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `fitness-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });
    
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    const workoutsResource = api.root.addResource('workouts');
    
    workoutsResource.addMethod('POST', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutsResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    const workoutResource = workoutsResource.addResource('{workoutId}');
    
    workoutResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutResource.addMethod('PUT', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutResource.addMethod('DELETE', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      metric: api.metricServerError({
        period: cdk.Duration.minutes(1),
      statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: workoutLogProcessorFunction.metricErrors({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      metric: workoutLogsTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'DynamoWriteThrottleAlarm', {
      metric: workoutLogsTable.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM],
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    
    const dashboard = new cloudwatch.Dashboard(this, 'FitnessTrackingDashboard', {
      dashboardName: `FitnessTracking-Monitoring-${environmentSuffix}`,
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [api.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [
          api.metricClientError(),
          api.metricServerError(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Function',
        left: [
          workoutLogProcessorFunction.metricInvocations(),
          workoutLogProcessorFunction.metricErrors(),
          workoutLogProcessorFunction.metricDuration(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB',
        left: [
          workoutLogsTable.metricConsumedReadCapacityUnits(),
          workoutLogsTable.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      exportName: `FitnessApiEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      exportName: `FitnessApiKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: workoutLogsTable.tableName,
      exportName: `WorkoutTableName-${environmentSuffix}`,
    });
  }
}

export { TapStack };
