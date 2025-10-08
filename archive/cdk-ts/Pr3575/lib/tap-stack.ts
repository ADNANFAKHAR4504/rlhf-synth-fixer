import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

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

    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description:
        'KMS key for encrypting content in the media processing pipeline',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const outputBucket = new s3.Bucket(this, 'OutputBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const processingTable = new dynamodb.Table(this, 'ProcessingTable', {
      partitionKey: { name: 'assetId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    processingTable.addGlobalSecondaryIndex({
      indexName: 'JobIdIndex',
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
    });

    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    const jobQueue = new sqs.Queue(this, 'JobQueue', {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const statusUpdateQueue = new sqs.Queue(this, 'StatusUpdateQueue', {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const uploadHandlerRole = new iam.Role(this, 'UploadHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    uploadBucket.grantRead(uploadHandlerRole);
    jobQueue.grantSendMessages(uploadHandlerRole);

    const uploadHandlerFunction = new lambda.Function(
      this,
      'UploadHandlerFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Upload handler invoked', JSON.stringify(event, null, 2));
  const queueUrl = process.env.JOB_QUEUE_URL;
  const tableName = process.env.PROCESSING_TABLE;
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
      const assetId = key.split('/').pop().split('.')[0] || key;
      console.log(\`Processing upload: \${bucket}/\${key}\`);
      const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          assetId: { S: assetId },
          status: { S: 'UPLOADED' },
          bucket: { S: bucket },
          key: { S: key },
          uploadTime: { S: new Date().toISOString() },
          ttl: { N: ttl.toString() },
        },
      }));
      console.log(\`Created DynamoDB record for asset: \${assetId}\`);
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ assetId, bucket, key }),
      }));
      console.log(\`Sent message to SQS for asset: \${assetId}\`);
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'Upload processed successfully' }) };
  } catch (error) {
    console.error('Error processing upload:', error);
    throw error;
  }
};
      `),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: uploadHandlerRole,
        environment: {
          JOB_QUEUE_URL: jobQueue.queueUrl,
          PROCESSING_TABLE: processingTable.tableName,
        },
      }
    );

    processingTable.grantWriteData(uploadHandlerFunction);

    uploadBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(uploadHandlerFunction)
    );

    const processorRole = new iam.Role(this, 'ProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    processorRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'mediaconvert:CreateJob',
          'mediaconvert:GetJob',
          'mediaconvert:DescribeEndpoints',
        ],
        resources: ['*'],
      })
    );

    processorRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: ['*'],
        conditions: {
          StringLike: {
            'iam:PassedToService': 'mediaconvert.amazonaws.com',
          },
        },
      })
    );

    uploadBucket.grantRead(processorRole);
    outputBucket.grantReadWrite(processorRole);
    processingTable.grantReadWriteData(processorRole);

    const mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com'),
    });

    uploadBucket.grantRead(mediaConvertRole);
    outputBucket.grantReadWrite(mediaConvertRole);

    const processorFunction = new lambda.Function(this, 'ProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { MediaConvertClient, CreateJobCommand, DescribeEndpointsCommand } = require('@aws-sdk/client-mediaconvert');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({});
let mediaConvertClient;
let mediaConvertEndpoint;

async function getMediaConvertClient() {
  if (!mediaConvertClient) {
    const tempClient = new MediaConvertClient({ region: process.env.AWS_REGION });
    const response = await tempClient.send(new DescribeEndpointsCommand({ MaxResults: 1 }));
    mediaConvertEndpoint = response.Endpoints[0].Url;
    mediaConvertClient = new MediaConvertClient({ region: process.env.AWS_REGION, endpoint: mediaConvertEndpoint });
  }
  return mediaConvertClient;
}

exports.handler = async (event) => {
  console.log('Processor invoked', JSON.stringify(event, null, 2));
  const uploadBucket = process.env.UPLOAD_BUCKET;
  const outputBucket = process.env.OUTPUT_BUCKET;
  const tableName = process.env.PROCESSING_TABLE;
  const mediaConvertRoleArn = process.env.MEDIACONVERT_ROLE_ARN;
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { assetId, bucket, key } = message;
      console.log(\`Processing asset: \${assetId}\`);
      const client = await getMediaConvertClient();
      const jobSettings = {
        Role: mediaConvertRoleArn,
        Settings: {
          Inputs: [{
            FileInput: \`s3://\${bucket}/\${key}\`,
            AudioSelectors: { 'Audio Selector 1': { DefaultSelection: 'DEFAULT' } },
            VideoSelector: {},
            TimecodeSource: 'ZEROBASED',
          }],
          OutputGroups: [{
            Name: 'File Group',
            OutputGroupSettings: {
              Type: 'FILE_GROUP_SETTINGS',
              FileGroupSettings: { Destination: \`s3://\${outputBucket}/\${assetId}/\` },
            },
            Outputs: [
              {
                ContainerSettings: { Container: 'MP4', Mp4Settings: {} },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: { RateControlMode: 'QVBR', MaxBitrate: 2000000 },
                  },
                  Width: 1280,
                  Height: 720,
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: { Bitrate: 96000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 },
                  },
                }],
                NameModifier: '_720p',
              },
              {
                ContainerSettings: { Container: 'MP4', Mp4Settings: {} },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'FRAME_CAPTURE',
                    FrameCaptureSettings: {
                      FramerateNumerator: 1,
                      FramerateDenominator: 5,
                      MaxCaptures: 1,
                      Quality: 80,
                    },
                  },
                  Width: 1280,
                  Height: 720,
                },
                NameModifier: '_thumbnail',
              },
            ],
          }],
        },
      };
      const response = await client.send(new CreateJobCommand(jobSettings));
      const jobId = response.Job.Id;
      console.log(\`Created MediaConvert job: \${jobId} for asset: \${assetId}\`);
      await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: { assetId: { S: assetId } },
        UpdateExpression: 'SET jobId = :jobId, #status = :status, jobSubmittedTime = :time',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':jobId': { S: jobId },
          ':status': { S: 'PROCESSING' },
          ':time': { S: new Date().toISOString() },
        },
      }));
      console.log(\`Updated DynamoDB record for asset: \${assetId} with jobId: \${jobId}\`);
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'Processing completed successfully' }) };
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
};
      `),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      role: processorRole,
      environment: {
        UPLOAD_BUCKET: uploadBucket.bucketName,
        OUTPUT_BUCKET: outputBucket.bucketName,
        PROCESSING_TABLE: processingTable.tableName,
        MEDIACONVERT_ROLE_ARN: mediaConvertRole.roleArn,
      },
    });

    processorFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(jobQueue, {
        batchSize: 10,
      })
    );

    const statusUpdaterRole = new iam.Role(this, 'StatusUpdaterRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    processingTable.grantReadWriteData(statusUpdaterRole);

    const statusUpdaterFunction = new lambda.Function(
      this,
      'StatusUpdaterFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Status updater invoked', JSON.stringify(event, null, 2));
  const tableName = process.env.PROCESSING_TABLE;
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      if (message.source === 'aws.mediaconvert' && message.detail) {
        const { jobId, status, outputGroupDetails } = message.detail;
        console.log(\`Updating status for jobId: \${jobId}, status: \${status}\`);
        let updateExpression = 'SET #status = :status, lastUpdatedTime = :time';
        const expressionAttributeNames = { '#status': 'status' };
        const expressionAttributeValues = {
          ':status': { S: status },
          ':time': { S: new Date().toISOString() },
        };
        if (status === 'COMPLETE' && outputGroupDetails) {
          const outputFiles = outputGroupDetails.flatMap(group =>
            group.outputDetails.map(detail => detail.outputFilePaths)
          ).flat();
          updateExpression += ', outputFiles = :outputFiles, completedTime = :completedTime';
          expressionAttributeValues[':outputFiles'] = { L: outputFiles.map(file => ({ S: file })) };
          expressionAttributeValues[':completedTime'] = { S: new Date().toISOString() };
        }
        if (status === 'ERROR') {
          updateExpression += ', errorMessage = :errorMessage';
          expressionAttributeValues[':errorMessage'] = { S: message.detail.errorMessage || 'Unknown error' };
        }
        await dynamoClient.send(new UpdateItemCommand({
          TableName: tableName,
          Key: { assetId: { S: jobId } },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        }));
        console.log(\`Updated status for jobId: \${jobId}\`);
      }
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'Status update completed successfully' }) };
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};
      `),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: statusUpdaterRole,
        environment: {
          PROCESSING_TABLE: processingTable.tableName,
        },
      }
    );

    statusUpdaterFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(statusUpdateQueue, {
        batchSize: 10,
      })
    );

    const mediaConvertRule = new events.Rule(this, 'MediaConvertRule', {
      eventPattern: {
        source: ['aws.mediaconvert'],
        detailType: ['MediaConvert Job State Change'],
      },
    });

    mediaConvertRule.addTarget(new targets.SqsQueue(statusUpdateQueue));

    new cloudwatch.Alarm(this, 'DeadLetterQueueAlarm', {
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Messages in dead letter queue',
    });

    new cloudwatch.Alarm(this, 'ProcessorErrorAlarm', {
      metric: processorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'High error rate in processor lambda',
    });

    new cloudwatch.Alarm(this, 'ProcessorThrottleAlarm', {
      metric: processorFunction.metricThrottles(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'High throttle rate in processor lambda',
    });

    new cloudwatch.Alarm(this, 'StatusUpdaterErrorAlarm', {
      metric: statusUpdaterFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'High error rate in status updater lambda',
    });

    new cloudwatch.Alarm(this, 'UploadHandlerErrorAlarm', {
      metric: uploadHandlerFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'High error rate in upload handler lambda',
    });

    new cloudwatch.Alarm(this, 'JobQueueDepthAlarm', {
      metric: jobQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 1,
      alarmDescription: 'High number of messages in job queue',
    });

    new cloudwatch.Alarm(this, 'StatusQueueDepthAlarm', {
      metric: statusUpdateQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 1,
      alarmDescription: 'High number of messages in status update queue',
    });

    new cloudwatch.Alarm(this, 'JobQueueAgeAlarm', {
      metric: jobQueue.metricApproximateAgeOfOldestMessage(),
      threshold: 300,
      evaluationPeriods: 1,
      alarmDescription: 'Messages not processed quickly enough in job queue',
    });

    new cloudwatch.Alarm(this, 'StatusQueueAgeAlarm', {
      metric: statusUpdateQueue.metricApproximateAgeOfOldestMessage(),
      threshold: 300,
      evaluationPeriods: 1,
      alarmDescription: 'Messages not processed quickly enough in status queue',
    });

    new cdk.CfnOutput(this, 'UploadBucketName', {
      value: uploadBucket.bucketName,
      exportName: `${environmentSuffix}-UploadBucketName`,
    });

    new cdk.CfnOutput(this, 'OutputBucketName', {
      value: outputBucket.bucketName,
      exportName: `${environmentSuffix}-OutputBucketName`,
    });

    new cdk.CfnOutput(this, 'ProcessingTableName', {
      value: processingTable.tableName,
      exportName: `${environmentSuffix}-ProcessingTableName`,
    });

    new cdk.CfnOutput(this, 'JobQueueUrl', {
      value: jobQueue.queueUrl,
      exportName: `${environmentSuffix}-JobQueueUrl`,
    });

    new cdk.CfnOutput(this, 'StatusUpdateQueueUrl', {
      value: statusUpdateQueue.queueUrl,
      exportName: `${environmentSuffix}-StatusUpdateQueueUrl`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      exportName: `${environmentSuffix}-DeadLetterQueueUrl`,
    });
  }
}
