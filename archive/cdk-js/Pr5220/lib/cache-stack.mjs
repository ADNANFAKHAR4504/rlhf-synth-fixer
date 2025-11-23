import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class CacheStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const vpc = props.vpc;
    const securityGroup = props.securityGroup;

    // Subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      cacheSubnetGroupName: `healthtech-cache-subnet-${environmentSuffix}`,
      description: 'Subnet group for ElastiCache Redis',
      subnetIds: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
    });

    // Redis replication group for session management
    this.replicationGroup = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupId: `healthtech-redis-${environmentSuffix}`,
      replicationGroupDescription: 'Redis cluster for HealthTech session management',
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.micro',
      numCacheClusters: 2,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [securityGroup.securityGroupId],
      snapshotRetentionLimit: 5,
      snapshotWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
    });
    this.replicationGroup.addDependency(subnetGroup);

    // Export Redis endpoint
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.replicationGroup.attrPrimaryEndPointAddress,
      exportName: `healthtech-redis-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: this.replicationGroup.attrPrimaryEndPointPort,
      exportName: `healthtech-redis-port-${environmentSuffix}`,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
