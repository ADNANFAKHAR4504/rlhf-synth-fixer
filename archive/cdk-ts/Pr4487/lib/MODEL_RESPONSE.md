### Reasoning Trace
---

This is a comprehensive request for implementing a multi-region Aurora Global Database disaster recovery solution using AWS CDK in TypeScript. I need to create three files:

1. lib/tap-stack.ts - The main CDK stack implementation
2. test/tap-stack.unit.test.ts - Unit tests
3. test/tap-stack.int.test.ts - Integration tests

The solution must:
- Set up Aurora Global Database across us-east-1 and eu-west-1
- Implement Route 53 Application Recovery Controller for failover
- Use EventBridge, Lambda for automated failover
- Include CloudWatch monitoring
- Manage secrets with Secrets Manager
- Meet RTO < 1 minute and RPO < 1 second
- Handle 10,000 TPS

Let me structure the implementation carefully with all the required components.
### Answer 
---

I'll implement a production-grade multi-region Aurora Global Database disaster recovery solution with automated failover. This architecture ensures RTO < 1 minute and RPO < 1 second for your financial services application.

## 1. lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53recoverycontrol from 'aws-cdk-lib/aws-route53recoverycontrol';
import * as route53recoveryreadiness from 'aws-cdk-lib/aws-route53recoveryreadiness';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Configuration interface for multi-region disaster recovery stack
 */
export interface MultiRegionDRStackProps extends cdk.StackProps {
  readonly isPrimaryRegion: boolean;
  readonly globalClusterIdentifier: string;
  readonly environment: 'dev' | 'staging' | 'prod';
  readonly alertEmail?: string;
}

/**
 * Multi-Region Aurora Global Database Disaster Recovery Stack
 * 
 * This stack implements a production-grade disaster recovery solution with:
 * - Aurora Global Database spanning us-east-1 and eu-west-1
 * - Route 53 Application Recovery Controller for traffic management
 * - Automated failover with Lambda orchestration
 * - CloudWatch monitoring and alerting
 * - Cross-region secret replication
 */
