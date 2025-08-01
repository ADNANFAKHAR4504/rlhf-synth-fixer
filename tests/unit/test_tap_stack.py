"""Unit tests for TAP stack."""

import json

from cdktf import App

from lib.tap_stack import TapStack


class TestTapStack:
  """Test cases for TapStack class."""

  def test_tap_stack_creation(self):
    """Test that TAP stack can be created without errors."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-west-2",
      default_tags={
        "Environment": "test",
        "Project": "tap"
      }
    )
    
    # Synthesize the stack to ensure no errors
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    assert stack_artifact is not None
    
    # Verify the stack object has expected attributes
    assert hasattr(stack, 'tap_bucket')
    assert hasattr(stack, 'primary_security_stack')
    assert hasattr(stack, 'secondary_security_stack')

  def test_stack_s3_bucket_configuration(self):
    """Test that S3 bucket is configured with proper settings."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-west-2"
    )
    
    # Synthesize and get the configuration
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Find S3 bucket resources
    s3_buckets = [
      res for res in terraform_config.get("resource", {}).get("aws_s3_bucket", {}).values()
    ]
    assert len(s3_buckets) > 0, "Should have at least one S3 bucket"
    
    # Verify bucket naming convention
    bucket = s3_buckets[0]
    assert "tap-bucket-test" in bucket["bucket"]
    assert bucket["force_destroy"] is True

  def test_stack_s3_versioning_configuration(self):
    """Test that S3 bucket versioning is properly configured."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check for versioning configuration
    versioning_configs = terraform_config.get("resource", {}).get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) > 0, "Should have S3 bucket versioning configured"
    
    versioning_config = list(versioning_configs.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"

  def test_stack_s3_encryption_configuration(self):
    """Test that S3 bucket encryption is properly configured."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check for encryption configuration
    encryption_configs = terraform_config.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    assert len(encryption_configs) > 0, "Should have S3 bucket encryption configured"
    
    encryption_config = list(encryption_configs.values())[0]
    encryption_rule = encryption_config["rule"][0]
    encryption_default = encryption_rule["apply_server_side_encryption_by_default"]
    assert encryption_default["sse_algorithm"] == "AES256"

  def test_stack_backend_configuration(self):
    """Test that Terraform backend is properly configured."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      state_bucket="custom-state-bucket",
      state_bucket_region="us-east-1"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check backend configuration
    backend = terraform_config.get("terraform", {}).get("backend", {}).get("s3", {})
    assert backend["bucket"] == "custom-state-bucket"
    assert backend["key"] == "test/test-stack.tfstate"
    assert backend["region"] == "us-east-1"
    assert backend["encrypt"] is True

  def test_stack_aws_provider_configuration(self):
    """Test that AWS providers are properly configured."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-west-2",
      secondary_region="eu-west-1",
      default_tags={"Environment": "test"}
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check provider configuration
    providers = terraform_config.get("provider", {}).get("aws", {})
    assert len(providers) >= 2, "Should have primary and secondary AWS providers"
    
    # Find primary and secondary providers
    primary_provider = None
    secondary_provider = None
    
    for provider in providers.values():
      if provider.get("alias") == "secondary":
        secondary_provider = provider
      elif "alias" not in provider:
        primary_provider = provider
    
    assert primary_provider is not None, "Should have primary provider"
    assert secondary_provider is not None, "Should have secondary provider"
    assert primary_provider["region"] == "us-west-2"
    assert secondary_provider["region"] == "eu-west-1"

  def test_stack_enterprise_security_stacks(self):
    """Test that enterprise security stacks are instantiated."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-east-1",
      secondary_region="us-west-2"
    )
    
    # Verify security stacks are created
    assert stack.primary_security_stack is not None
    assert stack.secondary_security_stack is not None
    
    # Synthesize to ensure no errors
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    assert stack_artifact is not None

  def test_stack_with_custom_parameters(self):
    """Test stack creation with custom parameters."""
    app = App()
    custom_tags = {
      "Environment": "production",
      "Project": "enterprise",
      "Owner": "security-team"
    }
    
    stack = TapStack(
      app,
      "prod-stack",
      environment_suffix="prod",
      aws_region="eu-central-1",
      secondary_region="eu-west-1",
      state_bucket="prod-terraform-states",
      state_bucket_region="eu-central-1",
      default_tags=custom_tags
    )
    
    # Synthesize and verify configuration
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("prod-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check that custom parameters are applied
    backend = terraform_config.get("terraform", {}).get("backend", {}).get("s3", {})
    assert backend["bucket"] == "prod-terraform-states"
    assert backend["key"] == "prod/prod-stack.tfstate"
    assert backend["region"] == "eu-central-1"
    
    # Verify bucket naming uses environment suffix
    s3_buckets = [
      res for res in terraform_config.get("resource", {}).get("aws_s3_bucket", {}).values()
    ]
    bucket = s3_buckets[0]
    assert "tap-bucket-prod" in bucket["bucket"]

  def test_stack_resource_dependencies(self):
    """Test that resources have proper dependencies."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    terraform_config = json.loads(stack_artifact.content)
    
    # Check that versioning and encryption reference the bucket
    versioning_configs = terraform_config.get("resource", {}).get("aws_s3_bucket_versioning", {})
    encryption_configs = terraform_config.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    
    versioning_config = list(versioning_configs.values())[0]
    encryption_config = list(encryption_configs.values())[0]
    
    # Both should reference the bucket ID
    assert "aws_s3_bucket.tap_bucket.id" in str(versioning_config["bucket"])
    assert "aws_s3_bucket.tap_bucket.id" in str(encryption_config["bucket"])
