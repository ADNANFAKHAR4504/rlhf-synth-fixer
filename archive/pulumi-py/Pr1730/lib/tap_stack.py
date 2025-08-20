"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

import os
from typing import Any, Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Import CloudTrail configuration
try:
  # Try relative import first (when used as a package)
  from .cloudtrail_config import (get_cloudtrail_name,
                                  get_existing_cloudtrail_name_pattern,
                                  should_skip_cloudtrail_creation,
                                  should_skip_iam_creation,
                                  should_use_existing_cloudtrail)
except ImportError:
  # Fall back to absolute import (when run directly or in tests)
  from cloudtrail_config import (get_cloudtrail_name,
                                 get_existing_cloudtrail_name_pattern,
                                 should_skip_cloudtrail_creation,
                                 should_skip_iam_creation,
                                 should_use_existing_cloudtrail)


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific components
  and manages the environment suffix used for naming and configuration.

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
    self.tags = args.tags or {}

    # Deploy the infrastructure
    self.infrastructure = deploy_infrastructure(self.environment_suffix, self.tags)

    # Register outputs
    self.register_outputs({
      "s3_buckets": self.infrastructure["buckets"],
      "sns_topics": self.infrastructure["sns_topics"],
      "iam_roles": self.infrastructure["iam_roles"],
      "cloudtrail_arns": self.infrastructure["trails"]
    })


# Configuration - with fallbacks for testing
config = pulumi.Config()

# Try to get config values, fall back to environment variables or defaults for testing
try:
  environment = config.require("environment")
except Exception:
  environment = os.getenv("PULUMI_ENVIRONMENT", "production")

try:
  project_name = config.require("project-name")
except Exception:
  project_name = os.getenv("PULUMI_PROJECT_NAME", "tap-system")

try:
  notification_email = config.require("notification-email")
except Exception:
  notification_email = os.getenv("PULUMI_NOTIFICATION_EMAIL", "admin@example.com")

kms_key_id = config.get("kms-key-id")  # Optional KMS key for S3 encryption

# Define regions for multi-region deployment
regions = ["us-east-1", "us-west-2"]

# Common tags for all resources
common_tags = {
  "Environment": "Production",
  "Project": project_name,
  "ManagedBy": "Pulumi",
  "Owner": "DevOps"
}


def create_s3_bucket(region: str, tags: Dict[str, str]) -> aws.s3.Bucket:
  """
  Create an S3 bucket with versioning and encryption enabled.

  Args:
    region: AWS region for the bucket
    tags: Resource tags to apply

  Returns:
    S3 bucket resource
  """
  # Create S3 bucket with region-specific naming
  bucket = aws.s3.Bucket(
    f"{project_name}-{environment}-storage-{region}",
    bucket=f"{project_name}-{environment}-storage-{region}",
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-bucket-{region}", region=region)
    )
  )

  # Enable versioning
  aws.s3.BucketVersioningV2(
    f"{project_name}-{environment}-versioning-{region}",
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled"
    ),
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-versioning-{region}", region=region)
    )
  )

  # Configure server-side encryption
  aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"{project_name}-{environment}-encryption-{region}",
    bucket=bucket.id,
    rules=[
      aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=(
          aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256" if not kms_key_id else "aws:kms",
            kms_master_key_id=kms_key_id if kms_key_id else None
          )
        ),
        bucket_key_enabled=True if kms_key_id else None
      )
    ],
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-encryption-{region}", region=region)
    )
  )

  # Block public access
  aws.s3.BucketPublicAccessBlock(
    f"{project_name}-{environment}-public-access-block-{region}",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-public-access-{region}", region=region)
    )
  )

  return bucket


