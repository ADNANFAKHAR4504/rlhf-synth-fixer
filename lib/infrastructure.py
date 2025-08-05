"""Infrastructure construct module for CDKTF Python infrastructure."""

import json
import re

from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from constructs import Construct


class Infrastructure(Construct):
  """Infrastructure construct for EC2, S3, IAM, and CloudWatch resources."""

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      environment_suffix: str = "dev",
      default_tags: dict = None
  ):
    """Initialize the Infrastructure construct with configuration."""
    super().__init__(scope, construct_id)
    
    if default_tags is None:
      default_tags = {}

    def sanitize_tag_value(value):
      """Sanitize tag value to meet AWS requirements."""
      if not isinstance(value, str):
        value = str(value)
      # AWS tag pattern: [\p{L}\p{Z}\p{N}_.:/=+\-@]*
      # Keep only allowed characters
      sanitized = re.sub(r'[^\w\s_.:/=+\-@]', '', value)
      # Trim to max length (256 chars for tag values)
      return sanitized[:256].strip()

    def create_sanitized_tags(base_tags, additional_tags=None):
      """Create sanitized tags dictionary."""
      tags = {}
      tags.update(base_tags)
      if additional_tags:
        for key, value in additional_tags.items():
          if isinstance(key, str) and key.strip():
            tags[key] = sanitize_tag_value(value)
      return tags

    # Data source to get the latest Amazon Linux 2 AMI
    amazon_linux_ami = DataAwsAmi(
      self, "amazon_linux_ami",
      most_recent=True,
      owners=["amazon"],
      filter=[
        {
          "name": "name",
          "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          "name": "virtualization-type",
          "values": ["hvm"]
        }
      ]
    )

    # Create S3 bucket for backup purposes
    backup_bucket = S3Bucket(
      self, "backup_bucket",
      bucket=f"ec2-backup-bucket-{environment_suffix}",
      tags=create_sanitized_tags({
        "Name": f"EC2 Backup Bucket - {environment_suffix}",
        "Environment": environment_suffix
      }, default_tags)
    )

    # Enable versioning on S3 bucket
    S3BucketVersioningA(
      self, "backup_bucket_versioning",
      bucket=backup_bucket.id,
      versioning_configuration={
        "status": "Enabled"
      }
    )

    # Create IAM policy with least-privilege permissions for S3 access
    s3_access_policy_document = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ],
          "Resource": [
            backup_bucket.arn,
            f"{backup_bucket.arn}/*"
          ]
        }
      ]
    }

    s3_access_policy = IamPolicy(
      self, "s3_access_policy",
      name=f"EC2S3AccessPolicy-{environment_suffix}",
      description="Least-privilege policy for EC2 to access S3 backup bucket",
      policy=json.dumps(s3_access_policy_document)
    )

    # Create IAM role for EC2 instance
    ec2_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          }
        }
      ]
    }

    ec2_role = IamRole(
      self, "ec2_role",
      name=f"EC2BackupRole-{environment_suffix}",
      assume_role_policy=json.dumps(ec2_assume_role_policy),
      tags=create_sanitized_tags({
        "Name": f"EC2 Backup Role - {environment_suffix}",
        "Environment": environment_suffix
      }, default_tags)
    )

    # Attach the S3 access policy to the IAM role
    IamRolePolicyAttachment(
      self, "ec2_role_policy_attachment",
      role=ec2_role.name,
      policy_arn=s3_access_policy.arn
    )

    # Create IAM instance profile
    instance_profile = IamInstanceProfile(
      self, "ec2_instance_profile",
      name=f"EC2BackupInstanceProfile-{environment_suffix}",
      role=ec2_role.name
    )

    # Create EC2 instance
    ec2_instance = Instance(
      self, "ec2_instance",
      ami=amazon_linux_ami.id,
      instance_type="t3.micro",
      iam_instance_profile=instance_profile.name,
      tags=create_sanitized_tags({
        "Name": f"EC2 Instance with S3 Access - {environment_suffix}",
        "Environment": environment_suffix
      }, default_tags)
    )

    # Create SNS topic for CloudWatch alarm notifications
    alarm_topic = SnsTopic(
      self, "cpu_alarm_topic",
      name=f"ec2-cpu-alarm-notifications-{environment_suffix}",
      tags=create_sanitized_tags({
        "Name": f"CPU Alarm Notifications - {environment_suffix}",
        "Environment": environment_suffix
      }, default_tags)
    )

    # Create CloudWatch alarm for EC2 CPU usage
    CloudwatchMetricAlarm(
      self, "cpu_utilization_alarm",
      alarm_name=f"EC2-CPU-Utilization-High-{environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=300,
      statistic="Average",
      threshold=80,
      alarm_description=f"Alarm when EC2 CPU usage exceeds 80% in {environment_suffix}",
      alarm_actions=[alarm_topic.arn],
      dimensions={
        "InstanceId": ec2_instance.id
      },
      tags=create_sanitized_tags({
        "Name": f"EC2 CPU High Utilization Alarm - {environment_suffix}",
        "Environment": environment_suffix
      }, default_tags)
    )

    # Outputs
    TerraformOutput(
      self, "ec2_instance_id",
      value=ec2_instance.id,
      description="ID of the created EC2 instance"
    )

    TerraformOutput(
      self, "s3_bucket_name",
      value=backup_bucket.bucket,
      description="Name of the S3 backup bucket"
    )

    TerraformOutput(
      self, "iam_role_arn",
      value=ec2_role.arn,
      description="ARN of the IAM role attached to EC2 instance"
    )
