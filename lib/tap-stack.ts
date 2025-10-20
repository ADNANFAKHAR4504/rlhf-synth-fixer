import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
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

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const userPreferencesTable = new dynamodb.Table(
      this,
      'UserPreferencesTable',
      {
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
      }
    );

    userPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'preferenceTypeIndex',
      partitionKey: {
        name: 'preferenceType',
        type: dynamodb.AttributeType.STRING,
      },
    });

    const engagementTrackingTable = new dynamodb.Table(
      this,
      'EngagementTrackingTable',
      {
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
      }
    );

    engagementTrackingTable.addGlobalSecondaryIndex({
      indexName: 'contentIdIndex',
      partitionKey: {
        name: 'contentId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    const personalizationFunction = new cloudfront.experimental.EdgeFunction(
      this,
      'PersonalizationFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const userId = headers['x-user-id'] ? headers['x-user-id'][0].value : 'anonymous';
  request.headers['x-personalized-user'] = [{ key: 'X-Personalized-User', value: userId }];
  return request;
};
        `),
        memorySize: 128,
      }
    );

    personalizationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:GetItem', 'dynamodb:Query'],
        resources: [
          userPreferencesTable.tableArn,
          `${userPreferencesTable.tableArn}/index/*`,
        ],
      })
    );

    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(
      this,
      'EngagementTrackingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  response.headers['x-engagement-tracked'] = [{ key: 'X-Engagement-Tracked', value: 'true' }];
  return response;
};
        `),
        memorySize: 128,
      }
    );

    engagementTrackingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [engagementTrackingTable.tableArn],
      })
    );

    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        edgeLambdas: [
          {
            functionVersion: personalizationFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
          {
            functionVersion: engagementTrackingFunction.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
          },
        ],
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NewsDashboard', {
      dashboardName: `NewsPersonalizationDashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: distribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda@Edge Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: personalizationFunction.functionName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: userPreferencesTable.tableName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      exportName: `${this.stackName}-DistributionDomainName`,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
      exportName: `${this.stackName}-ContentBucketName`,
    });

    new cdk.CfnOutput(this, 'UserPreferencesTableName', {
      value: userPreferencesTable.tableName,
      exportName: `${this.stackName}-UserPreferencesTableName`,
    });

    new cdk.CfnOutput(this, 'EngagementTrackingTableName', {
      value: engagementTrackingTable.tableName,
      exportName: `${this.stackName}-EngagementTrackingTableName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: `${this.stackName}-DistributionId`,
    });
  }
}
