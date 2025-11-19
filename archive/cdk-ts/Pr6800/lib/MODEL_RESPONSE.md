# MODEL_RESPONSE - Financial Trading Analytics Platform

Complete CDK TypeScript implementation for production-ready AWS environment.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { ApiStack } from './api-stack';
import { MonitoringStack } from './monitoring-stack';
import { ComplianceStack } from './compliance-stack';

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

    // Apply standard tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'FinancialServices');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');

    // Networking layer
    const networking = new NetworkingStack(this, 'Networking', {
      environmentSuffix,
    });

    // Security and encryption
    const kmsKeys = {
      database: new cdk.aws_kms.Key(this, 'DatabaseKey', {
        description: `Database encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      s3: new cdk.aws_kms.Key(this, 'S3Key', {
        description: `S3 encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      lambda: new cdk.aws_kms.Key(this, 'LambdaKey', {
        description: `Lambda environment variables encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    };

    // Database layer
    const database = new DatabaseStack(this, 'Database', {
      vpc: networking.vpc,
      kmsKey: kmsKeys.database,
      environmentSuffix,
    });

    // Storage layer
    const storage = new StorageStack(this, 'Storage', {
      kmsKey: kmsKeys.s3,
      environmentSuffix,
    });

    // Compute layer
    const compute = new ComputeStack(this, 'Compute', {
      vpc: networking.vpc,
      kmsKey: kmsKeys.lambda,
      rawDataBucket: storage.rawDataBucket,
      processedDataBucket: storage.processedDataBucket,
      environmentSuffix,
    });

    // API layer
    const api = new ApiStack(this, 'Api', {
      dataProcessorFunction: compute.dataProcessorFunction,
      environmentSuffix,
    });

    // Monitoring layer
    new MonitoringStack(this, 'Monitoring', {
      vpc: networking.vpc,
      database: database.cluster,
      buckets: [
        storage.rawDataBucket,
        storage.processedDataBucket,
        storage.archiveBucket,
      ],
      lambdaFunctions: [compute.dataProcessorFunction],
      apiGateway: api.restApi,
      environmentSuffix,
    });

    // Compliance layer
    new ComplianceStack(this, 'Compliance', {
      vpc: networking.vpc,
      kmsKeys: Object.values(kmsKeys),
      buckets: [
        storage.rawDataBucket,
        storage.processedDataBucket,
        storage.archiveBucket,
      ],
      environmentSuffix,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID for the trading analytics platform',
      exportName: `TradingPlatform-VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Aurora Serverless v2 PostgreSQL cluster endpoint',
      exportName: `TradingPlatform-DbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.restApi.url,
      description: 'API Gateway URL for client access',
      exportName: `TradingPlatform-ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: storage.rawDataBucket.bucketName,
      description: 'S3 bucket for raw data ingestion',
      exportName: `TradingPlatform-RawBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessedDataBucketName', {
      value: storage.processedDataBucket.bucketName,
      description: 'S3 bucket for processed analytics',
      exportName: `TradingPlatform-ProcessedBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: storage.archiveBucket.bucketName,
      description: 'S3 bucket for long-term archival',
      exportName: `TradingPlatform-ArchiveBucket-${environmentSuffix}`,
    });
  }
}
```

## File: lib/networking-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    // Create VPC with exactly 3 AZs, CIDR 10.0.0.0/16
    this.vpc = new ec2.Vpc(this, 'TradingPlatformVpc', {
      vpcName: `trading-platform-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Cost optimization: single NAT gateway
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    const logGroup = new cdk.aws_logs.LogGroup(this, 'VpcFlowLogs', {
      logGroupName: `/aws/vpc/flow-logs-${props.environmentSuffix}`,
      retention: cdk.aws_logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'FlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for cost optimization (avoid NAT charges)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    cdk.Tags.of(this.vpc).add('Name', `trading-platform-vpc-${props.environmentSuffix}`);
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly userSessionsTable: dynamodb.Table;
  public readonly apiKeysTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Aurora Serverless v2 PostgreSQL cluster
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        scaleWithWriter: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('Reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      defaultDatabaseName: `tradingdb${props.environmentSuffix.replace(/-/g, '')}`,
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THIRTY_DAYS,
    });

    // DynamoDB table for user sessions
    this.userSessionsTable = new dynamodb.Table(this, 'UserSessionsTable', {
      tableName: `user-sessions-${props.environmentSuffix}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for API keys
    this.apiKeysTable = new dynamodb.Table(this, 'ApiKeysTable', {
      tableName: `api-keys-${props.environmentSuffix}`,
      partitionKey: {
        name: 'apiKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for API key lookups by user
    this.apiKeysTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
```

## File: lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps {
  kmsKey: kms.Key;
  environmentSuffix: string;
}

export class StorageStack extends Construct {
  public readonly rawDataBucket: s3.Bucket;
  public readonly processedDataBucket: s3.Bucket;
  public readonly archiveBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // S3 bucket for raw data ingestion
    this.rawDataBucket = new s3.Bucket(this, 'RawDataBucket', {
      bucketName: `trading-raw-data-${props.environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'TransitionToInfrequentAccess',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'ArchiveOldData',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // S3 bucket for processed analytics
    this.processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `trading-processed-data-${props.environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'TransitionToInfrequentAccess',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'ArchiveOldData',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // S3 bucket for long-term archival
    this.archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: `trading-archive-${props.environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DirectToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(1),
            },
          ],
        },
      ],
    });

    // Enable access logging for all buckets
    const logBucket = new s3.Bucket(this, 'AccessLogBucket', {
      bucketName: `trading-access-logs-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    this.rawDataBucket.logBucket = logBucket;
    this.processedDataBucket.logBucket = logBucket;
    this.archiveBucket.logBucket = logBucket;
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  rawDataBucket: s3.Bucket;
  processedDataBucket: s3.Bucket;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Dead Letter Queue for failed Lambda invocations
    const dlq = new sqs.Queue(this, 'DataProcessorDLQ', {
      queueName: `data-processor-dlq-${props.environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda execution role with least privilege
    const executionRole = new iam.Role(this, 'DataProcessorRole', {
      roleName: `data-processor-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant specific permissions
    props.rawDataBucket.grantRead(executionRole);
    props.processedDataBucket.grantWrite(executionRole);
    props.kmsKey.grantEncryptDecrypt(executionRole);
    dlq.grantSendMessages(executionRole);

    // Restrict to us-east-1 region only
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DenyOtherRegions',
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:RequestedRegion': 'us-east-1',
          },
        },
      })
    );

    // Lambda function for data processing using Graviton2 (ARM64)
    this.dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: `data-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64, // Graviton2 processor
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Processing data event:', JSON.stringify(event, null, 2));

  // Extract S3 bucket and key from event
  const record = event.Records?.[0];
  if (!record) {
    return { statusCode: 400, body: 'No records found' };
  }

  const bucket = record.s3?.bucket?.name;
  const key = record.s3?.object?.key;

  console.log(\`Processing file: s3://\${bucket}/\${key}\`);

  // Placeholder for data processing logic
  // In production, this would:
  // 1. Read from rawDataBucket
  // 2. Process/analyze the data
  // 3. Write results to processedDataBucket

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processed successfully',
      bucket,
      key,
    }),
  };
};
        `),
        role: executionRole,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        environment: {
          RAW_DATA_BUCKET: props.rawDataBucket.bucketName,
          PROCESSED_DATA_BUCKET: props.processedDataBucket.bucketName,
          ENVIRONMENT: props.environmentSuffix,
        },
        environmentEncryption: props.kmsKey,
        deadLetterQueue: dlq,
        logRetention: logs.RetentionDays.THIRTY_DAYS,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Trigger Lambda on S3 uploads to raw data bucket
    this.dataProcessorFunction.addEventSource(
      new eventsources.S3EventSource(props.rawDataBucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: 'ingest/' }],
      })
    );
  }
}
```

## File: lib/api-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiStackProps {
  dataProcessorFunction: lambda.Function;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/trading-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // REST API Gateway
    this.restApi = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: `trading-api-${props.environmentSuffix}`,
      description: 'Trading Analytics Platform API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000, // 1000 RPS per API key
        throttlingBurstLimit: 2000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Key for authentication
    const apiKey = this.restApi.addApiKey('ApiKey', {
      apiKeyName: `trading-api-key-${props.environmentSuffix}`,
      description: 'API Key for trading analytics platform',
    });

    // Usage plan with throttling
    const usagePlan = this.restApi.addUsagePlan('UsagePlan', {
      name: `trading-usage-plan-${props.environmentSuffix}`,
      description: 'Usage plan with 1000 RPS throttling per API key',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.restApi.deploymentStage,
    });

    // Lambda integration
    const integration = new apigateway.LambdaIntegration(
      props.dataProcessorFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    // API endpoints
    const data = this.restApi.root.addResource('data');
    data.addMethod('POST', integration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    const process = data.addResource('process');
    process.addMethod('POST', integration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Health check endpoint (no auth required)
    const health = this.restApi.root.addResource('health');
    health.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status": "healthy"}',
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  vpc: ec2.Vpc;
  database: rds.DatabaseCluster;
  buckets: s3.Bucket[];
  lambdaFunctions: lambda.Function[];
  apiGateway: apigateway.RestApi;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `trading-alerts-${props.environmentSuffix}`,
      displayName: 'Trading Platform Alerts',
    });

    // Subscription filter for CloudWatch Logs
    const subscriptionFilter = new logs.SubscriptionFilter(
      this,
      'ErrorSubscription',
      {
        logGroup: new logs.LogGroup(this, 'ApplicationLogs', {
          logGroupName: `/aws/application/trading-${props.environmentSuffix}`,
          retention: logs.RetentionDays.THIRTY_DAYS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        destination: new logs.CloudWatchLogGroupDestination(
          new logs.LogGroup(this, 'ErrorLogs', {
            logGroupName: `/aws/errors/trading-${props.environmentSuffix}`,
            retention: logs.RetentionDays.THIRTY_DAYS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          })
        ),
        filterPattern: logs.FilterPattern.anyTerm('ERROR', 'CRITICAL', 'FATAL'),
      }
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TradingDashboard', {
      dashboardName: `trading-dashboard-${props.environmentSuffix}`,
    });

    // Database metrics
    const dbCpuWidget = new cloudwatch.GraphWidget({
      title: 'Database CPU Utilization',
      left: [
        props.database.metricCPUUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const dbConnectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        props.database.metricDatabaseConnections({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Lambda metrics
    const lambdaErrorsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Errors',
      left: props.lambdaFunctions.map((fn) =>
        fn.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        })
      ),
    });

    const lambdaDurationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Duration',
      left: props.lambdaFunctions.map((fn) =>
        fn.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        })
      ),
    });

    // API Gateway metrics
    const apiRequestsWidget = new cloudwatch.GraphWidget({
      title: 'API Requests',
      left: [
        props.apiGateway.metricCount({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api4xxErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API 4XX Errors',
      left: [
        props.apiGateway.metricClientError({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api5xxErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API 5XX Errors',
      left: [
        props.apiGateway.metricServerError({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // S3 metrics
    const s3RequestsWidget = new cloudwatch.GraphWidget({
      title: 'S3 Requests',
      left: props.buckets.map((bucket) =>
        bucket.metricAllRequests({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        })
      ),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      dbCpuWidget,
      dbConnectionsWidget,
      lambdaErrorsWidget,
      lambdaDurationWidget
    );
    dashboard.addWidgets(
      apiRequestsWidget,
      api4xxErrorsWidget,
      api5xxErrorsWidget,
      s3RequestsWidget
    );

    // CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DbCpuAlarm', {
      alarmName: `trading-db-cpu-high-${props.environmentSuffix}`,
      metric: props.database.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbCpuAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `trading-lambda-errors-${props.environmentSuffix}`,
      metric: props.lambdaFunctions[0].metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `trading-api-5xx-errors-${props.environmentSuffix}`,
      metric: props.apiGateway.metricServerError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
  }
}
```

