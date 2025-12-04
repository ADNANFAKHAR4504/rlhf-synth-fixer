import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RDSStackConfig {
  environmentSuffix: string;
  dbPassword: pulumi.Output<string>;
  region?: string;
}

export class RDSOptimizationStack {
  public readonly vpcId: pulumi.Output<string>;
  public readonly dbInstanceId: pulumi.Output<string>;
  public readonly dbInstanceEndpoint: pulumi.Output<string>;
  public readonly dbInstanceAddress: pulumi.Output<string>;
  public readonly readReplicaEndpoint: pulumi.Output<string>;
  public readonly readReplicaAddress: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly dbParameterGroupName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly cpuAlarmName: pulumi.Output<string>;
  public readonly storageAlarmName: pulumi.Output<string>;
  public readonly replicaLagAlarmName: pulumi.Output<string>;

  constructor(name: string, config: RDSStackConfig) {
    const { environmentSuffix, dbPassword, region = 'us-east-1' } = config;

    // Tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ManagedBy: 'Pulumi',
    };

    // Create VPC and networking (simplified for RDS)
    const vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `vpc-${environmentSuffix}`,
      },
    });

    // Create private subnets in different AZs for RDS
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${region}a`,
        tags: {
          ...commonTags,
          Name: `private-subnet-1-${environmentSuffix}`,
        },
      }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${region}b`,
        tags: {
          ...commonTags,
          Name: `private-subnet-2-${environmentSuffix}`,
        },
      }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          ...commonTags,
          Name: `db-subnet-group-${environmentSuffix}`,
        },
      }
    );

    // Create security group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL access from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `db-sg-${environmentSuffix}`,
        },
      }
    );

    // Create custom parameter group with optimized settings
    const dbParameterGroup = new aws.rds.ParameterGroup(
      `db-params-${environmentSuffix}`,
      {
        family: 'postgres15',
        description: 'Custom parameter group with optimized memory settings',
        parameters: [
          {
            name: 'shared_buffers',
            value: '524288', // 25% of memory for db.t3.large (2GB RAM = 512MB)
            applyMethod: 'pending-reboot', // Static parameter
          },
          {
            name: 'effective_cache_size',
            value: '1572864', // 75% of memory (1.5GB)
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'maintenance_work_mem',
            value: '131072', // 128MB
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'checkpoint_completion_target',
            value: '0.9',
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'wal_buffers',
            value: '16384', // 16MB
            applyMethod: 'pending-reboot', // Static parameter
          },
          {
            name: 'default_statistics_target',
            value: '100',
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'random_page_cost',
            value: '1.1', // For SSD storage
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'effective_io_concurrency',
            value: '200',
            applyMethod: 'immediate', // Dynamic parameter
          },
          {
            name: 'work_mem',
            value: '10485', // ~10MB
            applyMethod: 'immediate', // Dynamic parameter
          },
        ],
        tags: {
          ...commonTags,
          Name: `db-params-${environmentSuffix}`,
        },
      }
    );

    // Create SNS topic for CloudWatch alarms
    const alarmTopic = new aws.sns.Topic(`rds-alarms-${environmentSuffix}`, {
      displayName: 'RDS PostgreSQL Alarms',
      tags: {
        ...commonTags,
        Name: `rds-alarms-${environmentSuffix}`,
      },
    });

    // Create primary RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(
      `rds-${environmentSuffix}`,
      {
        identifier: `rds-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15', // Use major version, AWS will use latest minor version
        instanceClass: 'db.t3.large',
        allocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,

        // Database configuration
        dbName: 'optimizeddb',
        username: 'dbadmin',
        password: dbPassword,
        port: 5432,

        // Network configuration
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        publiclyAccessible: false,
        multiAz: false, // Single AZ for cost optimization

        // Backup configuration (baseline - will be optimized by script)
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00', // 3-4 AM UTC
        maintenanceWindow: 'sun:04:00-sun:06:00', // Sunday 4-6 AM UTC
        skipFinalSnapshot: true, // Allow destruction for testing

        // Performance Insights
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,

        // Deletion protection
        deletionProtection: true,

        // Parameter group
        parameterGroupName: dbParameterGroup.name,

        // Enhanced monitoring
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],

        // Tags
        tags: {
          ...commonTags,
          Name: `rds-${environmentSuffix}`,
        },
      },
      {
        ignoreChanges: ['tagsAll'], // Ignore AWS-managed tags to prevent unnecessary updates
      }
    );

    // Create read replica in the same AZ for read-heavy reporting queries
    const readReplica = new aws.rds.Instance(
      `replica-${environmentSuffix}`,
      {
        identifier: `replica-${environmentSuffix}`,
        replicateSourceDb: dbInstance.identifier,
        instanceClass: 'db.t3.large',

        // Network configuration
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        publiclyAccessible: false,
        availabilityZone: `${region}a`, // Same AZ as primary

        // Performance Insights
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,

        // Backup configuration
        skipFinalSnapshot: true,

        // Tags
        tags: {
          ...commonTags,
          Name: `replica-${environmentSuffix}`,
          Role: 'ReadReplica',
        },
      },
      {
        dependsOn: [dbInstance],
        deleteBeforeReplace: true, // Delete old replica before creating replacement
        ignoreChanges: ['tagsAll'], // Ignore AWS-managed tags to prevent unnecessary updates
      }
    );

    // CloudWatch Alarm: CPU Utilization > 80%
    const cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `rds-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300, // 5 minutes
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when RDS CPU exceeds 80%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: dbInstance.identifier,
        },
        tags: {
          ...commonTags,
          Name: `rds-cpu-alarm-${environmentSuffix}`,
        },
      }
    );

    // CloudWatch Alarm: Storage < 15% (or > 85% used)
    const storageAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-storage-alarm-${environmentSuffix}`,
      {
        name: `rds-storage-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300, // 5 minutes
        statistic: 'Average',
        threshold: 16106127360, // 15% of 100GB = 15GB in bytes
        alarmDescription: 'Alert when RDS free storage drops below 15%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: dbInstance.identifier,
        },
        tags: {
          ...commonTags,
          Name: `rds-storage-alarm-${environmentSuffix}`,
        },
      }
    );

    // CloudWatch Alarm: Read Replica Lag
    const replicaLagAlarm = new aws.cloudwatch.MetricAlarm(
      `replica-lag-alarm-${environmentSuffix}`,
      {
        name: `replica-lag-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReplicaLag',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 300, // 5 minutes lag
        alarmDescription: 'Alert when read replica lag exceeds 5 minutes',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: readReplica.identifier,
        },
        tags: {
          ...commonTags,
          Name: `replica-lag-alarm-${environmentSuffix}`,
        },
      }
    );

    // Set exports
    this.vpcId = vpc.id;
    this.dbInstanceId = dbInstance.id;
    this.dbInstanceEndpoint = dbInstance.endpoint;
    this.dbInstanceAddress = dbInstance.address;
    this.readReplicaEndpoint = readReplica.endpoint;
    this.readReplicaAddress = readReplica.address;
    this.dbSecurityGroupId = dbSecurityGroup.id;
    this.dbParameterGroupName = dbParameterGroup.name;
    this.snsTopicArn = alarmTopic.arn;
    this.cpuAlarmName = cpuAlarm.name;
    this.storageAlarmName = storageAlarm.name;
    this.replicaLagAlarmName = replicaLagAlarm.name;
  }
}
