import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaConstructProps {
  /**
   * Prefix for resource names
   */
  prefix: string;

  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;

  /**
   * S3 bucket for data storage
   */
  dataBucket: s3.Bucket;

  /**
   * DynamoDB table for metadata
   */
  metadataTable: dynamodb.Table;

  /**
   * KMS key for encryption
   */
  encryptionKey: kms.Key;
}

export class LambdaConstruct extends Construct {
  public readonly dataProcessor: lambda.Function;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { prefix, environment, dataBucket, metadataTable, encryptionKey } =
      props;

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${prefix}-alarms-${environment}`,
      masterKey: encryptionKey,
    });

    // Create IAM role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${prefix} Lambda functions`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions for fault injection
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'fis:InjectApiInternalError',
          'fis:InjectApiThrottleError',
          'fis:InjectApiUnavailableError',
        ],
        resources: ['*'],
      })
    );

    // Create log group for Lambda function
    const logGroup = new logs.LogGroup(this, 'DataProcessorLogGroup', {
      logGroupName: `/aws/lambda/${prefix}-data-processor-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    this.dataProcessor = new lambda.Function(this, 'DataProcessor', {
      functionName: `${prefix}-data-processor-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'data-processor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      timeout: Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        TABLE_NAME: metadataTable.tableName,
        ENVIRONMENT: environment,
        LOG_LEVEL: environment === 'prod' ? 'info' : 'debug',
        POWERTOOLS_SERVICE_NAME: `${prefix}-data-processor`,
        POWERTOOLS_METRICS_NAMESPACE: prefix,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: logGroup,
      // reservedConcurrentExecutions removed to avoid account limits
      environmentEncryption: encryptionKey,
    });

    // Grant permissions
    dataBucket.grantReadWrite(this.dataProcessor);
    metadataTable.grantReadWriteData(this.dataProcessor);
    encryptionKey.grantEncryptDecrypt(this.dataProcessor);

    // Lambda Insights layer removed due to permission issues
    // AWS Lambda Powertools already provides excellent observability

    // Create CloudWatch alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
      alarmName: `${prefix}-lambda-errors-${environment}`,
      metric: this.dataProcessor.metricErrors({
        period: Duration.minutes(5),
        statistic: 'sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'ThrottleAlarm', {
      alarmName: `${prefix}-lambda-throttles-${environment}`,
      metric: this.dataProcessor.metricThrottles({
        period: Duration.minutes(5),
        statistic: 'sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'DurationAlarm', {
      alarmName: `${prefix}-lambda-duration-${environment}`,
      metric: this.dataProcessor.metricDuration({
        period: Duration.minutes(5),
        statistic: 'average',
      }),
      threshold: 25000, // 25 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    [errorAlarm, throttleAlarm, durationAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cwactions.SnsAction(this.alarmTopic));
    });

    // Create Application Signals dashboard
    new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      dashboardName: `${prefix}-application-signals-${environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [this.dataProcessor.metricInvocations()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [this.dataProcessor.metricErrors()],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: [this.dataProcessor.metricDuration()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Throttles',
            left: [this.dataProcessor.metricThrottles()],
            width: 12,
          }),
        ],
      ],
    });
  }
}
