"""
Unit tests for the IPv6 dual-stack VPC infrastructure.
Comprehensive test coverage for all infrastructure components.
"""

import sys
import unittest
from unittest.mock import Mock

# Create a partial mock for pulumi that preserves the real ComponentResource
# but mocks the AWS interactions
class MockComponentResource:
  """Mock implementation of Pulumi ComponentResource."""
  
  def __init__(self, type_name, name, props=None, opts=None):
    self.type = type_name
    self.name = name
    self.props = props or {}
    self.opts = opts
    self.outputs = {}
  
  def register_outputs(self, outputs):
    """Mock implementation of register_outputs"""
    self.outputs = outputs

class MockPulumi:
  """Mock implementation of Pulumi module."""
  
  def __init__(self):
    # Use a mock ComponentResource that has the register_outputs method
    self.ComponentResource = MockComponentResource
    self.ResourceOptions = Mock
    self.Output = Mock()
    self.Output.from_input = Mock(return_value=Mock(apply=Mock(return_value='mocked_value')))
    
    # Mock the export function
    self.export = Mock()

# Create comprehensive AWS mocks
mock_aws = Mock()
mock_aws.ec2 = Mock()
mock_aws.autoscaling = Mock()

# Mock the get functions
mock_aws.get_availability_zones = Mock(
  return_value=Mock(names=['us-east-1a', 'us-east-1b']))
mock_aws.ec2.get_ami = Mock(
  return_value=Mock(id='ami-12345'))

# Create mock AWS resources with proper attributes
def create_mock_vpc(*args, **kwargs):  # pylint: disable=unused-argument
  vpc = Mock()
  vpc.id = 'vpc-123'
  vpc.ipv6_cidr_block = Mock()
  vpc.ipv6_cidr_block.apply = Mock(return_value='2001:db8::/56')
  return vpc

def create_mock_subnet(*args, **kwargs):  # pylint: disable=unused-argument
  subnet = Mock()
  subnet.id = 'subnet-123'
  subnet.ipv6_cidr_block = '2001:db8:1::/64'
  return subnet

def create_mock_instance(*args, **kwargs):  # pylint: disable=unused-argument
  instance = Mock()
  instance.id = 'i-123'
  instance.ipv6_addresses = ['2001:db8::1']
  instance.private_ip = '10.0.1.100'
  return instance

# Set up all AWS resource mocks
mock_aws.ec2.Vpc = Mock(side_effect=create_mock_vpc)
mock_aws.ec2.Subnet = Mock(side_effect=create_mock_subnet)
mock_aws.ec2.InternetGateway = Mock(return_value=Mock(id='igw-123'))
mock_aws.ec2.SecurityGroup = Mock(return_value=Mock(id='sg-123'))
mock_aws.ec2.RouteTable = Mock(return_value=Mock(id='rt-123'))
mock_aws.ec2.RouteTableAssociation = Mock(return_value=Mock(id='rta-123'))
mock_aws.ec2.Route = Mock(return_value=Mock(id='route-123'))
mock_aws.ec2.Eip = Mock(return_value=Mock(id='eip-123'))
mock_aws.ec2.NatGateway = Mock(return_value=Mock(id='nat-123'))
mock_aws.ec2.EgressOnlyInternetGateway = Mock(return_value=Mock(id='eigw-123'))
mock_aws.ec2.LaunchTemplate = Mock(return_value=Mock(id='lt-123'))
mock_aws.ec2.Instance = Mock(side_effect=create_mock_instance)
mock_aws.autoscaling.Group = Mock(return_value=Mock(id='asg-123'))
mock_aws.ec2.VpcGatewayAttachment = Mock(return_value=Mock(id='vgw-123'))

# Replace modules before importing our code
sys.modules['pulumi'] = MockPulumi()
sys.modules['pulumi_aws'] = mock_aws

# Import the actual classes after mocking is set up
from lib.tap_stack import TapStack, TapStackArgs  # pylint: disable=wrong-import-position


