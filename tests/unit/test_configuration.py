"""Unit tests for TapStack configuration parameter handling."""
import json
import os
import sys
from unittest.mock import patch

# Add project root to path before other imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing  # pylint: disable=wrong-import-position

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestConfigurationDefaults:
  """Test suite for default configuration values."""

  def test_default_environment_suffix(self):
    """Test that default environment_suffix is 'dev'."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Check that default environment suffix appears in tags and S3 backend
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert "dev/TestStack.tfstate" in backend_config.get("key", "")
    
    # Check common tags contain default environment
    resources = synth_output.get("resource", {})
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    if s3_buckets:
      first_bucket = list(s3_buckets.values())[0]
      tags = first_bucket.get("tags", {})
      assert tags.get("Environment") == "dev"

  def test_custom_environment_suffix(self):
    """Test that custom environment_suffix is used correctly."""
    app = App()
    stack = TapStack(app, "TestStack", environment_suffix="staging")
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Check S3 backend uses custom environment suffix
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert "staging/TestStack.tfstate" in backend_config.get("key", "")
    
    # Check common tags contain custom environment
    resources = synth_output.get("resource", {})
    s3_buckets = resources.get("aws_s3_bucket", {})
    
    if s3_buckets:
      first_bucket = list(s3_buckets.values())[0]
      tags = first_bucket.get("tags", {})
      assert tags.get("Environment") == "staging"

  def test_default_state_bucket(self):
    """Test that default state bucket is used."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("bucket") == "iac-rlhf-tf-states"

  def test_custom_state_bucket(self):
    """Test that custom state bucket is used."""
    app = App()
    stack = TapStack(app, "TestStack", state_bucket="custom-state-bucket")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("bucket") == "custom-state-bucket"

  def test_default_bucket_prefix(self):
    """Test that default bucket prefix is used."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    # Check bucket names contain default prefix
    expected_data_bucket = "terraform-cdkft-1-secure-data-bucket"
    expected_logs_bucket = "terraform-cdkft-1-secure-data-logs-bucket"
    
    assert stack.bucket_names["data"] == expected_data_bucket
    assert stack.bucket_names["logs"] == expected_logs_bucket

  def test_custom_bucket_prefix(self):
    """Test that custom bucket prefix is used."""
    app = App()
    stack = TapStack(app, "TestStack", bucket_prefix="custom-prefix")
    
    expected_data_bucket = "custom-prefix-bucket"
    expected_logs_bucket = "custom-prefix-logs-bucket"
    
    assert stack.bucket_names["data"] == expected_data_bucket
    assert stack.bucket_names["logs"] == expected_logs_bucket


class TestRegionConfiguration:
  """Test suite for AWS region configuration."""

  def test_hardcoded_aws_region(self):
    """Test that AWS region is hardcoded to eu-central-1."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Check provider configuration (provider.aws is a list)
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    assert provider_config.get("region") == "eu-central-1"

  def test_custom_aws_region_ignored(self):
    """Test that custom aws_region parameter is ignored (due to hardcoding)."""
    app = App()
    stack = TapStack(app, "TestStack", aws_region="us-west-2")
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Should still use hardcoded region (provider.aws is a list)
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    assert provider_config.get("region") == "eu-central-1"

  @patch.dict(os.environ, {"TERRAFORM_STATE_BUCKET_REGION": "us-west-1"})
  def test_state_bucket_region_from_env_var(self):
    """Test that state bucket region uses environment variable."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("region") == "us-west-1"

  @patch.dict(os.environ, {}, clear=True)
  def test_state_bucket_region_default_when_no_env_var(self):
    """Test that state bucket region defaults to us-east-1 when no env var."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("region") == "us-east-1"


