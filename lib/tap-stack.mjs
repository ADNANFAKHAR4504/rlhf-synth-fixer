import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix, isPrimary } = props;

    // Create KMS key with rotation
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for TAP ${environmentSuffix}`,
    });

    // Create KMS key alias
    new kms.Alias(this, 'EncryptionKeyAlias', {
      aliasName: `alias/tap-${environmentSuffix}`,
      targetKey: kmsKey,
    });

    // Create DynamoDB Global Table
    const table = new dynamodb.TableV2(this, 'TapTable', {
      tableName: `tap-table-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      encryption: dynamodb.TableEncryption.customerManagedKey(kmsKey),
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      streamSpecification: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      replicas: [
        {
          region: props.env.region,
          pointInTimeRecovery: true,
        },
      ],
    });

    // Create S3 buckets
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `tap-assets-${environmentSuffix}-${props.env.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `tap-backups-${environmentSuffix}-${props.env.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create EventBridge event bus
    const eventBus = new events.EventBus(this, 'TapEventBus', {
      eventBusName: `tap-events-${environmentSuffix}`,
    });

    // Create cross-region event forwarding rule (primary only)
    if (isPrimary) {
      new events.Rule(this, 'CrossRegionEventRule', {
        eventBus,
        eventPattern: {
          source: ['global-api.events'],
        },
        targets: [
          new targets.EventBus(eventBus),
        ],
      });
    }

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'TapFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' }),
          };
        };
      `),
      environment: {
        TABLE_NAME: table.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: props.env.region,
        EVENT_BUS: eventBus.eventBusName,
      },
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
    });

    // Create Lambda alias with provisioned concurrency
    const alias = new lambda.Alias(this, 'ProductionAlias', {
      aliasName: 'production',
      version: lambdaFunction.currentVersion,
      provisionedConcurrentExecutions: 50,
    });

    // Grant permissions
    table.grantReadWriteData(lambdaFunction);
    assetBucket.grantReadWrite(lambdaFunction);
    backupBucket.grantReadWrite(lambdaFunction);
    eventBus.grantPutEventsTo(lambdaFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-api-${environmentSuffix}`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Add Lambda integration
    const integration = new apigateway.LambdaIntegration(lambdaFunction);
    api.root.addMethod('ANY', integration);

    // Create WAF WebACL
    const webAcl = new waf.CfnWebACL(this, 'TapWebAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'TapWebAcl',
      },
    });

    // Associate WAF with API Gateway
    new waf.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `tap-dashboard-${environmentSuffix}`,
    });

    // Create CloudWatch Alarms
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
    });

    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 1,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}
