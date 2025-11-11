import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DmsConstructProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.SecurityGroup;
  targetEndpoint: string;
  targetEndpointHostname: string;
  targetEndpointPort: number;
  targetSecret: secretsmanager.Secret;
  sourceHost: string;
  sourcePort: number;
  sourceDatabase: string;
  sourceUsername: string;
  sourcePassword: string;
}

export class DmsConstruct extends Construct {
  public readonly replicationInstance: dms.CfnReplicationInstance;
  public readonly sourceEndpoint: dms.CfnEndpoint;
  public readonly targetEndpoint: dms.CfnEndpoint;
  public readonly migrationTask: dms.CfnReplicationTask;
  public readonly taskArn: string;

  constructor(scope: Construct, id: string, props: DmsConstructProps) {
    super(scope, id);

    // Create DMS subnet group
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      `dms-subnet-group-${props.environmentSuffix}`,
      {
        replicationSubnetGroupDescription: 'DMS replication subnet group',
        replicationSubnetGroupIdentifier: `dms-subnet-group-${props.environmentSuffix}`,
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create DMS IAM roles
    const dmsVpcRole = new iam.Role(
      this,
      `dms-vpc-role-${props.environmentSuffix}`,
      {
        roleName: `dms-vpc-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonDMSVPCManagementRole'
          ),
        ],
      }
    );

    const dmsCloudWatchRole = new iam.Role(
      this,
      `dms-cloudwatch-role-${props.environmentSuffix}`,
      {
        roleName: `dms-cloudwatch-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonDMSCloudWatchLogsRole'
          ),
        ],
      }
    );

    // Create DMS replication instance
    this.replicationInstance = new dms.CfnReplicationInstance(
      this,
      `dms-instance-${props.environmentSuffix}`,
      {
        replicationInstanceIdentifier: `dms-instance-${props.environmentSuffix}`,
        replicationInstanceClass: 'dms.r5.large',
        allocatedStorage: 100,
        vpcSecurityGroupIds: [props.securityGroup.securityGroupId],
        replicationSubnetGroupIdentifier:
          dmsSubnetGroup.replicationSubnetGroupIdentifier,
        publiclyAccessible: false,
        multiAz: false,
        // Remove engineVersion to use the default latest version available in the region
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    this.replicationInstance.addDependency(dmsSubnetGroup);

    // Create source endpoint (on-premises PostgreSQL)
    this.sourceEndpoint = new dms.CfnEndpoint(
      this,
      `source-endpoint-${props.environmentSuffix}`,
      {
        endpointIdentifier: `source-endpoint-${props.environmentSuffix}`,
        endpointType: 'source',
        engineName: 'postgres',
        serverName: props.sourceHost,
        port: props.sourcePort,
        databaseName: props.sourceDatabase,
        username: props.sourceUsername,
        password: props.sourcePassword,
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create target endpoint (Aurora PostgreSQL)
    this.targetEndpoint = new dms.CfnEndpoint(
      this,
      `target-endpoint-${props.environmentSuffix}`,
      {
        endpointIdentifier: `target-endpoint-${props.environmentSuffix}`,
        endpointType: 'target',
        engineName: 'aurora-postgresql',
        serverName: props.targetEndpointHostname,
        port: props.targetEndpointPort,
        databaseName: 'postgres',
        username: props.targetSecret
          .secretValueFromJson('username')
          .unsafeUnwrap(),
        password: props.targetSecret
          .secretValueFromJson('password')
          .unsafeUnwrap(),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create migration task with full load and CDC
    const tableMappings = {
      rules: [
        {
          'rule-type': 'selection',
          'rule-id': '1',
          'rule-name': '1',
          'object-locator': {
            'schema-name': '%',
            'table-name': '%',
          },
          'rule-action': 'include',
        },
      ],
    };

    const taskSettings = {
      Logging: {
        EnableLogging: true,
        LogComponents: [
          {
            Id: 'TRANSFORMATION',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'SOURCE_UNLOAD',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'IO',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'TARGET_LOAD',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'PERFORMANCE',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'SOURCE_CAPTURE',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'SORTER',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'REST_SERVER',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'VALIDATOR_EXT',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
          {
            Id: 'TARGET_APPLY',
            Severity: 'LOGGER_SEVERITY_DEFAULT',
          },
        ],
      },
      ControlTablesSettings: {
        ControlSchema: 'dms_control',
        HistoryTimeslotInMinutes: 5,
        HistoryTableEnabled: true,
        SuspendedTablesTableEnabled: true,
        StatusTableEnabled: true,
      },
      FullLoadSettings: {
        TargetTablePrepMode: 'DROP_AND_CREATE',
        CreatePkAfterFullLoad: false,
        StopTaskCachedChangesApplied: false,
        StopTaskCachedChangesNotApplied: false,
        MaxFullLoadSubTasks: 8,
        TransactionConsistencyTimeout: 600,
        CommitRate: 10000,
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
    };

    this.migrationTask = new dms.CfnReplicationTask(
      this,
      `migration-task-${props.environmentSuffix}`,
      {
        replicationTaskIdentifier: `migration-task-${props.environmentSuffix}`,
        replicationInstanceArn: this.replicationInstance.ref,
        sourceEndpointArn: this.sourceEndpoint.ref,
        targetEndpointArn: this.targetEndpoint.ref,
        migrationType: 'full-load-and-cdc',
        tableMappings: JSON.stringify(tableMappings),
        replicationTaskSettings: JSON.stringify(taskSettings),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Ensure proper dependencies
    this.migrationTask.addDependency(this.replicationInstance);
    this.sourceEndpoint.addDependency(this.replicationInstance);
    this.targetEndpoint.addDependency(this.replicationInstance);

    this.taskArn = this.migrationTask.ref;

    // Tag IAM roles
    cdk.Tags.of(dmsVpcRole).add('Environment', 'production');
    cdk.Tags.of(dmsVpcRole).add('MigrationProject', '2024Q1');
    cdk.Tags.of(dmsCloudWatchRole).add('Environment', 'production');
    cdk.Tags.of(dmsCloudWatchRole).add('MigrationProject', '2024Q1');
  }
}
