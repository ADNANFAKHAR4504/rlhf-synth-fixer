import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsComponentArgs {
  environmentSuffix: string;
  privateSubnetIds: pulumi.Input<string>[];
  rdsSecurityGroupId: pulumi.Input<string>;
  dbInstanceCount: number;
  backupRetentionDays: number;
  instanceClass?: string;
}

export class RdsComponent extends pulumi.ComponentResource {
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstances: aws.rds.ClusterInstance[];
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterReaderEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:RdsComponent', name, {}, opts);

    // Create DB Subnet Group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        name: `db-subnet-group-${args.environmentSuffix.toLowerCase()}`,
        subnetIds: args.privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create RDS Aurora Cluster
    this.cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${args.environmentSuffix.toLowerCase()}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '14.6',
        databaseName: 'tradingdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123!'),
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [args.rdsSecurityGroupId],
        backupRetentionPeriod: args.backupRetentionDays,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        storageEncrypted: true,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: {
          Name: `aurora-cluster-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Cluster Instances
    this.clusterInstances = [];
    for (let i = 0; i < args.dbInstanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `aurora-instance-${i}-${args.environmentSuffix}`,
        {
          identifier: `aurora-instance-${i}-${args.environmentSuffix.toLowerCase()}`,
          clusterIdentifier: this.cluster.id,
          instanceClass: args.instanceClass || 'db.t3.medium',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: {
            Name: `aurora-instance-${i}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
          },
        },
        { parent: this }
      );
      this.clusterInstances.push(instance);
    }

    this.clusterEndpoint = this.cluster.endpoint;
    this.clusterReaderEndpoint = this.cluster.readerEndpoint;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterReaderEndpoint: this.clusterReaderEndpoint,
      clusterArn: this.cluster.arn,
    });
  }
}
