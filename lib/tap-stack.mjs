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

    // DynamoDB Global Table
    const globalTable = new dynamodb.GlobalTable(this, 'TapGlobalTable', {
      tableName: `tap-global-table-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      replicationRegions: isPrimary ? ['us-west-2', 'eu-west-1'] : [],
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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
              resources: [globalTable.tableArn, `${globalTable.tableArn}/index/*`],
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
        TABLE_NAME: globalTable.tableName,
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
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      cloudWatchRole: true,
    });

    // API Gateway Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(productionAlias, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Gateway Resources
    api.root.addMethod('GET', lambdaIntegration);
    
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // API Gateway Stage with Logging
    const deployment = new apigateway.Deployment(this, 'TapApiDeployment', {
      api: api,
    });

    new apigateway.Stage(this, 'TapApiStage', {
      stageName: 'prod',
      deployment: deployment,
      tracingEnabled: true,
      dataTraceEnabled: true,
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      methodOptions: {
        '/*/*': {
          dataTraceEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          metricsEnabled: true,
        },
      },
    });

    // WAF Web ACL (skip in LocalStack as wafv2 service is not enabled)
    let webAcl;
    if (!isLocalStack) {
      webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
        name: `tap-web-acl-${environmentSuffix}`,
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
              metricName: 'CommonRuleSet',
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 3,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRuleSet',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `TapWebAcl${environmentSuffix}`,
        },
      });

      // Associate WAF with API Gateway
      new wafv2.CfnWebACLAssociation(this, 'TapWebAclAssociation', {
        resourceArn: `arn:aws:apigateway:${region}::/restapis/${api.restApiId}/stages/prod`,
        webAclArn: webAcl.attrArn,
      });
    }

    // CloudWatch Alarms
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      alarmName: `global-api-API-Errors-${environmentSuffix}`,
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `global-api-Lambda-Errors-${environmentSuffix}`,
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `tap-monitoring-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [api.metricCount()],
            right: [api.metricLatency()],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Metrics',
            left: [lambdaFunction.metricInvocations()],
            right: [lambdaFunction.metricDuration()],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Metrics',
            left: [
              globalTable.metricConsumedReadCapacityUnits(),
              globalTable.metricConsumedWriteCapacityUnits(),
            ],
          }),
        ],
      ],
    });

    // CloudWatch Synthetics Canary
    const canary = new synthetics.Canary(this, 'TapCanary', {
      canaryName: `tap-api-canary-${environmentSuffix}`,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');

          const apiCanaryBlueprint = async function () {
            const verifyRequest = async function (requestOption) {
              return await synthetics.executeStep('verifyRequest', async function (timeoutInMillis = 10000) {
                return await synthetics.makeRequest(requestOption);
              });
            };

            const headers = {};
            headers['User-Agent'] = [synthetics.getCanaryUserAgentString(), headers['User-Agent']].join(' ');

            const requestOptions = {
              hostname: '${api.restApiId}.execute-api.${region}.amazonaws.com',
              method: 'GET',
              path: '/prod/health',
              port: 443,
              protocol: 'https:',
              headers: headers
            };

            await verifyRequest(requestOptions);
          };

          exports.handler = async () => {
            return await synthetics.executeStep('apiCanaryBlueprint', apiCanaryBlueprint);
          };
        `),
        handler: 'index.handler',
      }),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      environmentVariables: {
        API_ENDPOINT: `https://${api.restApiId}.execute-api.${region}.amazonaws.com/prod`,
      },
    });

    // Cross-region EventBridge forwarding (only for primary region)
    if (isPrimary) {
      const crossRegionRole = new iam.Role(this, 'CrossRegionEventRole', {
        assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
        inlinePolicies: {
          CrossRegionEventPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['events:PutEvents'],
                resources: [
                  `arn:aws:events:us-west-2:${this.account}:event-bus/tap-events-${environmentSuffix}`,
                  `arn:aws:events:eu-west-1:${this.account}:event-bus/tap-events-${environmentSuffix}`,
                ],
              }),
            ],
          }),
        },
      });

      new events.Rule(this, 'CrossRegionForwardingRule', {
        eventBus: eventBus,
        eventPattern: {
          source: ['global-api.events'],
        },
        targets: [
          new targets.EventBridgeDestination(
            events.EventBus.fromEventBusArn(
              this,
              'WestEventBus',
              `arn:aws:events:us-west-2:${this.account}:event-bus/tap-events-${environmentSuffix}`
            ),
            { role: crossRegionRole }
          ),
          new targets.EventBridgeDestination(
            events.EventBus.fromEventBusArn(
              this,
              'EuropeEventBus',
              `arn:aws:events:eu-west-1:${this.account}:event-bus/tap-events-${environmentSuffix}`
            ),
            { role: crossRegionRole }
          ),
        ],
      });
    }

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `https://${api.restApiId}.execute-api.${region}.amazonaws.com/prod/`,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table name',
    });

    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Assets bucket name',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup bucket name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge event bus name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
    });

    if (!isLocalStack && webAcl) {
      new cdk.CfnOutput(this, 'WebAclArn', {
        value: webAcl.attrArn,
        description: 'WAF WebACL ARN',
      });
    }
  }
}
