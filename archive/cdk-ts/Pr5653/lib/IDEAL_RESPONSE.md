# Aurora Multi-Region Disaster Recovery - Infrastructure Code

## Main Orchestration

### lib/tap-stack.ts

```ts
import { Construct } from 'constructs';
import { AuroraGlobalStack } from './stacks/aurora-global-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
// import { FailoverStack } from './stacks/failover-stack';

interface TapStackProps {
  environmentSuffix?: string;
}

export class TapStack extends Construct {
  public readonly primaryStack: AuroraGlobalStack;
  public readonly secondaryStack: AuroraGlobalStack;
  public readonly monitoringStack: MonitoringStack;
  // public readonly failoverStack: FailoverStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Environment configurations
    const primaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    };
    const secondaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    };

    // Default tags for all resources
    const defaultTags = {
      CostCenter: 'Platform',
      Environment: 'Production',
      'DR-Role': 'Active',
    };

    // Deploy primary stack in us-east-1
    this.primaryStack = new AuroraGlobalStack(
      scope,
      `Aurora-DR-Primary-${environmentSuffix}`,
      {
        env: primaryEnv,
        isPrimary: true,
        environmentSuffix,
        tags: defaultTags,
        crossRegionReferences: true,
      }
    );

    // Deploy secondary stack in us-west-2
    this.secondaryStack = new AuroraGlobalStack(
      scope,
      `Aurora-DR-Secondary-${environmentSuffix}`,
      {
        env: secondaryEnv,
        isPrimary: false,
        environmentSuffix,
        globalClusterIdentifier: this.primaryStack.globalClusterIdentifier,
        tags: { ...defaultTags, 'DR-Role': 'Standby' },
        crossRegionReferences: true,
      }
    );

    // Deploy monitoring stack
    this.monitoringStack = new MonitoringStack(
      scope,
      `Aurora-DR-Monitoring-${environmentSuffix}`,
      {
        env: {
          region: primaryEnv.region,
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
        environmentSuffix,
        primaryCluster: this.primaryStack.cluster,
        secondaryCluster: this.secondaryStack.cluster,
        crossRegionReferences: true,
      }
    );

    // Failover automation stack (commented out due to complex dependencies)
    // this.failoverStack = new FailoverStack(
    //   scope,
    //   `Aurora-DR-Failover-${environmentSuffix}`,
    //   {
    //     env: {
    //       region: primaryEnv.region,
    //       account: process.env.CDK_DEFAULT_ACCOUNT,
    //     },
    //     environmentSuffix,
    //     primaryStack: this.primaryStack,
    //     secondaryStack: this.secondaryStack,
    //     crossRegionReferences: true,
    //   },
    // );
  }
}
```

### bin/tap.ts

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Instantiate TapStack which will create all Aurora DR stacks
new TapStack(app, 'TapStack', {
  environmentSuffix,
});

app.synth();
```

## Stacks

### lib/stacks/aurora-global-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { AuroraClusterConstruct } from '../constructs/aurora-cluster';
import { NetworkingConstruct } from '../constructs/networking';

export interface AuroraGlobalStackProps extends cdk.StackProps {
  isPrimary: boolean;
  globalClusterIdentifier?: string;
  environmentSuffix: string;
}

export class AuroraGlobalStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;
  public readonly clusterEndpoint: string;
  public readonly dbProxy: rds.DatabaseProxy;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: AuroraGlobalStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      isPrimary: props.isPrimary,
      maxAzs: 3,
      environmentSuffix: suffix,
    });
    this.vpc = networking.vpc;

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'AuroraEncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for Aurora cluster (${suffix})`,
      alias: `aurora-dr-${props.isPrimary ? 'primary' : 'secondary'}-${suffix}`,
    });

    // Create database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DBSecret', {
      description: `Aurora PostgreSQL admin credentials (${suffix})`,
      secretName: `aurora-dr-${props.isPrimary ? 'primary' : 'secondary'}-secret-${suffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres_admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey,
    });

    // Create Aurora cluster
    const auroraCluster = new AuroraClusterConstruct(this, 'AuroraCluster', {
      vpc: this.vpc,
      isPrimary: props.isPrimary,
      globalClusterIdentifier: props.globalClusterIdentifier,
      secret: this.secret,
      encryptionKey,
      environmentSuffix: suffix,
    });

    this.cluster = auroraCluster.cluster;
    this.globalClusterIdentifier = auroraCluster.globalClusterIdentifier;
    this.clusterEndpoint = this.cluster.clusterEndpoint.hostname;

    // Create RDS Proxy for connection management
    this.dbProxy = new rds.DatabaseProxy(this, 'DBProxy', {
      proxyTarget: rds.ProxyTarget.fromCluster(this.cluster),
      secrets: [this.secret],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      requireTLS: true,
      idleClientTimeout: cdk.Duration.minutes(30),
      maxConnectionsPercent: 100,
      maxIdleConnectionsPercent: 50,
      debugLogging: false,
      iamAuth: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.hostname,
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'ProxyEndpoint', {
      value: this.dbProxy.endpoint,
      exportName: `${this.stackName}-ProxyEndpoint`,
    });

    new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
      value: this.globalClusterIdentifier,
      exportName: `${this.stackName}-GlobalClusterIdentifier`,
    });
  }
}
```

