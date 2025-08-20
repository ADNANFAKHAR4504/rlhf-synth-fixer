"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, Mock
import pulumi

# Import the classes we're testing - adjust the import path as needed
try:
  from lib.tap_stack import (
    TapStack, TapStackArgs, get_availability_zones,
    create_vpc_resources, create_security_groups
  )
except ImportError:
  # If the above fails, try alternative import paths
  try:
    from tap_stack import (
      TapStack, TapStackArgs, get_availability_zones,
      create_vpc_resources, create_security_groups
    )
  except ImportError:
    # If running from the directory containing the file
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from tap_stack import (
      TapStack, TapStackArgs, get_availability_zones,
      create_vpc_resources, create_security_groups
    )


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.regions, ['us-west-1', 'us-east-1'])

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_regions = ['us-west-2', 'us-east-2']
    args = TapStackArgs(regions=custom_regions, environment_suffix='prod')
    
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.regions, custom_regions)

  def test_tap_stack_args_partial_custom_values(self):
    """Test TapStackArgs with only some custom values."""
    args = TapStackArgs(environment_suffix='staging')
    
    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.regions, ['us-west-1', 'us-east-1'])


class TestUtilityFunctions(unittest.TestCase):
  """Test cases for utility functions."""

  def test_get_availability_zones_us_west_1(self):
    """Test availability zone mapping for us-west-1."""
    zones = get_availability_zones('us-west-1')
    expected = ['us-west-1a', 'us-west-1c']
    self.assertEqual(zones, expected)

  def test_get_availability_zones_us_east_1(self):
    """Test availability zone mapping for us-east-1."""
    zones = get_availability_zones('us-east-1')
    expected = ['us-east-1a', 'us-east-1b']
    self.assertEqual(zones, expected)

  def test_get_availability_zones_unknown_region(self):
    """Test availability zone mapping for unknown region."""
    zones = get_availability_zones('unknown-region')
    self.assertEqual(zones, [])


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack class."""

  @patch('pulumi.export')
  @patch('lib.tap_stack.deploy_multi_region_infrastructure')
  def test_tap_stack_initialization(self, mock_deploy, mock_export):
    """Test TapStack initialization."""
    # Mock the infrastructure deployment
    mock_infrastructure = {
      'us-west-1': {
        'vpc_resources': {
          'vpc': Mock(id='vpc-12345'),
          'public_subnets': [Mock(id='subnet-1'), Mock(id='subnet-2')],
          'private_subnets': [Mock(id='subnet-3'), Mock(id='subnet-4')]
        }
      },
      'single_region': {
        's3': {'bucket': Mock(bucket='test-bucket')},
        'rds': {'db': Mock(endpoint='test.rds.amazonaws.com')}
      }
    }
    mock_deploy.return_value = mock_infrastructure

    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)

    # Verify deploy function was called
    mock_deploy.assert_called_once()
    
    # Verify exports were called
    self.assertTrue(mock_export.called)

  @patch('pulumi.export')
  @patch('lib.tap_stack.SINGLE_REGION_MODE', True)
  @patch('lib.tap_stack.deploy_multi_region_infrastructure')
  def test_tap_stack_single_region_exports(self, mock_deploy, mock_export):
    """Test TapStack exports in single region mode."""
    # Mock the infrastructure
    mock_vpc = Mock(id='vpc-12345')
    mock_bucket = Mock(bucket='test-bucket-name')
    mock_db = Mock(endpoint='test-endpoint.rds.amazonaws.com')
    
    mock_infrastructure = {
      'us-west-1': {
        'vpc_resources': {
          'vpc': mock_vpc,
          'public_subnets': [Mock(id='subnet-pub-1'), Mock(id='subnet-pub-2')],
          'private_subnets': [Mock(id='subnet-priv-1'), Mock(id='subnet-priv-2')]
        }
      },
      'single_region': {
        's3': {'bucket': mock_bucket},
        'rds': {'db': mock_db}
      }
    }
    mock_deploy.return_value = mock_infrastructure

    # Create stack
    args = TapStackArgs()
    TapStack('test-stack', args)

    # Verify specific exports were called
    expected_calls = [
      (('vpc_id_us_west_1', mock_vpc.id), {}),
      (('bucket_name', mock_bucket.bucket), {}),
      (('db_endpoint', mock_db.endpoint), {})
    ]
    
    # Check that export was called with expected arguments
    for expected_call in expected_calls:
      mock_export.assert_any_call(*expected_call[0])


class TestVPCResourceCreation(unittest.TestCase):
  """Test cases for VPC resource creation functions."""

  @patch('pulumi_aws.ec2.Vpc')
  @patch('pulumi_aws.ec2.InternetGateway')
  @patch('pulumi_aws.ec2.Subnet')
  @patch('lib.tap_stack.get_availability_zones')
  def test_create_vpc_resources_basic_structure(self, mock_get_azs, mock_subnet,
                                                mock_igw, mock_vpc):
    """Test basic VPC resource creation structure."""
    # Mock availability zones
    mock_get_azs.return_value = ['us-west-1a', 'us-west-1c']
    
    # Mock AWS provider
    mock_provider = Mock()
    
    # Mock VPC and IGW
    mock_vpc_instance = Mock()
    mock_vpc_instance.id = 'vpc-12345'
    mock_vpc.return_value = mock_vpc_instance
    
    mock_igw_instance = Mock()
    mock_igw.return_value = mock_igw_instance
    
    # Mock subnets
    mock_subnet_instance = Mock()
    mock_subnet_instance.id = 'subnet-12345'
    mock_subnet.return_value = mock_subnet_instance
    
    # Call the function
    result = create_vpc_resources('us-west-1', mock_provider)
    
    # Verify VPC was created
    mock_vpc.assert_called_once()
    
    # Verify IGW was created
    mock_igw.assert_called_once()
    
    # Verify get_availability_zones was called
    mock_get_azs.assert_called_once_with('us-west-1')
    
    # Verify return structure
    self.assertIn('vpc', result)
    self.assertIn('igw', result)
    self.assertIn('public_subnets', result)
    self.assertIn('private_subnets', result)


class TestSecurityGroupCreation(unittest.TestCase):
  """Test cases for security group creation."""

  @patch('pulumi_aws.ec2.SecurityGroup')
  def test_create_security_groups_structure(self, mock_sg):
    """Test security group creation returns correct structure."""
    # Mock provider and VPC ID
    mock_provider = Mock()
    mock_vpc_id = 'vpc-12345'
    
    # Mock security group instances
    mock_sg_instance = Mock()
    mock_sg_instance.id = 'sg-12345'
    mock_sg.return_value = mock_sg_instance
    
    # Call the function
    result = create_security_groups('us-west-1', mock_vpc_id, mock_provider)
    
    # Verify security groups were created (3 calls: web, app, db)
    self.assertEqual(mock_sg.call_count, 3)
    
    # Verify return structure
    self.assertIn('web', result)
    self.assertIn('app', result)
    self.assertIn('db', result)
    
    # Verify all returned items are the mocked security group
    for sg in result.values():
      self.assertEqual(sg, mock_sg_instance)


class TestConfigurationConstants(unittest.TestCase):
  """Test cases for configuration constants and behavior."""

  def test_configuration_constants_exist(self):
    """Test that required configuration constants exist."""
    from lib import tap_stack
    
    # Test that constants are defined
    self.assertIsNotNone(tap_stack.REGIONS)
    self.assertIsNotNone(tap_stack.VPC_CIDR)
    self.assertIsNotNone(tap_stack.PUBLIC_SUBNET_CIDRS)
    self.assertIsNotNone(tap_stack.PRIVATE_SUBNET_CIDRS)
    self.assertIsNotNone(tap_stack.PROJECT_NAME)

  def test_regions_configuration(self):
    """Test regions configuration."""
    from lib import tap_stack
    
    # Test that regions are properly configured
    self.assertIsInstance(tap_stack.REGIONS, list)
    self.assertEqual(len(tap_stack.REGIONS), 2)
    self.assertIn('us-west-1', tap_stack.REGIONS)
    self.assertIn('us-east-1', tap_stack.REGIONS)

  def test_subnet_configuration(self):
    """Test subnet CIDR configuration."""
    from lib import tap_stack
    
    # Test subnet CIDRs
    self.assertIsInstance(tap_stack.PUBLIC_SUBNET_CIDRS, list)
    self.assertIsInstance(tap_stack.PRIVATE_SUBNET_CIDRS, list)
    self.assertEqual(len(tap_stack.PUBLIC_SUBNET_CIDRS), 2)
    self.assertEqual(len(tap_stack.PRIVATE_SUBNET_CIDRS), 2)


if __name__ == '__main__':
  # Set up Pulumi for testing
  pulumi.runtime.set_mocks(Mock())
  
  # Run tests
  unittest.main()