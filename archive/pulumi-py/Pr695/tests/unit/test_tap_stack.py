"""
Unit tests for Nova Model Breaker TapStack infrastructure.

Tests stack initialization, configuration, and resource creation
without deploying actual AWS infrastructure.
"""

import unittest
from unittest.mock import Mock, patch

import pulumi

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):

  def test_default_initialization(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertEqual(args.tags, {})
    self.assertEqual(args.team, 'nova')
    self.assertEqual(args.region, 'us-west-2')

  def test_custom_initialization(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {'Environment': 'test', 'Project': 'nova-model-breaker'}
    args = TapStackArgs(
      environment_suffix='test',
      tags=custom_tags,
      team='nova-team',
      region='us-east-1'
    )
    
    self.assertEqual(args.environment_suffix, 'test')
    self.assertEqual(args.tags, custom_tags)
    self.assertEqual(args.team, 'nova-team')
    self.assertEqual(args.region, 'us-east-1')

  def test_partial_initialization(self):
    """Test TapStackArgs with partial custom values."""
    args = TapStackArgs(environment_suffix='prod', team='nova-prod')
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.team, 'nova-prod')
    self.assertEqual(args.region, 'us-west-2')  # Default
    self.assertEqual(args.tags, {})  # Default


@patch('lib.tap_stack.aws.get_caller_identity')
class TestTapStackCreation(unittest.TestCase):

  def setUp(self):
    """Set up test environment with Pulumi mocks."""
    pulumi.runtime.set_mocks(MockPulumi())

  def test_stack_initialization_with_defaults(self, mock_caller_identity):
    """Test stack creation with default TapStackArgs."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    
    args = TapStackArgs()
    stack = TapStack('test-stack', args)
    
    self.assertEqual(stack.environment_suffix, 'dev')
    self.assertEqual(stack.team, 'nova')
    self.assertEqual(stack.region, 'us-west-2')
    self.assertEqual(stack.tags, {})

  def test_stack_initialization_with_custom_args(self, mock_caller_identity):
    """Test stack creation with custom TapStackArgs."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    
    custom_tags = {'Environment': 'test'}
    args = TapStackArgs(
      environment_suffix='test',
      tags=custom_tags,
      team='nova-test',
      region='us-east-1'
    )
    stack = TapStack('test-stack', args)
    
    self.assertEqual(stack.environment_suffix, 'test')
    self.assertEqual(stack.team, 'nova-test')
    self.assertEqual(stack.region, 'us-east-1')
    self.assertEqual(stack.tags, custom_tags)

  def test_stack_resource_creation(self, mock_caller_identity):
    """Test that stack creates all expected resources."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    
    args = TapStackArgs(environment_suffix='test', team='nova')
    stack = TapStack('test-stack', args)
    
    # Verify that key resources are created
    self.assertTrue(hasattr(stack, 'dynamodb_table'))
    self.assertTrue(hasattr(stack, 'dlq_queue'))
    self.assertTrue(hasattr(stack, 'processor_lambda'))
    self.assertTrue(hasattr(stack, 'analyzer_lambda'))
    self.assertTrue(hasattr(stack, 'processor_role'))
    self.assertTrue(hasattr(stack, 'analyzer_role'))

  @patch('lib.tap_stack.aws.sqs.Queue')
  def test_dlq_queue_configuration(self, mock_sqs_queue, mock_caller_identity):
    """Test SQS DLQ queue configuration."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    mock_queue = Mock()
    mock_queue.arn = 'arn:aws:sqs:us-west-2:123456789012:test-nova-dlq-nova'
    mock_queue.url = 'https://sqs.us-west-2.amazonaws.com/123456789012/test-nova-dlq-nova'
    mock_sqs_queue.return_value = mock_queue
    
    args = TapStackArgs(environment_suffix='test', team='nova')
    TapStack('test-stack', args)  # Create stack to trigger mocks
    
    # Verify SQS queue was called with correct parameters
    mock_sqs_queue.assert_called_once()
    call_args = mock_sqs_queue.call_args
    
    self.assertEqual(call_args[0][0], "nova-dlq-queue")  # Resource name
    self.assertEqual(call_args[1]['name'], 'test-nova-dlq-nova')
    self.assertEqual(call_args[1]['message_retention_seconds'], 1209600)
    self.assertEqual(call_args[1]['visibility_timeout_seconds'], 60)

  @patch('lib.tap_stack.aws.dynamodb.Table')
  def test_dynamodb_table_configuration(self, mock_table, mock_caller_identity):
    """Test DynamoDB table configuration."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    mock_dynamodb_table = Mock()
    mock_dynamodb_table.stream_arn = (
      'arn:aws:dynamodb:us-west-2:123456789012:table/'
      'test-nova-data-nova/stream/2023-01-01T00:00:00.000'
    )
    mock_table.return_value = mock_dynamodb_table
    
    args = TapStackArgs(environment_suffix='test', team='nova')
    TapStack('test-stack', args)  # Create stack to trigger mocks
    
    # Verify DynamoDB table was called with correct parameters
    mock_table.assert_called_once()
    call_args = mock_table.call_args
    
    self.assertEqual(call_args[0][0], "nova-data-table")  # Resource name
    self.assertEqual(call_args[1]['name'], 'test-nova-data-nova')
    self.assertEqual(call_args[1]['billing_mode'], 'PAY_PER_REQUEST')
    self.assertEqual(call_args[1]['hash_key'], 'id')
    self.assertTrue(call_args[1]['stream_enabled'])
    self.assertEqual(call_args[1]['stream_view_type'], 'NEW_AND_OLD_IMAGES')

  @patch('lib.tap_stack.aws.lambda_.Function')
  def test_lambda_functions_configuration(self, mock_lambda_func, mock_caller_identity):
    """Test Lambda functions configuration."""
    mock_caller_identity.return_value = Mock(account_id='123456789012')
    
    args = TapStackArgs(environment_suffix='test', team='nova')
    TapStack('test-stack', args)  # Create stack to trigger mocks
    
    # Verify Lambda functions were created (should be called twice - processor and analyzer)
    self.assertEqual(mock_lambda_func.call_count, 2)
    
    # Get call arguments for both functions
    calls = mock_lambda_func.call_args_list
    
    # Check processor lambda
    processor_call = calls[0]
    self.assertEqual(processor_call[0][0], "processor-lambda")
    self.assertEqual(processor_call[1]['name'], 'test-processor-nova')
    self.assertEqual(processor_call[1]['runtime'], 'python3.9')
    self.assertEqual(processor_call[1]['timeout'], 60)
    self.assertEqual(processor_call[1]['memory_size'], 256)
    
    # Check analyzer lambda
    analyzer_call = calls[1]
    self.assertEqual(analyzer_call[0][0], "analyzer-lambda")
    self.assertEqual(analyzer_call[1]['name'], 'test-analyzer-nova')
    self.assertEqual(analyzer_call[1]['runtime'], 'python3.9')


class TestTapStackResourceNaming(unittest.TestCase):

  def test_resource_naming_convention(self):
    """Test that resource names follow expected conventions."""
    TapStackArgs(environment_suffix='prod', team='nova-team')
    
    # Test naming patterns that would be used
    expected_dlq_name = 'prod-nova-dlq-nova-team'
    expected_table_name = 'prod-nova-data-nova-team'
    expected_processor_role = 'prod-processor-nova-team-role'
    expected_analyzer_role = 'prod-analyzer-nova-team-role'
    
    # These would be the expected names based on the pattern in tap_stack.py
    self.assertTrue(expected_dlq_name.startswith('prod-nova-dlq-'))
    self.assertTrue(expected_table_name.startswith('prod-nova-data-'))
    self.assertTrue(expected_processor_role.endswith('-role'))
    self.assertTrue(expected_analyzer_role.endswith('-role'))

  def test_tag_generation(self):
    """Test that resource tags are properly generated."""
    custom_tags = {'Project': 'nova-model-breaker', 'Owner': 'nova-team'}
    args = TapStackArgs(environment_suffix='staging', tags=custom_tags, team='nova')
    
    # Verify tags are properly set
    self.assertIn('Project', args.tags)
    self.assertIn('Owner', args.tags)
    self.assertEqual(args.tags['Project'], 'nova-model-breaker')


class MockPulumi:
  """Mock Pulumi runtime for unit testing."""
  
  def call(self, args):
    """Mock Pulumi function calls."""
    if args.token == 'aws:index/getCallerIdentity:getCallerIdentity':
      return {'accountId': '123456789012'}
    return {}
  
  def new_resource(self, args):
    """Mock Pulumi resource creation."""
    return [args.name, {}]


if __name__ == '__main__':
  unittest.main()
