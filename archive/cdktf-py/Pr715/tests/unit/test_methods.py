"""Unit tests for TapStack individual methods."""
import json
import os
import sys

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestCreateSecureBucketsMethod:
  """Test suite for _create_secure_buckets method."""

  def setup_method(self):
    """Set up test fixtures."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "MethodTestStack")  # pylint: disable=attribute-defined-outside-init

  def test_create_secure_buckets_returns_dict(self):
    """Test that _create_secure_buckets returns a dictionary of buckets."""
    buckets = self.stack.buckets
    
    assert isinstance(buckets, dict)
    assert "data" in buckets
    assert "logs" in buckets

  def test_bucket_encryption_configuration(self):
    """Test that buckets have encryption configuration."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    encryption_configs = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
    
    # Should have encryption config for each bucket type
    assert len(encryption_configs) >= 2
    
    for enc_config in encryption_configs.values():
      rules = enc_config.get("rule", [])
      assert len(rules) >= 1
      
      rule = rules[0]
      default_encryption = rule.get("apply_server_side_encryption_by_default", {})
      assert default_encryption.get("sse_algorithm") == "AES256"
      assert rule.get("bucket_key_enabled") is False

  def test_bucket_versioning_configuration(self):
    """Test that buckets have versioning enabled."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    
    # Should have versioning config for each bucket type
    assert len(versioning_configs) >= 2
    
    for versioning_config in versioning_configs.values():
      version_config = versioning_config.get("versioning_configuration", {})
      assert version_config.get("status") == "Enabled"

  def test_bucket_public_access_block(self):
    """Test that buckets have public access blocked."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})
    
    # Should have public access block for each bucket type
    assert len(public_access_blocks) >= 2
    
    for block_config in public_access_blocks.values():
      assert block_config.get("block_public_acls") is True
      assert block_config.get("block_public_policy") is True
      assert block_config.get("ignore_public_acls") is True
      assert block_config.get("restrict_public_buckets") is True

  def test_bucket_policy_security_statements(self):
    """Test that bucket policies have required security statements."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    bucket_policies = resources.get("aws_s3_bucket_policy", {})
    
    # Should have bucket policy for each bucket type
    assert len(bucket_policies) >= 2
    
    for policy_config in bucket_policies.values():
      policy_doc = json.loads(policy_config.get("policy"))
      statements = policy_doc.get("Statement", [])
      
      # Should have at least 2 statements (HTTPS and encryption)
      assert len(statements) >= 2
      
      # Check for HTTPS enforcement statement
      https_statement = next(
        (stmt for stmt in statements if stmt.get("Sid") == "DenyInsecureConnections"),
        None
      )
      assert https_statement is not None
      assert https_statement.get("Effect") == "Deny"
      
      # Check for encryption enforcement statement
      encryption_statement = next(
        (stmt for stmt in statements if stmt.get("Sid") == "DenyUnencryptedObjectUploads"),
        None
      )
      assert encryption_statement is not None
      assert encryption_statement.get("Effect") == "Deny"

  def test_bucket_naming_with_custom_prefix(self):
    """Test bucket naming with custom prefix."""
    app = App()
    stack = TapStack(app, "CustomPrefixStack", bucket_prefix="my-custom-prefix")
    
    assert stack.bucket_names["data"] == "my-custom-prefix-bucket"
    assert stack.bucket_names["logs"] == "my-custom-prefix-logs-bucket"

  def test_bucket_tags_include_bucket_type(self):
    """Test that buckets have BucketType tag."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    bucket_types_found = set()
    for bucket_config in s3_buckets.values():
      tags = bucket_config.get("tags", {})
      bucket_type = tags.get("BucketType")
      assert bucket_type is not None
      bucket_types_found.add(bucket_type)
    
    # Should have both data and logs bucket types
    assert "data" in bucket_types_found
    assert "logs" in bucket_types_found


