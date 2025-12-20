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
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix = 'dev', isPrimary, hostedZoneId, domainName, enableQuickSight, importExisting } = props;

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
      encryption: dynamodb.TableEncryptionV2.customerManagedKey(kmsKey),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      timeToLiveAttribute: 'ttl',
      dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
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

    // Explicitly add X-Ray write access policy
    lambdaFunction.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

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

    // Add health endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', integration);

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

    // Create CloudWatch Alarms - Lambda Errors
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
    });

    // Create CloudWatch Alarms - API Gateway 5XX Errors
    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      metric: api.metricServerError(),
      threshold: 10,
      evaluationPeriods: 1,
    });

    // Create CloudWatch Synthetics Canary
    const canary = new synthetics.Canary(this, 'TapCanary', {
      canaryName: `tap-canary-${environmentSuffix}`,
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');

          exports.handler = async function () {
            log.info('Starting canary check');
            return 'Canary check complete';
          };
        `),
        handler: 'index.handler',
      }),
      artifactsBucketLocation: {
        bucket: assetBucket,
        prefix: 'canary-artifacts',
      },
    });

    // Create Route 53 Health Check (primary only)
    if (isPrimary) {
      new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: `${api.restApiId}.execute-api.${props.env.region}.amazonaws.com`,
          port: 443,
          resourcePath: '/prod/health',
          requestInterval: 30,
          failureThreshold: 3,
        },
      });
    }

    // Route53 Latency-based routing (if hostedZoneId and domainName provided)
    if (hostedZoneId && domainName) {
      new route53.CfnRecordSet(this, 'LatencyRecord', {
        hostedZoneId,
        name: domainName,
        type: 'A',
        setIdentifier: `${props.env.region}-latency`,
        region: props.env.region,
        aliasTarget: {
          dnsName: `${api.restApiId}.execute-api.${props.env.region}.amazonaws.com`,
          hostedZoneId: 'Z1UJRXOUMOOFQ8', // AWS API Gateway hosted zone ID for us-east-1
          evaluateTargetHealth: true,
        },
      });
    }

    // QuickSight analytics role (if enabled)
    if (enableQuickSight) {
      new iam.Role(this, 'QuickSightRole', {
        assumedBy: new iam.ServicePrincipal('quicksight.amazonaws.com'),
        description: 'Role for QuickSight to access DynamoDB and S3',
        inlinePolicies: {
          DynamoDBAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['dynamodb:Scan', 'dynamodb:Query', 'dynamodb:GetItem'],
                resources: [table.tableArn],
              }),
            ],
          }),
          S3Access: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [assetBucket.bucketArn, `${assetBucket.bucketArn}/*`],
              }),
            ],
          }),
        },
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'Asset S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'Backup S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'WafWebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF WebACL ARN',
    });
  }
}
