import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class DatabaseStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const vpc = props.vpc;
    const securityGroup = props.securityGroup;
    const encryptionKey = props.encryptionKey;
    const dbCredentials = props.dbCredentials;

    // Subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: `healthtech-db-subnet-${environmentSuffix}`,
      description: 'Subnet group for HealthTech RDS cluster',
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter group for Aurora PostgreSQL
    const parameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_8,
      }),
      parameters: {
        'rds.force_ssl': '1',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
      },
    });

    // Aurora Serverless v2 cluster for cost optimization and fast provisioning
    this.dbCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
      clusterIdentifier: `healthtech-primary-${environmentSuffix}`,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_8,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        instanceIdentifier: `healthtech-writer-${environmentSuffix}`,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader1', {
          instanceIdentifier: `healthtech-reader1-${environmentSuffix}`,
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [securityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch alarms for database monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, 'DBCPUAlarm', {
      alarmName: `rds-cpu-utilization-${environmentSuffix}`,
      metric: this.dbCluster.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    const connectionsAlarm = new cloudwatch.Alarm(this, 'DBConnectionsAlarm', {
      alarmName: `rds-connections-${environmentSuffix}`,
      metric: this.dbCluster.metricDatabaseConnections(),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Export connection information
    new cdk.CfnOutput(this, 'DBClusterEndpoint', {
      value: this.dbCluster.clusterEndpoint.hostname,
      exportName: `healthtech-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DBClusterReadEndpoint', {
      value: this.dbCluster.clusterReadEndpoint.hostname,
      exportName: `healthtech-db-read-endpoint-${environmentSuffix}`,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
