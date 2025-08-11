import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface MigrationComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  sshSecurityGroup: ec2.ISecurityGroup;
  environmentSuffix?: string;
}

export class MigrationComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MigrationComputeStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create security group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: `migration-cache-sg-${environmentSuffix}`,
        description: 'Security group for ElastiCache cluster',
        allowAllOutbound: false,
      }
    );

    // Allow Redis access from VPC
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    // Create subnet group for ElastiCache
    new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache cluster',
      subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `migration-cache-subnet-group-${environmentSuffix}`,
    });

    // Create ElastiCache Serverless for Redis (latest AWS feature)
    const cacheCluster = new elasticache.CfnServerlessCache(
      this,
      'MigrationCache',
      {
        engine: 'redis',
        serverlessCacheName: `migration-cache-${environmentSuffix}`,
        description: 'Serverless Redis cache for migration workloads',
        securityGroupIds: [cacheSecurityGroup.securityGroupId],
        subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
        cacheUsageLimits: {
          dataStorage: {
            maximum: 10,
            unit: 'GB',
          },
          ecpuPerSecond: {
            maximum: 5000,
          },
        },
      }
    );

    // Apply tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Compute');

    // Output cache endpoint and port
    new cdk.CfnOutput(this, 'CacheEndpointAddress', {
      value: cacheCluster.attrEndpointAddress || 'N/A',
      description: 'ElastiCache Serverless endpoint address',
      exportName: `migration-cache-endpoint-address-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CacheEndpointPort', {
      value: cacheCluster.attrEndpointPort || 'N/A',
      description: 'ElastiCache Serverless endpoint port',
      exportName: `migration-cache-endpoint-port-${environmentSuffix}`,
    });
  }
}
