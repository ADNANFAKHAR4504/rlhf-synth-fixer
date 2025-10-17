### Main Stack - `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { GlobalDatabase } from './constructs/global-database';
import { RegionalApi } from './constructs/regional-api';
import { HealthCheckSystem } from './constructs/health-check';
import { FailoverOrchestrator } from './constructs/failover-orchestrator';
import { ChaosTestingSystem } from './constructs/chaos-testing';
import { REGIONS, PRIMARY_REGION, SECONDARY_REGIONS } from './utils/constants';

export interface TapStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string;
  alertEmail: string;
}

export class TapStack extends cdk.Stack {
  private globalDatabase: GlobalDatabase;
  private regionalApis: Map<string, RegionalApi> = new Map();
  private healthCheckSystem: HealthCheckSystem;
  private hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create global monitoring topic
    const globalAlertTopic = new sns.Topic(this, 'GlobalAlertTopic', {
      topicName: 'financial-app-global-alerts',
      displayName: 'Financial Application Global Alerts'
    });

    globalAlertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.alertEmail)
    );

    // Lookup hosted zone
    this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.domainName,
    });

    // Deploy global database
    this.globalDatabase = new GlobalDatabase(this, 'GlobalDatabase', {
      primaryRegion: PRIMARY_REGION,
      secondaryRegions: SECONDARY_REGIONS,
      databaseName: 'financial_transactions',
      backupRetentionDays: 30,
      enableBacktrack: true,
    });

    // Deploy regional APIs
    this.deployRegionalInfrastructure(props);

    // Setup health check system
    this.healthCheckSystem = new HealthCheckSystem(this, 'HealthCheckSystem', {
      regions: REGIONS,
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      alertTopic: globalAlertTopic,
    });

    // Setup failover orchestration
    const failoverOrchestrator = new FailoverOrchestrator(this, 'FailoverOrchestrator', {
      regions: REGIONS,
      regionalApis: this.regionalApis,
      globalDatabase: this.globalDatabase,
      healthCheckSystem: this.healthCheckSystem,
      alertTopic: globalAlertTopic,
    });

    // Setup global routing with latency-based routing
    this.setupGlobalRouting(props.domainName);

    // Create global dashboard
    this.createGlobalDashboard();

    // Setup chaos testing system
    if (this.node.tryGetContext('enableChaosTests')) {
      new ChaosTestingSystem(this, 'ChaosTestingSystem', {
        regions: REGIONS,
        regionalApis: this.regionalApis,
        failoverOrchestrator: failoverOrchestrator,
      });
    }
  }

  private deployRegionalInfrastructure(props: TapStackProps) {
    for (const region of REGIONS) {
      const regionalApi = new RegionalApi(this, `RegionalApi-${region}`, {
        region: region,
        isPrimary: region === PRIMARY_REGION,
        certificateArn: props.certificateArn,
        globalDatabase: this.globalDatabase,
        domainName: `${region}.${props.domainName}`,
      });

      this.regionalApis.set(region, regionalApi);
    }
  }

  private setupGlobalRouting(domainName: string) {
    // Create Route53 record set with latency routing
    const recordSetGroup = new route53.RecordSet(this, 'GlobalLatencyRouting', {
      recordType: route53.RecordType.A,
      recordName: `api.${domainName}`,
      zone: this.hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(
          this.regionalApis.get(PRIMARY_REGION)!.apiGatewayDomainName
        )
      ),
      setIdentifier: PRIMARY_REGION,
      region: PRIMARY_REGION,
      healthCheckId: this.healthCheckSystem.getHealthCheckId(PRIMARY_REGION),
    });

    // Add secondary regions
    for (const region of SECONDARY_REGIONS) {
      new route53.RecordSet(this, `LatencyRouting-${region}`, {
        recordType: route53.RecordType.A,
        recordName: `api.${domainName}`,
        zone: this.hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGatewayDomain(
            this.regionalApis.get(region)!.apiGatewayDomainName
          )
        ),
        setIdentifier: region,
        region: region,
        healthCheckId: this.healthCheckSystem.getHealthCheckId(region),
      });
    }
  }

  private createGlobalDashboard() {
    const dashboard = new cloudwatch.Dashboard(this, 'GlobalDashboard', {
      dashboardName: 'financial-app-global-dr',
    });

    // Add widgets for each region
    const widgets: cloudwatch.IWidget[] = [];

    for (const region of REGIONS) {
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

      widgets.push(
        new cloudwatch.SingleValueWidget({
          title: `${region} - Database Replication Lag`,
          metrics: [this.globalDatabase.getReplicationLagMetric(region)],
          period: cdk.Duration.minutes(1),
        })
      );
    }

    dashboard.addWidgets(...widgets);
  }
}
```

### Global Database Construct - `lib/constructs/global-database.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface GlobalDatabaseProps {
  primaryRegion: string;
  secondaryRegions: string[];
  databaseName: string;
  backupRetentionDays: number;
  enableBacktrack: boolean;
}

