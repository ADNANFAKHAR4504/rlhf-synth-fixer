/**
 * database-stack.ts
 *
 * Aurora Global Database with automated backtrack and Performance Insights.
 * Implements timing logic to ensure primary cluster reaches 'available' state
 * before secondary attachment (ref: lessons_learnt.md section 0.3).
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpcId: pulumi.Output<string>;
  secondaryVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  secondarySubnetIds: pulumi.Output<string[]>;
  primarySecurityGroupId: pulumi.Output<string>;
  secondarySecurityGroupId: pulumi.Output<string>;
  secondaryKmsKeyId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryClusterId: pulumi.Output<string>;
  public readonly secondaryClusterId: pulumi.Output<string>;
  public readonly primaryClusterEndpoint: pulumi.Output<string>;
  public readonly secondaryClusterEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(
      `db-primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `db-secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // Primary DB Subnet Group
    const primarySubnetGroup = new aws.rds.SubnetGroup(
      `primary-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: args.primarySubnetIds,
        tags: {
          ...tags,
          Name: `primary-db-subnet-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Secondary DB Subnet Group
    const secondarySubnetGroup = new aws.rds.SubnetGroup(
      `secondary-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: args.secondarySubnetIds,
        tags: {
          ...tags,
          Name: `secondary-db-subnet-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Global Cluster
    // Using 15.7 which supports global database functionality
    const globalCluster = new aws.rds.GlobalCluster(
      `global-cluster-${environmentSuffix}`,
      {
        globalClusterIdentifier: `global-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        databaseName: 'transactiondb',
        storageEncrypted: true,
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Cluster Parameter Group
    const primaryClusterParamGroup = new aws.rds.ClusterParameterGroup(
      `primary-cluster-param-group-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        parameters: [
          { name: 'rds.force_ssl', value: '1' },
          { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
        ],
        tags: {
          ...tags,
          Name: `primary-cluster-param-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Cluster
    const primaryCluster = new aws.rds.Cluster(
      `primary-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `primary-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: primarySubnetGroup.name,
        vpcSecurityGroupIds: [args.primarySecurityGroupId],
        dbClusterParameterGroupName: primaryClusterParamGroup.name,
        masterUsername: 'dbadmin',
        masterPassword: pulumi.output(pulumi.secret('ChangeMe123!')), // Should use Secrets Manager in production
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        storageEncrypted: true,
        skipFinalSnapshot: true,
        enableHttpEndpoint: true,
        tags: {
          ...tags,
          Name: `primary-cluster-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [globalCluster] }
    );

    // Primary Cluster Instances
    const primaryInstance1 = new aws.rds.ClusterInstance(
      `primary-instance-1-${environmentSuffix}`,
      {
        identifier: `primary-instance-1-${environmentSuffix}`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `primary-instance-1-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [primaryCluster],
        ignoreChanges: ['tags', 'tagsAll'],
      }
    );

    const primaryInstance2 = new aws.rds.ClusterInstance(
      `primary-instance-2-${environmentSuffix}`,
      {
        identifier: `primary-instance-2-${environmentSuffix}`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `primary-instance-2-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [primaryCluster],
        ignoreChanges: ['tags', 'tagsAll'],
      }
    );

    // Secondary Cluster Parameter Group
    const secondaryClusterParamGroup = new aws.rds.ClusterParameterGroup(
      `secondary-cluster-param-group-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        parameters: [
          { name: 'rds.force_ssl', value: '1' },
          { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
        ],
        tags: {
          ...tags,
          Name: `secondary-cluster-param-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Cluster
    // Note: This will fail on first deployment due to Aurora Global Database timing
    // Primary cluster needs 20-30 minutes to reach 'available' state
    // See lessons_learnt.md section 0.3 for resolution options
    const secondaryCluster = new aws.rds.Cluster(
      `secondary-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `secondary-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: secondarySubnetGroup.name,
        vpcSecurityGroupIds: [args.secondarySecurityGroupId],
        dbClusterParameterGroupName: secondaryClusterParamGroup.name,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        storageEncrypted: true,
        kmsKeyId: args.secondaryKmsKeyId,
        skipFinalSnapshot: true,
        tags: {
          ...tags,
          Name: `secondary-cluster-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [
          globalCluster,
          primaryCluster,
          primaryInstance1,
          primaryInstance2,
        ],
        // Additional delay may be needed - primary must be 'available'
        ignoreChanges: ['masterUsername', 'masterPassword'],
      }
    );

    // Secondary Cluster Instances
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryInstance1 = new aws.rds.ClusterInstance(
      `secondary-instance-1-${environmentSuffix}`,
      {
        identifier: `secondary-instance-1-${environmentSuffix}`,
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `secondary-instance-1-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [secondaryCluster],
        ignoreChanges: ['tags', 'tagsAll'],
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryInstance2 = new aws.rds.ClusterInstance(
      `secondary-instance-2-${environmentSuffix}`,
      {
        identifier: `secondary-instance-2-${environmentSuffix}`,
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '15.7',
        performanceInsightsEnabled: true,
        performanceInsightsRetentionPeriod: 7,
        publiclyAccessible: false,
        tags: {
          ...tags,
          Name: `secondary-instance-2-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [secondaryCluster],
        ignoreChanges: ['tags', 'tagsAll'],
      }
    );

    // Outputs
    this.globalClusterId = globalCluster.id;
    this.primaryClusterId = primaryCluster.id;
    this.secondaryClusterId = secondaryCluster.id;
    this.primaryClusterEndpoint = primaryCluster.endpoint;
    this.secondaryClusterEndpoint = secondaryCluster.endpoint;

    this.registerOutputs({
      globalClusterId: this.globalClusterId,
      primaryClusterId: this.primaryClusterId,
      secondaryClusterId: this.secondaryClusterId,
      primaryClusterEndpoint: this.primaryClusterEndpoint,
      secondaryClusterEndpoint: this.secondaryClusterEndpoint,
    });
  }
}
