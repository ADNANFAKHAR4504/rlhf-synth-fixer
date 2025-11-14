import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './stacks/network-stack';
import { KmsStack } from './stacks/kms-stack';
import { DatabaseStack } from './stacks/database-stack';
import { StorageStack } from './stacks/storage-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { BackupStack } from './stacks/backup-stack';

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

    // KMS keys for encryption
    const kms = new KmsStack(this, `Kms-${environmentSuffix}`, {
      environmentSuffix,
    });

    // Network infrastructure
    const network = new NetworkStack(this, `Network-${environmentSuffix}`, {
      environmentSuffix,
    });

    // Monitoring and SNS
    const monitoring = new MonitoringStack(
      this,
      `Monitoring-${environmentSuffix}`,
      {
        environmentSuffix,
      }
    );

    // Database
    const database = new DatabaseStack(this, `Database-${environmentSuffix}`, {
      environmentSuffix,
      vpc: network.vpc,
      kmsKey: kms.key,
    });

    // Storage
    const storage = new StorageStack(this, `Storage-${environmentSuffix}`, {
      environmentSuffix,
      kmsKey: kms.key,
      isPrimary: false,
    });

    // Compute
    new ComputeStack(this, `Compute-${environmentSuffix}`, {
      environmentSuffix,
      vpc: network.vpc,
      dynamoTable: storage.dynamoTable,
      alarmTopic: monitoring.alarmTopic,
    });

    // Backups
    new BackupStack(this, `Backup-${environmentSuffix}`, {
      environmentSuffix,
      dbCluster: database.cluster,
      dynamoTable: storage.dynamoTable,
    });
  }
}
