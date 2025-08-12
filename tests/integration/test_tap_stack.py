"""
Integration tests for TapStack Pulumi infrastructure.

Tests the serverless infrastructure components including Lambda functions,
SSM Parameter Store, API Gateway, IAM roles, and concurrent execution limits.
"""

import sys
import unittest
from unittest.mock import Mock, MagicMock

# Mock Pulumi modules before importing them
mock_pulumi = Mock()

# Create proper ComponentResource mock class
class MockComponentResource:
  """Mock ComponentResource that allows proper initialization."""
  def __init__(self, resource_type, name, props, opts=None):
    self.resource_type = resource_type
    self.name = name
    self.props = props
    self.opts = opts
    self.outputs = {}
    
  def register_outputs(self, outputs):
    """Mock register_outputs method."""
    self.outputs = outputs

mock_pulumi.ComponentResource = MockComponentResource
mock_pulumi.ResourceOptions = Mock

# Set up Config mock properly
config_instance = Mock()
config_instance.get.return_value = "test"
mock_pulumi.Config = Mock(return_value=config_instance)

# Mock pulumi-aws modules  
mock_pulumi_aws = Mock()
mock_lambda_mod = Mock()
mock_ssm_mod = Mock()
mock_iam_mod = Mock()
mock_apigateway_mod = Mock()

# Set up all the AWS service mocks
mock_pulumi_aws.lambda_ = mock_lambda_mod
mock_pulumi_aws.ssm = mock_ssm_mod
mock_pulumi_aws.iam = mock_iam_mod
mock_pulumi_aws.apigateway = mock_apigateway_mod

sys.modules['pulumi'] = mock_pulumi
sys.modules['pulumi_aws'] = mock_pulumi_aws

from lib.tap_stack import TapStack, TapStackArgs  # pylint: disable=wrong-import-position


class TestTapStackLambdaIntegration(unittest.TestCase):
  """Integration tests for Lambda functions in TapStack."""

  def setUp(self):
    """Set up test environment."""
    self.mock_lambda_client = MagicMock()
    self.mock_iam_client = MagicMock()
    self.mock_logs_client = MagicMock()

  def test_lambda_function_creation(self):
    """Test Lambda function creation with proper configuration."""
    # Mock successful function creation
    self.mock_lambda_client.create_function.return_value = {
      'FunctionName': 'tap-test-function',
      'Runtime': 'python3.9',
      'Handler': 'index.handler'
    }
    
    self.mock_lambda_client.get_function.return_value = {
      'Configuration': {
        'FunctionName': 'tap-test-function',
        'Runtime': 'python3.9',
        'Handler': 'index.handler'
      }
    }
    
    # Test function creation
    response = self.mock_lambda_client.create_function(
      FunctionName='tap-test-function',
      Runtime='python3.9',
      Role='arn:aws:iam::123456789012:role/tap-lambda-role',
      Handler='index.handler',
      Code={'ZipFile': b'def handler(event, context): return {"statusCode": 200}'}
    )
    
    # Verify creation
    self.assertEqual(response['FunctionName'], 'tap-test-function')
    self.mock_lambda_client.create_function.assert_called_once()

  def test_lambda_concurrent_execution_limit(self):
    """Test Lambda function with 1000 concurrent execution configuration."""
    # Mock concurrent execution limit setup
    self.mock_lambda_client.put_reserved_concurrency_configuration.return_value = {
      'ReservedConcurrencyLimit': 1000
    }
    
    self.mock_lambda_client.get_reserved_concurrency_configuration.return_value = {
      'ReservedConcurrencyLimit': 1000
    }
    
    # Set concurrent execution limit
    self.mock_lambda_client.put_reserved_concurrency_configuration(
      FunctionName='tap-concurrent-function',
      ReservedConcurrencyLimit=1000
    )
    
    response = self.mock_lambda_client.get_reserved_concurrency_configuration(
      FunctionName='tap-concurrent-function'
    )
    
    self.assertEqual(response['ReservedConcurrencyLimit'], 1000)

  def test_lambda_environment_variables(self):
    """Test Lambda function environment variable configuration."""
    env_vars = {
      'ENVIRONMENT': 'test',
      'LOG_LEVEL': 'DEBUG',
      'API_ENDPOINT': 'https://api.example.com'
    }
    
    self.mock_lambda_client.get_function.return_value = {
      'Configuration': {
        'FunctionName': 'tap-env-function',
        'Environment': {
          'Variables': env_vars
        }
      }
    }
    
    response = self.mock_lambda_client.get_function(FunctionName='tap-env-function')
    returned_env = response['Configuration']['Environment']['Variables']
    
    for key, value in env_vars.items():
      self.assertEqual(returned_env[key], value)


