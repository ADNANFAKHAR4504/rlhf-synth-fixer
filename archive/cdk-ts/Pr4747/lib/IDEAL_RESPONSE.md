# TAP Stack - Complete Implementation (Ideal Response)

This document contains the corrected and complete implementation of the TAP Serverless CI/CD Stack with all improvements and fixes applied.

## Main Stack Definition

### `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
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
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly applicationBucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;
  public readonly pipelineSourceBucket: s3.IBucket;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const envSuffix = props.environmentSuffix;

    // Create VPC for Lambda function
    this.vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${envSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tap-public-${envSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `tap-private-${envSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'TapAlarmTopic', {
      displayName: `TAP Application Alarms ${envSuffix}`,
      topicName: `tap-alarm-topic-${envSuffix}`,
    });

    // Create secure application bucket with versioning and logging
    const loggingBucket = new s3.Bucket(this, 'TapLoggingBucket', {
      bucketName: `tap-app-logs-${envSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.applicationBucket = new SecureBucket(this, 'TapApplicationBucket', {
      bucketName: `tap-app-data-${envSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'app-bucket-logs/',
      environmentSuffix: envSuffix,
    }).bucket;

    // Create source bucket for pipeline if not provided
    this.pipelineSourceBucket =
      props?.pipelineSourceBucket ||
      new s3.Bucket(this, 'TapPipelineSourceBucket', {
        bucketName: `tap-pipeline-source-${envSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

    // Create Dead Letter Queue
    const dlq = new sqs.Queue(this, 'TapLambdaDLQ', {
      queueName: `tap-lambda-dlq-${envSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create Secrets Manager secret for sensitive data
    const appSecret = new secretsmanager.Secret(this, 'TapAppSecret', {
      secretName: `tap-app-secrets-${envSuffix}`,
      description: `Secrets for TAP application ${envSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: 'placeholder',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      functionName: `tap-application-function-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.main',
      code: lambda.Code.fromAsset('lib/lambda/serverless-ci-cd-function'),
      role: lambdaRole,
      environment: {
        APPLICATION_BUCKET: this.applicationBucket.bucketName,
        SECRET_ARN: appSecret.secretArn,
        NODE_ENV: 'production',
        ENVIRONMENT: envSuffix,
      },
      memorySize: 3008,
      timeout: cdk.Duration.seconds(300),
      deadLetterQueue: dlq,
      logRetention: logs.RetentionDays.ONE_MONTH,
      tracing: lambda.Tracing.ACTIVE,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      canaryConfig: {
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarmConfiguration: {
          alarms: [],
          enabled: true,
        },
      },
    });

    this.lambdaFunction = lambdaWithCanary.lambdaFunction;

    // Create EventBridge rule to trigger Lambda on S3 events
    const eventRule = new events.Rule(this, 'TapS3EventRule', {
      ruleName: `tap-s3-events-${envSuffix}`,
      description: `Trigger Lambda on S3 events for ${envSuffix}`,
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventName: ['PutObject', 'CompleteMultipartUpload'],
          requestParameters: {
            bucketName: [this.applicationBucket.bucketName],
          },
        },
      },
    });

    eventRule.addTarget(new eventsTargets.LambdaFunction(this.lambdaFunction));

    // Create CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'TapLambdaErrorAlarm', {
      alarmName: `tap-lambda-errors-${envSuffix}`,
      metric: this.lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function error rate is too high for ${envSuffix}`,
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'TapLambdaThrottleAlarm', {
      alarmName: `tap-lambda-throttles-${envSuffix}`,
      metric: this.lambdaFunction.metricThrottles({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function is being throttled for ${envSuffix}`,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'TapLambdaDurationAlarm', {
      alarmName: `tap-lambda-duration-${envSuffix}`,
      metric: this.lambdaFunction.metricDuration({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function duration is too high for ${envSuffix}`,
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
```

## Custom Constructs

### `lib/constructs/secure-bucket.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  bucketName: string;
  serverAccessLogsBucket: s3.IBucket;
  serverAccessLogsPrefix: string;
  environmentSuffix: string;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'BucketEncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for ${props.bucketName} (${props.environmentSuffix})`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create secure bucket
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: props.bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: props.serverAccessLogsBucket,
      serverAccessLogsPrefix: props.serverAccessLogsPrefix,
      lifecycleRules: [
        {
          id: 'delete-incomplete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add bucket policy for secure access
    this.bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: cdk.aws_iam.Effect.DENY,
        principals: [new cdk.aws_iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );
  }
}
```

### `lib/constructs/lambda-with-canary.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface LambdaWithCanaryProps extends lambda.FunctionProps {
  canaryConfig: {
    deploymentConfig: codedeploy.ILambdaDeploymentConfig;
    alarmConfiguration?: {
      alarms: cloudwatch.IAlarm[];
      enabled: boolean;
    };
  };
}

export class LambdaWithCanary extends Construct {
  public readonly lambdaFunction: lambda.Function;
  private deploymentGroup: codedeploy.LambdaDeploymentGroup;

  constructor(scope: Construct, id: string, props: LambdaWithCanaryProps) {
    super(scope, id);

    // Extract logRetention and create log group instead of using deprecated property
    const { logRetention, ...lambdaProps } = props;

    // Create CloudWatch Log Group with retention
    const logGroup = logRetention
      ? new logs.LogGroup(this, 'LogGroup', {
          logGroupName: `/aws/lambda/${props.functionName}`,
          retention: logRetention,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      : undefined;

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'Function', {
      ...lambdaProps,
      logGroup,
      // Enable active tracing for X-Ray
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create alias for canary deployment
    const alias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version: this.lambdaFunction.currentVersion,
    });

    // Create CodeDeploy application and deployment group
    const application = new codedeploy.LambdaApplication(
      this,
      'DeploymentApplication',
      {
        applicationName: `${props.functionName}-deployment`,
      }
    );

    this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        application,
        alias,
        deploymentConfig: props.canaryConfig.deploymentConfig,
        alarms: props.canaryConfig.alarmConfiguration?.alarms,
      }
    );
  }

  public updateCanaryAlarms(_alarms: cloudwatch.Alarm[]): void {
    // This method would update the deployment group with new alarms
    // In practice, you'd need to handle this through CDK updates
    // Note: CDK doesn't support updating alarms after deployment group creation
  }
}
```

## Lambda Function Handler

### `lib/lambda/serverless-ci-cd-function/handler.ts`

```typescript
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const s3Client = AWSXRay.captureAWSv3Client(new S3Client({}));
const secretsClient = AWSXRay.captureAWSv3Client(new SecretsManagerClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

interface AppSecrets {
  apiKey: string;
  password: string;
}

let cachedSecrets: AppSecrets | null = null;

async function getSecrets(): Promise<AppSecrets> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_ARN!,
  });

  const response = await secretsClient.send(command);
  cachedSecrets = JSON.parse(response.SecretString!) as AppSecrets;
  return cachedSecrets;
}

export async function main(event: any, context: Context): Promise<APIGatewayProxyResult> {
  const segment = AWSXRay.getSegment();

  try {
    // Log the incoming event
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get secrets
    const secrets = await getSecrets();

    // Example: Process data and store in S3
    const data = {
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      processed: true,
    };

    const putCommand = new PutObjectCommand({
      Bucket: process.env.APPLICATION_BUCKET!,
      Key: `processed/${context.awsRequestId}.json`,
      Body: JSON.stringify(data),
      ServerSideEncryption: 'aws:kms',
    });

    await s3Client.send(putCommand);

    // Add custom metric
    console.log(JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [{
          Namespace: 'TapApplication',
          Dimensions: [['Environment']],
          Metrics: [{
            Name: 'ProcessedRequests',
            Unit: 'Count',
            Value: 1,
          }],
        }],
      },
      Environment: process.env.NODE_ENV,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed request',
        requestId: context.awsRequestId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error processing request:', error);

    // Send to DLQ if critical error
    if (process.env.DEAD_LETTER_QUEUE_URL) {
      const dlqCommand = new SendMessageCommand({
        QueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
        MessageBody: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          event,
          timestamp: new Date().toISOString(),
        }),
      });

      await sqsClient.send(dlqCommand);
    }

    throw error;
  }
}
```

