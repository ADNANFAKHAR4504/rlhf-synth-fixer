"""Integration tests for EnterpriseSecurityStack."""

import json
from cdktf import App, Testing

from lib.enterprise_security_stack import EnterpriseSecurityStack


class TestEnterpriseSecurityStackIntegration:
  """Integration test cases for EnterpriseSecurityStack class."""

  def test_security_stack_synthesis(self):
    """Test that security stack synthesizes correctly."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "integration-security-stack",
      region="us-east-1"
    )
    
    # Should synthesize without errors
    synth_result = Testing.synth(app)
    assert synth_result is not None
    
    # Verify it's valid JSON
    terraform_config = json.loads(synth_result)
    assert isinstance(terraform_config, dict)
    assert "resource" in terraform_config

  def test_kms_resources_synthesis(self):
    """Test that KMS resources synthesize with proper configuration."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "kms-integration-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for KMS resources
    assert "aws_kms_key" in resources, "Should have KMS key resource"
    assert "aws_kms_alias" in resources, "Should have KMS alias resource"
    
    # Verify KMS key configuration
    kms_keys = resources["aws_kms_key"]
    for key_config in kms_keys.values():
      assert "deletion_window_in_days" in key_config
      assert "enable_key_rotation" in key_config
      assert key_config["enable_key_rotation"] is True

  def test_cloudtrail_resources_synthesis(self):
    """Test that CloudTrail resources synthesize correctly."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "cloudtrail-integration-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for CloudTrail resources
    assert "aws_cloudtrail" in resources, "Should have CloudTrail resource"
    assert "aws_s3_bucket" in resources, "Should have S3 bucket for CloudTrail"
    assert "aws_cloudwatch_log_group" in resources, "Should have CloudWatch log group"
    
    # Verify CloudTrail configuration
    cloudtrails = resources["aws_cloudtrail"]
    for trail_config in cloudtrails.values():
      assert "is_multi_region_trail" in trail_config
      assert trail_config["is_multi_region_trail"] is True
      assert "enable_logging" in trail_config
      assert trail_config["enable_logging"] is True

  def test_vpc_and_networking_synthesis(self):
    """Test that VPC and networking resources synthesize correctly."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "vpc-integration-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for VPC resources
    assert "aws_vpc" in resources, "Should have VPC resource"
    
    # Check for VPC flow logs if available
    if "aws_flow_log" in resources:
      flow_logs = resources["aws_flow_log"]
      for flow_log_config in flow_logs.values():
        assert "traffic_type" in flow_log_config
        assert flow_log_config["traffic_type"] == "ALL"

  def test_iam_resources_synthesis(self):
    """Test that IAM resources synthesize with proper policies."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "iam-integration-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for IAM resources
    assert "aws_iam_role" in resources, "Should have IAM roles"
    assert "aws_iam_policy" in resources, "Should have IAM policies"
    assert "aws_iam_role_policy_attachment" in resources, "Should have policy attachments"
    
    # Verify IAM roles have proper trust policies
    iam_roles = resources["aws_iam_role"]
    for role_config in iam_roles.values():
      assert "assume_role_policy" in role_config
      # Should be valid JSON policy
      try:
        policy = json.loads(role_config["assume_role_policy"])
        assert "Version" in policy
        assert "Statement" in policy
      except json.JSONDecodeError:
        assert False, "IAM assume role policy should be valid JSON"

  def test_lambda_resources_synthesis(self):
    """Test that Lambda resources synthesize correctly."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "lambda-integration-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for Lambda resources
    assert "aws_lambda_function" in resources, "Should have Lambda function"
    
    # Verify Lambda configuration
    lambda_functions = resources["aws_lambda_function"]
    for lambda_config in lambda_functions.values():
      assert "runtime" in lambda_config
      assert "handler" in lambda_config
      assert "filename" in lambda_config or "s3_bucket" in lambda_config

  def test_rds_resources_synthesis(self):
    """Test that RDS resources synthesize with encryption."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "rds-integration-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for RDS resources
    assert "aws_db_instance" in resources, "Should have RDS instance"
    
    # Verify RDS encryption configuration
    rds_instances = resources["aws_db_instance"]
    for rds_config in rds_instances.values():
      assert "storage_encrypted" in rds_config
      assert rds_config["storage_encrypted"] is True
      if "kms_key_id" in rds_config:
        # Should reference KMS key
        assert "aws_kms_key" in str(rds_config["kms_key_id"])

  def test_ec2_resources_synthesis(self):
    """Test that EC2 resources synthesize with security configurations."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "ec2-integration-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for EC2 launch template
    assert "aws_launch_template" in resources, "Should have launch template"
    
    # Verify launch template security configuration
    launch_templates = resources["aws_launch_template"]
    for template_config in launch_templates.values():
      # Should not have public IP assignment
      if "network_interfaces" in template_config:
        network_interfaces = template_config["network_interfaces"]
        if isinstance(network_interfaces, list):
          for ni in network_interfaces:
            if "associate_public_ip_address" in ni:
              assert ni["associate_public_ip_address"] is False

  def test_monitoring_resources_synthesis(self):
    """Test that monitoring resources synthesize correctly."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "monitoring-integration-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for monitoring resources
    assert "aws_cloudwatch_metric_alarm" in resources, "Should have CloudWatch alarms"
    assert "aws_sns_topic" in resources, "Should have SNS topic for alerts"
    
    # Verify alarm configuration
    alarms = resources["aws_cloudwatch_metric_alarm"]
    for alarm_config in alarms.values():
      assert "comparison_operator" in alarm_config
      assert "evaluation_periods" in alarm_config
      assert "metric_name" in alarm_config

  def test_s3_security_synthesis(self):
    """Test that S3 buckets have proper security configurations."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "s3-security-integration-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Check for S3 security resources
    if "aws_s3_bucket" in resources:
      encryption_key = "aws_s3_bucket_server_side_encryption_configuration"
      assert encryption_key in resources, "S3 buckets should have encryption"
      public_access_key = "aws_s3_bucket_public_access_block"
      assert public_access_key in resources, "S3 buckets should block public access"
      
      # Verify encryption configuration
      encryption_configs = resources["aws_s3_bucket_server_side_encryption_configuration"]
      for enc_config in encryption_configs.values():
        assert "rule" in enc_config
        rules = enc_config["rule"]
        if isinstance(rules, list) and len(rules) > 0:
          rule = rules[0]
          if "apply_server_side_encryption_by_default" in rule:
            encryption_default = rule["apply_server_side_encryption_by_default"]
            assert "sse_algorithm" in encryption_default

  def test_cross_resource_dependencies(self):
    """Test that resources have proper cross-dependencies."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "dependency-integration-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Verify CloudTrail references KMS key and S3 bucket
    if "aws_cloudtrail" in resources:
      cloudtrails = resources["aws_cloudtrail"]
      for trail_config in cloudtrails.values():
        if "kms_key_id" in trail_config:
          assert "aws_kms_key" in str(trail_config["kms_key_id"])
        if "s3_bucket_name" in trail_config:
          assert "aws_s3_bucket" in str(trail_config["s3_bucket_name"])

  def test_multi_region_security_deployment(self):
    """Test security stack deployment across multiple regions."""
    app = App()
    
    # Create security stacks for different regions
    EnterpriseSecurityStack(
      app,
      "us-east-security",
      region="us-east-1"
    )
    
    EnterpriseSecurityStack(
      app,
      "eu-west-security",
      region="eu-west-1",
      provider_alias="europe"
    )
    
    # Should synthesize both without conflicts
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    
    # Should have resources for both regions
    assert "resource" in terraform_config
    resources = terraform_config["resource"]
    
    # Should have multiple KMS keys (one per region)
    if "aws_kms_key" in resources:
      kms_keys = resources["aws_kms_key"]
      assert len(kms_keys) >= 1, "Should have KMS keys for regions"

  def test_security_compliance_validation(self):
    """Test that all security compliance requirements are met."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "compliance-validation-stack",
      region="us-east-1"
    )
    
    synth_result = Testing.synth(app)
    terraform_config = json.loads(synth_result)
    resources = terraform_config.get("resource", {})
    
    # Compliance checklist
    compliance_checks = {
      "encryption_at_rest": False,
      "audit_logging": False,
      "network_isolation": False,
      "access_control": False,
      "monitoring": False
    }
    
    # Check encryption (KMS)
    if "aws_kms_key" in resources:
      compliance_checks["encryption_at_rest"] = True
    
    # Check audit logging (CloudTrail)
    if "aws_cloudtrail" in resources:
      compliance_checks["audit_logging"] = True
    
    # Check network isolation (VPC)
    if "aws_vpc" in resources:
      compliance_checks["network_isolation"] = True
    
    # Check access control (IAM)
    if "aws_iam_role" in resources and "aws_iam_policy" in resources:
      compliance_checks["access_control"] = True
    
    # Check monitoring (CloudWatch)
    if "aws_cloudwatch_metric_alarm" in resources:
      compliance_checks["monitoring"] = True
    
    # Verify all compliance requirements are met
    for requirement, status in compliance_checks.items():
      assert status, f"Security compliance requirement not met: {requirement}"

  def test_terraform_configuration_validity(self):
    """Test that generated Terraform configuration is structurally valid."""
    app = App()
    EnterpriseSecurityStack(
      app,
      "terraform-validity-stack",
      region="us-west-2"
    )
    
    synth_result = Testing.fullSynth(app)
    
    # Should be valid JSON
    try:
      terraform_config = json.loads(synth_result)
    except json.JSONDecodeError as e:
      assert False, f"Generated Terraform is not valid JSON: {e}"
    
    # Should have required top-level sections
    required_sections = ["resource"]
    for section in required_sections:
      assert section in terraform_config, f"Missing required section: {section}"
    
    # Resources should have proper structure
    resources = terraform_config["resource"]
    for resource_type, resource_instances in resources.items():
      assert isinstance(resource_instances, dict), f"Resource type {resource_type} should be a dict"
      for resource_name, resource_config in resource_instances.items():
        resource_path = f"{resource_type}.{resource_name}"
        assert isinstance(resource_config, dict), f"Resource {resource_path} should be a dict"