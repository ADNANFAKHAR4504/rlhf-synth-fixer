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
    // Check if running in LocalStack
    const isLocalStack = process.env.CDK_LOCAL === 'true' || 
                         process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.LOCALSTACK_HOSTNAME !== undefined;
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
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      timeout: Duration.seconds(30),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: globalTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        REGION: stackRegion,
        ENVIRONMENT: environmentSuffix
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              message: 'Hello from Global API',
              region: process.env.REGION,
              environment: process.env.ENVIRONMENT,
              timestamp: new Date().toISOString()
            })
          };
        };
      `),
      reservedConcurrentExecutions: 100
    });

    // API Gateway with regional endpoint
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      description: `Global API for ${environmentSuffix}`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ]
      }
    });

    // API Gateway integration
    const integration = new apigateway.LambdaIntegration(apiLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // API routes
    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', integration);
    apiResource.addMethod('POST', integration);
    
    const itemResource = apiResource.addResource('{id}');
    itemResource.addMethod('GET', integration);
    itemResource.addMethod('PUT', integration);
    itemResource.addMethod('DELETE', integration);

    // WAF Web ACL for API Gateway protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      scope: 'REGIONAL',
      description: `WAF WebACL for ${resourcePrefix}`,
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf`
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 10000,
              aggregateKeyType: 'IP'
            }
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${resourcePrefix}-rate-limit`
          }
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${resourcePrefix}-common-rules`
          }
        }
      ]
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${resourcePrefix}-dashboard`,
      defaultInterval: Duration.hours(1)
    });

    // Lambda metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: apiLambda.functionName
            }
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: apiLambda.functionName
            },
            statistic: 'Sum',
            color: cloudwatch.Color.RED
          })
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: apiLambda.functionName
            },
            statistic: 'Average',
            color: cloudwatch.Color.BLUE
          })
        ]
      })
    );

    // API Gateway metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: api.restApiName,
              Stage: environmentSuffix
            }
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: api.restApiName,
              Stage: environmentSuffix
            },
            color: cloudwatch.Color.ORANGE
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: api.restApiName,
              Stage: environmentSuffix
            },
            color: cloudwatch.Color.RED
          })
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: api.restApiName,
              Stage: environmentSuffix
            },
            statistic: 'Average',
            color: cloudwatch.Color.BLUE
          })
        ]
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: apiLambda.functionName
        },
        statistic: 'Sum',
        period: Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function errors for ${resourcePrefix}`
    });

    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: api.restApiName,
          Stage: environmentSuffix
        },
        statistic: 'Sum',
        period: Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `API Gateway 5xx errors for ${resourcePrefix}`
    });

    // CloudWatch Synthetics Canary for API monitoring
    const canaryRole = new iam.Role(this, 'CanaryRole', {
      assumedBy: new iam.ServicePrincipal('synthetics.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchSyntheticsFullAccess')
      ]
    });

    const canaryLogGroup = new logs.LogGroup(this, 'CanaryLogGroup', {
      logGroupName: `/aws/lambda/cwsyn-${resourcePrefix}-canary`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Create S3 bucket for canary artifacts
    const canaryBucket = new s3.Bucket(this, 'CanaryBucket', {
      bucketName: `${resourcePrefix}-canary-${this.account}-${stackRegion}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'CleanupOldArtifacts',
          expiration: Duration.days(30)
        }
      ]
    });

    canaryBucket.grantReadWrite(canaryRole);

    const canary = new synthetics.CfnCanary(this, 'ApiCanary', {
      name: `${resourcePrefix}-canary`,
      executionRoleArn: canaryRole.roleArn,
      runtimeVersion: 'syn-nodejs-puppeteer-3.9',
      artifactS3Location: `s3://${canaryBucket.bucketName}/`,
      schedule: {
        expression: 'rate(5 minutes)',
        durationInSeconds: 0
      },
      runConfig: {
        timeoutInSeconds: 60,
        activeTracing: true
      },
      failureRetentionPeriod: 7,
      successRetentionPeriod: 7,
      code: {
        handler: 'apiCanary.handler',
        script: `
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanary = async function () {
    const apiEndpoint = '${api.url}';
    
    let page = await synthetics.getPage();
    
    const response = await page.goto(apiEndpoint + 'api', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });
    
    if (response.status() !== 200) {
        throw new Error('API returned status code ' + response.status());
    }
    
    const responseBody = await response.text();
    log.info('API Response:', responseBody);
    
    const data = JSON.parse(responseBody);
    if (!data.message || !data.region) {
        throw new Error('Invalid API response structure');
    }
    
    log.info('API health check passed');
};

exports.handler = async () => {
    return await synthetics.executeStep('apiCheck', apiCanary);
};
        `
      },
      visualReference: {
        baseScreenshots: []
      }
    });

    canary.node.addDependency(canaryLogGroup);

    // Route53 Health Check (only for primary region)
    if (isPrimary) {
      const healthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        type: 'HTTPS',
        resourcePath: `/api`,
        fullyQualifiedDomainName: Fn.select(2, Fn.split('/', api.url)),
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: `/api`,
          fullyQualifiedDomainName: Fn.select(2, Fn.split('/', api.url)),
          port: 443,
          requestInterval: 30,
          failureThreshold: 3,
          measureLatency: true
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `${resourcePrefix}-health-check`
          },
          {
            key: 'Region',
            value: stackRegion
          }
        ]
      });
    }

    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${resourcePrefix}-api-endpoint-${stackRegion}`
    });

    new CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table name',
      exportName: `${resourcePrefix}-table-name`
    });

    new CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Asset Bucket name',
      exportName: `${resourcePrefix}-asset-bucket-${stackRegion}`
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus name',
      exportName: `${resourcePrefix}-event-bus-${stackRegion}`
    });

    new CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${stackRegion}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL'
    });
  }
}

export { TapStack };
