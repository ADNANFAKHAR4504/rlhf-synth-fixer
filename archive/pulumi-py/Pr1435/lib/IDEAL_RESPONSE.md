# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## components/__init__.py

```python

```

## components/cloudwatch_alarm.py

```python
from typing import Optional
import dataclasses
import pulumi
import pulumi_aws as aws


@dataclasses.dataclass
class CloudWatchAlarmConfig:
  bucket_name: pulumi.Output[str]
  sns_topic_arn: pulumi.Output[str]
  error_threshold: int = 5
  request_threshold: int = 1000
  tags: Optional[dict] = None


class CloudWatchAlarm(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: CloudWatchAlarmConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:CloudWatchAlarm", name, None, opts)
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-cloudwatch-alarms",
      "Component": "CloudWatchAlarm",
      "Purpose": "S3 monitoring and alerting"
    }
    if config.tags:
      default_tags.update(config.tags)
    
    # Validate SNS topic ARN format
    def validate_sns_arn(arn):
      if not arn.startswith('arn:aws:sns:'):
        raise ValueError(f"Invalid SNS topic ARN format: {arn}")
      return arn

    # Create CloudWatch alarm for 4xx errors (failed access attempts)
    self.access_denied_alarm = aws.cloudwatch.MetricAlarm(
      f"{name}-access-denied-alarm",
      name=f"{name}-s3-access-denied",
      alarm_description="Alarm for S3 bucket access denied events",
      metric_name="4xxErrors",
      namespace="AWS/S3",
      statistic="Sum",
      unit="Count",
      period=300,  # 5 minutes
      evaluation_periods=2,
      datapoints_to_alarm=1,
      threshold=config.error_threshold,
      comparison_operator="GreaterThanThreshold",
      dimensions=config.bucket_name.apply(lambda name: {
        "BucketName": name
      }),
      alarm_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      ok_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      tags=default_tags,
      treat_missing_data="notBreaching",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create CloudWatch alarm for high request rate
    self.high_request_alarm = aws.cloudwatch.MetricAlarm(
      f"{name}-high-request-alarm",
      name=f"{name}-s3-high-requests",
      alarm_description="Alarm for unusually high S3 request rate",
      metric_name="AllRequests",
      namespace="AWS/S3",
      statistic="Sum",
      unit="Count",
      period=300,  # 5 minutes
      evaluation_periods=2,
      datapoints_to_alarm=2,
      threshold=config.request_threshold,
      comparison_operator="GreaterThanThreshold",
      dimensions=config.bucket_name.apply(lambda name: {
        "BucketName": name
      }),
      alarm_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      ok_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      tags=default_tags,
      treat_missing_data="notBreaching",
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "access_denied_alarm_name": self.access_denied_alarm.name,
      "high_request_alarm_name": self.high_request_alarm.name
    })
```

## components/iam_role.py

```python
import json
from typing import Optional
import dataclasses
import pulumi
import pulumi_aws as aws


def _create_policy_document(bucket_arn: str, kms_key_arn: str) -> str:
  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:DeleteObjectVersion"
        ],
        "Resource": f"{bucket_arn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:GetBucketLocation"
        ],
        "Resource": bucket_arn
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": kms_key_arn
      }
    ]
  }

  return json.dumps(policy)


@dataclasses.dataclass
class S3IAMRoleConfig:
  bucket_arn: pulumi.Output[str]
  kms_key_arn: pulumi.Output[str]
  service_principals: Optional[list] = None
  path: str = "/"
  permissions_boundary_arn: Optional[str] = None
  tags: Optional[dict] = None


class S3IAMRole(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: S3IAMRoleConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:S3IAMRole", name, None, opts)

    self.bucket_arn = config.bucket_arn
    self.kms_key_arn = config.kms_key_arn
    
    # Default service principals
    service_principals = config.service_principals or ["ec2.amazonaws.com"]
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-iam-role",
      "Component": "S3IAMRole",
      "Purpose": "S3 bucket access with least privilege"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create assume role policy with configurable service principals
    assume_role_statements = []
    for principal in service_principals:
      assume_role_statements.append({
        "Effect": "Allow",
        "Principal": {
          "Service": principal
        },
        "Action": "sts:AssumeRole"
      })
    
    # Create IAM role
    role_args = {
      "assume_role_policy": json.dumps({
        "Version": "2012-10-17",
        "Statement": assume_role_statements
      }),
      "description": f"IAM role for {name} with S3 and KMS access",
      "path": config.path,
      "tags": default_tags
    }
    
    if config.permissions_boundary_arn:
      role_args["permissions_boundary"] = config.permissions_boundary_arn
    
    self.role = aws.iam.Role(
      f"{name}-role",
      **role_args,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create policy for S3 bucket access
    self.policy = aws.iam.Policy(
      f"{name}-policy",
      description=f"Least privilege policy for {name} S3 bucket access",
      policy=pulumi.Output.all(config.bucket_arn, config.kms_key_arn).apply(
        lambda args: _create_policy_document(args[0], args[1])
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Attach policy to role
    self.role_policy_attachment = aws.iam.RolePolicyAttachment(
      f"{name}-policy-attachment",
      role=self.role.name,
      policy_arn=self.policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create instance profile for EC2 instances
    self.instance_profile = aws.iam.InstanceProfile(
      f"{name}-instance-profile",
      role=self.role.name,
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.role]
      )
    )

    self.register_outputs({
      "role_arn": self.role.arn,
      "role_name": self.role.name,
      "policy_arn": self.policy.arn,
      "instance_profile_name": self.instance_profile.name
    })
```

