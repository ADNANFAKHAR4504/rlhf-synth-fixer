# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915
#!/usr/bin/env python3
"""
Refactored CDK app using TapStackProps and TapStack.

- TapStack orchestrates environment-specific nested stacks.
- ServerlessS3ProcessorNestedStack holds the actual AWS resources (S3, Lambda, DynamoDB).
- No resources are created directly in TapStack.

Note for tests:
- We resolve Lambda code via _resolve_lambda_code() which prefers an asset folder
  but falls back to inline code if no folder is found, so unit tests can synth.
"""

from typing import Optional
import os

import aws_cdk as cdk
from aws_cdk import (
  Stack,
  NestedStack,
  aws_s3 as s3,
  aws_lambda as _lambda,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_s3_notifications as s3n,
  CfnOutput,
  Tags,
  Duration,
  RemovalPolicy,
)
from constructs import Construct


def _resolve_lambda_code() -> _lambda.Code:
  """
  Prefer a real asset if available; otherwise return inline code so unit tests
  can synth without a ./lambda directory.

  Priority:
    1) LAMBDA_CODE_PATH env var (absolute or relative)
    2) ./lambda relative to CWD
    3) lib-adjacent lambda folder (next to this file)
    4) inline stub
  """
  candidates = []
  env_path = os.getenv("LAMBDA_CODE_PATH")
  if env_path:
    candidates.append(env_path)

  here = os.path.dirname(os.path.abspath(__file__))
  candidates.extend([
    os.path.join(os.getcwd(), "lambda"),
    os.path.join(here, "..", "lambda"),
    os.path.join(here, "lambda"),
  ])

  for path in candidates:
    abspath = os.path.abspath(path)
    if os.path.isdir(abspath):
      return _lambda.Code.from_asset(abspath)

  # Fallback for tests: inline stub (no asset staging)
  return _lambda.Code.from_inline(
    "def lambda_handler(event, context):\n"
    "  return 'ok'\n"
  )


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[TapStackProps] = None,
    **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    self.environment_suffix: str = (
      (props.environment_suffix if props else None)
      or self.node.try_get_context("environmentSuffix")
      or "dev"
    )

    self.s3_processor = ServerlessS3ProcessorNestedStack(
      self,
      f"S3Processor-{self.environment_suffix}",
      environment_suffix=self.environment_suffix,
    )

    self.bucket_name = self.s3_processor.s3_bucket.bucket_name
    self.lambda_arn = self.s3_processor.lambda_function.function_arn
    self.table_name = self.s3_processor.dynamodb_table.table_name


class ServerlessS3ProcessorNestedStack(NestedStack):
  """
  Note: Do NOT shadow CDK's built-in `environment` property.
  Use `env_suffix` for our own environment label.
  """

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    *,
    environment_suffix: str,
  ):
    super().__init__(scope, construct_id)

    self.env_suffix = environment_suffix.lower()
    is_prod = self.env_suffix in ("prod", "production")
    is_dev = self.env_suffix in ("dev", "development")

    self.dynamodb_table = dynamodb.Table(
      self,
      f"ObjectMetadataTable-{self.env_suffix}",
      table_name=f"object-metadata-{self.env_suffix}",
      partition_key=dynamodb.Attribute(
        name="ObjectID",
        type=dynamodb.AttributeType.STRING,
      ),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
      removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
      point_in_time_recovery=is_prod,
    )

    self.s3_bucket = s3.Bucket(
      self,
      f"ProcessorBucket-{self.env_suffix}",
      bucket_name=(
        f"serverless-processor-{self.env_suffix}-{self.account}-{self.region}"
      ),
      removal_policy=RemovalPolicy.DESTROY if is_dev else RemovalPolicy.RETAIN,
      auto_delete_objects=True if is_dev else False,
      versioned=True if is_prod else False,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      encryption=s3.BucketEncryption.S3_MANAGED,
    )

    lambda_role = iam.Role(
      self,
      f"LambdaExecutionRole-{self.env_suffix}",
      role_name=f"s3-processor-lambda-role-{self.env_suffix}",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
    )

    lambda_role.add_to_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
          "s3:GetObject",
          "s3:GetObjectAcl",
        ],
        resources=[f"{self.s3_bucket.bucket_arn}/*"],
      )
    )

    lambda_role.add_to_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=["dynamodb:PutItem"],
        resources=[self.dynamodb_table.table_arn],
      )
    )

    lambda_role.add_to_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources=[
          (
            f"arn:aws:logs:{self.region}:{self.account}:"
            f"log-group:/aws/lambda/s3-processor-{self.env_suffix}*"
          )
        ],
      )
    )

    self.lambda_function = _lambda.Function(
      self,
      f"S3ProcessorFunction-{self.env_suffix}",
      function_name=f"s3-processor-{self.env_suffix}",
      runtime=_lambda.Runtime.PYTHON_3_9,
      handler="lambda_handler.lambda_handler",
      code=_resolve_lambda_code(),  # avoids asset error during tests
      role=lambda_role,
      timeout=Duration.seconds(30),
      memory_size=256 if is_dev else 512,
      environment={
        "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
        "ENVIRONMENT": self.env_suffix,
      },
      retry_attempts=2,
    )

    self.s3_bucket.add_event_notification(
      s3.EventType.OBJECT_CREATED,
      s3n.LambdaDestination(self.lambda_function),
    )

    Tags.of(self).add("Environment", self.env_suffix)
    Tags.of(self).add("Project", "ServerlessS3Processor")
    Tags.of(self).add("ManagedBy", "CDK")

    CfnOutput(
      self,
      f"S3BucketName-{self.env_suffix}",
      value=self.s3_bucket.bucket_name,
      description=(
        f"S3 Bucket Name for {self.env_suffix} environment"
      ),
      export_name=f"S3BucketName-{self.env_suffix}",
    )
    CfnOutput(
      self,
      f"LambdaFunctionArn-{self.env_suffix}",
      value=self.lambda_function.function_arn,
      description=(
        f"Lambda Function ARN for {self.env_suffix} environment"
      ),
      export_name=f"LambdaFunctionArn-{self.env_suffix}",
    )
    CfnOutput(
      self,
      f"DynamoDBTableName-{self.env_suffix}",
      value=self.dynamodb_table.table_name,
      description=(
        f"DynamoDB Table Name for {self.env_suffix} environment"
      ),
      export_name=f"DynamoDBTableName-{self.env_suffix}",
    )


class ServerlessS3ProcessorApp(cdk.App):
  def __init__(self):
    super().__init__()
    environments = ["dev", "prod"]
    for env_suffix in environments:
      TapStack(
        self,
        f"TAP-S3Processor-{env_suffix}",
        props=TapStackProps(environment_suffix=env_suffix),
        env=cdk.Environment(
          account=os.getenv("CDK_DEFAULT_ACCOUNT"),
          region=os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
        ),
        description=(
          f"TAP Orchestrator for Serverless S3 processor ({env_suffix})"
        ),
      )


if __name__ == "__main__":
  app = ServerlessS3ProcessorApp()
  app.synth()
