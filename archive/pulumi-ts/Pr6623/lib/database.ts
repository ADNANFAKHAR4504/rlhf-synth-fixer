/**
 * database.ts
 *
 * RDS Aurora PostgreSQL cluster with 1 writer and 2 reader instances
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  tags?: { [key: string]: string };
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    // Security Group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpc.id,
        description: 'Security group for RDS Aurora PostgreSQL cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
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
          Name: `payment-rds-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.securityGroupId = rdsSecurityGroup.id;

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.privateSubnetIds,
        tags: {
          Name: `payment-db-subnet-group-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Random password for master user
    const masterPassword = new random.RandomPassword(
      `db-password-${args.environmentSuffix}`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      },
      { parent: this }
    );

    // RDS Aurora PostgreSQL Cluster
    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        clusterIdentifier: `payment-cluster-${args.environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '13.21',
        databaseName: 'paymentdb',
        masterUsername: 'dbadmin',
        masterPassword: masterPassword.result,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        storageEncrypted: true,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        applyImmediately: true,
        tags: {
          Name: `payment-aurora-cluster-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Writer Instance
    const writerInstance = new aws.rds.ClusterInstance(
      `aurora-writer-${args.environmentSuffix}`,
      {
        identifier: `payment-writer-${args.environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '13.21',
        publiclyAccessible: false,
        tags: {
          Name: `payment-writer-${args.environmentSuffix}`,
          Role: 'writer',
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Reader Instance 1
    const reader1 = new aws.rds.ClusterInstance(
      `aurora-reader1-${args.environmentSuffix}`,
      {
        identifier: `payment-reader1-${args.environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '13.21',
        publiclyAccessible: false,
        tags: {
          Name: `payment-reader1-${args.environmentSuffix}`,
          Role: 'reader',
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [writerInstance] }
    );

    // Reader Instance 2
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reader2 = new aws.rds.ClusterInstance(
      `aurora-reader2-${args.environmentSuffix}`,
      {
        identifier: `payment-reader2-${args.environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '13.21',
        publiclyAccessible: false,
        tags: {
          Name: `payment-reader2-${args.environmentSuffix}`,
          Role: 'reader',
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [reader1] }
    );

    this.clusterEndpoint = cluster.endpoint;
    this.clusterId = cluster.id;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      securityGroupId: this.securityGroupId,
      clusterId: this.clusterId,
    });
  }
}
