import { Stack, Duration, RemovalPolicy, CfnOutput, Fn } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as quicksight from 'aws-cdk-lib/aws-quicksight';

class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const isPrimary = props?.isPrimary !== undefined ? props.isPrimary : true;
    const stackRegion = this.region;
    const resourcePrefix = `global-api-${environmentSuffix}`;

    // KMS key for encryption at rest
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for ${resourcePrefix}`,
      alias: `${resourcePrefix}-key`,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // DynamoDB Global Table with cross-region replication
    // IMPORTANT: Global Tables are only created in the PRIMARY region
    // Replicas are automatically managed by the GlobalTable construct
    const otherRegion = stackRegion === 'us-east-1' ? 'ap-south-1' : 'us-east-1';
    let globalTable;
    
    if (isPrimary) {
      // Try to import existing table first, otherwise create new one
      // This prevents "AlreadyExists" errors on fresh deployments when table was retained
      const tableName = `${resourcePrefix}-data-v2`;
      const importExisting = this.node.tryGetContext('importExistingTable');
      
      if (importExisting) {
        // Import existing Global Table
        globalTable = dynamodb.TableV2.fromTableName(
          this,
          'GlobalTable',
          tableName
        );
      } else {
        // Using TableV2 for Global Tables with replicas
        // Note: RemovalPolicy.RETAIN prevents 24-hour deletion restriction issues
        globalTable = new dynamodb.TableV2(this, 'GlobalTable', {
          tableName: tableName,
          partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
          billing: dynamodb.Billing.onDemand(),
          pointInTimeRecovery: true,
          encryption: dynamodb.TableEncryptionV2.dynamoOwnedKey(),
          timeToLiveAttribute: 'ttl',
          dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
          removalPolicy: RemovalPolicy.RETAIN,
          replicas: [
            {
              region: otherRegion,
              globalSecondaryIndexes: {}
            }
          ]
        });
      }
    } else {
      // Secondary region: Reference the existing Global Table created by primary
      globalTable = dynamodb.TableV2.fromTableName(
        this,
        'GlobalTable',
        `${resourcePrefix.replace(stackRegion, 'us-east-1')}-data-v2`
      );
    }

    // S3 bucket for shared assets with versioning
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `${resourcePrefix}-assets-${this.account}-${stackRegion}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30)
            }
          ]
        }
      ]
    });

    // S3 bucket for backups
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `${resourcePrefix}-backups-${this.account}-${stackRegion}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldBackups',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90)
            }
          ],
          expiration: Duration.days(365)
        }
      ]
    });

    // S3 cross-region replication configuration (only for primary)
    // Note: Replication will activate once destination bucket exists in other region
    if (isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: `S3 replication role for ${resourcePrefix}`
      });

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetReplicationConfiguration',
            's3:ListBucket'
          ],
          resources: [assetBucket.bucketArn]
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging'
          ],
          resources: [`${assetBucket.bucketArn}/*`]
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags'
          ],
          resources: [`arn:aws:s3:::${resourcePrefix}-assets-${this.account}-${otherRegion}/*`]
        })
      );

      encryptionKey.grantEncryptDecrypt(replicationRole);
      
      // Grant KMS permissions for destination region key
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey'
          ],
          resources: [encryptionKey.keyArn]
        })
      );
      
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            'kms:Encrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey'
          ],
          resources: [`arn:aws:kms:${otherRegion}:${this.account}:key/*`],
          conditions: {
            StringLike: {
              'kms:RequestAlias': `alias/${resourcePrefix}-key`
            }
          }
        })
      );

      const cfnBucket = assetBucket.node.defaultChild;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToOtherRegion',
            status: 'Enabled',
            priority: 1,
            filter: {},
            deleteMarkerReplication: {
              status: 'Enabled'
            },
            sourceSelectionCriteria: {
              sseKmsEncryptedObjects: {
                status: 'Enabled'
              }
            },
            destination: {
              bucket: `arn:aws:s3:::${resourcePrefix}-assets-${this.account}-${otherRegion}`,
              encryptionConfiguration: {
                replicaKmsKeyId: `arn:aws:kms:${otherRegion}:${this.account}:alias/${resourcePrefix}-key`
              }
            }
          }
        ]
      };
    }

    // EventBridge event bus for cross-region event distribution
    const eventBus = new events.EventBus(this, 'GlobalEventBus', {
      eventBusName: `${resourcePrefix}-events`
    });

    // Cross-region event forwarding (only for primary)
    if (isPrimary) {
      
      // IAM role for cross-region event forwarding
      const crossRegionEventRole = new iam.Role(this, 'CrossRegionEventRole', {
        assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
        description: `Cross-region event forwarding role for ${resourcePrefix}`
      });

      crossRegionEventRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['events:PutEvents'],
          resources: [`arn:aws:events:${otherRegion}:${this.account}:event-bus/${resourcePrefix}-events`]
        })
      );

      // Create rule to forward events to other region
      const crossRegionRule = new events.CfnRule(this, 'CrossRegionEventRule', {
        eventBusName: eventBus.eventBusName,
        name: `${resourcePrefix}-cross-region-forward`,
        description: `Forward events from ${stackRegion} to ${otherRegion}`,
        state: 'ENABLED',
        eventPattern: {
          source: ['global-api.events']
        },
        targets: [
          {
            arn: `arn:aws:events:${otherRegion}:${this.account}:event-bus/${resourcePrefix}-events`,
            id: 'CrossRegionTarget',
            roleArn: crossRegionEventRole.roleArn
          }
        ]
      });
    }

    // Lambda execution role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${resourcePrefix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
      ]
    });

    globalTable.grantReadWriteData(lambdaExecutionRole);
    assetBucket.grantReadWrite(lambdaExecutionRole);
    backupBucket.grantRead(lambdaExecutionRole);

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn]
      })
    );

    // Lambda function with provisioned concurrency
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      functionName: `${resourcePrefix}-handler`,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const s3Client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const ASSET_BUCKET = process.env.ASSET_BUCKET;
const BACKUP_BUCKET = process.env.BACKUP_BUCKET;
const REGION = process.env.REGION;
const EVENT_BUS = process.env.EVENT_BUS;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const path = event.path || event.rawPath || '/';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';

  try {
    if (path === '/health' || path === '/prod/health') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ status: 'healthy', region: REGION, timestamp: new Date().toISOString() })
      };
    }

    if (path === '/' || path === '/prod' || path === '/prod/') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Global API is running',
          region: REGION,
          endpoints: { health: '/health', data: '/data', assets: '/assets' }
        })
      };
    }

    if (path.startsWith('/data') || path.startsWith('/prod/data')) {
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        const id = body.id || \`item-\${Date.now()}\`;
        
        await dynamoClient.send(new PutItemCommand({
          TableName: TABLE_NAME,
          Item: marshall({
            id,
            sk: 'data',
            ...body,
            createdAt: new Date().toISOString(),
            region: REGION
          })
        }));

        await eventBridgeClient.send(new PutEventsCommand({
          Entries: [{
            Source: 'global-api.events',
            DetailType: 'DataCreated',
            Detail: JSON.stringify({ id, region: REGION }),
            EventBusName: EVENT_BUS
          }]
        }));

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ id, message: 'Data created successfully' })
        };
      } else if (httpMethod === 'GET') {
        const id = event.pathParameters?.id || event.queryStringParameters?.id;
        
        if (id) {
          const result = await dynamoClient.send(new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ id, sk: 'data' })
          }));

          return {
            statusCode: result.Item ? 200 : 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result.Item ? unmarshall(result.Item) : { message: 'Not found' })
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Provide an id parameter' })
        };
      }
    }

    if (path.startsWith('/assets') || path.startsWith('/prod/assets')) {
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        const key = body.key || \`asset-\${Date.now()}.txt\`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: ASSET_BUCKET,
          Key: key,
          Body: JSON.stringify(body.content || {}),
          ContentType: 'application/json'
        }));

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ key, message: 'Asset uploaded successfully' })
        };
      } else if (httpMethod === 'GET') {
        const key = event.pathParameters?.key || event.queryStringParameters?.key;
        
        if (key) {
          try {
            const result = await s3Client.send(new GetObjectCommand({
              Bucket: ASSET_BUCKET,
              Key: key
            }));

            const body = await result.Body.transformToString();

            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body
            };
          } catch (err) {
            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ message: 'Asset not found' })
            };
          }
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Provide a key parameter' })
        };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Global API', path, method: httpMethod })
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};
      `),
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: globalTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: stackRegion,
        EVENT_BUS: eventBus.eventBusName
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      reservedConcurrentExecutions: 100
    });

    // Create Lambda version with provisioned concurrency
    const version = apiLambda.currentVersion;
    const alias = new lambda.Alias(this, 'ApiLambdaAlias', {
      aliasName: 'production',
      version: version,
      provisionedConcurrentExecutions: 50
    });

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      description: `Global REST API for ${environmentSuffix}`,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        description: `Production deployment for ${environmentSuffix}`,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key']
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });

    // API Gateway endpoints
    api.root.addMethod('ANY', new apigateway.LambdaIntegration(alias, {
      proxy: true
    }));

    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(alias));

    const dataResource = api.root.addResource('data');
    dataResource.addMethod('GET', new apigateway.LambdaIntegration(alias));
    dataResource.addMethod('POST', new apigateway.LambdaIntegration(alias));

    const assetsResource = api.root.addResource('assets');
    assetsResource.addMethod('GET', new apigateway.LambdaIntegration(alias));
    assetsResource.addMethod('POST', new apigateway.LambdaIntegration(alias));

    const proxyResource = api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', new apigateway.LambdaIntegration(alias, {
      proxy: true
    }));

    // WAF Web ACL for API protection against common exploits
    const apiWaf = new wafv2.CfnWebACL(this, 'ApiWaf', {
      name: `${resourcePrefix}-waf`,
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf-metrics`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSet',
            sampledRequestsEnabled: true
          }
        }
      ]
    });

    // Associate WAF with API Gateway
    // Get the deployment stage to ensure it exists before association
    const deployment = api.latestDeployment;
    const stage = api.deploymentStage;
    
    const wafAssociation = new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
      resourceArn: `arn:aws:apigateway:${stackRegion}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: apiWaf.attrArn
    });
    
    // Ensure stage is created before WAF association
    if (stage) {
      wafAssociation.node.addDependency(stage.node.defaultChild);
    }

    // CloudWatch Dashboard for operational visibility
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `tap-monitoring-${environmentSuffix}-${stackRegion}`
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [api.metricCount({ period: Duration.minutes(5) })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [api.metricLatency({ period: Duration.minutes(5) })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [apiLambda.metricInvocations({ period: Duration.minutes(5) })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [apiLambda.metricErrors({ period: Duration.minutes(5) })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [apiLambda.metricDuration({ period: Duration.minutes(5) })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          globalTable.metricConsumedReadCapacityUnits({ period: Duration.minutes(5) }),
          globalTable.metricConsumedWriteCapacityUnits({ period: Duration.minutes(5) })
        ],
        width: 12
      })
    );

    // CloudWatch Synthetics Canary for uptime monitoring
    const canaryName = `api-${environmentSuffix}-mon`.substring(0, 21);
    const canary = new synthetics.Canary(this, 'ApiCanary', {
      canaryName: canaryName,
      schedule: synthetics.Schedule.rate(Duration.minutes(5)),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');
          
          const apiCanaryBlueprint = async function () {
            const url = '${api.url}health';
            log.info('Checking API health at: ' + url);
            
            const response = await synthetics.executeHttpStep('API Health Check', url, {
              method: 'GET',
              headers: {}
            });
            
            log.info('Response status: ' + response.statusCode);
            
            if (response.statusCode !== 200) {
              throw new Error('API health check failed with status ' + response.statusCode);
            }
            
            log.info('API health check passed');
          };
          
          exports.handler = async () => {
            return await apiCanaryBlueprint();
          };
        `),
        handler: 'index.handler'
      }),
      environmentVariables: {
        API_URL: api.url
      },
      startAfterCreation: true
    });

    // CloudWatch Alarms for critical metrics
    const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      alarmName: `${resourcePrefix}-api-errors`,
      metric: api.metricServerError({
        period: Duration.minutes(1),
        statistic: 'Sum'
      }),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });

    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `${resourcePrefix}-lambda-errors`,
      metric: apiLambda.metricErrors({
        period: Duration.minutes(1),
        statistic: 'Sum'
      }),
      threshold: 3,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });

    // CFN Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint URL',
      exportName: `${resourcePrefix}-${stackRegion}-ApiEndpoint`
    });

    new CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway ID',
      exportName: `${resourcePrefix}-${stackRegion}-ApiId`
    });

    new CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table Name',
      exportName: `${resourcePrefix}-${stackRegion}-TableName`
    });

    new CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Asset Bucket Name',
      exportName: `${resourcePrefix}-${stackRegion}-AssetBucketName`
    });

    new CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
      exportName: `${resourcePrefix}-${stackRegion}-BackupBucketName`
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
      exportName: `${resourcePrefix}-${stackRegion}-EventBusName`
    });

    new CfnOutput(this, 'LambdaFunctionName', {
      value: apiLambda.functionName,
      description: 'Lambda Function Name',
      exportName: `${resourcePrefix}-${stackRegion}-LambdaFunctionName`
    });

    new CfnOutput(this, 'DashboardURL', {
      value: `https://${stackRegion}.console.aws.amazon.com/cloudwatch/home?region=${stackRegion}#dashboards:name=tap-monitoring-${environmentSuffix}-${stackRegion}`,
      description: 'CloudWatch Dashboard URL'
    });

    new CfnOutput(this, 'WafWebAclArn', {
      value: apiWaf.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `${resourcePrefix}-${stackRegion}-WafWebAclArn`
    });

    new CfnOutput(this, 'Region', {
      value: stackRegion,
      description: 'Deployment Region',
      exportName: `${resourcePrefix}-${stackRegion}-Region`
    });

    new CfnOutput(this, 'IsPrimary', {
      value: isPrimary.toString(),
      description: 'Is Primary Region',
      exportName: `${resourcePrefix}-${stackRegion}-IsPrimary`
    });

    // Route 53 Health Check and Latency Routing (only create in primary)
    if (isPrimary) {
      // Health check for this region's API
      const healthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: `${api.restApiId}.execute-api.${stackRegion}.amazonaws.com`,
          port: 443,
          resourcePath: '/prod/health',
          requestInterval: 30,
          failureThreshold: 3,
          measureLatency: true
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `${resourcePrefix}-${stackRegion}-health-check`
          }
        ]
      });

      new CfnOutput(this, 'HealthCheckId', {
        value: healthCheck.attrHealthCheckId,
        description: 'Route 53 Health Check ID',
        exportName: `${resourcePrefix}-${stackRegion}-HealthCheckId`
      });

      // Route 53 Latency-Based Routing
      // Conditional: Only creates if hostedZoneId is provided via context
      const hostedZoneId = this.node.tryGetContext('hostedZoneId');
      const domainName = this.node.tryGetContext('domainName') || 'api.example.com';
      
      if (hostedZoneId) {
        // Create latency-based A record for this region
        new route53.CfnRecordSet(this, 'LatencyRecord', {
          hostedZoneId: hostedZoneId,
          name: domainName,
          type: 'A',
          setIdentifier: `${resourcePrefix}-${stackRegion}`,
          aliasTarget: {
            hostedZoneId: api.restApiRegionalHostedZoneId || 'Z1UJRXOUMOOFQ8',
            dnsName: `${api.restApiId}.execute-api.${stackRegion}.amazonaws.com`,
            evaluateTargetHealth: true
          },
          region: stackRegion,
          healthCheckId: healthCheck.attrHealthCheckId
        });
        
        new CfnOutput(this, 'CustomDomain', {
          value: domainName,
          description: 'Custom domain with latency-based routing'
        });
      } else {
        new CfnOutput(this, 'Route53Info', {
          value: 'Set hostedZoneId and domainName in cdk.json context to enable Route 53 latency routing',
          description: 'Route 53 Configuration'
        });
      }
    }

    // QuickSight Data Source (only in primary region)
    // Conditional: Only creates if enableQuickSight context is set to true
    // Requirements:
    // 1. QuickSight subscription active ($18/month per author)
    // 2. QuickSight admin user created in AWS Console
    // 3. Set enableQuickSight: true in cdk.json context
    if (isPrimary) {
      const enableQuickSight = this.node.tryGetContext('enableQuickSight');
      
      if (enableQuickSight) {
        // QuickSight needs specific IAM permissions
        const quicksightRole = new iam.Role(this, 'QuickSightRole', {
          assumedBy: new iam.ServicePrincipal('quicksight.amazonaws.com'),
          description: 'QuickSight role for analytics'
        });

        globalTable.grantReadData(quicksightRole);
        assetBucket.grantRead(quicksightRole);

        quicksightRole.addToPolicy(
          new iam.PolicyStatement({
            actions: [
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics'
            ],
            resources: ['*']
          })
        );

        // QuickSight Data Source for DynamoDB
        const dataSource = new quicksight.CfnDataSource(this, 'QuickSightDataSource', {
          awsAccountId: this.account,
          dataSourceId: `${resourcePrefix}-datasource`,
          name: `${resourcePrefix}-analytics-datasource`,
          type: 'ATHENA',
          dataSourceParameters: {
            athenaParameters: {
              workGroup: 'primary'
            }
          }
        });

        new CfnOutput(this, 'QuickSightDataSourceId', {
          value: dataSource.attrDataSourceId || dataSource.dataSourceId,
          description: 'QuickSight Data Source ID',
          exportName: `${resourcePrefix}-QuickSightDataSourceId`
        });
      } else {
        new CfnOutput(this, 'QuickSightInfo', {
          value: 'Set enableQuickSight: true in cdk.json context to enable QuickSight analytics',
          description: 'QuickSight Configuration'
        });
      }
    }
  }
}

export { TapStack };
