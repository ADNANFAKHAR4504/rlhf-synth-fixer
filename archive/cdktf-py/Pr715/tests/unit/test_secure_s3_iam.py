"""Comprehensive TDD tests for Secure S3 and IAM Infrastructure."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing  # pylint: disable=wrong-import-position
from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestSecureS3Infrastructure:
  """Test suite for S3 Security Requirements."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "SecurityTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_s3_buckets_have_aes256_encryption(self):
    """Test that all S3 buckets have AES-256 server-side encryption enabled."""
    resources = self.synth_output.get("resource", {})
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    assert len(s3_buckets) >= 1, "At least one S3 bucket should be created"
    
    # In CDKTF, encryption is configured via separate resources
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    assert len(encryption_configs) >= len(s3_buckets), \
      "Each S3 bucket should have corresponding encryption configuration"
    
    for enc_name, enc_config in encryption_configs.items():
      rule = enc_config.get("rule", [])
      assert len(rule) > 0, f"Encryption {enc_name} should have at least one rule"
      
      # Check the first rule for AES256
      first_rule = rule[0] if rule else {}
      default_encryption = first_rule.get("apply_server_side_encryption_by_default", {})
      algorithm = default_encryption.get("sse_algorithm")
      assert algorithm == "AES256", \
        f"Encryption {enc_name} should use AES256, got {algorithm}"

  def test_s3_buckets_have_versioning_enabled(self):
    """Test that S3 buckets have versioning enabled for data recovery."""
    resources = self.synth_output.get("resource", {})
    
    # Check for versioning configuration resources
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) >= 1, "S3 bucket versioning should be configured"
    
    for versioning_name, versioning_config in versioning_configs.items():
      status = versioning_config.get("versioning_configuration", {}).get("status")
      assert status == "Enabled", f"Versioning {versioning_name} should be Enabled, got {status}"

  def test_s3_buckets_block_public_access(self):
    """Test that S3 buckets have public access blocked."""
    resources = self.synth_output.get("resource", {})
    
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) >= 1, "S3 public access should be blocked"
    
    for _, block_config in public_access_blocks.items():
      assert block_config.get("block_public_acls") is True
      assert block_config.get("block_public_policy") is True
      assert block_config.get("ignore_public_acls") is True
      assert block_config.get("restrict_public_buckets") is True

  def test_s3_bucket_policies_deny_insecure_transport(self):
    """Test that bucket policies deny access without HTTPS."""
    resources = self.synth_output.get("resource", {})
    
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    assert len(bucket_policies) >= 1, "S3 bucket policies should be configured"
    
    for policy_name, policy_config in bucket_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Check for HTTPS enforcement statement
      https_statements = [
        stmt for stmt in statements 
        if stmt.get("Effect") == "Deny" and 
        "aws:SecureTransport" in str(stmt.get("Condition", {}))
      ]
      
      assert len(https_statements) >= 1, f"Policy {policy_name} should deny insecure transport"

  def test_s3_bucket_policies_deny_unencrypted_uploads(self):
    """Test that bucket policies deny unencrypted object uploads."""
    resources = self.synth_output.get("resource", {})
    
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    
    for _, policy_config in bucket_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Check for encryption enforcement statement
      encryption_statements = [
        stmt for stmt in statements 
        if stmt.get("Effect") == "Deny" and 
        "s3:x-amz-server-side-encryption" in str(stmt.get("Condition", {}))
      ]
      
      assert len(encryption_statements) >= 1, \
        "Policy should deny unencrypted uploads"


