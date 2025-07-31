# test_tap_stack.py

import unittest
from unittest.mock import Mock, patch, MagicMock, call
import os
import sys


# Set environment variable for Pulumi testing
os.environ['PULUMI_TEST_MODE'] = 'true'

class MockComponentResource:
  """Mock Pulumi ComponentResource"""
  def __init__(self, type_name, name, props=None, opts=None):
    self.type_name = type_name
    self.name = name
    self.props = props
    self.opts = opts
    
  def register_outputs(self, outputs):
    self.outputs = outputs

class MockOutput:
  """Mock Pulumi Output"""
  def __init__(self, value=None):
    self.value = value
    
  @staticmethod
  def all(*args):
    mock_result = Mock()
    mock_result.apply = Mock(return_value=Mock())
    return mock_result
    
  @staticmethod
  def concat(*args):
    return Mock()

class TestTapStack(unittest.TestCase):
  
  @classmethod
  def setUpClass(cls):
    """Set up class-level mocks"""
    # Mock Pulumi modules
    cls.mock_pulumi = Mock()
    cls.mock_pulumi.ComponentResource = MockComponentResource
    cls.mock_pulumi.ResourceOptions = Mock
    cls.mock_pulumi.Output = MockOutput
    cls.mock_pulumi.AssetArchive = Mock()
    cls.mock_pulumi.StringAsset = Mock()
    cls.mock_pulumi.get_stack = Mock(return_value='test')
    
    # Mock AWS modules
    cls.mock_aws = Mock()
    cls.mock_aws.get_region.return_value = Mock(name='us-east-1')
    cls.mock_aws.get_availability_zones.return_value = Mock(
      names=['us-east-1a', 'us-east-1b']
    )
    
    # Apply module patches
    sys.modules['pulumi'] = cls.mock_pulumi
    sys.modules['pulumi_aws'] = cls.mock_aws

  def setUp(self):
    """Set up test environment for each test"""
    # Clear any existing imports to ensure clean state
    modules_to_clear = [m for m in sys.modules.keys() if m.startswith('lib.')]
    for module in modules_to_clear:
      if module in sys.modules:
        del sys.modules[module]
    
    # Import classes after mocking
    from lib.tap_stack import TapStack, TapStackArgs
    
    # Store references for use in tests
    self.TapStack = TapStack
    self.TapStackArgs = TapStackArgs
    
    # Create test arguments
    self.test_args = TapStackArgs(
      environment_suffix='test',
      tags={'Environment': 'test', 'Project': 'tap-stack'}
    )

  def test_tap_stack_args_defaults(self):
    """Test TapStackArgs default values"""
    args = self.TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)
    
    # Test with custom values
    custom_tags = {'Project': 'test', 'Owner': 'team'}
    args = self.TapStackArgs(environment_suffix='prod', tags=custom_tags)
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, custom_tags)

  @patch('lib.tap_stack.MonitoringInfrastructure')
  @patch('lib.tap_stack.FrontendInfrastructure')  
  @patch('lib.tap_stack.DataProcessingInfrastructure')
  @patch('lib.tap_stack.BackendInfrastructure')
  @patch('lib.tap_stack.NetworkInfrastructure')
  def test_tap_stack_initialization(self, mock_network, mock_backend,
                                   mock_data, mock_frontend, mock_monitoring):
    """Test TapStack creates all components correctly"""
    
    # Configure network mock
    mock_network_instance = Mock()
    mock_network_instance.vpc = Mock()
    mock_network_instance.vpc.id = 'vpc-123'
    mock_network_instance.private_subnet_ids = ['subnet-1', 'subnet-2']
    mock_network_instance.vpc_endpoint_security_group = Mock()
    mock_network_instance.vpc_endpoint_security_group.id = 'sg-123'
    mock_network.return_value = mock_network_instance
    
    # Configure monitoring mock
    mock_monitoring_instance = Mock()
    mock_monitoring_instance.sns_topic = Mock()
    mock_monitoring_instance.sns_topic.arn = 'arn:aws:sns:us-east-1:123:alerts'
    mock_monitoring_instance.setup_alarms = Mock()
    mock_monitoring.return_value = mock_monitoring_instance
    
    # Configure backend mock
    mock_backend_instance = Mock()
    mock_backend_instance.lambda_function = Mock()
    mock_backend_instance.lambda_function.name = 'backend-lambda'
    mock_backend.return_value = mock_backend_instance
    
    # Configure data processing mock
    mock_data_instance = Mock()
    mock_data_instance.kinesis_processor = Mock()
    mock_data_instance.kinesis_processor.name = 'kinesis-processor'
    mock_data_instance.kinesis_stream = Mock()
    mock_data_instance.kinesis_stream.name = 'data-stream'
    mock_data.return_value = mock_data_instance
    
    # Configure frontend mock
    mock_frontend_instance = Mock()
    mock_frontend_instance.cloudfront_distribution = Mock()
    mock_frontend_instance.cloudfront_distribution.id = 'dist-123'
    mock_frontend_instance.cloudfront_distribution.domain_name = 'abc123.cloudfront.net'
    mock_frontend.return_value = mock_frontend_instance
    
    # Create TapStack
    stack = self.TapStack('test-stack', self.test_args)
    
    # Verify stack properties
    self.assertIsNotNone(stack)
    self.assertEqual(stack.environment_suffix, 'test')
    self.assertEqual(stack.tags, {'Environment': 'test', 'Project': 'tap-stack'})
    
    # Verify components were instantiated
    mock_network.assert_called_once()
    mock_monitoring.assert_called_once()
    mock_backend.assert_called_once()
    mock_data.assert_called_once()
    mock_frontend.assert_called_once()
    
    # Verify component names
    network_call = mock_network.call_args
    self.assertEqual(network_call[1]['name'], 'test-stack-network')
    
    monitoring_call = mock_monitoring.call_args
    self.assertEqual(monitoring_call[1]['name'], 'test-stack-monitoring')

  @patch('lib.tap_stack.MonitoringInfrastructure')
  @patch('lib.tap_stack.FrontendInfrastructure')
  @patch('lib.tap_stack.DataProcessingInfrastructure')
  @patch('lib.tap_stack.BackendInfrastructure')
  @patch('lib.tap_stack.NetworkInfrastructure')
  def test_component_dependencies(self, mock_network, mock_backend,
                                mock_data, mock_frontend, mock_monitoring):
    """Test that components have correct dependencies"""
    
    # Setup comprehensive mocks
    mock_network_instance = Mock()
    mock_network_instance.vpc = Mock()
    mock_network_instance.vpc.id = 'vpc-test'
    mock_network_instance.private_subnet_ids = ['subnet-1']
    mock_network_instance.vpc_endpoint_security_group = Mock()
    mock_network_instance.vpc_endpoint_security_group.id = 'sg-test'
    mock_network.return_value = mock_network_instance
    
    mock_monitoring_instance = Mock()
    mock_monitoring_instance.sns_topic = Mock()
    mock_monitoring_instance.sns_topic.arn = 'arn:aws:sns:us-east-1:123:test'
    mock_monitoring_instance.setup_alarms = Mock()
    mock_monitoring.return_value = mock_monitoring_instance
    
    mock_backend_instance = Mock()
    mock_backend_instance.lambda_function = Mock()
    mock_backend_instance.lambda_function.name = 'backend-lambda'
    mock_backend.return_value = mock_backend_instance
    
    mock_data_instance = Mock()
    mock_data_instance.kinesis_processor = Mock()
    mock_data_instance.kinesis_processor.name = 'kinesis-processor'
    mock_data_instance.kinesis_stream = Mock()
    mock_data_instance.kinesis_stream.name = 'data-stream'
    mock_data.return_value = mock_data_instance
    
    mock_frontend_instance = Mock()
    mock_frontend_instance.cloudfront_distribution = Mock()
    mock_frontend_instance.cloudfront_distribution.id = 'dist-123'
    mock_frontend.return_value = mock_frontend_instance
    
    # Create stack
    stack = self.TapStack('test-stack', self.test_args)
    
    # Verify all components were called
    self.assertTrue(mock_network.called)
    self.assertTrue(mock_monitoring.called)
    self.assertTrue(mock_backend.called)
    self.assertTrue(mock_data.called)
    self.assertTrue(mock_frontend.called)
    
    # Verify backend received correct parameters
    backend_call = mock_backend.call_args
    backend_kwargs = backend_call[1] if backend_call else {}
    self.assertEqual(backend_kwargs.get('name'), 'test-stack-backend')
    
    # Verify monitoring setup_alarms was called
    mock_monitoring_instance.setup_alarms.assert_called_once()

  @patch('lib.tap_stack.MonitoringInfrastructure')
  @patch('lib.tap_stack.FrontendInfrastructure')
  @patch('lib.tap_stack.DataProcessingInfrastructure')
  @patch('lib.tap_stack.BackendInfrastructure')
  @patch('lib.tap_stack.NetworkInfrastructure')
  def test_stack_outputs(self, mock_network, mock_backend,
                        mock_data, mock_frontend, mock_monitoring):
    """Test that stack registers correct outputs"""
    
    # Setup detailed mocks with expected return values
    mock_network_instance = Mock()
    mock_network_instance.vpc = Mock()
    mock_network_instance.vpc.id = 'vpc-123'
    mock_network.return_value = mock_network_instance
    
    mock_monitoring_instance = Mock()
    mock_monitoring_instance.sns_topic = Mock()
    mock_monitoring_instance.sns_topic.arn = 'arn:aws:sns:us-east-1:123:topic'
    mock_monitoring_instance.setup_alarms = Mock()
    mock_monitoring.return_value = mock_monitoring_instance
    
    mock_backend_instance = Mock()
    mock_backend_instance.lambda_function = Mock()
    mock_backend_instance.lambda_function.name = 'backend-lambda'
    mock_backend.return_value = mock_backend_instance
    
    mock_data_instance = Mock()
    mock_data_instance.kinesis_processor = Mock()
    mock_data_instance.kinesis_processor.name = 'kinesis-processor'
    mock_data_instance.kinesis_stream = Mock()
    mock_data_instance.kinesis_stream.name = 'data-stream'
    mock_data.return_value = mock_data_instance
    
    mock_frontend_instance = Mock()
    mock_frontend_instance.cloudfront_distribution = Mock()
    mock_frontend_instance.cloudfront_distribution.id = 'dist-123'
    mock_frontend_instance.cloudfront_distribution.domain_name = 'abc123.cloudfront.net'
    mock_frontend.return_value = mock_frontend_instance
    
    # Create stack and check outputs
    stack = self.TapStack('test-stack', self.test_args)
    
    # Verify stack has the expected attributes
    self.assertTrue(hasattr(stack, 'network'))
    self.assertTrue(hasattr(stack, 'monitoring'))
    self.assertTrue(hasattr(stack, 'backend'))
    self.assertTrue(hasattr(stack, 'data_processing'))
    self.assertTrue(hasattr(stack, 'frontend'))
    
    # Verify outputs were registered (check if method exists on our mock)
    self.assertTrue(hasattr(stack, 'outputs'))

  @patch('lib.tap_stack.MonitoringInfrastructure')
  @patch('lib.tap_stack.FrontendInfrastructure')
  @patch('lib.tap_stack.DataProcessingInfrastructure')
  @patch('lib.tap_stack.BackendInfrastructure')
  @patch('lib.tap_stack.NetworkInfrastructure')
  def test_component_inheritance(self, mock_network, mock_backend,
                               mock_data, mock_frontend, mock_monitoring):
    """Test that TapStack properly inherits from ComponentResource"""
    
    # Setup minimal mocks
    mock_network.return_value = Mock()
    mock_monitoring_instance = Mock()
    mock_monitoring_instance.setup_alarms = Mock()
    mock_monitoring.return_value = mock_monitoring_instance
    mock_backend.return_value = Mock()
    mock_data.return_value = Mock()
    mock_frontend.return_value = Mock()
    
    # Create stack
    stack = self.TapStack('test-stack', self.test_args)
    
    # Test basic properties
    self.assertIsNotNone(stack)
    self.assertEqual(stack.environment_suffix, 'test')
    self.assertEqual(stack.tags, {'Environment': 'test', 'Project': 'tap-stack'})
    
    # Test inheritance by checking type_name (set by MockComponentResource)
    self.assertEqual(stack.type_name, 'tap:stack:TapStack')

  @patch('lib.tap_stack.MonitoringInfrastructure')
  @patch('lib.tap_stack.FrontendInfrastructure')
  @patch('lib.tap_stack.DataProcessingInfrastructure')
  @patch('lib.tap_stack.BackendInfrastructure')
  @patch('lib.tap_stack.NetworkInfrastructure')
  def test_component_names_generation(self, mock_network, mock_backend,
                                    mock_data, mock_frontend, mock_monitoring):
    """Test that component names are generated correctly"""
    
    # Setup minimal mocks
    mock_network.return_value = Mock()
    mock_monitoring_instance = Mock()
    mock_monitoring_instance.setup_alarms = Mock()
    mock_monitoring.return_value = mock_monitoring_instance
    mock_backend.return_value = Mock()
    mock_data.return_value = Mock()
    mock_frontend.return_value = Mock()
    
    # Create stack with custom name
    stack = self.TapStack('my-app', self.test_args)
    
    # Verify component names
    network_call = mock_network.call_args
    if network_call:
      self.assertEqual(network_call[1]['name'], 'my-app-network')
    
    backend_call = mock_backend.call_args
    if backend_call:
      self.assertEqual(backend_call[1]['name'], 'my-app-backend')
    
    data_call = mock_data.call_args
    if data_call:
      self.assertEqual(data_call[1]['name'], 'my-app-data')

  def test_environment_suffix_handling(self):
    """Test environment suffix is properly handled"""
    # Test default environment
    args_default = self.TapStackArgs()
    self.assertEqual(args_default.environment_suffix, 'dev')
    
    # Test custom environment
    args_custom = self.TapStackArgs(environment_suffix='prod')
    self.assertEqual(args_custom.environment_suffix, 'prod')
    
    # Test None environment gets default
    args_none = self.TapStackArgs(environment_suffix=None)
    self.assertEqual(args_none.environment_suffix, 'dev')

  def test_tags_handling(self):
    """Test tags are properly handled"""
    # Test default tags (None)
    args_default = self.TapStackArgs()
    self.assertIsNone(args_default.tags)
    
    # Test custom tags
    custom_tags = {'Env': 'test', 'Team': 'dev'}
    args_custom = self.TapStackArgs(tags=custom_tags)
    self.assertEqual(args_custom.tags, custom_tags)
    
    # Test empty tags dict
    args_empty = self.TapStackArgs(tags={})
    self.assertEqual(args_empty.tags, {})

if __name__ == '__main__':
  # Run tests with detailed output
  unittest.main(verbosity=2, buffer=True)
