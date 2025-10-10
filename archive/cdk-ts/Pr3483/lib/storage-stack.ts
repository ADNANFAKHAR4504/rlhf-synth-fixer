import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class StorageStack extends Construct {
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly openSearchDomain: opensearch.Domain;
  public readonly mediaBucket: s3.Bucket;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly openSearchSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Redis Security Group
    this.redisSecurityGroup = new ec2.SecurityGroup(
      this,
      'RedisSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for ElastiCache Redis',
        allowAllOutbound: false,
      }
    );

    // Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis cache',
        subnetIds: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
      }
    );

    // ElastiCache Redis Cluster
    this.redisCluster = new elasticache.CfnCacheCluster(
      this,
      'WikiRedisCache',
      {
        cacheNodeType: 'cache.t3.micro',
        engine: 'redis',
        numCacheNodes: 1,
        cacheSubnetGroupName: redisSubnetGroup.ref,
        vpcSecurityGroupIds: [this.redisSecurityGroup.securityGroupId],
        preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
        snapshotRetentionLimit: 7,
        snapshotWindow: '03:00-04:00',
        tags: [
          {
            key: 'Name',
            value: `WikiRedisCache-${props.environmentSuffix}`,
          },
          {
            key: 'Environment',
            value: props.environmentSuffix,
          },
        ],
      }
    );

    // OpenSearch Security Group
    this.openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      'OpenSearchSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for OpenSearch domain',
        allowAllOutbound: true,
      }
    );

    // OpenSearch Domain
    this.openSearchDomain = new opensearch.Domain(this, 'WikiSearchDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      capacity: {
        dataNodeInstanceType: 't3.small.search',
        dataNodes: 2,
        multiAzWithStandbyEnabled: false,
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      vpcSubnets: [
        props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
      ],
      securityGroups: [this.openSearchSecurityGroup],
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for Media Uploads
    this.mediaBucket = new s3.Bucket(this, 'WikiMediaBucket', {
      bucketName: `wiki-media-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Tags
    cdk.Tags.of(this.mediaBucket).add(
      'Name',
      `WikiMediaBucket-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.mediaBucket).add('Environment', props.environmentSuffix);
  }
}
