import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { LambdaWithCanary } from './constructs/lambda-with-canary';
import { SecureBucket } from './constructs/secure-bucket';

export interface TapStackProps extends cdk.StackProps {
  pipelineSourceBucket?: s3.IBucket;
}

export class TapStack extends cdk.Stack {
  public readonly applicationBucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;
  public readonly pipelineSourceBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'TapAlarmTopic', {
      displayName: 'TAP Application Alarms',
    });

    // Create secure application bucket with versioning and logging
    const loggingBucket = new s3.Bucket(this, 'TapLoggingBucket', {
      bucketName: `tap-app-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.applicationBucket = new SecureBucket(this, 'TapApplicationBucket', {
      bucketName: `tap-app-data-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'app-bucket-logs/',
    }).bucket;

    // Create source bucket for pipeline if not provided
    this.pipelineSourceBucket =
      props?.pipelineSourceBucket ||
      new s3.Bucket(this, 'TapPipelineSourceBucket', {
        bucketName: `tap-pipeline-source-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

    // Create Dead Letter Queue
    const dlq = new sqs.Queue(this, 'TapLambdaDLQ', {
      queueName: 'tap-lambda-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create Secrets Manager secret for sensitive data
    const appSecret = new secretsmanager.Secret(this, 'TapAppSecret', {
      secretName: 'tap-app-secrets',
      description: 'Secrets for TAP application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: 'placeholder',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        TapLambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${this.applicationBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [this.applicationBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [dlq.queueArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [appSecret.secretArn],
            }),
          ],
        }),
      },
    });

    // Create Lambda with canary deployment
    const lambdaWithCanary = new LambdaWithCanary(this, 'TapLambda', {
      functionName: 'tap-application-function',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.main',
      code: lambda.Code.fromAsset('lambda/serverless-ci-cd-function'),
      role: lambdaRole,
      environment: {
        APPLICATION_BUCKET: this.applicationBucket.bucketName,
        SECRET_ARN: appSecret.secretArn,
        NODE_ENV: 'production',
      },
      memorySize: 3008, // Maximum memory for better performance
      timeout: cdk.Duration.seconds(300),
      // Note: Removed reservedConcurrentExecutions to use account-level unreserved capacity
      // This allows Lambda to scale automatically while respecting account limits
      deadLetterQueue: dlq,
      logRetention: logs.RetentionDays.ONE_MONTH,
      tracing: lambda.Tracing.ACTIVE,
      canaryConfig: {
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarmConfiguration: {
          alarms: [], // Will be populated below
          enabled: true,
        },
      },
    });

    this.lambdaFunction = lambdaWithCanary.lambdaFunction;

    // Create CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'TapLambdaErrorAlarm', {
      metric: this.lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function error rate is too high',
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'TapLambdaThrottleAlarm', {
      metric: this.lambdaFunction.metricThrottles({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function is being throttled',
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'TapLambdaDurationAlarm', {
      metric: this.lambdaFunction.metricDuration({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function duration is too high',
    });

    // Add alarm actions
    [errorAlarm, throttleAlarm, durationAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    // Update canary deployment alarms
    lambdaWithCanary.updateCanaryAlarms([errorAlarm]);

    // Output important values for testing
    new cdk.CfnOutput(this, 'ApplicationBucketName', {
      value: this.applicationBucket.bucketName,
      description: 'Name of the application S3 bucket',
      exportName: `${this.stackName}-ApplicationBucket`,
    });

    new cdk.CfnOutput(this, 'ApplicationBucketArn', {
      value: this.applicationBucket.bucketArn,
      description: 'ARN of the application S3 bucket',
      exportName: `${this.stackName}-ApplicationBucketArn`,
    });

    new cdk.CfnOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucketName,
      description: 'Name of the logging S3 bucket',
      exportName: `${this.stackName}-LoggingBucket`,
    });

    new cdk.CfnOutput(this, 'PipelineSourceBucketName', {
      value: this.pipelineSourceBucket.bucketName,
      description: 'Name of the pipeline source S3 bucket',
      exportName: `${this.stackName}-PipelineSourceBucket`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `${this.stackName}-LambdaArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Name of the Lambda function (use for AWS CLI invocations)',
      exportName: `${this.stackName}-LambdaName`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: dlq.queueUrl,
      description: 'URL of the Dead Letter Queue',
      exportName: `${this.stackName}-DLQUrl`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: dlq.queueArn,
      description: 'ARN of the Dead Letter Queue',
      exportName: `${this.stackName}-DLQArn`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: appSecret.secretArn,
      description: 'ARN of the Secrets Manager secret',
      exportName: `${this.stackName}-SecretArn`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS alarm topic',
      exportName: `${this.stackName}-AlarmTopicArn`,
    });

    new cdk.CfnOutput(this, 'ErrorAlarmName', {
      value: errorAlarm.alarmName,
      description: 'Name of the Lambda error alarm',
      exportName: `${this.stackName}-ErrorAlarmName`,
    });

    new cdk.CfnOutput(this, 'ThrottleAlarmName', {
      value: throttleAlarm.alarmName,
      description: 'Name of the Lambda throttle alarm',
      exportName: `${this.stackName}-ThrottleAlarmName`,
    });

    new cdk.CfnOutput(this, 'DurationAlarmName', {
      value: durationAlarm.alarmName,
      description: 'Name of the Lambda duration alarm',
      exportName: `${this.stackName}-DurationAlarmName`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'ARN of the Lambda execution role',
      exportName: `${this.stackName}-LambdaRoleArn`,
    });

    // Useful testing commands
    new cdk.CfnOutput(this, 'TestInvokeCommand', {
      value: `aws lambda invoke --function-name ${this.lambdaFunction.functionName} --payload '{"test": "data"}' response.json`,
      description: 'AWS CLI command to test invoke the Lambda function',
    });

    new cdk.CfnOutput(this, 'CheckDLQCommand', {
      value: `aws sqs receive-message --queue-url ${dlq.queueUrl} --max-number-of-messages 10`,
      description: 'AWS CLI command to check Dead Letter Queue messages',
    });

    new cdk.CfnOutput(this, 'ViewLogsCommand', {
      value: `aws logs tail /aws/lambda/${this.lambdaFunction.functionName} --follow`,
      description: 'AWS CLI command to tail Lambda function logs',
    });
  }
}
