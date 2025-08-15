"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_with_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {'Environment': 'test', 'Owner': 'QA'}
    args = TapStackArgs(environment_suffix='qa', tags=custom_tags)
    
    self.assertEqual(args.environment_suffix, 'qa')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_with_none_suffix(self):
    """Test TapStackArgs defaults to 'dev' when suffix is None."""
    args = TapStackArgs(environment_suffix=None)
    
    self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack component."""

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_initialization(self, mock_aws, mock_pulumi):
    """Test TapStack initialization and basic setup."""
    # Mock the caller identity
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    # Mock the AMI
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Mock Pulumi resource options
    mock_resource_options = MagicMock()
    mock_pulumi.ResourceOptions.return_value = mock_resource_options
    
    # Test arguments
    args = TapStackArgs(environment_suffix='test')
    
    # Create TapStack instance
    stack = TapStack('test-stack', args)
    
    # Verify initialization
    self.assertEqual(stack.environment_suffix, 'test')
    self.assertIsNone(stack.tags)
    
    # Verify that AWS resources are created
    self.assertTrue(mock_aws.ec2.Vpc.called)
    self.assertTrue(mock_aws.s3.Bucket.called)
    self.assertTrue(mock_aws.iam.Role.called)

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_tap_stack_with_tags(self, mock_aws, _mock_pulumi):
    """Test TapStack with custom tags."""
    # Mock dependencies
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Test with custom tags
    custom_tags = {'Environment': 'staging', 'Team': 'DevOps'}
    args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
    
    stack = TapStack('staging-stack', args)
    
    self.assertEqual(stack.environment_suffix, 'staging')
    self.assertEqual(stack.tags, custom_tags)

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_vpc_creation(self, mock_aws, _mock_pulumi):
    """Test VPC and networking components creation."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify VPC creation
    mock_aws.ec2.Vpc.assert_called_once()
    vpc_call = mock_aws.ec2.Vpc.call_args
    self.assertEqual(vpc_call[1]['cidr_block'], '10.0.0.0/16')
    self.assertTrue(vpc_call[1]['enable_dns_hostnames'])
    self.assertTrue(vpc_call[1]['enable_dns_support'])

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_security_groups_creation(self, mock_aws, _mock_pulumi):
    """Test security groups creation with proper rules."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify security groups are created
    self.assertEqual(mock_aws.ec2.SecurityGroup.call_count, 2)

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')  
  def test_s3_bucket_creation(self, mock_aws, _mock_pulumi):
    """Test S3 bucket creation with versioning and security."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify S3 bucket creation
    mock_aws.s3.Bucket.assert_called_once()
    mock_aws.s3.BucketVersioningV2.assert_called_once()
    mock_aws.s3.BucketPublicAccessBlock.assert_called_once()

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_iam_resources_creation(self, mock_aws, _mock_pulumi):
    """Test IAM role, policy, and instance profile creation."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify IAM resources
    mock_aws.iam.Role.assert_called_once()
    mock_aws.iam.Policy.assert_called_once()
    mock_aws.iam.RolePolicyAttachment.assert_called_once()
    mock_aws.iam.InstanceProfile.assert_called_once()

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_ec2_instances_creation(self, mock_aws, _mock_pulumi):
    """Test EC2 instances creation with proper configuration."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify EC2 instances creation
    self.assertEqual(mock_aws.ec2.Instance.call_count, 2)
    
    # Check that AMI lookup was called
    mock_aws.ec2.get_ami.assert_called_once()

  @patch('lib.tap_stack.pulumi')
  @patch('lib.tap_stack.aws')
  def test_pulumi_exports(self, mock_aws, mock_pulumi):
    """Test that all expected outputs are exported."""
    # Setup mocks
    mock_caller_identity = MagicMock()
    mock_caller_identity.account_id = '123456789012'
    mock_aws.get_caller_identity.return_value = mock_caller_identity
    
    mock_ami = MagicMock()
    mock_ami.id = 'ami-12345678'
    mock_aws.ec2.get_ami.return_value = mock_ami
    
    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)
    
    # Verify pulumi exports are called
    expected_exports = [
      'vpc_id', 'public_subnet_id', 'private_subnet_id',
      'web_instance_public_ip', 'web_instance_private_ip',
      'private_instance_private_ip', 's3_bucket_name',
      'web_server_url', 'region'
    ]
    
    # Check that export was called for each expected output
    self.assertEqual(mock_pulumi.export.call_count, len(expected_exports))


if __name__ == '__main__':
  unittest.main()
