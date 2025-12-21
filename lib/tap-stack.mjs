import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix = 'dev', isPrimary = true } = props;
    const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
    const region = this.region;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'TapEncryptionKey', {
      description: `Global API encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new kms.Alias(this, 'TapEncryptionKeyAlias', {
      aliasName: `alias/tap-global-api-${environmentSuffix}`,
      targetKey: encryptionKey,
    });

    // VPC for Lambda functions (only if not LocalStack as NAT Gateway doesn't work)
    let vpc;
    if (!isLocalStack) {
      vpc = new ec2.Vpc(this, 'TapVpc', {
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      });
    }

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'TapGlobalTable', {
      tableName: `tap-global-table-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add global table replication for primary stack
    if (isPrimary) {
      // Add replica in us-west-2
      dynamoTable.addGlobalSecondaryIndex({
        indexName: 'gsi1',
        partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
      });
    }

    // S3 Buckets
    const assetBucket = new s3.Bucket(this, 'TapAssetBucket', {
      bucketName: `tap-assets-${environmentSuffix}-${this.account}-${region}`,
      versioned: true,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const backupBucket = new s3.Bucket(this, 'TapBackupBucket', {
      bucketName: `tap-backups-${environmentSuffix}-${this.account}-${region}`,
      versioned: true,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'transition-to-glacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // EventBridge Event Bus
    const eventBus = new events.EventBus(this, 'TapEventBus', {
      eventBusName: `tap-events-${environmentSuffix}`,
    });

    // Cross-region event forwarding rule (primary only)
    if (isPrimary) {
      new events.Rule(this, 'CrossRegionForwardingRule', {
        eventBus: eventBus,
        ruleName: `cross-region-forwarding-${environmentSuffix}`,
        eventPattern: {
          source: ['global-api.events'],
        },
        targets: [
          new targets.EventBus(events.EventBus.fromEventBusName(this, 'DefaultEventBus', 'default')),
        ],
      });
    }

    // Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'TapLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dynamoTable.tableArn, `${dynamoTable.tableArn}/index/*`],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `${assetBucket.bucketArn}/*`,
                `${backupBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        EventBridgeAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: [eventBus.eventBusArn],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, 'TapLambdaFunction', {
      functionName: `tap-global-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'src', 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: region,
        EVENT_BUS: eventBus.eventBusName,
        KMS_KEY_ID: encryptionKey.keyId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      vpc: vpc,
      vpcSubnets: vpc ? { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS } : undefined,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Lambda Alias for Production
    const productionAlias = new lambda.Alias(this, 'TapLambdaProductionAlias', {
      aliasName: 'production',
      version: lambdaFunction.currentVersion,
      provisionedConcurrencyConfig: {
        provisionedConcurrentExecutions: 50,
      },
    });

    // API Gateway CloudWatch Role
    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
    });

    // API Gateway Account (for CloudWatch logs)
    new apigateway.Account(this, 'ApiGatewayAccount', {
      cloudWatchRole: apiGatewayCloudWatchRole,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-global-api-${environmentSuffix}`,
      description: `Global API for TAP system (${environmentSuffix})`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiAccessLogs', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          })
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        methodOptions: {
          '/*/*': {
            dataTraceEnabled: true,
            loggingLevel: apigateway.MethodLoggingLevel.INFO,
            throttlingBurstLimit: 2000,
            throttlingRateLimit: 1000,
          },
        },
      },
    });

    // API Gateway Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Gateway Resources and Methods
    api.root.addMethod('GET', lambdaIntegration);
    
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    const apiResource = api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');
    v1Resource.addMethod('GET', lambdaIntegration);
    v1Resource.addMethod('POST', lambdaIntegration);

    // WAF WebACL for API protection
    const webACL = new wafv2.WebAcl(this, 'TapWebAcl', {
      name: `tap-webacl-${environmentSuffix}`,
      description: `WAF WebACL for TAP Global API (${environmentSuffix})`,
      scope: wafv2.Scope.REGIONAL,
      defaultAction: wafv2.WafAction.allow(),
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: wafv2.WafAction.block(),
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
          statement: new wafv2.RateBasedStatement({
            limit: 2000,
            aggregateKeyType: wafv2.RateBasedStatementAggregateKeyType.IP,
          }),
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: wafv2.WafOverrideAction.none(),
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
          statement: new wafv2.ManagedRuleGroupStatement({
            vendorName: 'AWS',
            name: 'AWSManagedRulesCommonRuleSet',
          }),
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: wafv2.WafOverrideAction.none(),
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
          statement: new wafv2.ManagedRuleGroupStatement({
            vendorName: 'AWS',
            name: 'AWSManagedRulesSQLiRuleSet',
          }),
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tap-webacl-${environmentSuffix}`,
      },
    });

    // Associate WAF with API Gateway
    new wafv2.WebAclAssociation(this, 'TapWebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${region}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: webACL.attrArn,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `tap-monitoring-${environmentSuffix}`,
    });

    // CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `global-api-lambda-errors-${environmentSuffix}`,
      metric: lambdaFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 2,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `global-api-lambda-duration-${environmentSuffix}`,
      metric: lambdaFunction.metricDuration(),
      threshold: 25000,
      evaluationPeriods: 2,
    });

    // Canary for API monitoring
    const canary = new synthetics.Canary(this, 'TapApiCanary', {
      canaryName: `tap-api-canary-${environmentSuffix}`,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');
          const https = require('https');
          
          const apiCanaryBlueprint = async function () {
            const options = {
              hostname: '${api.restApiId}.execute-api.${region}.amazonaws.com',
              path: '/prod/health',
              method: 'GET',
              port: 443,
              headers: {
                'User-Agent': 'CloudWatchSynthetics'
              }
            };
            
            return new Promise((resolve, reject) => {
              const req = https.request(options, (res) => {
                log.info('Response status code: ' + res.statusCode);
                if (res.statusCode === 200) {
                  resolve();
                } else {
                  reject(new Error('API returned status: ' + res.statusCode));
                }
              });
              
              req.on('error', (e) => {
                reject(e);
              });
              
              req.end();
            });
          };
          
          exports.handler = async () => {
            return await synthetics.executeStep('healthCheck', apiCanaryBlueprint);
          };
        `),
        handler: 'index.handler',
      }),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0,
    });

    // Outputs for cross-stack references and CI/CD
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `TapApiEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `TapApiId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB table name',
      exportName: `TapTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'Asset S3 bucket name',
      exportName: `TapAssetBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'Backup S3 bucket name',
      exportName: `TapBackupBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge event bus name',
      exportName: `TapEventBus-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `TapLambdaFunction-${environmentSuffix}`,
    });
  }
}
