# lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { ChaosTestingSystem } from './constructs/chaos-testing';
import { FailoverOrchestrator } from './constructs/failover-orchestrator';
import { GlobalDatabase } from './constructs/global-database';
import { HealthCheckSystem } from './constructs/health-check';
import { RegionalApi } from './constructs/regional-api';
import { PRIMARY_REGION, SECONDARY_REGIONS } from './utils/constants';

export interface TapStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
  alertEmail: string;
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  private globalDatabase: GlobalDatabase;
  private regionalApis: Map<string, RegionalApi> = new Map();
  private healthCheckSystem: HealthCheckSystem;
  private hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create global monitoring topic (region-specific)
    const globalAlertTopic = new sns.Topic(this, 'GlobalAlertTopic', {
      topicName: `financial-app-alerts-${this.region}-${environmentSuffix}`,
      displayName: `Financial Application Alerts - ${this.region} - ${environmentSuffix}`,
    });

    globalAlertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.alertEmail)
    );

    // Lookup hosted zone (commented out for LocalStack testing)
    // this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
    //   domainName: props.domainName,
    // });

    // Deploy global database
    this.globalDatabase = new GlobalDatabase(this, 'GlobalDatabase', {
      primaryRegion: PRIMARY_REGION,
      secondaryRegions: SECONDARY_REGIONS,
      databaseName: 'financial_transactions',
      backupRetentionDays: 30,
      enableBacktrack: false, // Backtrack not supported for Global Databases
      environmentSuffix: environmentSuffix,
      currentRegion: this.region, // Pass the current stack's region
    });

    // Deploy regional APIs
    this.deployRegionalInfrastructure(props);

    // Setup health check system (only for this stack's region)
    this.healthCheckSystem = new HealthCheckSystem(this, 'HealthCheckSystem', {
      regions: [this.region],
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      alertTopic: globalAlertTopic,
      environmentSuffix: environmentSuffix,
    });

    // Setup failover orchestration (only for this stack's region)
    const failoverOrchestrator = new FailoverOrchestrator(
      this,
      'FailoverOrchestrator',
      {
        regions: [this.region],
        regionalApis: this.regionalApis,
        globalDatabase: this.globalDatabase,
        healthCheckSystem: this.healthCheckSystem,
        alertTopic: globalAlertTopic,
        environmentSuffix: environmentSuffix,
      }
    );

    // Setup global routing (only if domain is provided, otherwise outputs will show IP addresses)
    if (props.domainName && props.certificateArn) {
      this.setupGlobalRouting(props.domainName);
    } else {
      // For non-prod environments, output API endpoints as IPs
      this.outputApiEndpoints();
    }

    // Create global dashboard
    this.createGlobalDashboard();

    // Setup chaos testing system (only for this stack's region)
    if (this.node.tryGetContext('enableChaosTests')) {
      new ChaosTestingSystem(this, 'ChaosTestingSystem', {
        regions: [this.region],
        regionalApis: this.regionalApis,
        failoverOrchestrator: failoverOrchestrator,
        environmentSuffix: environmentSuffix,
      });
    }
  }

  private deployRegionalInfrastructure(props: TapStackProps) {
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Deploy resources for THIS stack's region only
    const regionalApi = new RegionalApi(this, `RegionalApi-${this.region}`, {
      region: this.region,
      isPrimary: this.region === PRIMARY_REGION,
      certificateArn: props.certificateArn,
      globalDatabase: this.globalDatabase,
      domainName: props.domainName
        ? `${this.region}.${props.domainName}`
        : undefined,
      environmentSuffix: environmentSuffix,
    });

    this.regionalApis.set(this.region, regionalApi);
  }

  private setupGlobalRouting(domainName: string) {
    // Only setup Route53 if hosted zone is available (production environments)
    if (this.hostedZone) {
      const primaryDomain =
        this.regionalApis.get(PRIMARY_REGION)!.apiGatewayDomainName;

      if (primaryDomain) {
        // Create Route53 record set with latency routing
        new route53.RecordSet(this, 'GlobalLatencyRouting', {
          recordType: route53.RecordType.A,
          recordName: `api.${domainName}`,
          zone: this.hostedZone,
          target: route53.RecordTarget.fromAlias(
            new route53Targets.ApiGatewayDomain(primaryDomain)
          ),
          setIdentifier: PRIMARY_REGION,
          region: PRIMARY_REGION,
        });

        // Add secondary regions
        for (const region of SECONDARY_REGIONS) {
          const regionalDomain =
            this.regionalApis.get(region)!.apiGatewayDomainName;

          if (regionalDomain) {
            new route53.RecordSet(this, `LatencyRouting-${region}`, {
              recordType: route53.RecordType.A,
              recordName: `api.${domainName}`,
              zone: this.hostedZone,
              target: route53.RecordTarget.fromAlias(
                new route53Targets.ApiGatewayDomain(regionalDomain)
              ),
              setIdentifier: region,
              region: region,
            });
          }
        }
      }
    }
  }

  private outputApiEndpoints() {
    // Output comprehensive information for testing
    for (const region of Array.from(this.regionalApis.keys())) {
      const api = this.regionalApis.get(region)!;

      // API Gateway URL
      new cdk.CfnOutput(this, `${region}-ApiEndpoint`, {
        value: api.api.url,
        description: `API Gateway endpoint for ${region}`,
        exportName: `${this.stackName}-${region}-api-endpoint`,
      });

      // API Gateway ID
      new cdk.CfnOutput(this, `${region}-ApiId`, {
        value: api.api.restApiId,
        description: `API Gateway ID for ${region}`,
        exportName: `${this.stackName}-${region}-api-id`,
      });

      // DynamoDB Table Name
      new cdk.CfnOutput(this, `${region}-SessionTableName`, {
        value: api.sessionTable.tableName,
        description: `DynamoDB session table for ${region}`,
        exportName: `${this.stackName}-${region}-session-table`,
      });

      // Transaction Processor Lambda ARN
      new cdk.CfnOutput(this, `${region}-TransactionProcessorArn`, {
        value: api.transactionProcessor.functionArn,
        description: `Transaction processor Lambda ARN for ${region}`,
        exportName: `${this.stackName}-${region}-txn-processor-arn`,
      });

      // Transaction Processor Lambda Name
      new cdk.CfnOutput(this, `${region}-TransactionProcessorName`, {
        value: api.transactionProcessor.functionName,
        description: `Transaction processor Lambda name for ${region}`,
      });
    }

    // Database outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.globalDatabase.primaryCluster.clusterEndpoint.hostname,
      description: `Database cluster endpoint for ${this.region}`,
      exportName: `${this.stackName}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.globalDatabase.primaryCluster.clusterEndpoint.port.toString(),
      description: 'Database cluster port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.globalDatabase.credentials.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${this.stackName}-db-secret-arn`,
    });

    // Dashboard URL
    const dashboardUrl = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=financial-app-dr-${this.region}-${this.node.tryGetContext('environmentSuffix') || 'dev'}`;
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: dashboardUrl,
      description: 'CloudWatch dashboard URL',
    });

    // Health check Lambda ARN
    new cdk.CfnOutput(this, 'HealthCheckLambdaArn', {
      value: this.healthCheckSystem.getHealthCheckId(this.region) || 'N/A',
      description: 'Health check system identifier',
    });

    // Region info
    new cdk.CfnOutput(this, 'DeployedRegion', {
      value: this.region,
      description: 'AWS region where this stack is deployed',
    });

    new cdk.CfnOutput(this, 'IsPrimaryRegion', {
      value: (this.region === PRIMARY_REGION).toString(),
      description: 'Whether this is the primary region',
    });
  }

  private createGlobalDashboard() {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    const dashboard = new cloudwatch.Dashboard(this, 'GlobalDashboard', {
      dashboardName: `financial-app-dr-${this.region}-${environmentSuffix}`,
    });

    // Add widgets for this stack's region
    const widgets: cloudwatch.IWidget[] = [];

    for (const region of Array.from(this.regionalApis.keys())) {
      const api = this.regionalApis.get(region)!;

      widgets.push(
        new cloudwatch.GraphWidget({
          title: `${region} - API Performance`,
          left: [api.latencyMetric, api.errorMetric],
          right: [api.requestCountMetric],
          leftYAxis: { label: 'Latency (ms)' },
          rightYAxis: { label: 'Count' },
          period: cdk.Duration.minutes(1),
          statistic: 'Average',
        })
      );

      // Only add replication lag widget for secondary regions
      if (region !== PRIMARY_REGION) {
        const metric = this.globalDatabase.getReplicationLagMetric(region);
        if (metric) {
          widgets.push(
            new cloudwatch.SingleValueWidget({
              title: `${region} - Database Replication Lag`,
              metrics: [metric],
              period: cdk.Duration.minutes(1),
            })
          );
        }
      }
    }

    dashboard.addWidgets(...widgets);
  }
}
```