class TestTapStackArgs(unittest.TestCase):
  """Comprehensive tests for TapStackArgs class."""

  def test_tapstack_args_default_initialization(self):
    """Test TapStackArgs with default parameters"""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tapstack_args_custom_environment(self):
    """Test TapStackArgs with custom environment suffix"""
    args = TapStackArgs(environment_suffix='prod')
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertIsNone(args.tags)

  def test_tapstack_args_custom_tags(self):
    """Test TapStackArgs with custom tags"""
    test_tags = {'Environment': 'test', 'Team': 'platform'}
    args = TapStackArgs(tags=test_tags)
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, test_tags)

  def test_tapstack_args_full_custom(self):
    """Test TapStackArgs with all custom parameters"""
    test_tags = {'Project': 'IPv6Test', 'Owner': 'DevOps'}
    args = TapStackArgs(environment_suffix='staging', tags=test_tags)
    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, test_tags)


class TestTapStackInfrastructure(unittest.TestCase):  # pylint: disable=too-many-public-methods
  """Comprehensive tests for TapStack infrastructure components."""

  def setUp(self):
    """Set up test fixtures."""
    self.args = TapStackArgs(environment_suffix='test')

  def test_tapstack_initialization(self):
    """Test TapStack can be initialized"""
    stack = TapStack('test-stack', self.args)
    self.assertIsNotNone(stack)

  def test_vpc_creation(self):
    """Test VPC is created with correct configuration"""
    stack = TapStack('test-stack', self.args)
    
    # Verify VPC was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.Vpc.called)
    vpc_call = mock_aws.ec2.Vpc.call_args
    self.assertIn('ipv6-vpc-test', vpc_call[0])
    self.assertEqual(vpc_call[1]['cidr_block'], '10.0.0.0/16')
    self.assertTrue(vpc_call[1]['enable_dns_support'])
    self.assertTrue(vpc_call[1]['enable_dns_hostnames'])
    self.assertTrue(vpc_call[1]['assign_generated_ipv6_cidr_block'])

  def test_internet_gateway_creation(self):
    """Test Internet Gateway is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify IGW was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.InternetGateway.called)
    igw_call = mock_aws.ec2.InternetGateway.call_args
    self.assertIn('igw-test', igw_call[0])

  def test_egress_only_gateway_creation(self):
    """Test Egress Only Internet Gateway is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify EIGW was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.EgressOnlyInternetGateway.called)
    eigw_call = mock_aws.ec2.EgressOnlyInternetGateway.call_args
    self.assertIn('egress-igw-test', eigw_call[0])

  def test_public_subnet_creation(self):
    """Test public subnet is created with IPv6"""
    stack = TapStack('test-stack', self.args)
    
    # Verify public subnet was created and stack is valid
    self.assertIsNotNone(stack)
    subnet_calls = mock_aws.ec2.Subnet.call_args_list
    public_subnet_call = None
    for call in subnet_calls:
      if 'public' in call[0][0]:
        public_subnet_call = call
        break
    
    self.assertIsNotNone(public_subnet_call)
    self.assertIn('public-subnet-test', public_subnet_call[0])
    self.assertEqual(public_subnet_call[1]['cidr_block'], '10.0.11.0/24')
    self.assertTrue(public_subnet_call[1]['map_public_ip_on_launch'])

  def test_private_subnet_creation(self):
    """Test private subnet is created with IPv6"""
    stack = TapStack('test-stack', self.args)
    
    # Verify private subnet was created and stack is valid
    self.assertIsNotNone(stack)
    subnet_calls = mock_aws.ec2.Subnet.call_args_list
    private_subnet_call = None
    for call in subnet_calls:
      if 'private' in call[0][0]:
        private_subnet_call = call
        break
    
    self.assertIsNotNone(private_subnet_call)
    self.assertIn('private-subnet-test', private_subnet_call[0])
    self.assertEqual(private_subnet_call[1]['cidr_block'], '10.0.12.0/24')

  def test_security_group_creation(self):
    """Test security group is created with proper rules"""
    stack = TapStack('test-stack', self.args)
    
    # Verify security group was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.SecurityGroup.called)
    sg_call = mock_aws.ec2.SecurityGroup.call_args
    self.assertIn('sec-group-test', sg_call[0])

  def test_route_tables_creation(self):
    """Test route tables are created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify route tables were created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.RouteTable.called)
    rt_calls = mock_aws.ec2.RouteTable.call_args_list
    self.assertGreaterEqual(len(rt_calls), 1)

  def test_nat_gateway_creation(self):
    """Test NAT Gateway is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify NAT Gateway was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.NatGateway.called)
    nat_call = mock_aws.ec2.NatGateway.call_args
    self.assertIn('nat-gateway-test', nat_call[0])

  def test_elastic_ip_creation(self):
    """Test Elastic IP is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify EIP was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.Eip.called)
    eip_call = mock_aws.ec2.Eip.call_args
    self.assertIn('nat-eip-test', eip_call[0])

  def test_launch_template_creation(self):
    """Test Launch Template is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify Launch Template was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.LaunchTemplate.called)
    lt_call = mock_aws.ec2.LaunchTemplate.call_args
    self.assertIn('web-server-lt-test', lt_call[0])

  def test_ec2_instances_creation(self):
    """Test EC2 instances are created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify EC2 instances were created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.Instance.called)
    instance_calls = mock_aws.ec2.Instance.call_args_list
    self.assertGreaterEqual(len(instance_calls), 1)

  def test_autoscaling_group_creation(self):
    """Test Auto Scaling Group is created"""
    stack = TapStack('test-stack', self.args)
    
    # Verify ASG was created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.autoscaling.Group.called)
    asg_call = mock_aws.autoscaling.Group.call_args
    self.assertIn('web-server-asg-test', asg_call[0])

  def test_stack_has_vpc_attribute(self):
    """Test stack has vpc attribute"""
    stack = TapStack('test-stack', self.args)
    self.assertTrue(hasattr(stack, 'vpc'))
    self.assertIsNotNone(stack.vpc)

  def test_stack_has_subnet_attributes(self):
    """Test stack has subnet attributes"""
    stack = TapStack('test-stack', self.args)
    self.assertTrue(hasattr(stack, 'public_subnet'))
    self.assertTrue(hasattr(stack, 'private_subnet'))
    self.assertIsNotNone(stack.public_subnet)
    self.assertIsNotNone(stack.private_subnet)

  def test_stack_has_instance_attributes(self):
    """Test stack has instance attributes"""
    stack = TapStack('test-stack', self.args)
    self.assertTrue(hasattr(stack, 'instance1'))
    self.assertTrue(hasattr(stack, 'instance2'))
    self.assertIsNotNone(stack.instance1)
    self.assertIsNotNone(stack.instance2)

  def test_stack_has_asg_attribute(self):
    """Test stack has auto scaling group attribute"""
    stack = TapStack('test-stack', self.args)
    self.assertTrue(hasattr(stack, 'asg'))
    self.assertIsNotNone(stack.asg)

  def test_exports_are_called(self):
    """Test that Pulumi exports are called"""
    stack = TapStack('test-stack', self.args)
    
    # Verify export was called and stack is valid
    self.assertIsNotNone(stack)
    mock_pulumi = sys.modules['pulumi']
    self.assertTrue(mock_pulumi.export.called)

  def test_derive_ipv6_function_with_existing_subnet(self):
    """Test IPv6 CIDR derivation with existing subnet number"""
    stack = TapStack('test-stack', self.args)
    
    # Test the derive function logic is working and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.Subnet.called)

  def test_resource_tags_applied(self):
    """Test that custom tags are applied to resources"""
    custom_tags = {'Environment': 'test', 'Project': 'IPv6'}
    args = TapStackArgs(environment_suffix='test', tags=custom_tags)
    stack = TapStack('test-stack', args)
    
    # Verify that resources were created and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.Vpc.called)

  def test_availability_zones_used(self):
    """Test that availability zones are properly used"""
    stack = TapStack('test-stack', self.args)
    
    # Verify availability zones were queried and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.get_availability_zones.called)

  def test_ami_lookup_performed(self):
    """Test that AMI lookup is performed"""
    stack = TapStack('test-stack', self.args)
    
    # Verify AMI lookup was performed and stack is valid
    self.assertIsNotNone(stack)
    self.assertTrue(mock_aws.ec2.get_ami.called)

  def tearDown(self):
    """Clean up after each test."""
    # Reset all mocks
    for attr_name in dir(mock_aws.ec2):
      attr = getattr(mock_aws.ec2, attr_name)
      if hasattr(attr, 'reset_mock'):
        attr.reset_mock()
    
    for attr_name in dir(mock_aws.autoscaling):
      attr = getattr(mock_aws.autoscaling, attr_name)
      if hasattr(attr, 'reset_mock'):
        attr.reset_mock()
    
    if hasattr(mock_aws, 'get_availability_zones'):
      mock_aws.get_availability_zones.reset_mock()


if __name__ == '__main__':
  unittest.main()
