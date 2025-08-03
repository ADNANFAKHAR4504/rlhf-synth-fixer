# lib/components/data_protection.py

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
- RDS databases with encryption and backup policies
- Database security configurations
- Data retention and backup policies
- Cross-region replication for disaster recovery
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
               rds_monitoring_role_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:data:DataProtection', name, None, opts)

    self.region = region
    self.vpc_id = vpc_id
    self.private_subnet_ids = private_subnet_ids
    self.database_security_group_id = database_security_group_id
    self.kms_key_arn = kms_key_arn
    self.sns_topic_arn = sns_topic_arn
    self.rds_monitoring_role_arn = rds_monitoring_role_arn
    self.tags = tags or {}

    # Validate inputs
    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")
    if not rds_monitoring_role_arn:
      raise ValueError("rds_monitoring_role_arn must be provided")

    # Create S3 resources
    self._create_s3_buckets()

    # Create RDS resources
    self._create_rds_resources()

    # Create backup and retention policies
    self._create_backup_policies()

    # Register outputs
    self.register_outputs({
      "secure_s3_bucket_name": self.secure_s3_bucket.bucket,
      "secure_s3_bucket_arn": self.secure_s3_bucket.arn,
      "rds_instance_endpoint": getattr(self, 'rds_instance', None) and self.rds_instance.endpoint,
      "rds_instance_identifier": getattr(self, 'rds_instance', None) and self.rds_instance.identifier,
      "backup_vault_arn": self.backup_vault.arn,
      "backup_plan_id": self.backup_plan.id
    })

  def _create_s3_buckets(self):
    """Create S3 buckets with encryption at rest and versioning"""
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
      opts=ResourceOptions(parent=self)
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
        opts=ResourceOptions(parent=self)
    )

    self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{self.region.replace('-', '')}-secure-projectx-public-access-block",
      bucket=self.secure_s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
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
      opts=ResourceOptions(parent=self)
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
            noncurrent_days=2555  # 7 years retention
          )
        )
      ],
      opts=ResourceOptions(parent=self)
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
      opts=ResourceOptions(parent=self)
    )

  def _create_rds_resources(self):
    """Create RDS database with encryption and security configurations"""
    self.rds_subnet_group = aws.rds.SubnetGroup(
      f"{self.region.replace('-', '')}-secure-projectx-rds-subnet-group",
      name=f"secure-projectx-rds-subnet-group-{self.region}",
      subnet_ids=self.private_subnet_ids,
      tags={
        **self.tags,
        "Name": f"secure-projectx-rds-subnet-group-{self.region}"
      },
      opts=ResourceOptions(parent=self)
    )

    self.rds_parameter_group = aws.rds.ParameterGroup(
      f"{self.region.replace('-', '')}-secure-projectx-rds-params",
      name=f"secure-projectx-params-{self.region}",
      family="postgres15",
      description="ProjectX secure RDS parameter group",
      parameters=[
        aws.rds.ParameterGroupParameterArgs(
          name="log_statement",
          value="all"
        ),
        aws.rds.ParameterGroupParameterArgs(
          name="log_min_duration_statement",
          value="1000"  # Log queries longer than 1 second
        ),
        aws.rds.ParameterGroupParameterArgs(
          name="ssl",
          value="1"
        ),
        aws.rds.ParameterGroupParameterArgs(
          name="shared_preload_libraries",
          value="pg_stat_statements"
        )
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.rds_option_group = aws.rds.OptionGroup(
      f"{self.region.replace('-', '')}-secure-projectx-rds-options",
      name=f"secure-projectx-options-{self.region}",
      engine_name="postgres",
      major_engine_version="15",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.rds_password = aws.secretsmanager.Secret(
      f"{self.region.replace('-', '')}-secure-projectx-rds-password",
      name=f"secure-projectx-rds-password-{self.region}",
      description="ProjectX RDS master password",
      kms_key_id=self.kms_key_arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.rds_password_version = aws.secretsmanager.SecretVersion(
      f"{self.region.replace('-', '')}-secure-projectx-rds-password-version",
      secret_id=self.rds_password.id,
      secret_string=pulumi.Output.secret(random.RandomPassword(
        f"{self.region.replace('-', '')}-secure-projectx-rds-random-password",
        length=32,
        special=True,
        opts=ResourceOptions(parent=self)
      ).result),
      opts=ResourceOptions(parent=self)
    )

    self.rds_instance = aws.rds.Instance(
      f"{self.region.replace('-', '')}-secure-projectx-rds",
      identifier=f"secure-projectx-db-{self.region}",
      engine="postgres",
      engine_version="15.4",
      instance_class="db.t3.micro",
      allocated_storage=20,
      storage_type="gp3",
      storage_encrypted=True,
      kms_key_id=self.kms_key_arn,
      db_name="projectx_secure_db",
      username="projectx_admin",
      manage_master_user_password=True,
      master_user_secret_kms_key_id=self.kms_key_arn,
      db_subnet_group_name=self.rds_subnet_group.name,
      vpc_security_group_ids=[self.database_security_group_id],
      publicly_accessible=False,
      parameter_group_name=self.rds_parameter_group.name,
      option_group_name=self.rds_option_group.name,
      backup_retention_period=30,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      auto_minor_version_upgrade=True,
      monitoring_interval=60,
      monitoring_role_arn=self.rds_monitoring_role_arn,
      enabled_cloudwatch_logs_exports=["postgresql"],
      performance_insights_enabled=True,
      performance_insights_retention_period=7,
      performance_insights_kms_key_id=self.kms_key_arn,
      deletion_protection=True,
      skip_final_snapshot=False,
      final_snapshot_identifier=f"secure-projectx-final-snapshot-{self.region}",
      tags={
        **self.tags,
        "Name": f"secure-projectx-rds-{self.region}",
        "Backup": "Required",
        "Encryption": "KMS"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_backup_policies(self):
    """Create backup and retention policies"""
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
        ),
        aws.backup.PlanRuleArgs(
          rule_name="WeeklyBackups",
          target_vault_name=self.backup_vault.name,
          schedule="cron(0 1 ? * SUN *)",
          start_window=60,
          completion_window=180,
          lifecycle=aws.backup.PlanRuleLifecycleArgs(
            cold_storage_after=30,
            delete_after=2555  # 7 years
          ),
          recovery_point_tags={
            **self.tags,
            "BackupType": "Weekly"
          }
        )
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
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
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{self.region.replace('-', '')}-secure-projectx-backup-policy-restore",
      role=self.backup_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
      opts=ResourceOptions(parent=self)
    )

    self.backup_selection = aws.backup.Selection(
      f"{self.region.replace('-', '')}-secure-projectx-backup-selection",
      name=f"secure-projectx-backup-selection-{self.region}",
      plan_id=self.backup_plan.id,
      iam_role_arn=self.backup_role.arn,
      resources=[
        self.rds_instance.arn,
        self.secure_s3_bucket.arn
      ],
      selection_tags=[
        aws.backup.SelectionSelectionTagArgs(
          type="STRINGEQUALS",
          key="Backup",
          value="Required"
        )
      ],
      opts=ResourceOptions(parent=self)
    )