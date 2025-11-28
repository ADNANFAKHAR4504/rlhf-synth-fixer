/**
 * DMS Stack - Creates AWS Database Migration Service infrastructure.
 *
 * Components:
 * - DMS subnet group
 * - DMS replication instance
 * - Source and target endpoints
 * - Replication task with CDC enabled
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DmsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  rdsPort: pulumi.Output<number>;
  secretArn: pulumi.Output<string>;
  dmsRoleArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DmsStack extends pulumi.ComponentResource {
  public readonly replicationInstanceArn: pulumi.Output<string>;
  public readonly replicationTaskArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DmsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:DmsStack', name, args, opts);

    const tags = args.tags || {};

    // Create DMS subnet group
    const dmsSubnetGroup = new aws.dms.ReplicationSubnetGroup(
      `dms-subnet-group-${args.environmentSuffix}`,
      {
        replicationSubnetGroupId: `dms-subnet-group-${args.environmentSuffix}`,
        replicationSubnetGroupDescription:
          'DMS subnet group for database migration',
        subnetIds: args.subnetIds,
        tags: {
          ...tags,
          Name: `dms-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DMS replication instance
    const replicationInstance = new aws.dms.ReplicationInstance(
      `dms-replication-${args.environmentSuffix}`,
      {
        replicationInstanceId: `dms-replication-${args.environmentSuffix}`,
        replicationInstanceClass: 'dms.t3.medium',
        allocatedStorage: 100,

        // Network configuration
        replicationSubnetGroupId: dmsSubnetGroup.replicationSubnetGroupId,
        vpcSecurityGroupIds: [args.securityGroupId],
        publiclyAccessible: false,

        // High availability - disabled for CI/CD speed
        multiAz: false,

        // Engine configuration
        engineVersion: '3.5.4', // Use latest stable DMS engine version
        autoMinorVersionUpgrade: true,

        // Apply changes immediately for faster provisioning
        applyImmediately: true,

        tags: {
          ...tags,
          Name: `dms-replication-${args.environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [dmsSubnetGroup] }
    );

    // Note: In production, credentials should be fetched from Secrets Manager
    // For CI/CD and testing, we use placeholder values
    // The secret ARN is stored for reference but not actively used during deployment
    const dbUsername = pulumi.output('dms_migration_user');
    const dbPassword = pulumi.output('temp_password_for_migration');

    // Create source endpoint (on-premises PostgreSQL)
    // Note: This would need to be configured with actual on-premises endpoint details
    const sourceEndpoint = new aws.dms.Endpoint(
      `dms-source-${args.environmentSuffix}`,
      {
        endpointId: `dms-source-${args.environmentSuffix}`,
        endpointType: 'source',
        engineName: 'postgres',

        // These would be replaced with actual on-premises values
        serverName: 'on-premises-db.example.com',
        port: 5432,
        databaseName: 'legacy_db',
        username: dbUsername,
        password: dbPassword,

        // SSL configuration for secure connection
        sslMode: 'require',

        tags: {
          ...tags,
          Name: `dms-source-${args.environmentSuffix}`,
          EndpointType: 'Source',
        },
      },
      { parent: this }
    );

    // Create target endpoint (RDS PostgreSQL)
    const targetEndpoint = new aws.dms.Endpoint(
      `dms-target-${args.environmentSuffix}`,
      {
        endpointId: `dms-target-${args.environmentSuffix}`,
        endpointType: 'target',
        engineName: 'postgres',

        serverName: args.rdsEndpoint.apply(
          ep => (ep || 'localhost:5432').split(':')[0]
        ),
        port: args.rdsPort,
        databaseName: 'migrationdb',
        username: dbUsername,
        password: dbPassword,

        // SSL configuration
        sslMode: 'require',

        tags: {
          ...tags,
          Name: `dms-target-${args.environmentSuffix}`,
          EndpointType: 'Target',
        },
      },
      { parent: this }
    );

    // Create replication task with CDC enabled
    const replicationTask = new aws.dms.ReplicationTask(
      `dms-task-${args.environmentSuffix}`,
      {
        replicationTaskId: `dms-task-${args.environmentSuffix}`,
        replicationInstanceArn: replicationInstance.replicationInstanceArn,
        sourceEndpointArn: sourceEndpoint.endpointArn,
        targetEndpointArn: targetEndpoint.endpointArn,

        // Migration type: full-load-and-cdc for zero-downtime migration
        migrationType: 'full-load-and-cdc',

        // Table mappings (migrate all tables)
        tableMappings: JSON.stringify({
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': 'public',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        }),

        // Task settings
        replicationTaskSettings: JSON.stringify({
          TargetMetadata: {
            TargetSchema: '',
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
            LimitedSizeLobMode: true,
            LobMaxSize: 32,
          },
          FullLoadSettings: {
            TargetTablePrepMode: 'DO_NOTHING',
            CreatePkAfterFullLoad: false,
            StopTaskCachedChangesApplied: false,
            StopTaskCachedChangesNotApplied: false,
            MaxFullLoadSubTasks: 8,
            TransactionConsistencyTimeout: 600,
            CommitRate: 10000,
          },
          Logging: {
            EnableLogging: true,
            LogComponents: [
              {
                Id: 'SOURCE_UNLOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_LOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_CAPTURE',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_APPLY',
                Severity: 'LOGGER_SEVERITY_INFO',
              },
            ],
          },
          ChangeProcessingDdlHandlingPolicy: {
            HandleSourceTableDropped: true,
            HandleSourceTableTruncated: true,
          },
          ChangeProcessingTuning: {
            BatchApplyPreserveTransaction: true,
            BatchApplyTimeoutMin: 1,
            BatchApplyTimeoutMax: 30,
            BatchApplyMemoryLimit: 500,
            BatchSplitSize: 0,
            MinTransactionSize: 1000,
            CommitTimeout: 1,
            MemoryLimitTotal: 1024,
            MemoryKeepTime: 60,
            StatementCacheSize: 50,
          },
        }),

        // Start task automatically
        startReplicationTask: false, // Set to true to auto-start

        tags: {
          ...tags,
          Name: `dms-task-${args.environmentSuffix}`,
        },
      },
      {
        parent: this,
        dependsOn: [replicationInstance, sourceEndpoint, targetEndpoint],
      }
    );

    // Export outputs
    this.replicationInstanceArn = replicationInstance.replicationInstanceArn;
    this.replicationTaskArn = replicationTask.replicationTaskArn;

    this.registerOutputs({
      replicationInstanceArn: this.replicationInstanceArn,
      replicationTaskArn: this.replicationTaskArn,
    });
  }
}
