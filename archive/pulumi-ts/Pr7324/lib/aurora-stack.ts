/**
 * aurora-stack.ts
 *
 * Defines Aurora Serverless v2 PostgreSQL cluster for a single region.
 * Uses regional cluster with automatic backups for disaster recovery.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AuroraStackArgs {
  region: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AuroraStack extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstance: aws.rds.ClusterInstance;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterReaderEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: AuroraStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:aurora:AuroraStack', name, args, opts);

    const region = args.region;
    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create DB subnet group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `${name}-subnet-group`,
      {
        subnetIds: args.privateSubnetIds,
        tags: {
          ...tags,
          Name: `${name}-subnet-group-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Generate random password for master user
    // AWS RDS doesn't allow: '/', '@', '"', ' ' in passwords
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const allowedChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-.:<=>?[]^_`{|}~';
    let masterPasswordString = '';
    const bytes = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) {
      masterPasswordString += allowedChars[bytes[i] % allowedChars.length];
    }

    // Create Aurora Serverless v2 cluster
    this.cluster = new aws.rds.Cluster(
      `${name}-cluster`,
      {
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '17.4',
        databaseName: 'drapp',
        masterUsername: 'dbadmin',
        masterPassword: masterPasswordString,
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql'],
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 1,
        },
        tags: {
          ...tags,
          Name: `${name}-aurora-cluster-${envSuffix}-e7`,
          Region: region,
          Purpose: 'multi-region-dr',
        },
      },
      { parent: this }
    );

    // Create cluster instance
    this.clusterInstance = new aws.rds.ClusterInstance(
      `${name}-cluster-instance`,
      {
        identifier: `${name}-instance-${envSuffix}-e7`,
        clusterIdentifier: this.cluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '17.4',
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `${name}-aurora-instance-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    this.clusterEndpoint = this.cluster.endpoint;
    this.clusterReaderEndpoint = this.cluster.readerEndpoint;

    this.registerOutputs({
      clusterEndpoint: this.cluster.endpoint,
      clusterReaderEndpoint: this.cluster.readerEndpoint,
      clusterIdentifier: this.cluster.id,
    });
  }
}
