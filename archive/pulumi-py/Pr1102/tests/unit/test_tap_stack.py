"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

from unittest.mock import patch, MagicMock
import pytest
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs:
  """Test cases for TapStackArgs configuration class."""

  @patch('lib.tap_stack.aws.get_region')
  def test_tap_stack_args_default_values(self, mock_get_region):
    """Test TapStackArgs with default values."""
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    args = TapStackArgs()
    
    assert args.environment_suffix == 'dev'
    assert args.env == 'prod'
    assert args.ssh_allowed_cidrs == ['10.0.0.0/8']
    assert args.cloudtrail_enable_data_events is True
    assert args.waf_rate_limit == 1000
    assert args.guardduty_regions == ['us-east-1', 'us-west-2', 'eu-west-1']
    assert args.vpc_flow_log_retention_days == 90
    assert args.rds_backup_retention_days == 7

  @patch('lib.tap_stack.aws.get_region')
  def test_tap_stack_args_custom_values(self, mock_get_region):
    """Test TapStackArgs with custom values."""
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    custom_tags = {"Environment": "test", "Project": "security"}
    args = TapStackArgs(
      environment_suffix="test",
      env="test",
      tags=custom_tags,
      ssh_allowed_cidrs=["192.168.1.0/24"],
      waf_rate_limit=2000,
      rds_backup_retention_days=14
    )
    
    assert args.environment_suffix == 'test'
    assert args.env == 'test'
    assert args.tags == custom_tags
    assert args.ssh_allowed_cidrs == ["192.168.1.0/24"]
    assert args.waf_rate_limit == 2000
    assert args.rds_backup_retention_days == 14


class TestTapStack:
  """Test cases for TapStack component."""

  @patch('pulumi.ComponentResource.__init__')
  @patch('lib.tap_stack.aws.get_region')
  def test_tap_stack_initialization(self, mock_get_region, mock_init):
    """Test TapStack initialization."""
    mock_init.return_value = None
    
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    args = TapStackArgs(
      environment_suffix="test",
      env="test",
      logging_bucket_name="test-logging-bucket"
    )
    
    # Mock all the security control methods to avoid resource creation
    with patch.object(TapStack, '_ensure_s3_encryption_and_logging'), \
         patch.object(TapStack, '_ensure_iam_least_privilege'), \
         patch.object(TapStack, '_ensure_rds_backups'), \
         patch.object(TapStack, '_restrict_ec2_ssh_and_sg'), \
         patch.object(TapStack, '_ensure_cloudtrail'), \
         patch.object(TapStack, '_enforce_nacls'), \
         patch.object(TapStack, '_encrypt_lambda_env'), \
         patch.object(TapStack, '_protect_cloudfront_with_waf'), \
         patch.object(TapStack, '_encrypt_dynamodb'), \
         patch.object(TapStack, '_enable_guardduty_all_regions'), \
         patch.object(TapStack, '_enable_vpc_flow_logs'):
      
      stack = TapStack("test-stack", args)
      
      assert stack.environment_suffix == "test"
      assert stack.env == "test"
      assert stack.logging_bucket_name == "test-logging-bucket"
      assert stack.ssh_allowed_cidrs == ['10.0.0.0/8']
      assert stack.cloudtrail_enable_data_events is True

  @patch('pulumi.ComponentResource.__init__')
  @patch('lib.tap_stack.aws.get_region')
  def test_get_resource_name(self, mock_get_region, mock_init):
    """Test _get_resource_name method."""
    mock_init.return_value = None
    
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    args = TapStackArgs(env="prod", region="us-east-1")
    
    # Mock all the security control methods to avoid resource creation
    with patch.object(TapStack, '_ensure_s3_encryption_and_logging'), \
         patch.object(TapStack, '_ensure_iam_least_privilege'), \
         patch.object(TapStack, '_ensure_rds_backups'), \
         patch.object(TapStack, '_restrict_ec2_ssh_and_sg'), \
         patch.object(TapStack, '_ensure_cloudtrail'), \
         patch.object(TapStack, '_enforce_nacls'), \
         patch.object(TapStack, '_encrypt_lambda_env'), \
         patch.object(TapStack, '_protect_cloudfront_with_waf'), \
         patch.object(TapStack, '_encrypt_dynamodb'), \
         patch.object(TapStack, '_enable_guardduty_all_regions'), \
         patch.object(TapStack, '_enable_vpc_flow_logs'):
      
      stack = TapStack("test", args)
      
      resource_name = stack._get_resource_name("s3", "bucket")
      assert resource_name == "prod-s3-us-east-1dev-bucket"
      
      resource_name_no_suffix = stack._get_resource_name("lambda")
      assert resource_name_no_suffix == "prod-lambda-us-east-1dev"

  @patch('pulumi.ComponentResource.__init__')
  @patch('lib.tap_stack.aws.get_region')
  def test_apply_tags(self, mock_get_region, mock_init):
    """Test _apply_tags method."""
    mock_init.return_value = None
    
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    base_tags = {"Environment": "prod", "ManagedBy": "Pulumi"}
    args = TapStackArgs(tags=base_tags)
    
    # Mock all the security control methods to avoid resource creation
    with patch.object(TapStack, '_ensure_s3_encryption_and_logging'), \
         patch.object(TapStack, '_ensure_iam_least_privilege'), \
         patch.object(TapStack, '_ensure_rds_backups'), \
         patch.object(TapStack, '_restrict_ec2_ssh_and_sg'), \
         patch.object(TapStack, '_ensure_cloudtrail'), \
         patch.object(TapStack, '_enforce_nacls'), \
         patch.object(TapStack, '_encrypt_lambda_env'), \
         patch.object(TapStack, '_protect_cloudfront_with_waf'), \
         patch.object(TapStack, '_encrypt_dynamodb'), \
         patch.object(TapStack, '_enable_guardduty_all_regions'), \
         patch.object(TapStack, '_enable_vpc_flow_logs'):
      
      stack = TapStack("test", args)
      
      # Test with additional tags
      additional_tags = {"Purpose": "Security", "Team": "DevOps"}
      result_tags = stack._apply_tags(additional_tags)
      
      expected_tags = {
        "Environment": "prod",
        "ManagedBy": "Pulumi",
        "Purpose": "Security",
        "Team": "DevOps"
      }
      assert result_tags == expected_tags
      
      # Test without additional tags
      result_tags_no_additional = stack._apply_tags()
      assert result_tags_no_additional == base_tags


