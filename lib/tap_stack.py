"""tap_stack.py
Main CDK stack for the TAP (Test Automation Platform) project.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct
from .s3_stack import S3AccessIamStack


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[TapStackProps] = None,
    **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    bucket_name = self.node.try_get_context("s3BucketName") or "example-prod-bucket"
    bucket_prefix = self.node.try_get_context("s3Prefix") or "apps/tap/"
    trusted_service = (
      self.node.try_get_context("trustedService") or "lambda.amazonaws.com"
    )

    # Expose nested stack as an attribute so tests can target its template
    self.s3_stack = S3AccessIamStack(
      self,
      f"S3AccessIam{environment_suffix}",
      bucket_name=bucket_name,
      bucket_prefix=bucket_prefix,
      trusted_service=trusted_service,
      role_name=f"tap-s3-readonly-{environment_suffix}",
      environment_suffix=environment_suffix,
    )
