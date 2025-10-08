import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // DynamoDB Table for votes with point-in-time recovery
    const votesTable = new dynamodb.Table(this, 'VotesTable', {
      tableName: `polling-votes-${environmentSuffix}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pollId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table for aggregated results
    const resultsTable = new dynamodb.Table(this, 'ResultsTable', {
      tableName: `polling-results-${environmentSuffix}`,
      partitionKey: { name: 'pollId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for result snapshots
    const snapshotBucket = new s3.Bucket(this, 'SnapshotBucket', {
      bucketName: `polling-snapshots-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function for vote processing
    const voteProcessorFunction = new lambda.Function(this, 'VoteProcessor', {
      functionName: `vote-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/auto-response')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        VOTES_TABLE_NAME: votesTable.tableName,
        ENVIRONMENT: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to vote processor
    votesTable.grantReadWriteData(voteProcessorFunction);

    // Lambda function for results aggregation
    const resultsAggregatorFunction = new lambda.Function(
      this,
      'ResultsAggregator',
      {
        functionName: `results-aggregator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../lambda/sentiment')
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        environment: {
          RESULTS_TABLE_NAME: resultsTable.tableName,
          SNAPSHOT_BUCKET_NAME: snapshotBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to results aggregator
    resultsTable.grantReadWriteData(resultsAggregatorFunction);
    snapshotBucket.grantWrite(resultsAggregatorFunction);

    // Add DynamoDB Stream as event source
    resultsAggregatorFunction.addEventSource(
      new DynamoEventSource(votesTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        retryAttempts: 3,
        bisectBatchOnError: true,
      })
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'PollingAPI', {
      restApiName: `polling-api-${environmentSuffix}`,
      description: 'API for submitting and retrieving poll votes',
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Gateway resources and methods
    const votesResource = api.root.addResource('votes');
    const voteIntegration = new apigateway.LambdaIntegration(
      voteProcessorFunction
    );

    const postVoteMethod = votesResource.addMethod('POST', voteIntegration, {
      apiKeyRequired: true,
    });

    const getVoteMethod = votesResource.addMethod('GET', voteIntegration, {
      apiKeyRequired: true,
    });

    // Results endpoint
    const resultsResource = api.root.addResource('results');
    const resultsIntegration = new apigateway.LambdaIntegration(
      resultsAggregatorFunction
    );

    const getResultsMethod = resultsResource.addMethod(
      'GET',
      resultsIntegration,
      {
        apiKeyRequired: true,
      }
    );

    // Usage Plan with rate limiting
    const usagePlan = api.addUsagePlan('PollingUsagePlan', {
      name: `polling-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for polling API with rate limiting',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: postVoteMethod,
          throttle: {
            rateLimit: 10,
            burstLimit: 20,
          },
        },
        {
          method: getVoteMethod,
          throttle: {
            rateLimit: 50,
            burstLimit: 100,
          },
        },
      ],
    });

    // API Keys
    const apiKey = api.addApiKey('PollingAPIKey', {
      apiKeyName: `polling-api-key-${environmentSuffix}`,
      description: 'API key for polling system',
    });

    usagePlan.addApiKey(apiKey);

    // CloudWatch Alarms
    const voteProcessorErrors = new cloudwatch.Alarm(
      this,
      'VoteProcessorErrors',
      {
        alarmName: `vote-processor-errors-${environmentSuffix}`,
        metric: voteProcessorFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const apiGateway4xxErrors = new cloudwatch.Alarm(
      this,
      'APIGateway4xxErrors',
      {
        alarmName: `api-4xx-errors-${environmentSuffix}`,
        metric: api.metricClientError({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 50,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const resultsAggregatorErrors = new cloudwatch.Alarm(
      this,
      'ResultsAggregatorErrors',
      {
        alarmName: `results-aggregator-errors-${environmentSuffix}`,
        metric: resultsAggregatorFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Suppress unused variable warnings - alarms are created for monitoring
    void getResultsMethod;
    void voteProcessorErrors;
    void apiGateway4xxErrors;
    void resultsAggregatorErrors;

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'Polling API endpoint',
      exportName: `polling-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'APIKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `polling-api-key-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VotesTableName', {
      value: votesTable.tableName,
      description: 'DynamoDB votes table name',
      exportName: `votes-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ResultsTableName', {
      value: resultsTable.tableName,
      description: 'DynamoDB results table name',
      exportName: `results-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SnapshotBucketName', {
      value: snapshotBucket.bucketName,
      description: 'S3 bucket for result snapshots',
      exportName: `snapshot-bucket-${environmentSuffix}`,
    });
  }
}