class TestCreateIamRolesMethod:
  """Test suite for _create_iam_roles method."""

  def setup_method(self):
    """Set up test fixtures."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "IAMMethodTestStack")  # pylint: disable=attribute-defined-outside-init

  def test_create_iam_roles_returns_dict(self):
    """Test that _create_iam_roles returns a dictionary of roles."""
    roles = self.stack.roles
    
    assert isinstance(roles, dict)
    assert "analytics_reader" in roles
    assert "uploader" in roles
    assert "logs_reader" in roles

  def test_analytics_reader_role_configuration(self):
    """Test analytics reader role configuration."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    # Find analytics reader role
    analytics_role = None
    for role_config in iam_roles.values():
      if "analytics-reader" in role_config.get("name", ""):
        analytics_role = role_config
        break
    
    assert analytics_role is not None
    
    # Check assume role policy
    assume_policy = json.loads(analytics_role.get("assume_role_policy"))
    statement = assume_policy.get("Statement", [{}])[0]
    assert statement.get("Principal", {}).get("Service") == "ec2.amazonaws.com"
    assert statement.get("Action") == "sts:AssumeRole"

  def test_uploader_role_configuration(self):
    """Test uploader role configuration."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    # Find uploader role
    uploader_role = None
    for role_config in iam_roles.values():
      if "uploader" in role_config.get("name", ""):
        uploader_role = role_config
        break
    
    assert uploader_role is not None
    
    # Check assume role policy
    assume_policy = json.loads(uploader_role.get("assume_role_policy"))
    statement = assume_policy.get("Statement", [{}])[0]
    assert statement.get("Principal", {}).get("Service") == "lambda.amazonaws.com"

  def test_logs_reader_role_configuration(self):
    """Test logs reader role configuration."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    # Find logs reader role
    logs_role = None
    for role_config in iam_roles.values():
      if "logs-reader" in role_config.get("name", ""):
        logs_role = role_config
        break
    
    assert logs_role is not None
    
    # Check assume role policy
    assume_policy = json.loads(logs_role.get("assume_role_policy"))
    statement = assume_policy.get("Statement", [{}])[0]
    assert statement.get("Principal", {}).get("Service") == "ec2.amazonaws.com"

  def test_iam_policies_created_for_each_role(self):
    """Test that IAM policies are created for each role."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    iam_policies = resources.get("aws_iam_policy", {})
    
    # Should have at least 3 policies (one per role)
    assert len(iam_policies) >= 3
    
    # Check policy names contain expected patterns
    policy_names = [policy.get("name", "") for policy in iam_policies.values()]
    
    analytics_policy_found = any("analytics" in name for name in policy_names)
    uploader_policy_found = any("uploader" in name for name in policy_names)
    logs_policy_found = any("logs" in name for name in policy_names)
    
    assert analytics_policy_found
    assert uploader_policy_found  
    assert logs_policy_found

  def test_policy_attachments_created(self):
    """Test that policy attachments are created for each role."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    
    # Should have at least 3 attachments (one per role)
    assert len(policy_attachments) >= 3

  def test_role_naming_with_environment_suffix(self):
    """Test that role names include environment suffix."""
    app = App()
    stack = TapStack(app, "EnvTestStack", environment_suffix="production")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    for role_config in iam_roles.values():
      role_name = role_config.get("name", "")
      assert "production" in role_name

  def test_iam_roles_have_security_tags(self):
    """Test that IAM roles have security tags."""
    synth_output = json.loads(Testing.synth(self.stack))
    resources = synth_output.get("resource", {})
    
    iam_roles = resources.get("aws_iam_role", {})
    
    for role_config in iam_roles.values():
      tags = role_config.get("tags", {})
      assert tags.get("Owner") == "security-team"
      assert tags.get("SecurityLevel") == "high"
      assert tags.get("ManagedBy") == "cdktf"
      
      # Should have RoleType tag
      assert "RoleType" in tags


