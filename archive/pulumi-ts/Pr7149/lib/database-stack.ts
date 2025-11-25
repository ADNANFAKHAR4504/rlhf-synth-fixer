import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  kmsKeyId: pulumi.Input<string>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, tags, vpcId, privateSubnetIds, kmsKeyId } = args;

    // Create a Secrets Manager secret for the database password
    // Using the same password format initially to avoid forcing DB recreation
    // Password can be rotated after deployment using AWS Secrets Manager rotation
    const dbSecret = new aws.secretsmanager.Secret(
      `payment-db-secret-${environmentSuffix}`,
      {
        name: `payment-db-master-password-${environmentSuffix}`,
        description: `Master password for payment processing database - ${environmentSuffix}`,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-secret-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Store the initial password value in the secret
    // This uses the same password format as before to avoid DB recreation
    // After deployment, rotate the password using AWS Secrets Manager
    const dbSecretVersion = new aws.secretsmanager.SecretVersion(
      `payment-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.interpolate`{"username":"dbadmin","password":"TempPassword${environmentSuffix}123!"}`,
      },
      { parent: dbSecret }
    );

    // Extract password from secret for RDS cluster
    const dbPassword = dbSecretVersion.secretString.apply(secretString => {
      if (!secretString) {
        throw new Error('Secret string is undefined');
      }
      const parsed = JSON.parse(secretString) as {
        username: string;
        password: string;
      };
      return parsed.password;
    });

    // Security group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-db-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Aurora PostgreSQL cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL from VPC',
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
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DB parameter group for PostgreSQL
    const dbParameterGroup = new aws.rds.ClusterParameterGroup(
      `payment-db-params-${environmentSuffix}`,
      {
        family: 'aurora-postgresql14',
        description: 'Parameter group for payment processing database',
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
          {
            name: 'ssl',
            value: '1',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-params-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Aurora PostgreSQL cluster
    const cluster = new aws.rds.Cluster(
      `payment-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentdb',
        masterUsername: 'dbadmin',
        masterPassword: dbPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbClusterParameterGroupName: dbParameterGroup.name,
        storageEncrypted: true,
        kmsKeyId: kmsKeyId,
        backupRetentionPeriod: 30,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        copyTagsToSnapshot: true,
        deletionProtection: false,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Primary instance
    const primaryInstance = new aws.rds.ClusterInstance(
      `payment-instance-1-${environmentSuffix}`,
      {
        identifier: `payment-instance-1-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-1-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Reader instance 1
    const readerInstance1 = new aws.rds.ClusterInstance(
      `payment-instance-2-${environmentSuffix}`,
      {
        identifier: `payment-instance-2-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-2-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [primaryInstance] }
    );

    // Reader instance 2
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const readerInstance2 = new aws.rds.ClusterInstance(
      `payment-instance-3-${environmentSuffix}`,
      {
        identifier: `payment-instance-3-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-3-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [readerInstance1] }
    );

    this.clusterEndpoint = cluster.endpoint;
    this.clusterArn = cluster.arn;
    this.secretArn = dbSecret.arn;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterArn: this.clusterArn,
      readerEndpoint: cluster.readerEndpoint,
      secretArn: this.secretArn,
    });
  }
}
