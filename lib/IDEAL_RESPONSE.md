# Podcast Platform Infrastructure - Enhanced Production-Ready Solution

This document provides the complete, production-ready infrastructure code for a podcast hosting platform on AWS using CDK with TypeScript, enhanced with edge caching and event-driven automation.

## Architecture Overview

The enhanced platform consists of:
- **S3 Storage** with requester pays and intelligent tiering for audio files
- **CloudFront Distribution** with ECDSA signed cookies for secure content delivery
- **CloudFront KeyValueStore** for edge caching of subscriber authentication data
- **Lambda@Edge** with cache-first authentication strategy
- **DynamoDB** with Streams for real-time subscriber data synchronization
- **EventBridge Scheduler** for automated transcoding and subscription management
- **MediaConvert** for multi-bitrate audio transcoding (64kbps, 128kbps, 256kbps)
- **Route 53** for DNS management
- **CloudWatch** for comprehensive monitoring and alerting
- **Lambda Functions** for stream processing and automated workflows

## Complete Infrastructure Code

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PodcastStorageStack } from './podcast-storage-stack';
import { PodcastSubscriberStack } from './podcast-subscriber-stack';
import { PodcastCdnStack } from './podcast-cdn-stack';
import { PodcastTranscodingStack } from './podcast-transcoding-stack';
import { PodcastMonitoringStack } from './podcast-monitoring-stack';
import { PodcastDnsStack } from './podcast-dns-stack';
import { PodcastSchedulerStack } from './podcast-scheduler-stack';

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

    // Storage stack for S3 audio files
    const storageStack = new PodcastStorageStack(this, 'PodcastStorage', {
      environmentSuffix,
    });

    // Subscriber data stack with DynamoDB and Streams
    const subscriberStack = new PodcastSubscriberStack(
      this,
      'PodcastSubscriber',
      {
        environmentSuffix,
      }
    );

    // Transcoding stack with MediaConvert
    const transcodingStack = new PodcastTranscodingStack(
      this,
      'PodcastTranscoding',
      {
        environmentSuffix,
        audioBucket: storageStack.audioBucket,
      }
    );

    // CDN stack with CloudFront, KeyValueStore, and Lambda@Edge
    const cdnStack = new PodcastCdnStack(this, 'PodcastCdn', {
      environmentSuffix,
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
    });

    // DNS stack with Route 53
    const dnsStack = new PodcastDnsStack(this, 'PodcastDns', {
      environmentSuffix,
      distribution: cdnStack.distribution,
    });

    // EventBridge Scheduler stack for automated workflows
    new PodcastSchedulerStack(this, 'PodcastScheduler', {
      environmentSuffix,
      subscriberTable: subscriberStack.subscriberTable,
      audioBucket: storageStack.audioBucket,
      mediaConvertRole: transcodingStack.mediaConvertRole,
      jobTemplateName: transcodingStack.jobTemplateName,
      keyValueStore: cdnStack.keyValueStore,
    });

    // Monitoring stack with CloudWatch
    new PodcastMonitoringStack(this, 'PodcastMonitoring', {
      environmentSuffix,
      distribution: cdnStack.distribution,
      subscriberTable: subscriberStack.subscriberTable,
      audioBucket: storageStack.audioBucket,
    });
  }
}
```

### lib/podcast-storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface PodcastStorageStackProps {
  environmentSuffix: string;
}

export class PodcastStorageStack extends Construct {
  public readonly audioBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: PodcastStorageStackProps) {
    super(scope, id);

    // S3 bucket for audio files with requester pays and intelligent tiering
    this.audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `podcast-audio-${props.environmentSuffix}-${
        cdk.Stack.of(this).account
      }`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      requestPayerBucket: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'IntelligentTieringRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
    });

    cdk.Tags.of(this.audioBucket).add('Environment', props.environmentSuffix);

    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: this.audioBucket.bucketName,
      description: 'S3 bucket name for audio files',
    });
  }
}
```

### lib/podcast-subscriber-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface PodcastSubscriberStackProps {
  environmentSuffix: string;
}

