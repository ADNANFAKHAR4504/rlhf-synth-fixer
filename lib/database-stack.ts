import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, tags, vpcId, privateSubnetIds, kmsKeyId } = args;

    // For production, use AWS Secrets Manager to store the password
    // For testing/demo purposes, we use a simple password
    // NOTE: This should be replaced with proper secret management in production
    const dbPassword = `TempPassword${environmentSuffix}123!`;

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

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterArn: this.clusterArn,
      readerEndpoint: cluster.readerEndpoint,
    });
  }
}
