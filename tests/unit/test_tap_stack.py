# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

ACCOUNT = "111111111111"
REGION = "us-east-1"


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()
    self.env = cdk.Environment(account=ACCOUNT, region=REGION)

  @mark.it("does not create resources directly; only composes nested stacks")
  def test_tapstack_is_just_orchestration(self):
    stack = TapStack(
      self.app,
      "TapStackOrchestratorOnly",
      props=TapStackProps(environment_suffix="dev"),
      env=self.env,
    )
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 0)
    template.resource_count_is("AWS::Lambda::Function", 0)
    template.resource_count_is("AWS::DynamoDB::Table", 0)
    template.resource_count_is("AWS::CloudFormation::Stack", 1)

  @mark.it("creates an S3 bucket in the nested stack with the correct env suffix")
  def test_nested_creates_s3_bucket_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackWithNested",
      props=TapStackProps(environment_suffix=env_suffix),
      env=self.env,
    )
    nested = Template.from_stack(stack.s3_processor)
    expected_bucket_name = f"serverless-processor-{env_suffix}-{ACCOUNT}-{REGION}"

    nested.resource_count_is("AWS::S3::Bucket", 1)
    nested.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketName": expected_bucket_name,
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": True,
          "BlockPublicPolicy": True,
          "IgnorePublicAcls": True,
          "RestrictPublicBuckets": True,
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": Match.array_with([
            Match.object_like({"ServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}})
          ])
        },
      },
    )

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackDefaultEnv", env=self.env)
    nested = Template.from_stack(stack.s3_processor)
    expected_bucket_name = f"serverless-processor-dev-{ACCOUNT}-{REGION}"
    nested.has_resource_properties("AWS::S3::Bucket", {"BucketName": expected_bucket_name})

  @mark.it("uses Python 3.11 runtime, DLQ, Insights and tracing")
  def test_lambda_settings(self):
    stack = TapStack(
      self.app,
      "TapStackLambdaCfg",
      props=TapStackProps(environment_suffix="dev"),
      env=self.env,
    )
    nested = Template.from_stack(stack.s3_processor)
    nested.has_resource_properties(
      "AWS::Lambda::Function",
      {
        "Runtime": "python3.11",
        "TracingConfig": {"Mode": "Active"},
        "DeadLetterConfig": {"TargetArn": Match.any_value()},
        "Environment": {"Variables": {"DYNAMODB_TABLE_NAME": Match.any_value()}},
      },
    )
    # DLQ exists
    nested.resource_count_is("AWS::SQS::Queue", 1)

  @mark.it("enables KMS CMK and DynamoDB SSE-KMS")
  def test_kms_and_ddb_encryption(self):
    stack = TapStack(
      self.app,
      "TapStackKmsDdb",
      props=TapStackProps(environment_suffix="prod"),
      env=self.env,
    )
    nested = Template.from_stack(stack.s3_processor)
    # KMS Key
    nested.resource_count_is("AWS::KMS::Key", 1)
    # DynamoDB table SSE with KMS
    nested.has_resource_properties(
      "AWS::DynamoDB::Table",
      {
        "SSESpecification": {
          "SSEEnabled": True,
          "SSEType": "KMS",
        }
      },
    )

  @mark.it("wires S3 -> Lambda via custom notifications resource")
  def test_s3_triggers_lambda(self):
    stack = TapStack(
      self.app,
      "TapStackNotifications",
      props=TapStackProps(environment_suffix="dev"),
      env=self.env,
    )
    nested = Template.from_stack(stack.s3_processor)
    # CDK uses Custom::S3BucketNotifications
    nested.resource_count_is("Custom::S3BucketNotifications", 1)