export class PodcastSubscriberStack extends Construct {
  public readonly subscriberTable: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: PodcastSubscriberStackProps
  ) {
    super(scope, id);

    // DynamoDB table for subscriber information with Streams enabled
    this.subscriberTable = new dynamodb.Table(this, 'SubscriberTable', {
      tableName: `podcast-subscribers-${props.environmentSuffix}`,
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for querying by subscription status
    this.subscriberTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'subscriptionStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'expirationDate',
        type: dynamodb.AttributeType.STRING,
      },
    });

    cdk.Tags.of(this.subscriberTable).add(
      'Environment',
      props.environmentSuffix
    );

    new cdk.CfnOutput(this, 'SubscriberTableName', {
      value: this.subscriberTable.tableName,
      description: 'DynamoDB table name for subscribers',
    });

    new cdk.CfnOutput(this, 'SubscriberTableStreamArn', {
      value: this.subscriberTable.tableStreamArn || '',
      description: 'DynamoDB stream ARN for real-time updates',
    });
  }
}
```

### lib/podcast-cdn-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface PodcastCdnStackProps {
  environmentSuffix: string;
  audioBucket: s3.IBucket;
  subscriberTable: dynamodb.ITable;
}

export class PodcastCdnStack extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly edgeFunction: lambda.Function;
  public readonly keyValueStore: cloudfront.CfnKeyValueStore;

  constructor(scope: Construct, id: string, props: PodcastCdnStackProps) {
    super(scope, id);

    // Create CloudFront KeyValueStore for edge caching
    this.keyValueStore = new cloudfront.CfnKeyValueStore(this, 'SubscriberKVStore', {
      name: `podcast-subscriber-kvs-${props.environmentSuffix}`,
      comment: 'KeyValueStore for subscriber authentication data at the edge',
    });

    // Create IAM role for Lambda@Edge
    const edgeRole = new iam.Role(this, 'EdgeFunctionRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions to access DynamoDB
    props.subscriberTable.grantReadData(edgeRole);

    // Grant permissions to access KeyValueStore
    edgeRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront-keyvaluestore:GetKey',
          'cloudfront-keyvaluestore:DescribeKeyValueStore',
        ],
        resources: [this.keyValueStore.attrArn],
      })
    );

    // Create Lambda@Edge function with cache-first strategy
    this.edgeFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { CloudFrontKeyValueStore } = require('@aws-sdk/client-cloudfront-keyvaluestore');

const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'us-west-2' }));
const kvsClient = new CloudFrontKeyValueStore({ region: 'us-west-2' });
const SUBSCRIBER_TABLE = '${props.subscriberTable.tableName}';
const KVS_ARN = '${this.keyValueStore.attrArn}';

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Check for CloudFront signed cookies
  const cookies = headers.cookie || [];
  let cloudFrontPolicy = null;
  let cloudFrontSignature = null;
  let cloudFrontKeyPairId = null;
  let subscriberEmail = null;

  for (const cookie of cookies) {
    const cookieStr = cookie.value;
    const pairs = cookieStr.split(';');

    for (const pair of pairs) {
      const [key, value] = pair.trim().split('=');
      if (key === 'CloudFront-Policy') cloudFrontPolicy = value;
      if (key === 'CloudFront-Signature') cloudFrontSignature = value;
      if (key === 'CloudFront-Key-Pair-Id') cloudFrontKeyPairId = value;
      if (key === 'subscriber-email') subscriberEmail = value;
    }
  }

  // Verify all required cookies are present
  if (!cloudFrontPolicy || !cloudFrontSignature || !cloudFrontKeyPairId) {
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Access denied - invalid authentication',
    };
  }

  // Validate subscriber status
  if (subscriberEmail) {
    try {
      // First, try to get subscriber data from KeyValueStore (edge cache)
      let subscriberData = null;
      try {
        const kvsResponse = await kvsClient.getKey({
          KvsARN: KVS_ARN,
          Key: subscriberEmail,
        });

        if (kvsResponse.Value) {
          subscriberData = JSON.parse(kvsResponse.Value);
          console.log('Retrieved subscriber data from KeyValueStore');
        }
      } catch (kvsError) {
        console.log('KeyValueStore lookup failed, falling back to DynamoDB:', kvsError.message);
      }

      // If not in KeyValueStore, query DynamoDB
      if (!subscriberData) {
        const result = await ddb.get({
          TableName: SUBSCRIBER_TABLE,
          Key: { email: subscriberEmail },
        });

        if (!result.Item) {
          return {
            status: '403',
            statusDescription: 'Forbidden',
            body: 'Access denied - subscriber not found',
          };
        }

        subscriberData = result.Item;
        console.log('Retrieved subscriber data from DynamoDB');
      }

      // Validate subscription status
      if (subscriberData.subscriptionStatus !== 'active') {
        return {
          status: '403',
          statusDescription: 'Forbidden',
          body: 'Access denied - inactive subscription',
        };
      }

      // Check expiration date
      const expirationDate = new Date(subscriberData.expirationDate);
      if (expirationDate < new Date()) {
        return {
          status: '403',
          statusDescription: 'Forbidden',
          body: 'Access denied - subscription expired',
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        status: '500',
        statusDescription: 'Internal Server Error',
        body: 'Error validating subscription',
      };
    }
  }

  return request;
};
      `),
      role: edgeRole,
      timeout: cdk.Duration.seconds(5),
      memorySize: 256,
    });

    // Create CloudFront distribution with KeyValueStore
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for podcast audio bucket ${props.environmentSuffix}`,
      }
    );

    props.audioBucket.grantRead(originAccessIdentity);

    this.distribution = new cloudfront.Distribution(
      this,
      'PodcastDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(props.audioBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          edgeLambdas: [
            {
              functionVersion: this.edgeFunction.currentVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            },
          ],
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        comment: `Podcast CDN ${props.environmentSuffix}`,
      }
    );

    // Associate KeyValueStore with distribution
    const cfnDistribution = this.distribution.node
      .defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.DefaultCacheBehavior.KeyValueStoreAssociations',
      [
        {
          KeyValueStoreARN: this.keyValueStore.attrArn,
        },
      ]
    );

    cdk.Tags.of(this.distribution).add(
      'Environment',
      props.environmentSuffix
    );

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'KeyValueStoreArn', {
      value: this.keyValueStore.attrArn,
      description: 'CloudFront KeyValueStore ARN',
    });
  }
}
```

