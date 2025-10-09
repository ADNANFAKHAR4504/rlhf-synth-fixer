import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

interface DatabaseStackProps {
  vpc: Vpc;
  privateSubnets: Subnet[];
  region: string;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly dbInstance: DbInstance;
  // public readonly readReplica: DbInstance;
  public readonly elasticacheServerless: ElasticacheServerlessCache;
  public readonly historicalDataBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for RDS PostgreSQL',
      tags: {
        Name: 'portfolio-db-sg',
      },
    });

    new SecurityGroupRule(this, 'db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: dbSecurityGroup.id,
      cidrBlocks: ['172.32.0.0/16'],
    });

    new SecurityGroupRule(this, 'db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: dbSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `portfolio-db-subnet-group-${props.environmentSuffix}`,
      subnetIds: props.privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: 'portfolio-db-subnet-group',
      },
    });

    this.dbInstance = new DbInstance(this, 'postgres-db', {
      identifier: `portfolio-holdings-db-${props.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '15.14',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'portfoliodb',
      username: 'dbadmin',
      password: 'TempPassword123!ChangeMe',
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: 'portfolio-holdings-db',
      },
    });

    // Read replica is not supported with existing database that uses Secrets Manager
    // this.readReplica = new DbInstance(this, 'postgres-read-replica', {
    //   identifier: `portfolio-read-replica-${props.environmentSuffix}`,
    //   replicateSourceDb: this.dbInstance.identifier,
    //   instanceClass: 'db.t3.medium',
    //   skipFinalSnapshot: true,
    //   tags: {
    //     Name: 'portfolio-holdings-read-replica',
    //   },
    // });

    const cacheSecurityGroup = new SecurityGroup(this, 'cache-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for ElastiCache',
      tags: {
        Name: 'portfolio-cache-sg',
      },
    });

    new SecurityGroupRule(this, 'cache-ingress', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      securityGroupId: cacheSecurityGroup.id,
      cidrBlocks: ['172.32.0.0/16'],
    });

    new SecurityGroupRule(this, 'cache-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: cacheSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    this.elasticacheServerless = new ElasticacheServerlessCache(
      this,
      'market-data-cache',
      {
        name: `portfolio-market-cache-${props.environmentSuffix}`,
        engine: 'valkey',
        cacheUsageLimits: [
          {
            dataStorage: [
              {
                unit: 'GB',
                maximum: 10,
              },
            ],
            ecpuPerSecond: [
              {
                maximum: 5000,
              },
            ],
          },
        ],
        dailySnapshotTime: '03:00',
        description: 'Market data cache with 1-minute TTL',
        securityGroupIds: [cacheSecurityGroup.id],
        subnetIds: props.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: 'portfolio-market-cache',
        },
      }
    );

    this.historicalDataBucket = new S3Bucket(this, 'historical-data', {
      bucket: `portfolio-hist-${props.environmentSuffix}-${Date.now()}`,
      tags: {
        Name: `portfolio-historical-data-${props.environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 'historical-data-versioning', {
      bucket: this.historicalDataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'historical-data-pab', {
      bucket: this.historicalDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
