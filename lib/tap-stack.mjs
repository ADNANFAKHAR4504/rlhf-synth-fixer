import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix = 'dev', isPrimary = true } = props;
    const isLocalStack = !!process.env.AWS_ENDPOINT_URL;

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      enableKeyRotation: true,
      description: `Global API KMS Key - ${environmentSuffix}`,
      alias: `alias/global-api-${environmentSuffix}`,
    });

    // VPC - skip in LocalStack
    let vpc;
    if (!isLocalStack) {
      vpc = new ec2.Vpc(this, 'TapVpc', {
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      });
    }

    // DynamoDB Global Table
    const table = new dynamodb.Table(this, 'TapTable', {
      tableName: `global-api-table-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI only for primary stack
    if (isPrimary) {
      table.addGlobalSecondaryIndex({
        indexName: 'gsi1',
        partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
      });
    }

    // S3 Buckets
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `global-api-assets-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `global-api-backups-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EventBridge Event Bus
    const eventBus = new events.EventBus(this, 'TapEventBus', {
      eventBusName: `global-api-events-${environmentSuffix}`,
    });

    // Cross-region event forwarding (primary only)
    if (isPrimary) {
      const defaultEventBus = events.EventBus.fromEventBusName(this, 'DefaultEventBus', 'default');
      new events.Rule(this, 'CrossRegionEventForwarding', {
        eventBus: eventBus,
        eventPattern: {
          source: ['global-api.events'],
        },
        targets: [
          new targets.EventBridgeTarget(defaultEventBus),
        ],
      });
    }

    // Lambda Function with inline code (no asset path needed)
    const lambdaFunction = new lambda.Function(this, 'TapLambda', {
      functionName: `global-api-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Global API is running',
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION,
      environment: process.env.ENVIRONMENT_SUFFIX || 'dev'
    })
  };
  
  if (event.path === '/health') {
    response.body = JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }
  
  return response;
};
      `),
      environment: {
        TABLE_NAME: table.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: this.region,
        EVENT_BUS: eventBus.eventBusName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
    });

    // Lambda permissions
    table.grantReadWriteData(lambdaFunction);
    assetBucket.grantReadWrite(lambdaFunction);
    backupBucket.grantReadWrite(lambdaFunction);
    eventBus.grantPutEventsTo(lambdaFunction);

    // Lambda alias with provisioned concurrency
    const lambdaAlias = new lambda.Alias(this, 'TapLambdaAlias', {
      aliasName: 'production',
      version: lambdaFunction.currentVersion,
      provisionedConcurrencyConfig: {
        provisionedConcurrentExecutions: 50,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `global-api-${environmentSuffix}`,
      description: `Global API for ${environmentSuffix} environment`,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      cloudWatchRole: true,
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaAlias);

    // Root endpoint
    api.root.addMethod('GET', lambdaIntegration);

    // Health endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // API Gateway Stage
    const stage = new apigateway.Stage(this, 'TapApiStage', {
      deployment: new apigateway.Deployment(this, 'TapApiDeployment', {
        api: api,
      }),
      stageName: 'prod',
      tracingEnabled: true,
      methodOptions: {
        '/*/*': {
          dataTraceEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
        },
      },
    });

    // WAF
    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'TapWebAcl',
      },
    });

    // CloudWatch Monitoring
    // Lambda error alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function error rate',
    });

    // API Gateway error alarm
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiGatewayErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway error rate',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `tap-monitoring-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Metrics',
        left: [lambdaFunction.metricDuration(), lambdaFunction.metricErrors()],
      })
    );

    // Canary monitoring (synthetic tests)
    if (!isLocalStack) {
      const canary = new synthetics.Canary(this, 'TapCanary', {
        canaryName: `global-api-canary-${environmentSuffix}`,
        schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
        test: synthetics.Test.custom({
          code: synthetics.Code.fromInline(`
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiUrl = '${api.url}';

const checkApi = async function () {
    return await synthetics.executeStep('checkHealthEndpoint', async function () {
        const options = {
            hostname: new URL(apiUrl).hostname,
            path: '/health',
            method: 'GET'
        };
        
        const response = await synthetics.executeHttpStep('health-check', options);
        return response;
    });
};

exports.handler = async () => {
    return await synthetics.executeStep('canary', async function () {
        await checkApi();
    });
};
          `),
          handler: 'index.handler',
        }),
        runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2,
      });
    }

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 asset bucket name',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 backup bucket name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge event bus name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
