import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface BackupStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryDbClusterArn: pulumi.Output<string>;
  primaryProvider: aws.Provider;
  drProvider: aws.Provider;
}

export class BackupStack extends pulumi.ComponentResource {
  public readonly backupPlanId: pulumi.Output<string>;
  public readonly primaryVaultName: pulumi.Output<string>;
  public readonly drVaultName: pulumi.Output<string>;

  constructor(
    name: string,
    args: BackupStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:backup:BackupStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      primaryDbClusterArn,
      primaryProvider,
      drProvider,
    } = args;

    // Generate random suffix to avoid resource name conflicts
    const randomSuffix = new random.RandomString(
      `backup-random-suffix-${environmentSuffix}`,
      {
        length: 8,
        special: false,
        upper: false,
        lower: true,
        numeric: true,
      },
      { parent: this }
    );

    // IAM role for AWS Backup
    const backupRole = new aws.iam.Role(
      `backup-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`backup-role-${environmentSuffix}-${randomSuffix.result}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'backup.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `backup-role-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Attach AWS Backup managed policies
    new aws.iam.RolePolicyAttachment(
      `backup-policy-attachment-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `backup-restore-policy-attachment-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
      },
      { provider: primaryProvider, parent: this }
    );

    // Backup vault in primary region
    const primaryVault = new aws.backup.Vault(
      `primary-backup-vault-${environmentSuffix}`,
      {
        name: pulumi.interpolate`primary-backup-vault-${environmentSuffix}-${randomSuffix.result}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-backup-vault-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Backup vault in DR region for cross-region copies
    const drVault = new aws.backup.Vault(
      `dr-backup-vault-${environmentSuffix}`,
      {
        name: pulumi.interpolate`dr-backup-vault-${environmentSuffix}-${randomSuffix.result}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-backup-vault-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Get AWS account ID for cross-region backup ARN
    const accountId = aws
      .getCallerIdentity({}, { provider: primaryProvider })
      .then(id => id.accountId);

    // Backup plan with cross-region copying
    const backupPlan = new aws.backup.Plan(
      `backup-plan-${environmentSuffix}`,
      {
        name: pulumi.interpolate`backup-plan-${environmentSuffix}-${randomSuffix.result}`,
        rules: [
          {
            ruleName: 'daily-backup',
            targetVaultName: primaryVault.name,
            schedule: 'cron(0 3 * * ? *)',
            startWindow: 60,
            completionWindow: 120,
            lifecycle: {
              deleteAfter: 30,
            },
            recoveryPointTags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              BackupType: 'Automated',
            })),
            copyActions: [
              {
                destinationVaultArn: pulumi.interpolate`arn:aws:backup:us-east-2:${accountId}:backup-vault:${drVault.name}`,
                lifecycle: {
                  deleteAfter: 30,
                },
              },
            ],
          },
          {
            ruleName: 'hourly-backup',
            targetVaultName: primaryVault.name,
            schedule: 'cron(0 * * * ? *)',
            startWindow: 60,
            completionWindow: 120,
            lifecycle: {
              deleteAfter: 1,
            },
            recoveryPointTags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              BackupType: 'Hourly',
            })),
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `backup-plan-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Backup selection to include RDS cluster
    const _backupSelection = new aws.backup.Selection(
      `backup-selection-${environmentSuffix}`,
      {
        name: `backup-selection-${environmentSuffix}`,
        planId: backupPlan.id,
        iamRoleArn: backupRole.arn,
        resources: [primaryDbClusterArn],
        selectionTags: [
          {
            type: 'STRINGEQUALS',
            key: 'DR-Role',
            value: 'primary',
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );
    void _backupSelection;

    this.backupPlanId = backupPlan.id;
    this.primaryVaultName = primaryVault.name;
    this.drVaultName = drVault.name;

    this.registerOutputs({
      backupPlanId: this.backupPlanId,
      primaryVaultName: this.primaryVaultName,
      drVaultName: this.drVaultName,
    });
  }
}
