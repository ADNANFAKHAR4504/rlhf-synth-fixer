import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  databaseSubnetIds: pulumi.Output<string[]>;
  privateSubnetCidrs: pulumi.Output<string[]>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly databaseSecretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const {
      environmentSuffix,
      vpcId,
      databaseSubnetIds,
      privateSubnetCidrs,
      tags,
    } = args;

    // KMS Key for database encryption
    const kmsKey = new aws.kms.Key(
      `payment-db-kms-${environmentSuffix}`,
      {
        description: `KMS key for payment database encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-db-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-db-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // Database Security Group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-db-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for payment database tier',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: privateSubnetCidrs,
            description: 'PostgreSQL access from private subnets',
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-sg-${environmentSuffix}`,
          Tier: 'Database',
        })),
      },
      { parent: this }
    );

    // Database Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: databaseSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Database Credentials in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `payment-db-secret-${environmentSuffix}`,
      {
        name: `payment-db-credentials-${environmentSuffix}`,
        description: 'Database credentials for payment application',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-secret-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const dbPassword = pulumi.secret('PaymentDBPassw0rd!2024');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _dbSecretVersion = new aws.secretsmanager.SecretVersion(
      `payment-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.jsonStringify({
          username: 'paymentadmin',
          password: dbPassword,
          engine: 'postgres',
          host: 'placeholder',
          port: 5432,
          dbname: 'paymentdb',
        }),
      },
      { parent: this }
    );

    // Aurora Serverless v2 Cluster Parameter Group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `payment-cluster-pg-${environmentSuffix}`,
      {
        family: 'aurora-postgresql14',
        description: 'Aurora PostgreSQL 14 cluster parameter group',
        parameters: [
          {
            name: 'rds.force_ssl',
            value: '1',
          },
          {
            name: 'ssl',
            value: '1',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-cluster-pg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Aurora Serverless v2 Cluster
    const cluster = new aws.rds.Cluster(
      `payment-aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-aurora-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '14.11',
        databaseName: 'paymentdb',
        masterUsername: 'paymentadmin',
        masterPassword: dbPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbClusterParameterGroupName: clusterParameterGroup.name,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 2,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-aurora-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Aurora Serverless v2 Instance
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _clusterInstance = new aws.rds.ClusterInstance(
      `payment-aurora-instance-${environmentSuffix}`,
      {
        clusterIdentifier: cluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '14.11',
        publiclyAccessible: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-aurora-instance-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Update secret with actual endpoint
    cluster.endpoint.apply(endpoint => {
      new aws.secretsmanager.SecretVersion(
        `payment-db-secret-version-updated-${environmentSuffix}`,
        {
          secretId: dbSecret.id,
          secretString: pulumi.jsonStringify({
            username: 'paymentadmin',
            password: dbPassword,
            engine: 'postgres',
            host: endpoint,
            port: 5432,
            dbname: 'paymentdb',
          }),
        },
        { parent: this, deleteBeforeReplace: true }
      );
    });

    // Outputs
    this.clusterEndpoint = cluster.endpoint;
    this.clusterArn = cluster.arn;
    this.clusterId = cluster.id;
    this.databaseSecretArn = dbSecret.arn;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterArn: this.clusterArn,
      databaseSecretArn: this.databaseSecretArn,
    });
  }
}
