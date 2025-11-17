import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  tradingPatternsTable: dynamodb.Table;
  approvalTrackingTable: dynamodb.Table;
  alertQueue: sqs.Queue;
  pendingApprovalsQueue: sqs.Queue;
  tradingAlertsTopic: sns.Topic;
  alertApprovalTopic: sns.Topic;
  marketDataStream: kinesis.Stream;
}

export class ComputeStack extends cdk.Stack {
  public readonly patternDetectorFunction: lambda.Function;
  public readonly alertProcessorFunction: lambda.Function;
  public readonly thresholdCheckerFunction: lambda.Function;
  public readonly kinesisConsumerFunction: lambda.Function;
  public readonly approvalProcessorFunction: lambda.Function;
  public readonly liveAlias: lambda.Alias;
  public readonly deploymentGroup: codedeploy.LambdaDeploymentGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      tradingPatternsTable,
      approvalTrackingTable,
      alertQueue,
      pendingApprovalsQueue,
      tradingAlertsTopic,
      alertApprovalTopic,
      marketDataStream,
    } = props;

    // Create shared Lambda Layer
    const sharedLayer = new lambda.LayerVersion(
      this,
      'SharedDependenciesLayer',
      {
        code: lambda.Code.fromAsset(
          path.join(__dirname, './lambda-packages/shared-layer')
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
        description: 'Shared dependencies for pattern detection functions',
        layerVersionName: `shared-dependencies-${environmentSuffix}`,
        compatibleArchitectures: [lambda.Architecture.ARM_64],
      }
    );

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      tracing: lambda.Tracing.ACTIVE,
      layers: [sharedLayer],
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        ENVIRONMENT_SUFFIX: environmentSuffix,
        TRADING_PATTERNS_TABLE: tradingPatternsTable.tableName,
        APPROVAL_TRACKING_TABLE: approvalTrackingTable.tableName,
        ALERT_QUEUE_URL: alertQueue.queueUrl,
        PENDING_APPROVALS_QUEUE_URL: pendingApprovalsQueue.queueUrl,
        TRADING_ALERTS_TOPIC_ARN: tradingAlertsTopic.topicArn,
        ALERT_APPROVAL_TOPIC_ARN: alertApprovalTopic.topicArn,
      },
    };

    // 1. PatternDetector Lambda
    this.patternDetectorFunction = new lambda.Function(
      this,
      'PatternDetector',
      {
        ...commonLambdaProps,
        functionName: `PatternDetector-${environmentSuffix}`,
        code: lambda.Code.fromAsset(
          path.join(__dirname, './lambda-packages/pattern-detector')
        ),
        handler: 'index.handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        reservedConcurrentExecutions: 50,
        environment: {
          ...commonLambdaProps.environment,
          POWERTOOLS_SERVICE_NAME: 'PatternDetector',
          POWERTOOLS_METRICS_NAMESPACE: 'StockPatternDetection',
        },
      }
    );

    // Grant permissions
    tradingPatternsTable.grantReadWriteData(this.patternDetectorFunction);
    alertQueue.grantSendMessages(this.patternDetectorFunction);

    // 2. AlertProcessor Lambda with DLQ
    const alertProcessorDLQ = new sqs.Queue(this, 'AlertProcessorDLQ', {
      queueName: `AlertProcessorDLQ-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    this.alertProcessorFunction = new lambda.Function(this, 'AlertProcessor', {
      ...commonLambdaProps,
      functionName: `AlertProcessor-${environmentSuffix}`,
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambda-packages/alert-processor')
      ),
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      deadLetterQueue: alertProcessorDLQ,
      deadLetterQueueEnabled: true,
      environment: {
        ...commonLambdaProps.environment,
        POWERTOOLS_SERVICE_NAME: 'AlertProcessor',
        POWERTOOLS_METRICS_NAMESPACE: 'StockPatternDetection',
      },
    });

    // SQS event source with batch size 10
    this.alertProcessorFunction.addEventSource(
      new cdk.aws_lambda_event_sources.SqsEventSource(alertQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    tradingAlertsTopic.grantPublish(this.alertProcessorFunction);
    alertApprovalTopic.grantPublish(this.alertProcessorFunction);
    tradingPatternsTable.grantReadData(this.alertProcessorFunction);

    // 3. ThresholdChecker Lambda
    this.thresholdCheckerFunction = new lambda.Function(
      this,
      'ThresholdChecker',
      {
        ...commonLambdaProps,
        functionName: `ThresholdChecker-${environmentSuffix}`,
        code: lambda.Code.fromAsset(
          path.join(__dirname, './lambda-packages/threshold-checker')
        ),
        handler: 'index.handler',
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          ...commonLambdaProps.environment,
          ERROR_THRESHOLD: '0.01',
          PATTERN_CONFIDENCE_THRESHOLD: '0.85',
          POWERTOOLS_SERVICE_NAME: 'ThresholdChecker',
          POWERTOOLS_METRICS_NAMESPACE: 'StockPatternDetection',
        },
      }
    );

    tradingPatternsTable.grantReadData(this.thresholdCheckerFunction);
    alertQueue.grantSendMessages(this.thresholdCheckerFunction);

    // 4. KinesisConsumer Lambda
    this.kinesisConsumerFunction = new lambda.Function(
      this,
      'KinesisConsumer',
      {
        ...commonLambdaProps,
        functionName: `KinesisConsumer-${environmentSuffix}`,
        code: lambda.Code.fromAsset(
          path.join(__dirname, './lambda-packages/kinesis-consumer')
        ),
        handler: 'index.handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        environment: {
          ...commonLambdaProps.environment,
          POWERTOOLS_SERVICE_NAME: 'KinesisConsumer',
          POWERTOOLS_METRICS_NAMESPACE: 'StockPatternDetection',
        },
      }
    );

    // Kinesis event source
    this.kinesisConsumerFunction.addEventSource(
      new cdk.aws_lambda_event_sources.KinesisEventSource(marketDataStream, {
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        bisectBatchOnError: true,
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    tradingPatternsTable.grantWriteData(this.kinesisConsumerFunction);
    alertQueue.grantSendMessages(this.kinesisConsumerFunction);

    // 5. ApprovalProcessor Lambda
    this.approvalProcessorFunction = new lambda.Function(
      this,
      'ApprovalProcessor',
      {
        ...commonLambdaProps,
        functionName: `ApprovalProcessor-${environmentSuffix}`,
        code: lambda.Code.fromAsset(
          path.join(__dirname, './lambda-packages/approval-processor')
        ),
        handler: 'index.handler',
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          ...commonLambdaProps.environment,
          APPROVAL_EXPIRATION_HOURS: '1',
          POWERTOOLS_SERVICE_NAME: 'ApprovalProcessor',
          POWERTOOLS_METRICS_NAMESPACE: 'StockPatternDetection',
        },
      }
    );

    approvalTrackingTable.grantReadWriteData(this.approvalProcessorFunction);
    tradingAlertsTopic.grantPublish(this.approvalProcessorFunction);
    pendingApprovalsQueue.grantConsumeMessages(this.approvalProcessorFunction);

    // Create CloudWatch Alarms for Lambda error rates
    const alarmFunctions = [
      this.patternDetectorFunction,
      this.alertProcessorFunction,
      this.thresholdCheckerFunction,
      this.kinesisConsumerFunction,
      this.approvalProcessorFunction,
    ];

    alarmFunctions.forEach(func => {
      new cdk.aws_cloudwatch.Alarm(this, `${func.node.id}ErrorAlarm`, {
        alarmName: `${func.functionName}-errors-${environmentSuffix}`,
        metric: func.metricErrors({
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.01, // 1% error rate
        evaluationPeriods: 2,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    });

    // Create Lambda alias for canary deployment
    const version = this.patternDetectorFunction.currentVersion;
    this.liveAlias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version: version,
      // provisionedConcurrentExecutions: 10, // Commented out - can cause deployment failures on initial deploy
    });

    // Create CodeDeploy application and deployment group
    const application = new codedeploy.LambdaApplication(
      this,
      'DeploymentApplication',
      {
        applicationName: `pattern-detector-app-${environmentSuffix}`,
      }
    );

    // Create CloudWatch alarm for canary monitoring
    const canaryAlarm = new cdk.aws_cloudwatch.Alarm(this, 'CanaryAlarm', {
      alarmName: `canary-errors-${environmentSuffix}`,
      metric: this.patternDetectorFunction.metricErrors({
        statistic: 'avg',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0.02, // 2% error rate
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        application,
        alias: this.liveAlias,
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarms: [canaryAlarm],
        autoRollback: {
          failedDeployment: true,
          deploymentInAlarm: true,
        },
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'LiveAliasArn', {
      value: this.liveAlias.functionArn,
      description: 'Lambda live alias ARN',
      exportName: `LiveAliasArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeploymentGroupName', {
      value: this.deploymentGroup.deploymentGroupName,
      description: 'CodeDeploy deployment group name',
      exportName: `DeploymentGroupName-${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
  }
}
