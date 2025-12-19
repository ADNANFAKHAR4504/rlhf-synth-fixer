import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

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

    // Create DynamoDB table for storing application data
    const dynamoTable = new dynamodb.Table(
      this,
      `AppDataTable-${environmentSuffix}`,
      {
        tableName: `app-data-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environments
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );
    cdk.Tags.of(dynamoTable).add('iac-rlhf-amazon', 'true');

    // Create S3 bucket for logging API requests - with restricted access
    const logBucket = new s3.Bucket(this, `ApiLogBucket-${environmentSuffix}`, {
      bucketName: `api-logs-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For dev environments
    });
    cdk.Tags.of(logBucket).add('iac-rlhf-amazon', 'true');

    // Create Lambda function with TypeScript runtime using NodejsFunction for auto-bundling
    const apiLambda = new NodejsFunction(
      this,
      `ApiLambda-${environmentSuffix}`,
      {
        functionName: `api-lambda-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/api-handler.js',
        handler: 'handler',
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        environment: {
          DYNAMODB_TABLE_NAME: dynamoTable.tableName,
          S3_BUCKET_NAME: logBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
          DB_HOST: `db-host-${environmentSuffix}.example.com`, // Database connection details
          DB_PORT: '5432',
          DB_NAME: `app_db_${environmentSuffix}`,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2022',
          format: OutputFormat.CJS,
          externalModules: [],
        },
      }
    );
    cdk.Tags.of(apiLambda).add('iac-rlhf-amazon', 'true');

    // Grant Lambda permissions to access DynamoDB table
    dynamoTable.grantReadWriteData(apiLambda);

    // Grant Lambda exclusive access to S3 bucket for logging
    logBucket.grantReadWrite(apiLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(
      this,
      `ApiGateway-${environmentSuffix}`,
      {
        restApiName: `serverless-api-${environmentSuffix}`,
        description: `Serverless API Gateway for ${environmentSuffix} environment`,
        deployOptions: {
          stageName: environmentSuffix,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          throttlingBurstLimit: 100,
          throttlingRateLimit: 50,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: ['Content-Type', 'Authorization'],
        },
      }
    );
    cdk.Tags.of(api).add('iac-rlhf-amazon', 'true');

    // Add Lambda integration to API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // Add API methods
    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration);
    apiResource.addMethod('POST', lambdaIntegration);
    apiResource.addMethod('PUT', lambdaIntegration);
    apiResource.addMethod('DELETE', lambdaIntegration);

    // Create SNS topic for CloudWatch alarms
    const alarmTopic = new sns.Topic(
      this,
      `LambdaAlarmTopic-${environmentSuffix}`,
      {
        topicName: `lambda-alarms-${environmentSuffix}`,
        displayName: `Lambda Alarms for ${environmentSuffix}`,
      }
    );
    cdk.Tags.of(alarmTopic).add('iac-rlhf-amazon', 'true');

    // Create CloudWatch alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-error-rate-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda error rate is too high in ${environmentSuffix}`,
        metric: apiLambda.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Create CloudWatch alarm for Lambda throttles
    const throttleAlarm = new cloudwatch.Alarm(
      this,
      `LambdaThrottleAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-throttle-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda is throttled in ${environmentSuffix}`,
        metric: apiLambda.metricThrottles({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    throttleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Create CloudWatch alarm for Lambda duration
    const durationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-duration-${environmentSuffix}`,
        alarmDescription: `Alarm when Lambda execution takes too long in ${environmentSuffix}`,
        metric: apiLambda.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 8000, // 8 seconds (80% of timeout)
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Output important values
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiLambda.functionName,
      description: 'Lambda Function Name',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DynamoTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: logBucket.bucketName,
      description: 'S3 Log Bucket Name',
      exportName: `LogBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Deployment Region',
    });
  }
}
