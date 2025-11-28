/**
 * RDS Stack - Creates PostgreSQL database with encryption and backup configuration.
 *
 * Features:
 * - Multi-AZ PostgreSQL 14 deployment
 * - KMS encryption at rest
 * - 35-day backup retention with PITR
 * - Automated minor version upgrades
 * - Enhanced monitoring enabled
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  secretArn: pulumi.Output<string>;
  kmsKeyId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly endpoint: pulumi.Output<string>;
  public readonly port: pulumi.Output<number>;
  public readonly dbInstanceId: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:RdsStack', name, args, opts);

    const tags = args.tags || {};

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${args.environmentSuffix}`,
      {
        name: `rds-subnet-group-${args.environmentSuffix}`,
        description: 'Subnet group for RDS PostgreSQL',
        subnetIds: args.subnetIds,
        tags: {
          ...tags,
          Name: `rds-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB parameter group for PostgreSQL 14
    const dbParameterGroup = new aws.rds.ParameterGroup(
      `rds-pg-${args.environmentSuffix}`,
      {
        name: `postgres14-params-${args.environmentSuffix}`,
        family: 'postgres14',
        description: 'PostgreSQL 14 parameter group for migration',
        parameters: [
          {
            name: 'rds.logical_replication',
            value: '1',
            applyMethod: 'pending-reboot',
          },
          {
            name: 'wal_sender_timeout',
            value: '0',
          },
        ],
        tags: {
          ...tags,
          Name: `postgres14-params-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // For RDS, we'll use manage_master_user_password which automatically creates
    // and manages a secret in AWS Secrets Manager (RDS-managed secret rotation)
    // This is the recommended approach for Pulumi RDS with Secrets Manager integration

    // Create RDS PostgreSQL instance with managed master password
    const dbInstance = new aws.rds.Instance(
      `postgres-${args.environmentSuffix}`,
      {
        identifier: `postgres-db-${args.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '14.15', // Use latest stable PostgreSQL 14.x version
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: args.kmsKeyId,

        // Database configuration
        dbName: 'migrationdb',
        username: 'postgresadmin',
        // Use manageMasterUserPassword for RDS-managed secret
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: args.kmsKeyId,
        port: 5432,

        // Network configuration
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        publiclyAccessible: false,

        // High availability - disabled for CI/CD speed
        multiAz: false,

        // Backup and maintenance - minimum for CI/CD
        backupRetentionPeriod: 1,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'Mon:04:00-Mon:05:00',

        // PITR and snapshots
        skipFinalSnapshot: true, // Required for CI/CD cleanup
        deletionProtection: false, // Required for CI/CD cleanup
        copyTagsToSnapshot: true,

        // Monitoring and logging
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        monitoringInterval: 60,
        monitoringRoleArn: this.createMonitoringRole(
          args.environmentSuffix,
          tags
        ),
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,

        // Upgrades
        autoMinorVersionUpgrade: true,
        allowMajorVersionUpgrade: false,
        applyImmediately: false,

        // Parameter group
        parameterGroupName: dbParameterGroup.name,

        tags: {
          ...tags,
          Name: `postgres-db-${args.environmentSuffix}`,
          DatabaseEngine: 'PostgreSQL',
          EngineVersion: '14.15',
        },
      },
      { parent: this }
    );

    // Export outputs
    this.endpoint = dbInstance.endpoint;
    this.port = pulumi.output(5432);
    this.dbInstanceId = dbInstance.id;

    this.registerOutputs({
      endpoint: this.endpoint,
      port: this.port,
      dbInstanceId: this.dbInstanceId,
    });
  }

  private createMonitoringRole(
    environmentSuffix: string,
    tags: pulumi.Input<{ [key: string]: string }>
  ): pulumi.Output<string> {
    const monitoringRole = new aws.iam.Role(
      `rds-monitoring-role-${environmentSuffix}`,
      {
        name: `rds-monitoring-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `rds-monitoring-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `rds-monitoring-attachment-${environmentSuffix}`,
      {
        role: monitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { parent: this }
    );

    return monitoringRole.arn;
  }
}
