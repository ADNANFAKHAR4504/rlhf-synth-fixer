import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

export interface AuroraClusterArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  instanceCount: number;
  backupRetentionDays: number;
  instanceClass: string;
}

export class AuroraCluster extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly instances: aws.rds.ClusterInstance[];
  public readonly endpoint: pulumi.Output<string>;
  public readonly readerEndpoint: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AuroraClusterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:AuroraCluster', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Generate random password
    const dbPassword = new random.RandomPassword(
      `db-password-${args.environmentSuffix}`,
      {
        length: 32,
        special: true,
        overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      },
      defaultResourceOptions
    );

    // Store password in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${args.environmentSuffix}`,
      {
        name: `aurora-password-${args.environmentSuffix}-nm`,
        description: 'Aurora database password',
        recoveryWindowInDays: 0, // Allow immediate deletion to prevent naming conflicts
        tags: {
          Name: `db-secret-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.secretsmanager.SecretVersion(
      `db-secret-version-${args.environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.interpolate`{"username":"dbadmin","password":"${dbPassword.result}"}`,
      },
      defaultResourceOptions
    );

    this.secretArn = dbSecret.arn;

    // Create DB subnet group
    const subnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        name: `db-subnet-group-${args.environmentSuffix}`,
        subnetIds: args.subnetIds,
        tags: {
          Name: `db-subnet-group-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Aurora cluster parameter group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `aurora-pg-${args.environmentSuffix}`,
      {
        name: `aurora-pg-${args.environmentSuffix}`,
        family: 'aurora-postgresql14',
        description: 'Aurora PostgreSQL cluster parameter group',
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
          Name: `aurora-pg-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Aurora cluster
    this.cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${args.environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '14.6',
        databaseName: 'trading',
        masterUsername: 'dbadmin',
        masterPassword: dbPassword.result,
        dbSubnetGroupName: subnetGroup.name,
        vpcSecurityGroupIds: args.securityGroupIds,
        dbClusterParameterGroupName: clusterParameterGroup.name,
        backupRetentionPeriod: args.backupRetentionDays,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        enabledCloudwatchLogsExports: ['postgresql'],
        storageEncrypted: true,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 1.0,
        },
        tags: {
          Name: `aurora-cluster-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Aurora instances
    this.instances = [];
    for (let i = 0; i < args.instanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `aurora-instance-${i}-${args.environmentSuffix}`,
        {
          identifier: `aurora-instance-${i}-${args.environmentSuffix}`,
          clusterIdentifier: this.cluster.id,
          instanceClass: 'db.serverless',
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          publiclyAccessible: false,
          tags: {
            Name: `aurora-instance-${i}-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
          },
        },
        { ...defaultResourceOptions, dependsOn: [this.cluster] }
      );
      this.instances.push(instance);
    }

    this.endpoint = this.cluster.endpoint;
    this.readerEndpoint = this.cluster.readerEndpoint;
    this.clusterId = this.cluster.id;
    this.clusterArn = this.cluster.arn;

    this.registerOutputs({
      endpoint: this.endpoint,
      readerEndpoint: this.readerEndpoint,
      clusterArn: this.clusterArn,
    });
  }
}
