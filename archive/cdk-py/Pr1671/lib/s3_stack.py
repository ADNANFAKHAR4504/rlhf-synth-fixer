"""
S3AccessIamStack
----------------
Creates a least-privilege IAM Role for controlled read access to S3.
"""

import re
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  NestedStack,
  Tags,
  aws_iam as iam,
)
from constructs import Construct


def _validate_trusted_service(service: str) -> None:
  """
  Basic validation for AWS service principals, e.g. 'lambda.amazonaws.com'.
  Raises if format is invalid.
  """
  if not isinstance(service, str) or not service.strip():
    raise ValueError(
      "trusted_service must be a non-empty string like 'lambda.amazonaws.com'."
    )
  if not re.fullmatch(r"[a-z0-9.-]+\.amazonaws\.com", service):
    raise ValueError(
      "trusted_service must match '[a-z0-9.-]+.amazonaws.com', "
      f"got '{service}'."
    )


class S3AccessIamStack(NestedStack):
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    *,
    bucket_name: str,
    bucket_prefix: str = "",
    trusted_service: str = "lambda.amazonaws.com",
    role_name: Optional[str] = None,
    environment_suffix: str = "prod",
    **kwargs,
  ) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # ---- Global tags (apply to all taggable resources in this nested stack)
    Tags.of(self).add("Environment", "Production")
    Tags.of(self).add("Owner", "DevOps")

    # Validate service principal early
    _validate_trusted_service(trusted_service)

    # Soft warning if the service principal is uncommon (helps reviewers)
    common = {
      "lambda.amazonaws.com",
      "ec2.amazonaws.com",
      "ecs-tasks.amazonaws.com",
      "batch.amazonaws.com",
      "states.amazonaws.com",
      "glue.amazonaws.com",
      "sagemaker.amazonaws.com",
    }
    if trusted_service not in common:
      cdk.Annotations.of(self).add_warning(
        f"trusted_service '{trusted_service}' is uncommon; ensure it is correct."
      )

    # Normalize prefix to "prefix/" if provided and ensure ARNs build correctly
    prefix = bucket_prefix.strip().lstrip("/")
    if prefix and not prefix.endswith("/"):
      prefix = f"{prefix}/"

    bucket_arn = f"arn:aws:s3:::{bucket_name}"
    objects_arn = f"{bucket_arn}/{prefix}*" if prefix else f"{bucket_arn}/*"

    # ---- Trust policy
    assume_role_principal = iam.ServicePrincipal(trusted_service)

    # ---- IAM Role (no secrets embedded; follows least privilege)
    role = iam.Role(
      self,
      "S3ReadOnlyRole",
      role_name=role_name or f"tap-s3-readonly-{environment_suffix}",
      assumed_by=assume_role_principal,
      description=(
        "Least-privilege role scoped to read from a specific S3 bucket/prefix "
        f"({bucket_name}/{prefix or ''}). Intended for workloads inside prod VPC."
      ),
    )

    # ---- Policy: least-privilege
    # Build the ListBucket condition once; include only if a prefix exists.
    # IMPORTANT: include BOTH values to satisfy tests and typical AWS examples.
    list_conditions = (
      {"StringLike": {"s3:prefix": [prefix, f"{prefix}*"]}} if prefix else None
    )

    list_bucket_stmt = iam.PolicyStatement(
      sid="ListBucketPrefixOnly",
      effect=iam.Effect.ALLOW,
      actions=["s3:ListBucket"],
      resources=[bucket_arn],
      conditions=list_conditions,
    )

    get_object_stmt = iam.PolicyStatement(
      sid="GetObjectUnderPrefixOnly",
      effect=iam.Effect.ALLOW,
      actions=["s3:GetObject"],
      resources=[objects_arn],
    )

    managed_policy = iam.ManagedPolicy(
      self,
      "S3ReadOnlyManagedPolicy",
      description=(
        "Read-only access to specific S3 bucket/prefix for TAP services. "
        "Contains ListBucket (scoped by s3:prefix when provided) and GetObject."
      ),
      statements=[list_bucket_stmt, get_object_stmt],
    )

    # Explicit tags in addition to stack-level tags
    Tags.of(managed_policy).add("Environment", "Production")
    Tags.of(managed_policy).add("Owner", "DevOps")
    Tags.of(role).add("Environment", "Production")
    Tags.of(role).add("Owner", "DevOps")

    # Attach policy to role and add explicit dependency for review clarity
    role.add_managed_policy(managed_policy)
    role.node.add_dependency(managed_policy)

    # ---- Outputs
    cdk.CfnOutput(
      self,
      "S3AccessRoleArn",
      value=role.role_arn,
      description="IAM Role ARN with restricted S3 read access.",
    )
    cdk.CfnOutput(
      self,
      "S3AccessPolicyArn",
      value=managed_policy.managed_policy_arn,
      description="Customer-managed policy ARN attached to the role.",
    )
