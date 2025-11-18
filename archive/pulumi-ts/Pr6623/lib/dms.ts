/**
 * dms.ts
 *
 * AWS Database Migration Service for PostgreSQL to Aurora migration
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

export interface DmsStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  sourceDbEndpoint: pulumi.Output<string>;
  targetDbEndpoint: pulumi.Output<string>;
  targetDbSecurityGroupId: pulumi.Output<string>;
  dmsRoleArn: pulumi.Output<string>;
  tags?: { [key: string]: string };
}

export class DmsStack extends pulumi.ComponentResource {
  public readonly replicationTaskArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DmsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dms:DmsStack', name, args, opts);

    // Security Group for DMS
    const dmsSecurityGroup = new aws.ec2.SecurityGroup(
      `dms-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpc.id,
        description: 'Security group for DMS replication instance',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `payment-dms-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Allow DMS to access RDS
    new aws.ec2.SecurityGroupRule(
      `dms-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: dmsSecurityGroup.id,
        securityGroupId: args.targetDbSecurityGroupId,
        description: 'Allow DMS to access target RDS',
      },
      { parent: this }
    );

    // DMS Subnet Group
    const dmsSubnetGroup = new aws.dms.ReplicationSubnetGroup(
      `dms-subnet-group-${args.environmentSuffix}`,
      {
        replicationSubnetGroupId: `payment-dms-subnet-${args.environmentSuffix}`,
        replicationSubnetGroupDescription:
          'Subnet group for DMS replication instance',
        subnetIds: args.privateSubnetIds,
        tags: {
          Name: `payment-dms-subnet-group-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Random password for database
    // Note: AWS DMS does not support these special characters: ; + % :
    const dbPassword = new random.RandomPassword(
      `dms-db-password-${args.environmentSuffix}`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$&*()-_=[]{}<>?',
      },
      { parent: this }
    );

    // DMS Replication Instance
    const replicationInstance = new aws.dms.ReplicationInstance(
      `dms-instance-${args.environmentSuffix}`,
      {
        replicationInstanceId: `payment-dms-${args.environmentSuffix}`,
        replicationInstanceClass: 'dms.t3.medium',
        allocatedStorage: 100,
        vpcSecurityGroupIds: [dmsSecurityGroup.id],
        replicationSubnetGroupId: dmsSubnetGroup.id,
        publiclyAccessible: false,
        engineVersion: '3.6.1',
        tags: {
          Name: `payment-dms-instance-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Source Endpoint (on-premises mock)
    const sourceEndpoint = new aws.dms.Endpoint(
      `dms-source-endpoint-${args.environmentSuffix}`,
      {
        endpointId: `payment-source-${args.environmentSuffix}`,
        endpointType: 'source',
        engineName: 'postgres',
        serverName: args.sourceDbEndpoint,
        port: 5432,
        databaseName: 'paymentdb',
        username: 'sourceadmin',
        password: dbPassword.result,
        tags: {
          Name: `payment-source-endpoint-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Target Endpoint (Aurora)
    const targetEndpoint = new aws.dms.Endpoint(
      `dms-target-endpoint-${args.environmentSuffix}`,
      {
        endpointId: `payment-target-${args.environmentSuffix}`,
        endpointType: 'target',
        engineName: 'aurora-postgresql',
        serverName: args.targetDbEndpoint,
        port: 5432,
        databaseName: 'paymentdb',
        username: 'dbadmin',
        password: dbPassword.result,
        tags: {
          Name: `payment-target-endpoint-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Replication Task with CDC
    const replicationTask = new aws.dms.ReplicationTask(
      `dms-task-${args.environmentSuffix}`,
      {
        replicationTaskId: `payment-migration-${args.environmentSuffix}`,
        migrationType: 'full-load-and-cdc',
        replicationInstanceArn: replicationInstance.replicationInstanceArn,
        sourceEndpointArn: sourceEndpoint.endpointArn,
        targetEndpointArn: targetEndpoint.endpointArn,
        tableMappings: JSON.stringify({
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': 'include-all',
              'object-locator': {
                'schema-name': 'public',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        }),
        replicationTaskSettings: JSON.stringify({
          TargetMetadata: {
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
          },
          FullLoadSettings: {
            TargetTablePrepMode: 'DROP_AND_CREATE',
          },
          Logging: {
            EnableLogging: true,
            LogComponents: [
              {
                Id: 'SOURCE_CAPTURE',
                Severity: 'LOGGER_SEVERITY_INFO',
              },
              {
                Id: 'TARGET_APPLY',
                Severity: 'LOGGER_SEVERITY_INFO',
              },
            ],
          },
          ChangeProcessingTuning: {
            BatchApplyTimeoutMin: 1,
            BatchApplyTimeoutMax: 30,
          },
        }),
        tags: {
          Name: `payment-replication-task-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.replicationTaskArn = replicationTask.replicationTaskArn;

    this.registerOutputs({
      replicationTaskArn: this.replicationTaskArn,
    });
  }
}
