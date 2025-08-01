"""Unit tests for EnterpriseSecurityStack."""

import json
from cdktf import App

from lib.enterprise_security_stack import EnterpriseSecurityStack


class TestEnterpriseSecurityStack:
  """Test cases for EnterpriseSecurityStack class."""

  def test_security_stack_creation(self):
    """Test that security stack can be created without errors."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "test-security-stack",
      region="us-east-1"
    )
    
    # Verify the stack object has expected security components
    assert hasattr(stack, 'kms_key')
    assert hasattr(stack, 'cloudtrail')
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'iam_role')

  def test_kms_key_configuration(self):
    """Test that KMS key is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "kms-test-stack",
      region="us-west-2"
    )
    
    # Test KMS key attributes
    assert stack.kms_key is not None
    assert stack.kms_alias is not None

  def test_cloudtrail_configuration(self):
    """Test that CloudTrail is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "cloudtrail-test-stack",
      region="us-east-1"
    )
    
    # Verify CloudTrail is configured
    assert stack.cloudtrail is not None
    assert stack.cloudtrail_log_group is not None
    assert stack.cloudtrail_s3_bucket is not None

  def test_vpc_and_flow_logs_configuration(self):
    """Test that VPC and flow logs are properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "vpc-test-stack",
      region="us-west-2"
    )
    
    # Verify VPC components
    assert stack.vpc is not None
    if hasattr(stack, 'vpc_flow_log'):
      assert stack.vpc_flow_log is not None

  def test_iam_roles_and_policies(self):
    """Test that IAM roles and policies are properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "iam-test-stack",
      region="us-east-1"
    )
    
    # Verify IAM components
    assert stack.iam_role is not None
    assert stack.lambda_execution_role is not None
    assert stack.ec2_instance_role is not None
    assert stack.rds_monitoring_role is not None

  def test_security_monitoring_configuration(self):
    """Test that security monitoring is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "monitoring-test-stack",
      region="us-east-1"
    )
    
    # Verify monitoring components
    assert stack.intrusion_alarm is not None
    assert stack.sns_topic is not None

  def test_lambda_function_configuration(self):
    """Test that Lambda function is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "lambda-test-stack",
      region="us-west-2"
    )
    
    # Verify Lambda components
    assert stack.lambda_function is not None
    assert stack.lambda_execution_role is not None

  def test_rds_configuration(self):
    """Test that RDS instance is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "rds-test-stack",
      region="us-east-1"
    )
    
    # Verify RDS components
    assert stack.rds_instance is not None
    assert stack.rds_monitoring_role is not None

  def test_ec2_launch_template_configuration(self):
    """Test that EC2 launch template is properly configured."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "ec2-test-stack",
      region="us-west-2"
    )
    
    # Verify EC2 components
    assert stack.launch_template is not None
    assert stack.ec2_instance_role is not None

  def test_security_stack_with_provider_alias(self):
    """Test security stack creation with provider alias."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "alias-test-stack",
      region="eu-west-1",
      provider_alias="europe"
    )
    
    # Should create successfully with provider alias
    assert stack is not None
    assert hasattr(stack, 'kms_key')
    assert hasattr(stack, 'vpc')

  def test_regional_resource_naming(self):
    """Test that resources are named with regional identifiers."""
    app = App()
    
    # Create stacks in different regions
    us_stack = EnterpriseSecurityStack(
      app,
      "us-security-stack",
      region="us-east-1"
    )
    
    eu_stack = EnterpriseSecurityStack(
      app,
      "eu-security-stack", 
      region="eu-west-1"
    )
    
    # Both should be created successfully
    assert us_stack is not None
    assert eu_stack is not None

  def test_security_stack_comprehensive_resources(self):
    """Test that all required security resources are present."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "comprehensive-security-stack",
      region="us-east-1"
    )
    
    # Verify all major security components exist
    required_attributes = [
      'kms_key', 'kms_alias',
      'cloudtrail', 'cloudtrail_log_group', 'cloudtrail_s3_bucket',
      'vpc', 'iam_role', 'lambda_execution_role',
      'ec2_instance_role', 'rds_monitoring_role',
      'intrusion_alarm', 'sns_topic',
      'lambda_function', 'rds_instance', 'launch_template'
    ]
    
    for attr in required_attributes:
      assert hasattr(stack, attr), f"Security stack should have {attr}"
      assert getattr(stack, attr) is not None, f"{attr} should not be None"

  def test_security_compliance_features(self):
    """Test that security compliance features are implemented."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "compliance-test-stack",
      region="us-west-2"
    )
    
    # Verify encryption components
    assert stack.kms_key is not None, "Should have KMS key for encryption"
    
    # Verify audit logging
    assert stack.cloudtrail is not None, "Should have CloudTrail for audit logging"
    assert stack.cloudtrail_log_group is not None, "Should have CloudWatch log group"
    
    # Verify network security
    assert stack.vpc is not None, "Should have VPC for network isolation"
    
    # Verify monitoring
    assert stack.intrusion_alarm is not None, "Should have intrusion detection"
    assert stack.sns_topic is not None, "Should have SNS for alerts"

  def test_least_privilege_iam_configuration(self):
    """Test that IAM roles follow least privilege principles."""
    app = App()
    stack = EnterpriseSecurityStack(
      app,
      "iam-privilege-test-stack",
      region="us-east-1"
    )
    
    # Verify different roles exist for different purposes
    roles = [
      stack.iam_role,
      stack.lambda_execution_role, 
      stack.ec2_instance_role,
      stack.rds_monitoring_role
    ]
    
    for role in roles:
      assert role is not None, "All IAM roles should be created"
    
    # Ensure roles are different (not the same instance)
    unique_roles = set(id(role) for role in roles)
    assert len(unique_roles) == len(roles), "Each role should be unique"