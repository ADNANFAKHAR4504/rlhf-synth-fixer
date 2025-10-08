import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

interface RecommendationEngineStackProps {
  environmentSuffix: string;
}

export class RecommendationEngineStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: RecommendationEngineStackProps
  ) {
    super(scope, id);

    const stackName = `recommendation-${props.environmentSuffix}`;

    // Kinesis Data Stream for event ingestion
    const eventStream = new kinesis.Stream(this, 'EventStream', {
      streamName: `${stackName}-user-events`,
      streamMode: kinesis.StreamMode.PROVISIONED,
      shardCount: 4,
      retentionPeriod: cdk.Duration.hours(24),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for user profiles with auto-scaling
    const userProfilesTable = new dynamodb.Table(this, 'UserProfiles', {
      tableName: `${stackName}-user-profiles`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto-scaling for DynamoDB
    const readScaling = userProfilesTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = userProfilesTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // S3 bucket for model artifacts
    const modelArtifactsBucket = new s3.Bucket(this, 'ModelArtifacts', {
      bucketName: `${stackName}-model-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Note: SageMaker endpoint creation would require actual model artifacts in S3
    // For this infrastructure setup, we'll create placeholder outputs instead
    // In production, you would upload model.tar.gz to S3 before deploying
    const sagemakerEndpointName = `${stackName}-endpoint`;

    // Lambda function for real-time stream processing
    const streamProcessorFunction = new lambda.Function(
      this,
      'StreamProcessor',
      {
        functionName: `${stackName}-stream-processor`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda', 'stream-processor')
        ),
        timeout: cdk.Duration.seconds(60),
        reservedConcurrentExecutions: 50,
        environment: {
          TABLE_NAME: userProfilesTable.tableName,
          ENDPOINT_NAME: sagemakerEndpointName,
        },
        logRetention: logs.RetentionDays.ONE_DAY,
      }
    );

    // Grant permissions to Lambda
    userProfilesTable.grantWriteData(streamProcessorFunction);
    streamProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:endpoint/${sagemakerEndpointName}`,
        ],
      })
    );

    // Add Kinesis as event source for Lambda
    streamProcessorFunction.addEventSource(
      new KinesisEventSource(eventStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        retryAttempts: 3,
      })
    );

    // Lambda function for batch processing
    const batchProcessorFunction = new lambda.Function(this, 'BatchProcessor', {
      functionName: `${stackName}-batch-processor`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, 'lambda', 'batch-processor')
      ),
      timeout: cdk.Duration.minutes(15),
      environment: {
        TABLE_NAME: userProfilesTable.tableName,
        BUCKET_NAME: modelArtifactsBucket.bucketName,
        ENDPOINT_NAME: sagemakerEndpointName,
      },
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    userProfilesTable.grantReadData(batchProcessorFunction);
    modelArtifactsBucket.grantReadWrite(batchProcessorFunction);
    batchProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:endpoint/${sagemakerEndpointName}`,
        ],
      })
    );

    // EventBridge rule for batch processing (runs daily at 2 AM)
    const batchProcessingRule = new events.Rule(this, 'BatchProcessingRule', {
      ruleName: `${stackName}-batch-processing`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
      }),
    });

    batchProcessingRule.addTarget(
      new targets.LambdaFunction(batchProcessorFunction)
    );

    // CloudWatch alarms for monitoring
    new cloudwatch.Alarm(this, 'LambdaLatencyAlarm', {
      alarmName: `${stackName}-lambda-latency`,
      metric: streamProcessorFunction.metricDuration({
        statistic: 'Average',
      }),
      threshold: 30000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${stackName}-lambda-errors`,
      metric: streamProcessorFunction.metricErrors({
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Kinesis monitoring
    new cloudwatch.Alarm(this, 'KinesisIteratorAgeAlarm', {
      alarmName: `${stackName}-kinesis-iterator-age`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Kinesis',
        metricName: 'GetRecords.IteratorAgeMilliseconds',
        dimensionsMap: {
          StreamName: eventStream.streamName,
        },
        statistic: 'Maximum',
      }),
      threshold: 60000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // DynamoDB monitoring
    new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      alarmName: `${stackName}-dynamo-read-throttle`,
      metric: userProfilesTable.metricUserErrors({
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Outputs
    new cdk.CfnOutput(this, 'StreamName', {
      value: eventStream.streamName,
      description: 'Kinesis Stream Name',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: userProfilesTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: modelArtifactsBucket.bucketName,
      description: 'S3 Bucket Name for Model Artifacts',
    });

    new cdk.CfnOutput(this, 'EndpointName', {
      value: sagemakerEndpointName,
      description: 'SageMaker Endpoint Name (placeholder)',
    });

    new cdk.CfnOutput(this, 'StreamProcessorFunctionName', {
      value: streamProcessorFunction.functionName,
      description: 'Stream Processor Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'BatchProcessorFunctionName', {
      value: batchProcessorFunction.functionName,
      description: 'Batch Processor Lambda Function Name',
    });
  }
}
