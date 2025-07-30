"""Integration tests for TapStack and SecureS3NestedStack."""
import os
import sys
import pytest
from aws_cdk import assertions, App, Stack
from lib.tap_stack import TapStack, TapStackProps, SecureS3NestedStack


@pytest.fixture(name="app")
def app_fixture():
  """CDK App fixture."""
  return App()


@pytest.fixture(name="stack_props")
def stack_props_fixture():
  """Stack properties fixture."""
  return TapStackProps(
    environment_suffix="test",
    principal_arns=["arn:aws:iam::123456789012:role/test-role"]
  )


@pytest.fixture(name="template")
def template_fixture(app, stack_props):
  """Template fixture for main stack."""
  stack = TapStack(app, "TestTapStack", props=stack_props)
  return assertions.Template.from_stack(stack)


@pytest.fixture(name="nested_stack_template")
def nested_stack_template_fixture(app, stack_props):
  """Template fixture for nested stack."""
  parent_stack = Stack(app, "ParentStack")
  nested_stack = SecureS3NestedStack(
    scope=parent_stack,
    stack_id="TestSecureS3Stack",
    env_suffix="test",
    principal_arns=stack_props.principal_arns
  )
  return assertions.Template.from_stack(nested_stack)


def test_tap_stack_creation(template):
  """Test that TapStack is created with expected nested stack."""
  template.resource_count_is("AWS::CloudFormation::Stack", 1)


def test_secure_s3_nested_stack_creation(nested_stack_template):
  """Test that SecureS3NestedStack is properly structured."""
  nested_stack_template.resource_count_is("AWS::KMS::Key", 1)
  nested_stack_template.has_resource_properties("AWS::KMS::Key", {
    "EnableKeyRotation": True
  })

  nested_stack_template.resource_count_is("AWS::S3::Bucket", 1)
  nested_stack_template.has_resource_properties("AWS::S3::Bucket", {
    "VersioningConfiguration": {"Status": "Enabled"},
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [{
        "ServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms"
        }
      }]
    }
  })


def test_nested_stack_outputs(nested_stack_template):
  """Test that required outputs are created."""
  nested_stack_template.has_output("BucketName", {})
  nested_stack_template.has_output("BucketArn", {})
  nested_stack_template.has_output("KmsKeyArn", {})


def test_removal_policies(nested_stack_template):
  """Test that resources have correct removal policies."""
  nested_stack_template.has_resource("AWS::KMS::Key", {
    "DeletionPolicy": "Delete",
    "UpdateReplacePolicy": "Delete"
  })
  nested_stack_template.has_resource("AWS::S3::Bucket", {
    "DeletionPolicy": "Delete",
    "UpdateReplacePolicy": "Delete"
  })


def test_secure_transport_policy(nested_stack_template):
  """Test that bucket policy enforces HTTPS."""
  nested_stack_template.has_resource_properties("AWS::S3::BucketPolicy", {
    "PolicyDocument": {
      "Statement": assertions.Match.array_with([
        assertions.Match.object_like({
          "Effect": "Deny",
          "Condition": {
            "Bool": {"aws:SecureTransport": "false"}
          }
        })
      ])
    }
  })
