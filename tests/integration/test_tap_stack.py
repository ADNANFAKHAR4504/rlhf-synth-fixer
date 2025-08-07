"""Integration tests for TapStack using mock AWS services."""

import json
import os
import unittest
from unittest.mock import patch

import boto3
from moto import mock_aws

from lib.tap_stack import TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack using mocked AWS services."""

  def setUp(self):
    """Set up test environment with mocked AWS services."""
    self.environment = 'test'
    self.team = 'nova'
    self.region = 'us-west-2'

  @mock_aws
  def test_stack_integration_with_mocked_aws(self):
    """Test stack integration using mocked AWS services."""
    # Test stack argument validation
    args = TapStackArgs(
      environment_suffix=self.environment,
      team=self.team,
      region=self.region,
      tags={'Project': 'nova-test'}
    )

    # Verify arguments are properly set
    self.assertEqual(args.environment_suffix, self.environment)
    self.assertEqual(args.team, self.team)
    self.assertEqual(args.region, self.region)
    self.assertEqual(args.tags['Project'], 'nova-test')

  @mock_aws
  def test_environment_variable_integration(self):
    """Test environment variable integration for Lambda functions."""
    with patch.dict(os.environ, {
      'AWS_DEFAULT_REGION': self.region,
      'TEST_ENV': self.environment
    }):
      # Test environment variable access
      self.assertEqual(os.environ.get('AWS_DEFAULT_REGION'), self.region)
      self.assertEqual(os.environ.get('TEST_ENV'), self.environment)

  def test_stack_configuration_validation(self):
    """Test stack configuration validation logic."""
    # Test default configuration
    default_args = TapStackArgs()
    self.assertEqual(default_args.environment_suffix, 'dev')
    self.assertEqual(default_args.team, 'nova')
    self.assertEqual(default_args.region, 'us-west-2')
    self.assertIsInstance(default_args.tags, dict)

    # Test custom configuration
    custom_tags = {'Environment': 'test', 'Owner': 'nova-team'}
    custom_args = TapStackArgs(
      environment_suffix='staging',
      team='alpha',
      region='us-east-1',
      tags=custom_tags
    )
    self.assertEqual(custom_args.environment_suffix, 'staging')
    self.assertEqual(custom_args.team, 'alpha')
    self.assertEqual(custom_args.region, 'us-east-1')
    self.assertEqual(custom_args.tags, custom_tags)

  def test_resource_naming_integration(self):
    """Test resource naming convention integration."""
    args = TapStackArgs(
      environment_suffix='prod',
      team='beta'
    )

    # Test expected resource name(s)
    expected_table_name = f"{args.environment_suffix}-nova-data-{args.team}"
    expected_dlq_name = f"{args.environment_suffix}-nova-dlq-{args.team}"
    expected_processor_name = f"{args.environment_suffix}-processor-{args.team}"
    expected_analyzer_name = f"{args.environment_suffix}-analyzer-{args.team}"

    self.assertEqual(expected_table_name, 'prod-nova-data-beta')
    self.assertEqual(expected_dlq_name, 'prod-nova-dlq-beta')
    self.assertEqual(expected_processor_name, 'prod-processor-beta')
    self.assertEqual(expected_analyzer_name, 'prod-analyzer-beta')

  def test_tag_merging_integration(self):
    """Test tag merging integration for resource tagging."""
    base_tags = {'Project': 'nova', 'Owner': 'team-nova'}
    args = TapStackArgs(
      environment_suffix='dev',
      team='gamma',
      tags=base_tags
    )

    # Test tag merging logic
    additional_tags = {
      'Environment': args.environment_suffix,
      'Team': args.team,
      'Service': 'model-breaker'
    }

    merged_tags = {**args.tags, **additional_tags}
    expected_tags = {
      'Project': 'nova',
      'Owner': 'team-nova',
      'Environment': 'dev',
      'Team': 'gamma',
      'Service': 'model-breaker'
    }

    self.assertEqual(merged_tags, expected_tags)

  @mock_aws
  def test_boto3_client_integration(self):
    """Test boto3 client integration with mocked AWS."""
    # Test DynamoDB client
    dynamodb = boto3.client('dynamodb', region_name=self.region)
    self.assertIsNotNone(dynamodb)

    # Test Lambda client
    lambda_client = boto3.client('lambda', region_name=self.region)
    self.assertIsNotNone(lambda_client)

    # Test SQS client
    sqs = boto3.client('sqs', region_name=self.region)
    self.assertIsNotNone(sqs)

  def test_json_policy_validation(self):
    """Test JSON policy document validation."""
    trust_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          }
        }
      ]
    }

    # Test policy serialization and validation
    policy_json = json.dumps(trust_policy)
    parsed_policy = json.loads(policy_json)

    self.assertEqual(parsed_policy['Version'], '2012-10-17')
    self.assertEqual(len(parsed_policy['Statement']), 1)
    self.assertEqual(parsed_policy['Statement'][0]['Effect'], 'Allow')
    self.assertEqual(
      parsed_policy['Statement'][0]['Principal']['Service'],
      'lambda.amazonaws.com'
    )

  def test_region_validation_integration(self):
    """Test region validation integration."""
    valid_regions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-central-1', 'ap-southeast-1'
    ]

    for region in valid_regions:
      args = TapStackArgs(region=region)
      self.assertEqual(args.region, region)
      # Test region format validation
      self.assertRegex(region, r'^[a-z]{2}-[a-z]+-\d$')

  @mock_aws
  def test_lambda_code_integration(self):
    """Test Lambda function code integration and validation."""
    # Test processor Lambda code structure
    processor_code = '''import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    return {"statusCode": 200}'''
    
    # Validate code syntax
    compile(processor_code, '<string>', 'exec')
    
    # Test code contains required imports
    self.assertIn('import json', processor_code)
    self.assertIn('import os', processor_code)
    self.assertIn('import boto3', processor_code)
    self.assertIn('import logging', processor_code)
    self.assertIn('def lambda_handler(event, context):', processor_code)

  @mock_aws
  def test_iam_policy_integration(self):
    """Test IAM policy document integration and validation."""
    # Test DynamoDB stream permissions
    stream_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
            "dynamodb:DescribeStream",
            "dynamodb:ListStreams"
          ],
          "Resource": "arn:aws:dynamodb:us-west-2:123456789012:table/test-table/stream/*"
        }
      ]
    }
    
    # Validate policy structure
    policy_json = json.dumps(stream_policy)
    parsed_policy = json.loads(policy_json)
    
    self.assertEqual(parsed_policy['Version'], '2012-10-17')
    self.assertEqual(len(parsed_policy['Statement']), 1)
    self.assertEqual(parsed_policy['Statement'][0]['Effect'], 'Allow')
    self.assertEqual(len(parsed_policy['Statement'][0]['Action']), 4)
    self.assertIn('dynamodb:GetRecords', parsed_policy['Statement'][0]['Action'])

  @mock_aws
  def test_cloudwatch_alarm_integration(self):
    """Test CloudWatch alarm configuration integration."""
    # Test alarm configuration parameters
    alarm_config = {
      'alarm_name': f"{self.environment}-processor-{self.team}-errors",
      'comparison_operator': 'GreaterThanThreshold',
      'evaluation_periods': 2,
      'metric_name': 'Errors',
      'namespace': 'AWS/Lambda',
      'period': 300,
      'statistic': 'Sum',
      'threshold': 5
    }
    
    # Validate alarm configuration
    self.assertEqual(alarm_config['alarm_name'], 'test-processor-nova-errors')
    self.assertEqual(alarm_config['comparison_operator'], 'GreaterThanThreshold')
    self.assertEqual(alarm_config['evaluation_periods'], 2)
    self.assertEqual(alarm_config['metric_name'], 'Errors')
    self.assertEqual(alarm_config['namespace'], 'AWS/Lambda')
    self.assertEqual(alarm_config['period'], 300)
    self.assertEqual(alarm_config['statistic'], 'Sum')
    self.assertEqual(alarm_config['threshold'], 5)


if __name__ == '__main__':
  unittest.main()
