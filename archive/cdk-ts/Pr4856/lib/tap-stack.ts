import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';
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

    // KMS Keys for encryption
    const s3EncryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dynamoEncryptionKey = new kms.Key(this, 'DynamoEncryptionKey', {
      description: 'KMS key for DynamoDB table encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for CloudWatch Alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `NewsPersonalization-Alarms-${environmentSuffix}`,
    });

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Add tags to S3 bucket
    cdk.Tags.of(contentBucket).add('Service', 'NewsPersonalization');
    cdk.Tags.of(contentBucket).add('Component', 'ContentStorage');
    cdk.Tags.of(contentBucket).add('Environment', environmentSuffix);

    const userPreferencesTable = new dynamodb.Table(
      this,
      'UserPreferencesTable',
      {
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dynamoEncryptionKey,
      }
    );

    // Add tags to user preferences table
    cdk.Tags.of(userPreferencesTable).add('Service', 'NewsPersonalization');
    cdk.Tags.of(userPreferencesTable).add('Component', 'UserData');
    cdk.Tags.of(userPreferencesTable).add('Environment', environmentSuffix);

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
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dynamoEncryptionKey,
      }
    );

    // Add tags to engagement tracking table
    cdk.Tags.of(engagementTrackingTable).add('Service', 'NewsPersonalization');
    cdk.Tags.of(engagementTrackingTable).add('Component', 'Analytics');
    cdk.Tags.of(engagementTrackingTable).add('Environment', environmentSuffix);

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
        handler: 'personalization.handler',
        code: lambda.Code.fromAsset('lib/lambda'),
        memorySize: 128,
        tracing: lambda.Tracing.ACTIVE,
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

    // Add X-Ray permissions for personalization function
    personalizationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    const engagementTrackingFunction = new cloudfront.experimental.EdgeFunction(
      this,
      'EngagementTrackingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'engagement-tracking.handler',
        code: lambda.Code.fromAsset('lib/lambda'),
        memorySize: 128,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    engagementTrackingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [engagementTrackingTable.tableArn],
      })
    );

    // Add X-Ray permissions for engagement tracking function
    engagementTrackingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'OAI for News Personalization Platform',
      }
    );

    // Grant CloudFront read access to the S3 bucket
    contentBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(contentBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
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

    // CloudWatch Alarms for operational monitoring

    // Lambda@Edge Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      'LambdaEdgeErrorAlarm',
      {
        alarmName: `NewsPersonalization-LambdaEdge-Errors-${environmentSuffix}`,
        alarmDescription: 'Alert when Lambda@Edge error rate exceeds threshold',
        metric: personalizationFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // CloudFront 5xx Error Rate Alarm
    const cloudFrontErrorAlarm = new cloudwatch.Alarm(
      this,
      'CloudFront5xxErrorAlarm',
      {
        alarmName: `NewsPersonalization-CloudFront-5xxErrors-${environmentSuffix}`,
        alarmDescription: 'Alert when CloudFront 5xx error rate is high',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '5xxErrorRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5, // 5% error rate
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    cloudFrontErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // DynamoDB Throttling Alarm for User Preferences
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBThrottleAlarm',
      {
        alarmName: `NewsPersonalization-DynamoDB-Throttles-${environmentSuffix}`,
        alarmDescription: 'Alert when DynamoDB requests are being throttled',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'UserErrors',
          dimensionsMap: {
            TableName: userPreferencesTable.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // DynamoDB System Errors Alarm
    const dynamoSystemErrorAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBSystemErrorAlarm',
      {
        alarmName: `NewsPersonalization-DynamoDB-SystemErrors-${environmentSuffix}`,
        alarmDescription: 'Alert when DynamoDB system errors occur',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'SystemErrors',
          dimensionsMap: {
            TableName: engagementTrackingTable.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    dynamoSystemErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Add tags to Lambda functions
    cdk.Tags.of(personalizationFunction).add('Service', 'NewsPersonalization');
    cdk.Tags.of(personalizationFunction).add('Component', 'EdgeCompute');
    cdk.Tags.of(personalizationFunction).add('Environment', environmentSuffix);

    cdk.Tags.of(engagementTrackingFunction).add(
      'Service',
      'NewsPersonalization'
    );
    cdk.Tags.of(engagementTrackingFunction).add('Component', 'EdgeCompute');
    cdk.Tags.of(engagementTrackingFunction).add(
      'Environment',
      environmentSuffix
    );

    // Add tags to CloudFront distribution
    cdk.Tags.of(distribution).add('Service', 'NewsPersonalization');
    cdk.Tags.of(distribution).add('Component', 'CDN');
    cdk.Tags.of(distribution).add('Environment', environmentSuffix);

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

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      exportName: `${this.stackName}-AlarmTopicArn`,
      description: 'SNS Topic ARN for CloudWatch Alarm notifications',
    });
  }
}