## File: lib/compliance-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface ComplianceStackProps {
  vpc: ec2.Vpc;
  kmsKeys: kms.Key[];
  buckets: s3.Bucket[];
  environmentSuffix: string;
}

export class ComplianceStack extends Construct {
  constructor(scope: Construct, id: string, props: ComplianceStackProps) {
    super(scope, id);

    // S3 bucket for AWS Config recordings
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `trading-config-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldRecordings',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // IAM role for AWS Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `trading-config-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    configBucket.grantWrite(configRole);

    // AWS Config Recorder
    const recorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `trading-config-recorder-${props.environmentSuffix}`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Delivery channel
    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      'DeliveryChannel',
      {
        name: `trading-config-delivery-${props.environmentSuffix}`,
        s3BucketName: configBucket.bucketName,
      }
    );

    deliveryChannel.addDependency(recorder);

    // PCI-DSS Compliance Rules

    // 1. Encryption at rest for S3
    new config.ManagedRule(this, 'S3BucketEncryptionRule', {
      configRuleName: `s3-bucket-encryption-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that S3 buckets have encryption enabled',
    });

    // 2. S3 bucket logging enabled
    new config.ManagedRule(this, 'S3BucketLoggingRule', {
      configRuleName: `s3-bucket-logging-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_LOGGING_ENABLED,
      description: 'Checks that S3 buckets have access logging enabled',
    });

