/**
 * DynamoDB backup plan for automated daily backups
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface BackupPlanArgs {
  tableArns: pulumi.Input<string>[];
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoBackupPlan extends pulumi.ComponentResource {
  public readonly backupVault: aws.backup.Vault;
  public readonly backupPlan: aws.backup.Plan;

  constructor(
    name: string,
    args: BackupPlanArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:DynamoBackupPlan', name, {}, opts);

    // Create backup vault
    this.backupVault = new aws.backup.Vault(
      `payment-backup-vault-${args.environmentSuffix}`,
      {
        name: `payment-backup-vault-${args.environmentSuffix}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create backup plan
    this.backupPlan = new aws.backup.Plan(
      `payment-backup-plan-${args.environmentSuffix}`,
      {
        name: `payment-backup-plan-${args.environmentSuffix}`,
        rules: [
          {
            ruleName: 'daily-backup',
            targetVaultName: this.backupVault.name,
            schedule: 'cron(0 3 * * ? *)', // 3 AM UTC daily
            lifecycle: {
              deleteAfter: 30,
            },
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create IAM role for backup
    const backupRole = new aws.iam.Role(
      `backup-role-${args.environmentSuffix}`,
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
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `backup-policy-attachment-${args.environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      },
      { parent: this }
    );

    // Create backup selections for DynamoDB tables
    args.tableArns.forEach((tableArn, index) => {
      new aws.backup.Selection(
        `backup-selection-${index}-${args.environmentSuffix}`,
        {
          name: `backup-selection-${index}-${args.environmentSuffix}`,
          planId: this.backupPlan.id,
          iamRoleArn: backupRole.arn,
          resources: [tableArn],
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vaultName: this.backupVault.name,
      planId: this.backupPlan.id,
    });
  }
}
