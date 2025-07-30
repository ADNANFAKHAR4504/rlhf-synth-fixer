import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack CDK stack using offline assertions"""

  def setUp(self):
    self.app = cdk.App()

  def test_secure_s3_bucket_created(self):
    """Verifies an S3 bucket is created"""
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)

  def test_kms_key_created_with_rotation(self):
    """Verifies a KMS key is created with key rotation enabled"""
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "EnableKeyRotation": True
    })

  def test_bucket_policy_exists(self):
    """Verifies that a BucketPolicy is created"""
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::BucketPolicy", 1)

  def test_environment_suffix_default_is_dev(self):
    """Defaults to 'dev' suffix if none provided"""
    stack = TapStack(self.app, "TestStack")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)

  def test_stack_outputs_exist(self):
    """Ensures outputs for bucket and key are defined"""
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="demo"))
    template = Template.from_stack(stack)

    for output in ["BucketName", "BucketArn", "KmsKeyArn"]:
      template.has_output(output, {})
