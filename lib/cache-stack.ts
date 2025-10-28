import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

interface CacheStackProps {
  vpc: ec2.Vpc;
  cacheSecurityGroup: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class CacheStack extends Construct {
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id);

    // Create subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis cluster',
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        cacheSubnetGroupName: `streamflix-redis-subnet-${props.environmentSuffix}`,
      }
    );

    // Create Redis replication group with encryption
    this.redisCluster = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupDescription: 'StreamFlix content metadata cache',
        replicationGroupId: `streamflix-redis-${props.environmentSuffix}`,
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t4g.micro',
        numCacheClusters: 3,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'required',
        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [props.cacheSecurityGroup.securityGroupId],
        port: 6379,
      }
    );

    this.redisCluster.addDependency(subnetGroup);

    // Redis endpoint (primary endpoint for writes)
    this.redisEndpoint = this.redisCluster.attrPrimaryEndPointAddress;

    // Output Redis endpoint
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
      description: 'Redis cluster primary endpoint',
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: this.redisCluster.attrPrimaryEndPointPort,
      description: 'Redis cluster port',
    });
  }
}
