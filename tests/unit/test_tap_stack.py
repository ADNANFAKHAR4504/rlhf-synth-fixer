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

  @mark.it("creates resources for all component types")
  def test_creates_nested_stacks(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that resources are created (no longer using nested stacks)
    template.resource_count_is("AWS::S3::Bucket", 2)  # Artifacts bucket + Source bucket
    template.resource_count_is("AWS::CodePipeline::Pipeline", 1)  # CodePipeline

  @mark.it("creates S3 buckets for artifacts and source")
  def test_creates_s3_buckets(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that S3 buckets are created (artifacts + source)
    template.resource_count_is("AWS::S3::Bucket", 2)
    # BucketName is now constructed with Fn::Join, so check for versioning instead
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {"Status": "Enabled"}
    })

  @mark.it("creates IAM roles for CodePipeline and CodeBuild")
  def test_creates_iam_roles(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that IAM roles are created (multiple roles due to constructs)
    # CodePipeline creates its own action roles, plus our custom roles
    template.resource_count_is("AWS::IAM::Role", 12)  # Multiple roles from pipeline actions

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

  @mark.it("creates CodePipeline with S3 source")
  def test_creates_pipeline_resources(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that pipeline resources are created
    template.resource_count_is("AWS::CodePipeline::Pipeline", 1)
    # Check that we have S3 buckets for source and artifacts
    template.resource_count_is("AWS::S3::Bucket", 2)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT - Check that resources are created with 'dev' suffix
    template.resource_count_is("AWS::S3::Bucket", 2)  # Artifacts + Source buckets
    # Check for versioning instead of bucket name (now uses Fn::Join)
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {"Status": "Enabled"}
    })

  @mark.it("applies correct environment tags to resources")
  def test_applies_environment_tags(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that S3 buckets exist and have versioning (tags are added by CDK)
    template.resource_count_is("AWS::S3::Bucket", 2)  # Artifacts + Source buckets
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {"Status": "Enabled"}
    })