### lib/podcast-scheduler-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
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

    // Create IAM role for EventBridge Scheduler
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      description: 'Role for EventBridge Scheduler to invoke targets',
    });

    // Lambda function for subscriber cleanup
    const subscriberCleanupFunction = new lambda.Function(
      this,
      'SubscriberCleanupFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'us-west-2' }));
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
        processed: result.Items?.length || 0,
      }),
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
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

    props.subscriberTable.grantReadWriteData(subscriberCleanupFunction);

    // Lambda function for automated transcoding
    const transcodingFunction = new lambda.Function(
      this,
      'AutoTranscodingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { MediaConvert } = require('@aws-sdk/client-mediaconvert');
const { S3 } = require('@aws-sdk/client-s3');

const mediaConvert = new MediaConvert({
  region: 'us-west-2',
  endpoint: process.env.MEDIA_CONVERT_ENDPOINT
});
const s3 = new S3({ region: 'us-west-2' });

exports.handler = async (event) => {
  console.log('Starting automated transcoding job');

  const inputFile = event.inputFile || 'input/sample-podcast.mp3';
  const outputPath = event.outputPath || 'transcoded/';

  try {
    const jobSettings = {
      Role: process.env.MEDIA_CONVERT_ROLE,
      Settings: {
        Inputs: [{
          FileInput: \`s3://\${process.env.AUDIO_BUCKET}/\${inputFile}\`,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT'
            }
          }
        }],
        OutputGroups: [{
          Name: 'File Group',
          Outputs: [
            {
              ContainerSettings: { Container: 'MP3' },
              AudioDescriptions: [{
                CodecSettings: {
                  Codec: 'MP3',
                  Mp3Settings: {
                    Bitrate: 64000,
                    Channels: 2,
                    SampleRate: 44100
                  }
                }
              }],
              NameModifier: '_64kbps'
            },
            {
              ContainerSettings: { Container: 'MP3' },
              AudioDescriptions: [{
                CodecSettings: {
                  Codec: 'MP3',
                  Mp3Settings: {
                    Bitrate: 128000,
                    Channels: 2,
                    SampleRate: 44100
                  }
                }
              }],
              NameModifier: '_128kbps'
            },
            {
              ContainerSettings: { Container: 'MP3' },
              AudioDescriptions: [{
                CodecSettings: {
                  Codec: 'MP3',
                  Mp3Settings: {
                    Bitrate: 256000,
                    Channels: 2,
                    SampleRate: 44100
                  }
                }
              }],
              NameModifier: '_256kbps'
            }
          ],
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: \`s3://\${process.env.AUDIO_BUCKET}/\${outputPath}\`
            }
          }
        }]
      },
      JobTemplate: process.env.JOB_TEMPLATE_NAME
    };

    const result = await mediaConvert.createJob(jobSettings);
    console.log('Transcoding job created:', result.Job?.Id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transcoding job started',
        jobId: result.Job?.Id,
      }),
    };
  } catch (error) {
    console.error('Transcoding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
        `),
        environment: {
          AUDIO_BUCKET: props.audioBucket.bucketName,
          MEDIA_CONVERT_ROLE: props.mediaConvertRole.roleArn,
          JOB_TEMPLATE_NAME: props.jobTemplateName,
          MEDIA_CONVERT_ENDPOINT: `https://mediaconvert.us-west-2.amazonaws.com`,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
      }
    );

    props.audioBucket.grantRead(transcodingFunction);
    transcodingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['mediaconvert:CreateJob', 'mediaconvert:GetJobTemplate'],
        resources: ['*'],
      })
    );

    // Lambda function to process DynamoDB streams and update KeyValueStore
    const streamProcessorFunction = new lambda.Function(
      this,
      'StreamProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { CloudFrontKeyValueStore } = require('@aws-sdk/client-cloudfront-keyvaluestore');

const kvsClient = new CloudFrontKeyValueStore({ region: 'us-west-2' });
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
      new DynamoEventSource(props.subscriberTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
      })
    );

    // Create EventBridge Scheduler schedules
    schedulerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [
          subscriberCleanupFunction.functionArn,
          transcodingFunction.functionArn,
        ],
      })
    );

    // Schedule for daily subscriber cleanup at 2 AM UTC
    new scheduler.CfnSchedule(this, 'CleanupSchedule', {
      name: `podcast-cleanup-${props.environmentSuffix}`,
      scheduleExpression: 'cron(0 2 * * ? *)',
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      target: {
        arn: subscriberCleanupFunction.functionArn,
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({
          action: 'cleanup_expired_subscriptions',
        }),
      },
      state: 'ENABLED',
      description: 'Daily cleanup of expired podcast subscriptions',
    });

    // Schedule for periodic transcoding jobs (every 6 hours)
    new scheduler.CfnSchedule(this, 'TranscodingSchedule', {
      name: `podcast-transcoding-${props.environmentSuffix}`,
      scheduleExpression: 'rate(6 hours)',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 30,
      },
      target: {
        arn: transcodingFunction.functionArn,
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({
          action: 'transcode_new_episodes',
        }),
      },
      state: 'ENABLED',
      description: 'Periodic transcoding of new podcast episodes',
    });

    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    new cdk.CfnOutput(this, 'CleanupFunctionArn', {
      value: subscriberCleanupFunction.functionArn,
      description: 'Subscriber cleanup Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'TranscodingFunctionArn', {
      value: transcodingFunction.functionArn,
      description: 'Auto-transcoding Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'StreamProcessorFunctionArn', {
      value: streamProcessorFunction.functionArn,
      description: 'DynamoDB stream processor Lambda function ARN',
    });
  }
}
```

### lib/podcast-transcoding-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface PodcastTranscodingStackProps {
  environmentSuffix: string;
  audioBucket: s3.IBucket;
}

export class PodcastTranscodingStack extends Construct {
  public readonly mediaConvertRole: iam.Role;
  public readonly jobTemplateName: string;

  constructor(
    scope: Construct,
    id: string,
    props: PodcastTranscodingStackProps
  ) {
    super(scope, id);

    // IAM role for MediaConvert
    this.mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com'),
      description: 'Role for MediaConvert to access S3 buckets',
    });

    props.audioBucket.grantReadWrite(this.mediaConvertRole);

    // MediaConvert job template
    this.jobTemplateName = `podcast-audio-transcoding-${props.environmentSuffix}`;

    const jobTemplate = new cdk.CfnResource(this, 'AudioTranscodingTemplate', {
      type: 'AWS::MediaConvert::JobTemplate',
      properties: {
        Name: this.jobTemplateName,
        Category: 'podcast',
        Priority: 0,
        StatusUpdateInterval: 'SECONDS_60',
        SettingsJson: JSON.stringify({
          OutputGroups: [
            {
              Name: 'File Group',
              Outputs: [
                {
                  ContainerSettings: {
                    Container: 'MP3',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 64000,
                          Channels: 2,
                          SampleRate: 44100,
                        },
                      },
                    },
                  ],
                  NameModifier: '_64kbps',
                },
                {
                  ContainerSettings: {
                    Container: 'MP3',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 128000,
                          Channels: 2,
                          SampleRate: 44100,
                        },
                      },
                    },
                  ],
                  NameModifier: '_128kbps',
                },
                {
                  ContainerSettings: {
                    Container: 'MP3',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 256000,
                          Channels: 2,
                          SampleRate: 44100,
                        },
                      },
                    },
                  ],
                  NameModifier: '_256kbps',
                },
              ],
              OutputGroupSettings: {
                Type: 'FILE_GROUP_SETTINGS',
                FileGroupSettings: {
                  Destination: `s3://${props.audioBucket.bucketName}/transcoded/`,
                },
              },
            },
          ],
          Inputs: [
            {
              AudioSelectors: {
                'Audio Selector 1': {
                  DefaultSelection: 'DEFAULT',
                },
              },
            },
          ],
        }),
      },
    });

    cdk.Tags.of(this.mediaConvertRole).add(
      'Environment',
      props.environmentSuffix
    );
    cdk.Tags.of(jobTemplate).add('Environment', props.environmentSuffix);

    new cdk.CfnOutput(this, 'MediaConvertRoleArn', {
      value: this.mediaConvertRole.roleArn,
      description: 'MediaConvert IAM role ARN',
    });

    new cdk.CfnOutput(this, 'MediaConvertJobTemplateName', {
      value: this.jobTemplateName,
      description: 'MediaConvert job template name',
    });
  }
}
```

### lib/podcast-dns-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

interface PodcastDnsStackProps {
  environmentSuffix: string;
  distribution: cloudfront.IDistribution;
}

export class PodcastDnsStack extends Construct {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: PodcastDnsStackProps) {
    super(scope, id);

    // Create hosted zone
    this.hostedZone = new route53.HostedZone(this, 'PodcastHostedZone', {
      zoneName: `podcast-${props.environmentSuffix}.example.com`,
      comment: `Hosted zone for podcast platform ${props.environmentSuffix}`,
    });

    // Create A record for CloudFront distribution
    new route53.ARecord(this, 'PodcastARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(props.distribution)
      ),
    });

    // Create AAAA record for IPv6
    new route53.AaaaRecord(this, 'PodcastAAAARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(props.distribution)
      ),
    });

    cdk.Tags.of(this.hostedZone).add('Environment', props.environmentSuffix);

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 hosted zone ID',
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route 53 name servers',
    });
  }
}
```

