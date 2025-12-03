import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { RdsGlobalCluster } from '@cdktf/provider-aws/lib/rds-global-cluster';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryVpcId: string;
  secondaryVpcId: string;
  primarySubnetIds: string[];
  secondarySubnetIds: string[];
  primaryDbSecurityGroupId: string;
  secondaryDbSecurityGroupId: string;
}

export class DatabaseConstruct extends Construct {
  public readonly dynamoTableName: string;
  public readonly auroraEndpointPrimary: string;
  public readonly auroraEndpointSecondary: string;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primarySubnetIds,
      secondarySubnetIds,
      primaryDbSecurityGroupId,
      secondaryDbSecurityGroupId,
    } = props;

    // DynamoDB Global Table
    const dynamoTable = new DynamodbTable(this, 'TransactionsTable', {
      provider: primaryProvider,
      name: `transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'transactionId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      replica: [
        {
          regionName: 'us-east-2',
          pointInTimeRecovery: true,
        },
      ],
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      tags: {
        Name: `transactions-${environmentSuffix}`,
      },
    });

    // Aurora Global Database - DB Subnet Groups
    const primarySubnetGroup = new DbSubnetGroup(this, 'PrimaryDBSubnetGroup', {
      provider: primaryProvider,
      name: `dr-db-subnet-primary-${environmentSuffix}`,
      subnetIds: primarySubnetIds,
      tags: {
        Name: `dr-db-subnet-primary-${environmentSuffix}`,
      },
    });

    const secondarySubnetGroup = new DbSubnetGroup(
      this,
      'SecondaryDBSubnetGroup',
      {
        provider: secondaryProvider,
        name: `dr-db-subnet-secondary-${environmentSuffix}`,
        subnetIds: secondarySubnetIds,
        tags: {
          Name: `dr-db-subnet-secondary-${environmentSuffix}`,
        },
      }
    );

    // Aurora Global Cluster
    const globalCluster = new RdsGlobalCluster(this, 'AuroraGlobalCluster', {
      provider: primaryProvider,
      globalClusterIdentifier: `aurora-global-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'transactions',
      storageEncrypted: true,
      deletionProtection: false,
    });

    // Primary Aurora Cluster
    const primaryCluster = new RdsCluster(this, 'PrimaryAuroraCluster', {
      provider: primaryProvider,
      clusterIdentifier: `aurora-primary-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      globalClusterIdentifier: globalCluster.id,
      databaseName: 'transactions',
      masterUsername: 'dbadmin',
      masterPassword: 'TempPassword123!',
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [primaryDbSecurityGroupId],
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: `aurora-primary-${environmentSuffix}`,
      },
    });

    // Primary Aurora Instance
    new RdsClusterInstance(this, 'PrimaryAuroraInstance', {
      provider: primaryProvider,
      identifier: `aurora-primary-instance-${environmentSuffix}`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      publiclyAccessible: false,
      tags: {
        Name: `aurora-primary-instance-${environmentSuffix}`,
      },
    });

    // Secondary Aurora Cluster
    const secondaryCluster = new RdsCluster(this, 'SecondaryAuroraCluster', {
      provider: secondaryProvider,
      clusterIdentifier: `aurora-secondary-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      globalClusterIdentifier: globalCluster.id,
      dbSubnetGroupName: secondarySubnetGroup.name,
      vpcSecurityGroupIds: [secondaryDbSecurityGroupId],
      skipFinalSnapshot: true,
      storageEncrypted: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['postgresql'],
      dependsOn: [primaryCluster],
      tags: {
        Name: `aurora-secondary-${environmentSuffix}`,
      },
    });

    // Secondary Aurora Instance
    new RdsClusterInstance(this, 'SecondaryAuroraInstance', {
      provider: secondaryProvider,
      identifier: `aurora-secondary-instance-${environmentSuffix}`,
      clusterIdentifier: secondaryCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      publiclyAccessible: false,
      tags: {
        Name: `aurora-secondary-instance-${environmentSuffix}`,
      },
    });

    // Export values
    this.dynamoTableName = dynamoTable.name;
    this.auroraEndpointPrimary = primaryCluster.endpoint;
    this.auroraEndpointSecondary = secondaryCluster.endpoint;
  }
}
