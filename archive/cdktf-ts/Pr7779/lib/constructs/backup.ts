import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

export interface BackupConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryRegion: string;
  secondaryRegion: string;
}

export class BackupConstruct extends Construct {
  constructor(scope: Construct, id: string, props: BackupConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      // primaryRegion and secondaryRegion are not directly used but define vault locations via providers
    } = props;

    // Primary Region Backup Vault
    const primaryVault = new BackupVault(this, 'PrimaryBackupVault', {
      provider: primaryProvider,
      name: `dr-backup-vault-primary-${environmentSuffix}`,
      tags: {
        Name: `dr-backup-vault-primary-${environmentSuffix}`,
      },
    });

    // Secondary Region Backup Vault
    const secondaryVault = new BackupVault(this, 'SecondaryBackupVault', {
      provider: secondaryProvider,
      name: `dr-backup-vault-secondary-${environmentSuffix}`,
      tags: {
        Name: `dr-backup-vault-secondary-${environmentSuffix}`,
      },
    });

    // Backup IAM Role
    const backupRole = new IamRole(this, 'BackupRole', {
      provider: primaryProvider,
      name: `backup-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'backup.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `backup-role-${environmentSuffix}`,
      },
    });

    // Attach AWS Backup service role policies
    new IamRolePolicyAttachment(this, 'BackupRolePolicy', {
      provider: primaryProvider,
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
    });

    new IamRolePolicyAttachment(this, 'BackupRestoreRolePolicy', {
      provider: primaryProvider,
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
    });

    // Backup Plan with Cross-Region Copy
    const backupPlan = new BackupPlan(this, 'BackupPlan', {
      provider: primaryProvider,
      name: `dr-backup-plan-${environmentSuffix}`,
      rule: [
        {
          ruleName: 'daily-backup',
          targetVaultName: primaryVault.name,
          schedule: 'cron(0 2 * * ? *)',
          startWindow: 60,
          completionWindow: 120,
          lifecycle: {
            deleteAfter: 7,
          },
          copyAction: [
            {
              destinationVaultArn: secondaryVault.arn,
              lifecycle: {
                deleteAfter: 7,
              },
            },
          ],
        },
      ],
      tags: {
        Name: `dr-backup-plan-${environmentSuffix}`,
      },
    });

    // Backup Selection - EBS Volumes
    new BackupSelection(this, 'BackupSelection', {
      provider: primaryProvider,
      name: `dr-backup-selection-${environmentSuffix}`,
      planId: backupPlan.id,
      iamRoleArn: backupRole.arn,
      selectionTag: [
        {
          type: 'STRINGEQUALS',
          key: 'Backup',
          value: 'true',
        },
      ],
    });
  }
}
