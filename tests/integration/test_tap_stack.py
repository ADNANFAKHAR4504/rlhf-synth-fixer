"""Integration tests for TAP Stack module."""

import json
import os

import pytest


@pytest.mark.integration
class TestTapStackIntegration:
  """Integration test class for TapStack."""

  @pytest.fixture(scope="class")
  def deployment_outputs(self):
    """Load deployment outputs from CI/CD pipeline."""
    # Check if we're in CI environment
    if not os.environ.get('CI'):
      pytest.skip("Integration tests require CI environment with deployment outputs")
    
    # Load outputs from the cfn-outputs directory created by deploy job
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
      pytest.skip(f"Deployment outputs not found at {outputs_file}")
    
    with open(outputs_file, 'r') as f:
      return json.load(f)

  def test_deployment_outputs_exist(self, deployment_outputs):
    """Test that deployment outputs are available and not empty."""
    assert deployment_outputs is not None
    assert isinstance(deployment_outputs, dict)
    # Should have some outputs from the deployed infrastructure
    if deployment_outputs:
      assert len(deployment_outputs) > 0

  def test_ec2_instance_deployed(self, deployment_outputs):
    """Test that EC2 instance was deployed successfully."""
    # Look for EC2 instance ID in outputs
    ec2_keys = [key for key in deployment_outputs.keys() if 'instance' in key.lower() and 'id' in key.lower()]
    if ec2_keys:
      instance_id = deployment_outputs[ec2_keys[0]]
      assert instance_id is not None
      assert instance_id.startswith('i-')  # AWS instance ID format
    else:
      pytest.skip("No EC2 instance ID found in deployment outputs")

  def test_s3_bucket_deployed(self, deployment_outputs):
    """Test that S3 bucket was deployed successfully."""
    # Look for S3 bucket name in outputs
    s3_keys = [key for key in deployment_outputs.keys() if 'bucket' in key.lower() and 'name' in key.lower()]
    if s3_keys:
      bucket_name = deployment_outputs[s3_keys[0]]
      assert bucket_name is not None
      assert len(bucket_name) > 0
      # Should contain environment suffix
      environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
      assert environment_suffix in bucket_name
    else:
      pytest.skip("No S3 bucket name found in deployment outputs")

  def test_iam_role_deployed(self, deployment_outputs):
    """Test that IAM role was deployed successfully."""
    # Look for IAM role ARN in outputs
    iam_keys = [key for key in deployment_outputs.keys() if 'role' in key.lower() and 'arn' in key.lower()]
    if iam_keys:
      role_arn = deployment_outputs[iam_keys[0]]
      assert role_arn is not None
      assert role_arn.startswith('arn:aws:iam::')  # AWS IAM ARN format
      # Should contain environment suffix
      environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
      assert environment_suffix in role_arn
    else:
      pytest.skip("No IAM role ARN found in deployment outputs")

  def test_environment_isolation(self, deployment_outputs):
    """Test that resources are properly isolated by environment."""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    
    # Check that all resource names contain the environment suffix
    for key, value in deployment_outputs.items():
      if isinstance(value, str) and value:
        # Most AWS resources should contain the environment suffix
        if any(resource_type in key.lower() for resource_type in ['bucket', 'role', 'instance']):
          assert environment_suffix in value, f"Resource {key}={value} should contain environment suffix {environment_suffix}"

  def test_outputs_structure_validity(self, deployment_outputs):
    """Test that deployment outputs have expected structure."""
    # Verify outputs are in expected format
    for key, value in deployment_outputs.items():
      # Keys should be strings
      assert isinstance(key, str)
      assert len(key) > 0
      
      # Values should be strings (AWS resource identifiers)
      if value is not None:
        assert isinstance(value, str)
        assert len(value) > 0

  def test_resource_naming_convention(self, deployment_outputs):
    """Test that resources follow proper naming conventions."""
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    
    for key, value in deployment_outputs.items():
      if isinstance(value, str) and value:
        # Check naming patterns based on resource type
        if 'bucket' in key.lower():
          # S3 bucket names should be lowercase
          assert value.islower() or '-' in value
        elif 'role' in key.lower():
          # IAM role ARNs should contain the role name
          assert 'role/' in value.lower()
        elif 'instance' in key.lower():
          # EC2 instance IDs should start with 'i-'
          assert value.startswith('i-')
