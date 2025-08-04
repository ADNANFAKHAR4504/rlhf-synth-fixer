from typing import Optional, List
import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Data Protection Infrastructure Component

This component creates and manages:
- S3 buckets with encryption at rest and versioning
- Backup vaults and policies
- Data retention and backup policies
"""

class DataProtectionInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               vpc_id: pulumi.Input[str],
               private_subnet_ids: pulumi.Input[List[str]],
               database_security_group_id: pulumi.Input[str],
               kms_key_arn: pulumi.Input[str],
               sns_topic_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:data:DataProtection', name, None, opts)

    self.region = region
    self.vpc_id = vpc_id
    self.private_subnet_ids = private_subnet_ids
    self.database_security_group_id = database_security_group_id
    self.kms_key_arn = kms_key_arn
    self.sns_topic_arn = sns_topic_arn
    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")

    self._create_s3_buckets()
    self._create_backup_policies()

    self.register_outputs({
      "secure_s3_bucket_name": self.secure_s3_bucket.bucket,
      "secure_s3_bucket_arn": self.secure_s3_bucket.arn,
      "backup_vault_arn": self.backup_vault.arn,
      "backup_plan_id": self.backup_plan.id
    })

  def _create_s3_buckets(self):
    self.secure_s3_bucket = aws.s3.Bucket(
      f"{self.region.replace('-', '')}-secure-projectx-data-bucket",
      bucket=f"secure-projectx-data-{self.region}-{pulumi.get_stack()}",
      tags={
        **self.tags,
        "Name": f"secure-projectx-data-{self.region}",
        "Purpose": "DataStorage",
        "Encryption": "KMS"
      },
      opts=ResourceOptions(parent=self)
    )

    self.s3_versioning = aws.s3.BucketVersioningV2(
      f"{self.region.replace('-', '')}-secure-projectx-versioning",
      bucket=self.secure_s3_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self, depends_on=[self.secure_s3_bucket])
    )

    self.s3_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{self.region.replace('-', '')}-secure-projectx-encryption",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key_arn
          ),
          bucket_key_enabled=True
        )
      ],
      opts=ResourceOptions(parent=self, depends_on=[self.s3_versioning])
    )

    self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{self.region.replace('-', '')}-secure-projectx-public-access-block",
      bucket=self.secure_s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self, depends_on=[self.s3_encryption])
    )

    bucket_policy = pulumi.Output.all(
      bucket_name=self.secure_s3_bucket.bucket,
      kms_key_arn=self.kms_key_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            f"arn:aws:s3:::{args['bucket_name']}",
            f"arn:aws:s3:::{args['bucket_name']}/*"
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "RequireKMSEncryption",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:PutObject",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}/*",
          "Condition": {
            "StringNotEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        }
      ]
    }))

    self.s3_bucket_policy = aws.s3.BucketPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-bucket-policy",
      bucket=self.secure_s3_bucket.id,
      policy=bucket_policy,
      opts=ResourceOptions(parent=self, depends_on=[self.s3_public_access_block])
    )

    self.s3_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
      f"{self.region.replace('-', '')}-secure-projectx-lifecycle",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="secure-projectx-lifecycle-rule",
          status="Enabled",
          transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=90,
              storage_class="GLACIER"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=365,
              storage_class="DEEP_ARCHIVE"
            )
          ],
          noncurrent_version_transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=90,
              storage_class="GLACIER"
            )
          ],
          noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=2555
          )
        )
      ],
      opts=ResourceOptions(parent=self, depends_on=[self.s3_bucket_policy])
    )

    self.s3_notification = aws.s3.BucketNotification(
      f"{self.region.replace('-', '')}-secure-projectx-s3-notification",
      bucket=self.secure_s3_bucket.id,
      topics=[
        aws.s3.BucketNotificationTopicArgs(
          topic_arn=self.sns_topic_arn,
          events=["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
          filter_prefix="critical/"
        )
      ],
      opts=ResourceOptions(parent=self, depends_on=[self.s3_lifecycle])
    )

  def _create_backup_policies(self):
    self.backup_vault = aws.backup.Vault(
      f"{self.region.replace('-', '')}-secure-projectx-backup-vault",
      name=f"secure-projectx-backup-vault-{self.region}",
      kms_key_arn=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-backup-vault-{self.region}"
      },
      opts=ResourceOptions(parent=self)
    )

    self.backup_plan = aws.backup.Plan(
      f"{self.region.replace('-', '')}-secure-projectx-backup-plan",
      name=f"secure-projectx-backup-plan-{self.region}",
      rules=[
        aws.backup.PlanRuleArgs(
          rule_name="DailyBackups",
          target_vault_name=self.backup_vault.name,
          schedule="cron(0 2 ? * * *)",
          start_window=60,
          completion_window=120,
          lifecycle=aws.backup.PlanRuleLifecycleArgs(
            cold_storage_after=30,
            delete_after=365
          ),
          recovery_point_tags={
            **self.tags,
            "BackupType": "Daily"
          }
        )
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.backup_vault])
    )

    backup_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "backup.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.backup_role = aws.iam.Role(
      f"{self.region.replace('-', '')}-secure-projectx-backup-role",
      name=f"secure-projectx-backup-role-{self.region}",
      assume_role_policy=json.dumps(backup_assume_role_policy),
      tags={
        **self.tags,
        "Name": f"secure-projectx-backup-role-{self.region}",
        "Service": "Backup"
      },
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{self.region.replace('-', '')}-secure-projectx-backup-policy-backup",
      role=self.backup_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
      opts=ResourceOptions(parent=self, depends_on=[self.backup_role])
    )

    aws.iam.RolePolicyAttachment(
      f"{self.region.replace('-', '')}-secure-projectx-backup-policy-restore",
      role=self.backup_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
      opts=ResourceOptions(parent=self, depends_on=[self.backup_role])
    )