class TestTapStackSecurityControls:
  """Test cases for security control methods."""

  @patch('pulumi.ComponentResource.__init__')
  @patch('lib.tap_stack.aws.get_region')
  @patch('pulumi.log.info')
  def test_main_orchestration(self, mock_log_info, mock_get_region, mock_init):
    """Test that _main calls all security control methods."""
    mock_init.return_value = None
    
    # Mock the region function
    mock_region = MagicMock()
    mock_region.name = "us-east-1"
    mock_get_region.return_value = mock_region
    
    args = TapStackArgs(
      environment_suffix="test",
      env="test",
      logging_bucket_name="test-logging-bucket"
    )
    
    # Mock all the security control methods
    with patch.object(TapStack, '_ensure_s3_encryption_and_logging') as mock_s3, \
         patch.object(TapStack, '_ensure_iam_least_privilege') as mock_iam, \
         patch.object(TapStack, '_ensure_rds_backups') as mock_rds, \
         patch.object(TapStack, '_restrict_ec2_ssh_and_sg') as mock_ssh, \
         patch.object(TapStack, '_ensure_cloudtrail') as mock_cloudtrail, \
         patch.object(TapStack, '_enforce_nacls') as mock_nacls, \
         patch.object(TapStack, '_encrypt_lambda_env') as mock_lambda, \
         patch.object(TapStack, '_protect_cloudfront_with_waf') as mock_waf, \
         patch.object(TapStack, '_encrypt_dynamodb') as mock_dynamodb, \
         patch.object(TapStack, '_enable_guardduty_all_regions') as mock_guardduty, \
         patch.object(TapStack, '_enable_vpc_flow_logs') as mock_flow_logs:
      
      stack = TapStack("test-stack", args)
      
      # Verify all methods were called
      mock_s3.assert_called_once()
      mock_iam.assert_called_once()
      mock_rds.assert_called_once()
      mock_ssh.assert_called_once()
      mock_cloudtrail.assert_called_once()
      mock_nacls.assert_called_once()
      mock_lambda.assert_called_once()
      mock_waf.assert_called_once()
      mock_dynamodb.assert_called_once()
      mock_guardduty.assert_called_once()
      mock_flow_logs.assert_called_once()
