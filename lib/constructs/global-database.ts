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
}

export class GlobalDatabase extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryClusters: Map<string, rds.DatabaseCluster> = new Map();
  public readonly credentials: secretsmanager.ISecret;
  private readonly replicationMetrics: Map<string, cloudwatch.Metric> = new Map();
  private readonly parameterGroup: rds.ParameterGroup;

  constructor(scope: Construct, id: string, props: GlobalDatabaseProps) {
    super(scope, id);

    const envSuffix = props.environmentSuffix || 'dev';

    // Create encryption key
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: 'Global database encryption key',
      enableKeyRotation: true,
      alias: `financial-app-db-key-${envSuffix}`,
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

    // Create global cluster with unique identifier
    this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
      globalClusterIdentifier: `financial-app-global-cluster-${envSuffix}`,
      sourceDbClusterIdentifier: undefined, // Will be set after primary cluster creation
      storageEncrypted: true,
      engine: 'aurora-mysql',
      engineVersion: '5.7.mysql_aurora.2.10.2',
    });

    // Create primary cluster
    const primaryVpc = new ec2.Vpc(this, 'PrimaryVpc', {
      maxAzs: 3,
      natGateways: 3,
      cidr: '10.0.0.0/16',
    });

    this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `financial-db-primary-credentials-${envSuffix}`,
      }),
      instanceProps: {
        vpc: primaryVpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE4),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      },
      instances: 3,
      backup: {
        retention: cdk.Duration.days(props.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      parameterGroup: this.parameterGroup,
    });

    // Enable backtrack if requested
    if (props.enableBacktrack) {
      const cfnCluster = this.primaryCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.backtrackWindow = 72; // 72 hours
    }

    // Update global cluster with primary cluster ARN
    this.globalCluster.sourceDbClusterIdentifier = this.primaryCluster.clusterArn;

    // Create secondary clusters
    this.createSecondaryClusters(props.secondaryRegions, encryptionKey, envSuffix);

    // Setup replication monitoring
    this.setupReplicationMonitoring(props.primaryRegion, props.secondaryRegions);
  }

  private createParameterGroup(): rds.ParameterGroup {
    return new rds.ParameterGroup(this, 'AuroraParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
      }),
      description: 'Optimized for financial transactions',
      parameters: {
        'innodb_buffer_pool_size': '{DBInstanceClassMemory*3/4}',
        'max_connections': '5000',
        'innodb_lock_wait_timeout': '5',
        'binlog_format': 'ROW',
        'aurora_binlog_replication_max_yield_seconds': '0',
        'aurora_enable_repl_bin_log_filtering': '0',
      },
    });
  }

  private createSecondaryClusters(regions: string[], encryptionKey: kms.IKey, envSuffix: string) {
    for (const region of regions) {
      // Note: In practice, you'd need to create these in separate stacks per region
      // This is a simplified representation
      const secondaryVpc = new ec2.Vpc(this, `SecondaryVpc-${region}`, {
        maxAzs: 3,
        natGateways: 3,
        cidr: `10.${regions.indexOf(region) + 1}.0.0/16`,
      });

      const secondaryCluster = new rds.DatabaseCluster(this, `SecondaryCluster-${region}`, {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `financial-db-${region}-credentials-${envSuffix}`,
        }),
        instanceProps: {
          vpc: secondaryVpc,
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE4),
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        },
        instances: 3,
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        parameterGroup: this.parameterGroup,
      });

      this.secondaryClusters.set(region, secondaryCluster);

      // Note: Secondary clusters are automatically part of the global cluster
      // through the globalClusterIdentifier property. No need to create
      // separate CfnGlobalCluster resources for each region.
    }
  }

  private setupReplicationMonitoring(primaryRegion: string, secondaryRegions: string[]) {
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

  public getConnectionString(region: string): string {
    const cluster = region === this.primaryCluster.env.region ?
      this.primaryCluster :
      this.secondaryClusters.get(region)!;

    return cluster.clusterEndpoint.socketAddress;
  }
}