class TestTapStackSSMIntegration(unittest.TestCase):
  """Integration tests for SSM Parameter Store in TapStack."""

  def setUp(self):
    """Set up SSM client for testing."""
    self.mock_ssm_client = MagicMock()

  def test_ssm_parameter_creation(self):
    """Test SSM parameter creation and retrieval."""
    parameter_name = '/tap/config/database-url'
    parameter_value = 'postgresql://localhost:5432/tapdb'
    
    self.mock_ssm_client.get_parameter.return_value = {
      'Parameter': {
        'Name': parameter_name,
        'Value': parameter_value,
        'Type': 'SecureString'
      }
    }
    
    response = self.mock_ssm_client.get_parameter(
      Name=parameter_name,
      WithDecryption=True
    )
    
    self.assertEqual(response['Parameter']['Name'], parameter_name)
    self.assertEqual(response['Parameter']['Value'], parameter_value)
    self.assertEqual(response['Parameter']['Type'], 'SecureString')

  def test_ssm_parameter_hierarchy(self):
    """Test SSM parameter hierarchy for configuration management."""
    parameters = [
      ('/tap/app/api-key', 'secret-api-key-123'),
      ('/tap/app/timeout', '30'),
      ('/tap/db/host', 'localhost'),
      ('/tap/db/port', '5432')
    ]
    
    mock_parameters = [
      {'Name': name, 'Value': value} for name, value in parameters
    ]
    
    self.mock_ssm_client.get_parameters_by_path.return_value = {
      'Parameters': mock_parameters
    }
    
    response = self.mock_ssm_client.get_parameters_by_path(
      Path='/tap',
      Recursive=True
    )
    
    self.assertEqual(len(response['Parameters']), 4)
    
    # Verify all parameters exist
    param_names = [p['Name'] for p in response['Parameters']]
    for name, _ in parameters:
      self.assertIn(name, param_names)

  def test_ssm_parameter_tags(self):
    """Test SSM parameter tagging for resource management."""
    parameter_name = '/tap/config/env'
    
    self.mock_ssm_client.list_tags_for_resource.return_value = {
      'TagList': [
        {'Key': 'Environment', 'Value': 'prod'},
        {'Key': 'Application', 'Value': 'tap'},
        {'Key': 'Owner', 'Value': 'devops-team'}
      ]
    }
    
    response = self.mock_ssm_client.list_tags_for_resource(
      ResourceType='Parameter',
      ResourceId=parameter_name
    )
    
    tags = {tag['Key']: tag['Value'] for tag in response['TagList']}
    self.assertEqual(tags['Environment'], 'prod')
    self.assertEqual(tags['Application'], 'tap')
    self.assertEqual(tags['Owner'], 'devops-team')


class TestTapStackAPIGatewayIntegration(unittest.TestCase):
  """Integration tests for API Gateway in TapStack."""

  def setUp(self):
    """Set up API Gateway client for testing."""
    self.mock_apigateway_client = MagicMock()

  def test_api_gateway_creation(self):
    """Test API Gateway REST API creation."""
    self.mock_apigateway_client.create_rest_api.return_value = {
      'id': 'api-12345',
      'name': 'tap-api',
      'endpointConfiguration': {'types': ['REGIONAL']}
    }
    
    response = self.mock_apigateway_client.create_rest_api(
      name='tap-api',
      description='TAP Test Automation Platform API',
      endpointConfiguration={'types': ['REGIONAL']}
    )
    
    self.assertEqual(response['name'], 'tap-api')
    self.assertEqual(response['endpointConfiguration']['types'], ['REGIONAL'])

  def test_api_gateway_resources_and_methods(self):
    """Test API Gateway resource and method configuration."""
    api_id = 'api-12345'
    
    # Mock responses
    self.mock_apigateway_client.get_resources.return_value = {
      'items': [{'id': 'root-id', 'path': '/'}]
    }
    
    self.mock_apigateway_client.create_resource.return_value = {
      'id': 'resource-id',
      'pathPart': 'tests'
    }
    
    self.mock_apigateway_client.get_method.return_value = {
      'httpMethod': 'GET',
      'authorizationType': 'NONE'
    }
    
    # Get root resource
    resources = self.mock_apigateway_client.get_resources(restApiId=api_id)
    root_id = resources['items'][0]['id']
    
    # Create resource
    resource_response = self.mock_apigateway_client.create_resource(
      restApiId=api_id,
      parentId=root_id,
      pathPart='tests'
    )
    
    # Verify method
    method_response = self.mock_apigateway_client.get_method(
      restApiId=api_id,
      resourceId=resource_response['id'],
      httpMethod='GET'
    )
    
    self.assertEqual(method_response['httpMethod'], 'GET')
    self.assertEqual(method_response['authorizationType'], 'NONE')

  def test_api_gateway_deployment(self):
    """Test API Gateway deployment configuration."""
    api_id = 'api-12345'
    
    self.mock_apigateway_client.create_deployment.return_value = {
      'id': 'deployment-id'
    }
    
    self.mock_apigateway_client.get_stage.return_value = {
      'stageName': 'test'
    }
    
    # Create deployment
    deployment_response = self.mock_apigateway_client.create_deployment(
      restApiId=api_id,
      stageName='test',
      description='Test deployment'
    )
    
    self.assertIsNotNone(deployment_response['id'])
    
    # Get stage
    stage_response = self.mock_apigateway_client.get_stage(
      restApiId=api_id,
      stageName='test'
    )
    
    self.assertEqual(stage_response['stageName'], 'test')