class TestCreateOutputsMethod:
  """Test suite for _create_outputs method."""

  def setup_method(self):
    """Set up test fixtures."""
    self.app = App()  # pylint: disable=attribute-defined-outside-init
    self.stack = TapStack(self.app, "OutputsMethodTestStack")  # pylint: disable=attribute-defined-outside-init

  def test_bucket_outputs_created(self):
    """Test that bucket outputs are created."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    # Should have bucket name and ARN outputs for each bucket type
    bucket_name_outputs = [name for name in outputs.keys() if "bucket" in name and "name" in name]
    bucket_arn_outputs = [name for name in outputs.keys() if "bucket" in name and "arn" in name]
    
    assert len(bucket_name_outputs) >= 2  # data and logs
    assert len(bucket_arn_outputs) >= 2   # data and logs

  def test_role_outputs_created(self):
    """Test that role outputs are created."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    # Should have role name and ARN outputs for each role
    role_name_outputs = [name for name in outputs.keys() if "role" in name and "name" in name]
    role_arn_outputs = [name for name in outputs.keys() if "role" in name and "arn" in name]
    
    assert len(role_name_outputs) >= 3   # analytics, uploader, logs
    assert len(role_arn_outputs) >= 3    # analytics, uploader, logs

  def test_security_validation_output(self):
    """Test that security validation output is created."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    assert "security-validation-info" in outputs
    
    security_output = outputs["security-validation-info"]
    security_value = json.loads(security_output.get("value"))
    
    # Check security validation info structure
    assert security_value.get("encryption_algorithm") == "AES256"
    assert security_value.get("https_enforced") is True
    assert security_value.get("versioning_enabled") is True
    assert security_value.get("public_access_blocked") is True
    assert security_value.get("least_privilege_implemented") is True

  def test_compliance_tags_output(self):
    """Test that compliance tags output is created."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    assert "compliance-tags" in outputs
    
    compliance_output = outputs["compliance-tags"]
    compliance_tags = json.loads(compliance_output.get("value"))
    
    # Check compliance tags structure
    assert compliance_tags.get("Environment") is not None
    assert compliance_tags.get("Owner") == "security-team"
    assert compliance_tags.get("SecurityLevel") == "high"
    assert compliance_tags.get("ManagedBy") == "cdktf"

  def test_output_descriptions(self):
    """Test that outputs have appropriate descriptions."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    for output_name, output_config in outputs.items():
      description = output_config.get("description", "")
      assert description != "", f"Output {output_name} should have a description"
      
      # Check specific description patterns
      if "bucket" in output_name and "name" in output_name:
        assert "bucket" in description.lower()
      elif "bucket" in output_name and "arn" in output_name:
        assert "arn" in description.lower()
      elif "role" in output_name:
        assert "role" in description.lower()

  def test_output_values_reference_resources(self):
    """Test that output values reference the correct resources."""
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    # Check bucket outputs reference bucket resources
    for output_name, output_config in outputs.items():
      if "bucket" in output_name:
        value = output_config.get("value")
        # Value should be a reference to a bucket resource
        assert isinstance(value, str)
        assert "${aws_s3_bucket." in value or isinstance(value, dict)

  def test_outputs_cover_all_created_resources(self):
    """Test that outputs are created for all buckets and roles."""
    # Check that we have outputs for each bucket type
    assert len(self.stack.bucket_names) == 2
    assert len(self.stack.buckets) == 2
    assert len(self.stack.roles) == 3
    
    synth_output = json.loads(Testing.synth(self.stack))
    outputs = synth_output.get("output", {})
    
    # Should have 2 bucket name outputs + 2 bucket ARN outputs = 4 bucket outputs
    bucket_outputs = [name for name in outputs.keys() if "bucket" in name]
    assert len(bucket_outputs) >= 4
    
    # Should have 3 role name outputs + 3 role ARN outputs = 6 role outputs  
    role_outputs = [name for name in outputs.keys() if "role" in name]
    assert len(role_outputs) >= 6
