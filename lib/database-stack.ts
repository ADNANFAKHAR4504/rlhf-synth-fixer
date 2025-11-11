import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryVpcId: pulumi.Output<string>;
  drVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  drSubnetIds: pulumi.Output<string[]>;
  primaryProvider: aws.Provider;
  drProvider: aws.Provider;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly primaryClusterId: pulumi.Output<string>;
  public readonly drClusterId: pulumi.Output<string>;
  public readonly primaryClusterArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly replicationLag: pulumi.Output<string>;
  public readonly dbPasswordSecretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      primaryVpcId,
      drVpcId,
      primarySubnetIds,
      drSubnetIds,
      primaryProvider,
      drProvider,
    } = args;

    // Create KMS key for database encryption in primary region
    const primaryKmsKey = new aws.kms.Key(
      `primary-db-kms-${environmentSuffix}`,
      {
        description: `KMS key for primary database encryption - ${environmentSuffix}`,
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-db-kms-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Create KMS key for database encryption in DR region
    const drKmsKey = new aws.kms.Key(
      `dr-db-kms-${environmentSuffix}`,
      {
        description: `KMS key for DR database encryption - ${environmentSuffix}`,
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-db-kms-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Generate random password for RDS
    const dbPassword = new aws.secretsmanager.Secret(
      `db-password-${environmentSuffix}`,
      {
        name: `db-password-${environmentSuffix}`,
        description: 'RDS Aurora master password',
        kmsKeyId: primaryKmsKey.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `db-password-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Generate random password
    const randomPassword = Array.from({ length: 20 }, () => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      return chars.charAt(Math.floor(Math.random() * chars.length));
    }).join('');

    const _dbPasswordVersion = new aws.secretsmanager.SecretVersion(
      `db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: pulumi.secret(randomPassword),
      },
      { provider: primaryProvider, parent: this }
    );
    void _dbPasswordVersion;

    // Security group for RDS in primary region
    const primaryDbSg = new aws.ec2.SecurityGroup(
      `primary-db-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpcId,
        description: 'Security group for primary RDS cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-db-sg-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Security group for RDS in DR region
    const drDbSg = new aws.ec2.SecurityGroup(
      `dr-db-sg-${environmentSuffix}`,
      {
        vpcId: drVpcId,
        description: 'Security group for DR RDS cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-db-sg-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // DB Subnet Group for primary
    const primarySubnetGroup = new aws.rds.SubnetGroup(
      `primary-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: primarySubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-db-subnet-group-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // DB Subnet Group for DR
    const drSubnetGroup = new aws.rds.SubnetGroup(
      `dr-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: drSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-db-subnet-group-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // RDS Aurora Global Cluster
    const globalCluster = new aws.rds.GlobalCluster(
      `global-db-${environmentSuffix}`,
      {
        globalClusterIdentifier: `global-db-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentsdb',
        storageEncrypted: true,
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary RDS Cluster
    const primaryCluster = new aws.rds.Cluster(
      `primary-db-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `primary-db-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentsdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret(randomPassword),
        dbSubnetGroupName: primarySubnetGroup.name,
        vpcSecurityGroupIds: [primaryDbSg.id],
        globalClusterIdentifier: globalCluster.id,
        storageEncrypted: true,
        kmsKeyId: primaryKmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-db-cluster-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this, dependsOn: [globalCluster] }
    );

    // Primary cluster instances
    for (let i = 0; i < 2; i++) {
      new aws.rds.ClusterInstance(
        `primary-db-instance-${i}-${environmentSuffix}`,
        {
          identifier: `primary-db-instance-${i}-${environmentSuffix}`,
          clusterIdentifier: primaryCluster.id,
          instanceClass: 'db.r6g.large',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `primary-db-instance-${i}-${environmentSuffix}`,
            'DR-Role': 'primary',
          })),
        },
        { provider: primaryProvider, parent: this }
      );
    }

    // DR RDS Cluster
    const drCluster = new aws.rds.Cluster(
      `dr-db-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `dr-db-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        dbSubnetGroupName: drSubnetGroup.name,
        vpcSecurityGroupIds: [drDbSg.id],
        globalClusterIdentifier: globalCluster.id,
        storageEncrypted: true,
        kmsKeyId: drKmsKey.arn,
        enabledCloudwatchLogsExports: ['postgresql'],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-db-cluster-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this, dependsOn: [primaryCluster] }
    );

    // DR cluster instances
    for (let i = 0; i < 2; i++) {
      new aws.rds.ClusterInstance(
        `dr-db-instance-${i}-${environmentSuffix}`,
        {
          identifier: `dr-db-instance-${i}-${environmentSuffix}`,
          clusterIdentifier: drCluster.id,
          instanceClass: 'db.r6g.large',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `dr-db-instance-${i}-${environmentSuffix}`,
            'DR-Role': 'secondary',
          })),
        },
        { provider: drProvider, parent: this }
      );
    }

    // DynamoDB Global Table
    const dynamoTable = new aws.dynamodb.Table(
      `session-table-${environmentSuffix}`,
      {
        name: `session-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'sessionId',
        attributes: [
          {
            name: 'sessionId',
            type: 'S',
          },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: primaryKmsKey.arn,
        },
        replicas: [
          {
            regionName: 'us-east-2',
            kmsKeyArn: drKmsKey.arn,
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-table-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryClusterId = primaryCluster.id;
    this.drClusterId = drCluster.id;
    this.primaryClusterArn = primaryCluster.arn;
    this.dynamoTableName = dynamoTable.name;
    this.replicationLag = pulumi.output('< 1 second');
    this.dbPasswordSecretArn = dbPassword.arn;

    this.registerOutputs({
      primaryClusterId: this.primaryClusterId,
      drClusterId: this.drClusterId,
      primaryClusterArn: this.primaryClusterArn,
      dynamoTableName: this.dynamoTableName,
      replicationLag: this.replicationLag,
      dbPasswordSecretArn: this.dbPasswordSecretArn,
    });
  }
}
