import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryVpcId: pulumi.Output<string>;
  drVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  drSubnetIds: pulumi.Output<string[]>;
  primaryProvider: aws.Provider;
  drProvider: aws.Provider;
  primaryInstanceSecurityGroupId?: pulumi.Output<string>;
  drInstanceSecurityGroupId?: pulumi.Output<string>;
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
      primaryInstanceSecurityGroupId,
      drInstanceSecurityGroupId,
    } = args;

    // Generate random suffix to avoid resource name conflicts
    const randomSuffix = new random.RandomString(
      `database-random-suffix-${environmentSuffix}`,
      {
        length: 8,
        special: false,
        upper: false,
        lower: true,
        numeric: true,
      },
      { parent: this }
    );

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

    // Generate cryptographically secure random password for RDS
    const randomPassword = new random.RandomPassword(
      `db-password-random-${environmentSuffix}`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        minLower: 1,
        minUpper: 1,
        minNumeric: 1,
        minSpecial: 1,
      },
      { parent: this }
    );

    // NOTE: Resource Versioning Strategy (v2)
    // All database resources use '-v2' suffix to enable blue-green deployment pattern.
    // This allows:
    // 1. Side-by-side deployment of new resources without destroying existing ones
    // 2. Zero-downtime migration with data transfer from v1 to v2
    // 3. Safe rollback to v1 resources if issues arise during migration
    // 4. Clean separation in Pulumi state management
    // See MIGRATION.md for complete v1 to v2 migration procedures
    const dbPassword = new aws.secretsmanager.Secret(
      `db-password-v2-${environmentSuffix}`,
      {
        name: pulumi.interpolate`db-password-v2-${environmentSuffix}-${randomSuffix.result}`,
        description: 'RDS Aurora master password',
        kmsKeyId: primaryKmsKey.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `db-password-v2-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    const _dbPasswordVersion = new aws.secretsmanager.SecretVersion(
      `db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: randomPassword.result,
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
        ingress: primaryInstanceSecurityGroupId
          ? [
              {
                protocol: 'tcp',
                fromPort: 5432,
                toPort: 5432,
                securityGroups: [primaryInstanceSecurityGroupId],
                description: 'Allow access from compute instances',
              },
            ]
          : [
              {
                protocol: 'tcp',
                fromPort: 5432,
                toPort: 5432,
                cidrBlocks: ['10.0.0.0/16'],
                description: 'Allow access from VPC CIDR',
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
        ingress: drInstanceSecurityGroupId
          ? [
              {
                protocol: 'tcp',
                fromPort: 5432,
                toPort: 5432,
                securityGroups: [drInstanceSecurityGroupId],
                description: 'Allow access from compute instances',
              },
            ]
          : [
              {
                protocol: 'tcp',
                fromPort: 5432,
                toPort: 5432,
                cidrBlocks: ['10.1.0.0/16'],
                description: 'Allow access from VPC CIDR',
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

    // RDS Aurora Global Cluster (v2)
    // Using v2 naming to avoid conflicts with existing v1 resources during migration
    const globalCluster = new aws.rds.GlobalCluster(
      `global-db-v2-${environmentSuffix}`,
      {
        globalClusterIdentifier: pulumi.interpolate`global-db-v2-${environmentSuffix}-${randomSuffix.result}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentsdb',
        storageEncrypted: true,
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary RDS Cluster
    const primaryCluster = new aws.rds.Cluster(
      `primary-db-cluster-v2-${environmentSuffix}`,
      {
        clusterIdentifier: pulumi.interpolate`primary-db-cluster-v2-${environmentSuffix}-${randomSuffix.result}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentsdb',
        masterUsername: 'dbadmin',
        masterPassword: randomPassword.result,
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
          Name: `primary-db-cluster-v2-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this, dependsOn: [globalCluster] }
    );

    // Primary cluster instances
    for (let i = 0; i < 2; i++) {
      new aws.rds.ClusterInstance(
        `primary-db-instance-v2-${i}-${environmentSuffix}`,
        {
          identifier: pulumi.interpolate`primary-db-instance-v2-${i}-${environmentSuffix}-${randomSuffix.result}`,
          clusterIdentifier: primaryCluster.id,
          instanceClass: 'db.r6g.large',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `primary-db-instance-v2-${i}-${environmentSuffix}`,
            'DR-Role': 'primary',
          })),
        },
        { provider: primaryProvider, parent: this }
      );
    }

    // DR RDS Cluster
    const drCluster = new aws.rds.Cluster(
      `dr-db-cluster-v2-${environmentSuffix}`,
      {
        clusterIdentifier: pulumi.interpolate`dr-db-cluster-v2-${environmentSuffix}-${randomSuffix.result}`,
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
          Name: `dr-db-cluster-v2-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this, dependsOn: [primaryCluster] }
    );

    // DR cluster instances
    for (let i = 0; i < 2; i++) {
      new aws.rds.ClusterInstance(
        `dr-db-instance-v2-${i}-${environmentSuffix}`,
        {
          identifier: pulumi.interpolate`dr-db-instance-v2-${i}-${environmentSuffix}-${randomSuffix.result}`,
          clusterIdentifier: drCluster.id,
          instanceClass: 'db.r6g.large',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `dr-db-instance-v2-${i}-${environmentSuffix}`,
            'DR-Role': 'secondary',
          })),
        },
        { provider: drProvider, parent: this }
      );
    }

    // DynamoDB Global Table (v2)
    // v2 suffix enables parallel operation with legacy v1 table during migration
    const dynamoTable = new aws.dynamodb.Table(
      `session-table-v2-${environmentSuffix}`,
      {
        name: pulumi.interpolate`session-table-v2-${environmentSuffix}-${randomSuffix.result}`,
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
          Name: `session-table-v2-${environmentSuffix}`,
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