class TestDefaultTagsHandling:
  """Test suite for default tags configuration."""

  def test_empty_default_tags(self):
    """Test that empty default_tags are handled correctly."""
    app = App()
    stack = TapStack(app, "TestStack", default_tags={})
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Handle provider.aws as list
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    
    # Should not have default_tags in provider config when empty
    assert "default_tags" not in provider_config

  def test_nested_default_tags_structure(self):
    """Test that nested default_tags structure is handled correctly."""
    custom_tags = {
      "tags": {
        "Project": "TestProject",
        "Team": "Engineering"
      }
    }
    
    app = App()
    stack = TapStack(app, "TestStack", default_tags=custom_tags)
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Handle provider.aws as list
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    
    # Should extract tags from nested structure
    default_tags_config = provider_config.get("default_tags", [])
    assert len(default_tags_config) == 1
    
    tags = default_tags_config[0].get("tags", {})
    assert tags.get("Project") == "TestProject"
    assert tags.get("Team") == "Engineering"

  def test_flat_default_tags_structure(self):
    """Test that flat default_tags structure is handled correctly."""
    custom_tags = {
      "Project": "TestProject",
      "Team": "Engineering"
    }
    
    app = App()
    stack = TapStack(app, "TestStack", default_tags=custom_tags)
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Handle provider.aws as list
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    
    # Should use flat structure directly
    default_tags_config = provider_config.get("default_tags", [])
    assert len(default_tags_config) == 1
    
    tags = default_tags_config[0].get("tags", {})
    assert tags.get("Project") == "TestProject"
    assert tags.get("Team") == "Engineering"

  def test_no_default_tags_parameter(self):
    """Test behavior when no default_tags parameter is provided."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    
    # Handle provider.aws as list
    aws_providers = synth_output.get("provider", {}).get("aws", [])
    assert len(aws_providers) >= 1
    provider_config = aws_providers[0] if isinstance(aws_providers, list) else aws_providers
    
    # Should not have default_tags in provider config
    assert "default_tags" not in provider_config


class TestCommonTagsGeneration:
  """Test suite for common tags generation."""

  def test_common_tags_structure(self):
    """Test that common tags are generated with expected structure."""
    app = App()
    stack = TapStack(app, "TestStack", environment_suffix="prod")
    
    expected_tags = {
      "Environment": "prod",
      "Owner": "security-team",
      "SecurityLevel": "high", 
      "ManagedBy": "cdktf",
      "Purpose": "secure-s3-iam-infrastructure",
      "ComplianceRequired": "true"
    }
    
    assert stack.common_tags == expected_tags

  def test_common_tags_applied_to_resources(self):
    """Test that common tags are applied to created resources."""
    app = App()
    stack = TapStack(app, "TestStack", environment_suffix="test")
    
    synth_output = json.loads(Testing.synth(stack))
    resources = synth_output.get("resource", {})
    
    # Check S3 buckets have common tags
    s3_buckets = resources.get("aws_s3_bucket", {})
    for bucket_config in s3_buckets.values():
      tags = bucket_config.get("tags", {})
      assert tags.get("Environment") == "test"
      assert tags.get("Owner") == "security-team"
      assert tags.get("SecurityLevel") == "high"
      assert tags.get("ManagedBy") == "cdktf"

    # Check IAM roles have common tags  
    iam_roles = resources.get("aws_iam_role", {})
    for role_config in iam_roles.values():
      tags = role_config.get("tags", {})
      assert tags.get("Environment") == "test"
      assert tags.get("Owner") == "security-team"


class TestS3BackendConfiguration:
  """Test suite for S3 backend configuration."""

  def test_s3_backend_encryption_enabled(self):
    """Test that S3 backend has encryption enabled."""
    app = App()
    stack = TapStack(app, "TestStack")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("encrypt") is True

  def test_s3_backend_key_generation(self):
    """Test that S3 backend key is generated correctly."""
    app = App()
    stack = TapStack(app, "MyTestStack", environment_suffix="production")
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    expected_key = "production/MyTestStack.tfstate"
    assert backend_config.get("key") == expected_key

  def test_s3_backend_complete_configuration(self):
    """Test complete S3 backend configuration."""
    app = App()
    stack = TapStack(
      app, 
      "CompleteTestStack",
      environment_suffix="staging",
      state_bucket="my-terraform-state",
    )
    
    synth_output = json.loads(Testing.synth(stack))
    terraform_config = synth_output.get("terraform", {})
    backend_config = terraform_config.get("backend", {}).get("s3", {})
    
    assert backend_config.get("bucket") == "my-terraform-state"
    assert backend_config.get("key") == "staging/CompleteTestStack.tfstate"
    assert backend_config.get("encrypt") is True
    assert backend_config.get("region") == "us-east-1"  # default


class TestStackInstantiation:
  """Test suite for stack instantiation scenarios."""

  def test_minimal_stack_instantiation(self):
    """Test stack can be instantiated with minimal parameters."""
    app = App()
    stack = TapStack(app, "MinimalStack")
    
    assert stack is not None
    assert hasattr(stack, 'bucket_names')
    assert hasattr(stack, 'common_tags')
    assert hasattr(stack, 'buckets')
    assert hasattr(stack, 'roles')

  def test_maximal_stack_instantiation(self):
    """Test stack can be instantiated with all parameters."""
    app = App()
    stack = TapStack(
      app,
      "MaximalStack", 
      environment_suffix="production",
      state_bucket="custom-state-bucket",
      default_tags={"tags": {"Project": "Test"}},
      bucket_prefix="custom-secure-data"
    )
    
    assert stack is not None
    assert stack.bucket_names["data"] == "custom-secure-data-bucket"
    assert stack.common_tags["Environment"] == "production"

  def test_stack_attributes_initialization(self):
    """Test that stack attributes are properly initialized."""
    app = App()
    stack = TapStack(app, "AttributeTestStack")
    
    # Check bucket_names is a dict with expected keys
    assert isinstance(stack.bucket_names, dict)
    assert "data" in stack.bucket_names
    assert "logs" in stack.bucket_names
    
    # Check common_tags is a dict with expected keys
    assert isinstance(stack.common_tags, dict)
    assert "Environment" in stack.common_tags
    assert "Owner" in stack.common_tags
    assert "SecurityLevel" in stack.common_tags
    
    # Check buckets and roles are dicts
    assert isinstance(stack.buckets, dict)
    assert isinstance(stack.roles, dict)
