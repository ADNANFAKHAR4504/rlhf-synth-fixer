# lib/s3_stack.py
"""
S3AccessIamStack
----------------
Creates a least-privilege IAM Role for controlled read access to S3.

Design notes:
- We DO NOT create the bucket here; we reference an existing one by name.
- Permissions are minimal:
  * s3:ListBucket -> ONLY for the specified prefix (via s3:prefix condition)
  * s3:GetObject  -> ONLY for objects under that prefix
- Trust is limited to a single AWS service (default: Lambda).
- All resources are tagged with Environment=Production and Owner=DevOps.

Example deploy:
  cdk deploy -c environmentSuffix=prod \
             -c s3BucketName=my-prod-bucket \
             -c s3Prefix=apps/tap/ \
             -c trustedService=lambda.amazonaws.com
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  NestedStack,
  Tags,
  aws_iam as iam,
)
from constructs import Construct


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

    # Normalize prefix to "prefix/" if provided and ensure ARNs build correctly
    prefix = bucket_prefix.strip().lstrip("/")
    if prefix and not prefix.endswith("/"):
      prefix = f"{prefix}/"

    bucket_arn = f"arn:aws:s3:::{bucket_name}"
    objects_arn = f"{bucket_arn}/{prefix}*" if prefix else f"{bucket_arn}/*"

    # ---- Trust policy: default only Lambda; override via -c trustedService=ec2.amazonaws.com
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

    # ---- Customer-managed policy so it can be tagged/audited independently
    # List only under the allowed prefix (prefix condition added only if provided)
    list_bucket_stmt = iam.PolicyStatement(
      sid="ListBucketPrefixOnly",
      effect=iam.Effect.ALLOW,
      actions=["s3:ListBucket"],
      resources=[bucket_arn],
    )
    if prefix:
      list_bucket_stmt.add_conditions({
        # Restrict listing to the given logical 'folder' (no leading slash for s3:prefix)
        "StringLike": {"s3:prefix": [prefix, f"{prefix}*"]},
      })

    # Get objects only under the allowed prefix
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

    # Explicitly tag the managed policy and role (in addition to stack-wide tags)
    Tags.of(managed_policy).add("Environment", "Production")
    Tags.of(managed_policy).add("Owner", "DevOps")
    Tags.of(role).add("Environment", "Production")
    Tags.of(role).add("Owner", "DevOps")

    role.add_managed_policy(managed_policy)

    # ---- Useful outputs for CI/ops
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