## components/kms_key.py

```python
from typing import Optional
import json
import dataclasses
import pulumi
import pulumi_aws as aws


def _get_key_policy() -> str:

  # Get current AWS account ID and region
  current = aws.get_caller_identity()

  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM Root User Permissions",
        "Effect": "Allow",
        "Principal": {
          "AWS": f"arn:aws:iam::{current.account_id}:root"
        },
        "Action": "kms:*",
        "Resource": "*"
      },
      {
        "Sid": "Allow Use of the Key for S3 and SNS",
        "Effect": "Allow",
        "Principal": {
          "AWS": f"arn:aws:iam::{current.account_id}:root"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ],
        "Resource": "*",
        "Condition": {
          "StringEquals": {
            "kms:ViaService": ["s3.*.amazonaws.com", "sns.*.amazonaws.com"]
          }
        }
      },
      {
        "Sid": "Allow S3 Service",
        "Effect": "Allow",
        "Principal": {
          "Service": "s3.amazonaws.com"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "*"
      },
      {
        "Sid": "Allow SNS Service",
        "Effect": "Allow",
        "Principal": {
          "Service": "sns.amazonaws.com"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "*"
      }
    ]
  }

  return json.dumps(policy)


@dataclasses.dataclass
class KMSKeyConfig:
  description: str = "KMS key for S3 bucket encryption"
  deletion_window_days: int = 30
  tags: Optional[dict] = None


class KMSKey(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: KMSKeyConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:KMSKey", name, None, opts)

    # Apply default tags
    default_tags = {
      "Name": f"{name}-kms-key",
      "Component": "KMSKey",
      "Purpose": "S3 and SNS encryption"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create KMS key
    self.key = aws.kms.Key(
      f"{name}-key",
      description=config.description,
      deletion_window_in_days=config.deletion_window_days,
      enable_key_rotation=True,
      policy=_get_key_policy(),
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create KMS alias
    self.alias = aws.kms.Alias(
      f"{name}-alias",
      name=f"alias/{name}-s3-key",
      target_key_id=self.key.key_id,
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.key]
      )
    )

    self.register_outputs({
      "key_id": self.key.key_id,
      "key_arn": self.key.arn,
      "alias_name": self.alias.name
    })
```

## components/s3_bucket.py

