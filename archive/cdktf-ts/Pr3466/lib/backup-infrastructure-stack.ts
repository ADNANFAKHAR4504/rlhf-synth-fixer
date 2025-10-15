import { BackupFramework } from '@cdktf/provider-aws/lib/backup-framework';
import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupReportPlan } from '@cdktf/provider-aws/lib/backup-report-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupVaultLockConfiguration } from '@cdktf/provider-aws/lib/backup-vault-lock-configuration';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
// Removed CloudwatchLogGroup import - no longer using Lambda functions
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
// Removed Lambda imports to eliminate zip file dependencies
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketInventory } from '@cdktf/provider-aws/lib/s3-bucket-inventory';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketObjectLockConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-object-lock-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { Construct } from 'constructs';

interface BackupInfrastructureStackProps {
  region?: string;
  environmentSuffix?: string;
}

export class BackupInfrastructureStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: BackupInfrastructureStackProps
  ) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix || 'dev';
    // Use provided region or force us-east-1 for consistency
    const region = props.region || 'us-east-1';
    // Create completely unique resource names to avoid conflicts with any existing resources
    const timestampSuffix = Date.now();
    const regionSuffix = region.replace(/-/g, ''); // Convert us-east-1 to useast1
    const uniqueSuffix = `${environmentSuffix.replace(/-/g, '_')}_${regionSuffix}_${timestampSuffix}`;
    const s3UniqueSuffix = `${environmentSuffix}-${regionSuffix}-${timestampSuffix}`; // S3 buckets need hyphens, not underscores

    // Create KMS key for backup encryption in the specified region
    const kmsKey = new KmsKey(this, 'backup-kms-key', {
      description: `KMS key for backup encryption (${region})`,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: {
        Region: region,
        Purpose: 'backup-encryption',
      },
    });

    // Create KMS alias for easier key identification
    new KmsAlias(this, 'backup-kms-alias', {
      name: `alias/backup-encryption-key-${uniqueSuffix}`,
      targetKeyId: kmsKey.id,
    });

    const backupBucket = new S3Bucket(this, 'backup-bucket', {
      bucket: `backup-storage-${s3UniqueSuffix}`,
      objectLockEnabled: true,
      tags: {
        Purpose: 'Backup Storage',
        Environment: 'Production',
      },
    });

    new S3BucketVersioningA(this, 'backup-bucket-versioning', {
      bucket: backupBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketObjectLockConfigurationA(this, 'backup-bucket-lock', {
      bucket: backupBucket.id,
      objectLockEnabled: 'Enabled',
      rule: {
        defaultRetention: {
          mode: 'COMPLIANCE',
          years: 7,
        },
      },
    });

    new S3BucketLifecycleConfiguration(this, 'backup-lifecycle', {
      bucket: backupBucket.id,
      rule: [
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'backup-bucket-pab', {
      bucket: backupBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const inventoryBucket = new S3Bucket(this, 'inventory-bucket', {
      bucket: `backup-inventory-${s3UniqueSuffix}`,
      tags: {
        Purpose: 'Backup Inventory',
        Environment: 'Production',
      },
    });

    new S3BucketInventory(this, 'backup-inventory', {
      bucket: backupBucket.id,
      name: 'daily-inventory',
      includedObjectVersions: 'Current',
      schedule: {
        frequency: 'Daily',
      },
      destination: {
        bucket: {
          bucketArn: inventoryBucket.arn,
          format: 'CSV',
          encryption: {
            sseKms: {
              keyId: kmsKey.arn,
            },
          },
        },
      },
    });

    // DynamoDB table for backup catalog (for manual tracking and reporting)
    new DynamodbTable(this, 'backup-catalog', {
      name: `backup-catalog-${uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'backupId',
      rangeKey: 'clientId',
      attribute: [
        {
          name: 'backupId',
          type: 'S',
        },
        {
          name: 'clientId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'ClientIdIndex',
          hashKey: 'clientId',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      tags: {
        Purpose: 'Backup Catalog',
        Environment: 'Production',
      },
    });

    // SNS topic for backup notifications (for manual alerts and monitoring)
    new SnsTopic(this, 'backup-notifications', {
      name: `backup-notifications-${uniqueSuffix}`,
      displayName: 'Backup System Notifications',
      kmsMasterKeyId: kmsKey.id,
    });

    // Create additional backup vault in same region for redundancy
    // Remove separate provider to avoid cross-provider KMS key reference issues
    const additionalVault = new BackupVault(this, 'additional-backup-vault', {
      name: `additional-${environmentSuffix}-${timestampSuffix}`.substring(
        0,
        50
      ),
      kmsKeyArn: kmsKey.arn,
      tags: {
        Type: 'Additional',
        Environment: 'Production',
        Region: region,
      },
    });

    const backupRole = new IamRole(this, 'backup-service-role', {
      name: `aws-backup-service-role-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'backup.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'backup-service-policy', {
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
    });

    new IamRolePolicyAttachment(this, 'backup-restore-policy', {
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
    });

    const primaryVault = new BackupVault(this, 'primary-backup-vault', {
      name: `primary-${environmentSuffix}-${timestampSuffix}`.substring(0, 50),
      kmsKeyArn: kmsKey.arn,
      tags: {
        Type: 'Primary',
        Environment: 'Production',
      },
    });

    new BackupVaultLockConfiguration(this, 'primary-vault-lock', {
      backupVaultName: primaryVault.name,
      minRetentionDays: 7,
      maxRetentionDays: 2555,
    });

    const airgappedVault = new BackupVault(this, 'airgapped-backup-vault', {
      name: `airgapped-${environmentSuffix}-${timestampSuffix}`.substring(
        0,
        50
      ),
      kmsKeyArn: kmsKey.arn,
      tags: {
        Type: 'AirGapped',
        Environment: 'Production',
      },
    });

    new BackupVaultLockConfiguration(this, 'airgapped-vault-lock', {
      backupVaultName: airgappedVault.name,
      minRetentionDays: 30,
      maxRetentionDays: 365,
    });

    // AWS Backup Audit Manager - Compliance Framework
    new BackupFramework(this, 'backup-audit-framework', {
      name: `backup_compliance_framework_${uniqueSuffix}`,
      description: 'Compliance framework for backup audit and governance',
      control: [
        {
          name: 'BACKUP_PLAN_MIN_FREQUENCY_AND_MIN_RETENTION_CHECK',
          inputParameter: [
            {
              name: 'requiredFrequencyUnit',
              value: 'days',
            },
            {
              name: 'requiredFrequencyValue',
              value: '1',
            },
            {
              name: 'requiredRetentionDays',
              value: '7',
            },
          ],
        },
        {
          name: 'BACKUP_RECOVERY_POINT_MINIMUM_RETENTION_CHECK',
          inputParameter: [
            {
              name: 'requiredRetentionDays',
              value: '7',
            },
          ],
        },
        {
          name: 'BACKUP_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
          scope: {
            complianceResourceTypes: ['S3', 'DynamoDB'],
          },
        },
        {
          name: 'BACKUP_RECOVERY_POINT_ENCRYPTED',
        },
        {
          name: 'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED',
        },
        {
          name: 'BACKUP_RESOURCES_PROTECTED_BY_BACKUP_VAULT_LOCK',
          inputParameter: [
            {
              name: 'minRetentionDays',
              value: '7',
            },
            {
              name: 'maxRetentionDays',
              value: '2555',
            },
          ],
        },
      ],
      tags: {
        Purpose: 'BackupAudit',
        Environment: 'Production',
      },
    });

    // Backup Audit Report Plan
    const auditReportBucket = new S3Bucket(this, 'audit-report-bucket', {
      bucket: `backup-audit-reports-${s3UniqueSuffix}`,
      tags: {
        Purpose: 'Backup Audit Reports',
        Environment: 'Production',
      },
    });

    new S3BucketPublicAccessBlock(this, 'audit-bucket-pab', {
      bucket: auditReportBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new BackupReportPlan(this, 'backup-audit-report', {
      name: `backup_compliance_report_${uniqueSuffix}`,
      description: 'Daily backup compliance audit report',
      reportDeliveryChannel: {
        s3BucketName: auditReportBucket.id,
        formats: ['CSV', 'JSON'],
        s3KeyPrefix: 'audit-reports',
      },
      reportSetting: {
        reportTemplate: 'BACKUP_JOB_REPORT',
      },
      tags: {
        Purpose: 'ComplianceReporting',
        Environment: 'Production',
      },
    });

    const backupPlan = new BackupPlan(this, 'daily-backup-plan', {
      name: `daily-backup-plan-${uniqueSuffix}`,
      rule: [
        {
          ruleName: 'daily-backup-rule',
          targetVaultName: primaryVault.name,
          schedule: 'cron(0 2 * * ? *)',
          startWindow: 60,
          completionWindow: 120,
          lifecycle: {
            deleteAfter: 2555,
            coldStorageAfter: 90,
          },
          recoveryPointTags: {
            Type: 'Daily',
            Environment: 'Production',
          },
        },
        {
          ruleName: 'critical-backup-rule',
          targetVaultName: airgappedVault.name,
          schedule: 'cron(0 4 * * ? *)',
          startWindow: 60,
          completionWindow: 120,
          lifecycle: {
            deleteAfter: 365,
          },
          copyAction: [
            {
              destinationVaultArn: airgappedVault.arn,
              lifecycle: {
                deleteAfter: 120, // Must be at least 90 days after cold storage
              },
            },
          ],
          recoveryPointTags: {
            Type: 'Critical',
            Environment: 'Production',
          },
        },
        {
          ruleName: 'cross-region-backup-rule',
          targetVaultName: primaryVault.name,
          schedule: 'cron(0 6 * * ? *)',
          startWindow: 60,
          completionWindow: 180,
          lifecycle: {
            deleteAfter: 90,
          },
          copyAction: [
            {
              destinationVaultArn: additionalVault.arn,
              lifecycle: {
                deleteAfter: 120, // Must be at least 90 days after cold storage (30 + 90 = 120)
                coldStorageAfter: 30,
              },
            },
          ],
          recoveryPointTags: {
            Type: 'AdditionalRegion',
            Environment: 'Production',
            TargetRegion: region,
          },
        },
      ],
    });

    new BackupSelection(this, 'backup-selection', {
      name: `backup-resources-${uniqueSuffix}`,
      iamRoleArn: backupRole.arn,
      planId: backupPlan.id,
      resources: [backupBucket.arn],
      selectionTag: [
        {
          type: 'STRINGEQUALS',
          key: 'Backup',
          value: 'true',
        },
      ],
    });

    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/Backup', 'NumberOfBackupJobsCompleted', { stat: 'Sum' }],
              ['.', 'NumberOfBackupJobsFailed', { stat: 'Sum' }],
              ['.', 'NumberOfBackupJobsCreated', { stat: 'Sum' }],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'Backup Job Status',
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [['AWS/S3', 'BucketSizeBytes']],
            period: 86400,
            stat: 'Average',
            region: props.region,
            title: 'Backup Storage Metrics',
          },
        },
      ],
    };

    new CloudwatchDashboard(this, 'backup-dashboard', {
      dashboardName: `backup-monitoring-dashboard-${uniqueSuffix}`,
      dashboardBody: JSON.stringify(dashboardBody),
    });

    for (let i = 1; i <= 10; i++) {
      const clientRole = new IamRole(this, `client-role-${i}`, {
        name: `backup-client-role-${i}-${uniqueSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      });

      const clientPolicyDoc = new DataAwsIamPolicyDocument(
        this,
        `client-policy-doc-${i}`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              resources: [`${backupBucket.arn}/client-${i}/*`],
            },
            {
              effect: 'Allow',
              actions: ['s3:ListBucket'],
              resources: [backupBucket.arn],
              condition: [
                {
                  test: 'StringLike',
                  variable: 's3:prefix',
                  values: [`client-${i}/*`],
                },
              ],
            },
          ],
        }
      );

      new IamRolePolicy(this, `client-policy-${i}`, {
        name: `backup-client-policy-${i}-${uniqueSuffix}`,
        role: clientRole.id,
        policy: clientPolicyDoc.json,
      });
    }
  }
}
