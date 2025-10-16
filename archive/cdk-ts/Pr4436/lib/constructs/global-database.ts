import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface GlobalDatabaseProps {
  primaryRegion: string;
  secondaryRegions: string[];
  databaseName: string;
  backupRetentionDays: number;
  enableBacktrack: boolean;
  environmentSuffix?: string;
  currentRegion?: string; // The region this stack is being deployed to
}

export class GlobalDatabase extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryClusters: Map<string, rds.DatabaseCluster> =
    new Map();
  public readonly credentials: secretsmanager.ISecret;
  private readonly replicationMetrics: Map<string, cloudwatch.Metric> =
    new Map();
  private readonly parameterGroup: rds.ParameterGroup;

  constructor(scope: Construct, id: string, props: GlobalDatabaseProps) {
    super(scope, id);

    const envSuffix = props.environmentSuffix || 'dev';
    const currentRegion = props.currentRegion || cdk.Stack.of(this).region;
    const isPrimaryRegion = currentRegion === props.primaryRegion;

    // Create encryption key (region-specific)
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: `Database encryption key for ${currentRegion}`,
      enableKeyRotation: true,
      alias: `financial-app-db-key-${currentRegion}-${envSuffix}`,
    });

    // Create credentials
    this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'Global database master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // Create parameter group once for reuse
    this.parameterGroup = this.createParameterGroup();

    // Create VPC for this region
    const vpc = new ec2.Vpc(this, `Vpc-${currentRegion}`, {
      maxAzs: 3,
      natGateways: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    // Create database cluster for this region
    const cluster = new rds.DatabaseCluster(this, `Cluster-${currentRegion}`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `findb-${currentRegion}-${envSuffix}`,
      }),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE4
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE4
          ),
        }),
        rds.ClusterInstance.provisioned('reader2', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE4
          ),
        }),
      ],
      backup: {
        retention: cdk.Duration.days(props.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      parameterGroup: this.parameterGroup,
    });

    // Set the primary cluster reference
    this.primaryCluster = cluster;

    // Create Global Cluster ONLY in the primary region
    if (isPrimaryRegion) {
      // Create global cluster from primary cluster
      // Note: When using sourceDbClusterIdentifier, don't specify engine properties
      // as they're inherited from the source cluster
      this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `financial-app-global-cluster-${envSuffix}`,
        sourceDbClusterIdentifier: cluster.clusterArn,
      });
    }

    // Setup replication monitoring
    this.setupReplicationMonitoring(
      props.primaryRegion,
      props.secondaryRegions
    );
  }

  private createParameterGroup(): rds.ParameterGroup {
    return new rds.ParameterGroup(this, 'AuroraParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      description: 'Optimized for financial transactions',
      parameters: {
        // Parameters compatible with Aurora MySQL 8.0
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
        max_connections: '5000',
        innodb_lock_wait_timeout: '5',
        binlog_format: 'ROW',
        // aurora_binlog_replication_max_yield_seconds: Not supported in MySQL 8.0
        // aurora_enable_repl_bin_log_filtering: Not supported in MySQL 8.0
      },
    });
  }

  // Note: Secondary clusters are now created in their own regional stacks
  // This method is kept for backward compatibility but may not be needed
  private createSecondaryClusters(
    _regions: string[],
    _encryptionKey: kms.IKey,
    _envSuffix: string
  ) {
    // In multi-region deployment, each region creates its own cluster
    // No need to create secondary clusters here
  }

  private setupReplicationMonitoring(
    primaryRegion: string,
    secondaryRegions: string[]
  ) {
    // Create custom metrics for replication lag
    for (const region of secondaryRegions) {
      const metric = new cloudwatch.Metric({
        namespace: 'FinancialApp/Database',
        metricName: 'ReplicationLag',
        dimensionsMap: {
          SourceRegion: primaryRegion,
          TargetRegion: region,
        },
        statistic: 'Average',
        period: cdk.Duration.seconds(60),
      });

      this.replicationMetrics.set(region, metric);

      // Create alarm for replication lag
      new cloudwatch.Alarm(this, `ReplicationLagAlarm-${region}`, {
        metric: metric,
        threshold: 50, // 50ms threshold
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `Replication lag from ${primaryRegion} to ${region} exceeds 50ms`,
      });
    }
  }

  public getReplicationLagMetric(region: string): cloudwatch.Metric {
    return this.replicationMetrics.get(region)!;
  }

  public getConnectionString(_region: string): string {
    // Each region uses its own cluster (primaryCluster holds this region's cluster)
    return this.primaryCluster.clusterEndpoint.socketAddress;
  }
}
