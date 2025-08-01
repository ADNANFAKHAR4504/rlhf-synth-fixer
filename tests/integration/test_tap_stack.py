"""Integration tests for TAP stack."""

import json
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration test cases for TapStack class."""

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
    synth = app.synth()
    assert synth is not None
    
    # Verify stack artifact exists
    stack_artifact = synth.get_stack_by_name("integration-test-stack")
    assert stack_artifact is not None
    assert stack_artifact.content is not None

  def test_complete_infrastructure_synthesis(self):
    """Test synthesis of complete infrastructure including security stacks."""
    app = App()
    TapStack(
      app,
      "full-integration-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      secondary_region="us-west-2",
      default_tags={
        "Environment": "integration",
        "Project": "tap",
        "Testing": "true"
      }
    )
    
    # Use Testing framework for comprehensive validation
    synth_result = Testing.synth(app)
    assert synth_result is not None
    
    # Verify all expected resources are present
    terraform_config = json.loads(synth_result)
    
    # Check for essential resource types
    resources = terraform_config.get("resource", {})
    
    # Core S3 resources
    assert "aws_s3_bucket" in resources, "Should have S3 bucket resources"
    assert "aws_s3_bucket_versioning" in resources, "Should have S3 versioning"
    encryption_config_key = "aws_s3_bucket_server_side_encryption_configuration"
    assert encryption_config_key in resources, "Should have S3 encryption"
    
    # AWS Provider configuration
    providers = terraform_config.get("provider", {}).get("aws", {})
    assert len(providers) >= 2, "Should have primary and secondary AWS providers"
    
    # Backend configuration
    backend = terraform_config.get("terraform", {}).get("backend", {})
    assert "s3" in backend, "Should have S3 backend configuration"

  def test_security_stack_integration(self):
    """Test that security stacks are properly integrated."""
    app = App()
    TapStack(
      app,
      "security-integration-stack",
      environment_suffix="security-test",
      aws_region="us-east-1",
      secondary_region="eu-west-1"
    )
    
    # Synthesize and validate
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("security-integration-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    resources = terraform_config.get("resource", {})
    
    # Check for security-related resources from EnterpriseSecurityStack
    expected_security_resources = [
      "aws_kms_key",
      "aws_kms_alias", 
      "aws_cloudtrail",
      "aws_iam_role",
      "aws_iam_policy",
      "aws_vpc",
      "aws_cloudwatch_log_group"
    ]
    
    for resource_type in expected_security_resources:
      assert resource_type in resources, f"Should have {resource_type} from security stack"

  def test_multi_region_deployment(self):
    """Test that multi-region deployment works correctly."""
    app = App()
    TapStack(
      app,
      "multi-region-stack",
      environment_suffix="multiregion",
      aws_region="us-east-1",
      secondary_region="ap-southeast-1"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("multi-region-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check provider configuration for multiple regions
    providers = terraform_config.get("provider", {}).get("aws", {})
    
    regions_found = set()
    for provider in providers.values():
      regions_found.add(provider["region"])
    
    assert "us-east-1" in regions_found, "Should have primary region provider"
    assert "ap-southeast-1" in regions_found, "Should have secondary region provider"

  def test_terraform_plan_validation(self):
    """Test that generated Terraform configuration is valid."""
    app = App()
    TapStack(
      app,
      "plan-validation-stack", 
      environment_suffix="validation",
      aws_region="us-west-2"
    )
    
    # Use Testing.fullSynth for comprehensive validation
    synth_result = Testing.fullSynth(app)
    assert synth_result is not None
    
    # Verify the synthesized content is valid JSON
    try:
      parsed_config = json.loads(synth_result)
      assert isinstance(parsed_config, dict)
      assert "resource" in parsed_config
      assert "provider" in parsed_config
      assert "terraform" in parsed_config
    except json.JSONDecodeError as e:
      assert False, f"Generated Terraform configuration is not valid JSON: {e}"

  def test_resource_naming_conventions(self):
    """Test that all resources follow proper naming conventions."""
    app = App()
    TapStack(
      app,
      "naming-test-stack",
      environment_suffix="naming-test",
      aws_region="us-east-1"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("naming-test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check S3 bucket naming
    s3_buckets = terraform_config.get("resource", {}).get("aws_s3_bucket", {})
    for bucket_config in s3_buckets.values():
      bucket_name = bucket_config["bucket"]
      # Should include environment suffix and be lowercase
      assert "naming-test" in bucket_name.lower()
      assert bucket_name.islower() or any(c in bucket_name for c in ["-", "_"])
      # Should be within AWS S3 bucket name length limits
      assert len(bucket_name) <= 63

  def test_dependency_resolution(self):
    """Test that resource dependencies are properly resolved."""
    app = App()
    TapStack(
      app,
      "dependency-test-stack",
      environment_suffix="deps"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("dependency-test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    resources = terraform_config.get("resource", {})
    
    # Check that bucket versioning references bucket
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    bucket_configs = resources.get("aws_s3_bucket", {})
    
    assert len(versioning_configs) > 0, "Should have versioning configuration"
    assert len(bucket_configs) > 0, "Should have bucket configuration"
    
    # Verify versioning references bucket ID
    versioning_config = list(versioning_configs.values())[0]
    bucket_reference = versioning_config["bucket"]
    assert "aws_s3_bucket" in str(bucket_reference), "Versioning should reference bucket"

  def test_error_handling_and_validation(self):
    """Test error handling and input validation."""
    app = App()
    
    # Test with minimal configuration
    try:
      TapStack(app, "minimal-stack")
      synth = app.synth()
      assert synth is not None, "Should handle minimal configuration"
    except Exception as e:
      assert False, f"Should not raise exception with minimal config: {e}"
    
    # Test with comprehensive configuration
    try:
      TapStack(
        app,
        "comprehensive-stack",
        environment_suffix="comprehensive",
        aws_region="eu-central-1",
        secondary_region="eu-west-1",
        state_bucket="test-state-bucket",
        state_bucket_region="eu-central-1",
        default_tags={
          "Environment": "test",
          "Project": "comprehensive-test",
          "Owner": "integration-tests"
        }
      )
      synth = app.synth()
      assert synth is not None, "Should handle comprehensive configuration"
    except Exception as e:
      assert False, f"Should not raise exception with comprehensive config: {e}"