### lib/stacks/monitoring-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  primaryCluster: rds.DatabaseCluster;
  secondaryCluster: rds.DatabaseCluster;
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'AuroraDRDashboard', {
      dashboardName: `aurora-dr-monitoring-${suffix}`,
      defaultInterval: cdk.Duration.minutes(5),
    });

    // Replication Lag Widget
    const replicationLagWidget = new cloudwatch.GraphWidget({
      title: 'Global Database Replication Lag',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Replication Lag (ms)',
        }),
      ],
      width: 12,
      height: 6,
    });

    // CPU Utilization Widget
    const cpuWidget = new cloudwatch.GraphWidget({
      title: 'Cluster CPU Utilization',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Primary CPU %',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: props.secondaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Secondary CPU %',
          region: props.secondaryCluster.stack.region,
        }),
      ],
      width: 12,
      height: 6,
    });

    // Database Connections Widget
    const connectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Sum',
          label: 'Primary Connections',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: props.secondaryCluster.clusterIdentifier,
          },
          statistic: 'Sum',
          label: 'Secondary Connections',
          region: props.secondaryCluster.stack.region,
        }),
      ],
      width: 12,
      height: 6,
    });

    // IOPS Widget
    const iopsWidget = new cloudwatch.GraphWidget({
      title: 'Read/Write IOPS',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'VolumeReadIOPs',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Read IOPS',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'VolumeWriteIOPs',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Write IOPS',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Backup Status Widget
    const backupWidget = new cloudwatch.SingleValueWidget({
      title: 'Latest Backup Status',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'SnapshotStorageUsed',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Maximum',
        }),
      ],
      width: 6,
      height: 4,
    });

    // Failover Status Widget
    const failoverWidget = new cloudwatch.TextWidget({
      markdown: `# Failover Status
            
**Primary Region:** ${props.primaryCluster.stack.region}  
**Secondary Region:** ${props.secondaryCluster.stack.region}  
**RPO Target:** < 1 minute  
**RTO Target:** < 5 minutes  
            `,
      width: 6,
      height: 4,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      replicationLagWidget,
      cpuWidget,
      connectionsWidget,
      iopsWidget,
      backupWidget,
      failoverWidget
    );

    // Create alarms for critical metrics
    new cloudwatch.Alarm(this, 'HighReplicationLag', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'AuroraGlobalDBReplicationLag',
        dimensionsMap: {
          DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 5000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmName: 'aurora-dr-high-replication-lag',
      alarmDescription: 'Replication lag exceeds 5 seconds',
    });

    new cloudwatch.Alarm(this, 'BackupFailure', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'BackupRetentionPeriodStorageUsed',
        dimensionsMap: {
          DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
        },
        statistic: 'Minimum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmName: 'aurora-dr-backup-failure',
      alarmDescription: 'Backup storage indicates potential backup failure',
    });
  }
}
```

### lib/stacks/failover-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import * as path from 'path';
import { AuroraGlobalStack } from './aurora-global-stack';

export interface FailoverStackProps extends cdk.StackProps {
  primaryStack: AuroraGlobalStack;
  secondaryStack: AuroraGlobalStack;
}

export class FailoverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FailoverStackProps) {
    super(scope, id, props);

    // Create SNS topic for notifications
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Aurora DR Alerts',
      topicName: 'aurora-dr-alerts',
    });

    // Add PagerDuty integration
    alertTopic.addSubscription(
      new sns_subscriptions.UrlSubscription(
        process.env.PAGERDUTY_WEBHOOK_URL ||
          'https://events.pagerduty.com/integration/YOUR_KEY/enqueue'
      )
    );

    // Create hosted zone for failover routing
    const hostedZone = new route53.PrivateHostedZone(this, 'HostedZone', {
      zoneName: 'aurora-dr.internal',
      vpc: props.primaryStack.vpc,
    });

    // Associate secondary VPC with hosted zone
    hostedZone.addVpc(props.secondaryStack.vpc);

    // Health check Lambda
    const healthCheckLambda = new lambda.Function(this, 'HealthCheckLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/health-check')
      ),
      handler: 'index.handler',
      vpc: props.primaryStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.seconds(30),
      environment: {
        PRIMARY_CLUSTER_ENDPOINT: props.primaryStack.clusterEndpoint,
        SECONDARY_CLUSTER_ENDPOINT: props.secondaryStack.clusterEndpoint,
        SECRET_ARN: props.primaryStack.secret.secretArn,
      },
    });

    // Grant necessary permissions
    props.primaryStack.secret.grantRead(healthCheckLambda);
    props.primaryStack.cluster.grantDataApiAccess(healthCheckLambda);

    // Failover orchestrator Lambda
    const failoverLambda = new lambda.Function(this, 'FailoverOrchestrator', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/failover-orchestrator')
      ),
      handler: 'index.handler',
      vpc: props.primaryStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(15),
      environment: {
        PRIMARY_REGION: props.primaryStack.region!,
        SECONDARY_REGION: props.secondaryStack.region!,
        GLOBAL_CLUSTER_ID: props.primaryStack.globalClusterIdentifier,
        SNS_TOPIC_ARN: alertTopic.topicArn,
        HOSTED_ZONE_ID: hostedZone.hostedZoneId,
      },
    });

    // Grant RDS permissions for failover
    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'rds:FailoverGlobalCluster',
          'rds:DescribeGlobalClusters',
          'rds:DescribeDBClusters',
          'rds:ModifyGlobalCluster',
        ],
        resources: ['*'],
      })
    );

    // Grant Route53 permissions
    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['route53:ChangeResourceRecordSets', 'route53:GetChange'],
        resources: [hostedZone.hostedZoneArn, 'arn:aws:route53:::change/*'],
      })
    );

    alertTopic.grantPublish(failoverLambda);

    // Create Step Functions for failover workflow
    const validatePrimaryTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'ValidatePrimary',
      {
        lambdaFunction: healthCheckLambda,
        outputPath: '$.Payload',
      }
    );

    const promotionTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'PromoteSecondary',
      {
        lambdaFunction: failoverLambda,
        outputPath: '$.Payload',
      }
    );

    const notificationTask = new stepfunctions_tasks.SnsPublish(
      this,
      'NotifyFailover',
      {
        topic: alertTopic,
        message: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
    );

    const failoverStateMachine = new stepfunctions.StateMachine(
      this,
      'FailoverStateMachine',
      {
        definition: validatePrimaryTask.next(
          new stepfunctions.Choice(this, 'IsPrimaryHealthy?')
            .when(
              stepfunctions.Condition.booleanEquals('$.healthy', false),
              promotionTask.next(notificationTask)
            )
            .otherwise(new stepfunctions.Succeed(this, 'NoActionNeeded'))
        ),
        timeout: cdk.Duration.minutes(10),
      }
    );

    // Create composite alarm for failover
    const replicationLagAlarm = new cloudwatch.Alarm(
      this,
      'ReplicationLagAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryStack.cluster.clusterIdentifier,
          },
          statistic: 'Average',
        }),
        threshold: 5000, // 5 seconds in milliseconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    const primaryHealthAlarm = new cloudwatch.Alarm(
      this,
      'PrimaryHealthAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: healthCheckLambda.functionName,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    const compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      'FailoverCompositeAlarm',
      {
        compositeAlarmName: 'aurora-dr-failover-trigger',
        alarmRule: cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(
            replicationLagAlarm,
            cloudwatch.AlarmState.ALARM
          ),
          cloudwatch.AlarmRule.fromAlarm(
            primaryHealthAlarm,
            cloudwatch.AlarmState.ALARM
          )
        ),
        actionsEnabled: true,
      }
    );

    compositeAlarm.addAlarmAction(
      new cloudwatch_actions.LambdaAction(failoverLambda)
    );

    // Automated DR testing - runs every 30 days
    const drTestLambda = new lambda.Function(this, 'DRTestLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/dr-testing')
      ),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(15),
      environment: {
        STATE_MACHINE_ARN: failoverStateMachine.stateMachineArn,
        SNS_TOPIC_ARN: alertTopic.topicArn,
      },
    });

    failoverStateMachine.grantStartExecution(drTestLambda);
    alertTopic.grantPublish(drTestLambda);

    // Schedule DR tests
    new events.Rule(this, 'DRTestSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(30)),
      targets: [new targets.LambdaFunction(drTestLambda)],
    });

    // Create Route53 failover records
    new route53.CnameRecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: 'aurora-writer',
      domainName: props.primaryStack.dbProxy.endpoint,
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'Primary',
      geoLocation: route53.GeoLocation.continent(
        route53.Continent.NORTH_AMERICA
      ),
    });

    new route53.CnameRecord(this, 'SecondaryRecord', {
      zone: hostedZone,
      recordName: 'aurora-writer',
      domainName: props.secondaryStack.dbProxy.endpoint,
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'Secondary',
      geoLocation: route53.GeoLocation.continent(
        route53.Continent.NORTH_AMERICA
      ),
    });

    // Outputs for integration tests
    new cdk.CfnOutput(this, 'StateMachineArnOutput', {
      value: failoverStateMachine.stateMachineArn,
      exportName: `${this.stackName}-StateMachineArn`,
      description:
        'Step Functions state machine ARN for failover orchestration',
    });

    new cdk.CfnOutput(this, 'AlertTopicArnOutput', {
      value: alertTopic.topicArn,
      exportName: `${this.stackName}-AlertTopicArn`,
      description: 'SNS topic ARN for DR alerts',
    });
  }
}
```

