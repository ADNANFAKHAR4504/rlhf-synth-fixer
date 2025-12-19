import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { Construct } from 'constructs';

export interface RdsStackProps {
  environmentSuffix: string;
  privateSubnet1: Subnet;
  privateSubnet2: Subnet;
  securityGroup: SecurityGroup;
  kmsKey: KmsKey;
  dbSecret: SecretsmanagerSecret;
  dbUsername: string;
  dbPassword: string;
}

export class RdsStack extends Construct {
  public readonly cluster: RdsCluster;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      privateSubnet1,
      privateSubnet2,
      securityGroup,
      kmsKey,
      dbUsername,
      dbPassword,
    } = props;

    // Create DB Subnet Group
    const subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `assessment-db-subnet-${environmentSuffix}`,
      description: 'Subnet group for assessment RDS cluster',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `assessment-db-subnet-${environmentSuffix}`,
      },
    });

    // Create Aurora Serverless v2 Cluster (PostgreSQL)
    this.cluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `assessment-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.4',
      databaseName: 'assessmentdb',
      masterUsername: dbUsername,
      masterPassword: dbPassword,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [securityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0,
      },
      tags: {
        Name: `assessment-cluster-${environmentSuffix}`,
      },
    });

    // Create Aurora Serverless v2 Instance (PostgreSQL)
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `assessment-instance-1-${environmentSuffix}`,
      clusterIdentifier: this.cluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      tags: {
        Name: `assessment-instance-1-${environmentSuffix}`,
      },
    });
  }
}
