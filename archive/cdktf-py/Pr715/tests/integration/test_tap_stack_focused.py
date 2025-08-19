"""Focused integration tests for actual TAP Stack functionality."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position
from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestTapStackFocused:
  """Focused integration tests for actual TAP Stack functionality (S3 + IAM only)."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_complete_s3_security_configuration(self):
    """Test complete S3 security configuration."""
    stack = TapStack(self.app, "S3SecurityTest", environment_suffix="security")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Should have exactly 2 S3 buckets
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) == 2
    
    # Each bucket should have all security configurations
    bucket_count = len(s3_buckets)
    
    # Encryption configurations
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    assert len(encryption_configs) == bucket_count
    
    # Versioning configurations
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) == bucket_count
    
    # Public access blocks
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) == bucket_count
    
    # Bucket policies
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    assert len(bucket_policies) == bucket_count

  def test_iam_least_privilege_implementation(self):
    """Test IAM least privilege implementation."""
    stack = TapStack(self.app, "IAMTest", environment_suffix="iam")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Should have exactly 3 roles and 3 policies
    iam_roles = resources.get("aws_iam_role", {})
    iam_policies = resources.get("aws_iam_policy", {})
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    
    assert len(iam_roles) == 3
    assert len(iam_policies) == 3
    assert len(policy_attachments) == 3
    
    # Check role types
    role_names = [config["name"] for config in iam_roles.values()]
    assert any("analytics-reader" in name for name in role_names)
    assert any("uploader" in name for name in role_names)
    assert any("logs-reader" in name for name in role_names)

  def test_bucket_naming_and_tagging(self):
    """Test bucket naming and tagging consistency."""
    custom_prefix = "test-secure-storage"
    stack = TapStack(
      self.app, 
      "BucketNamingTest", 
      environment_suffix="naming",
      bucket_prefix=custom_prefix
    )
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    for bucket_config in s3_buckets.values():
      bucket_name = bucket_config.get("bucket")
      tags = bucket_config.get("tags", {})
      
      # Check naming
      assert custom_prefix in bucket_name
      
      # Check required tags
      assert tags.get("Environment") == "naming"
      assert tags.get("Owner") == "security-team"
      assert tags.get("SecurityLevel") == "high"
      assert tags.get("ManagedBy") == "cdktf"
      assert tags.get("ComplianceRequired") == "true"

  def test_security_policy_enforcement(self):
    """Test security policy enforcement in bucket policies."""
    stack = TapStack(self.app, "SecurityPolicyTest", environment_suffix="policy")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Should have HTTPS enforcement
      https_enforcement_found = False
      encryption_enforcement_found = False
      
      for statement in statements:
        if "DenyInsecureConnections" in statement.get("Sid", ""):
          https_enforcement_found = True
          assert statement.get("Effect") == "Deny"
          condition = statement.get("Condition", {}).get("Bool", {})
          assert condition.get("aws:SecureTransport") == "false"
        
        if "DenyUnencryptedObjectUploads" in statement.get("Sid", ""):
          encryption_enforcement_found = True
          assert statement.get("Effect") == "Deny"
          condition = statement.get("Condition", {}).get("StringNotEquals", {})
          assert condition.get("s3:x-amz-server-side-encryption") == "AES256"
      
      assert https_enforcement_found
      assert encryption_enforcement_found

  def test_iam_policy_resource_scoping(self):
    """Test IAM policy resource scoping for least privilege."""
    stack = TapStack(self.app, "IAMScopingTest", environment_suffix="scoping")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    for policy_name, policy_config in iam_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        resources_list = statement.get("Resource", [])
        if isinstance(resources_list, str):
          resources_list = [resources_list]
        
        # Check that resources are explicitly scoped
        for resource_arn in resources_list:
          if "s3" in resource_arn:
            # Should not have wildcard-only resources
            assert resource_arn != "*"
            
            # Analytics role should be scoped to analytics/* prefix for object-level actions
            if "analytics" in policy_name:
              # Bucket-level permissions may not have the prefix
              if resource_arn.endswith("/*") or "analytics" in resource_arn:
                # Object-level or prefix-specific resources should have analytics
                if not (resource_arn.endswith("bucket") or resource_arn.endswith("bucket/*")):
                  assert "analytics/*" in resource_arn or "/analytics/*" in resource_arn
            
            # Uploader role should be scoped to uploads/* prefix for object-level actions
            elif "uploader" in policy_name:
              # Bucket-level permissions may not have the prefix
              if resource_arn.endswith("/*") or "uploads" in resource_arn:
                # Object-level or prefix-specific resources should have uploads
                if not (resource_arn.endswith("bucket") or resource_arn.endswith("bucket/*")):
                  assert "uploads/*" in resource_arn or "/uploads/*" in resource_arn

  def test_outputs_completeness(self):
    """Test that all required outputs are generated."""
    stack = TapStack(self.app, "OutputsTest", environment_suffix="outputs")
    synth_output = json.loads(Testing.synth(stack))
    outputs = synth_output.get("output", {})
    
    # Bucket outputs
    assert "bucket-data-name" in outputs
    assert "bucket-data-arn" in outputs
    assert "bucket-logs-name" in outputs
    assert "bucket-logs-arn" in outputs
    
    # Role outputs
    assert "role-analytics_reader-name" in outputs
    assert "role-analytics_reader-arn" in outputs
    assert "role-uploader-name" in outputs
    assert "role-uploader-arn" in outputs
    assert "role-logs_reader-name" in outputs
    assert "role-logs_reader-arn" in outputs
    
    # Security validation outputs
    assert "security-validation-info" in outputs
    security_info = json.loads(outputs["security-validation-info"]["value"])
    assert security_info["encryption_algorithm"] == "AES256"
    assert security_info["https_enforced"] is True
    assert security_info["versioning_enabled"] is True
    assert security_info["public_access_blocked"] is True
    assert security_info["least_privilege_implemented"] is True
    
    # Compliance outputs
    assert "compliance-tags" in outputs

  def test_environment_isolation(self):
    """Test environment isolation through naming and tagging."""
    environments = ["dev", "staging", "prod"]
    
    for env in environments:
      stack = TapStack(
        self.app, 
        f"EnvIsolationTest{env.title()}", 
        environment_suffix=env
      )
      synth_output = json.loads(Testing.synth(stack))
      
      # Check backend isolation
      backend = synth_output["terraform"]["backend"]["s3"]
      assert env in backend["key"]
      
      # Check resource tagging
      resources = synth_output["resource"]
      s3_buckets = resources.get("aws_s3_bucket", {})
      
      for bucket_config in s3_buckets.values():
        tags = bucket_config.get("tags", {})
        assert tags.get("Environment") == env

  def test_default_tags_propagation(self):
    """Test default tags propagation through provider configuration."""
    custom_tags = {
      "Project": "TestProject",
      "CostCenter": "Engineering",
      "DataClassification": "Internal"
    }
    
    stack = TapStack(
      self.app,
      "TagPropagationTest",
      environment_suffix="tags",
      default_tags=custom_tags
    )
    synth_output = json.loads(Testing.synth(stack))
    
    # Check provider default tags
    aws_providers = synth_output["provider"]["aws"]
    if isinstance(aws_providers, list):
      provider_config = aws_providers[0]
    else:
      provider_config = list(aws_providers.values())[0]
    
    default_tags_config = provider_config.get("default_tags", [])
    assert len(default_tags_config) == 1
    
    tags = default_tags_config[0].get("tags", {})
    assert tags["Project"] == "TestProject"
    assert tags["CostCenter"] == "Engineering"
    assert tags["DataClassification"] == "Internal"

  def test_compliance_requirements_validation(self):
    """Test compliance requirements are met."""
    stack = TapStack(self.app, "ComplianceTest", environment_suffix="compliance")
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output["resource"]
    
    # Encryption at rest
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    for config in encryption_configs.values():
      rules = config.get("rule", [])
      for rule in rules:
        encryption = rule.get("apply_server_side_encryption_by_default", {})
        assert encryption.get("sse_algorithm") == "AES256"
    
    # Versioning for audit trail
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    for config in versioning_configs.values():
      versioning = config.get("versioning_configuration", {})
      assert versioning.get("status") == "Enabled"
    
    # Public access prevention
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    for config in public_access_blocks.values():
      assert config.get("block_public_acls") is True
      assert config.get("block_public_policy") is True
      assert config.get("ignore_public_acls") is True
      assert config.get("restrict_public_buckets") is True

  def test_backend_configuration_security(self):
    """Test backend configuration security settings."""
    stack = TapStack(
      self.app,
      "BackendSecurityTest",
      environment_suffix="backend",
      state_bucket="secure-terraform-states"
    )
    synth_output = json.loads(Testing.synth(stack))
    
    backend = synth_output["terraform"]["backend"]["s3"]
    
    # Should use specified bucket
    assert backend["bucket"] == "secure-terraform-states"
    
    # Should have encryption enabled
    assert backend["encrypt"] is True
    
    # Should use environment-specific key
    assert "backend" in backend["key"]
    assert "BackendSecurityTest" in backend["key"]
    
    # Should use correct region (from env var)
    assert backend["region"] == "us-east-1"