## Constructs

### lib/constructs/aurora-cluster.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AuroraClusterProps {
  vpc: ec2.IVpc;
  isPrimary: boolean;
  globalClusterIdentifier?: string;
  secret: secretsmanager.ISecret;
  encryptionKey: kms.IKey;
  environmentSuffix: string;
}

export class AuroraClusterConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;

  constructor(scope: Construct, id: string, props: AuroraClusterProps) {
    super(scope, id);

    const suffix = props.environmentSuffix;

    // Create subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      description: 'Subnet group for Aurora cluster',
    });

    // Create instance parameter group (for DB instances)
    const instanceParameterGroup = new rds.ParameterGroup(
      this,
      'ParameterGroup',
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_12,
        }),
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_duration: '1',
        },
        description: 'Instance parameter group for Aurora PostgreSQL',
      }
    );

    // Create security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Aurora cluster',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from within VPC
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'PostgreSQL from VPC'
    );

    // For cross-region replication (if needed)
    if (!props.isPrimary && props.globalClusterIdentifier) {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4('10.0.0.0/8'),
        ec2.Port.tcp(5432),
        'Cross-region replication'
      );
    }

    if (props.isPrimary && !props.globalClusterIdentifier) {
      // Create global cluster if this is the primary
      const globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `aurora-dr-global-${suffix}-${Date.now()}`,
        sourceDbClusterIdentifier: undefined,
        engine: 'aurora-postgresql',
        engineVersion: '15.12',
        storageEncrypted: true,
      });
      this.globalClusterIdentifier = globalCluster.ref;
    } else {
      this.globalClusterIdentifier = props.globalClusterIdentifier!;
    }

    // Create the Aurora cluster with new writer/readers API
    this.cluster = new rds.DatabaseCluster(this, 'Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_12,
      }),
      credentials: rds.Credentials.fromSecret(props.secret),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        parameterGroup: instanceParameterGroup,
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE
          ),
          parameterGroup: instanceParameterGroup,
        }),
      ],
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      storageEncrypted: true,
      storageEncryptionKey: props.encryptionKey,
      subnetGroup,
      copyTagsToSnapshot: true,
      cloudwatchLogsExports: ['postgresql'],
      enableDataApi: true,
    });

    // Note: Aurora auto-scaling for provisioned instances is managed through AWS Console or CloudFormation
    // CDK DatabaseCluster construct uses fixed instance count specified in 'instances' property
    // For production, consider Aurora Serverless v2 for automatic scaling

    // Associate with global cluster
    if (this.globalClusterIdentifier) {
      const cfnCluster = this.cluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = this.globalClusterIdentifier;

      if (!props.isPrimary) {
        // For secondary clusters, don't create a master user
        cfnCluster.masterUsername = undefined;
        cfnCluster.masterUserPassword = undefined;
      }
    }
  }
}
```

### lib/constructs/networking.ts

```ts
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingProps {
  isPrimary: boolean;
  maxAzs: number;
  environmentSuffix: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly vpcPeeringConnection?: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const suffix = props.environmentSuffix;
    const regionType = props.isPrimary ? 'primary' : 'secondary';

    // Create VPC with private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `aurora-dr-${regionType}-vpc-${suffix}`,
      maxAzs: props.maxAzs,
      ipAddresses: ec2.IpAddresses.cidr(
        props.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create VPC endpoints for AWS services
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    this.vpc.addInterfaceEndpoint('KMSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    this.vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
    });

    // Add S3 gateway endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
  }
}
```

## Lambda Functions

### lib/lambdas/health-check/index.ts

```ts
/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK and pg are provided by Lambda runtime layer
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

