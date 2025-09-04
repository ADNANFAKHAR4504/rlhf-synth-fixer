import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';

export class ServerlessNotificationStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket for storing task results and output files - Private bucket as required
    const taskResultsBucket = new s3.Bucket(
      this,
      `TaskResultsBucket${environmentSuffix}`,
      {
        bucketName: `task-results-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed from RETAIN to DESTROY for deployability
        autoDeleteObjects: true, // Added to ensure clean destruction
        enforceSSL: true,
      }
    );

    // SNS Topic for completion notifications from Lambda
    const completionTopic = new sns.Topic(
      this,
      `TaskCompletionTopic${environmentSuffix}`,
      {
        topicName: `task-completion-notifications-${environmentSuffix}`,
        displayName: `Task Completion Notifications - ${environmentSuffix}`,
      }
    );

    // Lambda function for task processing with Python runtime
    const taskProcessorFunction = new lambda.Function(
      this,
      `TaskProcessorFunction${environmentSuffix}`,
      {
        functionName: `task-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'task-processor.lambda_handler',
        code: lambda.Code.fromAsset('lib/lambda'), // Fixed path to match project structure
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          S3_BUCKET_NAME: taskResultsBucket.bucketName,
          SNS_TOPIC_ARN: completionTopic.topicArn,
          REGION: cdk.Aws.REGION,
        },
        deadLetterQueueEnabled: true,
        retryAttempts: 2,
        description: `Processes async tasks and notifies completion - ${environmentSuffix}`,
      }
    );

    // Grant permissions using CDK grant methods (least privilege as required)
    taskResultsBucket.grantWrite(taskProcessorFunction);
    completionTopic.grantPublish(taskProcessorFunction);

    // Apply required resource tagging as specified in PROMPT.md
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Department', 'IT');

    // CloudFormation Outputs for integration tests
    new cdk.CfnOutput(this, `TaskResultsBucketName${environmentSuffix}`, {
      value: taskResultsBucket.bucketName,
      description: 'S3 Bucket name for task results',
      exportName: `TaskResultsBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskCompletionTopicArn${environmentSuffix}`, {
      value: completionTopic.topicArn,
      description: 'SNS Topic ARN for completion notifications',
      exportName: `TaskCompletionTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskProcessorFunctionArn${environmentSuffix}`, {
      value: taskProcessorFunction.functionArn,
      description: 'Lambda Function ARN for task processing',
      exportName: `TaskProcessorFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskProcessorFunctionName${environmentSuffix}`, {
      value: taskProcessorFunction.functionName,
      description: 'Lambda Function name for task processing',
      exportName: `TaskProcessorFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `StackStatus${environmentSuffix}`, {
      value: 'DEPLOYED',
      description: `Serverless notification service deployment status - ${environmentSuffix}`,
      exportName: `ServerlessNotificationStackStatus-${environmentSuffix}`,
    });
  }
}