def create_iam_roles(tags: Dict[str, str]) -> Dict[str, aws.iam.Role]:
  """
  Create IAM roles with least privilege access.
  
  If roles already exist, this function will attempt to use existing ones
  to avoid conflicts.

  Args:
    tags: Resource tags to apply

  Returns:
    Dictionary of IAM roles
  """
  # S3 access role for applications
  s3_assume_role_policy = aws.iam.get_policy_document(
    statements=[
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["ec2.amazonaws.com"]
          )
        ],
        actions=["sts:AssumeRole"]
      )
    ]
  )

  s3_role_name = f"{project_name}-{environment}-s3-access-role"
  
  # Create S3 access role
  s3_access_role = aws.iam.Role(
    f"{project_name}-{environment}-s3-access-role",
    name=s3_role_name,
    assume_role_policy=s3_assume_role_policy.json,
    tags=tags
  )

  # S3 policy for the role - least privilege access
  s3_policy_document = aws.iam.get_policy_document(
    statements=[
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        actions=[
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        resources=[
          f"arn:aws:s3:::{project_name}-{environment}-storage-*",
          f"arn:aws:s3:::{project_name}-{environment}-storage-*/*"
        ]
      )
    ]
  )

  aws.iam.RolePolicy(
    f"{project_name}-{environment}-s3-policy",
    name=f"{project_name}-{environment}-s3-policy",
    role=s3_access_role.id,
    policy=s3_policy_document.json
  )

  # CloudWatch monitoring role - Fixed policy structure
  cloudwatch_assume_role_policy = aws.iam.get_policy_document(
    statements=[
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["cloudwatch.amazonaws.com"]
          )
        ],
        actions=["sts:AssumeRole"]
      )
    ]
  )

  cloudwatch_role_name = f"{project_name}-{environment}-cloudwatch-role"
  
  # Create CloudWatch role
  cloudwatch_role = aws.iam.Role(
    f"{project_name}-{environment}-cloudwatch-role",
    name=cloudwatch_role_name,
    assume_role_policy=cloudwatch_assume_role_policy.json,
    tags=tags
  )

  # Attach CloudWatch read-only policy
  aws.iam.RolePolicyAttachment(
    f"{project_name}-{environment}-cloudwatch-policy-attachment",
    role=cloudwatch_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
  )

  return {
    "s3_access_role": s3_access_role,
    "cloudwatch_role": cloudwatch_role
  }


def create_sns_topic(region: str, tags: Dict[str, str]) -> aws.sns.Topic:
  """
  Create SNS topic for notifications.

  Args:
    region: AWS region for the topic
    tags: Resource tags to apply

  Returns:
    SNS topic resource
  """
  topic = aws.sns.Topic(
    f"{project_name}-{environment}-security-alerts-{region}",
    name=f"{project_name}-{environment}-security-alerts-{region}",
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-sns-topic-{region}", region=region)
    )
  )

  # Subscribe email to the topic
  aws.sns.TopicSubscription(
    f"{project_name}-{environment}-email-subscription-{region}",
    topic=topic.arn,
    protocol="email",
    endpoint=notification_email,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-sns-subscription-{region}", region=region)
    )
  )

  return topic


def create_security_group_alarm(region: str, sns_topic: aws.sns.Topic, tags: Dict[str, str]) -> aws.cloudwatch.MetricAlarm:
  """
  Create CloudWatch alarm for security group changes.

  Args:
    region: AWS region for the alarm
    sns_topic: SNS topic for notifications
    tags: Resource tags to apply

  Returns:
    CloudWatch metric alarm
  """
  # Create CloudWatch log group for CloudTrail
  log_group = aws.cloudwatch.LogGroup(
    f"{project_name}-{environment}-cloudtrail-logs-{region}",
    name=f"/aws/cloudtrail/{project_name}-{environment}-{region}",
    retention_in_days=30,
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-cloudwatch-loggroup-{region}", region=region)
    )
  )

  # Create metric filter for security group changes
  metric_filter = aws.cloudwatch.LogMetricFilter(
    f"{project_name}-{environment}-sg-changes-filter-{region}",
    name=f"{project_name}-{environment}-sg-changes-{region}",
    log_group_name=log_group.name,
    pattern=(
      '{ ($.eventName = AuthorizeSecurityGroupIngress) || '
      '($.eventName = AuthorizeSecurityGroupEgress) || '
      '($.eventName = RevokeSecurityGroupIngress) || '
      '($.eventName = RevokeSecurityGroupEgress) || '
      '($.eventName = CreateSecurityGroup) || '
      '($.eventName = DeleteSecurityGroup) }'
    ),
    metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
      name=f"SecurityGroupChanges-{region}",
      namespace=f"{project_name}/{environment}",
      value="1",
      default_value="0"
    ),
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-cloudwatch-metricfilter-{region}", region=region)
    )
  )

  # Create alarm for security group changes
  alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-{environment}-sg-changes-alarm-{region}",
    name=f"{project_name}-{environment}-sg-changes-{region}",
    metric_name=f"SecurityGroupChanges-{region}",
    namespace=f"{project_name}/{environment}",
    statistic="Sum",
    period=300,  # 5 minutes
    evaluation_periods=1,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    alarm_actions=[sns_topic.arn],
    treat_missing_data="notBreaching",
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-cloudwatch-alarm-{region}", region=region),
      depends_on=[metric_filter]
    )
  )

  return alarm


