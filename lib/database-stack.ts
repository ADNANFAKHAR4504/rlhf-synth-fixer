import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  databaseSecurityGroup: ec2.ISecurityGroup;
  isPrimary: boolean;
  globalClusterIdentifier?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const {
      environmentSuffix,
      region,
      vpc,
      databaseSecurityGroup,
      isPrimary,
      globalClusterIdentifier,
    } = props;

    // SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'DatabaseAlarmTopic', {
      topicName: `TapStack${environmentSuffix}DatabaseAlarms${region}`,
      displayName: 'Aurora Database Alarms',
    });

    if (isPrimary) {
      // Create Global Database Cluster
      const globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `tapstack${environmentSuffix.toLowerCase()}globaldb`,
        engine: 'aurora-postgresql',
        engineVersion: '14.9',
        deletionProtection: false,
        storageEncrypted: true,
      });

      this.globalClusterIdentifier = globalCluster.ref;

      // Primary cluster with backtrack
      this.cluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
        clusterIdentifier: `tapstack${environmentSuffix.toLowerCase()}primary${region}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_9,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T3,
              ec2.InstanceSize.MEDIUM
            ),
            enablePerformanceInsights: true,
          }),
        ],
        vpc,
        securityGroups: [databaseSecurityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        storageEncrypted: true,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: 7,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        defaultDatabaseName: 'tapdb',
      });

      // Associate cluster with global cluster
      const cfnCluster = this.cluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = globalCluster.ref;
      cfnCluster.addDependency(globalCluster);

      // Note: Backtrack is configured at the cluster level
      cfnCluster.backtrackWindow = 86400; // 24 hours in seconds
    } else {
      // Secondary (read-only) cluster
      this.cluster = new rds.DatabaseCluster(this, 'SecondaryCluster', {
        clusterIdentifier: `tapstack${environmentSuffix.toLowerCase()}secondary${region}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_9,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          enablePerformanceInsights: true,
        }),
        vpc,
        securityGroups: [databaseSecurityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        storageEncrypted: true,
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: 7,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Associate with global cluster
      const cfnCluster = this.cluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = globalClusterIdentifier;
    }

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `TapStack${environmentSuffix}DatabaseHighCPU${region}`,
      metric: this.cluster.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cpuAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    const connectionsAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseConnectionsAlarm',
      {
        alarmName: `TapStack${environmentSuffix}DatabaseHighConnections${region}`,
        metric: this.cluster.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    connectionsAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.hostname,
      description: 'Aurora Cluster Endpoint',
      exportName: `TapStack${environmentSuffix}ClusterEndpoint${region}`,
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.cluster.clusterReadEndpoint.hostname,
      description: 'Aurora Cluster Read Endpoint',
      exportName: `TapStack${environmentSuffix}ClusterReadEndpoint${region}`,
    });

    if (isPrimary) {
      new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
        value: this.globalClusterIdentifier,
        description: 'Aurora Global Cluster Identifier',
        exportName: `TapStack${environmentSuffix}GlobalClusterIdentifier`,
      });
    }
  }
}
