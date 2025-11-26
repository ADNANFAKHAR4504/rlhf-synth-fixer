import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { DatabaseConfig } from './types';

export class DatabaseComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstances: aws.rds.ClusterInstance[];
  public readonly subnetGroup: aws.rds.SubnetGroup;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      globalClusterId?: pulumi.Output<string>;
      subnetIds: pulumi.Output<string>[];
      securityGroupIds: pulumi.Output<string>[];
      config: DatabaseConfig;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:DatabaseComponent', name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.region}-${args.environmentSuffix}`,
      Region: args.region,
      'DR-Role': args.isPrimary ? 'primary' : 'secondary',
    };

    // Create DB Subnet Group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `${name}-subnet-group`,
      {
        subnetIds: args.subnetIds,
        tags: {
          ...tags,
          Name: `db-subnet-group-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora Cluster
    if (args.isPrimary) {
      this.cluster = new aws.rds.Cluster(
        `${name}-cluster`,
        {
          clusterIdentifier: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          engine: args.config.engine,
          engineVersion: args.config.engineVersion,
          databaseName: 'healthcare',
          masterUsername: 'dbadmin',
          masterPassword: pulumi.secret('ChangeMe123456!'),
          dbSubnetGroupName: this.subnetGroup.name,
          vpcSecurityGroupIds: args.securityGroupIds,
          skipFinalSnapshot: args.config.skipFinalSnapshot,
          deletionProtection: args.config.deletionProtection,
          backupRetentionPeriod: 7,
          preferredBackupWindow: '03:00-04:00',
          globalClusterIdentifier: args.globalClusterId,
          tags: {
            ...tags,
            Name: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    } else {
      this.cluster = new aws.rds.Cluster(
        `${name}-cluster`,
        {
          clusterIdentifier: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          engine: args.config.engine,
          engineVersion: args.config.engineVersion,
          dbSubnetGroupName: this.subnetGroup.name,
          vpcSecurityGroupIds: args.securityGroupIds,
          skipFinalSnapshot: args.config.skipFinalSnapshot,
          deletionProtection: args.config.deletionProtection,
          globalClusterIdentifier: args.globalClusterId,
          tags: {
            ...tags,
            Name: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: opts?.dependsOn }
      );
    }

    // Create Cluster Instances (1 per region for cost optimization)
    this.clusterInstances = [];
    const instanceCount = 1;
    for (let i = 0; i < instanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `${name}-instance-${i}`,
        {
          identifier: `aurora-instance-${args.region}-${i}-${args.environmentSuffix}`,
          clusterIdentifier: this.cluster.id,
          instanceClass: args.config.instanceClass,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          engine: args.config.engine as any,
          engineVersion: args.config.engineVersion,
          publiclyAccessible: false,
          tags: {
            ...tags,
            Name: `aurora-instance-${args.region}-${i}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [this.cluster] }
      );
      this.clusterInstances.push(instance);
    }

    this.registerOutputs({
      clusterId: this.cluster.id,
      clusterEndpoint: this.cluster.endpoint,
      clusterReaderEndpoint: this.cluster.readerEndpoint,
    });
  }
}
