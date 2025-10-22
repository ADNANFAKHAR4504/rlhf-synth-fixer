/**
 * database-stack.ts - FIXED VERSION
 *
 * Database infrastructure: Aurora Global Database, DynamoDB Global Tables, ElastiCache Redis
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  kmsKeyArn: pulumi.Input<string>;
  regions: {
    primary: string;
    replicas: string[];
  };
  enableGlobalDatabase: boolean;
  enablePointInTimeRecovery: boolean;
  secretsManagerArn: pulumi.Input<string>;
  replicaKmsKeyArns?: Record<string, pulumi.Input<string>>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly auroraClusterEndpoint: pulumi.Output<string>;
  public readonly auroraReaderEndpoint: pulumi.Output<string>;
  public readonly auroraClusterArn: pulumi.Output<string>;
  public readonly dynamoDbTableName: pulumi.Output<string>;
  public readonly dynamoDbTableArn: pulumi.Output<string>;
  public readonly elastiCacheEndpoint: pulumi.Output<string>;
  public readonly elastiCacheReplicationGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      privateSubnetIds,
      kmsKeyArn,
      regions,
      enableGlobalDatabase,
      enablePointInTimeRecovery,
      secretsManagerArn,
      replicaKmsKeyArns,
    } = args;

    //  DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `banking-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-db-subnet-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Aurora Security Group
    const auroraSecurityGroup = new aws.ec2.SecurityGroup(
      `banking-aurora-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Aurora PostgreSQL cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.29.0.0/16'],
            description: 'PostgreSQL access from VPC',
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
          Name: `banking-aurora-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Aurora Global Cluster
    let globalCluster: aws.rds.GlobalCluster | undefined;
    if (enableGlobalDatabase) {
      globalCluster = new aws.rds.GlobalCluster(
        `banking-global-cluster-${environmentSuffix}`,
        {
          globalClusterIdentifier: `banking-global-${environmentSuffix}`,
          engine: 'aurora-postgresql',
          engineVersion: '15.4',
          databaseName: 'banking',
          storageEncrypted: true,
        },
        { parent: this }
      );
    }

    //  Aurora Cluster
    const auroraCluster = new aws.rds.Cluster(
      `banking-aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `banking-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        engineMode: 'provisioned',
        databaseName: 'banking',
        masterUsername: 'banking_admin',
        masterPassword: pulumi
          .output(secretsManagerArn)
          .apply((_arn: string) => pulumi.secret('ChangeMeInProduction123!')),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [auroraSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKeyArn,
        backupRetentionPeriod: 30,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        deletionProtection: true,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `banking-final-snapshot-${environmentSuffix}-${Date.now()}`,
        globalClusterIdentifier: globalCluster?.id,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 16,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-aurora-cluster-${environmentSuffix}`,
        })),
      },
      {
        parent: this,
      }
    );

    //  Aurora Cluster Instances
    new aws.rds.ClusterInstance(
      `banking-aurora-instance-primary-${environmentSuffix}`,
      {
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyArn,
        performanceInsightsRetentionPeriod: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-aurora-instance-primary-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.rds.ClusterInstance(
      `banking-aurora-instance-reader-${environmentSuffix}`,
      {
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyArn,
        performanceInsightsRetentionPeriod: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-aurora-instance-reader-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  DynamoDB Global Table
    const dynamoTable = new aws.dynamodb.Table(
      `banking-sessions-${environmentSuffix}`,
      {
        name: `banking-sessions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'sessionId',
        rangeKey: 'userId',
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: enablePointInTimeRecovery,
        },
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKeyArn,
        },
        attributes: [
          {
            name: 'sessionId',
            type: 'S',
          },
          {
            name: 'userId',
            type: 'S',
          },
        ],
        ttl: {
          attributeName: 'expiresAt',
          enabled: true,
        },
        globalSecondaryIndexes: [
          {
            name: 'UserIdIndex',
            hashKey: 'userId',
            projectionType: 'ALL',
          },
        ],
        //  Add KMS key for each replica region
        replicas:
          enableGlobalDatabase && replicaKmsKeyArns
            ? regions.replicas.map(region => ({
                regionName: region,
                pointInTimeRecovery: enablePointInTimeRecovery,
                kmsKeyArn: replicaKmsKeyArns[region], // Add KMS key for replica
              }))
            : undefined,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-sessions-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ElastiCache Subnet Group
    const cacheSubnetGroup = new aws.elasticache.SubnetGroup(
      `banking-cache-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-cache-subnet-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ElastiCache Security Group
    const cacheSecurityGroup = new aws.ec2.SecurityGroup(
      `banking-cache-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for ElastiCache Redis',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 6379,
            toPort: 6379,
            cidrBlocks: ['10.29.0.0/16'],
            description: 'Redis access from VPC',
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
          Name: `banking-cache-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  ElastiCache Replication Group (Redis)
    const cacheReplicationGroup = new aws.elasticache.ReplicationGroup(
      `banking-cache-${environmentSuffix}`,
      {
        replicationGroupId: `banking-cache-${environmentSuffix}`,
        description: 'Redis cluster for banking platform',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.r7g.large',
        numCacheClusters: 3,
        port: 6379,
        parameterGroupName: 'default.redis7',
        subnetGroupName: cacheSubnetGroup.name,
        securityGroupIds: [cacheSecurityGroup.id],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        kmsKeyId: kmsKeyArn,
        authToken: pulumi.secret('ChangeMeRedisToken123!'),
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        snapshotRetentionLimit: 7,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'mon:05:00-mon:07:00',
        notificationTopicArn: undefined,
        logDeliveryConfigurations: [
          {
            destination: `banking-cache-logs-${environmentSuffix}`,
            destinationType: 'cloudwatch-logs',
            logFormat: 'json',
            logType: 'slow-log',
          },
          {
            destination: `banking-cache-logs-${environmentSuffix}`,
            destinationType: 'cloudwatch-logs',
            logFormat: 'json',
            logType: 'engine-log',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-cache-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  ElastiCache Global Replication Group (for multi-region)
    if (enableGlobalDatabase) {
      new aws.elasticache.GlobalReplicationGroup(
        `banking-global-cache-${environmentSuffix}`,
        {
          globalReplicationGroupIdSuffix: environmentSuffix,
          primaryReplicationGroupId: cacheReplicationGroup.id,
          globalReplicationGroupDescription:
            'Global Redis datastore for banking platform',
        },
        { parent: this }
      );
    }

    //  Outputs
    this.auroraClusterEndpoint = auroraCluster.endpoint;
    this.auroraReaderEndpoint = auroraCluster.readerEndpoint;
    this.auroraClusterArn = auroraCluster.arn;
    this.dynamoDbTableName = dynamoTable.name;
    this.dynamoDbTableArn = dynamoTable.arn;
    this.elastiCacheEndpoint =
      cacheReplicationGroup.configurationEndpointAddress;
    this.elastiCacheReplicationGroupId = cacheReplicationGroup.id;

    this.registerOutputs({
      auroraClusterEndpoint: this.auroraClusterEndpoint,
      auroraReaderEndpoint: this.auroraReaderEndpoint,
      auroraClusterArn: this.auroraClusterArn,
      dynamoDbTableName: this.dynamoDbTableName,
      dynamoDbTableArn: this.dynamoDbTableArn,
      elastiCacheEndpoint: this.elastiCacheEndpoint,
      elastiCacheReplicationGroupId: this.elastiCacheReplicationGroupId,
    });
  }
}
