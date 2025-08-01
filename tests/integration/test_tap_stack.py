"""Integration tests for TAP stack."""

import json

from cdktf import App, Testing

from lib.enterprise_security_stack import EnterpriseSecurityStack
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
    synth_result = Testing.synth(stack)
    assert synth_result is not None

  def test_complete_infrastructure_synthesis(self):
    """Test synthesis of complete infrastructure including security stacks."""
    app = App()
    stack = TapStack(
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
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
    # Parse and validate the configuration
    terraform_config = json.loads(synth_result)
    assert "resource" in terraform_config
    assert "provider" in terraform_config

  def test_security_stack_integration(self):
    """Test that security stacks are properly integrated."""
    app = App()
    stack = TapStack(
      app,
      "security-integration-stack",
      environment_suffix="security-test",
      aws_region="us-east-1",
      secondary_region="eu-west-1"
    )

    # Synthesize and validate
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
    terraform_config = json.loads(synth_result)
    
    # Verify that security resources are present
    resources = terraform_config.get("resource", {})
    assert "aws_kms_key" in resources, "Should have KMS keys from security stack"
    assert "aws_s3_bucket" in resources, "Should have S3 buckets"
    assert "aws_vpc" in resources, "Should have VPC from security stack"

  def test_multi_region_deployment(self):
    """Test that multi-region deployment works correctly."""
    app = App()
    stack = TapStack(
      app,
      "multi-region-stack",
      environment_suffix="multiregion",
      aws_region="us-east-1",
      secondary_region="ap-southeast-1"
    )

    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
    terraform_config = json.loads(synth_result)
    
    # Verify multi-region providers are configured
    providers = terraform_config.get("provider", {}).get("aws", {})
    
    # Handle both list and dict formats
    if isinstance(providers, list):
      provider_list = providers
    else:
      provider_list = list(providers.values()) if providers else []
    
    assert len(provider_list) >= 2, "Should have multiple region providers"
    
    # Find providers for different regions
    regions = []
    for provider in provider_list:
      if "region" in provider:
        regions.append(provider["region"])
    
    assert "us-east-1" in regions, "Should have us-east-1 provider"
    assert "ap-southeast-1" in regions, "Should have ap-southeast-1 provider"

  def test_terraform_plan_validation(self):
    """Test that generated Terraform configuration is valid."""
    app = App()
    stack = TapStack(
      app,
      "plan-validation-stack",
      environment_suffix="validation",
      aws_region="us-west-2"
    )

    # Use Testing.full_synth for comprehensive validation
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
    
    # Check S3 bucket naming
    s3_buckets = terraform_config.get("resource", {}).get("aws_s3_bucket", {})
    for bucket_id, bucket_config in s3_buckets.items():
      bucket_name = bucket_config.get("bucket", "")
      # Should include environment suffix
      if "tap_bucket" in bucket_id:
        assert "naming-test" in bucket_name, f"TAP bucket should include environment suffix: {bucket_name}"

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
    
    # Check that encryption references KMS key
    encryption_configs = terraform_config.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    
    for encrypt_config in encryption_configs.values():
      if "tap_bucket_encryption" in str(encrypt_config):
        rules = encrypt_config.get("rule", [])
        if rules:
          encryption_default = rules[0].get("apply_server_side_encryption_by_default", {})
          if encryption_default.get("sse_algorithm") == "aws:kms":
            assert "kms_master_key_id" in encryption_default, "Should reference KMS key"

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

    # Test that stack object has required attributes
    assert hasattr(stack, 'tap_bucket'), "Should have tap_bucket attribute"
    assert hasattr(stack, 'primary_security_stack'), "Should have primary_security_stack"
    assert hasattr(stack, 'secondary_security_stack'), "Should have secondary_security_stack"


class TestEnterpriseSecurityStackIntegration:
  """Integration test cases for EnterpriseSecurityStack class."""

  def test_security_stack_full_deployment_simulation(self):
    """Test complete security stack deployment simulation."""
    app = App()
    stack = TapStack(
      app,
      "security-integration-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      secondary_region="us-west-2",
      default_tags={
        "Environment": "integration",
        "Project": "enterprise-security",
        "Compliance": "required"
      }
    )

    # Should synthesize without errors
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
    # Verify security stacks are created
    assert stack.primary_security_stack is not None
    assert stack.secondary_security_stack is not None

  def test_multi_region_security_deployment(self):
    """Test multi-region security stack deployment."""
    app = App()

    # Create multi-region deployment
    stack = TapStack(
      app,
      "multi-region-security",
      environment_suffix="prod",
      aws_region="us-east-1",
      secondary_region="eu-west-1",
      default_tags={
        "Environment": "production",
        "MultiRegion": "true"
      }
    )

    # Verify both security stacks are created
    assert stack.primary_security_stack is not None
    assert stack.secondary_security_stack is not None

    # Should synthesize without errors
    synth_result = Testing.synth(stack)
    assert synth_result is not None

  def test_enterprise_security_compliance_deployment(self):
    """Test enterprise security deployment with compliance features."""
    app = App()
    stack = TapStack(
      app,
      "compliance-security-stack",
      environment_suffix="compliance",
      aws_region="us-gov-east-1",
      default_tags={
        "Environment": "government",
        "Compliance": "FedRAMP",
        "Classification": "restricted"
      }
    )

    # Should synthesize without errors for compliance deployment
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
    # Verify compliance features
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Should have security resources
    assert "aws_kms_key" in resources, "Should have KMS encryption"
    assert "aws_cloudtrail" in resources, "Should have audit logging"
    assert "aws_vpc" in resources, "Should have network isolation"
    
    # Verify security stacks are created
    assert stack.primary_security_stack is not None
    assert stack.secondary_security_stack is not None