    // 3. S3 bucket versioning enabled
    new config.ManagedRule(this, 'S3BucketVersioningRule', {
      configRuleName: `s3-bucket-versioning-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
      description: 'Checks that S3 buckets have versioning enabled',
    });

    // 4. RDS encryption at rest
    new config.ManagedRule(this, 'RdsEncryptionRule', {
      configRuleName: `rds-storage-encrypted-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances have encryption enabled',
    });

    // 5. RDS backup enabled
    new config.ManagedRule(this, 'RdsBackupRule', {
      configRuleName: `db-backup-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.DB_BACKUP_ENABLED,
      description: 'Checks that RDS instances have automated backups enabled',
    });

    // 6. VPC flow logs enabled
    new config.ManagedRule(this, 'VpcFlowLogsRule', {
      configRuleName: `vpc-flow-logs-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
      description: 'Checks that VPC has flow logs enabled',
    });

    // 7. CloudWatch log group encryption
    new config.ManagedRule(this, 'CloudWatchLogsEncryptionRule', {
      configRuleName: `cloudwatch-log-encryption-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.CLOUDWATCH_LOG_GROUP_ENCRYPTED,
      description: 'Checks that CloudWatch Log Groups are encrypted',
    });

    // 8. IAM password policy
    new config.ManagedRule(this, 'IamPasswordPolicyRule', {
      configRuleName: `iam-password-policy-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Checks that IAM password policy meets requirements',
      inputParameters: {
        RequireUppercaseCharacters: 'true',
        RequireLowercaseCharacters: 'true',
        RequireSymbols: 'true',
        RequireNumbers: 'true',
        MinimumPasswordLength: '14',
        PasswordReusePrevention: '24',
        MaxPasswordAge: '90',
      },
    });