```python
from typing import Optional, Any
import dataclasses
import random
import string

import pulumi
import pulumi_aws as aws

@dataclasses.dataclass
class SecureS3BucketConfig:
  kms_key_id: pulumi.Output[str]
  sns_topic_arn: pulumi.Output[str]
  access_logging_bucket: Optional[str] = None
  enable_mfa_delete: bool = False
  tags: Optional[dict] = None
  # Optional SNS topic component for proper dependency management
  sns_topic_component: Optional[Any] = None


class SecureS3Bucket(pulumi.ComponentResource):
  def __init__(self, name: str, config: SecureS3BucketConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SecureS3Bucket", name, None, opts)

    # Generate random suffix for bucket name security
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-secure-s3-bucket",
      "Component": "SecureS3Bucket", 
      "Stack": pulumi.get_stack(),
      "Purpose": "Secure storage with encryption and monitoring"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create the main S3 bucket
    self.bucket = aws.s3.Bucket(
      f"{name}-bucket",
      bucket=f"{name}-secure-bucket-{pulumi.get_stack()}-{random_suffix}".lower(),
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Enable versioning with optional MFA delete
    versioning_config = aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled"
    )
    if config.enable_mfa_delete:
      versioning_config = aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled",
        mfa_delete="Enabled"
      )
    
    self.versioning = aws.s3.BucketVersioningV2(
      f"{name}-versioning",
      bucket=self.bucket.id,
      versioning_configuration=versioning_config,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-encryption",
      bucket=self.bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=config.kms_key_id
        ),
        bucket_key_enabled=True
      )],
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.bucket]
      )
    )

    # Block public access
    self.public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{name}-public-access-block",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure lifecycle policy
    self.lifecycle = aws.s3.BucketLifecycleConfigurationV2(
      f"{name}-lifecycle",
      bucket=self.bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="delete_old_versions",
          status="Enabled",
          noncurrent_version_expiration=
          aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=90
          ),
          abort_incomplete_multipart_upload=
          aws.s3.BucketLifecycleConfigurationV2RuleAbortIncompleteMultipartUploadArgs(
            days_after_initiation=7
          )
        ),
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="transition_to_ia",
          status="Enabled",
          transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=90,
              storage_class="GLACIER"
            )
          ]
        )
      ],
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.bucket, self.versioning]
      )
    )

    # Configure access logging if logging bucket is provided
    if config.access_logging_bucket:
      self.logging = aws.s3.BucketLoggingV2(
        f"{name}-logging",
        bucket=self.bucket.id,
        target_bucket=config.access_logging_bucket,
        target_prefix=f"{name}-access-logs/",
        opts=pulumi.ResourceOptions(
          parent=self,
          depends_on=[self.bucket]
        )
      )

    # Configure SNS notifications
    # Note: SNS topic policy must be created before bucket notification
    notification_depends_on = [self.bucket, self.bucket_encryption, self.versioning, self.public_access_block, self.lifecycle]
    if config.access_logging_bucket:
      notification_depends_on.append(self.logging)
    if config.sns_topic_component:
      # Add both the SNS topic and its policy as dependencies
      notification_depends_on.extend([
        config.sns_topic_component,
        config.sns_topic_component.topic_policy if hasattr(config.sns_topic_component, 'topic_policy') else None
      ])
      # Remove None values
      notification_depends_on = [dep for dep in notification_depends_on if dep is not None]
    
    self.notification = aws.s3.BucketNotification(
      f"{name}-notification",
      bucket=self.bucket.id,
      topics=[
        aws.s3.BucketNotificationTopicArgs(
          topic_arn=config.sns_topic_arn,
          events=[
            "s3:ObjectCreated:*",
            "s3:ObjectRemoved:*"
          ]
        )
      ],
      opts=pulumi.ResourceOptions(
        parent=self, 
        depends_on=notification_depends_on,
        # Ensure topic policy is created first by adding explicit dependency
        # The SNS topic and its policy must exist before S3 can validate the notification
        delete_before_replace=True
      )
    )

    self.register_outputs({
      "bucket_name": self.bucket.bucket,
      "bucket_arn": self.bucket.arn,
      "bucket_id": self.bucket.id
    })
```

## components/sns_topic.py