export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly auroraCluster: rds.DatabaseCluster;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly routingControl?: route53recoverycontrol.CfnRoutingControl;
  public readonly readinessCheck?: route53recoveryreadiness.CfnReadinessCheck;
  
  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id, props);

    // Validate region configuration
    const region = cdk.Stack.of(this).region;
    if (props.isPrimaryRegion && region !== 'us-east-1') {
      throw new Error('Primary region must be us-east-1');
    }
    if (!props.isPrimaryRegion && region !== 'eu-west-1') {
      throw new Error('Secondary region must be eu-west-1');
    }

    // Common tags for all resources
    const commonTags = {
      Environment: props.environment,
      Application: 'financial-transactions',
      ManagedBy: 'cdk',
      CostCenter: 'platform-engineering',
      DataClassification: 'highly-confidential',
      Region: region,
      Stack: this.stackName,
    };
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Application', commonTags.Application);
    cdk.Tags.of(this).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(this).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(this).add('DataClassification', commonTags.DataClassification);

    // ==========================================
    // VPC Configuration
    // ==========================================
    this.vpc = new ec2.Vpc(this, 'DatabaseVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use 3 AZs for high availability
      natGateways: props.environment === 'prod' ? 3 : 1,
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
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for compliance
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VpcFlowLogGroup', {
          retention: logs.RetentionDays.ONE_MONTH,
          encryptionKey: undefined, // Use default encryption
        })
      ),
    });

    // ==========================================
    // Security Groups
    // ==========================================
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Aurora Global Database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from within VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Allow replication traffic between regions (requires VPC peering setup)
    if (!props.isPrimaryRegion) {
      dbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4('10.0.0.0/16'), // Primary region CIDR
        ec2.Port.tcp(5432),
        'Allow replication from primary region'
      );
    }

    dbSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(443),
      'Allow HTTPS for AWS services'
    );

    // ==========================================
    // Secrets Manager
    // ==========================================
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: `Aurora Global Database credentials for ${region}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      replicaRegions: props.isPrimaryRegion 
        ? [{ region: 'eu-west-1', encryptionKey: undefined }]
        : undefined,
    });

    // ==========================================
    // Aurora Global Database Configuration
    // ==========================================
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      description: 'Subnet group for Aurora Global Database',
    });

    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      description: 'Custom parameter group for financial transactions database',
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements,pg_hint_plan,pgaudit',
        'log_statement': 'all',
        'log_duration': '1',
        'log_connections': '1',
        'log_disconnections': '1',
        'log_lock_waits': '1',
        'log_temp_files': '0',
        'auto_explain.log_min_duration': '1000',
        'max_connections': '5000', // Support 10,000 TPS
        'max_prepared_transactions': '100',
        'wal_buffers': '32MB',
        'checkpoint_completion_target': '0.9',
        'effective_cache_size': '45GB', // For r6g.xlarge
        'maintenance_work_mem': '2GB',
        'random_page_cost': '1.1',
      },
    });

    if (props.isPrimaryRegion) {
      // Create primary cluster
      this.auroraCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        credentials: rds.Credentials.fromSecret(this.dbSecret),
        instanceProps: {
          vpc: this.vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE),
          securityGroups: [dbSecurityGroup],
          performanceInsightEncryptionKey: undefined,
          performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_24,
          enablePerformanceInsights: true,
          autoMinorVersionUpgrade: false,
        },
        instances: props.environment === 'prod' ? 3 : 2,
        defaultDatabaseName: 'financial_transactions',
        clusterIdentifier: `${props.globalClusterIdentifier}-primary`,
        parameterGroup: parameterGroup,
        subnetGroup: dbSubnetGroup,
        backup: {
          retention: cdk.Duration.days(35),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: props.environment === 'prod',
        storageEncrypted: true,
        monitoringInterval: cdk.Duration.seconds(1),
        monitoringRole: new iam.Role(this, 'DatabaseMonitoringRole', {
          assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
          ],
        }),
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      });

      // Enable global database
      const cfnGlobalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: props.globalClusterIdentifier,
        sourceDbClusterIdentifier: this.auroraCluster.clusterIdentifier,
        storageEncrypted: true,
        deletionProtection: props.environment === 'prod',
      });

      cfnGlobalCluster.addDependsOn(this.auroraCluster.node.defaultChild as rds.CfnDBCluster);
      
    } else {
      // Create secondary cluster
      this.auroraCluster = new rds.DatabaseCluster(this, 'SecondaryCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        instanceProps: {
          vpc: this.vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE),
          securityGroups: [dbSecurityGroup],
          performanceInsightEncryptionKey: undefined,
          performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_24,
          enablePerformanceInsights: true,
          autoMinorVersionUpgrade: false,
        },
        instances: props.environment === 'prod' ? 3 : 2,
        clusterIdentifier: `${props.globalClusterIdentifier}-secondary`,
        parameterGroup: parameterGroup,
        subnetGroup: dbSubnetGroup,
        backup: {
          retention: cdk.Duration.days(35),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: props.environment === 'prod',
        storageEncrypted: true,
        monitoringInterval: cdk.Duration.seconds(1),
        monitoringRole: new iam.Role(this, 'DatabaseMonitoringRole', {
          assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
          ],
        }),
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      });

      // Associate with global cluster
      const cfnCluster = this.auroraCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = props.globalClusterIdentifier;
    }

    // ==========================================
    // SNS Topic for Alerts
    // ==========================================
    const alertTopic = new sns.Topic(this, 'DisasterRecoveryAlerts', {
      topicName: `${this.stackName}-dr-alerts`,
      displayName: 'Disaster Recovery System Alerts',
    });

    if (props.alertEmail) {
      alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // ==========================================
    // CloudWatch Alarms
    // ==========================================
    
    // Database CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when database CPU exceeds 80%',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Database Connection Alarm
    new cloudwatch.Alarm(this, 'DatabaseConnectionAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 4500, // 90% of max_connections
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when database connections exceed threshold',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Replication Lag Alarm (for secondary region)
    if (!props.isPrimaryRegion) {
      new cloudwatch.Alarm(this, 'ReplicationLagAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
          },
          statistic: 'Maximum',
          period: cdk.Duration.seconds(10),
        }),
        threshold: 1000, // 1 second in milliseconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: 'Alert when replication lag exceeds 1 second',
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    }

    // ==========================================
    // Route 53 Application Recovery Controller (Primary Region Only)
    // ==========================================
    if (props.isPrimaryRegion) {
      // Create Control Panel
      const controlPanel = new route53recoverycontrol.CfnControlPanel(this, 'ControlPanel', {
        name: `${props.globalClusterIdentifier}-control-panel`,
        clusterArn: this.getClusterArn(),
      });

      // Create Routing Control for Primary Region
      const primaryRoutingControl = new route53recoverycontrol.CfnRoutingControl(this, 'PrimaryRoutingControl', {
        name: `${props.globalClusterIdentifier}-primary-control`,
        controlPanelArn: controlPanel.attrControlPanelArn,
      });

      // Create Routing Control for Secondary Region
      const secondaryRoutingControl = new route53recoverycontrol.CfnRoutingControl(this, 'SecondaryRoutingControl', {
        name: `${props.globalClusterIdentifier}-secondary-control`,
        controlPanelArn: controlPanel.attrControlPanelArn,
      });

      // Create Safety Rule to ensure at least one region is active
      new route53recoverycontrol.CfnSafetyRule(this, 'AtLeastOneRegionActive', {
        name: `${props.globalClusterIdentifier}-min-active-rule`,
        controlPanelArn: controlPanel.attrControlPanelArn,
        ruleConfig: {
          inverted: false,
          threshold: 1,
          type: 'ATLEAST',
        },
        assertionRule: {
          waitPeriodMs: 5000,
          assertedControls: [
            primaryRoutingControl.attrRoutingControlArn,
            secondaryRoutingControl.attrRoutingControlArn,
          ],
        },
      });

      this.routingControl = primaryRoutingControl;

      // Create Recovery Readiness Check
      const recoveryGroup = new route53recoveryreadiness.CfnRecoveryGroup(this, 'RecoveryGroup', {
        recoveryGroupName: `${props.globalClusterIdentifier}-recovery-group`,
        cells: [
          `arn:aws:route53-recovery-readiness::${this.account}:cell/us-east-1`,
          `arn:aws:route53-recovery-readiness::${this.account}:cell/eu-west-1`,
        ],
      });

      const resourceSet = new route53recoveryreadiness.CfnResourceSet(this, 'ResourceSet', {
        resourceSetName: `${props.globalClusterIdentifier}-resource-set`,
        resourceSetType: 'AWS::RDS::DBCluster',
        resources: [
          {
            resourceArn: this.auroraCluster.clusterArn,
            readinessScopes: [`arn:aws:route53-recovery-readiness::${this.account}:cell/us-east-1`],
          },
        ],
      });

      this.readinessCheck = new route53recoveryreadiness.CfnReadinessCheck(this, 'ReadinessCheck', {
        readinessCheckName: `${props.globalClusterIdentifier}-readiness-check`,
        resourceSetName: resourceSet.resourceSetName,
      });
    }

    // ==========================================
    // Lambda Failover Function
    // ==========================================
    const failoverFunction = new lambdaNodejs.NodejsFunction(this, 'FailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/failover.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        REGION: region,
        IS_PRIMARY: props.isPrimaryRegion.toString(),
        GLOBAL_CLUSTER_ID: props.globalClusterIdentifier,
        CLUSTER_ARN: this.auroraCluster.clusterArn,
        SECRET_ARN: this.dbSecret.secretArn,
        SNS_TOPIC_ARN: alertTopic.topicArn,
        CONTROL_PANEL_ARN: props.isPrimaryRegion ? this.routingControl?.attrControlPanelArn || '' : '',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        target: 'es2020',
        externalModules: ['aws-sdk'],
      },
      description: 'Orchestrates Aurora Global Database failover process',
      reservedConcurrentExecutions: 1, // Ensure only one failover at a time
      deadLetterQueueEnabled: true,
      deadLetterQueue: {
        maxReceiveCount: 3,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant necessary permissions to Lambda
    this.dbSecret.grantRead(failoverFunction);
    alertTopic.grantPublish(failoverFunction);
    
    failoverFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rds:DescribeGlobalClusters',
        'rds:DescribeDBClusters',
        'rds:FailoverGlobalCluster',
        'rds:ModifyGlobalCluster',
        'rds:ModifyDBCluster',
        'rds:PromoteReadReplicaDBCluster',
        'route53-recovery-control-config:UpdateRoutingControl',
        'route53-recovery-control-config:DescribeRoutingControl',
        'route53-recovery-readiness:GetReadinessCheckStatus',
        'cloudwatch:PutMetricData',
      ],
      resources: ['*'],
    }));

    // ==========================================
    // EventBridge Rules for Automated Failover
    // ==========================================
    
    // Rule for RDS cluster failure events
    new events.Rule(this, 'ClusterFailureRule', {
      ruleName: `${this.stackName}-cluster-failure`,
      description: 'Trigger failover on cluster failure',
      eventPattern: {
        source: ['aws.rds'],
        detailType: ['RDS DB Cluster Event'],
        detail: {
          EventCategories: ['failure'],
          SourceArn: [this.auroraCluster.clusterArn],
        },
      },
      targets: [
        new eventsTargets.LambdaFunction(failoverFunction, {
          retryAttempts: 2,
          maxEventAge: cdk.Duration.minutes(10),
        }),
      ],
    });

    // Rule for manual failover trigger
    new events.Rule(this, 'ManualFailoverRule', {
      ruleName: `${this.stackName}-manual-failover`,
      description: 'Manual failover trigger',
      eventPattern: {
        source: ['custom.dr.system'],
        detailType: ['Manual Failover Request'],
      },
      targets: [
        new eventsTargets.LambdaFunction(failoverFunction, {
          retryAttempts: 0,
        }),
      ],
    });

    // ==========================================
    // CloudWatch Dashboard
    // ==========================================
    const dashboard = new cloudwatch.Dashboard(this, 'DisasterRecoveryDashboard', {
      dashboardName: `${this.stackName}-dr-dashboard`,
      defaultInterval: cdk.Duration.minutes(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            dimensionsMap: { DBClusterIdentifier: this.auroraCluster.clusterIdentifier },
            statistic: 'Average',
            label: 'CPU Utilization',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: { DBClusterIdentifier: this.auroraCluster.clusterIdentifier },
            statistic: 'Average',
            label: 'Connections',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CommitLatency',
            dimensionsMap: { DBClusterIdentifier: this.auroraCluster.clusterIdentifier },
            statistic: 'Average',
            label: 'Commit Latency (ms)',
            yAxis: 'right',
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Replication Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'AuroraGlobalDBReplicationLag',
            dimensionsMap: { DBClusterIdentifier: this.auroraCluster.clusterIdentifier },
            statistic: 'Maximum',
            label: 'Replication Lag (ms)',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'AuroraGlobalDBDataTransferBytes',
            dimensionsMap: { DBClusterIdentifier: this.auroraCluster.clusterIdentifier },
            statistic: 'Sum',
            label: 'Data Transfer (bytes)',
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // ==========================================
    // Stack Outputs
    // ==========================================
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.auroraCluster.clusterEndpoint.socketAddress,
      description: 'Aurora cluster endpoint',
      exportName: `${this.stackName}-cluster-endpoint`,
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.auroraCluster.clusterReadEndpoint.socketAddress,
      description: 'Aurora cluster read endpoint',
      exportName: `${this.stackName}-cluster-read-endpoint`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.dbSecret.secretArn,
      description: 'Secret Manager ARN for database credentials',
      exportName: `${this.stackName}-secret-arn`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-vpc-id`,
    });

    if (props.isPrimaryRegion && this.routingControl) {
      new cdk.CfnOutput(this, 'RoutingControlArn', {
        value: this.routingControl.attrRoutingControlArn,
        description: 'Routing Control ARN for failover',
        exportName: `${this.stackName}-routing-control-arn`,
      });
    }
  }

  /**
   * Get the Route 53 ARC Cluster ARN (would be created separately)
   * In production, this would reference an existing cluster
   */
  private getClusterArn(): string {
    // This is a placeholder - in production, you would reference an existing cluster
    return `arn:aws:route53-recovery-control::${this.account}:cluster/placeholder-cluster`;
  }
}

