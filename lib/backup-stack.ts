import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface BackupStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  clusterArn: pulumi.Input<string>;
}

export class BackupStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: BackupStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:backup:BackupStack', name, args, opts);

    const { environmentSuffix, tags, clusterArn } = args;

    // Backup vault
    const backupVault = new aws.backup.Vault(
      `payment-backup-vault-${environmentSuffix}`,
      {
        name: `payment-backup-vault-${environmentSuffix}`,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-vault-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DR vault in us-west-2 (must be created before backup plan to reference its ARN)
    const drProvider = new aws.Provider(
      `dr-provider-${environmentSuffix}`,
      {
        region: 'us-west-2',
      },
      { parent: this }
    );

    const drBackupVault = new aws.backup.Vault(
      `payment-backup-vault-${environmentSuffix}-dr`,
      {
        name: `payment-backup-vault-${environmentSuffix}-dr`,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-vault-${environmentSuffix}-dr`,
          Region: 'us-west-2',
        })),
      },
      { parent: this, provider: drProvider }
    );

    // Backup plan
    const backupPlan = new aws.backup.Plan(
      `payment-backup-plan-${environmentSuffix}`,
      {
        name: `payment-backup-plan-${environmentSuffix}`,
        rules: [
          {
            ruleName: 'DailyBackup',
            targetVaultName: backupVault.name,
            schedule: 'cron(0 2 * * ? *)',
            lifecycle: {
              deleteAfter: 30,
            },
            copyActions: [
              {
                destinationVaultArn: drBackupVault.arn,
                lifecycle: {
                  deleteAfter: 30,
                },
              },
            ],
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-plan-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Backup role
    const backupRole = new aws.iam.Role(
      `payment-backup-role-${environmentSuffix}`,
      {
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
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed backup policy
    new aws.iam.RolePolicyAttachment(
      `payment-backup-policy-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-backup-restore-policy-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
      },
      { parent: this }
    );

    // Backup selection
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const backupSelection = new aws.backup.Selection(
      `payment-backup-selection-${environmentSuffix}`,
      {
        name: `payment-rds-selection-${environmentSuffix}`,
        planId: backupPlan.id,
        iamRoleArn: backupRole.arn,
        resources: [clusterArn],
      },
      { parent: this }
    );

    this.registerOutputs({
      backupVaultName: backupVault.name,
      backupPlanId: backupPlan.id,
      drBackupVaultName: drBackupVault.name,
    });
  }
}