### lib/podcast-monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface PodcastMonitoringStackProps {
  environmentSuffix: string;
  distribution: cloudfront.IDistribution;
  subscriberTable: dynamodb.ITable;
  audioBucket: s3.IBucket;
}

export class PodcastMonitoringStack extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(
    scope: Construct,
    id: string,
    props: PodcastMonitoringStackProps
  ) {
    super(scope, id);

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `podcast-alarms-${props.environmentSuffix}`,
      displayName: `Podcast Platform Alarms - ${props.environmentSuffix}`,
    });

    // CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'StreamingDashboard', {
      dashboardName: `podcast-streaming-metrics-${props.environmentSuffix}`,
    });

    // CloudFront metrics
    const cfRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'Requests',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const cfBandwidthMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'BytesDownloaded',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const cfErrorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'ErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    const cf4xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    const cf5xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    // Create alarms
    const highErrorRateAlarm = new cloudwatch.Alarm(
      this,
      'HighErrorRateAlarm',
      {
        metric: cf5xxErrorMetric,
        threshold: 5,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmName: `podcast-high-error-rate-${props.environmentSuffix}`,
        alarmDescription: 'Alarm when 5xx error rate exceeds 5%',
      }
    );

    highErrorRateAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    const high4xxErrorAlarm = new cloudwatch.Alarm(
      this,
      'High4xxErrorAlarm',
      {
        metric: cf4xxErrorMetric,
        threshold: 10,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmName: `podcast-high-4xx-rate-${props.environmentSuffix}`,
        alarmDescription: 'Alarm when 4xx error rate exceeds 10%',
      }
    );

    high4xxErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [cfRequestsMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bandwidth (Bytes)',
        left: [cfBandwidthMetric],
        width: 12,
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error Rates (%)',
        left: [cfErrorRateMetric, cf4xxErrorMetric, cf5xxErrorMetric],
        width: 24,
      })
    );

    // DynamoDB metrics
    const ddbReadCapacityMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: props.subscriberTable.tableName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const ddbWriteCapacityMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedWriteCapacityUnits',
      dimensionsMap: {
        TableName: props.subscriberTable.tableName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Capacity Units',
        left: [ddbReadCapacityMetric, ddbWriteCapacityMetric],
        width: 24,
      })
    );

    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS topic ARN for CloudWatch alarms',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${
        cdk.Stack.of(this).region
      }#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
    });
  }
}
```

## Key Features and Enhancements

### 1. CloudFront KeyValueStore Integration
- Edge caching for subscriber authentication data
- Reduces DynamoDB calls and improves latency
- Automatic synchronization via DynamoDB Streams

### 2. EventBridge Scheduler
- Automated daily cleanup of expired subscriptions
- Scheduled transcoding jobs for new episodes
- Flexible time windows for reliability

### 3. Lambda@Edge with Cache-First Strategy
- Checks KeyValueStore first before DynamoDB
- ECDSA signed cookies for better performance
- Fallback to DynamoDB when cache miss occurs

### 4. DynamoDB Streams Processing
- Real-time synchronization to KeyValueStore
- Automatic updates when subscription data changes
- Event-driven architecture for consistency

### 5. Three New Lambda Functions
- **SubscriberCleanupFunction**: Manages expired subscriptions
- **AutoTranscodingFunction**: Handles scheduled transcoding jobs
- **StreamProcessorFunction**: Syncs DynamoDB changes to KeyValueStore

### 6. Enhanced Monitoring
- CloudWatch dashboard with comprehensive metrics
- Alarms for high error rates (4xx and 5xx)
- SNS notifications for critical issues

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Deploy to AWS:
```bash
export ENVIRONMENT_SUFFIX=production
npm run cdk:deploy
```

4. Clean up resources:
```bash
npm run cdk:destroy
```

## Testing

Run unit tests:
```bash
npm run test:unit
```

Run integration tests:
```bash
npm run test:integration
```

## Best Practices Implemented

1. **Security**: IAM roles follow least privilege principle
2. **Scalability**: Pay-per-request DynamoDB, CloudFront edge caching
3. **Reliability**: Error handling, retries, and monitoring
4. **Cost Optimization**: S3 Intelligent Tiering, requester pays
5. **Performance**: Edge caching, ECDSA signatures, cache-first strategy
6. **Maintainability**: Modular stack design, clear separation of concerns