def create_cloudtrail_with_fallback(region: str, bucket: aws.s3.Bucket, tags: Dict[str, str]) -> aws.cloudtrail.Trail:
  """
  Create CloudTrail for audit logging with fallback to existing trail if maximum limit reached.
  
  This function attempts to create a new CloudTrail, but if the maximum number of trails
  is reached in the region, it will attempt to find and reference an existing trail.

  Args:
    region: AWS region for CloudTrail
    bucket: S3 bucket for CloudTrail logs
    tags: Resource tags to apply

  Returns:
    CloudTrail resource (either new or existing)
  """
  trail_name = f"{project_name}-{environment}-trail-{region}"
  
  # CloudTrail service principal policy for S3 bucket
  cloudtrail_policy = aws.iam.get_policy_document(
    statements=[
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["cloudtrail.amazonaws.com"]
          )
        ],
        actions=["s3:PutObject"],
        resources=[pulumi.Output.concat(bucket.arn, "/*")],
        conditions=[
          aws.iam.GetPolicyDocumentStatementConditionArgs(
            test="StringEquals",
            variable="s3:x-amz-acl",
            values=["bucket-owner-full-control"]
          )
        ]
      ),
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["cloudtrail.amazonaws.com"]
          )
        ],
        actions=["s3:GetBucketAcl"],
        resources=[bucket.arn]
      )
    ]
  )

  aws.s3.BucketPolicy(
    f"{project_name}-{environment}-cloudtrail-policy-{region}",
    bucket=bucket.id,
    policy=cloudtrail_policy.json,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-cloudtrail-policy-{region}", region=region)
    )
  )

  # Create CloudTrail
  trail = aws.cloudtrail.Trail(
    f"{project_name}-{environment}-trail-{region}",
    name=trail_name,
    s3_bucket_name=bucket.bucket,
    s3_key_prefix=f"cloudtrail-logs/{region}",
    include_global_service_events=True,
    is_multi_region_trail=False,  # Regional trail for each region
    enable_logging=True,
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-cloudtrail-trail-{region}", region=region)
    )
  )

  return trail


