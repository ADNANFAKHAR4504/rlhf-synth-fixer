import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Dead Letter Queues
    const validatorDLQ = new sqs.Queue(this, 'ValidatorDLQ', {
      queueName: `validator-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const transformerDLQ = new sqs.Queue(this, 'TransformerDLQ', {
      queueName: `transformer-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const enricherDLQ = new sqs.Queue(this, 'EnricherDLQ', {
      queueName: `enricher-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const qualityCheckDLQ = new sqs.Queue(this, 'QualityCheckDLQ', {
      queueName: `quality-check-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // S3 Bucket for data storage
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `etl-data-bucket-${environmentSuffix}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldRawFiles',
          prefix: 'raw/',
          expiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteOldFailedFiles',
          prefix: 'failed/',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // DynamoDB Table for metadata
    const metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `etl-metadata-${environmentSuffix}`,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fileName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true, // Change from false to true
    });

    // Global Secondary Index on timestamp
    metadataTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // CloudWatch Log Groups
    const validatorLogGroup = new logs.LogGroup(this, 'ValidatorLogGroup', {
      logGroupName: `/aws/lambda/validator-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const transformerLogGroup = new logs.LogGroup(this, 'TransformerLogGroup', {
      logGroupName: `/aws/lambda/transformer-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const enricherLogGroup = new logs.LogGroup(this, 'EnricherLogGroup', {
      logGroupName: `/aws/lambda/enricher-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const qualityCheckLogGroup = new logs.LogGroup(
      this,
      'QualityCheckLogGroup',
      {
        logGroupName: `/aws/lambda/quality-check-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const apiHandlerLogGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/aws/lambda/api-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const triggerHandlerLogGroup = new logs.LogGroup(
      this,
      'TriggerHandlerLogGroup',
      {
        logGroupName: `/aws/lambda/trigger-handler-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda Functions
    const validatorFunction = new lambda.Function(this, 'ValidatorFunction', {
      functionName: `validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/validator'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: validatorLogGroup,
      deadLetterQueue: validatorDLQ,
    });

    const transformerFunction = new lambda.Function(
      this,
      'TransformerFunction',
      {
        functionName: `transformer-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/transformer'),
        timeout: cdk.Duration.minutes(10),
        memorySize: 1024,
        environment: {
          METADATA_TABLE: metadataTable.tableName,
          DATA_BUCKET: dataBucket.bucketName,
        },
        logGroup: transformerLogGroup,
        deadLetterQueue: transformerDLQ,
      }
    );

    const enricherFunction = new lambda.Function(this, 'EnricherFunction', {
      functionName: `enricher-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/enricher'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: enricherLogGroup,
      deadLetterQueue: enricherDLQ,
    });

    const qualityCheckFunction = new lambda.Function(
      this,
      'QualityCheckFunction',
      {
        functionName: `quality-check-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/quality-check'),
        timeout: cdk.Duration.minutes(15),
        memorySize: 1024,
        environment: {
          METADATA_TABLE: metadataTable.tableName,
          DATA_BUCKET: dataBucket.bucketName,
        },
        logGroup: qualityCheckLogGroup,
        deadLetterQueue: qualityCheckDLQ,
      }
    );

    // Grant permissions
    dataBucket.grantReadWrite(validatorFunction);
    dataBucket.grantReadWrite(transformerFunction);
    dataBucket.grantReadWrite(enricherFunction);
    dataBucket.grantRead(qualityCheckFunction);

    metadataTable.grantReadWriteData(validatorFunction);
    metadataTable.grantReadWriteData(transformerFunction);
    metadataTable.grantReadWriteData(enricherFunction);
    metadataTable.grantReadData(qualityCheckFunction);

    // Step Functions State Machine
    const validateTask = new tasks.LambdaInvoke(this, 'ValidateTask', {
      lambdaFunction: validatorFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const transformTask = new tasks.LambdaInvoke(this, 'TransformTask', {
      lambdaFunction: transformerFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const enrichTask = new tasks.LambdaInvoke(this, 'EnrichTask', {
      lambdaFunction: enricherFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const handleValidationError = new sfn.Fail(this, 'ValidationFailed', {
      cause: 'CSV validation failed',
      error: 'ValidationError',
    });

    const handleTransformError = new sfn.Fail(this, 'TransformationFailed', {
      cause: 'Data transformation failed',
      error: 'TransformError',
    });

    const handleEnrichmentError = new sfn.Fail(this, 'EnrichmentFailed', {
      cause: 'Data enrichment failed',
      error: 'EnrichmentError',
    });

    const successState = new sfn.Succeed(this, 'ProcessingSucceeded');

    // Define workflow
    const definition = validateTask
      .addCatch(handleValidationError, {
        errors: ['States.ALL'],
        resultPath: '$.error',
      })
      .next(
        transformTask.addCatch(handleTransformError, {
          errors: ['States.ALL'],
          resultPath: '$.error',
        })
      )
      .next(
        enrichTask.addCatch(handleEnrichmentError, {
          errors: ['States.ALL'],
          resultPath: '$.error',
        })
      )
      .next(successState);

    const stateMachine = new sfn.StateMachine(this, 'ETLStateMachine', {
      stateMachineName: `etl-state-machine-${environmentSuffix}`,
      definition,
      stateMachineType: sfn.StateMachineType.EXPRESS,
      // Express workflows have a maximum execution duration of 5 minutes
      // The timeout here represents the maximum execution time for a single execution
      timeout: cdk.Duration.minutes(5), // Changed from 30 to 5 for Express workflows
      tracingEnabled: true,
    });

    // Lambda to trigger Step Functions from S3 events
    const triggerFunction = new lambda.Function(this, 'TriggerFunction', {
      functionName: `trigger-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/trigger'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        METADATA_TABLE: metadataTable.tableName,
        STATE_MACHINE_TYPE: 'EXPRESS', // Add this to help Lambda functions know it's Express
      },
      logGroup: triggerHandlerLogGroup,
    });

    // Grant both StartExecution and StartSyncExecution permissions for Express workflows
    stateMachine.grantStartExecution(triggerFunction);
    // For Express workflows, also grant StartSyncExecution permission explicitly
    triggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['states:StartSyncExecution'],
        resources: [stateMachine.stateMachineArn],
      })
    );
    metadataTable.grantReadWriteData(triggerFunction);

    // S3 event notification
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(triggerFunction),
      { prefix: 'raw/', suffix: '.csv' }
    );

    // API Gateway Lambda Handler
    const apiHandlerFunction = new lambda.Function(this, 'ApiHandlerFunction', {
      functionName: `api-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/api-handler'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        STATE_MACHINE_TYPE: 'EXPRESS', // Add this to help Lambda functions know it's Express
      },
      logGroup: apiHandlerLogGroup,
    });

    metadataTable.grantReadData(apiHandlerFunction);
    stateMachine.grantStartExecution(apiHandlerFunction);
    // For Express workflows, also grant StartSyncExecution permission explicitly
    apiHandlerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['states:StartSyncExecution'],
        resources: [stateMachine.stateMachineArn],
      })
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'ETLApi', {
      restApiName: `etl-api-${environmentSuffix}`,
      description: 'API for ETL pipeline status and control',
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
      },
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiHandlerFunction);

    // GET /status/{jobId} - Query processing status
    const statusResource = api.root.addResource('status');
    const jobResource = statusResource.addResource('{jobId}');
    jobResource.addMethod('GET', apiIntegration, {
      methodResponses: [{ statusCode: '200' }],
    });

    // POST /trigger - Manually trigger workflow
    const triggerResource = api.root.addResource('trigger');
    triggerResource.addMethod('POST', apiIntegration, {
      methodResponses: [{ statusCode: '200' }],
    });

    // EventBridge scheduled rule for daily quality checks
    const qualityCheckRule = new events.Rule(this, 'QualityCheckRule', {
      ruleName: `quality-check-rule-${environmentSuffix}`,
      description: 'Trigger daily data quality checks at 2 AM UTC',
      schedule: events.Schedule.cron({ minute: '0', hour: '2' }),
    });

    qualityCheckRule.addTarget(
      new targets.LambdaFunction(qualityCheckFunction, {
        retryAttempts: 2,
        deadLetterQueue: qualityCheckDLQ,
      })
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ETLDashboard', {
      dashboardName: `etl-dashboard-${environmentSuffix}`,
    });

    // Custom metrics
    const processingLatencyMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'ProcessingLatency',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const successRateMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'SuccessRate',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const failureRateMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'FailureRate',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [stateMachine.metricSucceeded(), stateMachine.metricFailed()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          validatorFunction.metricInvocations(),
          transformerFunction.metricInvocations(),
          enricherFunction.metricInvocations(),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Processing Latency',
        left: [processingLatencyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Success vs Failure Rate',
        left: [successRateMetric, failureRateMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          validatorFunction.metricErrors(),
          transformerFunction.metricErrors(),
          enricherFunction.metricErrors(),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Message Count',
        left: [
          validatorDLQ.metricApproximateNumberOfMessagesVisible(),
          transformerDLQ.metricApproximateNumberOfMessagesVisible(),
          enricherDLQ.metricApproximateNumberOfMessagesVisible(),
        ],
        width: 12,
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ValidatorErrorAlarm', {
      metric: validatorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Validator function has high error rate',
      alarmName: `validator-errors-${environmentSuffix}`,
    });

    new cloudwatch.Alarm(this, 'TransformerErrorAlarm', {
      metric: transformerFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Transformer function has high error rate',
      alarmName: `transformer-errors-${environmentSuffix}`,
    });

    new cloudwatch.Alarm(this, 'StateMachineFailedAlarm', {
      metric: stateMachine.metricFailed(),
      threshold: 3,
      evaluationPeriods: 1,
      alarmDescription: 'Step Functions executions are failing',
      alarmName: `state-machine-failures-${environmentSuffix}`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for data storage',
    });

    new cdk.CfnOutput(this, 'MetadataTableName', {
      value: metadataTable.tableName,
      description: 'DynamoDB table for metadata',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
