import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
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
    this.keyValueStore = new cloudfront.CfnKeyValueStore(
      this,
      'SubscriberKVStore',
      {
        name: `podcast-subscriber-kvs-${props.environmentSuffix}`,
        comment: 'KeyValueStore for subscriber authentication data at the edge',
      }
    );

    // IAM role for Lambda@Edge execution
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

    // Grant DynamoDB read access to Lambda@Edge
    props.subscriberTable.grantReadData(edgeRole);

    // Grant KeyValueStore read access to Lambda@Edge
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

    // Lambda@Edge function for authorization with KeyValueStore integration
    this.edgeFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { CloudFrontKeyValueStore } = require('@aws-sdk/client-cloudfront-keyvaluestore');

const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'us-east-1' }));
const kvsClient = new CloudFrontKeyValueStore({ region: 'us-east-1' });
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

    // Associate KeyValueStore with the distribution
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
