"""Integration tests for TAP Stack module."""

import json
import os

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack


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

  def test_stack_synthesis(self):
    """Test that the entire stack can be synthesized."""
    app = App()
    stack = TapStack(
      app,
      "integration-test-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={
        "Environment": "integration",
        "Project": "tap",
      },
    )

    # This should not raise any exceptions
    synth_result = Testing.synth(stack)
    assert synth_result is not None

  def test_complete_infrastructure_synthesis(self):
    """Test synthesis of complete infrastructure."""
    app = App()
    stack = TapStack(
      app,
      "full-integration-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={
        "Environment": "integration",
        "Project": "tap",
        "Testing": "true"
      }
    )

    # Use Testing framework for comprehensive validation
    synth_result = Testing.synth(stack)
    assert synth_result is not None

    # Parse and validate the configuration
    terraform_config = json.loads(synth_result)
    assert "resource" in terraform_config
    assert "provider" in terraform_config

  def test_terraform_plan_validation(self):
    """Test that generated Terraform configuration is valid."""
    app = App()
    stack = TapStack(
      app,
      "plan-validation-stack",
      environment_suffix="validation",
      aws_region="us-west-2"
    )

    synth_result = Testing.synth(stack)
    assert synth_result is not None

    terraform_config = json.loads(synth_result)

    # Validate basic Terraform structure
    assert "terraform" in terraform_config, "Should have terraform block"
    assert "provider" in terraform_config, "Should have provider configuration"
    assert "resource" in terraform_config, "Should have resources"

  def test_resource_naming_conventions(self):
    """Test that all resources follow proper naming conventions."""
    app = App()
    stack = TapStack(
      app,
      "naming-test-stack",
      environment_suffix="naming-test",
      aws_region="us-east-1"
    )

    synth_result = Testing.synth(stack)
    assert synth_result is not None

    terraform_config = json.loads(synth_result)

    # Check that resources include environment suffix
    resources = terraform_config.get("resource", {})
    
    # Check EC2 instances
    ec2_instances = resources.get("aws_instance", {})
    for instance_id, instance_config in ec2_instances.items():
      tags = instance_config.get("tags", {})
      if "Environment" in tags:
        assert "naming-test" in str(tags["Environment"])

    # Check S3 buckets
    s3_buckets = resources.get("aws_s3_bucket", {})
    for bucket_id, bucket_config in s3_buckets.items():
      bucket_name = bucket_config.get("bucket", "")
      if bucket_name:
        assert "naming-test" in bucket_name

  def test_dependency_resolution(self):
    """Test that resource dependencies are properly resolved."""
    app = App()
    stack = TapStack(
      app,
      "dependency-test-stack",
      environment_suffix="deps"
    )

    synth_result = Testing.synth(stack)
    assert synth_result is not None

    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})

    # Check IAM role policy attachments reference the correct role
    attachments = resources.get("aws_iam_role_policy_attachment", {})
    iam_roles = resources.get("aws_iam_role", {})
    
    if attachments and iam_roles:
      for attachment_config in attachments.values():
        role_ref = attachment_config.get("role")
        if role_ref:
          # Should reference a role that exists in the configuration
          # The role name follows pattern: EC2BackupRole-{environment_suffix}
          assert any("EC2BackupRole" in str(role_config.get("name", "")) 
                    for role_config in iam_roles.values()), f"Role reference {role_ref} should match an existing IAM role"

  def test_error_handling_and_validation(self):
    """Test error handling and input validation."""
    app = App()

    # Test with minimal configuration
    try:
      stack = TapStack(app, "minimal-stack")
      synth_result = Testing.synth(stack)
      assert synth_result is not None, "Should handle minimal configuration"
    except Exception as e:
      assert False, f"Should not raise exception with minimal config: {e}"

  # Live environment tests using deployment outputs
  def test_deployment_outputs_exist(self, deployment_outputs):
    """Test that deployment outputs are available and not empty."""
    assert deployment_outputs is not None
    assert isinstance(deployment_outputs, dict)
    # Should have some outputs from the deployed infrastructure
    if deployment_outputs:
      assert len(deployment_outputs) > 0

  def test_ec2_instance_deployed(self, deployment_outputs):
    """Test that EC2 instance was deployed successfully."""
    # Flatten nested outputs structure for CDKTF
    flat_outputs = {}
    for stack_name, stack_outputs in deployment_outputs.items():
      if isinstance(stack_outputs, dict):
        flat_outputs.update(stack_outputs)
    
    # Look for EC2 instance ID in outputs
    ec2_keys = [key for key in flat_outputs.keys() if 'instance' in key.lower() and 'id' in key.lower()]
    if ec2_keys:
      instance_id = flat_outputs[ec2_keys[0]]
      assert instance_id is not None
      assert instance_id.startswith('i-')  # AWS instance ID format
    else:
      pytest.skip("No EC2 instance ID found in deployment outputs")

  def test_s3_bucket_deployed(self, deployment_outputs):
    """Test that S3 bucket was deployed successfully."""
    # Flatten nested outputs structure for CDKTF
    flat_outputs = {}
    for stack_name, stack_outputs in deployment_outputs.items():
      if isinstance(stack_outputs, dict):
        flat_outputs.update(stack_outputs)
    
    # Look for S3 bucket name in outputs
    s3_keys = [key for key in flat_outputs.keys() if 'bucket' in key.lower() and 'name' in key.lower()]
    if s3_keys:
      bucket_name = flat_outputs[s3_keys[0]]
      assert bucket_name is not None
      assert len(bucket_name) > 0
      # Should contain environment suffix
      environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
      assert environment_suffix in bucket_name
    else:
      pytest.skip("No S3 bucket name found in deployment outputs")

  def test_iam_role_deployed(self, deployment_outputs):
    """Test that IAM role was deployed successfully."""
    # Flatten nested outputs structure for CDKTF
    flat_outputs = {}
    for stack_name, stack_outputs in deployment_outputs.items():
      if isinstance(stack_outputs, dict):
        flat_outputs.update(stack_outputs)
    
    # Look for IAM role ARN in outputs
    iam_keys = [key for key in flat_outputs.keys() if 'role' in key.lower() and 'arn' in key.lower()]
    if iam_keys:
      role_arn = flat_outputs[iam_keys[0]]
      assert role_arn is not None
      assert role_arn.startswith('arn:aws:iam::')  # AWS IAM ARN format
      # Should contain environment suffix
      environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
      assert environment_suffix in role_arn
    else:
      pytest.skip("No IAM role ARN found in deployment outputs")

  def test_outputs_structure_validity(self, deployment_outputs):
    """Test that deployment outputs have expected structure."""
    # Verify outputs are in expected format
    for stack_name, stack_outputs in deployment_outputs.items():
      # Stack names should be strings
      assert isinstance(stack_name, str)
      assert len(stack_name) > 0
      
      # Stack outputs should be dictionaries
      if stack_outputs is not None:
        assert isinstance(stack_outputs, dict)
        
        # Individual outputs should be strings (AWS resource identifiers)
        for output_key, output_value in stack_outputs.items():
          assert isinstance(output_key, str)
          assert len(output_key) > 0
          if output_value is not None:
            assert isinstance(output_value, str)
            assert len(output_value) > 0
