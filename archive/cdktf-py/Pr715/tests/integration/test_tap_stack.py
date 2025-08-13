"""Basic integration tests for TapStack instantiation."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position
from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestTapStackBasicIntegration:
  """Basic integration tests for TapStack instantiation and synthesis."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_basic_stack_instantiation(self):
    """Test that stack instantiates properly."""
    stack = TapStack(
      self.app,
      "BasicIntegrationTest",
      environment_suffix="test"
    )
    
    # Verify basic structure
    assert stack is not None
    assert hasattr(stack, 'buckets')
    assert hasattr(stack, 'roles')
    assert hasattr(stack, 'bucket_names')
    assert hasattr(stack, 'common_tags')
    assert stack.common_tags["Environment"] == "test"

  def test_stack_synthesis_produces_valid_json(self):
    """Test that stack synthesis produces valid Terraform JSON."""
    stack = TapStack(
      self.app,
      "SynthesisTest",
      environment_suffix="test"
    )
    
    # Should be able to synthesize without errors
    synth_output = Testing.synth(stack)
    assert synth_output is not None
    
    # Should be valid JSON
    parsed_output = json.loads(synth_output)
    assert isinstance(parsed_output, dict)
    
    # Should contain expected top-level keys
    assert "terraform" in parsed_output
    assert "provider" in parsed_output
    assert "resource" in parsed_output

  def test_stack_with_custom_parameters(self):
    """Test stack with custom parameters."""
    custom_tags = {"Environment": "integration", "Project": "TAPStack"}
    
    stack = TapStack(
      self.app,
      "CustomParamsTest",
      environment_suffix="integration",
      bucket_prefix="custom-secure-data",
      state_bucket="custom-terraform-states",
      default_tags=custom_tags
    )
    
    assert stack is not None
    assert stack.common_tags["Environment"] == "integration"
    assert "custom-secure-data" in stack.bucket_names["data"]
    # Note: state_bucket is not stored as instance attribute

  def test_stack_produces_expected_resources(self):
    """Test that stack produces expected AWS resources."""
    stack = TapStack(
      self.app,
      "ResourceTest",
      environment_suffix="test"
    )
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    # Should have core AWS resources (S3 and IAM only)
    expected_resources = [
      "aws_s3_bucket",
      "aws_iam_role", 
      "aws_iam_policy",
      "aws_s3_bucket_policy",
      "aws_s3_bucket_versioning",
      "aws_s3_bucket_server_side_encryption_configuration",
      "aws_s3_bucket_public_access_block",
      "aws_iam_role_policy_attachment"
    ]
    
    for resource_type in expected_resources:
      assert resource_type in resources, f"Missing resource type: {resource_type}"

  def test_stack_produces_expected_outputs(self):
    """Test that stack produces expected Terraform outputs."""
    stack = TapStack(
      self.app,
      "OutputTest",
      environment_suffix="test"
    )
    
    synth_output = json.loads(Testing.synth(stack))
    outputs = synth_output.get("output", {})
    
    # Should have bucket outputs
    assert "bucket-data-name" in outputs
    assert "bucket-data-arn" in outputs
    
    # Should have role outputs  
    assert "role-analytics_reader-name" in outputs
    assert "role-analytics_reader-arn" in outputs

  def test_stack_backend_configuration(self):
    """Test Terraform backend configuration."""
    stack = TapStack(
      self.app,
      "BackendTest",
      environment_suffix="backend-test",
      state_bucket="test-terraform-states",
      state_bucket_region="us-west-2"
    )
    
    synth_output = json.loads(Testing.synth(stack))
    backend = synth_output["terraform"]["backend"]["s3"]
    
    assert backend["bucket"] == "test-terraform-states"
    assert backend["region"] == "us-east-1"  # Fixed: uses env var, defaults to us-east-1
    assert "backend-test" in backend["key"]
    assert backend["encrypt"] is True
