import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface BackupStackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
}

export class BackupStack extends Construct {
  public readonly backupVault?: backup.BackupVault;

  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id);

    const { environmentSuffix, region, isPrimary } = props;

    // Detect LocalStack environment (account ID 000000000000 or AWS_ENDPOINT_URL set)
    const isLocalStack =
      cdk.Stack.of(this).account === '000000000000' ||
      process.env.AWS_ENDPOINT_URL !== undefined;

    // Skip AWS Backup resources in LocalStack as they are not fully supported
    if (isLocalStack) {
      // Add a note that backup is skipped
      new cdk.CfnOutput(this, 'BackupStatus', {
        value: 'Skipped (LocalStack does not fully support AWS Backup)',
        description: 'Backup Configuration Status',
      });
      return;
    }

    // SNS Topic for backup notifications
    const backupTopic = new sns.Topic(this, 'BackupNotificationTopic', {
      topicName: `TapStack${environmentSuffix}BackupNotifications${region}`,
      displayName: 'AWS Backup Notifications',
    });

    // Backup Vault
    this.backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: `TapStack${environmentSuffix}Vault${region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      notificationTopic: backupTopic,
      notificationEvents: [
        backup.BackupVaultEvents.BACKUP_JOB_COMPLETED,
        backup.BackupVaultEvents.BACKUP_JOB_FAILED,
        backup.BackupVaultEvents.RESTORE_JOB_COMPLETED,
        backup.BackupVaultEvents.RESTORE_JOB_FAILED,
      ],
    });

    // Only create backup plan in primary region
    if (isPrimary) {
      // Backup Plan
      const plan = backup.BackupPlan.dailyWeeklyMonthly5YearRetention(
        this,
        'BackupPlan',
        this.backupVault
      );

      // Backup Selection
      plan.addSelection('BackupSelection', {
        backupSelectionName: `TapStack${environmentSuffix}Selection`,
        resources: [backup.BackupResource.fromTag('BackupEnabled', 'true')],
      });

      new cdk.CfnOutput(this, 'BackupPlanId', {
        value: plan.backupPlanId,
        description: 'Backup Plan ID',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BackupVaultName', {
      value: this.backupVault.backupVaultName,
      description: 'Backup Vault Name',
    });

    new cdk.CfnOutput(this, 'BackupVaultArn', {
      value: this.backupVault.backupVaultArn,
      description: 'Backup Vault ARN',
    });
  }
}
