import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface RdsComponentArgs {
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  instanceClass: string;
  engineMode?: string;
  backupRetentionDays: number;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class RdsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstance: aws.rds.ClusterInstance;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly masterPassword: random.RandomPassword;
  public readonly endpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:RdsComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // DB Subnet Group
    // RDS subnet group names must be lowercase alphanumeric with hyphens/underscores
    const subnetGroupName = `rds-subnet-group-${args.environmentSuffix.toLowerCase()}`;
    this.subnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${args.environmentSuffix}`,
      {
        name: subnetGroupName,
        subnetIds: args.subnetIds,
        tags: {
          ...args.tags,
          Name: subnetGroupName,
        },
      },
      defaultResourceOptions
    );

    // Generate Master Password
    this.masterPassword = new random.RandomPassword(
      `rds-password-${args.environmentSuffix}`,
      {
        length: 16,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      },
      defaultResourceOptions
    );

    // RDS Aurora Cluster
    const engineMode = args.engineMode || 'provisioned';
    const serverlessV2ScalingConfiguration =
      engineMode === 'provisioned'
        ? {
            maxCapacity: 1.0,
            minCapacity: 0.5,
          }
        : undefined;

    this.cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        engineMode: engineMode,
        databaseName: 'tradingdb',
        masterUsername: 'admin',
        masterPassword: this.masterPassword.result,
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        backupRetentionPeriod: args.backupRetentionDays,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        serverlessv2ScalingConfiguration: serverlessV2ScalingConfiguration,
        storageEncrypted: true,
        tags: {
          ...args.tags,
          Name: `aurora-cluster-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // RDS Cluster Instance
    this.clusterInstance = new aws.rds.ClusterInstance(
      `aurora-instance-${args.environmentSuffix}`,
      {
        clusterIdentifier: this.cluster.id,
        instanceClass: args.instanceClass,
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        publiclyAccessible: false,
        tags: {
          ...args.tags,
          Name: `aurora-instance-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.endpoint = this.cluster.endpoint;

    this.registerOutputs({
      clusterEndpoint: this.endpoint,
      clusterId: this.cluster.id,
    });
  }
}
