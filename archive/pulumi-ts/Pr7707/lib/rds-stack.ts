/**
 * RDS Stack - Optimized PostgreSQL Database Infrastructure
 *
 * This module implements an optimized RDS PostgreSQL deployment with:
 * - Performance improvements (db.r6g.large with Graviton processors)
 * - Enhanced monitoring (Performance Insights + Enhanced Monitoring)
 * - High availability (Multi-AZ deployment)
 * - Automated alerting (CloudWatch + SNS)
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  applicationSecurityGroupId: pulumi.Input<string>;
  tags?: { [key: string]: pulumi.Input<string> };
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly dbInstance: aws.rds.Instance;
  public readonly dbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly snsTopic: aws.sns.Topic;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbPort: pulumi.Output<number>;

  constructor(
    name: string,
    args: RdsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RdsStack', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Default tags merged with user-provided tags
    const resourceTags = {
      Environment: 'production',
      Team: 'platform',
      Service: 'user-api',
      ...args.tags,
    };

    // Create SNS Topic for database alerts
    this.snsTopic = new aws.sns.Topic(
      `db-alerts-${args.environmentSuffix}`,
      {
        displayName: `Database Alerts - ${args.environmentSuffix}`,
        tags: resourceTags,
      },
      defaultResourceOptions
    );

    // Create DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-${args.environmentSuffix}`,
      {
        name: `db-subnet-${args.environmentSuffix}`,
        subnetIds: args.privateSubnetIds,
        tags: {
          ...resourceTags,
          Name: `db-subnet-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create Security Group for RDS
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${args.environmentSuffix}`,
      {
        name: `db-sg-${args.environmentSuffix}`,
        description:
          'Security group for RDS PostgreSQL instance - allows access from application tier only',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [args.applicationSecurityGroupId],
            description: 'PostgreSQL access from application tier',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...resourceTags,
          Name: `db-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create IAM role for Enhanced Monitoring
    const monitoringRole = new aws.iam.Role(
      `rds-monitoring-role-${args.environmentSuffix}`,
      {
        name: `rds-monitoring-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
        tags: resourceTags,
      },
      defaultResourceOptions
    );

    new aws.iam.RolePolicyAttachment(
      `rds-monitoring-policy-${args.environmentSuffix}`,
      {
        role: monitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      defaultResourceOptions
    );

    // Create custom DB Parameter Group with optimized settings
    // db.r6g.large has 16 GiB memory = 16384 MB
    // shared_buffers = 25% = 4096 MB = 524288 (8KB pages)
    // effective_cache_size = 75% = 12288 MB = 1572864 (8KB pages)
    // Note: Static parameters (shared_buffers, effective_cache_size, etc.) will require instance reboot
    const dbParameterGroup = new aws.rds.ParameterGroup(
      `db-params-${args.environmentSuffix}`,
      {
        name: `postgres-optimized-${args.environmentSuffix}`,
        family: 'postgres14',
        description: 'Optimized PostgreSQL parameters for db.r6g.large',
        parameters: [
          {
            name: 'shared_buffers',
            value: '524288', // 4 GB in 8KB pages
            applyMethod: 'pending-reboot', // Static parameter requires reboot
          },
          {
            name: 'effective_cache_size',
            value: '1572864', // 12 GB in 8KB pages
            applyMethod: 'pending-reboot', // Static parameter requires reboot
          },
          {
            name: 'maintenance_work_mem',
            value: '2097152', // 2 GB in KB
            applyMethod: 'pending-reboot', // Static parameter requires reboot
          },
          {
            name: 'work_mem',
            value: '32768', // 32 MB in KB
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'random_page_cost',
            value: '1.1', // Optimized for SSD storage
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'effective_io_concurrency',
            value: '200', // SSD storage optimization
            applyMethod: 'immediate', // Dynamic parameter
          },
        ],
        tags: resourceTags,
      },
      defaultResourceOptions
    );

    // Create RDS PostgreSQL Instance
    this.dbInstance = new aws.rds.Instance(
      `db-postgres-${args.environmentSuffix}`,
      {
        identifier: `user-api-db-${args.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '14.20',
        instanceClass: 'db.r6g.large',
        allocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,

        // Database configuration
        dbName: 'userapi',
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'), // Should be from AWS Secrets Manager in production
        port: 5432,

        // High Availability
        multiAz: true,

        // Backup configuration
        backupRetentionPeriod: 35,
        backupWindow: '03:00-04:00', // 3-4 AM UTC
        maintenanceWindow: 'Mon:04:00-Mon:05:00',

        // Network configuration
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.dbSecurityGroup.id],
        publiclyAccessible: false,

        // Parameter group
        parameterGroupName: dbParameterGroup.name,

        // Performance Insights
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,

        // Enhanced Monitoring
        monitoringInterval: 60,
        monitoringRoleArn: monitoringRole.arn,

        // Operational settings
        autoMinorVersionUpgrade: true,
        deletionProtection: false, // Must be false for destroyability
        skipFinalSnapshot: true, // Must be true for destroyability
        applyImmediately: false,

        tags: {
          ...resourceTags,
          Name: `user-api-db-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Export outputs
    this.dbEndpoint = this.dbInstance.endpoint;
    this.dbPort = this.dbInstance.port;

    // Create CloudWatch Alarms
    this.createCloudWatchAlarms(
      args.environmentSuffix,
      resourceTags,
      defaultResourceOptions
    );

    this.registerOutputs({
      dbInstanceId: this.dbInstance.id,
      dbEndpoint: this.dbEndpoint,
      dbPort: this.dbPort,
      dbSecurityGroupId: this.dbSecurityGroup.id,
      snsTopicArn: this.snsTopic.arn,
    });
  }

  private createCloudWatchAlarms(
    environmentSuffix: string,
    tags: { [key: string]: pulumi.Input<string> },
    opts: pulumi.ResourceOptions
  ): void {
    // CPU Utilization Alarm (80% threshold)
    new aws.cloudwatch.MetricAlarm(
      `db-cpu-alarm-${environmentSuffix}`,
      {
        name: `db-cpu-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300, // 5 minutes
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Triggers when CPU utilization exceeds 80%',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.dbInstance.identifier,
        },
        tags: tags,
      },
      opts
    );

    // Database Connections Alarm (80% of max_connections)
    // PostgreSQL default max_connections for db.r6g.large is approximately 600
    new aws.cloudwatch.MetricAlarm(
      `db-connections-alarm-${environmentSuffix}`,
      {
        name: `db-connections-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 480, // 80% of ~600
        alarmDescription:
          'Triggers when database connections exceed 80% of max_connections',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.dbInstance.identifier,
        },
        tags: tags,
      },
      opts
    );

    // Read Latency Alarm (200ms threshold)
    new aws.cloudwatch.MetricAlarm(
      `db-read-latency-alarm-${environmentSuffix}`,
      {
        name: `db-read-latency-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReadLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms in seconds
        alarmDescription: 'Triggers when read latency exceeds 200ms',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.dbInstance.identifier,
        },
        tags: tags,
      },
      opts
    );

    // Write Latency Alarm (200ms threshold)
    new aws.cloudwatch.MetricAlarm(
      `db-write-latency-alarm-${environmentSuffix}`,
      {
        name: `db-write-latency-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'WriteLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms in seconds
        alarmDescription: 'Triggers when write latency exceeds 200ms',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.dbInstance.identifier,
        },
        tags: tags,
      },
      opts
    );
  }
}
