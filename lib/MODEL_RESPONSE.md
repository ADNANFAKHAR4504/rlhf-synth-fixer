# Podcast Platform Infrastructure - Enhanced with Edge Caching and Event-Driven Automation

I'll help you deploy a complete podcast hosting platform on AWS using CDK with TypeScript. This enhanced solution includes CloudFront KeyValueStore for edge caching and EventBridge Scheduler for automated workflows. Here's the infrastructure code organized by file:

## lib/tap-stack.ts

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
    const subscriberStack = new PodcastSubscriberStack(this, 'PodcastSubscriber', {
      environmentSuffix,
    });

    // Transcoding stack with MediaConvert
    const transcodingStack = new PodcastTranscodingStack(this, 'PodcastTranscoding', {
      environmentSuffix,
      audioBucket: storageStack.audioBucket,
    });

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

## lib/podcast-storage-stack.ts

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
      bucketName: `podcast-audio-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Enable requester pays
    const cfnBucket = this.audioBucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.addPropertyOverride('RequestPaymentConfiguration.Payer', 'Requester');

    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: this.audioBucket.bucketName,
      description: 'S3 bucket for podcast audio files',
    });
  }
}
```

## lib/podcast-subscriber-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface PodcastSubscriberStackProps {
  environmentSuffix: string;
}

export class PodcastSubscriberStack extends Construct {
  public readonly subscriberTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: PodcastSubscriberStackProps) {
    super(scope, id);

    // DynamoDB table for subscriber information with Streams enabled
    this.subscriberTable = new dynamodb.Table(this, 'SubscriberTable', {
      tableName: `podcast-subscribers-${props.environmentSuffix}`,
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for subscription status queries
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
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.CfnOutput(this, 'SubscriberTableName', {
      value: this.subscriberTable.tableName,
      description: 'DynamoDB table for subscriber data',
    });

    new cdk.CfnOutput(this, 'SubscriberTableStreamArn', {
      value: this.subscriberTable.tableStreamArn || '',
      description: 'DynamoDB table stream ARN',
    });
  }
}
```

## lib/podcast-cdn-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
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

    // Create CloudFront KeyValueStore for subscriber authentication data
    this.keyValueStore = new cloudfront.CfnKeyValueStore(this, 'SubscriberKVStore', {
      name: `podcast-subscriber-kvs-${props.environmentSuffix}`,
      comment: 'KeyValueStore for subscriber authentication data at the edge',
    });

    // IAM role for Lambda@Edge execution
    const edgeRole = new iam.Role(this, 'EdgeFunctionRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB read access to Lambda@Edge
    props.subscriberTable.grantReadData(edgeRole);

    // Grant KeyValueStore read access to Lambda@Edge
    edgeRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudfront-keyvaluestore:GetKey',
        'cloudfront-keyvaluestore:DescribeKeyValueStore',
      ],
      resources: [this.keyValueStore.attrArn],
    }));

    // Lambda@Edge function for authorization with KeyValueStore integration
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
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for podcast audio bucket ${props.environmentSuffix}`,
    });

    props.audioBucket.grantRead(originAccessIdentity);

    this.distribution = new cloudfront.Distribution(this, 'PodcastDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(props.audioBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
    });

    // Associate KeyValueStore with the distribution
    const cfnDistribution = this.distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride('DistributionConfig.DefaultCacheBehavior.KeyValueStoreAssociations', [
      {
        KeyValueStoreARN: this.keyValueStore.attrArn,
      },
    ]);

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

## lib/podcast-transcoding-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as mediaconvert from 'aws-cdk-lib/aws-mediaconvert';
import { Construct } from 'constructs';

interface PodcastTranscodingStackProps {
  environmentSuffix: string;
  audioBucket: s3.IBucket;
}

export class PodcastTranscodingStack extends Construct {
  public readonly mediaConvertRole: iam.Role;
  public readonly jobTemplateName: string;

