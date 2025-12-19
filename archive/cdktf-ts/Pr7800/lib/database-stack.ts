import { Construct } from 'constructs';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

export interface DatabaseStackProps {
  environmentSuffix: string;
  privateSubnets: Subnet[];
  securityGroup: SecurityGroup;
  kmsKey: KmsKey;
}

export class DatabaseStack extends Construct {
  public readonly cluster: RdsCluster;
  public readonly clusterEndpoint: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const { environmentSuffix, privateSubnets, securityGroup, kmsKey } = props;

    // Create DB subnet group
    const subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `trading-db-subnet-${environmentSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `trading-db-subnet-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Aurora Serverless v2 cluster
    this.cluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `trading-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.14',
      databaseName: 'tradingdb',
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123!', // In production, use Secrets Manager
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [securityGroup.id],
      backupRetentionPeriod: 1,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        maxCapacity: 2,
        minCapacity: 0.5,
      },
      tags: {
        Name: `trading-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create cluster instances (serverless v2)
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `trading-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: this.cluster.id,
      instanceClass: 'db.serverless',
      engine: this.cluster.engine,
      engineVersion: this.cluster.engineVersion,
      publiclyAccessible: false,
      tags: {
        Name: `trading-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.clusterEndpoint = this.cluster.endpoint;
  }
}
