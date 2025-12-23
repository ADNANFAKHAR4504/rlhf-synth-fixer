import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  alertsTopic: sns.Topic;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // DB Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter Group for PostgreSQL
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_min_duration_statement: '1000',
        },
      }
    );

    // RDS Instance with encryption
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `webapp-db-${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Disabled for testing - enable for production
      multiAz: false, // Set to true for production
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      enablePerformanceInsights: true,
      monitoringInterval: cdk.Duration.minutes(1),
    });

    // CloudWatch Alarm for RDS CPU Utilization
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `RDS-CPU-${props.environmentSuffix}`,
      alarmDescription: 'RDS CPU utilization is high',
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(props.alertsTopic));

    // CloudWatch Alarm for RDS Burst Balance
    new cloudwatch.Alarm(this, 'DatabaseBurstBalanceAlarm', {
      alarmName: `RDS-BurstBalance-${props.environmentSuffix}`,
      alarmDescription: 'RDS burst balance is low',
      metric: this.database.metricDatabaseConnections(),
      threshold: 20,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(props.alertsTopic));

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Database');
  }
}
