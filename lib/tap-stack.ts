import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './stacks/network-stack';
import { KmsStack } from './stacks/kms-stack';
import { DatabaseStack } from './stacks/database-stack';
import { StorageStack } from './stacks/storage-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { BackupStack } from './stacks/backup-stack';
import { FailoverStack } from './stacks/failover-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';

    // KMS keys for encryption
    const primaryKms = new KmsStack(this, `KmsPrimary-${environmentSuffix}`, {
      environmentSuffix,
      env: { region: primaryRegion },
    });

    const secondaryKms = new KmsStack(
      this,
      `KmsSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: secondaryRegion },
      }
    );

    // Network infrastructure
    const primaryNetwork = new NetworkStack(
      this,
      `NetworkPrimary-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    const secondaryNetwork = new NetworkStack(
      this,
      `NetworkSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: secondaryRegion },
      }
    );

    // Monitoring and SNS
    const primaryMonitoring = new MonitoringStack(
      this,
      `MonitoringPrimary-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    const secondaryMonitoring = new MonitoringStack(
      this,
      `MonitoringSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: secondaryRegion },
      }
    );

    // Databases
    const primaryDatabase = new DatabaseStack(
      this,
      `DatabasePrimary-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: primaryNetwork.vpc,
        kmsKey: primaryKms.key,
        env: { region: primaryRegion },
      }
    );

    const secondaryDatabase = new DatabaseStack(
      this,
      `DatabaseSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: secondaryNetwork.vpc,
        kmsKey: secondaryKms.key,
        env: { region: secondaryRegion },
      }
    );

    // Storage with replication
    const primaryStorage = new StorageStack(
      this,
      `StoragePrimary-${environmentSuffix}`,
      {
        environmentSuffix,
        kmsKey: primaryKms.key,
        secondaryRegion: secondaryRegion,
        isPrimary: true,
        env: { region: primaryRegion },
      }
    );
    // Primary storage depends on secondary KMS for SSM parameter lookup
    primaryStorage.addDependency(secondaryKms);

    const secondaryStorage = new StorageStack(
      this,
      `StorageSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        kmsKey: secondaryKms.key,
        isPrimary: false,
        env: { region: secondaryRegion },
      }
    );

    // Compute
    const primaryCompute = new ComputeStack(
      this,
      `ComputePrimary-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: primaryNetwork.vpc,
        dynamoTable: primaryStorage.dynamoTable,
        alarmTopic: primaryMonitoring.alarmTopic,
        env: { region: primaryRegion },
      }
    );

    const secondaryCompute = new ComputeStack(
      this,
      `ComputeSecondary-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: secondaryNetwork.vpc,
        dynamoTable: secondaryStorage.dynamoTable,
        alarmTopic: secondaryMonitoring.alarmTopic,
        env: { region: secondaryRegion },
      }
    );

    // Backups
    new BackupStack(this, `BackupPrimary-${environmentSuffix}`, {
      environmentSuffix,
      dbCluster: primaryDatabase.cluster,
      dynamoTable: primaryStorage.dynamoTable,
      env: { region: primaryRegion },
    });

    new BackupStack(this, `BackupSecondary-${environmentSuffix}`, {
      environmentSuffix,
      dbCluster: secondaryDatabase.cluster,
      dynamoTable: secondaryStorage.dynamoTable,
      env: { region: secondaryRegion },
    });

    // Failover orchestration
    const failoverStack = new FailoverStack(
      this,
      `Failover-${environmentSuffix}`,
      {
        environmentSuffix,
        primaryAlbDns: primaryCompute.albDnsName,
        secondaryRegion: secondaryRegion,
        alarmTopic: primaryMonitoring.alarmTopic,
        env: { region: primaryRegion },
      }
    );
    // Failover stack depends on secondary compute for SSM parameter lookup
    failoverStack.addDependency(secondaryCompute);
  }
}