export class GlobalDatabase extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryClusters: Map<string, rds.DatabaseCluster> = new Map();
  public readonly credentials: secretsmanager.ISecret;
  private readonly replicationMetrics: Map<string, cloudwatch.Metric> = new Map();

  constructor(scope: Construct, id: string, props: GlobalDatabaseProps) {
    super(scope, id);

    // Create encryption key
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: 'Global database encryption key',
      enableKeyRotation: true,
      alias: 'financial-app-db-key',
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

    // Create global cluster
    this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
      globalClusterIdentifier: 'financial-app-global-cluster',
      sourceDbClusterIdentifier: undefined, // Will be set after primary cluster creation
      storageEncrypted: true,
      engine: 'aurora-mysql',
      engineVersion: '5.7.mysql_aurora.2.10.2',
    });

    // Create primary cluster
    const primaryVpc = new ec2.Vpc(this, 'PrimaryVpc', {
      maxAzs: 3,
      natGateways: 3,
      cidr: '10.0.0.0/16',
    });

    this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
      }),
      credentials: rds.Credentials.fromSecret(this.credentials),
      instanceProps: {
        vpc: primaryVpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE4),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      },
      instances: 3,
      backup: {
        retention: cdk.Duration.days(props.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      parameterGroup: this.createParameterGroup(),
    });

    // Enable backtrack if requested
    if (props.enableBacktrack) {
      const cfnCluster = this.primaryCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.backtrackWindow = 72; // 72 hours
    }

    // Update global cluster with primary cluster ARN
    this.globalCluster.sourceDbClusterIdentifier = this.primaryCluster.clusterArn;

    // Create secondary clusters
    this.createSecondaryClusters(props.secondaryRegions, encryptionKey);

    // Setup replication monitoring
    this.setupReplicationMonitoring(props.primaryRegion, props.secondaryRegions);
  }

  private createParameterGroup(): rds.ParameterGroup {
    return new rds.ParameterGroup(this, 'AuroraParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
      }),
      description: 'Optimized for financial transactions',
      parameters: {
        'innodb_buffer_pool_size': '{DBInstanceClassMemory*3/4}',
        'max_connections': '5000',
        'innodb_lock_wait_timeout': '5',
        'binlog_format': 'ROW',
        'aurora_binlog_replication_max_yield_seconds': '0',
        'aurora_enable_repl_bin_log_filtering': '0',
      },
    });
  }

  private createSecondaryClusters(regions: string[], encryptionKey: kms.IKey) {
    for (const region of regions) {
      // Note: In practice, you'd need to create these in separate stacks per region
      // This is a simplified representation
      const secondaryVpc = new ec2.Vpc(this, `SecondaryVpc-${region}`, {
        maxAzs: 3,
        natGateways: 3,
        cidr: `10.${regions.indexOf(region) + 1}.0.0/16`,
      });

      const secondaryCluster = new rds.DatabaseCluster(this, `SecondaryCluster-${region}`, {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
        }),
        credentials: rds.Credentials.fromSecret(this.credentials),
        instanceProps: {
          vpc: secondaryVpc,
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE4),
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        },
        instances: 3,
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        parameterGroup: this.createParameterGroup(),
      });

      this.secondaryClusters.set(region, secondaryCluster);

      // Add to global cluster
      new rds.CfnGlobalCluster(this, `GlobalClusterMember-${region}`, {
        globalClusterIdentifier: this.globalCluster.globalClusterIdentifier,
        sourceDbClusterIdentifier: secondaryCluster.clusterArn,
      });
    }
  }

  private setupReplicationMonitoring(primaryRegion: string, secondaryRegions: string[]) {
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

  public getConnectionString(region: string): string {
    const cluster = region === PRIMARY_REGION ? 
      this.primaryCluster : 
      this.secondaryClusters.get(region)!;
    
    return cluster.clusterEndpoint.socketAddress;
  }
}
```

### Regional API Construct - `lib/constructs/regional-api.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { GlobalDatabase } from './global-database';

