"""Unit tests for TapStack cross-component integration."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestStackComponentIntegration:
  """Test suite for integration between stack components."""

  def setup_method(self):
    """Set up test fixtures."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "IntegrationTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_bucket_and_policy_integration(self):
    """Test that bucket policies reference the correct buckets."""
    resources = self.synth_output.get("resource", {})
    
    s3_buckets = resources.get("aws_s3_bucket", {})
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    
    # Each bucket should have a corresponding policy
    assert len(bucket_policies) == len(s3_buckets)
    
    # Extract bucket names from bucket resources
    bucket_names = set()
    for bucket_config in s3_buckets.values():
      bucket_names.add(bucket_config.get("bucket"))
    
    # Check that policies reference existing buckets
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        resources_list = statement.get("Resource", [])
        if isinstance(resources_list, str):
          resources_list = [resources_list]
        
        for resource_arn in resources_list:
          if "arn:aws:s3:::" in resource_arn:
            # Handle Terraform interpolation syntax
            if "${aws_s3_bucket." in resource_arn and ".bucket}" in resource_arn:
              # This is a Terraform reference, skip detailed validation
              continue
            else:
              # Extract bucket name from ARN for literal values
              bucket_name = resource_arn.replace("arn:aws:s3:::", "").split("/")[0]
              if bucket_name:  # Skip object ARNs (with /*)
                assert bucket_name in bucket_names

  def test_iam_policy_bucket_reference_integration(self):
    """Test that IAM policies reference the correct bucket names."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    # Get expected bucket names from stack
    expected_data_bucket = self.stack.bucket_names["data"]
    expected_logs_bucket = self.stack.bucket_names["logs"]
    
    for policy_config in iam_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        resources_list = statement.get("Resource", [])
        if isinstance(resources_list, str):
          resources_list = [resources_list]
        
        for resource_arn in resources_list:
          if "arn:aws:s3:::" in resource_arn:
            # Handle Terraform interpolation syntax
            if "${aws_s3_bucket." in resource_arn and ".bucket}" in resource_arn:
              # This is a Terraform reference, verify it references our bucket resources
              continue
            else:
              bucket_name = resource_arn.replace("arn:aws:s3:::", "").split("/")[0]
              # Bucket should be one of our expected buckets
              assert bucket_name in [expected_data_bucket, expected_logs_bucket]

  def test_role_and_policy_attachment_integration(self):
    """Test that roles are properly attached to their policies."""
    resources = self.synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    iam_policies = resources.get("aws_iam_policy", {})
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    
    # Each role should have a corresponding policy and attachment
    assert len(iam_roles) == len(iam_policies)
    assert len(iam_roles) == len(policy_attachments)
    
    # Check that attachments reference existing roles and policies
    role_names = {role_config.get("name") for role_config in iam_roles.values()}
    policy_arns = {f"${{{policy_key}.arn}}" 
                   for policy_key in iam_policies.keys()}
    
    for attachment_config in policy_attachments.values():
      role_ref = attachment_config.get("role")
      policy_arn_ref = attachment_config.get("policy_arn")
      
      # Role reference should match an existing role
      assert role_ref in role_names or "${" in str(role_ref)
      
      # Policy ARN should reference an existing policy
      assert policy_arn_ref in policy_arns or "${" in str(policy_arn_ref)

  def test_bucket_encryption_and_policy_consistency(self):
    """Test that bucket encryption config is consistent with bucket policies."""
    resources = self.synth_output.get("resource", {})
    
    # Get encryption configurations
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    
    # All encryption configs should use AES256
    for enc_config in encryption_configs.values():
      rule = enc_config.get("rule", [{}])[0]
      default_encryption = rule.get("apply_server_side_encryption_by_default", {})
      assert default_encryption.get("sse_algorithm") == "AES256"
    
    # All bucket policies should enforce AES256 encryption
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Find encryption enforcement statement
      encryption_statement = next(
        (stmt for stmt in statements if "s3:x-amz-server-side-encryption" in str(stmt)),
        None
      )
      
      if encryption_statement:
        condition = encryption_statement.get("Condition", {})
        string_equals = condition.get("StringNotEquals", {})
        encryption_req = string_equals.get("s3:x-amz-server-side-encryption")
        assert encryption_req == "AES256"

  def test_tag_consistency_across_components(self):
    """Test that tags are consistently applied across all components."""
    resources = self.synth_output.get("resource", {})
    
    expected_common_tags = self.stack.common_tags
    
    # Check S3 buckets
    s3_buckets = resources.get("aws_s3_bucket", {})
    for bucket_config in s3_buckets.values():
      tags = bucket_config.get("tags", {})
      for key, value in expected_common_tags.items():
        assert tags.get(key) == value
    
    # Check IAM roles
    iam_roles = resources.get("aws_iam_role", {})
    for role_config in iam_roles.values():
      tags = role_config.get("tags", {})
      for key, value in expected_common_tags.items():
        assert tags.get(key) == value
    
    # Check IAM policies
    iam_policies = resources.get("aws_iam_policy", {})
    for policy_config in iam_policies.values():
      tags = policy_config.get("tags", {})
      for key, value in expected_common_tags.items():
        assert tags.get(key) == value

  def test_outputs_reference_created_resources(self):
    """Test that outputs correctly reference the created resources."""
    outputs = self.synth_output.get("output", {})
    resources = self.synth_output.get("resource", {})
    
    # Get resource keys for validation
    s3_bucket_keys = set(resources.get("aws_s3_bucket", {}).keys())
    iam_role_keys = set(resources.get("aws_iam_role", {}).keys())
    
    # Check bucket outputs
    for output_name, output_config in outputs.items():
      if "bucket" in output_name:
        value = output_config.get("value")
        if isinstance(value, str) and "${aws_s3_bucket." in value:
          # Extract resource key from reference
          resource_ref = value.split("${aws_s3_bucket.")[1].split(".")[0]
          assert resource_ref in s3_bucket_keys
    
    # Check role outputs  
    for output_name, output_config in outputs.items():
      if "role" in output_name:
        value = output_config.get("value")
        if isinstance(value, str) and "${aws_iam_role." in value:
          # Extract resource key from reference
          resource_ref = value.split("${aws_iam_role.")[1].split(".")[0]
          assert resource_ref in iam_role_keys


class TestEnvironmentSuffixPropagation:
  """Test suite for environment suffix propagation across components."""

  def test_environment_suffix_in_role_names(self):
    """Test that environment suffix is propagated to role names."""
    app = App()
    stack = TapStack(app, "EnvTestStack", environment_suffix="staging")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    for role_config in iam_roles.values():
      role_name = role_config.get("name", "")
      assert "staging" in role_name

  def test_environment_suffix_in_policy_names(self):
    """Test that environment suffix is propagated to policy names."""
    app = App()
    stack = TapStack(app, "EnvTestStack", environment_suffix="production")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    for policy_config in iam_policies.values():
      policy_name = policy_config.get("name", "")
      assert "production" in policy_name

  def test_environment_suffix_in_tags(self):
    """Test that environment suffix appears in resource tags."""
    app = App()
    stack = TapStack(app, "EnvTestStack", environment_suffix="test")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    # Check S3 buckets
    s3_buckets = resources.get("aws_s3_bucket", {})
    for bucket_config in s3_buckets.values():
      tags = bucket_config.get("tags", {})
      assert tags.get("Environment") == "test"
    
    # Check IAM roles
    iam_roles = resources.get("aws_iam_role", {})
    for role_config in iam_roles.values():
      tags = role_config.get("tags", {})
      assert tags.get("Environment") == "test"

  def test_environment_suffix_in_backend_key(self):
    """Test that environment suffix appears in S3 backend key."""
    app = App()
    stack = TapStack(app, "BackendKeyTestStack", environment_suffix="development")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    backend_key = backend_config.get("key", "")
    assert "development/BackendKeyTestStack.tfstate" == backend_key


class TestSecurityPolicyConsistency:
  """Test suite for security policy consistency across components."""

  def setup_method(self):
    """Set up test fixtures."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "SecurityTestStack")  # pylint: disable=attribute-defined-outside-init
    self.synth_output = json.loads(Testing.synth(self.stack))  # pylint: disable=attribute-defined-outside-init

  def test_https_enforcement_consistency(self):
    """Test that HTTPS is enforced consistently across bucket and IAM policies."""
    resources = self.synth_output.get("resource", {})
    
    # Check bucket policies enforce HTTPS
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Should have statement denying non-HTTPS access
      https_statements = [
        stmt for stmt in statements
        if stmt.get("Effect") == "Deny" and 
        "aws:SecureTransport" in str(stmt.get("Condition", {}))
      ]
      assert len(https_statements) >= 1
    
    # Check IAM policies require HTTPS
    iam_policies = resources.get("aws_iam_policy", {})
    for policy_config in iam_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Allow statements should require HTTPS
      for statement in statements:
        if statement.get("Effect") == "Allow":
          condition = statement.get("Condition", {})
          bool_conditions = condition.get("Bool", {})
          secure_transport = bool_conditions.get("aws:SecureTransport")
          assert secure_transport == "true"

  def test_encryption_requirement_consistency(self):
    """Test that encryption requirements are consistent across policies."""
    resources = self.synth_output.get("resource", {})
    
    # Check bucket policies deny unencrypted uploads
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Should have statement denying unencrypted uploads
      encryption_statements = [
        stmt for stmt in statements
        if stmt.get("Effect") == "Deny" and
        "s3:x-amz-server-side-encryption" in str(stmt.get("Condition", {}))
      ]
      assert len(encryption_statements) >= 1
    
    # Check IAM uploader policy requires encryption
    iam_policies = resources.get("aws_iam_policy", {})
    uploader_policy = None
    for policy_config in iam_policies.values():
      if "uploader" in policy_config.get("name", ""):
        uploader_policy = policy_config
        break
    
    if uploader_policy:
      policy_doc = json.loads(uploader_policy.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Find PutObject statement and check encryption requirement
      for statement in statements:
        actions = statement.get("Action", [])
        if isinstance(actions, str):
          actions = [actions]
        
        if any("putobject" in action.lower() for action in actions):
          condition = statement.get("Condition", {})
          string_equals = condition.get("StringEquals", {})
          encryption_req = string_equals.get("s3:x-amz-server-side-encryption")
          assert encryption_req == "AES256"

  def test_least_privilege_principle_consistency(self):
    """Test that least privilege is consistently applied across IAM policies."""
    resources = self.synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    for policy_config in iam_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      for statement in statements:
        # No wildcards in resources (except for specific object access patterns)
        resources_list = statement.get("Resource", [])
        if isinstance(resources_list, str):
          resources_list = [resources_list]
        
        for resource in resources_list:
          if resource == "*":
            assert False, f"Policy should not have wildcard resource: {resource}"
          
          # If it's an object-level access, wildcard at end is acceptable
          if resource.endswith("/*"):
            # Should be specific bucket with object access
            assert "arn:aws:s3:::" in resource
            bucket_part = resource.replace("/*", "")
            assert bucket_part.startswith("arn:aws:s3:::")


class TestResourceNamingConsistency:
  """Test suite for resource naming consistency."""

  def test_bucket_resource_ids_consistency(self):
    """Test that bucket resource IDs follow consistent naming pattern."""
    app = App()
    stack = TapStack(app, "NamingTestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    for resource_id in s3_buckets.keys():
      # Should follow pattern: terraform-cdkft-secure-bucket-1-{type}
      assert "terraform-cdkft-secure-bucket-1-" in resource_id
      assert resource_id.endswith("-data") or resource_id.endswith("-logs")

  def test_iam_resource_ids_consistency(self):
    """Test that IAM resource IDs follow consistent naming pattern."""
    app = App()
    stack = TapStack(app, "NamingTestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    iam_policies = resources.get("aws_iam_policy", {})
    
    # Check role resource IDs
    for resource_id in iam_roles.keys():
      assert "role" in resource_id
      assert any(role_type in resource_id for role_type in ["analytics", "uploader", "logs"])
    
    # Check policy resource IDs
    for resource_id in iam_policies.keys():
      assert "policy" in resource_id
      assert any(role_type in resource_id for role_type in ["analytics", "uploader", "logs"])

  def test_related_resource_naming_correlation(self):
    """Test that related resources have correlated naming."""
    app = App()
    stack = TapStack(app, "CorrelationTestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    # For each bucket, should have related encryption, versioning, etc.
    s3_buckets = resources.get("aws_s3_bucket", {})
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    
    for bucket_id in s3_buckets.keys():
      bucket_type = bucket_id.split("-")[-1]  # data or logs
      
      # Should have corresponding encryption config
      encryption_id = f"bucket-encryption-{bucket_type}"
      assert encryption_id in encryption_configs
      
      # Should have corresponding versioning config
      versioning_id = f"bucket-versioning-{bucket_type}"
      assert versioning_id in versioning_configs
