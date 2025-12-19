/**
 * Database Stack - RDS Aurora PostgreSQL Cluster
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  availabilityZones: string[];
  tags: { [key: string]: string };
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly readerEndpoint: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:DatabaseStack', name, {}, opts);

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for RDS Aurora PostgreSQL cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'], // Allow from VPC
            description: 'PostgreSQL access from VPC',
          },
        ],
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
          ...args.tags,
          Name: `rds-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.securityGroupId = rdsSecurityGroup.id;

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.privateSubnetIds,
        tags: {
          ...args.tags,
          Name: `db-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key for encryption at rest
    const kmsKey = new aws.kms.Key(
      `rds-kms-${args.environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${args.environmentSuffix}`,
        deletionWindowInDays: 7,
        tags: {
          ...args.tags,
          Name: `rds-kms-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `rds-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/rds-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create Aurora PostgreSQL cluster
    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${args.environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '16.4',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123!'), // In production, use Secrets Manager
        databaseName: 'paymentdb',
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true, // Required for destroyability
        deletionProtection: false, // Required for destroyability
        applyImmediately: true,
        tags: {
          ...args.tags,
          Name: `aurora-cluster-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.clusterEndpoint = cluster.endpoint;
    this.readerEndpoint = cluster.readerEndpoint;
    this.clusterId = cluster.clusterIdentifier;

    // Create cluster instances: 1 writer + 2 readers
    const instanceClass = 'db.t3.medium'; // Cost-effective for testing

    // Writer instance
    new aws.rds.ClusterInstance(
      `aurora-instance-writer-${args.environmentSuffix}`,
      {
        clusterIdentifier: cluster.id,
        instanceClass: instanceClass,
        engine: 'aurora-postgresql',
        engineVersion: '16.4',
        publiclyAccessible: false,
        identifier: `aurora-instance-writer-${args.environmentSuffix}`,
        tags: {
          ...args.tags,
          Name: `aurora-instance-writer-${args.environmentSuffix}`,
          Role: 'writer',
        },
      },
      { parent: this }
    );

    // Reader instances
    for (let i = 1; i <= 2; i++) {
      new aws.rds.ClusterInstance(
        `aurora-instance-reader-${i}-${args.environmentSuffix}`,
        {
          clusterIdentifier: cluster.id,
          instanceClass: instanceClass,
          engine: 'aurora-postgresql',
          engineVersion: '16.4',
          publiclyAccessible: false,
          identifier: `aurora-instance-reader-${i}-${args.environmentSuffix}`,
          tags: {
            ...args.tags,
            Name: `aurora-instance-reader-${i}-${args.environmentSuffix}`,
            Role: 'reader',
          },
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      readerEndpoint: this.readerEndpoint,
      clusterId: this.clusterId,
      securityGroupId: this.securityGroupId,
    });
  }
}
