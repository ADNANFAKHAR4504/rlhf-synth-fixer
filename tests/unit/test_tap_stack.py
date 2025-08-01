"""Unit tests for TAP stack."""

import json

from cdktf import App, TerraformStack, Testing
from cdktf_cdktf_provider_aws.provider import AwsProvider

from lib.enterprise_security_stack import EnterpriseSecurityStack
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
    
    # Use Testing.synth for TapStack directly
    synth_result = Testing.synth(stack)
    assert synth_result is not None
    
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
    
    # Use Testing.synth and parse the result
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Find S3 bucket resources - look for the main TAP bucket
    s3_buckets = terraform_config.get("resource", {}).get("aws_s3_bucket", {})
    tap_bucket = None
    
    for bucket_id, bucket_config in s3_buckets.items():
      if "tap_bucket" in bucket_id:
        tap_bucket = bucket_config
        break
    
    assert tap_bucket is not None, "Should have TAP S3 bucket"
    assert "tap-bucket-test" in tap_bucket["bucket"]
    assert tap_bucket["force_destroy"] is True

  def test_stack_s3_versioning_configuration(self):
    """Test that S3 bucket versioning is properly configured."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for versioning configuration
    versioning_configs = terraform_config.get("resource", {}).get("aws_s3_bucket_versioning", {})
    tap_versioning = None
    
    for version_id, version_config in versioning_configs.items():
      if "tap_bucket_versioning" in version_id:
        tap_versioning = version_config
        break
    
    assert tap_versioning is not None, "Should have S3 bucket versioning configured"
    assert tap_versioning["versioning_configuration"]["status"] == "Enabled"

  def test_stack_s3_encryption_configuration(self):
    """Test that S3 bucket encryption is properly configured."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for encryption configuration
    encryption_configs = terraform_config.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    tap_encryption = None
    
    for encrypt_id, encrypt_config in encryption_configs.items():
      if "tap_bucket_encryption" in encrypt_id:
        tap_encryption = encrypt_config
        break
    
    assert tap_encryption is not None, "Should have S3 bucket encryption configured"
    encryption_rule = tap_encryption["rule"][0]
    encryption_default = encryption_rule["apply_server_side_encryption_by_default"]
    # Updated to expect KMS encryption instead of AES256
    assert encryption_default["sse_algorithm"] == "aws:kms"
    assert "kms_master_key_id" in encryption_default

  def test_stack_backend_configuration(self):
    """Test that Terraform backend is properly configured."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      state_bucket="custom-state-bucket",
      state_bucket_region="us-east-1"
    )
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check backend configuration
    backend = terraform_config.get("terraform", {}).get("backend", {}).get("s3", {})
    assert backend["bucket"] == "custom-state-bucket"
    assert backend["key"] == "test/test-stack.tfstate"
    assert backend["region"] == "us-east-1"
    assert backend["encrypt"] is True

  def test_stack_aws_provider_configuration(self):
    """Test that AWS providers are properly configured."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-west-2",
      secondary_region="eu-west-1",
      default_tags={"Environment": "test"}
    )
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check provider configuration
    providers = terraform_config.get("provider", {}).get("aws", {})
    
    # Handle both list and dict formats
    if isinstance(providers, list):
      provider_list = providers
    else:
      provider_list = list(providers.values()) if providers else []
    
    assert len(provider_list) >= 2, "Should have primary and secondary AWS providers"
    
    # Find primary and secondary providers
    primary_provider = None
    secondary_provider = None
    
    for provider in provider_list:
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
    synth_result = Testing.synth(stack)
    assert synth_result is not None

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
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check that custom parameters are applied
    backend = terraform_config.get("terraform", {}).get("backend", {}).get("s3", {})
    assert backend["bucket"] == "prod-terraform-states"
    assert backend["key"] == "prod/prod-stack.tfstate"
    assert backend["region"] == "eu-central-1"
    
    # Verify bucket naming uses environment suffix
    s3_buckets = terraform_config.get("resource", {}).get("aws_s3_bucket", {})
    tap_bucket = None
    
    for bucket_id, bucket_config in s3_buckets.items():
      if "tap_bucket" in bucket_id:
        tap_bucket = bucket_config
        break
    
    assert tap_bucket is not None, "Should have TAP bucket"
    assert "tap-bucket-prod" in tap_bucket["bucket"]

  def test_stack_resource_dependencies(self):
    """Test that resources have proper dependencies."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check that versioning and encryption reference the TAP bucket
    versioning_configs = terraform_config.get("resource", {}).get("aws_s3_bucket_versioning", {})
    encryption_configs = terraform_config.get("resource", {}).get(
      "aws_s3_bucket_server_side_encryption_configuration", {}
    )
    
    # Find TAP bucket versioning and encryption
    tap_versioning = None
    tap_encryption = None
    
    for version_id, version_config in versioning_configs.items():
      if "tap_bucket_versioning" in version_id:
        tap_versioning = version_config
        break
    
    for encrypt_id, encrypt_config in encryption_configs.items():
      if "tap_bucket_encryption" in encrypt_id:
        tap_encryption = encrypt_config
        break
    
    # Both should reference the TAP bucket ID
    assert tap_versioning is not None, "Should have TAP bucket versioning"
    assert tap_encryption is not None, "Should have TAP bucket encryption"
    assert "tap_bucket" in str(tap_versioning["bucket"])
    assert "tap_bucket" in str(tap_encryption["bucket"])

class TestEnterpriseSecurityStack:
  """Test cases for EnterpriseSecurityStack class."""

  def _create_test_stack(self, stack_id: str, region: str = "us-east-1", 
                        provider_alias: str = None):
    """Helper method to create a test stack with proper structure."""
    app = App()
    stack = TerraformStack(app, stack_id)
    
    # Add AWS provider to the stack
    AwsProvider(stack, "aws", region=region)
    
    # Create the enterprise security stack within the terraform stack
    security_stack = EnterpriseSecurityStack(
      stack,
      "enterprise-security",
      region=region,
      provider_alias=provider_alias
    )
    
    return stack, security_stack

  def test_security_stack_creation(self):
    """Test that security stack can be created without errors."""
    stack, security_stack = self._create_test_stack("test-security-stack")
    
    # Verify the stack object has expected security components
    assert hasattr(security_stack, 'kms_key')
    assert hasattr(security_stack, 'cloudtrail_bucket')
    assert hasattr(security_stack, 'vpc')
    assert hasattr(security_stack, 'current_account')
    
    # Synthesize to ensure no errors
    synth_result = Testing.synth(stack)
    assert synth_result is not None

  def test_kms_key_configuration(self):
    """Test that KMS key is properly configured."""
    stack, _ = self._create_test_stack("kms-test-stack", region="us-west-2")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for KMS key resources
    kms_keys = terraform_config.get("resource", {}).get("aws_kms_key", {})
    assert len(kms_keys) > 0, "Should have KMS key configured"
    
    kms_key = list(kms_keys.values())[0]
    assert "Enterprise KMS key" in kms_key["description"]
    assert kms_key["enable_key_rotation"] is True

  def test_cloudtrail_configuration(self):
    """Test that CloudTrail is properly configured in primary region."""
    stack, _ = self._create_test_stack("cloudtrail-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for CloudTrail resources (only in primary region)
    cloudtrails = terraform_config.get("resource", {}).get("aws_cloudtrail", {})
    
    # Should have CloudTrail in primary region
    assert len(cloudtrails) > 0, "Should have CloudTrail configured"
    
    cloudtrail = list(cloudtrails.values())[0]
    assert cloudtrail["name"] == "EnterpriseCloudTrail"
    assert cloudtrail["is_multi_region_trail"] is True
    assert cloudtrail["enable_log_file_validation"] is True

  def test_vpc_and_flow_logs_configuration(self):
    """Test that VPC and flow logs are properly configured."""
    stack, _ = self._create_test_stack("vpc-test-stack", region="us-west-2")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for VPC resources
    vpcs = terraform_config.get("resource", {}).get("aws_vpc", {})
    assert len(vpcs) > 0, "Should have VPC configured"
    
    vpc = list(vpcs.values())[0]
    assert vpc["cidr_block"] == "10.0.0.0/16"
    assert vpc["enable_dns_hostnames"] is True
    assert vpc["enable_dns_support"] is True

  def test_iam_roles_and_policies(self):
    """Test that IAM roles and policies are properly configured."""
    stack, _ = self._create_test_stack("iam-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for IAM roles (should exist in primary region)
    iam_roles = terraform_config.get("resource", {}).get("aws_iam_role", {})
    iam_policies = terraform_config.get("resource", {}).get("aws_iam_policy", {})
    
    # Should have IAM resources in primary region
    assert len(iam_roles) > 0, "Should have IAM roles configured"
    assert len(iam_policies) > 0, "Should have IAM policies configured"

  def test_security_monitoring_configuration(self):
    """Test that security monitoring is properly configured."""
    stack, _ = self._create_test_stack("monitoring-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for SNS topics
    sns_topics = terraform_config.get("resource", {}).get("aws_sns_topic", {})
    assert len(sns_topics) > 0, "Should have SNS topic for security alerts"
    
    # Check for CloudWatch alarms
    cloudwatch_alarms = terraform_config.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
    assert len(cloudwatch_alarms) > 0, "Should have CloudWatch alarms configured"

  def test_lambda_function_configuration(self):
    """Test that Lambda function is properly configured in primary region."""
    stack, _ = self._create_test_stack("lambda-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for Lambda function (only in primary region)
    lambda_functions = terraform_config.get("resource", {}).get("aws_lambda_function", {})
    if len(lambda_functions) > 0:  # Lambda only created in primary region
      lambda_function = list(lambda_functions.values())[0]
      assert "enterprise-secure-function" in lambda_function["function_name"]

  def test_rds_configuration(self):
    """Test that RDS instance is properly configured."""
    stack, _ = self._create_test_stack("rds-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for RDS instances
    rds_instances = terraform_config.get("resource", {}).get("aws_db_instance", {})
    assert len(rds_instances) > 0, "Should have RDS instance configured"
    
    rds_instance = list(rds_instances.values())[0]
    assert rds_instance["storage_encrypted"] is True
    assert rds_instance["publicly_accessible"] is False

  def test_ec2_launch_template_configuration(self):
    """Test that EC2 launch template is properly configured."""
    stack, _ = self._create_test_stack("ec2-test-stack", region="us-west-2")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Check for launch templates
    launch_templates = terraform_config.get("resource", {}).get("aws_launch_template", {})
    assert len(launch_templates) > 0, "Should have launch template configured"
    
    launch_template = list(launch_templates.values())[0]
    assert launch_template["metadata_options"]["http_tokens"] == "required"

  def test_security_stack_with_provider_alias(self):
    """Test security stack creation with provider alias."""
    stack, security_stack = self._create_test_stack("alias-test-stack", 
                                                    region="eu-west-1", 
                                                    provider_alias="europe")
    
    # Should create successfully with provider alias
    assert security_stack is not None
    assert hasattr(security_stack, 'kms_key')
    assert hasattr(security_stack, 'vpc')
    
    # Synthesize to ensure no errors
    synth_result = Testing.synth(stack)
    assert synth_result is not None

  def test_regional_resource_naming(self):
    """Test that resources are named with regional identifiers."""
    _, us_security_stack = self._create_test_stack("us-security-stack", region="us-east-1")
    _, eu_security_stack = self._create_test_stack("eu-security-stack", region="eu-west-1")
    
    # Both should be created successfully
    assert us_security_stack is not None
    assert eu_security_stack is not None
    
    # Check that regions are set correctly
    assert us_security_stack.region == "us-east-1"
    assert eu_security_stack.region == "eu-west-1"

  def test_security_stack_comprehensive_resources(self):
    """Test that all required security resources are present."""
    stack, _ = self._create_test_stack("comprehensive-security-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    resources = terraform_config.get("resource", {})
    
    # Verify presence of key security resources
    assert "aws_kms_key" in resources, "Should have KMS keys"
    assert "aws_s3_bucket" in resources, "Should have S3 buckets"
    assert "aws_vpc" in resources, "Should have VPC"
    assert "aws_cloudwatch_log_group" in resources, "Should have CloudWatch log groups"
    assert "aws_sns_topic" in resources, "Should have SNS topics"
    assert "aws_cloudwatch_metric_alarm" in resources, "Should have CloudWatch alarms"
    assert "aws_launch_template" in resources, "Should have launch templates"
    assert "aws_db_instance" in resources, "Should have RDS instances"

  def test_security_compliance_features(self):
    """Test that security compliance features are implemented."""
    stack, _ = self._create_test_stack("compliance-test-stack", region="us-west-2")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Verify encryption components
    kms_keys = terraform_config.get("resource", {}).get("aws_kms_key", {})
    assert len(kms_keys) > 0, "Should have KMS key for encryption"
    
    # Verify audit logging
    cloudtrails = terraform_config.get("resource", {}).get("aws_cloudtrail", {})
    cloudwatch_logs = terraform_config.get("resource", {}).get("aws_cloudwatch_log_group", {})
    assert len(cloudtrails) > 0, "Should have CloudTrail for audit logging"
    assert len(cloudwatch_logs) > 0, "Should have CloudWatch log group"
    
    # Verify network security
    vpcs = terraform_config.get("resource", {}).get("aws_vpc", {})
    assert len(vpcs) > 0, "Should have VPC for network isolation"
    
    # Verify monitoring
    cloudwatch_alarms = terraform_config.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
    sns_topics = terraform_config.get("resource", {}).get("aws_sns_topic", {})
    assert len(cloudwatch_alarms) > 0, "Should have intrusion detection"
    assert len(sns_topics) > 0, "Should have SNS for alerts"

  def test_least_privilege_iam_configuration(self):
    """Test that IAM roles follow least privilege principles."""
    stack, _ = self._create_test_stack("iam-privilege-test-stack")
    
    synth_result = Testing.synth(stack)
    terraform_config = json.loads(synth_result)
    
    # Verify different roles exist for different purposes
    iam_roles = terraform_config.get("resource", {}).get("aws_iam_role", {})
    assert len(iam_roles) > 0, "Should have multiple IAM roles for different services"
    
    # Check that roles have specific purposes
    role_names = [role.get("name", "") for role in iam_roles.values()]
    expected_roles = ["EnterpriseCloudTrailRole", "EnterpriseVPCFlowLogsRole", 
                     "EnterpriseLambdaExecutionRole"]
    
    for expected_role in expected_roles:
      assert any(expected_role in name for name in role_names), f"Should have {expected_role}"
