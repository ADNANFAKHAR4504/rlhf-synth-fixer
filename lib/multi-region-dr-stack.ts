import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface MultiRegionDRStackProps {
  environmentSuffix: string;
}

export class MultiRegionDRStack extends Construct {
  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const stack = cdk.Stack.of(this);
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';
    const currentRegion = stack.region;

    // VPC for both regions
    const vpc = new ec2.Vpc(this, `TradingPlatformVPC-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 0, // Using VPC endpoints instead for cost optimization
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoints for AWS services
    vpc.addInterfaceEndpoint(`RDSEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
    });

    vpc.addInterfaceEndpoint(`LambdaEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
    });

    // DynamoDB Global Table for session state
    const sessionTable = new dynamodb.Table(
      this,
      `SessionTable-${environmentSuffix}`,
      {
        tableName: `trading-sessions-${environmentSuffix}`,
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        replicationRegions: [secondaryRegion],
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    // S3 Buckets with cross-region replication
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket-${environmentSuffix}`,
      {
        bucketName: `trading-config-${currentRegion}-${environmentSuffix}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const auditLogsBucket = new s3.Bucket(
      this,
      `AuditLogsBucket-${environmentSuffix}`,
      {
        bucketName: `trading-audit-logs-${currentRegion}-${environmentSuffix}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // If primary region, set up replication
    if (currentRegion === primaryRegion) {
      const replicationRole = new iam.Role(
        this,
        `ReplicationRole-${environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        }
      );

      configBucket.grantReadWrite(replicationRole);
      auditLogsBucket.grantReadWrite(replicationRole);

      // Note: Cross-region replication requires manual configuration via CfnBucket
      const cfnConfigBucket = configBucket.node.defaultChild as s3.CfnBucket;
      cfnConfigBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToSecondary',
            status: 'Enabled',
            priority: 1,
            filter: {},
            destination: {
              bucket: `arn:aws:s3:::trading-config-${secondaryRegion}-${environmentSuffix}`,
              replicationTime: {
                status: 'Enabled',
                time: {
                  minutes: 15,
                },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: {
                  minutes: 15,
                },
              },
            },
            deleteMarkerReplication: {
              status: 'Enabled',
            },
          },
        ],
      };
    }

    // Aurora PostgreSQL Global Database
    const dbCluster = new rds.DatabaseCluster(
      this,
      `TradingDBCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        writer: rds.ClusterInstance.serverlessV2(`Writer-${environmentSuffix}`),
        readers: [
          rds.ClusterInstance.serverlessV2(`Reader-${environmentSuffix}`, {
            scaleWithWriter: true,
          }),
        ],
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        storageEncrypted: true,
        backup: {
          retention: cdk.Duration.days(7),
        },
      }
    );

    // SQS Queue for trade orders
    const tradeOrderQueue = new sqs.Queue(
      this,
      `TradeOrderQueue-${environmentSuffix}`,
      {
        queueName: `trade-orders-${currentRegion}-${environmentSuffix}`,
        visibilityTimeout: cdk.Duration.seconds(300),
        retentionPeriod: cdk.Duration.days(4),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda function for processing trade orders
    const tradeProcessorLambda = new lambda.Function(
      this,
      `TradeProcessor-${environmentSuffix}`,
      {
        functionName: `trade-processor-${currentRegion}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/trade-processor'),
        timeout: cdk.Duration.seconds(30),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        environment: {
          DB_CLUSTER_ARN: dbCluster.clusterArn,
          DB_SECRET_ARN: dbCluster.secret?.secretArn || '',
          SESSION_TABLE_NAME: sessionTable.tableName,
          REGION: currentRegion,
        },
      }
    );

    // Grant permissions
    sessionTable.grantReadWriteData(tradeProcessorLambda);
    dbCluster.grantDataApiAccess(tradeProcessorLambda);
    tradeOrderQueue.grantConsumeMessages(tradeProcessorLambda);

    // Add SQS event source
    tradeProcessorLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(tradeOrderQueue, {
        batchSize: 10,
      })
    );

    // Lambda function for automated failover testing
    const failoverTestLambda = new lambda.Function(
      this,
      `FailoverTest-${environmentSuffix}`,
      {
        functionName: `failover-test-${currentRegion}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/failover-test'),
        timeout: cdk.Duration.minutes(5),
        environment: {
          PRIMARY_REGION: primaryRegion,
          SECONDARY_REGION: secondaryRegion,
          DB_CLUSTER_ARN: dbCluster.clusterArn,
          SESSION_TABLE_NAME: sessionTable.tableName,
        },
      }
    );

    // Grant permissions for failover testing
    sessionTable.grantReadData(failoverTestLambda);
    dbCluster.grantDataApiAccess(failoverTestLambda);

    // CloudWatch Events rule for hourly testing
    const testRule = new events.Rule(
      this,
      `FailoverTestRule-${environmentSuffix}`,
      {
        ruleName: `failover-test-${currentRegion}-${environmentSuffix}`,
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      }
    );

    testRule.addTarget(new targets.LambdaFunction(failoverTestLambda));

    // API Gateway for REST API
    const api = new apigateway.RestApi(
      this,
      `TradingAPI-${environmentSuffix}`,
      {
        restApiName: `trading-api-${currentRegion}-${environmentSuffix}`,
        deployOptions: {
          stageName: 'prod',
          metricsEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
        },
      }
    );

    // API Gateway endpoints
    const tradesResource = api.root.addResource('trades');
    const integration = new apigateway.LambdaIntegration(tradeProcessorLambda);
    tradesResource.addMethod('POST', integration);
    tradesResource.addMethod('GET', integration);

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    const healthLambda = new lambda.Function(
      this,
      `HealthCheck-${environmentSuffix}`,
      {
        functionName: `health-check-${currentRegion}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              body: JSON.stringify({
                status: 'healthy',
                region: '${currentRegion}',
                timestamp: new Date().toISOString()
              })
            };
          };
        `),
      }
    );

    healthResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(healthLambda)
    );

    // Route 53 Health Check (only in primary region)
    if (currentRegion === primaryRegion) {
      new route53.CfnHealthCheck(this, `APIHealthCheck-${environmentSuffix}`, {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: '/prod/health',
          fullyQualifiedDomainName: `${api.restApiId}.execute-api.${currentRegion}.amazonaws.com`,
          requestInterval: 30,
          failureThreshold: 3,
        },
      });
    }

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      topicName: `trading-alerts-${currentRegion}-${environmentSuffix}`,
      displayName: 'Trading Platform Alerts',
    });

    // CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `trade-processor-errors-${currentRegion}-${environmentSuffix}`,
        metric: tradeProcessorLambda.metricErrors(),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      `APILatencyAlarm-${environmentSuffix}`,
      {
        alarmName: `api-gateway-latency-${currentRegion}-${environmentSuffix}`,
        metric: api.metricLatency(),
        threshold: 1000,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    apiLatencyAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // RDS replication lag alarm
    const replicationLagAlarm = new cloudwatch.Alarm(
      this,
      `ReplicationLagAlarm-${environmentSuffix}`,
      {
        alarmName: `aurora-replication-lag-${currentRegion}-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: dbCluster.clusterIdentifier,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1000,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    replicationLagAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Step Functions for failover orchestration (only in primary region)
    if (currentRegion === primaryRegion) {
      const promoteDBTask = new tasks.CallAwsService(
        this,
        `PromoteDB-${environmentSuffix}`,
        {
          service: 'rds',
          action: 'failoverGlobalCluster',
          parameters: {
            GlobalClusterIdentifier: dbCluster.clusterIdentifier,
            TargetDbClusterIdentifier: `secondary-cluster-${environmentSuffix}`,
          },
          iamResources: ['*'],
        }
      );

      const updateRoute53Task = new tasks.CallAwsService(
        this,
        `UpdateRoute53-${environmentSuffix}`,
        {
          service: 'route53',
          action: 'changeResourceRecordSets',
          parameters: {
            HostedZoneId: 'HOSTED_ZONE_ID',
            ChangeBatch: {
              Changes: [
                {
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                    Name: 'api.trading-platform.com',
                    Type: 'A',
                    SetIdentifier: 'Secondary',
                    Failover: 'PRIMARY',
                    AliasTarget: {
                      HostedZoneId: 'Z1234567890ABC',
                      DNSName: `${api.restApiId}.execute-api.${secondaryRegion}.amazonaws.com`,
                      EvaluateTargetHealth: true,
                    },
                  },
                },
              ],
            },
          },
          iamResources: ['*'],
        }
      );

      const validateFailoverTask = new tasks.LambdaInvoke(
        this,
        `ValidateFailover-${environmentSuffix}`,
        {
          lambdaFunction: failoverTestLambda,
          payload: stepfunctions.TaskInput.fromObject({
            action: 'validate',
          }),
        }
      );

      const failoverDefinition = promoteDBTask
        .next(updateRoute53Task)
        .next(validateFailoverTask);

      const failoverStateMachine = new stepfunctions.StateMachine(
        this,
        `FailoverStateMachine-${environmentSuffix}`,
        {
          stateMachineName: `failover-orchestration-${environmentSuffix}`,
          definition: failoverDefinition,
          timeout: cdk.Duration.minutes(10),
        }
      );

      // Grant permissions
      failoverStateMachine.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'rds:FailoverGlobalCluster',
            'route53:ChangeResourceRecordSets',
            'route53:GetChange',
          ],
          resources: ['*'],
        })
      );
    }

    // EventBridge for cross-region event forwarding
    const eventBus = new events.EventBus(
      this,
      `TradingEventBus-${environmentSuffix}`,
      {
        eventBusName: `trading-events-${currentRegion}-${environmentSuffix}`,
      }
    );

    // Cross-region event rule
    const crossRegionRule = new events.Rule(
      this,
      `CrossRegionRule-${environmentSuffix}`,
      {
        eventBus,
        ruleName: `cross-region-events-${currentRegion}-${environmentSuffix}`,
        eventPattern: {
          source: ['trading.platform'],
          detailType: ['Trade Executed', 'Trade Failed'],
        },
      }
    );

    // Forward to secondary region EventBridge
    const targetRegion =
      currentRegion === primaryRegion ? secondaryRegion : primaryRegion;
    crossRegionRule.addTarget(
      new targets.EventBus(
        events.EventBus.fromEventBusArn(
          this,
          `TargetEventBus-${environmentSuffix}`,
          `arn:aws:events:${targetRegion}:${stack.account}:event-bus/trading-events-${targetRegion}-${environmentSuffix}`
        )
      )
    );

    // Systems Manager Parameters for configuration
    new ssm.StringParameter(this, `PrimaryRegionParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/primary-region`,
      stringValue: primaryRegion,
    });

    new ssm.StringParameter(this, `SecondaryRegionParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/secondary-region`,
      stringValue: secondaryRegion,
    });

    new ssm.StringParameter(this, `DBEndpointParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/db-endpoint`,
      stringValue: dbCluster.clusterEndpoint.hostname,
    });

    new ssm.StringParameter(this, `APIEndpointParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/api-endpoint`,
      stringValue: api.url,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DBClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora DB Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'SessionTableName', {
      value: sessionTable.tableName,
      description: 'DynamoDB Session Table Name',
    });

    new cdk.CfnOutput(this, 'TradeQueueUrl', {
      value: tradeOrderQueue.queueUrl,
      description: 'SQS Trade Order Queue URL',
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 Config Bucket Name',
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: auditLogsBucket.bucketName,
      description: 'S3 Audit Logs Bucket Name',
    });
  }
}
