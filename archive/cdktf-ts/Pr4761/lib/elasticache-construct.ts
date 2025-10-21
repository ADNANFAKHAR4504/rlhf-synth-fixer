import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export interface ElastiCacheConstructProps {
  environmentSuffix: string;
  vpc: Vpc;
  privateSubnets: Subnet[];
  kmsKeyId: string;
}

export class ElastiCacheConstruct extends Construct {
  public readonly replicationGroup: ElasticacheReplicationGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: ElastiCacheConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpc, privateSubnets, kmsKeyId } = props;

    // Create ElastiCache Subnet Group
    const subnetGroup = new ElasticacheSubnetGroup(this, 'cache-subnet-group', {
      name: `payment-cache-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `payment-cache-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Security Group for ElastiCache
    this.securityGroup = new SecurityGroup(this, 'cache-sg', {
      name: `payment-cache-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis cluster',
      vpcId: vpc.id,
      tags: {
        Name: `payment-cache-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow Redis access from within VPC
    new SecurityGroupRule(this, 'cache-ingress', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: this.securityGroup.id,
      description: 'Allow Redis access from VPC',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'cache-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create ElastiCache Replication Group (Multi-AZ Redis)
    this.replicationGroup = new ElasticacheReplicationGroup(
      this,
      'cache-replication-group',
      {
        replicationGroupId: `payment-cache-${environmentSuffix}`,
        description: 'Redis cluster for payment session management',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.t3.micro',
        numCacheClusters: 2,
        port: 6379,
        parameterGroupName: 'default.redis7',
        subnetGroupName: subnetGroup.name,
        securityGroupIds: [this.securityGroup.id],
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        atRestEncryptionEnabled: 'true',
        transitEncryptionEnabled: true,
        kmsKeyId: kmsKeyId,
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'sun:05:00-sun:07:00',
        autoMinorVersionUpgrade: 'true',
        applyImmediately: false,
        tags: {
          Name: `payment-cache-${environmentSuffix}`,
          Environment: environmentSuffix,
          Compliance: 'PCI-DSS',
        },
        lifecycle: {
          ignoreChanges: ['kms_key_id'],
        },
      }
    );
  }
}