export interface RegionalApiProps {
  region: string;
  isPrimary: boolean;
  certificateArn: string;
  globalDatabase: GlobalDatabase;
  domainName: string;
}

export class RegionalApi extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiGatewayDomainName: apigateway.DomainName;
  public readonly latencyMetric: cloudwatch.Metric;
  public readonly errorMetric: cloudwatch.Metric;
  public readonly requestCountMetric: cloudwatch.Metric;
  public readonly sessionTable: dynamodb.Table;
  public readonly transactionProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: RegionalApiProps) {
    super(scope, id);

    // Create DynamoDB Global Table for sessions
    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `financial-app-sessions-${props.region}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      replicationRegions: props.isPrimary ? ['us-east-1', 'eu-west-1', 'ap-southeast-1'] : undefined,
    });

    // Create transaction processing Lambda
    this.transactionProcessor = new lambda.Function(this, 'TransactionProcessor', {
      functionName: `financial-transaction-processor-${props.region}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/transaction-processor'),
      memorySize: 3008,
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 1000,
      environment: {
        DB_CONNECTION_STRING: props.globalDatabase.getConnectionString(props.region),
        DB_SECRET_ARN: props.globalDatabase.credentials.secretArn,
        SESSION_TABLE_NAME: this.sessionTable.tableName,
        REGION: props.region,
        IS_PRIMARY: props.isPrimary.toString(),
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

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

    // Setup custom domain
    this.apiGatewayDomainName = new apigateway.DomainName(this, 'ApiDomain', {
      domainName: props.domainName,
      certificate: apigateway.Certificate.fromCertificateArn(
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

    // Create API resources
    this.createApiResources();

    // Setup custom metrics
    this.setupMetrics();
  }

  private createApiResources() {
    const transactionResource = this.api.root.addResource('transactions');
    const healthResource = this.api.root.addResource('health');

    // Transaction endpoints
    transactionResource.addMethod('POST', new apigateway.LambdaIntegration(this.transactionProcessor), {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }],
      requestValidator: new apigateway.RequestValidator(this, 'TransactionValidator', {
        restApi: this.api,
        requestValidatorName: 'transaction-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }),
    });

    transactionResource.addMethod('GET', new apigateway.LambdaIntegration(this.transactionProcessor));

    // Health check endpoint
    const healthLambda = new lambda.Function(this, 'HealthCheckHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
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

    healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthLambda));
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

### Health Check System - `lib/constructs/health-check.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { RegionalApi } from './regional-api';
import { GlobalDatabase } from './global-database';

export interface HealthCheckSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  alertTopic: sns.ITopic;
}

export class HealthCheckSystem extends Construct {
  private healthChecks: Map<string, route53.CfnHealthCheck> = new Map();
  private healthMetrics: Map<string, cloudwatch.Metric> = new Map();

  constructor(scope: Construct, id: string, props: HealthCheckSystemProps) {
    super(scope, id);

    // Create comprehensive health check Lambda
    const healthChecker = new lambda.Function(this, 'HealthChecker', {
      functionName: 'financial-app-health-checker',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/health-checker'),
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        ALERT_TOPIC_ARN: props.alertTopic.topicArn,
      },
    });

    props.alertTopic.grantPublish(healthChecker);

    // Create health checks for each region
    for (const region of props.regions) {
      const api = props.regionalApis.get(region)!;
      
      // Route53 health check
      const healthCheck = new route53.CfnHealthCheck(this, `HealthCheck-${region}`, {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
        port: 443,
        requestInterval: 30,
        failureThreshold: 2,
        measureLatency: true,
        healthCheckConfig: {
          ipAddress: undefined,
          port: 443,
          type: 'HTTPS',
          resourcePath: '/health',
          fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
          requestInterval: 30,
          failureThreshold: 2,
          measureLatency: true,
          alarmIdentifier: {
            region: 'us-east-1',
            name: `health-check-alarm-${region}`,
          },
        },
      });

      this.healthChecks.set(region, healthCheck);

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
      new events.Rule(this, `HealthCheckRule-${region}`, {
        schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
        targets: [
          new targets.LambdaFunction(healthChecker, {
            event: events.RuleTargetInput.fromObject({
              region: region,
              apiEndpoint: `https://${api.apiGatewayDomainName.domainName}`,
              dbConnectionString: props.globalDatabase.getConnectionString(region),
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
    const dashboard = new cloudwatch.Dashboard(this, 'HealthDashboard', {
      dashboardName: 'financial-app-health',
    });

    const widgets = regions.map(region => 
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

  public getHealthCheckId(region: string): string {
    return this.healthChecks.get(region)!.attrHealthCheckId;
  }
}
```

### Failover Orchestrator - `lib/constructs/failover-orchestrator.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { RegionalApi } from './regional-api';
import { GlobalDatabase } from './global-database';
import { HealthCheckSystem } from './health-check';

export interface FailoverOrchestratorProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  healthCheckSystem: HealthCheckSystem;
  alertTopic: sns.ITopic;
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
    const validateHealth = new stepfunctionsTasks.LambdaInvoke(this, 'ValidateHealth', {
      lambdaFunction: validateHealthFunction,
      outputPath: '$.Payload',
    });

    const checkNeedFailover = new stepfunctions.Choice(this, 'CheckNeedFailover')
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
      .otherwise(
        new stepfunctions.Succeed(this, 'NoFailoverNeeded')
      );

    const definition = validateHealth.next(checkNeedFailover);

    this.stateMachine = new stepfunctions.StateMachine(this, 'FailoverStateMachine', {
      definition,
      stateMachineName: 'financial-app-failover',
      timeout: cdk.Duration.minutes(15),
    });

    // Grant permissions
    props.alertTopic.grantPublish(this.stateMachine);
  }

  private createValidateHealthFunction(): lambda.Function {
    return new lambda.Function(this, 'ValidateHealthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
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
  }

  private createPromoteReplicaFunction(): lambda.Function {
    return new lambda.Function(this, 'PromoteReplicaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/promote-replica'),
      timeout: cdk.Duration.minutes(5),
      role: new iam.Role(this, 'PromoteReplicaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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
  }

  private createUpdateRoutingFunction(): lambda.Function {
    return new lambda.Function(this, 'UpdateRoutingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
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
  }

  private createValidateFailoverFunction(): lambda.Function {
    return new lambda.Function(this, 'ValidateFailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
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
  }
}
```

### Chaos Testing System - `lib/constructs/chaos-testing.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { RegionalApi } from './regional-api';
import { FailoverOrchestrator } from './failover-orchestrator';

export interface ChaosTestingSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  failoverOrchestrator: FailoverOrchestrator;
}

export class ChaosTestingSystem extends Construct {
  constructor(scope: Construct, id: string, props: ChaosTestingSystemProps) {
    super(scope, id);

    // Create chaos testing Lambda
    const chaosRunner = new lambda.Function(this, 'ChaosRunner', {
      functionName: 'financial-app-chaos-runner',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/chaos-runner'),
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      environment: {
        REGIONS: JSON.stringify(props.regions),
        FAILOVER_STATE_MACHINE_ARN: props.failoverOrchestrator.stateMachine.stateMachineArn,
      },
      role: this.createChaosRole(),
    });

    // Schedule chaos tests (disabled by default)
    const chaosSchedule = new events.Rule(this, 'ChaosSchedule', {
      schedule: events.Schedule.expression('rate(7 days)'),
      enabled: false, // Enable manually when ready to test
    });

    chaosSchedule.addTarget(new targets.LambdaFunction(chaosRunner, {
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
    }));

    // Create SSM parameter for enabling/disabling chaos tests
    new ssm.StringParameter(this, 'ChaosTestingEnabled', {
      parameterName: '/financial-app/chaos-testing/enabled',
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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
    // Create S3 bucket for test results
    const bucket = new cdk.aws_s3.Bucket(this, 'ChaosTestResults', {
      bucketName: `financial-app-chaos-test-results-${cdk.Stack.of(this).account}`,
      versioned: true,
      lifecycleRules: [{
        id: 'delete-old-results',
        expiration: cdk.Duration.days(90),
      }],
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    });
  }
}
```

### Constants - `lib/utils/constants.ts`

```typescript
export const PRIMARY_REGION = 'us-east-1';
export const SECONDARY_REGIONS = ['eu-west-1', 'ap-southeast-1'];
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

## Transaction Processor Lambda - `lambda/transaction-processor/index.js`

```javascript
const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const secretsManager = new SecretsManager();
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDB());

let dbConnection = null;

async function getDbConnection() {
  if (dbConnection) return dbConnection;
  
  const secret = await secretsManager.getSecretValue({
    SecretId: process.env.DB_SECRET_ARN
  });
  
  const credentials = JSON.parse(secret.SecretString);
  
  dbConnection = await mysql.createConnection({
    host: process.env.DB_CONNECTION_STRING.split(':')[0],
    port: parseInt(process.env.DB_CONNECTION_STRING.split(':')[1]),
    user: credentials.username,
    password: credentials.password,
    database: 'financial_transactions',
    connectTimeout: 5000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  
  return dbConnection;
}

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    const method = event.httpMethod;
    
    if (method === 'POST') {
      return await processTransaction(event);
    } else if (method === 'GET') {
      return await getTransactionStatus(event);
    }
    
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Transaction processing error:', error);
    
    // Emit custom metric
    await emitMetric('TransactionError', 1, 'Count');
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    const duration = Date.now() - startTime;
    await emitMetric('TransactionDuration', duration, 'Milliseconds');
  }
};

async function processTransaction(event) {
  const transaction = JSON.parse(event.body);
  const transactionId = generateTransactionId();
  
  // Start database transaction
  const connection = await getDbConnection();
  await connection.beginTransaction();
  
  try {
    // Validate session
    const session = await validateSession(transaction.sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    // Process transaction
    await connection.execute(
      'INSERT INTO transactions (id, user_id, amount, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [transactionId, session.userId, transaction.amount, transaction.type, 'PENDING', new Date()]
    );
    
    // Update account balance
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE user_id = ? AND currency = ?',
      [transaction.amount, session.userId, transaction.currency]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Update session with last transaction
    await updateSession(session.sessionId, { lastTransactionId: transactionId });
    
    // Emit success metric
    await emitMetric('TransactionSuccess', 1, 'Count');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        transactionId,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function validateSession(sessionId) {
  const response = await dynamoClient.send(new GetCommand({
    TableName: process.env.SESSION_TABLE_NAME,
    Key: { sessionId }
  }));
  
  return response.Item;
}

async function updateSession(sessionId, updates) {
  await dynamoClient.send(new PutCommand({
    TableName: process.env.SESSION_TABLE_NAME,
    Item: {
      sessionId,
      ...updates,
      lastUpdated: new Date().toISOString(),
      region: process.env.REGION
    }
  }));
}

async function emitMetric(metricName, value, unit) {
  const cloudwatch = new AWS.CloudWatch();
  
  await cloudwatch.putMetricData({
    Namespace: 'FinancialApp/Transactions',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Dimensions: [
        { Name: 'Region', Value: process.env.REGION },
        { Name: 'IsPrimary', Value: process.env.IS_PRIMARY }
      ],
      Timestamp: new Date()
    }]
  }).promise();
}

function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

## Deployment Script - `bin/deploy.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Deploy to primary region
new TapStack(app, 'TapStack-Primary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  domainName: 'api.financial-app.com',
  certificateArn: process.env.CERTIFICATE_ARN!,
  alertEmail: process.env.ALERT_EMAIL!,
  crossRegionReferences: true,
});

// Deploy to secondary regions
const secondaryRegions = ['eu-west-1', 'ap-southeast-1'];
for (const region of secondaryRegions) {
  new TapStack(app, `TapStack-${region}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    domainName: 'api.financial-app.com',
    certificateArn: process.env.CERTIFICATE_ARN!,
    alertEmail: process.env.ALERT_EMAIL!,
    crossRegionReferences: true,
  });
}
```