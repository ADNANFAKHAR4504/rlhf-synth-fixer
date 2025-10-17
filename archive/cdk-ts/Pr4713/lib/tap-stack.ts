import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  bucketName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add stack-level tags
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    // ==============================================
    // SQS Dead Letter Queue for Lambda
    // ==============================================
    const deadLetterQueue = new sqs.Queue(this, 'LambdaDLQ', {
      queueName: `lambda-dlq-${environmentSuffix}`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // ==============================================
    // S3 Bucket Configuration
    // ==============================================
    const bucketName =
      props?.bucketName ||
      `serverless-bucket-${this.account}-${environmentSuffix}`;

    const bucket = new s3.Bucket(this, 'ServerlessS3Bucket', {
      bucketName: bucketName,

      // Enable server-side encryption with AES-256
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Enable versioning
      versioned: true,

      // Configure lifecycle policy
      lifecycleRules: [
        {
          id: 'MoveToGlacierAfter30Days',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],

      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Enforce SSL/TLS
      enforceSSL: true,

      // Set removal policy (for non-production, you might want DESTROY)
      removalPolicy: RemovalPolicy.RETAIN,

      // Enable access logs (optional but recommended for production)
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Add bucket policy to enforce HTTPS-only connections
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // ==============================================
    // IAM Role for Lambda Function
    // ==============================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for S3 triggered Lambda function',
      roleName: `lambda-s3-processor-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific S3 permissions (least privilege)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:HeadObject'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Add SQS permissions for DLQ
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // ==============================================
    // Lambda Function
    // ==============================================
    const lambdaFunction = new NodejsFunction(this, 'S3ProcessorFunction', {
      functionName: `s3-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 's3-processor.ts'),
      timeout: Duration.seconds(15),
      memorySize: 256,
      role: lambdaRole,
      environment: {
        NODE_ENV: 'production',
        ENVIRONMENT: environmentSuffix,
      },
      deadLetterQueueEnabled: true,
      deadLetterQueue: deadLetterQueue,
      maxEventAge: Duration.hours(6),
      retryAttempts: 2,
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // ==============================================
    // S3 Event Notification
    // ==============================================
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    );

    // Grant Lambda permission to read from bucket (using CDK helper)
    bucket.grantRead(lambdaFunction);

    // ==============================================
    // CloudWatch Alarm
    // ==============================================

    // Create SNS topic for alarm notifications (optional)
    const alarmTopic = new sns.Topic(this, 'LambdaAlarmTopic', {
      topicName: `lambda-errors-topic-${environmentSuffix}`,
      displayName: 'Lambda Error Notifications',
    });

    // Create CloudWatch alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-high-${environmentSuffix}`,
      alarmDescription:
        'Triggered when Lambda function errors exceed threshold',
      metric: lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action to send notification
    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Additional alarm for DLQ messages
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `lambda-dlq-messages-${environmentSuffix}`,
      alarmDescription: 'Triggered when messages are sent to DLQ',
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ==============================================
    // CloudFormation Outputs
    // ==============================================
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: bucket.bucketArn,
      description: 'ARN of the S3 bucket',
      exportName: `${this.stackName}-S3BucketArn`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'URL of the Dead Letter Queue',
      exportName: `${this.stackName}-DLQUrl`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarm notifications',
      exportName: `${this.stackName}-AlarmTopicArn`,
    });
  }
}
