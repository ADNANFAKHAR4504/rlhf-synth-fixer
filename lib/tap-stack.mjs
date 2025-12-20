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
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            body: JSON.stringify({
              message: 'Global API Handler',
              region: process.env.AWS_REGION,
              timestamp: new Date().toISOString()
            })
          };
        };
      `),
      role: lambdaExecutionRole,
      timeout: Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: globalTable.tableName,
        BUCKET_NAME: assetBucket.bucketName,
        BACKUP_BUCKET_NAME: backupBucket.bucketName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        ENVIRONMENT: environmentSuffix,
        REGION: stackRegion
      },
      reservedConcurrentExecutions: 100
    });

    // Configure Lambda provisioned concurrency for better cold start performance
    const lambdaAlias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version: apiLambda.currentVersion,
      provisionedConcurrentExecutions: 2
    });

    // API Gateway with request validation and throttling
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      requestValidatorName: 'ValidateBody',
      validateRequestBody: true,
      validateRequestParameters: false
    });

    // Lambda integration with custom headers
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaAlias, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }'
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'*'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'*'"
          }
        }
      ]
    });

    // API resources and methods with authorization
    const dataResource = api.root.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }]
    });

    dataResource.addMethod('POST', lambdaIntegration, {
      requestValidator: requestValidator,
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }]
    });

    // WAF v2 Web ACL for API protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `${resourcePrefix}-waf`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf-metric`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${resourcePrefix}-rate-limit`,
            sampledRequestsEnabled: true
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
            cloudWatchMetricsEnabled: true,
            metricName: `${resourcePrefix}-common-ruleset`,
            sampledRequestsEnabled: true
          }
        }
      ]
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      webAclArn: webAcl.attrArn,
      resourceArn: `arn:aws:apigateway:${stackRegion}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'GlobalApiDashboard', {
      dashboardName: `${resourcePrefix}-dashboard`,
      defaultInterval: Duration.minutes(5)
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
            },
            statistic: 'Sum'
          })
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: apiLambda.functionName
            },
            statistic: 'Sum'
          })
        ],
        width: 12,
        height: 6
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
              ApiName: api.restApiName
            },
            statistic: 'Sum'
          })
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: api.restApiName
            },
            statistic: 'Sum'
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: api.restApiName
            },
            statistic: 'Sum'
          })
        ],
        width: 12,
        height: 6
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
        statistic: 'Sum'
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High error rate for ${apiLambda.functionName}`
    });

    new cloudwatch.Alarm(this, 'ApiGateway5XXAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: api.restApiName
        },
        statistic: 'Sum'
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High 5XX error rate for ${api.restApiName}`
    });

    // Log Groups with retention
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // CloudWatch Synthetics Canary for monitoring
    const canaryRole = new iam.Role(this, 'CanaryRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchSyntheticsFullAccess')
      ]
    });

    const canaryBucket = new s3.Bucket(this, 'CanaryBucket', {
      bucketName: `${resourcePrefix}-canary-${this.account}-${stackRegion}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    canaryBucket.grantReadWrite(canaryRole);

    new synthetics.CfnCanary(this, 'ApiCanary', {
      name: `${resourcePrefix}-canary`,
      artifactS3Location: `s3://${canaryBucket.bucketName}/canary-artifacts`,
      executionRoleArn: canaryRole.roleArn,
      runtimeVersion: 'syn-nodejs-puppeteer-7.0',
      schedule: {
        expression: 'rate(5 minutes)',
        durationInSeconds: '0'  // Fixed: Must be string, not number
      },
      code: {
        handler: 'apiCanary.handler',
        script: `
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');

          const apiCanary = async function () {
            const apiEndpoint = '${api.url}data';
            
            let response = await synthetics.executeHttpStep(
              'CheckAPI',
              apiEndpoint,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              }
            );
            
            return response;
          };

          exports.handler = async () => {
            return await synthetics.runCanary(apiCanary);
          };
        `
      },
      runConfig: {
        timeoutInSeconds: 60,
        memoryInMb: 960
      },
      successRetentionPeriodInDays: 2,
      failureRetentionPeriodInDays: 14,
      startCanaryAfterCreation: true
      // Removed visualReference as it's not needed for API monitoring
    });

    // Route53 Latency-Based Routing (optional)
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    const domainName = this.node.tryGetContext('domainName');
    
    if (hostedZoneId && domainName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: hostedZoneId,
        zoneName: domainName
      });

      new route53.ARecord(this, 'ApiLatencyRecord', {
        zone: hostedZone,
        recordName: `api-${stackRegion}`,
        target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
        setIdentifier: stackRegion,
        region: stackRegion
      });
    }

    // QuickSight Analytics (optional)
    const quickSightEnabled = this.node.tryGetContext('enableQuickSight') === true;
    
    if (quickSightEnabled) {
      const quickSightRole = new iam.Role(this, 'QuickSightRole', {
        assumedBy: new iam.ServicePrincipal('quicksight.amazonaws.com'),
        description: `QuickSight role for ${resourcePrefix}`
      });

      assetBucket.grantRead(quickSightRole);
      backupBucket.grantRead(quickSightRole);

      // Note: QuickSight datasets and dashboards require manual setup
      // This creates the necessary IAM permissions
      quickSightRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            'dynamodb:DescribeTable',
            'dynamodb:Query',
            'dynamodb:Scan'
          ],
          resources: [globalTable.tableArn]
        })
      );

      new CfnOutput(this, 'QuickSightRoleArn', {
        value: quickSightRole.roleArn,
        description: 'ARN of the QuickSight IAM role'
      });
    }

    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table name'
    });

    new CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Asset Bucket name'
    });

    new CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket name'
    });

    new CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge Event Bus name'
    });

    new CfnOutput(this, 'LambdaFunctionName', {
      value: apiLambda.functionName,
      description: 'Lambda function name'
    });

    new CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF WebACL ARN'
    });
  }
}

export { TapStack };
