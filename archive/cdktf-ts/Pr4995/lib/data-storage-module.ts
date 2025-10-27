import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { EfsFileSystem } from '@cdktf/provider-aws/lib/efs-file-system';
import { EfsMountTarget } from '@cdktf/provider-aws/lib/efs-mount-target';
import { TerraformOutput } from 'cdktf';

interface DataStorageModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  databaseSecurityGroupId: string;
  cacheSecurityGroupId: string;
  efsSecurityGroupId: string;
  dbSecretArn: string;
  kmsKeyId: string;
  kmsKeyArn: string;
}

export class DataStorageModule extends Construct {
  public readonly s3BucketName: string;
  public readonly dbClusterEndpoint: string;
  public readonly redisEndpoint: string;
  public readonly efsFileSystemId: string;

  constructor(scope: Construct, id: string, props: DataStorageModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      privateSubnetIds,
      databaseSecurityGroupId,
      cacheSecurityGroupId,
      efsSecurityGroupId,
      kmsKeyArn,
    } = props;

    // Create S3 bucket for long-term data storage
    const s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `manufacturing-sensor-data-${environmentSuffix}-${Date.now()}`,
      tags: {
        Name: `manufacturing-data-${environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 's3-versioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketLifecycleConfiguration(this, 's3-lifecycle', {
      bucket: s3Bucket.id,
      rule: [
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
            {
              days: 365,
              storageClass: 'DEEP_ARCHIVE',
            },
          ],
          expiration: [
            {
              days: 2555, // 7 years retention
            },
          ],
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 's3-public-access-block', {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create DB Subnet Group for Aurora
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `manufacturing-db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `manufacturing-db-subnet-group-${environmentSuffix}`,
      },
    });

    // Create Aurora PostgreSQL Serverless v2 Cluster
    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `manufacturing-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.4',
      databaseName: 'manufacturing',
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [databaseSecurityGroupId],
      storageEncrypted: true,
      kmsKeyId: kmsKeyArn,
      backupRetentionPeriod: 35,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 16,
      },
      tags: {
        Name: `manufacturing-aurora-${environmentSuffix}`,
      },
    });

    // Create Aurora Serverless v2 instances
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `manufacturing-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: auroraCluster.engine,
      engineVersion: auroraCluster.engineVersion,
      publiclyAccessible: false,
    });

    new RdsClusterInstance(this, 'aurora-instance-2', {
      identifier: `manufacturing-aurora-instance-2-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: auroraCluster.engine,
      engineVersion: auroraCluster.engineVersion,
      publiclyAccessible: false,
    });

    // Create ElastiCache Subnet Group
    const cacheSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'cache-subnet-group',
      {
        name: `manufacturing-cache-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnetIds,
        tags: {
          Name: `manufacturing-cache-subnet-group-${environmentSuffix}`,
        },
      }
    );

    // Create ElastiCache Redis cluster in cluster mode
    const redisCluster = new ElasticacheReplicationGroup(
      this,
      'redis-cluster',
      {
        replicationGroupId: `manufacturing-redis-${environmentSuffix}`,
        description: 'Redis cluster for manufacturing data caching',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.r7g.large',
        numNodeGroups: 2,
        replicasPerNodeGroup: 1,
        automaticFailoverEnabled: true,
        atRestEncryptionEnabled: 'true',
        kmsKeyId: kmsKeyArn,
        subnetGroupName: cacheSubnetGroup.name,
        securityGroupIds: [cacheSecurityGroupId],
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'sun:05:00-sun:07:00',
        tags: {
          Name: `manufacturing-redis-${environmentSuffix}`,
        },
      }
    );

    // Create EFS File System
    const efsFileSystem = new EfsFileSystem(this, 'efs-filesystem', {
      encrypted: true,
      kmsKeyId: kmsKeyArn,
      performanceMode: 'generalPurpose',
      throughputMode: 'elastic',
      lifecyclePolicy: [
        {
          transitionToIa: 'AFTER_30_DAYS',
        },
      ],
      tags: {
        Name: `manufacturing-efs-${environmentSuffix}`,
      },
    });

    // Create EFS Mount Targets in each private subnet
    privateSubnetIds.forEach((subnetId, index) => {
      new EfsMountTarget(this, `efs-mount-target-${index}`, {
        fileSystemId: efsFileSystem.id,
        subnetId: subnetId,
        securityGroups: [efsSecurityGroupId],
      });
    });

    this.s3BucketName = s3Bucket.bucket;
    this.dbClusterEndpoint = auroraCluster.endpoint;
    this.redisEndpoint = redisCluster.configurationEndpointAddress;
    this.efsFileSystemId = efsFileSystem.id;

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Bucket.bucket,
      description: 'S3 bucket for long-term data storage',
    });

    new TerraformOutput(this, 'aurora-endpoint', {
      value: auroraCluster.endpoint,
      description: 'Aurora PostgreSQL cluster endpoint',
    });

    new TerraformOutput(this, 'redis-endpoint', {
      value: redisCluster.configurationEndpointAddress,
      description: 'ElastiCache Redis cluster endpoint',
    });

    new TerraformOutput(this, 'efs-filesystem-id', {
      value: efsFileSystem.id,
      description: 'EFS file system ID',
    });
  }
}
