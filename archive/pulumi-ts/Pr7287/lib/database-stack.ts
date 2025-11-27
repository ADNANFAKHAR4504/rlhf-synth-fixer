/**
 * database-stack.ts
 *
 * Creates RDS Aurora PostgreSQL Serverless v2 cluster with KMS encryption,
 * automatic rotation, and 30-day backup retention.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  vpcSecurityGroupId: pulumi.Input<string>;
  logGroupName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterId: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, privateSubnetIds, vpcSecurityGroupId, tags } =
      args;

    // Create KMS key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `financial-db-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `financial-db-kms-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    new aws.kms.Alias(
      `financial-db-kms-alias-${environmentSuffix}`,
      {
        name: `alias/financial-db-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `financial-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: {
          ...tags,
          Name: `financial-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB cluster parameter group
    const dbClusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `financial-db-cluster-pg-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        description: `Cluster parameter group for financial DB - ${environmentSuffix}`,
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
          ...tags,
          Name: `financial-db-cluster-pg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora PostgreSQL Serverless v2 cluster
    const dbCluster = new aws.rds.Cluster(
      `financial-db-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `financial-db-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '15.8',
        databaseName: 'financialdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123!Temp'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [vpcSecurityGroupId],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 30,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: false,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql'],
        dbClusterParameterGroupName: dbClusterParameterGroup.name,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 1,
        },
        tags: {
          ...tags,
          Name: `financial-db-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora Serverless v2 instance
    new aws.rds.ClusterInstance(
      `financial-db-instance-${environmentSuffix}`,
      {
        identifier: `financial-db-instance-${environmentSuffix}`,
        clusterIdentifier: dbCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `financial-db-instance-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.clusterId = dbCluster.id;
    this.clusterEndpoint = dbCluster.endpoint;
    this.kmsKeyId = kmsKey.id;

    this.registerOutputs({
      clusterId: this.clusterId,
      clusterEndpoint: this.clusterEndpoint,
      kmsKeyId: this.kmsKeyId,
    });
  }
}