# lib/constructs/global-database.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface GlobalDatabaseProps {
  primaryRegion: string;
  secondaryRegions: string[];
  databaseName: string;
  backupRetentionDays: number;
  enableBacktrack: boolean;
  environmentSuffix?: string;
  currentRegion?: string; // The region this stack is being deployed to
}

export class GlobalDatabase extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryClusters: Map<string, rds.DatabaseCluster> =
    new Map();
  public readonly credentials: secretsmanager.ISecret;
  private readonly replicationMetrics: Map<string, cloudwatch.Metric> =
    new Map();
  private readonly parameterGroup: rds.ParameterGroup;

  constructor(scope: Construct, id: string, props: GlobalDatabaseProps) {
    super(scope, id);

    const envSuffix = props.environmentSuffix || 'dev';
    const currentRegion = props.currentRegion || cdk.Stack.of(this).region;
    const isPrimaryRegion = currentRegion === props.primaryRegion;

    // Create encryption key (region-specific)
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: `Database encryption key for ${currentRegion}`,
      enableKeyRotation: true,
      alias: `financial-app-db-key-${currentRegion}-${envSuffix}`,
    });

    // Create credentials
    this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'Global database master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // Create parameter group once for reuse
    this.parameterGroup = this.createParameterGroup();

    // Create VPC for this region
    const vpc = new ec2.Vpc(this, `Vpc-${currentRegion}`, {
      maxAzs: 3,
      natGateways: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    // Create database cluster for this region
    const cluster = new rds.DatabaseCluster(this, `Cluster-${currentRegion}`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `findb-${currentRegion}-${envSuffix}`,
      }),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE4
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE4
          ),
        }),
        rds.ClusterInstance.provisioned('reader2', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE4
          ),
        }),
      ],
      backup: {
        retention: cdk.Duration.days(props.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      parameterGroup: this.parameterGroup,
    });

    // Set the primary cluster reference
    this.primaryCluster = cluster;

    // Create Global Cluster ONLY in the primary region
    if (isPrimaryRegion) {
      // Create global cluster from primary cluster
      // Note: When using sourceDbClusterIdentifier, don't specify engine properties
      // as they're inherited from the source cluster
      this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `financial-app-global-cluster-${envSuffix}`,
        sourceDbClusterIdentifier: cluster.clusterArn,
      });
    }

    // Setup replication monitoring
    this.setupReplicationMonitoring(
      props.primaryRegion,
      props.secondaryRegions
    );
  }

  private createParameterGroup(): rds.ParameterGroup {
    return new rds.ParameterGroup(this, 'AuroraParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      description: 'Optimized for financial transactions',
      parameters: {
        // Parameters compatible with Aurora MySQL 8.0
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
        max_connections: '5000',
        innodb_lock_wait_timeout: '5',
        binlog_format: 'ROW',
        // aurora_binlog_replication_max_yield_seconds: Not supported in MySQL 8.0
        // aurora_enable_repl_bin_log_filtering: Not supported in MySQL 8.0
      },
    });
  }

  // Note: Secondary clusters are now created in their own regional stacks
  // This method is kept for backward compatibility but may not be needed
  private createSecondaryClusters(
    _regions: string[],
    _encryptionKey: kms.IKey,
    _envSuffix: string
  ) {
    // In multi-region deployment, each region creates its own cluster
    // No need to create secondary clusters here
  }

  private setupReplicationMonitoring(
    primaryRegion: string,
    secondaryRegions: string[]
  ) {
    // Create custom metrics for replication lag
    for (const region of secondaryRegions) {
      const metric = new cloudwatch.Metric({
        namespace: 'FinancialApp/Database',
        metricName: 'ReplicationLag',
        dimensionsMap: {
          SourceRegion: primaryRegion,
          TargetRegion: region,
        },
        statistic: 'Average',
        period: cdk.Duration.seconds(60),
      });

      this.replicationMetrics.set(region, metric);

      // Create alarm for replication lag
      new cloudwatch.Alarm(this, `ReplicationLagAlarm-${region}`, {
        metric: metric,
        threshold: 50, // 50ms threshold
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `Replication lag from ${primaryRegion} to ${region} exceeds 50ms`,
      });
    }
  }

  public getReplicationLagMetric(region: string): cloudwatch.Metric {
    return this.replicationMetrics.get(region)!;
  }

  public getConnectionString(_region: string): string {
    // Each region uses its own cluster (primaryCluster holds this region's cluster)
    return this.primaryCluster.clusterEndpoint.socketAddress;
  }
}
```

# lib/constructs/regional-api.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';

export interface RegionalApiProps {
  region: string;
  isPrimary: boolean;
  certificateArn?: string;
  globalDatabase: GlobalDatabase;
  domainName?: string;
  environmentSuffix?: string;
}

export class RegionalApi extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiGatewayDomainName?: apigateway.DomainName;
  public latencyMetric!: cloudwatch.Metric;
  public errorMetric!: cloudwatch.Metric;
  public requestCountMetric!: cloudwatch.Metric;
  public readonly sessionTable: dynamodb.ITable;
  public readonly transactionProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: RegionalApiProps) {
    super(scope, id);

    // Create DynamoDB Table for sessions
    // Note: For production multi-region deployment, use Global Tables with replicationRegions
    // For LocalStack/single-region testing, we create separate tables per region
    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `financial-app-sessions-${props.region}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
      // replicationRegions: For production, enable global tables across regions
    });

    // Create log group for transaction processor with deletion policy
    const transactionLogGroup = new logs.LogGroup(
      this,
      'TransactionProcessorLogGroup',
      {
        logGroupName: `/aws/lambda/financial-transaction-processor-${props.region}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Determine reserved concurrency based on environment
    const envSuffix = props.environmentSuffix || 'dev';
    const reservedConcurrency = envSuffix === 'prod' ? 1000 : undefined; // Only reserve for production

    // Create transaction processing Lambda
    this.transactionProcessor = new lambda.Function(
      this,
      'TransactionProcessor',
      {
        functionName: `financial-transaction-processor-${props.region}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/transaction-processor'),
        architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
        memorySize: 3008,
        timeout: cdk.Duration.seconds(30),
        reservedConcurrentExecutions: reservedConcurrency,
        environment: {
          DB_CONNECTION_STRING: props.globalDatabase.getConnectionString(
            props.region
          ),
          DB_SECRET_ARN: props.globalDatabase.credentials.secretArn,
          SESSION_TABLE_NAME: this.sessionTable.tableName,
          REGION: props.region,
          IS_PRIMARY: props.isPrimary.toString(),
        },
        tracing: lambda.Tracing.ACTIVE,
        logGroup: transactionLogGroup,
      }
    );

    // Grant permissions
    props.globalDatabase.credentials.grantRead(this.transactionProcessor);
    this.sessionTable.grantReadWriteData(this.transactionProcessor);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'FinancialApi', {
      restApiName: `financial-api-${props.region}`,
      description: `Financial API - ${props.region}`,
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        throttlingRateLimit: 10000,
        throttlingBurstLimit: 5000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Setup custom domain (only for prod environments with certificate)
    if (props.domainName && props.certificateArn) {
      this.apiGatewayDomainName = new apigateway.DomainName(this, 'ApiDomain', {
        domainName: props.domainName,
        certificate: certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.certificateArn
        ),
        endpointType: apigateway.EndpointType.REGIONAL,
      });

      new apigateway.BasePathMapping(this, 'BasePathMapping', {
        domainName: this.apiGatewayDomainName,
        restApi: this.api,
      });
    }

    // Create API resources
    this.createApiResources();

    // Setup custom metrics
    this.setupMetrics();
  }

  private createApiResources() {
    const transactionResource = this.api.root.addResource('transactions');
    const healthResource = this.api.root.addResource('health');

    // Transaction endpoints
    transactionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.transactionProcessor),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
        requestValidator: new apigateway.RequestValidator(
          this,
          'TransactionValidator',
          {
            restApi: this.api,
            requestValidatorName: 'transaction-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
          }
        ),
      }
    );

    transactionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.transactionProcessor)
    );

    // Health check endpoint
    const healthLambda = new lambda.Function(this, 'HealthCheckHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              region: process.env.AWS_REGION
            })
          };
        };
      `),
    });

    healthResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(healthLambda)
    );
  }

  private setupMetrics() {
    this.latencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    this.errorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    this.requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    // Create alarms
    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: this.latencyMetric,
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'API latency is too high',
    });

    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: new cloudwatch.MathExpression({
        expression: 'errors / requests * 100',
        usingMetrics: {
          errors: this.errorMetric,
          requests: this.requestCountMetric,
        },
      }),
      threshold: 1, // 1% error rate
      evaluationPeriods: 2,
      alarmDescription: 'API error rate is too high',
    });
  }
}
```