class TestIAMLeastPrivilege:
  """Test suite for IAM Security Requirements."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "IAMTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_iam_roles_created_with_least_privilege(self):
    """Test that IAM roles are created with least privilege principles."""
    resources = self.synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    assert len(iam_roles) >= 2, "At least 2 IAM roles should be created (reader, uploader)"
    
    # Verify role names follow expected patterns
    role_names = list(iam_roles.keys())
    expected_patterns = ["analytics", "uploader", "logs"]
    
    matching_roles = [
      role for role in role_names 
      if any(pattern in role for pattern in expected_patterns)
    ]
    
    assert len(matching_roles) >= 2, \
      f"Expected roles with patterns {expected_patterns}, got {role_names}"

  def test_iam_policies_have_explicit_resource_scoping(self):
    """Test that IAM policies explicitly scope resources (no wildcards)."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    assert len(iam_policies) >= 2, "IAM policies should be created"
    
    for _, policy_config in iam_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        resources_list = statement.get("Resource", [])
        if isinstance(resources_list, str):
          resources_list = [resources_list]
        
        for resource in resources_list:
          # Allow wildcards only at the end of specific paths (like /prefix/*)
          if resource == "*":
            assert False, "Policy should not have wildcard '*' resource"
          
          # Ensure bucket ARN format for S3 resources
          if "s3" in resource:
            assert resource.startswith("arn:aws:s3:::"), \
              f"S3 resource should be proper ARN: {resource}"

  def test_iam_policies_enforce_https_transport(self):
    """Test that IAM policies enforce HTTPS transport."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    for policy_name, policy_config in iam_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        if statement.get("Effect") == "Allow":
          condition = statement.get("Condition", {})
          bool_conditions = condition.get("Bool", {})
          
          # Should have aws:SecureTransport condition
          secure_transport = bool_conditions.get("aws:SecureTransport")
          assert secure_transport == "true", f"Policy {policy_name} should enforce HTTPS transport"

  def test_analytics_reader_role_permissions(self):
    """Test that analytics reader role has read-only access to analytics prefix."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    # Find analytics reader policy
    analytics_policies = [
      (name, config) for name, config in iam_policies.items()
      if "analytics" in name.lower()
    ]
    
    assert len(analytics_policies) >= 1, "Analytics reader policy should exist"
    
    for _, policy_config in analytics_policies:
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Check for read-only actions
      for statement in statements:
        actions = statement.get("Action", [])
        if isinstance(actions, str):
          actions = [actions]
        
        # Should only have read actions
        write_actions = [action for action in actions if any(
          write_verb in action.lower() for write_verb in ["put", "delete", "create"]
        )]
        
        assert len(write_actions) == 0, \
          f"Analytics reader should not have write permissions: {write_actions}"

  def test_uploader_role_permissions(self):
    """Test that uploader role has write-only access to uploads prefix."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    # Find uploader policy
    uploader_policies = [
      (name, config) for name, config in iam_policies.items()
      if "uploader" in name.lower()
    ]
    
    assert len(uploader_policies) >= 1, "Uploader policy should exist"
    
    for _, policy_config in uploader_policies:
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Check for upload actions and encryption requirements
      for statement in statements:
        if statement.get("Effect") == "Allow":
          actions = statement.get("Action", [])
          if isinstance(actions, str):
            actions = [actions]
          
          if any("putobject" in action.lower() for action in actions):
            # Should enforce encryption
            condition = statement.get("Condition", {})
            string_equals = condition.get("StringEquals", {})
            encryption_condition = string_equals.get("s3:x-amz-server-side-encryption")
            
            assert encryption_condition == "AES256", "Uploader should enforce AES256 encryption"


class TestResourceTagging:
  """Test suite for Resource Tagging Requirements."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "TaggingTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_all_resources_have_security_tags(self):
    """Test that all resources have appropriate security and audit tags."""
    resources = self.synth_output.get("resource", {})
    
    required_tag_keys = ["Environment", "Owner", "SecurityLevel"]
    
    # Resources that don't support tagging in AWS
    non_taggable_resources = {
      "aws_iam_role_policy_attachment",
      "aws_s3_bucket_server_side_encryption_configuration", 
      "aws_s3_bucket_versioning",
      "aws_s3_bucket_policy",
      "aws_s3_bucket_public_access_block"
    }
    
    for resource_type, resource_instances in resources.items():
      # Skip resources that don't support tagging
      if resource_type in non_taggable_resources:
        continue
        
      for _, resource_config in resource_instances.items():
        tags = resource_config.get("tags", {})
        
        for required_tag in required_tag_keys:
          assert required_tag in tags, \
            f"Resource {resource_type} missing required tag: {required_tag}"

  def test_security_level_tags_are_appropriate(self):
    """Test that SecurityLevel tags reflect high security requirements."""
    resources = self.synth_output.get("resource", {})
    
    for _, resource_instances in resources.items():
      for _, resource_config in resource_instances.items():
        tags = resource_config.get("tags", {})
        security_level = tags.get("SecurityLevel")
        
        if security_level:
          assert security_level in ["high", "critical"], \
            f"SecurityLevel should be high/critical, got {security_level}"


class TestOutputsForValidation:
  """Test suite for Outputs Required for Security Validation."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "OutputsTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_bucket_arns_are_exposed(self):
    """Test that bucket ARNs are exposed for downstream validation."""
    outputs = self.synth_output.get("output", {})
    
    bucket_arn_outputs = [
      name for name in outputs.keys()
      if "bucket" in name.lower() and "arn" in name.lower()
    ]
    
    assert len(bucket_arn_outputs) >= 1, "Bucket ARNs should be exposed as outputs"

  def test_role_arns_are_exposed(self):
    """Test that IAM role ARNs are exposed for downstream validation."""
    outputs = self.synth_output.get("output", {})
    
    role_arn_outputs = [
      name for name in outputs.keys()
      if "role" in name.lower() and "arn" in name.lower()
    ]
    
    assert len(role_arn_outputs) >= 2, "Role ARNs should be exposed as outputs"

  def test_security_validation_info_output(self):
    """Test that security validation information is exposed."""
    outputs = self.synth_output.get("output", {})
    
    # Should have an output that summarizes security configuration
    security_outputs = [
      name for name in outputs.keys()
      if "security" in name.lower() or "validation" in name.lower()
    ]
    
    assert len(security_outputs) >= 1, "Security validation info should be exposed"
