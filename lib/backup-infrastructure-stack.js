"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupInfrastructureStack = void 0;
const backup_framework_1 = require("@cdktf/provider-aws/lib/backup-framework");
const backup_plan_1 = require("@cdktf/provider-aws/lib/backup-plan");
const backup_report_plan_1 = require("@cdktf/provider-aws/lib/backup-report-plan");
const backup_selection_1 = require("@cdktf/provider-aws/lib/backup-selection");
const backup_vault_1 = require("@cdktf/provider-aws/lib/backup-vault");
const backup_vault_lock_configuration_1 = require("@cdktf/provider-aws/lib/backup-vault-lock-configuration");
const cloudwatch_dashboard_1 = require("@cdktf/provider-aws/lib/cloudwatch-dashboard");
// Removed CloudwatchLogGroup import - no longer using Lambda functions
const data_aws_iam_policy_document_1 = require("@cdktf/provider-aws/lib/data-aws-iam-policy-document");
const dynamodb_table_1 = require("@cdktf/provider-aws/lib/dynamodb-table");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_1 = require("@cdktf/provider-aws/lib/iam-role-policy");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const kms_alias_1 = require("@cdktf/provider-aws/lib/kms-alias");
const kms_key_1 = require("@cdktf/provider-aws/lib/kms-key");
// Removed Lambda imports to eliminate zip file dependencies
const provider_1 = require("@cdktf/provider-aws/lib/provider");
const s3_bucket_1 = require("@cdktf/provider-aws/lib/s3-bucket");
const s3_bucket_inventory_1 = require("@cdktf/provider-aws/lib/s3-bucket-inventory");
const s3_bucket_lifecycle_configuration_1 = require("@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration");
const s3_bucket_object_lock_configuration_1 = require("@cdktf/provider-aws/lib/s3-bucket-object-lock-configuration");
const s3_bucket_public_access_block_1 = require("@cdktf/provider-aws/lib/s3-bucket-public-access-block");
const s3_bucket_versioning_1 = require("@cdktf/provider-aws/lib/s3-bucket-versioning");
const sns_topic_1 = require("@cdktf/provider-aws/lib/sns-topic");
const constructs_1 = require("constructs");
class BackupInfrastructureStack extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const environmentSuffix = props.environmentSuffix || 'dev';
        // Create completely unique resource names to avoid conflicts with any existing resources
        const timestampSuffix = Date.now();
        const uniqueSuffix = `${environmentSuffix.replace(/-/g, '_')}_useast1_${timestampSuffix}`;
        const s3UniqueSuffix = `${environmentSuffix}-useast1-${timestampSuffix}`; // S3 buckets need hyphens, not underscores
        const kmsKey = new kms_key_1.KmsKey(this, 'backup-kms-key', {
            description: 'KMS key for backup encryption',
            enableKeyRotation: true,
            deletionWindowInDays: 30,
        });
        new kms_alias_1.KmsAlias(this, 'backup-kms-alias', {
            name: `alias/backup-encryption-key-${uniqueSuffix}`,
            targetKeyId: kmsKey.keyId,
        });
        const backupBucket = new s3_bucket_1.S3Bucket(this, 'backup-bucket', {
            bucket: `backup-storage-${s3UniqueSuffix}`,
            objectLockEnabled: true,
            tags: {
                Purpose: 'Backup Storage',
                Environment: 'Production',
            },
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, 'backup-bucket-versioning', {
            bucket: backupBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        });
        new s3_bucket_object_lock_configuration_1.S3BucketObjectLockConfigurationA(this, 'backup-bucket-lock', {
            bucket: backupBucket.id,
            objectLockEnabled: 'Enabled',
            rule: {
                defaultRetention: {
                    mode: 'COMPLIANCE',
                    years: 7,
                },
            },
        });
        new s3_bucket_lifecycle_configuration_1.S3BucketLifecycleConfiguration(this, 'backup-lifecycle', {
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
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, 'backup-bucket-pab', {
            bucket: backupBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
        const inventoryBucket = new s3_bucket_1.S3Bucket(this, 'inventory-bucket', {
            bucket: `backup-inventory-${s3UniqueSuffix}`,
            tags: {
                Purpose: 'Backup Inventory',
                Environment: 'Production',
            },
        });
        new s3_bucket_inventory_1.S3BucketInventory(this, 'backup-inventory', {
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
        new dynamodb_table_1.DynamodbTable(this, 'backup-catalog', {
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
        new sns_topic_1.SnsTopic(this, 'backup-notifications', {
            name: `backup-notifications-${uniqueSuffix}`,
            displayName: 'Backup System Notifications',
            kmsMasterKeyId: kmsKey.id,
        });
        // Configure additional provider for consistency (all us-east-1)
        const additionalProvider = new provider_1.AwsProvider(this, 'aws-additional', {
            alias: 'additional',
            region: 'us-east-1',
        });
        // Create additional backup vault in us-east-1 for redundancy
        const additionalVault = new backup_vault_1.BackupVault(this, 'additional-backup-vault', {
            name: `additional-${environmentSuffix}-${timestampSuffix}`.substring(0, 50),
            provider: additionalProvider,
            kmsKeyArn: kmsKey.arn,
            tags: {
                Type: 'Additional',
                Environment: 'Production',
                Region: 'us-east-1',
            },
        });
        const backupRole = new iam_role_1.IamRole(this, 'backup-service-role', {
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
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'backup-service-policy', {
            role: backupRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'backup-restore-policy', {
            role: backupRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
        });
        const primaryVault = new backup_vault_1.BackupVault(this, 'primary-backup-vault', {
            name: `primary-${environmentSuffix}-${timestampSuffix}`.substring(0, 50),
            kmsKeyArn: kmsKey.arn,
            tags: {
                Type: 'Primary',
                Environment: 'Production',
            },
        });
        new backup_vault_lock_configuration_1.BackupVaultLockConfiguration(this, 'primary-vault-lock', {
            backupVaultName: primaryVault.name,
            minRetentionDays: 7,
            maxRetentionDays: 2555,
        });
        const airgappedVault = new backup_vault_1.BackupVault(this, 'airgapped-backup-vault', {
            name: `airgapped-${environmentSuffix}-${timestampSuffix}`.substring(0, 50),
            kmsKeyArn: kmsKey.arn,
            tags: {
                Type: 'AirGapped',
                Environment: 'Production',
            },
        });
        new backup_vault_lock_configuration_1.BackupVaultLockConfiguration(this, 'airgapped-vault-lock', {
            backupVaultName: airgappedVault.name,
            minRetentionDays: 30,
            maxRetentionDays: 365,
        });
        // AWS Backup Audit Manager - Compliance Framework
        new backup_framework_1.BackupFramework(this, 'backup-audit-framework', {
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
        const auditReportBucket = new s3_bucket_1.S3Bucket(this, 'audit-report-bucket', {
            bucket: `backup-audit-reports-${s3UniqueSuffix}`,
            tags: {
                Purpose: 'Backup Audit Reports',
                Environment: 'Production',
            },
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, 'audit-bucket-pab', {
            bucket: auditReportBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
        new backup_report_plan_1.BackupReportPlan(this, 'backup-audit-report', {
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
        const backupPlan = new backup_plan_1.BackupPlan(this, 'daily-backup-plan', {
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
                        TargetRegion: 'us-east-1',
                    },
                },
            ],
        });
        new backup_selection_1.BackupSelection(this, 'backup-selection', {
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
        new cloudwatch_dashboard_1.CloudwatchDashboard(this, 'backup-dashboard', {
            dashboardName: `backup-monitoring-dashboard-${uniqueSuffix}`,
            dashboardBody: JSON.stringify(dashboardBody),
        });
        for (let i = 1; i <= 10; i++) {
            const clientRole = new iam_role_1.IamRole(this, `client-role-${i}`, {
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
            const clientPolicyDoc = new data_aws_iam_policy_document_1.DataAwsIamPolicyDocument(this, `client-policy-doc-${i}`, {
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
            });
            new iam_role_policy_1.IamRolePolicy(this, `client-policy-${i}`, {
                name: `backup-client-policy-${i}-${uniqueSuffix}`,
                role: clientRole.id,
                policy: clientPolicyDoc.json,
            });
        }
    }
}
exports.BackupInfrastructureStack = BackupInfrastructureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwLWluZnJhc3RydWN0dXJlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2JhY2t1cC1pbmZyYXN0cnVjdHVyZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrRUFBMkU7QUFDM0UscUVBQWlFO0FBQ2pFLG1GQUE4RTtBQUM5RSwrRUFBMkU7QUFDM0UsdUVBQW1FO0FBQ25FLDZHQUF1RztBQUN2Ryx1RkFBbUY7QUFDbkYsdUVBQXVFO0FBQ3ZFLHVHQUFnRztBQUNoRywyRUFBdUU7QUFDdkUsK0RBQTJEO0FBQzNELDZFQUF3RTtBQUN4RSxtR0FBNkY7QUFDN0YsaUVBQTZEO0FBQzdELDZEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsK0RBQStEO0FBQy9ELGlFQUE2RDtBQUM3RCxxRkFBZ0Y7QUFDaEYsaUhBQTJHO0FBQzNHLHFIQUErRztBQUMvRyx5R0FBa0c7QUFDbEcsdUZBQW1GO0FBQ25GLGlFQUE2RDtBQUM3RCwyQ0FBdUM7QUFPdkMsTUFBYSx5QkFBMEIsU0FBUSxzQkFBUztJQUN0RCxZQUNFLEtBQWdCLEVBQ2hCLEVBQVUsRUFDVixLQUFxQztRQUVyQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMzRCx5RkFBeUY7UUFDekYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25DLE1BQU0sWUFBWSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsWUFBWSxlQUFlLEVBQUUsQ0FBQztRQUMxRixNQUFNLGNBQWMsR0FBRyxHQUFHLGlCQUFpQixZQUFZLGVBQWUsRUFBRSxDQUFDLENBQUMsMkNBQTJDO1FBRXJILE1BQU0sTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxJQUFJLEVBQUUsZ0JB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QzVDLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLFlBQVksRUFBRTtnQkFDakQsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFO2dCQUNuQixNQUFNLEVBQUUsZUFBZSxDQUFDLElBQUk7YUFDN0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXhlRCw4REF3ZUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYWNrdXBGcmFtZXdvcmsgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9iYWNrdXAtZnJhbWV3b3JrJztcbmltcG9ydCB7IEJhY2t1cFBsYW4gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9iYWNrdXAtcGxhbic7XG5pbXBvcnQgeyBCYWNrdXBSZXBvcnRQbGFuIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvYmFja3VwLXJlcG9ydC1wbGFuJztcbmltcG9ydCB7IEJhY2t1cFNlbGVjdGlvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2JhY2t1cC1zZWxlY3Rpb24nO1xuaW1wb3J0IHsgQmFja3VwVmF1bHQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9iYWNrdXAtdmF1bHQnO1xuaW1wb3J0IHsgQmFja3VwVmF1bHRMb2NrQ29uZmlndXJhdGlvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2JhY2t1cC12YXVsdC1sb2NrLWNvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgQ2xvdWR3YXRjaERhc2hib2FyZCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2Nsb3Vkd2F0Y2gtZGFzaGJvYXJkJztcbi8vIFJlbW92ZWQgQ2xvdWR3YXRjaExvZ0dyb3VwIGltcG9ydCAtIG5vIGxvbmdlciB1c2luZyBMYW1iZGEgZnVuY3Rpb25zXG5pbXBvcnQgeyBEYXRhQXdzSWFtUG9saWN5RG9jdW1lbnQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9kYXRhLWF3cy1pYW0tcG9saWN5LWRvY3VtZW50JztcbmltcG9ydCB7IER5bmFtb2RiVGFibGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9keW5hbW9kYi10YWJsZSc7XG5pbXBvcnQgeyBJYW1Sb2xlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUnO1xuaW1wb3J0IHsgSWFtUm9sZVBvbGljeSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlLXBvbGljeSc7XG5pbXBvcnQgeyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlLXBvbGljeS1hdHRhY2htZW50JztcbmltcG9ydCB7IEttc0FsaWFzIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIva21zLWFsaWFzJztcbmltcG9ydCB7IEttc0tleSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2ttcy1rZXknO1xuLy8gUmVtb3ZlZCBMYW1iZGEgaW1wb3J0cyB0byBlbGltaW5hdGUgemlwIGZpbGUgZGVwZW5kZW5jaWVzXG5pbXBvcnQgeyBBd3NQcm92aWRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3Byb3ZpZGVyJztcbmltcG9ydCB7IFMzQnVja2V0IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0JztcbmltcG9ydCB7IFMzQnVja2V0SW52ZW50b3J5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LWludmVudG9yeSc7XG5pbXBvcnQgeyBTM0J1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb24gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtbGlmZWN5Y2xlLWNvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgUzNCdWNrZXRPYmplY3RMb2NrQ29uZmlndXJhdGlvbkEgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtb2JqZWN0LWxvY2stY29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtYmxvY2snO1xuaW1wb3J0IHsgUzNCdWNrZXRWZXJzaW9uaW5nQSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3MzLWJ1Y2tldC12ZXJzaW9uaW5nJztcbmltcG9ydCB7IFNuc1RvcGljIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc25zLXRvcGljJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgQmFja3VwSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzIHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQmFja3VwSW5mcmFzdHJ1Y3R1cmVTdGFjayBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHNjb3BlOiBDb25zdHJ1Y3QsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBwcm9wczogQmFja3VwSW5mcmFzdHJ1Y3R1cmVTdGFja1Byb3BzXG4gICkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb3BzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIC8vIENyZWF0ZSBjb21wbGV0ZWx5IHVuaXF1ZSByZXNvdXJjZSBuYW1lcyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBhbnkgZXhpc3RpbmcgcmVzb3VyY2VzXG4gICAgY29uc3QgdGltZXN0YW1wU3VmZml4ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCB1bmlxdWVTdWZmaXggPSBgJHtlbnZpcm9ubWVudFN1ZmZpeC5yZXBsYWNlKC8tL2csICdfJyl9X3VzZWFzdDFfJHt0aW1lc3RhbXBTdWZmaXh9YDtcbiAgICBjb25zdCBzM1VuaXF1ZVN1ZmZpeCA9IGAke2Vudmlyb25tZW50U3VmZml4fS11c2Vhc3QxLSR7dGltZXN0YW1wU3VmZml4fWA7IC8vIFMzIGJ1Y2tldHMgbmVlZCBoeXBoZW5zLCBub3QgdW5kZXJzY29yZXNcblxuICAgIGNvbnN0IGttc0tleSA9IG5ldyBLbXNLZXkodGhpcywgJ2JhY2t1cC1rbXMta2V5Jywge1xuICAgICAgZGVzY3JpcHRpb246ICdLTVMga2V5IGZvciBiYWNrdXAgZW5jcnlwdGlvbicsXG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgIGRlbGV0aW9uV2luZG93SW5EYXlzOiAzMCxcbiAgICB9KTtcblxuICAgIG5ldyBLbXNBbGlhcyh0aGlzLCAnYmFja3VwLWttcy1hbGlhcycsIHtcbiAgICAgIG5hbWU6IGBhbGlhcy9iYWNrdXAtZW5jcnlwdGlvbi1rZXktJHt1bmlxdWVTdWZmaXh9YCxcbiAgICAgIHRhcmdldEtleUlkOiBrbXNLZXkua2V5SWQsXG4gICAgfSk7XG5cbiAgICBjb25zdCBiYWNrdXBCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgJ2JhY2t1cC1idWNrZXQnLCB7XG4gICAgICBidWNrZXQ6IGBiYWNrdXAtc3RvcmFnZS0ke3MzVW5pcXVlU3VmZml4fWAsXG4gICAgICBvYmplY3RMb2NrRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgUHVycG9zZTogJ0JhY2t1cCBTdG9yYWdlJyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRWZXJzaW9uaW5nQSh0aGlzLCAnYmFja3VwLWJ1Y2tldC12ZXJzaW9uaW5nJywge1xuICAgICAgYnVja2V0OiBiYWNrdXBCdWNrZXQuaWQsXG4gICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRPYmplY3RMb2NrQ29uZmlndXJhdGlvbkEodGhpcywgJ2JhY2t1cC1idWNrZXQtbG9jaycsIHtcbiAgICAgIGJ1Y2tldDogYmFja3VwQnVja2V0LmlkLFxuICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6ICdFbmFibGVkJyxcbiAgICAgIHJ1bGU6IHtcbiAgICAgICAgZGVmYXVsdFJldGVudGlvbjoge1xuICAgICAgICAgIG1vZGU6ICdDT01QTElBTkNFJyxcbiAgICAgICAgICB5ZWFyczogNyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKHRoaXMsICdiYWNrdXAtbGlmZWN5Y2xlJywge1xuICAgICAgYnVja2V0OiBiYWNrdXBCdWNrZXQuaWQsXG4gICAgICBydWxlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3RyYW5zaXRpb24tdG8tZ2xhY2llcicsXG4gICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgZmlsdGVyOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByZWZpeDogJycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdHJhbnNpdGlvbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkYXlzOiA5MCxcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnR0xBQ0lFUicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgbmV3IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sodGhpcywgJ2JhY2t1cC1idWNrZXQtcGFiJywge1xuICAgICAgYnVja2V0OiBiYWNrdXBCdWNrZXQuaWQsXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCBpbnZlbnRvcnlCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgJ2ludmVudG9yeS1idWNrZXQnLCB7XG4gICAgICBidWNrZXQ6IGBiYWNrdXAtaW52ZW50b3J5LSR7czNVbmlxdWVTdWZmaXh9YCxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgUHVycG9zZTogJ0JhY2t1cCBJbnZlbnRvcnknLFxuICAgICAgICBFbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTM0J1Y2tldEludmVudG9yeSh0aGlzLCAnYmFja3VwLWludmVudG9yeScsIHtcbiAgICAgIGJ1Y2tldDogYmFja3VwQnVja2V0LmlkLFxuICAgICAgbmFtZTogJ2RhaWx5LWludmVudG9yeScsXG4gICAgICBpbmNsdWRlZE9iamVjdFZlcnNpb25zOiAnQ3VycmVudCcsXG4gICAgICBzY2hlZHVsZToge1xuICAgICAgICBmcmVxdWVuY3k6ICdEYWlseScsXG4gICAgICB9LFxuICAgICAgZGVzdGluYXRpb246IHtcbiAgICAgICAgYnVja2V0OiB7XG4gICAgICAgICAgYnVja2V0QXJuOiBpbnZlbnRvcnlCdWNrZXQuYXJuLFxuICAgICAgICAgIGZvcm1hdDogJ0NTVicsXG4gICAgICAgICAgZW5jcnlwdGlvbjoge1xuICAgICAgICAgICAgc3NlS21zOiB7XG4gICAgICAgICAgICAgIGtleUlkOiBrbXNLZXkuYXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIHRhYmxlIGZvciBiYWNrdXAgY2F0YWxvZyAoZm9yIG1hbnVhbCB0cmFja2luZyBhbmQgcmVwb3J0aW5nKVxuICAgIG5ldyBEeW5hbW9kYlRhYmxlKHRoaXMsICdiYWNrdXAtY2F0YWxvZycsIHtcbiAgICAgIG5hbWU6IGBiYWNrdXAtY2F0YWxvZy0ke3VuaXF1ZVN1ZmZpeH1gLFxuICAgICAgYmlsbGluZ01vZGU6ICdQQVlfUEVSX1JFUVVFU1QnLFxuICAgICAgaGFzaEtleTogJ2JhY2t1cElkJyxcbiAgICAgIHJhbmdlS2V5OiAnY2xpZW50SWQnLFxuICAgICAgYXR0cmlidXRlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnYmFja3VwSWQnLFxuICAgICAgICAgIHR5cGU6ICdTJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjbGllbnRJZCcsXG4gICAgICAgICAgdHlwZTogJ1MnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgICAgICAgdHlwZTogJ04nLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQ2xpZW50SWRJbmRleCcsXG4gICAgICAgICAgaGFzaEtleTogJ2NsaWVudElkJyxcbiAgICAgICAgICByYW5nZUtleTogJ3RpbWVzdGFtcCcsXG4gICAgICAgICAgcHJvamVjdGlvblR5cGU6ICdBTEwnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgUHVycG9zZTogJ0JhY2t1cCBDYXRhbG9nJyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBTTlMgdG9waWMgZm9yIGJhY2t1cCBub3RpZmljYXRpb25zIChmb3IgbWFudWFsIGFsZXJ0cyBhbmQgbW9uaXRvcmluZylcbiAgICBuZXcgU25zVG9waWModGhpcywgJ2JhY2t1cC1ub3RpZmljYXRpb25zJywge1xuICAgICAgbmFtZTogYGJhY2t1cC1ub3RpZmljYXRpb25zLSR7dW5pcXVlU3VmZml4fWAsXG4gICAgICBkaXNwbGF5TmFtZTogJ0JhY2t1cCBTeXN0ZW0gTm90aWZpY2F0aW9ucycsXG4gICAgICBrbXNNYXN0ZXJLZXlJZDoga21zS2V5LmlkLFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlndXJlIGFkZGl0aW9uYWwgcHJvdmlkZXIgZm9yIGNvbnNpc3RlbmN5IChhbGwgdXMtZWFzdC0xKVxuICAgIGNvbnN0IGFkZGl0aW9uYWxQcm92aWRlciA9IG5ldyBBd3NQcm92aWRlcih0aGlzLCAnYXdzLWFkZGl0aW9uYWwnLCB7XG4gICAgICBhbGlhczogJ2FkZGl0aW9uYWwnLFxuICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhZGRpdGlvbmFsIGJhY2t1cCB2YXVsdCBpbiB1cy1lYXN0LTEgZm9yIHJlZHVuZGFuY3lcbiAgICBjb25zdCBhZGRpdGlvbmFsVmF1bHQgPSBuZXcgQmFja3VwVmF1bHQodGhpcywgJ2FkZGl0aW9uYWwtYmFja3VwLXZhdWx0Jywge1xuICAgICAgbmFtZTogYGFkZGl0aW9uYWwtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHt0aW1lc3RhbXBTdWZmaXh9YC5zdWJzdHJpbmcoMCwgNTApLFxuICAgICAgcHJvdmlkZXI6IGFkZGl0aW9uYWxQcm92aWRlcixcbiAgICAgIGttc0tleUFybjoga21zS2V5LmFybixcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgVHlwZTogJ0FkZGl0aW9uYWwnLFxuICAgICAgICBFbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxuICAgICAgICBSZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJhY2t1cFJvbGUgPSBuZXcgSWFtUm9sZSh0aGlzLCAnYmFja3VwLXNlcnZpY2Utcm9sZScsIHtcbiAgICAgIG5hbWU6IGBhd3MtYmFja3VwLXNlcnZpY2Utcm9sZS0ke3VuaXF1ZVN1ZmZpeH1gLFxuICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICBTZXJ2aWNlOiAnYmFja3VwLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBuZXcgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQodGhpcywgJ2JhY2t1cC1zZXJ2aWNlLXBvbGljeScsIHtcbiAgICAgIHJvbGU6IGJhY2t1cFJvbGUubmFtZSxcbiAgICAgIHBvbGljeUFybjpcbiAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NCYWNrdXBTZXJ2aWNlUm9sZVBvbGljeUZvckJhY2t1cCcsXG4gICAgfSk7XG5cbiAgICBuZXcgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQodGhpcywgJ2JhY2t1cC1yZXN0b3JlLXBvbGljeScsIHtcbiAgICAgIHJvbGU6IGJhY2t1cFJvbGUubmFtZSxcbiAgICAgIHBvbGljeUFybjpcbiAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NCYWNrdXBTZXJ2aWNlUm9sZVBvbGljeUZvclJlc3RvcmVzJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByaW1hcnlWYXVsdCA9IG5ldyBCYWNrdXBWYXVsdCh0aGlzLCAncHJpbWFyeS1iYWNrdXAtdmF1bHQnLCB7XG4gICAgICBuYW1lOiBgcHJpbWFyeS0ke2Vudmlyb25tZW50U3VmZml4fS0ke3RpbWVzdGFtcFN1ZmZpeH1gLnN1YnN0cmluZygwLCA1MCksXG4gICAgICBrbXNLZXlBcm46IGttc0tleS5hcm4sXG4gICAgICB0YWdzOiB7XG4gICAgICAgIFR5cGU6ICdQcmltYXJ5JyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgQmFja3VwVmF1bHRMb2NrQ29uZmlndXJhdGlvbih0aGlzLCAncHJpbWFyeS12YXVsdC1sb2NrJywge1xuICAgICAgYmFja3VwVmF1bHROYW1lOiBwcmltYXJ5VmF1bHQubmFtZSxcbiAgICAgIG1pblJldGVudGlvbkRheXM6IDcsXG4gICAgICBtYXhSZXRlbnRpb25EYXlzOiAyNTU1LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWlyZ2FwcGVkVmF1bHQgPSBuZXcgQmFja3VwVmF1bHQodGhpcywgJ2FpcmdhcHBlZC1iYWNrdXAtdmF1bHQnLCB7XG4gICAgICBuYW1lOiBgYWlyZ2FwcGVkLSR7ZW52aXJvbm1lbnRTdWZmaXh9LSR7dGltZXN0YW1wU3VmZml4fWAuc3Vic3RyaW5nKDAsIDUwKSxcbiAgICAgIGttc0tleUFybjoga21zS2V5LmFybixcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgVHlwZTogJ0FpckdhcHBlZCcsXG4gICAgICAgIEVudmlyb25tZW50OiAnUHJvZHVjdGlvbicsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IEJhY2t1cFZhdWx0TG9ja0NvbmZpZ3VyYXRpb24odGhpcywgJ2FpcmdhcHBlZC12YXVsdC1sb2NrJywge1xuICAgICAgYmFja3VwVmF1bHROYW1lOiBhaXJnYXBwZWRWYXVsdC5uYW1lLFxuICAgICAgbWluUmV0ZW50aW9uRGF5czogMzAsXG4gICAgICBtYXhSZXRlbnRpb25EYXlzOiAzNjUsXG4gICAgfSk7XG5cbiAgICAvLyBBV1MgQmFja3VwIEF1ZGl0IE1hbmFnZXIgLSBDb21wbGlhbmNlIEZyYW1ld29ya1xuICAgIG5ldyBCYWNrdXBGcmFtZXdvcmsodGhpcywgJ2JhY2t1cC1hdWRpdC1mcmFtZXdvcmsnLCB7XG4gICAgICBuYW1lOiBgYmFja3VwX2NvbXBsaWFuY2VfZnJhbWV3b3JrXyR7dW5pcXVlU3VmZml4fWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbXBsaWFuY2UgZnJhbWV3b3JrIGZvciBiYWNrdXAgYXVkaXQgYW5kIGdvdmVybmFuY2UnLFxuICAgICAgY29udHJvbDogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0JBQ0tVUF9QTEFOX01JTl9GUkVRVUVOQ1lfQU5EX01JTl9SRVRFTlRJT05fQ0hFQ0snLFxuICAgICAgICAgIGlucHV0UGFyYW1ldGVyOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5hbWU6ICdyZXF1aXJlZEZyZXF1ZW5jeVVuaXQnLFxuICAgICAgICAgICAgICB2YWx1ZTogJ2RheXMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ3JlcXVpcmVkRnJlcXVlbmN5VmFsdWUnLFxuICAgICAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ3JlcXVpcmVkUmV0ZW50aW9uRGF5cycsXG4gICAgICAgICAgICAgIHZhbHVlOiAnNycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQkFDS1VQX1JFQ09WRVJZX1BPSU5UX01JTklNVU1fUkVURU5USU9OX0NIRUNLJyxcbiAgICAgICAgICBpbnB1dFBhcmFtZXRlcjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiAncmVxdWlyZWRSZXRlbnRpb25EYXlzJyxcbiAgICAgICAgICAgICAgdmFsdWU6ICc3JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCQUNLVVBfUkVTT1VSQ0VTX1BST1RFQ1RFRF9CWV9CQUNLVVBfUExBTicsXG4gICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgIGNvbXBsaWFuY2VSZXNvdXJjZVR5cGVzOiBbJ1MzJywgJ0R5bmFtb0RCJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCQUNLVVBfUkVDT1ZFUllfUE9JTlRfRU5DUllQVEVEJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCQUNLVVBfUkVDT1ZFUllfUE9JTlRfTUFOVUFMX0RFTEVUSU9OX0RJU0FCTEVEJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdCQUNLVVBfUkVTT1VSQ0VTX1BST1RFQ1RFRF9CWV9CQUNLVVBfVkFVTFRfTE9DSycsXG4gICAgICAgICAgaW5wdXRQYXJhbWV0ZXI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ21pblJldGVudGlvbkRheXMnLFxuICAgICAgICAgICAgICB2YWx1ZTogJzcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ21heFJldGVudGlvbkRheXMnLFxuICAgICAgICAgICAgICB2YWx1ZTogJzI1NTUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgUHVycG9zZTogJ0JhY2t1cEF1ZGl0JyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBCYWNrdXAgQXVkaXQgUmVwb3J0IFBsYW5cbiAgICBjb25zdCBhdWRpdFJlcG9ydEJ1Y2tldCA9IG5ldyBTM0J1Y2tldCh0aGlzLCAnYXVkaXQtcmVwb3J0LWJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldDogYGJhY2t1cC1hdWRpdC1yZXBvcnRzLSR7czNVbmlxdWVTdWZmaXh9YCxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgUHVycG9zZTogJ0JhY2t1cCBBdWRpdCBSZXBvcnRzJyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayh0aGlzLCAnYXVkaXQtYnVja2V0LXBhYicsIHtcbiAgICAgIGJ1Y2tldDogYXVkaXRSZXBvcnRCdWNrZXQuaWQsXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICBuZXcgQmFja3VwUmVwb3J0UGxhbih0aGlzLCAnYmFja3VwLWF1ZGl0LXJlcG9ydCcsIHtcbiAgICAgIG5hbWU6IGBiYWNrdXBfY29tcGxpYW5jZV9yZXBvcnRfJHt1bmlxdWVTdWZmaXh9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGFpbHkgYmFja3VwIGNvbXBsaWFuY2UgYXVkaXQgcmVwb3J0JyxcbiAgICAgIHJlcG9ydERlbGl2ZXJ5Q2hhbm5lbDoge1xuICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0UmVwb3J0QnVja2V0LmlkLFxuICAgICAgICBmb3JtYXRzOiBbJ0NTVicsICdKU09OJ10sXG4gICAgICAgIHMzS2V5UHJlZml4OiAnYXVkaXQtcmVwb3J0cycsXG4gICAgICB9LFxuICAgICAgcmVwb3J0U2V0dGluZzoge1xuICAgICAgICByZXBvcnRUZW1wbGF0ZTogJ0JBQ0tVUF9KT0JfUkVQT1JUJyxcbiAgICAgIH0sXG4gICAgICB0YWdzOiB7XG4gICAgICAgIFB1cnBvc2U6ICdDb21wbGlhbmNlUmVwb3J0aW5nJyxcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBiYWNrdXBQbGFuID0gbmV3IEJhY2t1cFBsYW4odGhpcywgJ2RhaWx5LWJhY2t1cC1wbGFuJywge1xuICAgICAgbmFtZTogYGRhaWx5LWJhY2t1cC1wbGFuLSR7dW5pcXVlU3VmZml4fWAsXG4gICAgICBydWxlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBydWxlTmFtZTogJ2RhaWx5LWJhY2t1cC1ydWxlJyxcbiAgICAgICAgICB0YXJnZXRWYXVsdE5hbWU6IHByaW1hcnlWYXVsdC5uYW1lLFxuICAgICAgICAgIHNjaGVkdWxlOiAnY3JvbigwIDIgKiAqID8gKiknLFxuICAgICAgICAgIHN0YXJ0V2luZG93OiA2MCxcbiAgICAgICAgICBjb21wbGV0aW9uV2luZG93OiAxMjAsXG4gICAgICAgICAgbGlmZWN5Y2xlOiB7XG4gICAgICAgICAgICBkZWxldGVBZnRlcjogMjU1NSxcbiAgICAgICAgICAgIGNvbGRTdG9yYWdlQWZ0ZXI6IDkwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVjb3ZlcnlQb2ludFRhZ3M6IHtcbiAgICAgICAgICAgIFR5cGU6ICdEYWlseScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBydWxlTmFtZTogJ2NyaXRpY2FsLWJhY2t1cC1ydWxlJyxcbiAgICAgICAgICB0YXJnZXRWYXVsdE5hbWU6IGFpcmdhcHBlZFZhdWx0Lm5hbWUsXG4gICAgICAgICAgc2NoZWR1bGU6ICdjcm9uKDAgNCAqICogPyAqKScsXG4gICAgICAgICAgc3RhcnRXaW5kb3c6IDYwLFxuICAgICAgICAgIGNvbXBsZXRpb25XaW5kb3c6IDEyMCxcbiAgICAgICAgICBsaWZlY3ljbGU6IHtcbiAgICAgICAgICAgIGRlbGV0ZUFmdGVyOiAzNjUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb3B5QWN0aW9uOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRlc3RpbmF0aW9uVmF1bHRBcm46IGFpcmdhcHBlZFZhdWx0LmFybixcbiAgICAgICAgICAgICAgbGlmZWN5Y2xlOiB7XG4gICAgICAgICAgICAgICAgZGVsZXRlQWZ0ZXI6IDEyMCwgLy8gTXVzdCBiZSBhdCBsZWFzdCA5MCBkYXlzIGFmdGVyIGNvbGQgc3RvcmFnZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlY292ZXJ5UG9pbnRUYWdzOiB7XG4gICAgICAgICAgICBUeXBlOiAnQ3JpdGljYWwnLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcnVsZU5hbWU6ICdjcm9zcy1yZWdpb24tYmFja3VwLXJ1bGUnLFxuICAgICAgICAgIHRhcmdldFZhdWx0TmFtZTogcHJpbWFyeVZhdWx0Lm5hbWUsXG4gICAgICAgICAgc2NoZWR1bGU6ICdjcm9uKDAgNiAqICogPyAqKScsXG4gICAgICAgICAgc3RhcnRXaW5kb3c6IDYwLFxuICAgICAgICAgIGNvbXBsZXRpb25XaW5kb3c6IDE4MCxcbiAgICAgICAgICBsaWZlY3ljbGU6IHtcbiAgICAgICAgICAgIGRlbGV0ZUFmdGVyOiA5MCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvcHlBY3Rpb246IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZGVzdGluYXRpb25WYXVsdEFybjogYWRkaXRpb25hbFZhdWx0LmFybixcbiAgICAgICAgICAgICAgbGlmZWN5Y2xlOiB7XG4gICAgICAgICAgICAgICAgZGVsZXRlQWZ0ZXI6IDEyMCwgLy8gTXVzdCBiZSBhdCBsZWFzdCA5MCBkYXlzIGFmdGVyIGNvbGQgc3RvcmFnZSAoMzAgKyA5MCA9IDEyMClcbiAgICAgICAgICAgICAgICBjb2xkU3RvcmFnZUFmdGVyOiAzMCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZWNvdmVyeVBvaW50VGFnczoge1xuICAgICAgICAgICAgVHlwZTogJ0FkZGl0aW9uYWxSZWdpb24nLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgICAgICAgIFRhcmdldFJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBuZXcgQmFja3VwU2VsZWN0aW9uKHRoaXMsICdiYWNrdXAtc2VsZWN0aW9uJywge1xuICAgICAgbmFtZTogYGJhY2t1cC1yZXNvdXJjZXMtJHt1bmlxdWVTdWZmaXh9YCxcbiAgICAgIGlhbVJvbGVBcm46IGJhY2t1cFJvbGUuYXJuLFxuICAgICAgcGxhbklkOiBiYWNrdXBQbGFuLmlkLFxuICAgICAgcmVzb3VyY2VzOiBbYmFja3VwQnVja2V0LmFybl0sXG4gICAgICBzZWxlY3Rpb25UYWc6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdTVFJJTkdFUVVBTFMnLFxuICAgICAgICAgIGtleTogJ0JhY2t1cCcsXG4gICAgICAgICAgdmFsdWU6ICd0cnVlJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXNoYm9hcmRCb2R5ID0ge1xuICAgICAgd2lkZ2V0czogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICBbJ0FXUy9CYWNrdXAnLCAnTnVtYmVyT2ZCYWNrdXBKb2JzQ29tcGxldGVkJywgeyBzdGF0OiAnU3VtJyB9XSxcbiAgICAgICAgICAgICAgWycuJywgJ051bWJlck9mQmFja3VwSm9ic0ZhaWxlZCcsIHsgc3RhdDogJ1N1bScgfV0sXG4gICAgICAgICAgICAgIFsnLicsICdOdW1iZXJPZkJhY2t1cEpvYnNDcmVhdGVkJywgeyBzdGF0OiAnU3VtJyB9XSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICAgIHN0YXQ6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgIHJlZ2lvbjogcHJvcHMucmVnaW9uLFxuICAgICAgICAgICAgdGl0bGU6ICdCYWNrdXAgSm9iIFN0YXR1cycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIG1ldHJpY3M6IFtbJ0FXUy9TMycsICdCdWNrZXRTaXplQnl0ZXMnXV0sXG4gICAgICAgICAgICBwZXJpb2Q6IDg2NDAwLFxuICAgICAgICAgICAgc3RhdDogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcmVnaW9uOiBwcm9wcy5yZWdpb24sXG4gICAgICAgICAgICB0aXRsZTogJ0JhY2t1cCBTdG9yYWdlIE1ldHJpY3MnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICBuZXcgQ2xvdWR3YXRjaERhc2hib2FyZCh0aGlzLCAnYmFja3VwLWRhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IGBiYWNrdXAtbW9uaXRvcmluZy1kYXNoYm9hcmQtJHt1bmlxdWVTdWZmaXh9YCxcbiAgICAgIGRhc2hib2FyZEJvZHk6IEpTT04uc3RyaW5naWZ5KGRhc2hib2FyZEJvZHkpLFxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gMTA7IGkrKykge1xuICAgICAgY29uc3QgY2xpZW50Um9sZSA9IG5ldyBJYW1Sb2xlKHRoaXMsIGBjbGllbnQtcm9sZS0ke2l9YCwge1xuICAgICAgICBuYW1lOiBgYmFja3VwLWNsaWVudC1yb2xlLSR7aX0tJHt1bmlxdWVTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZWMyLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNsaWVudFBvbGljeURvYyA9IG5ldyBEYXRhQXdzSWFtUG9saWN5RG9jdW1lbnQoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGBjbGllbnQtcG9saWN5LWRvYy0ke2l9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0JywgJ3MzOlB1dE9iamVjdCcsICdzMzpMaXN0QnVja2V0J10sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW2Ake2JhY2t1cEJ1Y2tldC5hcm59L2NsaWVudC0ke2l9LypgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpMaXN0QnVja2V0J10sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW2JhY2t1cEJ1Y2tldC5hcm5dLFxuICAgICAgICAgICAgICBjb25kaXRpb246IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICB0ZXN0OiAnU3RyaW5nTGlrZScsXG4gICAgICAgICAgICAgICAgICB2YXJpYWJsZTogJ3MzOnByZWZpeCcsXG4gICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtgY2xpZW50LSR7aX0vKmBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIG5ldyBJYW1Sb2xlUG9saWN5KHRoaXMsIGBjbGllbnQtcG9saWN5LSR7aX1gLCB7XG4gICAgICAgIG5hbWU6IGBiYWNrdXAtY2xpZW50LXBvbGljeS0ke2l9LSR7dW5pcXVlU3VmZml4fWAsXG4gICAgICAgIHJvbGU6IGNsaWVudFJvbGUuaWQsXG4gICAgICAgIHBvbGljeTogY2xpZW50UG9saWN5RG9jLmpzb24sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==