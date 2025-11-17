import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface DatabaseStackProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  databaseSecurityGroup: ec2.ISecurityGroup;
  isPrimary: boolean;
  globalClusterIdentifier?: string;
}

export class DatabaseStack extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly globalClusterIdentifier: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, databaseSecurityGroup } = props;

    // SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'DatabaseAlarmTopic', {
      topicName: `TapStack${environmentSuffix}DatabaseAlarms${region}`,
      displayName: 'Aurora Database Alarms',
    });

    // Create standalone Aurora cluster (single region)
    this.cluster = new rds.DatabaseCluster(this, 'Cluster', {
      clusterIdentifier: `tapstack${environmentSuffix.toLowerCase()}${region.replace(/-/g, '')}`,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_11,
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

    // Set globalClusterIdentifier for consistency (though not used in single region)
    this.globalClusterIdentifier = `tapstack${environmentSuffix.toLowerCase()}cluster`;

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
  }
}