```python
from typing import Optional
import json
import dataclasses
import pulumi
import pulumi_aws as aws


def _create_topic_policy(topic_arn: str) -> str:
  current = aws.get_caller_identity()

  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "s3.amazonaws.com"
        },
        "Action": "sns:Publish",
        "Resource": topic_arn,
        "Condition": {
          "StringEquals": {
            "aws:SourceAccount": current.account_id
          }
        }
      }
    ]
  }

  return json.dumps(policy)


@dataclasses.dataclass
class SNSTopicConfig:
  kms_key_id: pulumi.Output[str]
  email_endpoint: Optional[str] = None
  tags: Optional[dict] = None


class SNSTopic(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: SNSTopicConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SNSTopic", name, None, opts)

    # Apply default tags
    default_tags = {
      "Name": f"{name}-sns-topic",
      "Component": "SNSTopic",
      "Purpose": "S3 event notifications"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create SNS topic
    self.topic = aws.sns.Topic(
      f"{name}-topic",
      name=f"{name}-s3-notifications",
      kms_master_key_id=config.kms_key_id,
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create topic policy to allow S3 to publish to SNS
    self.topic_policy = aws.sns.TopicPolicy(
      f"{name}-topic-policy",
      arn=self.topic.arn,
      policy=self.topic.arn.apply(_create_topic_policy),
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.topic]
      )
    )

    # Create email subscription if email is provided
    if config.email_endpoint:
      self.email_subscription = aws.sns.TopicSubscription(
        f"{name}-email-subscription",
        topic_arn=self.topic.arn,
        protocol="email",
        endpoint=config.email_endpoint,
        opts=pulumi.ResourceOptions(parent=self)
      )

    self.register_outputs({
      "topic_arn": self.topic.arn,
      "topic_name": self.topic.name
    })
```

## tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws

from lib.components.cloudwatch_alarm import CloudWatchAlarm, CloudWatchAlarmConfig
from lib.components.iam_role import S3IAMRole, S3IAMRoleConfig
from lib.components.kms_key import KMSKey, KMSKeyConfig
from lib.components.s3_bucket import SecureS3Bucket, SecureS3BucketConfig
from lib.components.sns_topic import SNSTopic, SNSTopicConfig

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
email_endpoint = config.get("email_endpoint")  # Optional email for notifications


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific components
  and manages the environment suffix used for naming and configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

  Args:
      name (str): The logical name of this Pulumi component.
      args (TapStackArgs): Configuration arguments including environment suffix and tags.
      opts (ResourceOptions): Pulumi options.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Create a separate logging bucket (optional but recommended)
    logging_bucket = aws.s3.Bucket(
      "access-logging-bucket",
      bucket=f"{project_name}-access-logs-{stack_name}".lower(),
      force_destroy=True  # Only for demo purposes
    )

    # Block public access for logging bucket
    aws.s3.BucketPublicAccessBlock(
      "logging-bucket-public-access-block",
      bucket=logging_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )

    # Create KMS key for encryption
    kms_key = KMSKey(
      f"{project_name}-kms",
      KMSKeyConfig(
        description="KMS key for S3 bucket encryption and SNS topic"
      )
    )

    # Create SNS topic for notifications
    sns_topic = SNSTopic(
      f"{project_name}-sns",
      SNSTopicConfig(
        kms_key_id=kms_key.key.key_id,
        email_endpoint=email_endpoint
      )
    )

    # Create the secure S3 bucket
    s3_bucket = SecureS3Bucket(
      f"{project_name}-s3",
      SecureS3BucketConfig(
        kms_key_id=kms_key.key.key_id,
        sns_topic_arn=sns_topic.topic.arn,
        access_logging_bucket=logging_bucket.bucket.apply(lambda b: f"{b}"),
        sns_topic_component=sns_topic  # Pass the full SNS topic component for dependency
      )
    )

    # Create IAM role with least privilege access
    iam_role = S3IAMRole(
      f"{project_name}-iam",
      S3IAMRoleConfig(
        bucket_arn=s3_bucket.bucket.arn,
        kms_key_arn=kms_key.key.arn
      )
    )

    # Create CloudWatch alarms
    CloudWatchAlarm(
      f"{project_name}-cw",
      CloudWatchAlarmConfig(
        bucket_name=s3_bucket.bucket.bucket,
        sns_topic_arn=sns_topic.topic.arn
      )
    )

    # Export important values
    pulumi.export("bucket_name", s3_bucket.bucket.bucket)
    pulumi.export("bucket_arn", s3_bucket.bucket.arn)
    pulumi.export("kms_key_id", kms_key.key.key_id)
    pulumi.export("kms_key_arn", kms_key.key.arn)
    pulumi.export("iam_role_arn", iam_role.role.arn)
    pulumi.export("sns_topic_arn", sns_topic.topic.arn)
    pulumi.export("logging_bucket_name", logging_bucket.bucket)
```
