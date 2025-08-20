"""Comprehensive unit tests for TAP Stack and MultiRegion Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack
from lib.main import MultiRegionStack


class TestTapStackStructure:
  """Comprehensive test suite for TAP Stack Structure."""

  def setup_method(self):
    """Reset state before each test."""
    pass

  def test_tap_stack_creation(self):
    """Test TapStack basic creation and structure."""
    app = App()
    stack = TapStack(app, "test-stack", environment_suffix="test")
    assert stack is not None
    assert hasattr(stack, 'bucket')
    assert hasattr(stack, 'aws_provider')

  def test_tap_stack_with_custom_config(self):
    """Test TapStack with custom configuration parameters."""
    app = App()
    stack = TapStack(
        app,
        "test-stack-custom",
        environment_suffix="prod",
        aws_region="us-west-2"
    )
    assert stack is not None
    assert hasattr(stack, 'bucket')
    assert hasattr(stack, 'aws_provider')

  def test_tap_stack_synthesis(self):
    """Test that TapStack synthesizes to valid Terraform configuration."""
    app = Testing.app()
    stack = TapStack(app, "synth-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    # Verify basic Terraform structure
    assert 'resource' in synthesized
    assert 'aws_s3_bucket' in synthesized
    assert 'aws_provider' in synthesized


class TestMultiRegionStackStructure:
  """Comprehensive test suite for MultiRegion Stack Structure."""

  def setup_method(self):
    """Reset state before each test."""
    pass

  def test_multiregion_stack_creation_us_east(self):
    """Test MultiRegionStack creation for US East 1."""
    app = App()
    stack = MultiRegionStack(app, "us-test-stack", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    assert stack is not None
    assert stack.region == "us-east-1"

  def test_multiregion_stack_creation_eu_central(self):
    """Test MultiRegionStack creation for EU Central 1."""
    app = App()
    stack = MultiRegionStack(app, "eu-test-stack", {
      "region": "eu-central-1", 
      "vpcCidr": "10.1.0.0/16",
      "environment": "test"
    })
    assert stack is not None
    assert stack.region == "eu-central-1"

  def test_multiregion_stack_synthesis_contains_all_resources(self):
    """Test that MultiRegionStack synthesizes with all expected AWS resources."""
    app = Testing.app()
    stack = MultiRegionStack(app, "resource-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16", 
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify all expected AWS resources are present
    assert 'aws_vpc' in synthesized
    assert 'aws_subnet' in synthesized
    assert 'aws_security_group' in synthesized
    assert 'aws_s3_bucket' in synthesized
    assert 'aws_iam_role' in synthesized
    assert 'aws_db_instance' in synthesized
    assert 'aws_db_subnet_group' in synthesized
    assert 'aws_cloudwatch_log_group' in synthesized
    assert 'aws_cloudtrail' in synthesized
    assert 'aws_kms_key' in synthesized
    assert 'aws_secretsmanager_secret' in synthesized

  def test_vpc_configuration(self):
    """Test VPC is configured with proper DNS settings."""
    app = Testing.app()
    stack = MultiRegionStack(app, "vpc-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify VPC configuration
    assert '"cidr_block": "10.0.0.0/16"' in synthesized
    assert '"enable_dns_hostnames": true' in synthesized
    assert '"enable_dns_support": true' in synthesized

  def test_subnet_configuration(self):
    """Test private subnets are configured correctly."""
    app = Testing.app()
    stack = MultiRegionStack(app, "subnet-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify subnet configuration
    assert '"map_public_ip_on_launch": false' in synthesized
    assert '"availability_zone": "us-east-1a"' in synthesized
    assert '"availability_zone": "us-east-1b"' in synthesized

  def test_security_group_no_ssh(self):
    """Test security groups block SSH access."""
    app = Testing.app()
    stack = MultiRegionStack(app, "sg-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify no SSH (port 22) access
    assert '"from_port": 22' not in synthesized
    assert '"to_port": 22' not in synthesized
    # Verify only HTTPS and MySQL ports
    assert '"from_port": 443' in synthesized
    assert '"from_port": 3306' in synthesized

  def test_rds_encryption_configuration(self):
    """Test RDS instance has encryption enabled."""
    app = Testing.app()
    stack = MultiRegionStack(app, "rds-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify RDS encryption
    assert '"storage_encrypted": true' in synthesized
    assert '"kms_key_id"' in synthesized
    assert '"manage_password": false' in synthesized
    assert '"password_secret_arn"' in synthesized

  def test_s3_encryption_configuration(self):
    """Test S3 buckets have encryption configured."""
    app = Testing.app()
    stack = MultiRegionStack(app, "s3-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify S3 encryption
    assert '"server_side_encryption_configuration"' in synthesized
    assert '"sse_algorithm": "AES256"' in synthesized

  def test_kms_key_rotation(self):
    """Test KMS key has rotation enabled."""
    app = Testing.app()
    stack = MultiRegionStack(app, "kms-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify KMS key rotation
    assert '"enable_key_rotation": true' in synthesized

  def test_secrets_manager_configuration(self):
    """Test Secrets Manager is configured with KMS encryption."""
    app = Testing.app()
    stack = MultiRegionStack(app, "secrets-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify Secrets Manager configuration
    assert 'aws_secretsmanager_secret' in synthesized
    assert 'aws_secretsmanager_secret_version' in synthesized
    assert '"password_length": 32' in synthesized
    assert '"exclude_characters": "\\"@/\\\\"' in synthesized

  def test_iam_role_minimal_permissions(self):
    """Test IAM role has minimal required permissions."""
    app = Testing.app()
    stack = MultiRegionStack(app, "iam-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify IAM role configuration
    assert '"Service": "monitoring.rds.amazonaws.com"' in synthesized
    assert 'AmazonRDSEnhancedMonitoringRole' in synthesized

  def test_cloudwatch_logs_configuration(self):
    """Test CloudWatch log group is configured."""
    app = Testing.app()
    stack = MultiRegionStack(app, "logs-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify CloudWatch logs
    assert '"retention_in_days": 7' in synthesized
    assert '"/aws/application/test"' in synthesized

  def test_cloudtrail_configuration(self):
    """Test CloudTrail is configured for audit logging."""
    app = Testing.app()
    stack = MultiRegionStack(app, "trail-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify CloudTrail configuration
    assert '"include_global_service_events": false' in synthesized
    assert '"is_multi_region_trail": false' in synthesized
    assert '"enable_logging": true' in synthesized

  def test_rds_backup_configuration(self):
    """Test RDS has backup and monitoring configured."""
    app = Testing.app()
    stack = MultiRegionStack(app, "backup-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    synthesized = Testing.synth(stack)
    
    # Verify RDS backup and monitoring
    assert '"backup_retention_period": 7' in synthesized
    assert '"backup_window": "03:00-04:00"' in synthesized
    assert '"maintenance_window": "sun:04:00-sun:05:00"' in synthesized
    assert '"monitoring_interval": 60' in synthesized

  def test_resource_tagging(self):
    """Test all resources have proper tags."""
    app = Testing.app()
    stack = MultiRegionStack(app, "tag-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test-env"
    })
    synthesized = Testing.synth(stack)
    
    # Verify consistent tagging
    assert '"Environment": "test-env"' in synthesized
    assert '"Name": "test-env-' in synthesized
    assert '"Encrypted": "true"' in synthesized

  def test_different_vpc_cidrs_for_regions(self):
    """Test different regions use different VPC CIDRs."""
    app = Testing.app()
    
    us_stack = MultiRegionStack(app, "us-cidr-test", {
      "region": "us-east-1",
      "vpcCidr": "10.0.0.0/16",
      "environment": "test"
    })
    
    eu_stack = MultiRegionStack(app, "eu-cidr-test", {
      "region": "eu-central-1",
      "vpcCidr": "10.1.0.0/16", 
      "environment": "test"
    })
    
    us_synthesized = Testing.synth(us_stack)
    eu_synthesized = Testing.synth(eu_stack)
    
    # Verify different CIDR blocks
    assert '"cidr_block": "10.0.0.0/16"' in us_synthesized
    assert '"cidr_block": "10.1.0.0/16"' in eu_synthesized
    assert '"cidr_block": "10.0.0.0/16"' not in eu_synthesized
    assert '"cidr_block": "10.1.0.0/16"' not in us_synthesized