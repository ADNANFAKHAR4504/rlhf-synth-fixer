import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';

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

    // Create Network Stack
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Create Backup Stack
    const backupStack = new BackupStack(this, 'BackupStack', {
      environmentSuffix,
    });

    // Create Database Stack
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.databaseSecurityGroup,
      backupBucket: backupStack.backupBucket,
      environmentSuffix,
    });

    // Create Monitoring Stack
    new MonitoringStack(this, 'MonitoringStack', {
      database: databaseStack.database,
      environmentSuffix,
    });
  }
}