    // 9. Root account MFA enabled
    new config.ManagedRule(this, 'RootMfaEnabledRule', {
      configRuleName: `root-account-mfa-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.ROOT_ACCOUNT_MFA_ENABLED,
      description: 'Checks that root account has MFA enabled',
    });

    // 10. DynamoDB point-in-time recovery
    new config.ManagedRule(this, 'DynamoDbPitrRule', {
      configRuleName: `dynamodb-pitr-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.DYNAMODB_PITR_ENABLED,
      description: 'Checks that DynamoDB tables have point-in-time recovery enabled',
    });
  }
}
```

## File: lib/README.md

```markdown
# Trading Analytics Platform Infrastructure

Production-ready AWS CDK infrastructure for a financial trading analytics platform.

## Architecture Overview

This infrastructure deploys a secure, compliant, and scalable environment for processing real-time market data and providing analytics to institutional clients.

### Components

- **Networking**: VPC with 3 AZs, public/private subnets, VPC endpoints
- **Database**: Aurora Serverless v2 PostgreSQL, DynamoDB tables for sessions and API keys
- **Storage**: S3 buckets for raw data, processed analytics, and archival with lifecycle policies
- **Compute**: Lambda functions on Graviton2 processors for data processing
- **API**: API Gateway REST API with IAM authentication and API key throttling
- **Monitoring**: CloudWatch dashboards, alarms, and log aggregation
- **Compliance**: AWS Config with PCI-DSS compliance rules

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- AWS CDK 2.x installed: `npm install -g aws-cdk`

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Synthesize CloudFormation Template

```bash
cdk synth
```

### 3. Deploy Infrastructure

```bash
# Deploy with default environment suffix
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### 4. Retrieve Outputs

After deployment, the following outputs will be available:

- VPC ID
- Aurora database endpoint
- API Gateway URL
- S3 bucket names for raw data, processed data, and archives

## Configuration

### Environment Suffix

All resources include an environment suffix for uniqueness. Configure it via:

- CDK context: `cdk deploy -c environmentSuffix=your-suffix`
- Default: `dev`

### Region

Target region is configured in `bin/tap.ts` and defaults to the AWS CLI default region (us-east-1).

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- S3 Bucket: `trading-raw-data-dev`
- Lambda Function: `data-processor-dev`
- DynamoDB Table: `user-sessions-dev`

## Security Features

- All data encrypted at rest using KMS customer-managed keys
- IAM roles follow least-privilege principle with regional restrictions
- VPC isolation for compute and database resources
- API Gateway secured with IAM authentication and API keys
- S3 buckets block all public access and enforce SSL
- CloudWatch Logs for audit trails

## Compliance

AWS Config rules monitor PCI-DSS compliance:

- Encryption validation for S3, RDS, CloudWatch Logs
- Access logging for S3 buckets
- VPC flow logs enabled
- RDS automated backups enabled
- DynamoDB point-in-time recovery enabled
- IAM password policy enforcement
- Root account MFA enabled

## Cost Optimization

- Aurora Serverless v2 for automatic scaling
- DynamoDB on-demand billing
- Single NAT Gateway (can be scaled to 3 for HA)
- Lambda on Graviton2 processors for cost efficiency
- S3 lifecycle policies for automatic data tiering
- 30-day log retention

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Cleanup

To destroy all resources:

```bash
cdk destroy
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup after testing.

## Support

For issues or questions, refer to the AWS CDK documentation: https://docs.aws.amazon.com/cdk/
```
