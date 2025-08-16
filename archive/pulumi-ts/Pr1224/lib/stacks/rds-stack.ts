import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface RdsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  privateSubnetIds: pulumi.Input<pulumi.Input<string>[]>;
  dbSecurityGroupId: pulumi.Input<string>;
  rdsKmsKeyArn: pulumi.Input<string>;
  instanceClass?: string;
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly dbInstanceId: pulumi.Output<string>;
  public readonly dbInstanceArn: pulumi.Output<string>;
  public readonly dbInstanceEndpoint: pulumi.Output<string>;
  public readonly dbInstancePort: pulumi.Output<number>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;

  constructor(name: string, args: RdsStackArgs, opts?: ResourceOptions) {
    super('tap:rds:RdsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceClass = args.instanceClass || 'db.t3.micro';
    const tags = args.tags || {};

    // Tripwire to catch bad subnet inputs early
    pulumi.output(args.privateSubnetIds).apply(ids => {
      if (!ids || ids.length < 2) {
        throw new Error(
          `RDS needs at least two private subnets; got ${ids?.length ?? 0}.`
        );
      }
    });

    // Subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `tap-db-subnet-group-${environmentSuffix}`,
      {
        name: `tap-db-subnet-group-${environmentSuffix}`,
        subnetIds: args.privateSubnetIds,
        tags: { Name: `tap-db-subnet-group-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Enhanced monitoring role
    const monitoringRole = new aws.iam.Role(
      `tap-rds-monitoring-role-${environmentSuffix}`,
      {
        name: `tap-rds-monitoring-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'monitoring.rds.amazonaws.com' },
            },
          ],
        }),
        tags: { Name: `tap-rds-monitoring-role-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-rds-monitoring-attachment-${environmentSuffix}`,
      {
        role: monitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { parent: this }
    );

    // DB instance
    const dbInstance = new aws.rds.Instance(
      `tap-db-${environmentSuffix}`,
      {
        identifier: `tap-db-${environmentSuffix}`,
        instanceClass,
        engine: 'mysql',
        engineVersion: '8.0', // or a pinned patch like '8.0.35'
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: args.rdsKmsKeyArn,

        dbName: 'tapdb',
        username: 'admin',
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: args.rdsKmsKeyArn,

        vpcSecurityGroupIds: [args.dbSecurityGroupId],
        dbSubnetGroupName: dbSubnetGroup.name,
        publiclyAccessible: false,

        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: true,

        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `tap-db-final-snapshot-${environmentSuffix}`,
        deleteAutomatedBackups: false,

        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        monitoringInterval: 60,
        monitoringRoleArn: monitoringRole.arn,

        // CloudWatch Database Insights - Enhanced monitoring with detailed metrics
        // This provides comprehensive database monitoring through CloudWatch
        // without the instance class restrictions of Performance Insights

        tags: {
          Name: `tap-db-${environmentSuffix}`,
          Purpose: 'MainDatabase',
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Database Insights - Create alarms for key database metrics
    // This provides comprehensive monitoring similar to Performance Insights

    // CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-cpu-alarm-${environmentSuffix}`,
      {
        name: `tap-db-cpu-utilization-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Database Connections Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-connections-alarm-${environmentSuffix}`,
      {
        name: `tap-db-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 40, // Adjust based on your connection pool size
        alarmDescription: 'RDS connection count is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-connections-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Free Storage Space Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-storage-alarm-${environmentSuffix}`,
      {
        name: `tap-db-free-storage-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000, // 2GB in bytes
        alarmDescription: 'RDS free storage space is low',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-storage-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Read Latency Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-read-latency-alarm-${environmentSuffix}`,
      {
        name: `tap-db-read-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReadLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'RDS read latency is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-read-latency-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Write Latency Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-write-latency-alarm-${environmentSuffix}`,
      {
        name: `tap-db-write-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'WriteLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'RDS write latency is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-write-latency-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.dbInstanceId = dbInstance.id;
    this.dbInstanceArn = dbInstance.arn;
    this.dbInstanceEndpoint = dbInstance.endpoint;
    this.dbInstancePort = dbInstance.port;
    this.dbSubnetGroupName = dbSubnetGroup.name;

    this.registerOutputs({
      dbInstanceId: this.dbInstanceId,
      dbInstanceArn: this.dbInstanceArn,
      dbInstanceEndpoint: this.dbInstanceEndpoint,
      dbInstancePort: this.dbInstancePort,
      dbSubnetGroupName: this.dbSubnetGroupName,
    });
  }
}
