/**
 * database-stack.ts
 *
 * RDS Aurora PostgreSQL cluster with multi-AZ read replicas.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterIdentifier: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly readerEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, vpc, privateSubnetIds, tags } = args;

    // Security Group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [vpc.cidrBlock],
            description: 'Allow PostgreSQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `db-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `rds-kms-${environmentSuffix}`,
      {
        description: `RDS encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          Name: `rds-kms-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/rds-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // DB Cluster Parameter Group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `db-cluster-pg-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        description: `Cluster parameter group for ${environmentSuffix}`,
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
        ],
        tags: {
          Name: `db-cluster-pg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // RDS Aurora Cluster
    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        databaseName: 'payments',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123456!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbClusterParameterGroupName: clusterParameterGroup.name,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        applyImmediately: true,
        tags: {
          Name: `aurora-cluster-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Primary Writer Instance
    const writerInstance = new aws.rds.ClusterInstance(
      `aurora-writer-${environmentSuffix}`,
      {
        identifier: `aurora-writer-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[0],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-writer-${environmentSuffix}`,
          Role: 'writer',
          ...tags,
        },
      },
      { parent: this }
    );

    // Read Replica 1
    const readerInstance1 = new aws.rds.ClusterInstance(
      `aurora-reader-1-${environmentSuffix}`,
      {
        identifier: `aurora-reader-1-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[1],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-reader-1-${environmentSuffix}`,
          Role: 'reader',
          ...tags,
        },
      },
      { parent: this, dependsOn: [writerInstance] }
    );

    // Read Replica 2
    new aws.rds.ClusterInstance(
      `aurora-reader-2-${environmentSuffix}`,
      {
        identifier: `aurora-reader-2-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[2],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-reader-2-${environmentSuffix}`,
          Role: 'reader',
          ...tags,
        },
      },
      { parent: this, dependsOn: [readerInstance1] }
    );

    // Export values
    this.clusterIdentifier = cluster.clusterIdentifier;
    this.clusterEndpoint = cluster.endpoint;
    this.readerEndpoint = cluster.readerEndpoint;

    this.registerOutputs({
      clusterIdentifier: this.clusterIdentifier,
      clusterEndpoint: this.clusterEndpoint,
      readerEndpoint: this.readerEndpoint,
    });
  }
}