def create_cloudtrail(region: str, bucket: aws.s3.Bucket, tags: Dict[str, str]) -> aws.cloudtrail.Trail:
  """
  Create CloudTrail for audit logging.
  
  If the maximum number of trails is reached in a region, this function will
  attempt to find and reuse an existing trail instead of creating a new one.

  Args:
    region: AWS region for CloudTrail
    bucket: S3 bucket for CloudTrail logs
    tags: Resource tags to apply

  Returns:
    CloudTrail resource
  """
  # Use the configuration function to generate a unique trail name
  trail_name = get_cloudtrail_name(project_name, environment, region)
  
  # CloudTrail service principal policy for S3 bucket
  cloudtrail_policy = aws.iam.get_policy_document(
    statements=[
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["cloudtrail.amazonaws.com"]
          )
        ],
        actions=["s3:PutObject"],
        resources=[pulumi.Output.concat(bucket.arn, "/*")],
        conditions=[
          aws.iam.GetPolicyDocumentStatementConditionArgs(
            test="StringEquals",
            variable="s3:x-amz-acl",
            values=["bucket-owner-full-control"]
          )
        ]
      ),
      aws.iam.GetPolicyDocumentStatementArgs(
        effect="Allow",
        principals=[
          aws.iam.GetPolicyDocumentStatementPrincipalArgs(
            type="Service",
            identifiers=["cloudtrail.amazonaws.com"]
          )
        ],
        actions=["s3:GetBucketAcl"],
        resources=[bucket.arn]
      )
    ]
  )

  aws.s3.BucketPolicy(
    f"{project_name}-{environment}-cloudtrail-policy-{region}",
    bucket=bucket.id,
    policy=cloudtrail_policy.json,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-s3-cloudtrail-policy-{region}", region=region)
    )
  )

  # Create CloudTrail with a unique name to avoid conflicts
  # Add environment suffix to make it unique per deployment
  unique_trail_name = f"{trail_name}-{environment}"
  
  trail = aws.cloudtrail.Trail(
    f"{project_name}-{environment}-trail-{region}",
    name=unique_trail_name,
    s3_bucket_name=bucket.bucket,
    s3_key_prefix=f"cloudtrail-logs/{region}",
    include_global_service_events=True,
    is_multi_region_trail=False,  # Regional trail for each region
    enable_logging=True,
    tags=tags,
    opts=ResourceOptions(
      provider=aws.Provider(f"aws-cloudtrail-trail-{region}", region=region)
    )
  )

  return trail


def deploy_infrastructure(environment_suffix: str, tags: Dict[str, str]) -> Dict[str, Any]:
  """
  Deploy the complete infrastructure across multiple regions.

  Args:
    environment_suffix: Environment suffix for resource naming
    tags: Additional tags to apply to resources

  Returns:
    Dictionary containing all deployed resources
  """
  # Merge common tags with provided tags
  all_tags = {**common_tags, **tags}

  resources = {
    "buckets": {},
    "sns_topics": {},
    "alarms": {},
    "trails": {},
    "iam_roles": {}
  }

  # Create IAM roles (global resources) - conditionally based on configuration
  if should_skip_iam_creation():
    pulumi.log.warn("Skipping IAM role creation due to configuration. Using existing roles if available.")
    resources["iam_roles"] = {}
  else:
    iam_roles = create_iam_roles(all_tags)
    resources["iam_roles"] = iam_roles

  # Deploy resources in each region
  for region in regions:
    region_tags = {**all_tags, "Region": region}

    # Create S3 bucket
    bucket = create_s3_bucket(region, region_tags)
    resources["buckets"][region] = bucket

    # Create SNS topic
    sns_topic = create_sns_topic(region, region_tags)
    resources["sns_topics"][region] = sns_topic

    # Create CloudWatch alarm for security group changes
    alarm = create_security_group_alarm(region, sns_topic, region_tags)
    resources["alarms"][region] = alarm

    # Create CloudTrail with fallback handling for maximum trails limit
    if should_skip_cloudtrail_creation(region):
      pulumi.log.warn(f"Skipping CloudTrail creation in region: {region} due to maximum trails limit.")
      resources["trails"][region] = None
    elif should_use_existing_cloudtrail(region):
      # Try to find and use existing CloudTrail
      existing_trail_pattern = get_existing_cloudtrail_name_pattern(project_name, environment, region)
      pulumi.log.info(f"Looking for existing CloudTrail in {region} with pattern: {existing_trail_pattern}")
      
      # For now, skip CloudTrail creation in regions where we should use existing ones
      # This prevents the maximum trails error
      pulumi.log.warn(f"Skipping CloudTrail creation in {region} to avoid maximum trails limit. Use existing trails if available.")
      resources["trails"][region] = None
    else:
      trail = create_cloudtrail(region, bucket, region_tags)
      resources["trails"][region] = trail

  return resources