# lib/constructs/health-check.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';
import { RegionalApi } from './regional-api';

export interface HealthCheckSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  alertTopic: sns.ITopic;
  environmentSuffix?: string;
}

export class HealthCheckSystem extends Construct {
  private healthChecks: Map<string, route53.CfnHealthCheck> = new Map();
  private healthMetrics: Map<string, cloudwatch.Metric> = new Map();

  constructor(scope: Construct, id: string, props: HealthCheckSystemProps) {
    super(scope, id);

    // Create comprehensive health check Lambda
    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;

    const healthCheckerLogGroup = new logs.LogGroup(
      this,
      'HealthCheckerLogGroup',
      {
        logGroupName: `/aws/lambda/financial-app-health-checker-${stackRegion}-${envSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const healthChecker = new lambda.Function(this, 'HealthChecker', {
      functionName: `financial-app-health-checker-${stackRegion}-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/health-checker'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        ALERT_TOPIC_ARN: props.alertTopic.topicArn,
      },
      logGroup: healthCheckerLogGroup,
    });

    props.alertTopic.grantPublish(healthChecker);

    // Create health checks for each region
    for (const region of props.regions) {
      const api = props.regionalApis.get(region)!;

      // Route53 health check (only if custom domain is configured)
      if (api.apiGatewayDomainName) {
        const healthCheck = new route53.CfnHealthCheck(
          this,
          `HealthCheck-${region}`,
          {
            healthCheckConfig: {
              port: 443,
              type: 'HTTPS',
              resourcePath: '/health',
              fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
              requestInterval: 30,
              failureThreshold: 2,
              measureLatency: true,
            },
          }
        );

        this.healthChecks.set(region, healthCheck);
      }

      // Create custom health metric
      const healthMetric = new cloudwatch.Metric({
        namespace: 'FinancialApp/Health',
        metricName: 'RegionHealth',
        dimensionsMap: {
          Region: region,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      });

      this.healthMetrics.set(region, healthMetric);

      // Schedule comprehensive health checks
      const apiEndpoint = api.apiGatewayDomainName
        ? `https://${api.apiGatewayDomainName.domainName}`
        : api.api.url;

      new events.Rule(this, `HealthCheckRule-${region}`, {
        schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
        targets: [
          new targets.LambdaFunction(healthChecker, {
            event: events.RuleTargetInput.fromObject({
              region: region,
              apiEndpoint: apiEndpoint,
              dbConnectionString:
                props.globalDatabase.getConnectionString(region),
              checks: [
                'api_latency',
                'database_connection',
                'database_replication_lag',
                'transaction_processing',
                'session_consistency',
              ],
            }),
          }),
        ],
      });
    }

    // Create composite health dashboard
    this.createHealthDashboard(props.regions);
  }