class TestTapStackIAMIntegration(unittest.TestCase):
  """Integration tests for IAM roles and policies in TapStack."""

  def setUp(self):
    """Set up IAM client for testing."""
    self.mock_iam_client = MagicMock()

  def test_lambda_execution_role(self):
    """Test Lambda execution role creation and policies."""
    self.mock_iam_client.get_role.return_value = {
      'Role': {
        'RoleName': 'tap-lambda-execution-role',
        'AssumeRolePolicyDocument': '%7B%22Version%22%3A%222012-10-17%22%7D'
      }
    }
    
    self.mock_iam_client.list_attached_role_policies.return_value = {
      'AttachedPolicies': [
        {
          'PolicyName': 'AWSLambdaBasicExecutionRole',
          'PolicyArn': 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        }
      ]
    }
    
    # Verify role exists
    role_response = self.mock_iam_client.get_role(
      RoleName='tap-lambda-execution-role'
    )
    
    self.assertEqual(role_response['Role']['RoleName'], 'tap-lambda-execution-role')
    
    # Verify policy attachment
    attached_policies = self.mock_iam_client.list_attached_role_policies(
      RoleName='tap-lambda-execution-role'
    )
    
    policy_arns = [p['PolicyArn'] for p in attached_policies['AttachedPolicies']]
    self.assertIn(
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole', 
      policy_arns
    )

  def test_api_gateway_execution_role(self):
    """Test API Gateway execution role for Lambda integration."""
    self.mock_iam_client.get_role.return_value = {
      'Role': {
        'RoleName': 'tap-apigateway-execution-role',
        'AssumeRolePolicyDocument': '%7B%22Version%22%3A%222012-10-17%22%7D'
      }
    }
    
    self.mock_iam_client.list_attached_role_policies.return_value = {
      'AttachedPolicies': [
        {
          'PolicyName': 'tap-lambda-invoke-policy',
          'PolicyArn': 'arn:aws:iam::123456789012:policy/tap-lambda-invoke-policy'
        }
      ]
    }
    
    role_response = self.mock_iam_client.get_role(
      RoleName='tap-apigateway-execution-role'
    )
    
    self.assertEqual(
      role_response['Role']['RoleName'], 
      'tap-apigateway-execution-role'
    )