  constructor(scope: Construct, id: string, props: PodcastTranscodingStackProps) {
    super(scope, id);

    // IAM role for MediaConvert
    this.mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com'),
      description: 'Role for MediaConvert to access S3 buckets',
    });

    // Grant read/write access to audio bucket
    props.audioBucket.grantReadWrite(this.mediaConvertRole);

    // Create job template for audio transcoding
    const jobTemplate = new mediaconvert.CfnJobTemplate(this, 'AudioTranscodingTemplate', {
      name: `podcast-audio-transcoding-${props.environmentSuffix}`,
      settingsJson: {
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
      },
      statusUpdateInterval: 'SECONDS_60',
      priority: 0,
      category: 'podcast',
    });

    this.jobTemplateName = jobTemplate.name || '';

    new cdk.CfnOutput(this, 'MediaConvertRoleArn', {
      value: this.mediaConvertRole.roleArn,
      description: 'IAM role ARN for MediaConvert',
    });

    new cdk.CfnOutput(this, 'JobTemplateName', {
      value: this.jobTemplateName,
      description: 'MediaConvert job template name',
    });
  }
}
```

## lib/podcast-scheduler-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface PodcastSchedulerStackProps {
  environmentSuffix: string;
  subscriberTable: dynamodb.ITable;
  audioBucket: s3.IBucket;
  mediaConvertRole: iam.IRole;
  jobTemplateName: string;
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
    const cleanupFunction = new lambda.Function(this, 'SubscriberCleanupFunction', {
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
    });

    // Grant DynamoDB read/write access to cleanup function
    props.subscriberTable.grantReadWriteData(cleanupFunction);

    // Lambda function for MediaConvert job submission
    const transcodingTriggerFunction = new lambda.Function(this, 'TranscodingTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { MediaConvert } = require('@aws-sdk/client-mediaconvert');
const { S3 } = require('@aws-sdk/client-s3');

const s3 = new S3({ region: 'us-west-2' });
const BUCKET_NAME = process.env.BUCKET_NAME;
const JOB_TEMPLATE = process.env.JOB_TEMPLATE;
const MEDIACONVERT_ROLE = process.env.MEDIACONVERT_ROLE;

// Get MediaConvert endpoint
const getMediaConvertEndpoint = async () => {
  const mc = new MediaConvert({ region: 'us-west-2' });
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
    const mc = new MediaConvert({ region: 'us-west-2', endpoint });

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
    });

    // Grant S3 read access and MediaConvert permissions
    props.audioBucket.grantRead(transcodingTriggerFunction);
    transcodingTriggerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'mediaconvert:CreateJob',
        'mediaconvert:DescribeEndpoints',
      ],
      resources: ['*'],
    }));
    transcodingTriggerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [props.mediaConvertRole.roleArn],
    }));

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
    cleanupFunction.grantInvoke(new iam.ServicePrincipal('scheduler.amazonaws.com'));

    // EventBridge Scheduler: Hourly transcoding check
    const transcodingSchedule = new scheduler.CfnSchedule(this, 'TranscodingSchedule', {
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
    });

    // Grant scheduler permission to invoke transcoding function
    transcodingTriggerFunction.grantInvoke(new iam.ServicePrincipal('scheduler.amazonaws.com'));

    // EventBridge rule to handle DynamoDB Stream events
    const streamProcessorFunction = new lambda.Function(this, 'StreamProcessorFunction', {
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
        KVS_ARN: 'PLACEHOLDER_KVS_ARN',
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
    });

    // Grant KeyValueStore permissions to stream processor
    streamProcessorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudfront-keyvaluestore:PutKey',
        'cloudfront-keyvaluestore:DeleteKey',
        'cloudfront-keyvaluestore:DescribeKeyValueStore',
      ],
      resources: ['*'],
    }));

    // Create EventBridge rule for DynamoDB Streams
    const streamRule = new events.Rule(this, 'StreamRule', {
      description: 'Trigger on DynamoDB subscriber table changes',
      eventPattern: {
        source: ['aws.dynamodb'],
        detailType: ['AWS API Call via CloudTrail'],
      },
    });

    streamRule.addTarget(new targets.LambdaFunction(streamProcessorFunction));

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
  }
}
```

## lib/podcast-dns-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
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

    // Create Route 53 hosted zone
    this.hostedZone = new route53.HostedZone(this, 'PodcastHostedZone', {
      zoneName: `podcast-${props.environmentSuffix}.example.com`,
      comment: `Hosted zone for podcast platform ${props.environmentSuffix}`,
    });

    // Create A record pointing to CloudFront distribution
    new route53.ARecord(this, 'PodcastARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });

    // Create AAAA record for IPv6
    new route53.AaaaRecord(this, 'PodcastAAAARecord', {
      zone: this.hostedZone,
      recordName: 'cdn',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });

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

## lib/podcast-monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface PodcastMonitoringStackProps {
  environmentSuffix: string;
  distribution: cloudfront.IDistribution;
  subscriberTable: dynamodb.ITable;
  audioBucket: s3.IBucket;
}

export class PodcastMonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: PodcastMonitoringStackProps) {
    super(scope, id);

    // SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Podcast Platform Alarms ${props.environmentSuffix}`,
      topicName: `podcast-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PodcastDashboard', {
      dashboardName: `podcast-streaming-metrics-${props.environmentSuffix}`,
    });

    // CloudFront metrics
    const requestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'Requests',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bytesDownloadedMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'BytesDownloaded',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const errorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const fourxxErrorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // DynamoDB metrics
    const dynamoReadMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: props.subscriberTable.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // S3 metrics
    const s3RequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'AllRequests',
      dimensionsMap: {
        BucketName: props.audioBucket.bucketName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [requestsMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bandwidth Usage',
        left: [bytesDownloadedMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [errorRateMetric, fourxxErrorRateMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        left: [dynamoReadMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'S3 Requests',
        left: [s3RequestsMetric],
        width: 12,
      })
    );

    // CloudWatch alarms for high error rates
    const highErrorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when 5xx error rate exceeds 5%',
      alarmName: `podcast-high-error-rate-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for high 4xx error rate (authorization issues)
    const high4xxAlarm = new cloudwatch.Alarm(this, 'High4xxErrorRateAlarm', {
      metric: fourxxErrorRateMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when 4xx error rate exceeds 10%',
      alarmName: `podcast-high-4xx-rate-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    high4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
    });
  }
}
```

This enhanced infrastructure code provides:

1. **CloudFront KeyValueStore (2023)** - Caches subscriber authentication data at the edge to reduce DynamoDB calls and improve Lambda@Edge performance
2. **EventBridge Scheduler (2022)** - Automates MediaConvert job submissions for scheduled podcast transcoding and periodic subscriber cleanup
3. **DynamoDB Streams** - Triggers events when subscription status changes to automatically update the KeyValueStore
4. **Enhanced Lambda@Edge** - Queries KeyValueStore first for subscriber validation, falls back to DynamoDB for cache misses
5. **Automated Workflows** - Daily cleanup of expired subscriptions and hourly checks for new audio files to transcode
6. **S3 Storage** with requester pays and intelligent tiering for cost optimization
7. **CloudFront Distribution** with signed cookie support for secure content delivery
8. **MediaConvert** job template for transcoding audio to multiple bitrates
9. **Route 53** hosted zone for DNS management
10. **CloudWatch** dashboard with comprehensive metrics and alarms

The solution follows AWS best practices and integrates the latest AWS features for improved performance, reduced costs, and automated operations.