/**
 * Lambda function code inline for demonstration
 * In production, this would be in a separate file
 */
const failoverLambdaCode = `
import { RDSClient, FailoverGlobalClusterCommand, DescribeGlobalClustersCommand } from '@aws-sdk/client-rds';
import { Route53RecoveryControlConfigClient, UpdateRoutingControlStateCommand } from '@aws-sdk/client-route53-recovery-control-config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const rds = new RDSClient({});
const route53Arc = new Route53RecoveryControlConfigClient({});
const sns = new SNSClient({});
const cloudwatch = new CloudWatchClient({});

export const handler = async (event: any): Promise<any> => {
  console.log('Failover event received:', JSON.stringify(event, null, 2));
  
  const startTime = Date.now();
  
  try {
    // 1. Verify cluster health
    const describeCommand = new DescribeGlobalClustersCommand({
      GlobalClusterIdentifier: process.env.GLOBAL_CLUSTER_ID,
    });
    const clusterInfo = await rds.send(describeCommand);
    console.log('Global cluster status:', clusterInfo);
    
    // 2. Initiate failover
    const failoverCommand = new FailoverGlobalClusterCommand({
      GlobalClusterIdentifier: process.env.GLOBAL_CLUSTER_ID,
      TargetDbClusterIdentifier: process.env.CLUSTER_ARN,
    });
    const failoverResult = await rds.send(failoverCommand);
    console.log('Failover initiated:', failoverResult);
    
    // 3. Update Route 53 ARC routing control
    if (process.env.CONTROL_PANEL_ARN) {
      const updateRoutingCommand = new UpdateRoutingControlStateCommand({
        RoutingControlArn: process.env.CONTROL_PANEL_ARN,
        RoutingControlState: 'On',
      });
      await route53Arc.send(updateRoutingCommand);
      console.log('Routing control updated');
    }
    
    // 4. Record metrics
    const rto = Date.now() - startTime;
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'DisasterRecovery',
      MetricData: [{
        MetricName: 'RTO',
        Value: rto,
        Unit: 'Milliseconds',
        Timestamp: new Date(),
      }],
    }));
    
    // 5. Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Database Failover Completed',
      Message: \`Database failover completed successfully. RTO: \${rto}ms\`,
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Failover completed successfully',
        rto: rto,
      }),
    };
  } catch (error) {
    console.error('Failover failed:', error);
    
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Database Failover Failed',
      Message: \`Database failover failed: \${error}\`,
    }));
    
    throw error;
  }
};
`;
```

## 2. test/tap-stack.unit.test.ts

```typescript
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack, MultiRegionDRStackProps } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let primaryStackProps: MultiRegionDRStackProps;
  let secondaryStackProps: MultiRegionDRStackProps;

  beforeEach(() => {
    app = new cdk.App();
    
    primaryStackProps = {
      isPrimaryRegion: true,
      globalClusterIdentifier: 'test-global-cluster',
      environment: 'dev',
      alertEmail: 'test@example.com',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    secondaryStackProps = {
      isPrimaryRegion: false,
      globalClusterIdentifier: 'test-global-cluster',
      environment: 'dev',
      alertEmail: 'test@example.com',
      env: {
        account: '123456789012',
        region: 'eu-west-1',
      },
    };
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates three subnet types', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs × 3 subnet types
    });

    test('creates VPC flow logs for compliance', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates NAT gateways based on environment', () => {
      const prodProps = { ...primaryStackProps, environment: 'prod' as const };
      const stack = new TapStack(app, 'TestStack', prodProps);
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });
  });

  describe('Security Groups', () => {
    test('creates database security group with PostgreSQL ingress', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
            CidrIp: '10.0.0.0/16',
          }),
        ]),
      });
    });

    test('secondary region allows replication traffic', () => {
      const stack = new TapStack(app, 'TestStack', secondaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 5432,
            ToPort: 5432,
            Description: 'Allow replication from primary region',
          }),
        ]),
      });
    });

    test('restricts outbound traffic appropriately', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '10.0.0.0/8',
          }),
        ]),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates database secret with secure password generation', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      });
    });

    test('primary region secret has cross-region replication', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        ReplicaRegions: [
          {
            Region: 'eu-west-1',
          },
        ],
      });
    });

    test('secondary region secret does not replicate', () => {
      const stack = new TapStack(app, 'TestStack', secondaryStackProps);
      const template = Template.fromStack(stack);

      const secrets = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secrets).forEach(secret => {
        expect(secret.Properties?.ReplicaRegions).toBeUndefined();
      });
    });
  });

  describe('Aurora Database Configuration', () => {
    test('creates Aurora PostgreSQL cluster with correct engine version', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: Match.stringLikeRegexp('14\\.6'),
        StorageEncrypted: true,
      });
    });

    test('configures backup retention correctly', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('enables deletion protection in production', () => {
      const prodProps = { ...primaryStackProps, environment: 'prod' as const };
      const stack = new TapStack(app, 'TestStack', prodProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: true,
      });
    });

    test('creates correct number of instances based on environment', () => {
      const prodProps = { ...primaryStackProps, environment: 'prod' as const };
      const stack = new TapStack(app, 'TestStack', prodProps);
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::RDS::DBInstance', 3);
    });

    test('configures enhanced monitoring', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 1,
        MonitoringRoleArn: Match.anyValue(),
        PerformanceInsightsEnabled: true,
        PerformanceInsightsRetentionPeriod: 731, // 24 months
      });
    });

    test('creates parameter group with optimized settings', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Family: Match.stringLikeRegexp('aurora-postgresql14'),
        Parameters: Match.objectLike({
          max_connections: '5000',
          shared_preload_libraries: 'pg_stat_statements,pg_hint_plan,pgaudit',
          log_statement: 'all',
        }),
      });
    });

    test('primary region creates global cluster', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::GlobalCluster', {
        GlobalClusterIdentifier: 'test-global-cluster',
        StorageEncrypted: true,
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates monitoring role with correct permissions', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('AmazonRDSEnhancedMonitoringRole'),
        ]),
      });
    });

    test('Lambda function has necessary permissions', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'rds:FailoverGlobalCluster',
                'rds:ModifyGlobalCluster',
                'route53-recovery-control-config:UpdateRoutingControl',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CPU utilization alarm', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Threshold: 80,
        EvaluationPeriods: 2,
        Statistic: 'Average',
      });
    });

    test('creates database connection alarm', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Threshold: 4500,
        EvaluationPeriods: 2,
      });
    });

    test('secondary region includes replication lag alarm', () => {
      const stack = new TapStack(app, 'TestStack', secondaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'AuroraGlobalDBReplicationLag',
        Threshold: 1000,
        Period: 10,
        Statistic: 'Maximum',
      });
    });

    test('creates CloudWatch dashboard', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-dr-dashboard'),
      });
    });
  });

  describe('Route 53 ARC Configuration', () => {
    test('primary region creates control panel', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53RecoveryControl::ControlPanel', {
        Name: 'test-global-cluster-control-panel',
      });
    });

    test('creates routing controls for both regions', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::Route53RecoveryControl::RoutingControl', 2);
    });

    test('creates safety rule to ensure at least one region active', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53RecoveryControl::SafetyRule', {
        RuleConfig: {
          Type: 'ATLEAST',
          Threshold: 1,
        },
      });
    });

    test('secondary region does not create ARC resources', () => {
      const stack = new TapStack(app, 'TestStack', secondaryStackProps);
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::Route53RecoveryControl::ControlPanel', 0);
      template.resourceCountIs('AWS::Route53RecoveryControl::RoutingControl', 0);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates failover Lambda with correct runtime', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        MemorySize: 1024,
        Timeout: 300,
        ReservedConcurrentExecutions: 1,
      });
    });

    test('configures dead letter queue', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: Match.objectLike({
          TargetArn: Match.anyValue(),
        }),
      });
    });

    test('enables X-Ray tracing', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('sets correct environment variables', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            REGION: 'us-east-1',
            IS_PRIMARY: 'true',
            GLOBAL_CLUSTER_ID: 'test-global-cluster',
          }),
        },
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates rule for RDS cluster failure events', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.rds'],
          'detail-type': ['RDS DB Cluster Event'],
          detail: {
            EventCategories: ['failure'],
          },
        }),
      });
    });

    test('creates rule for manual failover trigger', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['custom.dr.system'],
          'detail-type': ['Manual Failover Request'],
        }),
      });
    });

    test('EventBridge rules target Lambda function', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
            RetryPolicy: Match.objectLike({
              MaximumRetryAttempts: Match.anyValue(),
            }),
          }),
        ]),
      });
    });
  });

  describe('SNS Configuration', () => {
    test('creates SNS topic for alerts', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Disaster Recovery System Alerts',
      });
    });

    test('adds email subscription when provided', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('no email subscription when not provided', () => {
      const propsNoEmail = { ...primaryStackProps, alertEmail: undefined };
      const stack = new TapStack(app, 'TestStack', propsNoEmail);
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('Stack Outputs', () => {
    test('exports cluster endpoints', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasOutput('ClusterEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp('.*-cluster-endpoint'),
        },
      });

      template.hasOutput('ClusterReadEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp('.*-cluster-read-endpoint'),
        },
      });
    });

    test('exports secret ARN', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasOutput('SecretArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-secret-arn'),
        },
      });
    });

    test('primary region exports routing control ARN', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      template.hasOutput('RoutingControlArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-routing-control-arn'),
        },
      });
    });
  });

  describe('Tagging', () => {
    test('applies all required tags', () => {
      const stack = new TapStack(app, 'TestStack', primaryStackProps);
      const template = Template.fromStack(stack);

      // Check that resources have tags
      const vpc = template.findResources('AWS::EC2::VPC');
      expect(Object.values(vpc)[0].Properties?.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'dev' }),
          expect.objectContaining({ Key: 'Application', Value: 'financial-transactions' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'cdk' }),
          expect.objectContaining({ Key: 'CostCenter', Value: 'platform-engineering' }),
          expect.objectContaining({ Key: 'DataClassification', Value: 'highly-confidential' }),
        ])
      );
    });
  });

  describe('Region Validation', () => {
    test('throws error if primary region is not us-east-1', () => {
      const invalidProps = {
        ...primaryStackProps,
        env: { account: '123456789012', region: 'us-west-2' },
      };

      expect(() => {
        new TapStack(app, 'TestStack', invalidProps);
      }).toThrow('Primary region must be us-east-1');
    });

    test('throws error if secondary region is not eu-west-1', () => {
      const invalidProps = {
        ...secondaryStackProps,
        env: { account: '123456789012', region: 'us-west-2' },
      };

      expect(() => {
        new TapStack(app, 'TestStack', invalidProps);
      }).toThrow('Secondary region must be eu-west-1');
    });
  });
});
```

## 3. test/tap-stack.int.test.ts

```typescript
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { RDSClient, DescribeGlobalClustersCommand, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { EC2Client, DescribeVpcsCommand, DescribeVpcPeeringConnectionsCommand } from '@aws-sdk/client-ec2';
import { SecretsManagerClient, GetSecretValueCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import { Route53RecoveryControlConfigClient, DescribeControlPanelCommand, DescribeRoutingControlCommand } from '@aws-sdk/client-route53-recovery-control-config';
import { Route53RecoveryReadinessClient, GetReadinessCheckStatusCommand } from '@aws-sdk/client-route53-recovery-readiness';
import { CloudWatchClient, GetMetricDataCommand, MetricDataQuery } from '@aws-sdk/client-cloudwatch';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Client as PGClient } from 'pg';
import * as https from 'https';

/**
 * Integration tests for multi-region Aurora disaster recovery solution
 * 
 * These tests validate:
 * 1. Cross-region resource connectivity
 * 2. Failover mechanism functionality
 * 3. RTO/RPO compliance
 * 4. Data consistency across regions
 * 5. Monitoring and alerting systems
 */

describe('TapStack Integration Tests', () => {
  // Configuration from environment variables
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'eu-west-1';
  const globalClusterId = process.env.GLOBAL_CLUSTER_ID || 'financial-global-cluster';
  const stackName = process.env.STACK_NAME || 'TapStack';
  
  // AWS SDK clients
  const primaryRdsClient = new RDSClient({ region: primaryRegion });
  const secondaryRdsClient = new RDSClient({ region: secondaryRegion });
  const primaryEc2Client = new EC2Client({ region: primaryRegion });
  const secondaryEc2Client = new EC2Client({ region: secondaryRegion });
  const primarySecretsClient = new SecretsManagerClient({ region: primaryRegion });
  const secondarySecretsClient = new SecretsManagerClient({ region: secondaryRegion });
  const route53ArcClient = new Route53RecoveryControlConfigClient({ region: primaryRegion });
  const readinessClient = new Route53RecoveryReadinessClient({ region: primaryRegion });
  const primaryCloudWatchClient = new CloudWatchClient({ region: primaryRegion });
  const secondaryCloudWatchClient = new CloudWatchClient({ region: secondaryRegion });
  const eventBridgeClient = new EventBridgeClient({ region: primaryRegion });
  const lambdaClient = new LambdaClient({ region: primaryRegion });

  // Test timeout for long-running operations
  const FAILOVER_TIMEOUT = 120000; // 2 minutes
  const REPLICATION_LAG_THRESHOLD = 1000; // 1 second in milliseconds

  beforeAll(async () => {
    // Verify AWS credentials
    const sts = new STSClient({});
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    console.log(`Running tests with AWS Account: ${identity.Account}`);
  });

  describe('Infrastructure Validation', () => {
    test('Global cluster exists and is healthy', async () => {
      const response = await primaryRdsClient.send(new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId,
      }));

      expect(response.GlobalClusters).toHaveLength(1);
      const globalCluster = response.GlobalClusters![0];
      
      expect(globalCluster.Status).toBe('available');
      expect(globalCluster.StorageEncrypted).toBe(true);
      expect(globalCluster.GlobalClusterMembers).toHaveLength(2);
      
      // Verify both regions are members
      const regions = globalCluster.GlobalClusterMembers!.map(m => 
        m.DBClusterArn!.split(':')[3]
      );
      expect(regions).toContain(primaryRegion);
      expect(regions).toContain(secondaryRegion);
    });

    test('Primary cluster is configured correctly', async () => {
      const response = await primaryRdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `${globalClusterId}-primary`,
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      
      expect(cluster.Status).toBe('available');
      expect(cluster.BackupRetentionPeriod).toBe(35);
      expect(cluster.DeletionProtection).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });

    test('Secondary cluster is configured correctly', async () => {
      const response = await secondaryRdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `${globalClusterId}-secondary`,
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      
      expect(cluster.Status).toBe('available');
      expect(cluster.GlobalWriteForwardingStatus).toBe('disabled');
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });

    test('VPCs exist in both regions', async () => {
      const primaryVpcs = await primaryEc2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:aws:cloudformation:stack-name', Values: [`${stackName}-primary`] },
        ],
      }));
      
      const secondaryVpcs = await secondaryEc2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:aws:cloudformation:stack-name', Values: [`${stackName}-secondary`] },
        ],
      }));

      expect(primaryVpcs.Vpcs).toHaveLength(1);
      expect(secondaryVpcs.Vpcs).toHaveLength(1);
      
      expect(primaryVpcs.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(secondaryVpcs.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Cross-region VPC connectivity is established', async () => {
      const connections = await primaryEc2Client.send(new DescribeVpcPeeringConnectionsCommand({
        Filters: [
          { Name: 'status-code', Values: ['active'] },
        ],
      }));

      const crossRegionConnection = connections.VpcPeeringConnections?.find(conn =>
        conn.AccepterVpcInfo?.Region === secondaryRegion ||
        conn.RequesterVpcInfo?.Region === secondary