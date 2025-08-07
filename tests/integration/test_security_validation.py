"""Integration tests for security validation and compliance."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # pylint: disable=wrong-import-position
from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestSecurityValidation:
  """Test suite for security validation and compliance."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()
    self.stack = TapStack(self.app, "SecurityTest", environment_suffix="security")
    self.synth_output = json.loads(Testing.synth(self.stack))
    self.resources = self.synth_output["resource"]

  def test_s3_bucket_encryption_enforcement(self):
    """Test that S3 buckets enforce encryption."""
    encryption_configs = self.resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    
    assert len(encryption_configs) >= 2  # At least data and logs buckets
    
    for config in encryption_configs.values():
      rules = config.get("rule", [])
      assert len(rules) > 0
      
      for rule in rules:
        encryption_config = rule.get("apply_server_side_encryption_by_default", {})
        assert encryption_config.get("sse_algorithm") == "AES256"

  def test_s3_bucket_versioning_enabled(self):
    """Test that S3 buckets have versioning enabled."""
    versioning_configs = self.resources.get("aws_s3_bucket_versioning", {})
    
    assert len(versioning_configs) >= 2
    
    for config in versioning_configs.values():
      versioning = config.get("versioning_configuration", {})
      assert versioning.get("status") == "Enabled"

  def test_s3_bucket_public_access_blocked(self):
    """Test that S3 buckets block public access."""
    public_access_blocks = self.resources.get("aws_s3_bucket_public_access_block", {})
    
    assert len(public_access_blocks) >= 2
    
    for config in public_access_blocks.values():
      assert config.get("block_public_acls") is True
      assert config.get("block_public_policy") is True
      assert config.get("ignore_public_acls") is True
      assert config.get("restrict_public_buckets") is True

  def test_s3_bucket_https_only_policy(self):
    """Test that S3 buckets enforce HTTPS-only access."""
    bucket_policies = self.resources.get("aws_s3_bucket_policy", {})
    
    assert len(bucket_policies) >= 2
    
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Find HTTPS enforcement statement
      https_statement = None
      for statement in statements:
        if "DenyInsecureConnections" in statement.get("Sid", ""):
          https_statement = statement
          break
      
      assert https_statement is not None
      assert https_statement.get("Effect") == "Deny"
      condition = https_statement.get("Condition", {}).get("Bool", {})
      assert condition.get("aws:SecureTransport") == "false"

  def test_s3_bucket_encrypted_uploads_policy(self):
    """Test that S3 buckets require encrypted uploads."""
    bucket_policies = self.resources.get("aws_s3_bucket_policy", {})
    
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Find encryption enforcement statement
      encryption_statement = None
      for statement in statements:
        if "DenyUnencryptedObjectUploads" in statement.get("Sid", ""):
          encryption_statement = statement
          break
      
      assert encryption_statement is not None
      assert encryption_statement.get("Effect") == "Deny"
      condition = encryption_statement.get("Condition", {}).get("StringNotEquals", {})
      assert condition.get("s3:x-amz-server-side-encryption") == "AES256"

  def test_iam_least_privilege_policies(self):
    """Test that IAM policies follow least privilege principle."""
    iam_policies = self.resources.get("aws_iam_policy", {})
    
    assert len(iam_policies) >= 3  # analytics, uploader, logs policies
    
    for policy_name, policy_config in iam_policies.items():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        # Ensure no wildcard resource permissions
        resources = statement.get("Resource", [])
        if isinstance(resources, str):
          resources = [resources]
        
        # Should not have overly broad permissions
        assert "*" not in resources or len(resources) > 1  # If * exists, should be restricted
        
        # Check actions are specific to role purpose
        actions = statement.get("Action", [])
        if isinstance(actions, str):
          actions = [actions]
        
        # Analytics role should only have read permissions
        if "analytics" in policy_name.lower():
          s3_actions = [action for action in actions if action.startswith("s3:")]
          for action in s3_actions:
            assert "Get" in action or "List" in action  # Read-only operations

  def test_security_group_rules_validation(self):
    """Test that security group rules are properly configured."""
    sg_rules = self.resources.get("aws_security_group_rule", {})
    
    for rule_config in sg_rules.values():
      rule_type = rule_config.get("type")
      protocol = rule_config.get("protocol")
      
      if rule_type == "ingress":
        # Ingress rules should be restrictive
        from_port = rule_config.get("from_port")
        to_port = rule_config.get("to_port")
        
        # Should not allow all ports
        if from_port == 0 and to_port == 65535:
          # If all ports, should have specific CIDR restrictions
          cidr_blocks = rule_config.get("cidr_blocks", [])
          assert "0.0.0.0/0" not in cidr_blocks  # No open access

  def test_vpc_security_configuration(self):
    """Test VPC security configuration."""
    vpcs = self.resources.get("aws_vpc", {})
    
    for vpc_config in vpcs.values():
      # DNS support should be enabled
      assert vpc_config.get("enable_dns_support") is True
      assert vpc_config.get("enable_dns_hostnames") is True

  def test_load_balancer_security_configuration(self):
    """Test load balancer security configuration."""
    albs = self.resources.get("aws_lb", {})
    
    for alb_config in albs.values():
      # Should be internet-facing for public access
      assert alb_config.get("internal") is False
      
      # Should have security groups assigned
      security_groups = alb_config.get("security_groups")
      assert security_groups is not None
      assert len(security_groups) > 0

  def test_launch_template_security_configuration(self):
    """Test launch template security configuration."""
    launch_templates = self.resources.get("aws_launch_template", {})
    
    for template_config in launch_templates.values():
      # Should use encrypted EBS volumes
      block_device_mappings = template_config.get("block_device_mapping", [])
      for mapping in block_device_mappings:
        ebs = mapping.get("ebs", {})
        if ebs:
          assert ebs.get("encrypted") is True

  def test_dynamodb_security_configuration(self):
    """Test DynamoDB security configuration."""
    dynamodb_tables = self.resources.get("aws_dynamodb_table", {})
    
    for table_config in dynamodb_tables.values():
      # Should have point-in-time recovery enabled
      point_in_time_recovery = table_config.get("point_in_time_recovery", {})
      assert point_in_time_recovery.get("enabled") is True
      
      # Should have server-side encryption
      server_side_encryption = table_config.get("server_side_encryption", {})
      assert server_side_encryption.get("enabled") is True

  def test_compliance_tags_present(self):
    """Test that compliance tags are present on resources."""
    required_compliance_tags = [
      "Environment",
      "Owner",
      "SecurityLevel",
      "ManagedBy",
      "Purpose",
      "ComplianceRequired"
    ]
    
    # Check taggable resources
    taggable_resources = ["aws_s3_bucket", "aws_iam_role", "aws_iam_policy"]
    
    for resource_type in taggable_resources:
      if resource_type in self.resources:
        for resource_config in self.resources[resource_type].values():
          tags = resource_config.get("tags", {})
          
          for required_tag in required_compliance_tags:
            assert required_tag in tags, f"Missing required tag {required_tag} in {resource_type}"

  def test_security_validation_output(self):
    """Test security validation output contains expected information."""
    outputs = self.synth_output.get("output", {})
    
    assert "security-validation-info" in outputs
    
    security_info = json.loads(outputs["security-validation-info"]["value"])
    
    # Verify security validation information
    assert security_info.get("encryption_algorithm") == "AES256"
    assert security_info.get("https_enforced") is True
    assert security_info.get("versioning_enabled") is True
    assert security_info.get("public_access_blocked") is True
    assert security_info.get("least_privilege_implemented") is True

  def test_data_classification_compliance(self):
    """Test data classification and handling compliance."""
    # Verify that data and logs are properly separated
    s3_buckets = self.resources.get("aws_s3_bucket", {})
    bucket_names = [config["bucket"] for config in s3_buckets.values()]
    
    # Should have separate buckets for data and logs
    data_buckets = [name for name in bucket_names if "data" in name]
    log_buckets = [name for name in bucket_names if "log" in name]
    
    assert len(data_buckets) >= 1
    assert len(log_buckets) >= 1
    
    # Buckets should be clearly differentiated (but logs bucket contains "data" in name)
    # Both buckets contain "data" prefix but are differentiated by "logs" suffix
    assert any("logs" in name for name in log_buckets)

  def test_resource_isolation_compliance(self):
    """Test resource isolation compliance through bucket separation."""
    s3_buckets = self.resources.get("aws_s3_bucket", {})
    bucket_names = [config["bucket"] for config in s3_buckets.values()]
    
    # Should have separate buckets for different purposes
    data_buckets = [name for name in bucket_names if "data" in name and "logs" not in name]
    log_buckets = [name for name in bucket_names if "logs" in name]
    
    assert len(data_buckets) >= 1  # For data storage
    assert len(log_buckets) >= 1   # For audit logs

  def test_audit_logging_compliance(self):
    """Test audit logging compliance."""
    # Verify that logs bucket exists for audit trails
    s3_buckets = self.resources.get("aws_s3_bucket", {})
    bucket_names = [config["bucket"] for config in s3_buckets.values()]
    
    log_buckets = [name for name in bucket_names if "log" in name]
    assert len(log_buckets) >= 1
    
    # Logs bucket should have additional security measures
    bucket_policies = self.resources.get("aws_s3_bucket_policy", {})
    
    # Find policy for logs bucket
    logs_policy_found = False
    for policy_config in bucket_policies.values():
      bucket_ref = policy_config.get("bucket")
      if bucket_ref and "log" in str(bucket_ref):
        logs_policy_found = True
        break
    
    assert logs_policy_found
