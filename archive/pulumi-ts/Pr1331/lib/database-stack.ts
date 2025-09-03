import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DatabaseStackArgs {
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  dbSecurityGroupId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly dbSubnetGroup: aws.rds.SubnetGroup;
  public readonly dbCluster: aws.rds.Cluster;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:database:DatabaseStack', name, args, opts);

    // DB Subnet Group
    this.dbSubnetGroup = new aws.rds.SubnetGroup(
      `${name}-db-subnet-group`,
      {
        subnetIds: args.privateSubnetIds,
        tags: {
          ...args.tags,
          Name: `${name}-db-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Aurora Serverless v2 PostgreSQL Cluster
    this.dbCluster = new aws.rds.Cluster(
      `${name}-db-cluster`,
      {
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '16.4',
        databaseName: 'webapp',
        masterUsername: 'postgres',
        masterPassword: 'changeme123!', // In production, use AWS Secrets Manager
        dbSubnetGroupName: this.dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.dbSecurityGroupId],
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        serverlessv2ScalingConfiguration: {
          maxCapacity: 2,
          minCapacity: 0.5,
        },
        tags: {
          ...args.tags,
          Name: `${name}-db-cluster-${args.environmentSuffix}`,
        },
        skipFinalSnapshot: true, // Ensure resource can be deleted
        finalSnapshotIdentifier: undefined, // No final snapshot on deletion
      },
      { parent: this }
    );

    // Aurora Serverless v2 Instance
    new aws.rds.ClusterInstance(
      `${name}-db-instance`,
      {
        identifier: `${name}-db-instance-${args.environmentSuffix}`,
        clusterIdentifier: this.dbCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql' as aws.types.enums.rds.EngineType,
        engineVersion: '16.4',
        tags: {
          ...args.tags,
          Name: `${name}-db-instance-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      dbEndpoint: this.dbCluster.endpoint,
      dbPort: this.dbCluster.port,
    });
  }
}
