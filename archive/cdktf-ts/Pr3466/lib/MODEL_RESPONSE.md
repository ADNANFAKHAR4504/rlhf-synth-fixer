# AWS Backup Infrastructure

Here's the infrastructure code for the backup management system:

## lib/backup-infrastructure-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketObjectLockConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-object-lock-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketInventory } from '@cdktf/provider-aws/lib/s3-bucket-inventory';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupVaultLockConfiguration } from '@cdktf/provider-aws/lib/backup-vault-lock-configuration';
import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { BackupFramework } from '@cdktf/provider-aws/lib/backup-framework';
import { BackupReportPlan } from '@cdktf/provider-aws/lib/backup-report-plan';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

interface BackupInfrastructureStackProps {
  region: string;
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

    const kmsKey = new KmsKey(this, 'backup-kms-key', {
      description: 'KMS key for backup encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 30,
    });

    new KmsAlias(this, 'backup-kms-alias', {
      name: `alias/backup-encryption-key-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    const backupBucket = new S3Bucket(this, 'backup-bucket', {
      bucket: `backup-storage-${environmentSuffix}-${Date.now()}`,
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
      bucket: `backup-inventory-${environmentSuffix}-${Date.now()}`,
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

    const backupTable = new DynamodbTable(this, 'backup-catalog', {
      name: `backup-catalog-${environmentSuffix}`,
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

    const backupNotificationTopic = new SnsTopic(this, 'backup-notifications', {
      name: `backup-notifications-${environmentSuffix}`,
      displayName: 'Backup System Notifications',
      kmsMasterKeyId: kmsKey.id,
    });

    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      name: `backup-verification-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const lambdaPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'lambda-policy-doc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
            resources: [backupBucket.arn, `${backupBucket.arn}/*`],
          },
          {
            effect: 'Allow',
            actions: [
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:GetItem',
            ],
            resources: [backupTable.arn],
          },
          {
            effect: 'Allow',
            actions: ['sns:Publish'],
            resources: [backupNotificationTopic.arn],
          },
          {
            effect: 'Allow',
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: [kmsKey.arn],
          },
        ],
      }
    );

    new IamRolePolicy(this, 'lambda-execution-policy', {
      name: `backup-verification-lambda-policy-${environmentSuffix}`,
      role: lambdaRole.id,
      policy: lambdaPolicyDoc.json,
    });

    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-logs', {
      name: `/aws/lambda/backup-verification-${environmentSuffix}`,
      retentionInDays: 30,
    });

    const verificationLambda = new LambdaFunction(this, 'backup-verification', {
      functionName: `backup-verification-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      timeout: 300,
      memorySize: 1024,
      filename: 'lambda.zip',
      environment: {
        variables: {
          DYNAMODB_TABLE: backupTable.name,
          SNS_TOPIC_ARN: backupNotificationTopic.arn,
          BACKUP_BUCKET: backupBucket.id,
        },
      },
      dependsOn: [lambdaLogGroup],
    });

    new LambdaPermission(this, 's3-invoke-lambda', {
      statementId: 'AllowS3Invoke',
      action: 'lambda:InvokeFunction',
      functionName: verificationLambda.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: backupBucket.arn,
    });

    // Cross-region restore testing Lambda
    const restoreTestRole = new IamRole(this, 'restore-test-role', {
      name: `cross-region-restore-test-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'restore-test-basic-execution', {
      role: restoreTestRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const restoreTestPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'restore-test-policy-doc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: [
              'backup:DescribeBackupVault',
              'backup:DescribeRecoveryPoint',
              'backup:StartRestoreJob',
              'backup:DescribeRestoreJob',
              'backup:ListRecoveryPointsByBackupVault',
            ],
            resources: ['*'],
          },
          {
            effect: 'Allow',
            actions: ['sns:Publish'],
            resources: [backupNotificationTopic.arn],
          },
          {
            effect: 'Allow',
            actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [backupTable.arn],
          },
        ],
      }
    );

    new IamRolePolicy(this, 'restore-test-policy', {
      name: `cross-region-restore-test-policy-${environmentSuffix}`,
      role: restoreTestRole.id,
      policy: restoreTestPolicyDoc.json,
    });

    const restoreTestLogGroup = new CloudwatchLogGroup(this, 'restore-test-logs', {
      name: `/aws/lambda/cross-region-restore-test-${environmentSuffix}`,
      retentionInDays: 30,
    });

    // Configure cross-region provider for us-west-2
    new AwsProvider(this, 'aws-west-2', {
      alias: 'west2',
      region: 'us-west-2',
    });

    // Create cross-region backup vault in us-west-2
    const crossRegionVault = new BackupVault(this, 'cross-region-backup-vault', {
      name: `cross-region-backup-vault-${environmentSuffix}`,
      kmsKeyArn: kmsKey.arn,
      provider: 'aws.west2',
      tags: {
        Type: 'CrossRegion',
        Environment: 'Production',
        Region: 'us-west-2',
      },
    });

    const restoreTestLambda = new LambdaFunction(this, 'restore-test-lambda', {
      functionName: `cross-region-restore-test-${environmentSuffix}`,
      role: restoreTestRole.arn,
      handler: 'restore.handler',
      runtime: 'nodejs18.x',
      timeout: 900,
      memorySize: 512,
      filename: 'lambda.zip',
      environment: {
        variables: {
          DYNAMODB_TABLE: backupTable.name,
          SNS_TOPIC_ARN: backupNotificationTopic.arn,
          CROSS_REGION_VAULT: crossRegionVault.name,
          TARGET_REGION: 'us-west-2',
        },
      },
      dependsOn: [restoreTestLogGroup],
    });

    const backupRole = new IamRole(this, 'backup-service-role', {
      name: `aws-backup-service-role-${environmentSuffix}`,
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
      name: `primary-backup-vault-${environmentSuffix}`,
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
      name: `airgapped-backup-vault-${environmentSuffix}`,
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
    const backupAuditFramework = new BackupFramework(this, 'backup-audit-framework', {
      name: `backup-compliance-framework-${environmentSuffix}`,
      description: 'Compliance framework for backup audit and governance',
      control: [
        {
          name: 'BACKUP_PLAN_MIN_FREQUENCY_AND_MIN_RETENTION_CHECK',
          inputParameter: [
            {
              name: 'requiredFrequencyUnit',
              value: 'DAILY',
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
            resourceTypes: ['S3', 'DynamoDB'],
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
      bucket: `backup-audit-reports-${environmentSuffix}-${Date.now()}`,
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

    const backupReportPlan = new BackupReportPlan(this, 'backup-audit-report', {
      name: `backup-compliance-report-${environmentSuffix}`,
      description: 'Daily backup compliance audit report',
      reportDeliveryChannel: {
        s3BucketName: auditReportBucket.id,
        formats: ['CSV', 'JSON'],
        s3KeyPrefix: 'audit-reports/',
      },
      reportSetting: {
        reportTemplate: 'BACKUP_JOB_REPORT',
        frameworkArns: [backupAuditFramework.arn],
        numberOfFrameworks: 1,
      },
      tags: {
        Purpose: 'ComplianceReporting',
        Environment: 'Production',
      },
    });

    const backupPlan = new BackupPlan(this, 'daily-backup-plan', {
      name: `daily-backup-plan-${environmentSuffix}`,
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
                deleteAfter: 30,
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
              destinationVaultArn: crossRegionVault.arn,
              lifecycle: {
                deleteAfter: 60,
                coldStorageAfter: 30,
              },
            },
          ],
          recoveryPointTags: {
            Type: 'CrossRegion',
            Environment: 'Production',
            TargetRegion: 'us-west-2',
          },
        },
      ],
    });

    new BackupSelection(this, 'backup-selection', {
      name: `backup-resources-${environmentSuffix}`,
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
            metrics: [
              [
                'AWS/S3',
                'BucketSizeBytes',
                {
                  dimensions: { BucketName: backupBucket.id },
                  stat: 'Average',
                },
              ],
              [
                '.',
                'NumberOfObjects',
                {
                  dimensions: { BucketName: backupBucket.id },
                  stat: 'Average',
                },
              ],
            ],
            period: 86400,
            stat: 'Average',
            region: props.region,
            title: 'Backup Storage Metrics',
          },
        },
      ],
    };

    new CloudwatchDashboard(this, 'backup-dashboard', {
      dashboardName: `backup-monitoring-dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify(dashboardBody),
    });

    for (let i = 1; i <= 10; i++) {
      const clientRole = new IamRole(this, `client-role-${i}`, {
        name: `backup-client-role-${i}-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                AWS: 'arn:aws:iam::123456789012:root',
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
        name: `backup-client-policy-${i}-${environmentSuffix}`,
        role: clientRole.id,
        policy: clientPolicyDoc.json,
      });
    }
  }
}
```

This creates a comprehensive backup infrastructure with S3 buckets, DynamoDB table, Lambda functions for verification, backup vaults, audit framework, and cross-region capabilities. The system includes 7-year retention with object lock, KMS encryption, and automated compliance reporting.