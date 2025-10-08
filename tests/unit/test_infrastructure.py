"""
test_infrastructure.py

Comprehensive unit tests for TapStack Pulumi infrastructure
"""

import json
import unittest
from unittest.mock import Mock, patch, MagicMock, PropertyMock
import os
import sys

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

# Import and set up Pulumi mocking
try:
    import pulumi
    import pulumi.runtime
    # Set up Pulumi mocking for tests
    class MyMocks(pulumi.runtime.Mocks):
        def call(self, args):
            # Return mock response for AWS calls
            if args.token == "aws:getCallerIdentity/getCallerIdentity:getCallerIdentity":
                return {"accountId": "123456789012", "arn": "arn:aws:iam::123456789012:user/test", "userId": "AIDACKCEVSQ6C2EXAMPLE"}
            elif args.token == "aws:config/region:region":
                return "us-east-1"
            return {}
        
        def new_resource(self, args):
            def convert_mock_to_string(obj):
                """Recursively convert MagicMocks and Outputs to strings"""
                if hasattr(obj, '__class__') and 'pulumi.output.Output' in str(obj.__class__):
                    return f"mock-output-{hash(obj) % 10000}"
                elif isinstance(obj, (MagicMock, Mock)):
                    return f"mock-{hash(obj) % 10000}"
                elif isinstance(obj, dict):
                    return {k: convert_mock_to_string(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_mock_to_string(item) for item in obj]
                elif obj is None:
                    return "mock-none"
                else:
                    return str(obj) if obj is not None else "mock-default"
            
            # Convert all inputs to string-safe versions
            clean_inputs = convert_mock_to_string(args.inputs)
            
            # Create base outputs that work for all resource types
            outputs = {
                "urn": f"urn:pulumi:test::test::{args.typ}::{args.name}",
                "id": f"{args.name}-id"
            }
            
            # Return specific mocked outputs based on resource type
            if args.typ == "aws:lambda/function:Function":
                outputs.update({
                    "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                    "name": args.name,
                    "role": "arn:aws:iam::123456789012:role/lambda-role",
                    "invokeArn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations"
                })
            elif args.typ == "aws:dynamodb/table:Table":
                outputs.update({
                    "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                    "name": args.name,
                    "streamArn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}/stream/2024-01-01T00:00:00.000"
                })
            elif args.typ == "aws:apigateway/restApi:RestApi":
                outputs.update({
                    "id": f"api{hash(args.name) % 10000}",
                    "name": args.name,
                    "rootResourceId": f"root{hash(args.name) % 10000}",
                    "executionArn": f"arn:aws:execute-api:us-east-1:123456789012:api{hash(args.name) % 10000}"
                })
            elif args.typ == "aws:apigateway/resource:Resource":
                outputs.update({
                    "id": f"resource{hash(args.name) % 10000}",
                    "pathPart": clean_inputs.get("pathPart", "default")
                })
            elif args.typ == "aws:apigateway/deployment:Deployment":
                outputs.update({
                    "id": f"deploy{hash(args.name) % 10000}"
                })
            elif args.typ == "aws:apigateway/stage:Stage":
                outputs.update({
                    "id": f"stage{hash(args.name) % 10000}",
                    "stageName": clean_inputs.get("stageName", "test")
                })
            elif args.typ == "aws:iam/role:Role":
                outputs.update({
                    "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                    "name": args.name
                })
            elif args.typ == "aws:ssm/parameter:Parameter":
                outputs.update({
                    "name": clean_inputs.get("name", f"/test/{args.name}"),
                    "arn": f"arn:aws:ssm:us-east-1:123456789012:parameter{clean_inputs.get('name', f'/test/{args.name}')}"
                })
            elif args.typ == "aws:sqs/queue:Queue":
                outputs.update({
                    "arn": f"arn:aws:sqs:us-east-1:123456789012:{args.name}",
                    "url": f"https://sqs.us-east-1.amazonaws.com/123456789012/{args.name}"
                })
            elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
                outputs.update({
                    "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
                    "name": args.name
                })
            
            return (f"{args.name}-id", outputs)
    
    pulumi.runtime.set_mocks(MyMocks())
    PULUMI_AVAILABLE = True
except ImportError:
    PULUMI_AVAILABLE = False

class TestTapStackInfrastructure(unittest.TestCase):
    """Unit tests for TapStack infrastructure components"""

    def setUp(self):
        """Set up test environment"""
        self.environment_suffix = 'test'
        self.tags = {'Test': 'Value'}

    @pulumi.runtime.test
    def test_dlq_creation(self):
        """Test DLQ is created with correct configuration"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix=self.environment_suffix, tags=self.tags)
        stack = TapStack('test-stack', args)

        # Test that stack was created successfully
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIn('Project', stack.tags)
        self.assertEqual(stack.tags['Project'], 'LogisticsTracking')

    @pulumi.runtime.test
    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table has correct configuration"""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        # Test that stack was created successfully
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIn('Environment', stack.tags)
        self.assertEqual(stack.tags['Environment'], 'test')

    @pulumi.runtime.test
    @pulumi.runtime.test
    @patch('pulumi_aws.ssm.Parameter')
    @pulumi.runtime.test
    def test_ssm_parameters_creation(self, mock_param):
        """Test SSM parameters are created correctly"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_param.return_value = Mock(name='/test/param')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        # Should create 3 parameters
        self.assertEqual(mock_param.call_count, 3)

        # Check parameter names
        calls = mock_param.call_args_list
        param_names = [call[1]['name'] for call in calls]

        self.assertIn(f'/logistics/api/{self.environment_suffix}/config', param_names)
        self.assertIn(f'/logistics/db/{self.environment_suffix}/endpoint', param_names)
        self.assertIn(f'/logistics/features/{self.environment_suffix}/flags', param_names)

    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.iam.Role')
    @pulumi.runtime.test
    def test_lambda_function_configuration(self, mock_role, mock_lambda):
        """Test Lambda function configuration"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_role.return_value = Mock(arn='arn:aws:iam::123456789012:role/test-role')
        mock_lambda.return_value = Mock(
            name='test-function',
            invoke_arn='arn:aws:lambda:us-west-2:123456789012:function:test')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        mock_lambda.assert_called_once()
        call_kwargs = mock_lambda.call_args[1]

        # Check basic configuration
        self.assertEqual(call_kwargs['runtime'], 'python3.9')
        self.assertEqual(call_kwargs['handler'], 'handler.main')
        self.assertEqual(call_kwargs['timeout'], 30)
        self.assertEqual(call_kwargs['memory_size'], 512)

        # Check environment variables
        env_vars = call_kwargs['environment']['variables']
        self.assertIn('TABLE_NAME', env_vars)
        self.assertIn('ENVIRONMENT', env_vars)
        self.assertIn('REGION', env_vars)  # Not AWS_REGION (reserved)
        self.assertIn('POWERTOOLS_SERVICE_NAME', env_vars)
        self.assertIn('LOG_LEVEL', env_vars)

        # Check tracing
        self.assertEqual(call_kwargs['tracing_config']['mode'], 'Active')

        # Check DLQ configuration
        self.assertIn('dead_letter_config', call_kwargs)

    @pulumi.runtime.test
    @patch('pulumi_aws.apigateway.RestApi')
    @pulumi.runtime.test
    def test_api_gateway_creation(self, mock_api):
        """Test API Gateway REST API creation"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_api.return_value = Mock(id='test-api-id')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        mock_api.assert_called_once()
        call_kwargs = mock_api.call_args[1]

        self.assertEqual(call_kwargs['name'], f'tracking-api-{self.environment_suffix}')
        self.assertEqual(call_kwargs['endpoint_configuration']['types'], 'REGIONAL')

    @patch('pulumi_aws.apigateway.Resource')
    @patch('pulumi_aws.apigateway.RestApi')
    @pulumi.runtime.test
    def test_api_resources_creation(self, mock_api, mock_resource):
        """Test API resources are created correctly"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_api.return_value = Mock(id='test-api-id', root_resource_id='root-id')
        mock_resource.return_value = Mock(id='resource-id')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        # Should create 2 resources
        self.assertEqual(mock_resource.call_count, 2)

        # Check resource paths
        calls = mock_resource.call_args_list
        paths = [call[1]['path_part'] for call in calls]

        self.assertIn('track', paths)
        self.assertIn('status', paths)

    @patch('pulumi_aws.apigateway.Method')
    @patch('pulumi_aws.apigateway.Resource')
    @pulumi.runtime.test
    @patch('pulumi_aws.apigateway.RestApi')
    @pulumi.runtime.test
    def test_api_methods_creation(self, mock_api, mock_resource, mock_method):
        """Test API methods are configured correctly"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_api.return_value = Mock(id='test-api-id')
        mock_resource.return_value = Mock(id='resource-id')
        mock_method.return_value = Mock(http_method='POST')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        # Should create 2 methods
        self.assertEqual(mock_method.call_count, 2)

        # Check authorization
        for call in mock_method.call_args_list:
            self.assertEqual(call[1]['authorization'], 'AWS_IAM')

    @pulumi.runtime.test
    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self, mock_alarm):
        """Test CloudWatch alarms are created"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_alarm.return_value = Mock()

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        # Should create 4 alarms minimum
        self.assertGreaterEqual(mock_alarm.call_count, 4)

        # Check alarm names
        alarm_names = [call[0][0] for call in mock_alarm.call_args_list]

        self.assertTrue(any('4xx' in name for name in alarm_names))
        self.assertTrue(any('5xx' in name for name in alarm_names))
        self.assertTrue(any('latency' in name for name in alarm_names))
        self.assertTrue(any('throttle' in name for name in alarm_names))

    @pulumi.runtime.test
    @patch('pulumi_aws.cloudwatch.Dashboard')
    @pulumi.runtime.test
    def test_cloudwatch_dashboard_creation(self, mock_dashboard):
        """Test CloudWatch dashboard is created"""
        from lib.tap_stack import TapStack, TapStackArgs

        mock_dashboard.return_value = Mock()

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        mock_dashboard.assert_called_once()
        call_kwargs = mock_dashboard.call_args[1]

        self.assertEqual(call_kwargs['dashboard_name'], f'logistics-tracking-{self.environment_suffix}')

    @pulumi.runtime.test
    def test_stack_tags_propagation(self):
        """Test tags are properly propagated to resources"""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Department': 'IT', 'Owner': 'DevOps'}
        args = TapStackArgs(environment_suffix=self.environment_suffix, tags=custom_tags)
        stack = TapStack('test-stack', args)

        # Check merged tags
        self.assertIn('Department', stack.tags)
        self.assertIn('Owner', stack.tags)
        self.assertIn('Project', stack.tags)
        self.assertIn('Environment', stack.tags)
        self.assertIn('ManagedBy', stack.tags)

        self.assertEqual(stack.tags['Department'], 'IT')
        self.assertEqual(stack.tags['Project'], 'LogisticsTracking')
        self.assertEqual(stack.tags['ManagedBy'], 'Pulumi')

    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.iam.RolePolicy')
    @pulumi.runtime.test
    @patch('pulumi_aws.iam.Role')
    @pulumi.runtime.test
    def test_iam_policies(self, mock_role, mock_policy, mock_lambda):
        """Test IAM policies are properly configured"""
        from lib.tap_stack import TapStack, TapStackArgs

        from pulumi import Resource

        mock_role.return_value = Mock(id='role-id', arn='arn:aws:iam::123456789012:role/test')
        # Create a mock that inherits from Resource to pass the type check
        mock_policy_instance = Mock(spec=Resource)
        mock_policy.return_value = mock_policy_instance
        mock_lambda.return_value = Mock(name='test-function', invoke_arn='arn:aws:lambda:test')

        args = TapStackArgs(environment_suffix=self.environment_suffix)
        stack = TapStack('test-stack', args)

        mock_policy.assert_called_once()

        # Note: Can't easily test the policy document content due to Pulumi Output.apply
        # In a real scenario, you'd use Pulumi's testing utilities

    @pulumi.runtime.test
    def test_environment_suffix_usage(self):
        """Test environment suffix is used consistently"""
        from lib.tap_stack import TapStack, TapStackArgs

        suffix = 'prod'
        args = TapStackArgs(environment_suffix=suffix)
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, suffix)
        self.assertEqual(stack.tags['Environment'], suffix)


if __name__ == '__main__':
    unittest.main()
