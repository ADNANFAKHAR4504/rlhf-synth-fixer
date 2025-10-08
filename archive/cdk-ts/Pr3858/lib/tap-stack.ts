import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);
    const environmentSuffix = props?.environmentSuffix;

    // DynamoDB table for job tracking
    const jobTable = new dynamodb.Table(this, 'JobTable', {
      tableName: `document-jobs-${environmentSuffix}`,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Add GSI for status queries
    jobTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // SNS topic for completion notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `document-conversion-notifications-${environmentSuffix}`,
      displayName: 'Document Conversion Notifications',
    });

    // Dead letter queue for failed messages
    const dlq = new sqs.Queue(this, 'ProcessingDLQ', {
      queueName: `document-processing-dlq-${environmentSuffix}`,
      retentionPeriod: Duration.days(14),
    });

    // SQS queue for processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `document-processing-queue-${environmentSuffix}`,
      visibilityTimeout: Duration.minutes(20),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // S3 bucket for document uploads
    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `document-uploads-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],
    });

    // S3 bucket for converted documents
    const outputBucket = new s3.Bucket(this, 'OutputBucket', {
      bucketName: `document-output-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function for document conversion
    const conversionFunction = new lambda.Function(this, 'ConversionFunction', {
      functionName: `document-converter-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/converter'),
      timeout: Duration.minutes(15),
      memorySize: 3008,
      reservedConcurrentExecutions: 100,
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
        OUTPUT_BUCKET: outputBucket.bucketName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function to initialize job tracking
    const initJobFunction = new lambda.Function(this, 'InitJobFunction', {
      functionName: `init-job-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/init-job'),
      timeout: Duration.seconds(30),
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function for validation
    const validationFunction = new lambda.Function(this, 'ValidationFunction', {
      functionName: `document-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/validator'),
      timeout: Duration.seconds(30),
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda function to send notifications
    const notifyFunction = new lambda.Function(this, 'NotifyFunction', {
      functionName: `notify-completion-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/notifier'),
      timeout: Duration.seconds(30),
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions
    jobTable.grantReadWriteData(conversionFunction);
    jobTable.grantReadWriteData(initJobFunction);
    jobTable.grantReadWriteData(validationFunction);
    jobTable.grantReadWriteData(notifyFunction);
    documentBucket.grantRead(conversionFunction);
    documentBucket.grantRead(validationFunction);
    outputBucket.grantWrite(conversionFunction);
    notificationTopic.grantPublish(conversionFunction);
    notificationTopic.grantPublish(notifyFunction);

    // Step Functions state machine definition
    const initJob = new tasks.LambdaInvoke(this, 'Initialize Job', {
      lambdaFunction: initJobFunction,
      outputPath: '$.Payload',
    });

    const validateDocument = new tasks.LambdaInvoke(this, 'Validate Document', {
      lambdaFunction: validationFunction,
      outputPath: '$.Payload',
    });

    const convertDocument = new tasks.LambdaInvoke(this, 'Convert Document', {
      lambdaFunction: conversionFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const notifySuccess = new tasks.LambdaInvoke(this, 'Notify Success', {
      lambdaFunction: notifyFunction,
      payload: sfn.TaskInput.fromObject({
        status: 'SUCCESS',
        'jobId.$': '$.jobId',
        'outputKey.$': '$.outputKey',
      }),
    });

    const notifyConversionFailure = new tasks.LambdaInvoke(
      this,
      'Notify Conversion Failure',
      {
        lambdaFunction: notifyFunction,
        payload: sfn.TaskInput.fromObject({
          status: 'FAILED',
          'jobId.$': '$.jobId',
          'error.$': '$.error',
        }),
      }
    );

    const notifyValidationFailure = new tasks.LambdaInvoke(
      this,
      'Notify Validation Failure',
      {
        lambdaFunction: notifyFunction,
        payload: sfn.TaskInput.fromObject({
          status: 'FAILED',
          'jobId.$': '$.jobId',
          'error.$': '$.error',
        }),
      }
    );

    const successState = new sfn.Succeed(this, 'Conversion Complete');
    const conversionFailState = new sfn.Fail(this, 'Conversion Failed', {
      cause: 'Document conversion failed',
      error: 'ConversionError',
    });

    const validationFailState = new sfn.Fail(this, 'Validation Failed', {
      cause: 'Document validation failed',
      error: 'ValidationError',
    });

    // Define parallel processing branches
    const parallelProcessing = new sfn.Parallel(this, 'Parallel Processing', {
      resultPath: '$.parallelResults',
    });

    parallelProcessing.branch(
      convertDocument
        .addRetry({
          errors: ['States.TaskFailed'],
          interval: Duration.seconds(2),
          maxAttempts: 3,
          backoffRate: 2,
        })
        .addCatch(notifyConversionFailure.next(conversionFailState), {
          errors: ['States.ALL'],
          resultPath: '$.error',
        })
    );

    // Define workflow
    const definition = initJob
      .next(validateDocument)
      .next(
        new sfn.Choice(this, 'Is Valid?')
          .when(
            sfn.Condition.booleanEquals('$.valid', true),
            parallelProcessing.next(notifySuccess).next(successState)
          )
          .otherwise(notifyValidationFailure.next(validationFailState))
      );

    // Create state machine
    const stateMachine = new sfn.StateMachine(this, 'ConversionStateMachine', {
      stateMachineName: `document-conversion-${environmentSuffix}`,
      definition,
      timeout: Duration.minutes(20),
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: `/aws/stepfunctions/document-conversion-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
      },
      tracingEnabled: true,
    });

    // Lambda function to trigger state machine
    const orchestratorFunction = new lambda.Function(
      this,
      'OrchestratorFunction',
      {
        functionName: `document-orchestrator-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/orchestrator'),
        timeout: Duration.seconds(30),
        environment: {
          STATE_MACHINE_ARN: stateMachine.stateMachineArn,
          PROCESSING_QUEUE_URL: processingQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    stateMachine.grantStartExecution(orchestratorFunction);
    processingQueue.grantSendMessages(orchestratorFunction);

    // Add S3 event notification to trigger orchestrator
    documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(orchestratorFunction),
      { suffix: '.doc' }
    );

    documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(orchestratorFunction),
      { suffix: '.docx' }
    );

    documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(orchestratorFunction),
      { suffix: '.txt' }
    );

    documentBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(orchestratorFunction),
      { suffix: '.rtf' }
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ConversionDashboard', {
      dashboardName: `document-conversion-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          conversionFunction.metricInvocations(),
          orchestratorFunction.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          conversionFunction.metricErrors(),
          orchestratorFunction.metricErrors(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [conversionFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [
          stateMachine.metricStarted(),
          stateMachine.metricSucceeded(),
          stateMachine.metricFailed(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Depth',
        left: [processingQueue.metricApproximateNumberOfMessagesVisible()],
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Messages',
        left: [dlq.metricApproximateNumberOfMessagesVisible()],
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ConversionErrorAlarm', {
      alarmName: `document-conversion-errors-${environmentSuffix}`,
      metric: conversionFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'DLQAlarm', {
      alarmName: `document-dlq-messages-${environmentSuffix}`,
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 bucket for document uploads',
    });

    new cdk.CfnOutput(this, 'OutputBucketName', {
      value: outputBucket.bucketName,
      description: 'S3 bucket for converted documents',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'JobTableName', {
      value: jobTable.tableName,
      description: 'DynamoDB table for job tracking',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic for notifications',
    });
  }
}