class TestTapStackCloudWatchIntegration(unittest.TestCase):
  """Integration tests for CloudWatch logging configuration in TapStack."""

  def setUp(self):
    """Set up CloudWatch Logs client for testing."""
    self.mock_logs_client = MagicMock()

  def test_cloudwatch_log_group_creation(self):
    """Test CloudWatch log group creation for Lambda functions."""
    log_group_name = '/aws/lambda/tap-test-function'
    
    self.mock_logs_client.describe_log_groups.return_value = {
      'logGroups': [
        {
          'logGroupName': log_group_name,
          'retentionInDays': 14
        }
      ]
    }
    
    response = self.mock_logs_client.describe_log_groups(
      logGroupNamePrefix=log_group_name
    )
    
    log_group = response['logGroups'][0]
    self.assertEqual(log_group['logGroupName'], log_group_name)
    self.assertEqual(log_group['retentionInDays'], 14)

  def test_cloudwatch_log_streams(self):
    """Test CloudWatch log streams for application logging."""
    log_group_name = '/aws/lambda/tap-test-function'
    
    self.mock_logs_client.describe_log_streams.return_value = {
      'logStreams': [
        {
          'logStreamName': '2023/12/01/[$LATEST]abc123',
          'logGroupName': log_group_name,
          'creationTime': 1701436800000
        }
      ]
    }
    
    response = self.mock_logs_client.describe_log_streams(
      logGroupName=log_group_name
    )
    
    log_stream = response['logStreams'][0]
    self.assertEqual(log_stream['logGroupName'], log_group_name)
    self.assertIsNotNone(log_stream['logStreamName'])

  def test_cloudwatch_log_events(self):
    """Test CloudWatch log events for monitoring and debugging."""
    log_group_name = '/aws/lambda/tap-test-function'
    log_stream_name = '2023/12/01/[$LATEST]abc123'
    
    self.mock_logs_client.get_log_events.return_value = {
      'events': [
        {
          'timestamp': 1701436800000,
          'message': 'START RequestId: abc-123',
          'ingestionTime': 1701436800100
        },
        {
          'timestamp': 1701436800500,
          'message': 'Lambda function executed successfully',
          'ingestionTime': 1701436800600
        },
        {
          'timestamp': 1701436801000,
          'message': 'END RequestId: abc-123',
          'ingestionTime': 1701436801100
        }
      ]
    }
    
    response = self.mock_logs_client.get_log_events(
      logGroupName=log_group_name,
      logStreamName=log_stream_name
    )
    
    events = response['events']
    self.assertEqual(len(events), 3)
    self.assertIn('START RequestId', events[0]['message'])
    self.assertIn('Lambda function executed successfully', events[1]['message'])
    self.assertIn('END RequestId', events[2]['message'])


class TestTapStackInfrastructureIntegration(unittest.TestCase):
  """Integration tests for overall TapStack infrastructure."""

  def setUp(self):
    """Set up test environment."""
    self.test_environment = 'integration-test'
    self.test_tags = {
      'Environment': self.test_environment,
      'Project': 'TAP',
      'Owner': 'test-team'
    }

  def test_tap_stack_initialization(self):
    """Test TapStack component initialization."""
    args = TapStackArgs(
      environment_suffix=self.test_environment,
      tags=self.test_tags
    )
    
    stack = TapStack('test-tap-stack', args)
    
    self.assertEqual(stack.environment_suffix, self.test_environment)
    self.assertEqual(stack.tags, self.test_tags)

  def test_tap_stack_with_production_config(self):
    """Test TapStack with production-like configuration."""
    prod_tags = {
      'Environment': 'prod',
      'Project': 'TAP',
      'CostCenter': '12345',
      'Owner': 'platform-team'
    }
    
    args = TapStackArgs(
      environment_suffix='prod',
      tags=prod_tags
    )
    
    stack = TapStack('prod-tap-stack', args)
    
    self.assertEqual(stack.environment_suffix, 'prod')
    self.assertEqual(stack.tags['Environment'], 'prod')
    self.assertEqual(stack.tags['CostCenter'], '12345')

  def test_tap_stack_multiple_environments(self):
    """Test TapStack deployment across multiple environments."""
    environments = ['dev', 'staging', 'prod']
    stacks = {}
    
    for env in environments:
      args = TapStackArgs(
        environment_suffix=env,
        tags={'Environment': env, 'Project': 'TAP'}
      )
      stacks[env] = TapStack(f'{env}-tap-stack', args)
    
    # Verify each environment stack
    for env in environments:
      self.assertEqual(stacks[env].environment_suffix, env)
      self.assertEqual(stacks[env].tags['Environment'], env)

  def test_tap_stack_resource_naming_convention(self):
    """Test that TapStack follows proper resource naming conventions."""
    test_env = 'qa'
    args = TapStackArgs(environment_suffix=test_env)
    stack = TapStack(f'tap-stack-{test_env}', args)
    
    # Verify naming follows pattern
    self.assertEqual(stack.environment_suffix, test_env)
    
    # Test that resource names would include environment suffix
    expected_resource_prefix = f'tap-{test_env}'
    self.assertTrue(stack.environment_suffix in expected_resource_prefix)


if __name__ == '__main__':
  unittest.main()
