import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface CacheStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
}

export class CacheStack extends cdk.NestedStack {
  public readonly replicationGroup: elasticache.CfnReplicationGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    // Create security group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc: props.vpc,
        description: `ElastiCache security group for ${props.regionName}`,
        allowAllOutbound: false,
      }
    );

    // Allow Redis traffic from within VPC
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis traffic from VPC'
    );

    // Create subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        description: `ElastiCache subnet group for ${props.regionName}`,
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        cacheSubnetGroupName: `healthcare-cache-subnet-${props.regionName}-${props.environmentSuffix}`,
      }
    );

    // Create ElastiCache Redis replication group
    this.replicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'CacheReplicationGroup',
      {
        replicationGroupId: `healthcare-cache-${props.regionName}-${props.environmentSuffix}`,
        replicationGroupDescription: `Session cache for ${props.regionName}`,
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t4g.small',
        numCacheClusters: 3,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [cacheSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        // Note: Auth token removed for simplicity. In production, create a secret for Redis auth
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        preferredMaintenanceWindow: 'sun:05:00-sun:07:00',
        autoMinorVersionUpgrade: true,
      }
    );

    this.replicationGroup.addDependency(subnetGroup);

    // Add tags
    cdk.Tags.of(this.replicationGroup).add(
      'Name',
      `healthcare-cache-${props.regionName}`
    );
    cdk.Tags.of(this.replicationGroup).add(
      'Environment',
      props.environmentSuffix
    );
    cdk.Tags.of(this.replicationGroup).add('Region', props.regionName);

    // Output cache endpoint
    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.replicationGroup.attrPrimaryEndPointAddress,
      description: `ElastiCache primary endpoint for ${props.regionName}`,
    });
  }
}
