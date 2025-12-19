import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface CacheStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  cacheSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

export class CacheStack extends Construct {
  public readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id);

    // Create CloudWatch log group for ElastiCache logs
    const logGroup = new logs.LogGroup(this, 'RedisLogGroup', {
      logGroupName: `/aws/elasticache/redis/${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create ElastiCache subnet group
    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        description: 'Subnet group for ElastiCache Redis',
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        cacheSubnetGroupName: `payment-cache-subnet-${props.environmentSuffix}`,
      }
    );

    // Create ElastiCache replication group (Redis cluster)
    const replicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupId: `payment-redis-${props.environmentSuffix}`,
        replicationGroupDescription: 'Redis cluster for payment processing',
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t3.micro',
        numCacheClusters: 1,
        multiAzEnabled: false,
        automaticFailoverEnabled: false,
        autoMinorVersionUpgrade: true,
        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [props.cacheSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'required',
        kmsKeyId: props.kmsKey.keyId,
        snapshotRetentionLimit: 7,
        snapshotWindow: '03:00-05:00',
        preferredMaintenanceWindow: 'sun:05:00-sun:07:00',
        logDeliveryConfigurations: [
          {
            destinationType: 'cloudwatch-logs',
            logFormat: 'json',
            logType: 'slow-log',
            destinationDetails: {
              cloudWatchLogsDetails: {
                logGroup: logGroup.logGroupName,
              },
            },
          },
        ],
        tags: [
          { key: 'PCICompliant', value: 'true' },
          { key: 'Environment', value: props.environmentSuffix },
        ],
      }
    );

    replicationGroup.addDependency(subnetGroup);
    // Ensure log group is created before replication group
    replicationGroup.addDependency(
      logGroup.node.defaultChild as cdk.CfnResource
    );

    // Store endpoint for reference
    this.redisEndpoint = replicationGroup.attrPrimaryEndPointAddress;

    // Output endpoint
    new cdk.CfnOutput(cdk.Stack.of(this), 'RedisClusterEndpoint', {
      value: this.redisEndpoint,
      description: 'Redis cluster primary endpoint',
    });
  }
}
