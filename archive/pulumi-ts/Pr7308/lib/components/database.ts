/**
 * database.ts
 *
 * Aurora PostgreSQL database component with customer-managed KMS encryption
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseComponentArgs {
  environmentSuffix: string;
  environment: string;
  instanceClass: string;
  engineVersion: string;
  kmsKeyId: pulumi.Input<string>;
  masterSecretArn: pulumi.Input<string>;
  subnetIds: pulumi.Input<string[]>;
  vpcId: pulumi.Input<string>;
  availabilityZones: pulumi.Input<string[]>;
  backupRetentionDays: number;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseComponent extends pulumi.ComponentResource {
  public readonly endpoint: pulumi.Output<string>;
  public readonly clusterIdentifier: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:Database', name, args, opts);

    const {
      environmentSuffix,
      environment,
      instanceClass,
      engineVersion,
      kmsKeyId,
      subnetIds,
      vpcId,
      backupRetentionDays,
      tags,
    } = args;

    // Create DB subnet group
    const subnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-${environmentSuffix}`,
      {
        subnetIds: subnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `db-subnet-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create security group for database
    const securityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for Aurora database ${environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/8'], // Internal VPC only
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `db-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create DB cluster parameter group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `db-cluster-params-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        description: `Aurora PostgreSQL 15 cluster parameters for ${environment}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Create Aurora PostgreSQL cluster
    // Note: We don't specify availabilityZones explicitly to avoid replacement
    // issues when AZ order changes. AWS will distribute across AZs based on subnet group.
    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        engine: 'aurora-postgresql',
        engineVersion: engineVersion,
        clusterIdentifier: `aurora-${environment}-${environmentSuffix}`,
        databaseName: 'appdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('temp-password-will-rotate'), // Will be rotated by Secrets Manager
        dbSubnetGroupName: subnetGroup.name,
        vpcSecurityGroupIds: [securityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKeyId,
        backupRetentionPeriod: backupRetentionDays,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        enabledCloudwatchLogsExports: ['postgresql'],
        dbClusterParameterGroupName: clusterParameterGroup.name,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `aurora-cluster-${environmentSuffix}`,
        })),
      },
      {
        parent: this,
        // Ignore changes to availabilityZones to prevent replacement when AZ list order differs
        ignoreChanges: ['availabilityZones'],
      }
    );

    // Create DB parameter group
    const parameterGroup = new aws.rds.ParameterGroup(
      `db-params-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        description: `Aurora PostgreSQL 15 instance parameters for ${environment}`,
        parameters: [
          {
            name: 'shared_preload_libraries',
            value: 'pg_stat_statements',
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Create cluster instances
    const instanceCount = environment === 'prod' ? 2 : 1;
    const instances: aws.rds.ClusterInstance[] = [];

    for (let i = 0; i < instanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `aurora-instance-${i}-${environmentSuffix}`,
        {
          clusterIdentifier: cluster.id,
          instanceClass: instanceClass,
          engine: 'aurora-postgresql',
          engineVersion: engineVersion,
          dbParameterGroupName: parameterGroup.name,
          publiclyAccessible: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `aurora-instance-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      instances.push(instance);
    }

    this.endpoint = cluster.endpoint;
    this.clusterIdentifier = cluster.clusterIdentifier;

    this.registerOutputs({
      endpoint: this.endpoint,
      clusterIdentifier: this.clusterIdentifier,
    });
  }
}