const secretsClient = new SecretsManagerClient({});

interface HealthCheckResult {
  healthy: boolean;
  endpoint: string;
  replicationLag?: number;
  message?: string;
}

export const handler = async (): Promise<HealthCheckResult> => {
  const primaryEndpoint = process.env.PRIMARY_CLUSTER_ENDPOINT!;
  const secretArn = process.env.SECRET_ARN!;

  try {
    // Get database credentials
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    const secret = JSON.parse(secretResponse.SecretString!);

    // Create PostgreSQL client with TLS
    const client = new Client({
      host: primaryEndpoint,
      port: 5432,
      user: secret.username,
      password: secret.password,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });

    // Test connection and check replication lag
    await client.connect();

    // Check if this is a writer instance
    const writerCheckQuery = 'SELECT pg_is_in_recovery()';
    const writerResult = await client.query(writerCheckQuery);
    const isReadOnly = writerResult.rows[0].pg_is_in_recovery;

    // Check replication lag (for global database)
    let replicationLag = 0;
    if (!isReadOnly) {
      const lagQuery = `
                SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
                FROM pg_stat_replication
                WHERE state = 'streaming'
                ORDER BY lag_ms DESC
                LIMIT 1
            `;
      const lagResult = await client.query(lagQuery);
      if (lagResult.rows.length > 0) {
        replicationLag = lagResult.rows[0].lag_ms || 0;
      }
    }

    await client.end();

    return {
      healthy: true,
      endpoint: primaryEndpoint,
      replicationLag,
      message: `Primary cluster is healthy. Read-only: ${isReadOnly}, Lag: ${replicationLag}ms`,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      healthy: false,
      endpoint: primaryEndpoint,
      message: `Health check failed: ${errorMessage}`,
    };
  }
};
```

### lib/lambdas/failover-orchestrator/index.ts

```ts
/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is provided by Lambda runtime
import {
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand,
  FailoverGlobalClusterCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const rdsClient = new RDSClient({});
const route53Client = new Route53Client({});
const snsClient = new SNSClient({});

interface FailoverResult {
  success: boolean;
  newPrimaryRegion?: string;
  newPrimaryEndpoint?: string;
  message: string;
  duration?: number;
}

export const handler = async (): Promise<FailoverResult> => {
  const startTime = Date.now();
  const globalClusterId = process.env.GLOBAL_CLUSTER_ID!;
  const secondaryRegion = process.env.SECONDARY_REGION!;
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const hostedZoneId = process.env.HOSTED_ZONE_ID!;

  try {
    console.log('Starting failover process...');

    // Step 1: Validate global cluster status
    const describeResponse = await rdsClient.send(
      new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId,
      })
    );

    const globalCluster = describeResponse.GlobalClusters![0];
    if (!globalCluster) {
      throw new Error('Global cluster not found');
    }

    // Step 2: Initiate failover to secondary region
    console.log('Initiating global cluster failover');
    const secondaryClusterId = globalCluster.GlobalClusterMembers?.find(m =>
      m.DBClusterArn?.includes(secondaryRegion)
    )?.DBClusterArn;
    await rdsClient.send(
      new FailoverGlobalClusterCommand({
        GlobalClusterIdentifier: globalClusterId,
        TargetDbClusterIdentifier: secondaryClusterId,
      })
    );

    // Step 3: Wait for failover to complete (poll status)
    let failoverComplete = false;
    let retries = 0;
    const maxRetries = 30; // 5 minutes with 10-second intervals

    while (!failoverComplete && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await rdsClient.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: globalClusterId,
        })
      );

      const status = statusResponse.GlobalClusters![0].Status;
      if (status === 'available') {
        failoverComplete = true;
      }
      retries++;
    }

    if (!failoverComplete) {
      throw new Error('Failover timeout - exceeded 5 minutes');
    }

    // Step 4: Get new primary endpoint
    const newPrimaryCluster = await rdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: secondaryClusterId?.split(':').pop(),
      })
    );

    const newPrimaryEndpoint = newPrimaryCluster.DBClusters![0].Endpoint;

    // Step 5: Update Route53 DNS
    console.log('Updating Route53 DNS records...');
    await route53Client.send(
      new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: 'aurora-writer.aurora-dr.internal',
                Type: 'CNAME',
                TTL: 60,
                ResourceRecords: [
                  {
                    Value: newPrimaryEndpoint,
                  },
                ],
              },
            },
          ],
        },
      })
    );

    // Step 6: Send notification
    const duration = Math.round((Date.now() - startTime) / 1000);
    const message =
      'Aurora failover completed successfully\n' +
      `New Primary Region: ${secondaryRegion}\n` +
      `New Primary Endpoint: ${newPrimaryEndpoint}\n` +
      `Duration: ${duration} seconds`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Failover Completed',
        Message: message,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'failover_completed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'critical',
          },
        },
      })
    );

    return {
      success: true,
      newPrimaryRegion: secondaryRegion,
      newPrimaryEndpoint,
      message,
      duration,
    };
  } catch (error) {
    console.error('Failover failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Send failure notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Failover Failed',
        Message: `Failover process failed: ${errorMessage}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'failover_failed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'critical',
          },
        },
      })
    );

    throw error;
  }
};
```

### lib/lambdas/dr-testing/index.ts

```ts
/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is provided by Lambda runtime
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const sfnClient = new SFNClient({});
const snsClient = new SNSClient({});
const cloudWatchClient = new CloudWatchClient({});

export const handler = async (): Promise<void> => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN!;
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const testStartTime = Date.now();

  try {
    console.log('Starting automated DR test...');

    // Send notification about test start
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Started',
        Message: `Automated DR test initiated at ${new Date().toISOString()}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_start',
          },
          severity: {
            DataType: 'String',
            StringValue: 'info',
          },
        },
      })
    );

    // Execute failover state machine
    const executionResponse = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn,
        name: `dr-test-${Date.now()}`,
        input: JSON.stringify({
          testMode: true,
          initiatedBy: 'automated_test',
          timestamp: new Date().toISOString(),
        }),
      })
    );

    console.log('DR test execution started:', executionResponse.executionArn);

    // Record metrics
    const testDuration = (Date.now() - testStartTime) / 1000;
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Aurora/DR',
        MetricData: [
          {
            MetricName: 'DRTestDuration',
            Value: testDuration,
            Unit: 'Seconds',
            Timestamp: new Date(),
          },
          {
            MetricName: 'DRTestCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    // Send completion notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Completed',
        Message:
          'DR test completed successfully\n' +
          'Duration: ' +
          testDuration +
          ' seconds\n' +
          'Execution ARN: ' +
          executionResponse.executionArn,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_completed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'info',
          },
        },
      })
    );
  } catch (error) {
    console.error('DR test failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Failed',
        Message: `DR test failed: ${errorMessage}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_failed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'warning',
          },
        },
      })
    );

    throw error;
  }
};
```