  private createHealthDashboard(regions: string[]) {
    const envSuffix =
      cdk.Stack.of(this).node.tryGetContext('environmentSuffix') || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    const dashboard = new cloudwatch.Dashboard(this, 'HealthDashboard', {
      dashboardName: `financial-app-health-${stackRegion}-${envSuffix}`,
    });

    const widgets = regions.map(
      region =>
        new cloudwatch.GraphWidget({
          title: `${region} Health Score`,
          left: [this.healthMetrics.get(region)!],
          leftYAxis: {
            min: 0,
            max: 100,
          },
          period: cdk.Duration.minutes(1),
        })
    );

    dashboard.addWidgets(...widgets);
  }

  public getHealthCheckId(region: string): string | undefined {
    const healthCheck = this.healthChecks.get(region);
    return healthCheck?.attrHealthCheckId;
  }
}
```

# lib/constructs/failover-orchestrator.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';
import { HealthCheckSystem } from './health-check';
import { RegionalApi } from './regional-api';

export interface FailoverOrchestratorProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  healthCheckSystem: HealthCheckSystem;
  alertTopic: sns.ITopic;
  environmentSuffix?: string;
}

export class FailoverOrchestrator extends Construct {
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: FailoverOrchestratorProps) {
    super(scope, id);

    // Create Lambda functions for failover tasks
    const validateHealthFunction = this.createValidateHealthFunction();
    const promoteReplicaFunction = this.createPromoteReplicaFunction();
    const updateRoutingFunction = this.createUpdateRoutingFunction();
    const validateFailoverFunction = this.createValidateFailoverFunction();

    // Define Step Functions workflow
    const validateHealth = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ValidateHealth',
      {
        lambdaFunction: validateHealthFunction,
        outputPath: '$.Payload',
      }
    );

    const checkNeedFailover = new stepfunctions.Choice(
      this,
      'CheckNeedFailover'
    )
      .when(
        stepfunctions.Condition.stringEquals('$.failoverRequired', 'true'),
        new stepfunctions.Parallel(this, 'ExecuteFailover')
          .branch(
            new stepfunctionsTasks.LambdaInvoke(this, 'PromoteReplica', {
              lambdaFunction: promoteReplicaFunction,
              outputPath: '$.Payload',
            })
          )
          .branch(
            new stepfunctionsTasks.LambdaInvoke(this, 'UpdateRouting', {
              lambdaFunction: updateRoutingFunction,
              outputPath: '$.Payload',
            })
          )
          .next(
            new stepfunctionsTasks.LambdaInvoke(this, 'ValidateFailover', {
              lambdaFunction: validateFailoverFunction,
              outputPath: '$.Payload',
            })
          )
      )
      .otherwise(new stepfunctions.Succeed(this, 'NoFailoverNeeded'));

    const definition = validateHealth.next(checkNeedFailover);

    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    this.stateMachine = new stepfunctions.StateMachine(
      this,
      'FailoverStateMachine',
      {
        definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
        stateMachineName: `financial-app-failover-${stackRegion}-${envSuffix}`,
        timeout: cdk.Duration.minutes(15),
      }
    );

    // Grant permissions
    props.alertTopic.grantPublish(this.stateMachine);
  }

  private createValidateHealthFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'ValidateHealthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudWatch = new AWS.CloudWatch();
        
        exports.handler = async (event) => {
          // Comprehensive health validation logic
          const healthChecks = await Promise.all([
            checkApiHealth(event.region),
            checkDatabaseHealth(event.region),
            checkReplicationLag(event.region)
          ]);
          
          const failoverRequired = healthChecks.some(check => !check.healthy);
          
          return {
            failoverRequired: failoverRequired.toString(),
            healthStatus: healthChecks,
            targetRegion: selectBestFailoverRegion(event.regions, healthChecks)
          };
        };
        
        async function checkApiHealth(region) {
          // Implementation
        }
        
        async function checkDatabaseHealth(region) {
          // Implementation
        }
        
        async function checkReplicationLag(region) {
          // Implementation
        }
        
        function selectBestFailoverRegion(regions, healthChecks) {
          // Implementation to select optimal failover region
        }
      `),
      timeout: cdk.Duration.minutes(2),
    });

    return fn;
  }

  private createPromoteReplicaFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'PromoteReplicaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/promote-replica'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      timeout: cdk.Duration.minutes(5),
      role: new iam.Role(this, 'PromoteReplicaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          RDSPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'rds:PromoteReadReplicaDBCluster',
                  'rds:ModifyDBCluster',
                  'rds:DescribeDBClusters',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }),
    });

    return fn;
  }

  private createUpdateRoutingFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'UpdateRoutingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const route53 = new AWS.Route53();
        
        exports.handler = async (event) => {
          // Update Route53 weights to redirect traffic
          const changeSet = {
            Changes: [
              {
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: event.recordName,
                  Type: 'A',
                  SetIdentifier: event.failoverRegion,
                  Weight: 100,
                  // Additional configuration
                }
              }
            ]
          };
          
          await route53.changeResourceRecordSets({
            HostedZoneId: event.hostedZoneId,
            ChangeBatch: changeSet
          }).promise();
          
          return { status: 'routing_updated' };
        };
      `),
      timeout: cdk.Duration.minutes(2),
    });

    return fn;
  }

  private createValidateFailoverFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'ValidateFailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Validate failover success
          const validations = await Promise.all([
            validateNewPrimary(event.targetRegion),
            validateTrafficRouting(event.targetRegion),
            validateDataConsistency(event.targetRegion)
          ]);
          
          return {
            failoverSuccessful: validations.every(v => v.passed),
            validationResults: validations
          };
        };
        
        async function validateNewPrimary(region) {
          // Implementation
        }
        
        async function validateTrafficRouting(region) {
          // Implementation
        }
        
        async function validateDataConsistency(region) {
          // Implementation
        }
      `),
      timeout: cdk.Duration.minutes(3),
    });

    return fn;
  }
}
```

# lib/constructs/chaos-testing.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { FailoverOrchestrator } from './failover-orchestrator';
import { RegionalApi } from './regional-api';

export interface ChaosTestingSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  failoverOrchestrator: FailoverOrchestrator;
  environmentSuffix?: string;
}

export class ChaosTestingSystem extends Construct {
  constructor(scope: Construct, id: string, props: ChaosTestingSystemProps) {
    super(scope, id);

    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;

    // Create log group for chaos runner with deletion policy
    const chaosLogGroup = new logs.LogGroup(this, 'ChaosRunnerLogGroup', {
      logGroupName: `/aws/lambda/financial-app-chaos-runner-${stackRegion}-${envSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create chaos testing Lambda
    const chaosRunner = new lambda.Function(this, 'ChaosRunner', {
      functionName: `financial-app-chaos-runner-${stackRegion}-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/chaos-runner'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      environment: {
        REGIONS: JSON.stringify(props.regions),
        FAILOVER_STATE_MACHINE_ARN:
          props.failoverOrchestrator.stateMachine.stateMachineArn,
      },
      role: this.createChaosRole(),
      logGroup: chaosLogGroup,
    });

    // Schedule chaos tests (disabled by default)
    const chaosSchedule = new events.Rule(this, 'ChaosSchedule', {
      schedule: events.Schedule.expression('rate(7 days)'),
      enabled: false, // Enable manually when ready to test
    });

    chaosSchedule.addTarget(
      new targets.LambdaFunction(chaosRunner, {
        event: events.RuleTargetInput.fromObject({
          testScenarios: [
            'region_failure',
            'database_slowdown',
            'api_throttling',
            'network_partition',
            'certificate_expiry',
          ],
          duration: 300, // 5 minutes
          targetRegions: props.regions,
        }),
      })
    );

    // Create SSM parameter for enabling/disabling chaos tests (region-specific)
    new ssm.StringParameter(this, 'ChaosTestingEnabled', {
      parameterName: `/financial-app/chaos-testing/enabled-${stackRegion}-${envSuffix}`,
      stringValue: 'false',
      description: 'Enable or disable chaos testing',
    });

    // Create test result storage
    this.createTestResultStorage();
  }

  private createChaosRole(): iam.Role {
    return new iam.Role(this, 'ChaosRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        ChaosPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ec2:RebootInstances',
                'rds:RebootDBInstance',
                'rds:FailoverDBCluster',
                'elasticloadbalancing:SetRulePriorities',
                'route53:ChangeResourceRecordSets',
                'states:StartExecution',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': cdk.Stack.of(this).region,
                },
              },
            }),
          ],
        }),
      },
    });
  }

  private createTestResultStorage() {
    const envSuffix =
      cdk.Stack.of(this).node.tryGetContext('environmentSuffix') || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    // Create S3 bucket for test results (region-specific)
    // Keep name short to stay under 63 character limit
    new s3.Bucket(this, 'ChaosTestResults', {
      bucketName: `chaos-results-${stackRegion}-${envSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-results',
          expiration: cdk.Duration.days(90),
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
  }
}
```

# lib/utils/constants.ts

```typescript
export const PRIMARY_REGION = 'us-west-2';
export const SECONDARY_REGIONS = ['us-east-2'];
export const REGIONS = [PRIMARY_REGION, ...SECONDARY_REGIONS];

export const AVAILABILITY_TARGET = 0.99999; // 99.999%
export const MAX_REPLICATION_LAG_MS = 50;
export const TARGET_TPS = 10000;

export const HEALTH_CHECK_INTERVALS = {
  INFRASTRUCTURE: 30, // seconds
  APPLICATION: 60, // seconds
  DATABASE: 60, // seconds
};

export const FAILOVER_THRESHOLDS = {
  API_ERROR_RATE: 0.01, // 1%
  API_LATENCY_MS: 1000,
  DB_CONNECTION_FAILURES: 3,
  REPLICATION_LAG_MS: 100,
};
```
