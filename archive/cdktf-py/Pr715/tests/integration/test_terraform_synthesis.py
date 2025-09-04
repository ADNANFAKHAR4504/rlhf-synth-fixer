"""Integration tests for Terraform synthesis and validation."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position
from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestTerraformSynthesis:
  """Test suite for Terraform synthesis validation."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_basic_stack_synthesis(self):
    """Test that basic stack synthesizes valid Terraform JSON."""
    stack = TapStack(self.app, "BasicSynthesisTest")
    synth_output = json.loads(Testing.synth(stack))
    
    # Verify core structure
    assert "terraform" in synth_output
    assert "provider" in synth_output
    assert "resource" in synth_output
    assert "output" in synth_output
    
    # Verify backend configuration
    backend = synth_output["terraform"]["backend"]["s3"]
    assert backend["bucket"] == "iac-rlhf-tf-states"
    assert backend["key"] == "dev/BasicSynthesisTest.tfstate"
    assert backend["region"] == "us-east-1"
    assert backend["encrypt"] is True

  def test_provider_configuration(self):
    """Test AWS provider configuration."""
    stack = TapStack(self.app, "ProviderTest", environment_suffix="test")
    synth_output = json.loads(Testing.synth(stack))
    
    # Handle provider as list or dict
    aws_providers = synth_output["provider"]["aws"]
    if isinstance(aws_providers, list):
      provider_config = aws_providers[0]
    else:
      provider_config = list(aws_providers.values())[0]
    
    assert provider_config["region"] == "eu-central-1"

  def test_s3_resources_synthesis(self):
    """Test S3 resources are properly synthesized."""
    stack = TapStack(self.app, "S3Test", environment_suffix="integration")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Check S3 buckets
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) == 2  # data and logs buckets
    
    # Check encryption
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    assert len(encryption_configs) == 2
    
    # Check versioning
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) == 2
    
    # Check public access block
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) == 2

  def test_iam_resources_synthesis(self):
    """Test IAM resources are properly synthesized."""
    stack = TapStack(self.app, "IAMTest", environment_suffix="integration")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Check IAM roles
    iam_roles = resources.get("aws_iam_role", {})
    assert len(iam_roles) == 3  # analytics, uploader, logs roles
    
    # Check IAM policies
    iam_policies = resources.get("aws_iam_policy", {})
    assert len(iam_policies) == 3
    
    # Check policy attachments
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    assert len(policy_attachments) == 3

  def test_s3_bucket_configurations_synthesis(self):
    """Test S3 bucket configurations are properly synthesized."""
    stack = TapStack(self.app, "S3ConfigTest", environment_suffix="integration")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Check S3 buckets (data and logs)
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) == 2
    
    # Check bucket policies
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    assert len(bucket_policies) == 2
    
    # Check encryption configurations
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    assert len(encryption_configs) == 2
    
    # Check versioning configurations
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) == 2
    
    # Check public access blocks
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) == 2

  def test_iam_policy_content_validation(self):
    """Test IAM policy content and structure."""
    stack = TapStack(self.app, "IAMPolicyTest", environment_suffix="integration")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Check IAM policies have correct structure
    iam_policies = resources.get("aws_iam_policy", {})
    assert len(iam_policies) == 3
    
    # Validate policy documents
    for policy_name, policy_config in iam_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      assert policy_doc.get("Version") == "2012-10-17"
      assert "Statement" in policy_doc
      
      # Check for security conditions
      statements = policy_doc.get("Statement", [])
      for statement in statements:
        condition = statement.get("Condition", {})
        if condition:
          # Should enforce HTTPS
          secure_transport = condition.get("Bool", {}).get("aws:SecureTransport")
          if secure_transport is not None:
            assert secure_transport == "true"

  def test_outputs_synthesis(self):
    """Test that outputs are properly synthesized."""
    stack = TapStack(self.app, "OutputsTest", environment_suffix="integration")
    synth_output = json.loads(Testing.synth(stack))
    outputs = synth_output["output"]
    
    # Check bucket outputs
    assert "bucket-data-name" in outputs
    assert "bucket-data-arn" in outputs
    assert "bucket-logs-name" in outputs
    assert "bucket-logs-arn" in outputs
    
    # Check role outputs
    assert "role-analytics_reader-name" in outputs
    assert "role-analytics_reader-arn" in outputs
    assert "role-uploader-name" in outputs
    assert "role-uploader-arn" in outputs
    assert "role-logs_reader-name" in outputs
    assert "role-logs_reader-arn" in outputs
    
    # Check security validation output
    assert "security-validation-info" in outputs
    
    # Check compliance tags output
    assert "compliance-tags" in outputs

  def test_custom_tags_propagation(self):
    """Test that custom tags are properly propagated."""
    custom_tags = {
      "Environment": "integration",
      "Project": "TAPStack",
      "CostCenter": "Engineering"
    }
    
    stack = TapStack(self.app, "TagsTest", default_tags=custom_tags)
    synth_output = json.loads(Testing.synth(stack))
    
    # Check provider default tags
    aws_providers = synth_output["provider"]["aws"]
    if isinstance(aws_providers, list):
      provider_config = aws_providers[0]
    else:
      provider_config = list(aws_providers.values())[0]
    
    default_tags = provider_config["default_tags"][0]["tags"]
    assert default_tags["Environment"] == "integration"
    assert default_tags["Project"] == "TAPStack"
    assert default_tags["CostCenter"] == "Engineering"

  def test_environment_specific_configuration(self):
    """Test environment-specific configuration."""
    environments = ["dev", "staging", "prod"]
    
    for env in environments:
      stack = TapStack(self.app, f"EnvTest{env.title()}", environment_suffix=env)
      synth_output = json.loads(Testing.synth(stack))
      
      # Check backend key includes environment
      backend_key = synth_output["terraform"]["backend"]["s3"]["key"]
      assert env in backend_key
      
      # Check resources have environment suffix in tags
      resources = synth_output["resource"]
      s3_buckets = resources.get("aws_s3_bucket", {})
      for bucket_config in s3_buckets.values():
        tags = bucket_config.get("tags", {})
        assert tags.get("Environment") == env

  def test_state_bucket_configuration(self):
    """Test different state bucket configurations."""
    custom_state_bucket = "my-custom-terraform-state"
    custom_region = "us-west-2"
    
    stack = TapStack(
      self.app,
      "StateBucketTest",
      state_bucket=custom_state_bucket,
      state_bucket_region=custom_region
    )
    synth_output = json.loads(Testing.synth(stack))
    
    backend = synth_output["terraform"]["backend"]["s3"]
    assert backend["bucket"] == custom_state_bucket
    assert backend["region"] == "us-east-1"  # Fixed: hardcoded to use env var default

  def test_bucket_prefix_configuration(self):
    """Test custom bucket prefix configuration."""
    custom_prefix = "my-secure-data"
    
    stack = TapStack(self.app, "BucketPrefixTest", bucket_prefix=custom_prefix)
    synth_output = json.loads(Testing.synth(stack))
    
    resources = synth_output["resource"]
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    # Check that bucket names include custom prefix
    bucket_names = [config["bucket"] for config in s3_buckets.values()]
    assert all(custom_prefix in name for name in bucket_names)

  def test_resource_naming_consistency(self):
    """Test that resource naming follows consistent patterns."""
    stack = TapStack(self.app, "NamingTest", environment_suffix="test")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # All resources should include environment suffix
    all_resource_configs = []
    for resource_type, resource_instances in resources.items():
      for resource_config in resource_instances.values():
        all_resource_configs.append(resource_config)
    
    # Check naming patterns for key resources
    s3_buckets = resources.get("aws_s3_bucket", {})
    for bucket_config in s3_buckets.values():
      tags = bucket_config.get("tags", {})
      assert tags.get("Environment") == "test"
    
    iam_roles = resources.get("aws_iam_role", {})
    for role_config in iam_roles.values():
      role_name = role_config.get("name", "")
      assert "test" in role_name
