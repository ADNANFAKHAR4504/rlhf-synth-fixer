import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';

export interface ElastiCacheStackProps {
  environmentSuffix: string;
  privateSubnet1: Subnet;
  privateSubnet2: Subnet;
  securityGroup: SecurityGroup;
  kmsKey: KmsKey;
}

export class ElastiCacheStack extends Construct {
  public readonly replicationGroup: ElasticacheReplicationGroup;

  constructor(scope: Construct, id: string, props: ElastiCacheStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      privateSubnet1,
      privateSubnet2,
      securityGroup,
      kmsKey,
    } = props;

    // Create ElastiCache Subnet Group
    const subnetGroup = new ElasticacheSubnetGroup(this, 'redis-subnet-group', {
      name: `assessment-redis-subnet-${environmentSuffix}`,
      description: 'Subnet group for assessment Redis cluster',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `assessment-redis-subnet-${environmentSuffix}`,
      },
    });

    // Create ElastiCache Redis Replication Group
    this.replicationGroup = new ElasticacheReplicationGroup(
      this,
      'redis-cluster',
      {
        replicationGroupId: `assessment-redis-${environmentSuffix}`,
        description: 'Redis cluster for assessment data caching',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.t3.micro',
        numCacheClusters: 2,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        subnetGroupName: subnetGroup.name,
        securityGroupIds: [securityGroup.id],
        atRestEncryptionEnabled: 'true',
        kmsKeyId: kmsKey.arn,
        transitEncryptionEnabled: true,
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'sun:05:00-sun:07:00',
        autoMinorVersionUpgrade: 'true',
        tags: {
          Name: `assessment-redis-${environmentSuffix}`,
        },
      }
    );
  }
}
