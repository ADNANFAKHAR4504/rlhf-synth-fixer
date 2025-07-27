import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates nested stacks for all resource types")
  def test_creates_nested_stacks(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that nested stacks are created
    template.resource_count_is("AWS::CloudFormation::Stack", 4)  # IAM, S3, CodeBuild, CodePipeline

  @mark.it("creates S3 artifacts bucket with correct naming pattern")
  def test_creates_s3_artifacts_bucket(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that S3 bucket is created with correct naming
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"ciapp-{env_suffix}-artifacts-{cdk.Aws.ACCOUNT_ID}"
    })

  @mark.it("creates IAM roles for CodePipeline and CodeBuild")
  def test_creates_iam_roles(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that IAM roles are created
    template.resource_count_is("AWS::IAM::Role", 3)  # CodePipeline, CodeBuild, CloudFormation

  @mark.it("creates CodeBuild projects for build and deployment")
  def test_creates_codebuild_projects(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that CodeBuild projects are created
    # Build, Deploy Staging, Deploy Production
    template.resource_count_is("AWS::CodeBuild::Project", 3)

  @mark.it("creates CodeCommit repository and CodePipeline")
  def test_creates_pipeline_resources(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that pipeline resources are created
    template.resource_count_is("AWS::CodeCommit::Repository", 1)
    template.resource_count_is("AWS::CodePipeline::Pipeline", 1)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT - Check that resources are created with 'dev' suffix
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"ciapp-dev-artifacts-{cdk.Aws.ACCOUNT_ID}"
    })

  @mark.it("applies correct environment tags to resources")
  def test_applies_environment_tags(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that environment tags are applied
    template.has_resource_properties("AWS::S3::Bucket", {
        "Tags": [
            {
                "Key": "Environment",
                "Value": env_suffix
            },
            {
                "Key": "Component", 
                "Value": "Storage"
            }
        ]
    })
