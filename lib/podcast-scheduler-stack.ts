import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import { Construct } from 'constructs';

interface PodcastSchedulerStackProps {
  environmentSuffix: string;
  subscriberTable: dynamodb.ITable;
  audioBucket: s3.IBucket;
  mediaConvertRole: iam.IRole;
  jobTemplateName: string;
  keyValueStore: cloudfront.CfnKeyValueStore;
}

export class PodcastSchedulerStack extends Construct {
  constructor(scope: Construct, id: string, props: PodcastSchedulerStackProps) {
    super(scope, id);

    // IAM role for EventBridge Scheduler
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      description: 'Role for EventBridge Scheduler to invoke targets',
    });

    // Lambda function for subscription expiration cleanup
    const cleanupFunction = new lambda.Function(
      this,
      'SubscriberCleanupFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'us-east-1' }));
const SUBSCRIBER_TABLE = process.env.SUBSCRIBER_TABLE;

exports.handler = async (event) => {
  console.log('Running subscription expiration cleanup');

  try {
    const now = new Date().toISOString();

    // Query expired subscriptions using GSI
    const result = await ddb.query({
      TableName: SUBSCRIBER_TABLE,
      IndexName: 'status-index',
      KeyConditionExpression: 'subscriptionStatus = :status AND expirationDate < :now',
      ExpressionAttributeValues: {
        ':status': 'active',
        ':now': now,
      },
    });

    console.log('Found expired subscriptions:', result.Items?.length || 0);

    // Update expired subscriptions to inactive
    for (const item of result.Items || []) {
      await ddb.update({
        TableName: SUBSCRIBER_TABLE,
        Key: { email: item.email },
        UpdateExpression: 'SET subscriptionStatus = :inactive',
        ExpressionAttributeValues: {
          ':inactive': 'expired',
        },
      });
      console.log('Marked subscription as expired:', item.email);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cleanup completed',
        expiredCount: result.Items?.length || 0,
      }),
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};
        `),
        environment: {
          SUBSCRIBER_TABLE: props.subscriberTable.tableName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
      }
    );

    // Grant DynamoDB read/write access to cleanup function
    props.subscriberTable.grantReadWriteData(cleanupFunction);

    // Lambda function for MediaConvert job submission
    const transcodingTriggerFunction = new lambda.Function(
      this,
      'TranscodingTriggerFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { MediaConvert } = require('@aws-sdk/client-mediaconvert');
const { S3 } = require('@aws-sdk/client-s3');

const s3 = new S3({ region: 'us-east-1' });
const BUCKET_NAME = process.env.BUCKET_NAME;
const JOB_TEMPLATE = process.env.JOB_TEMPLATE;
const MEDIACONVERT_ROLE = process.env.MEDIACONVERT_ROLE;

// Get MediaConvert endpoint
const getMediaConvertEndpoint = async () => {
  const mc = new MediaConvert({ region: 'us-east-1' });
  const data = await mc.describeEndpoints({});
  return data.Endpoints?.[0]?.Url;
};

exports.handler = async (event) => {
  console.log('Checking for new audio files to transcode');

  try {
    // List objects in the raw folder
    const listResponse = await s3.listObjectsV2({
      Bucket: BUCKET_NAME,
      Prefix: 'raw/',
    });

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No files found for transcoding');
      return { statusCode: 200, body: 'No files to process' };
    }

    const endpoint = await getMediaConvertEndpoint();
    const mc = new MediaConvert({ region: 'us-east-1', endpoint });

    // Submit transcoding jobs for each file
    for (const obj of listResponse.Contents) {
      if (obj.Key && obj.Key.endsWith('.mp3')) {
        console.log('Submitting job for:', obj.Key);

        await mc.createJob({
          Role: MEDIACONVERT_ROLE,
          JobTemplate: JOB_TEMPLATE,
          Settings: {
            Inputs: [
              {
                FileInput: 's3://' + BUCKET_NAME + '/' + obj.Key,
              },
            ],
          },
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Transcoding jobs submitted' }),
    };
  } catch (error) {
    console.error('Error submitting transcoding jobs:', error);
    throw error;
  }
};
        `),
        environment: {
          BUCKET_NAME: props.audioBucket.bucketName,
          JOB_TEMPLATE: props.jobTemplateName,
          MEDIACONVERT_ROLE: props.mediaConvertRole.roleArn,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
      }
    );

    // Grant S3 read access and MediaConvert permissions
    props.audioBucket.grantRead(transcodingTriggerFunction);
    transcodingTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['mediaconvert:CreateJob', 'mediaconvert:DescribeEndpoints'],
        resources: ['*'],
      })
    );
    transcodingTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [props.mediaConvertRole.roleArn],
      })
    );

    // EventBridge Scheduler: Daily subscription cleanup at 2 AM UTC
    const cleanupSchedule = new scheduler.CfnSchedule(this, 'CleanupSchedule', {
      name: `podcast-cleanup-${props.environmentSuffix}`,
      description: 'Daily cleanup of expired subscriptions',
      scheduleExpression: 'cron(0 2 * * ? *)',
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      target: {
        arn: cleanupFunction.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    });

    // Grant scheduler permission to invoke cleanup function
    cleanupFunction.grantInvoke(
      new iam.ServicePrincipal('scheduler.amazonaws.com')
    );

    // EventBridge Scheduler: Hourly transcoding check
    const transcodingSchedule = new scheduler.CfnSchedule(
      this,
      'TranscodingSchedule',
      {
        name: `podcast-transcoding-${props.environmentSuffix}`,
        description: 'Hourly check for new audio files to transcode',
        scheduleExpression: 'rate(1 hour)',
        flexibleTimeWindow: {
          mode: 'FLEXIBLE',
          maximumWindowInMinutes: 15,
        },
        target: {
          arn: transcodingTriggerFunction.functionArn,
          roleArn: schedulerRole.roleArn,
        },
      }
    );

    // Grant scheduler permission to invoke transcoding function
    transcodingTriggerFunction.grantInvoke(
      new iam.ServicePrincipal('scheduler.amazonaws.com')
    );

    // Lambda function to process DynamoDB Streams and update KeyValueStore
    const streamProcessorFunction = new lambda.Function(
      this,
      'StreamProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { CloudFrontKeyValueStore } = require('@aws-sdk/client-cloudfront-keyvaluestore');

const kvsClient = new CloudFrontKeyValueStore({ region: 'us-east-1' });
const KVS_ARN = process.env.KVS_ARN;

exports.handler = async (event) => {
  console.log('Processing DynamoDB stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const newImage = record.dynamodb.NewImage;
      const email = newImage.email.S;

      // Update KeyValueStore with new subscriber data
      const subscriberData = {
        email: email,
        subscriptionStatus: newImage.subscriptionStatus.S,
        expirationDate: newImage.expirationDate.S,
      };

      try {
        await kvsClient.putKey({
          KvsARN: KVS_ARN,
          Key: email,
          Value: JSON.stringify(subscriberData),
        });
        console.log('Updated KeyValueStore for subscriber:', email);
      } catch (error) {
        console.error('Error updating KeyValueStore:', error);
      }
    } else if (record.eventName === 'REMOVE') {
      const oldImage = record.dynamodb.OldImage;
      const email = oldImage.email.S;

      // Remove from KeyValueStore
      try {
        await kvsClient.deleteKey({
          KvsARN: KVS_ARN,
          Key: email,
        });
        console.log('Removed subscriber from KeyValueStore:', email);
      } catch (error) {
        console.error('Error removing from KeyValueStore:', error);
      }
    }
  }

  return { statusCode: 200, body: 'Processed stream events' };
};
        `),
        environment: {
          KVS_ARN: props.keyValueStore.attrArn,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
      }
    );

    // Grant KeyValueStore permissions to stream processor
    streamProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront-keyvaluestore:PutKey',
          'cloudfront-keyvaluestore:DeleteKey',
          'cloudfront-keyvaluestore:DescribeKeyValueStore',
        ],
        resources: [props.keyValueStore.attrArn],
      })
    );

    // Add DynamoDB Stream as event source for stream processor
    streamProcessorFunction.addEventSource(
      new lambdaEventSources.DynamoEventSource(props.subscriberTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        retryAttempts: 3,
      })
    );

    new cdk.CfnOutput(this, 'CleanupScheduleName', {
      value: cleanupSchedule.name || '',
      description: 'EventBridge cleanup schedule name',
    });

    new cdk.CfnOutput(this, 'TranscodingScheduleName', {
      value: transcodingSchedule.name || '',
      description: 'EventBridge transcoding schedule name',
    });

    new cdk.CfnOutput(this, 'CleanupFunctionArn', {
      value: cleanupFunction.functionArn,
      description: 'Subscriber cleanup Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'TranscodingFunctionArn', {
      value: transcodingTriggerFunction.functionArn,
      description: 'Transcoding trigger Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'StreamProcessorFunctionArn', {
      value: streamProcessorFunction.functionArn,
      description: 'DynamoDB stream processor Lambda function ARN',
    });
  }
}
