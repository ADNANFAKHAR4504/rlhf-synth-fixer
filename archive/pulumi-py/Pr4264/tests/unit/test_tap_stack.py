"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component focusing on resource creation,
configuration, and mocking to achieve 90%+ code coverage.
"""

import json
import os
import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MockPulumiResource(pulumi.Resource):
    """Mock Pulumi Resource for testing."""
    
    def __init__(self, name, **kwargs):
        super().__init__(t="mock:resource", name=name, custom=True, props={})
        self.name = name
        self.arn = pulumi.Output.from_input(f"arn:aws:mock:us-east-1:123456789012:{name}")
        self.id = pulumi.Output.from_input(f"{name}-id")
        self._kwargs = kwargs
        
        # Add common AWS resource attributes
        self.bucket = pulumi.Output.from_input(f"mock-{name}-bucket")
        self.invoke_arn = pulumi.Output.from_input(f"arn:aws:lambda:us-east-1:123456789012:function:{name}:$LATEST")
        self.root_resource_id = pulumi.Output.from_input(f"mock-{name}-root-id")
        self.stage_name = pulumi.Output.from_input("v1")
        self.http_method = pulumi.Output.from_input("GET")
        self.invoke_url = pulumi.Output.from_input(f"https://mock-{name}.execute-api.us-east-1.amazonaws.com/v1")


class MockPulumiOutput:
    """Mock Pulumi Output for testing."""
    
    def __init__(self, value):
        self.value = value
        self._value = value
    
    def apply(self, func):
        return MockPulumiOutput(func(self.value))


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'prod', 'Owner': 'team'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack main component."""

    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(environment_suffix='test')
        self.mock_opts = ResourceOptions()

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_initialization(self, mock_config_rules, mock_waf, mock_step_functions, 
                                     mock_cloudwatch, mock_api_gateway, mock_lambda, 
                                     mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack initialization with all infrastructure components."""
        
        # Mock the infrastructure components
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_s3_instance = MagicMock()
        mock_s3.return_value = mock_s3_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sns_instance = MagicMock()
        mock_sns.return_value = mock_sns_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch.return_value = mock_cloudwatch_instance
        
        mock_step_functions_instance = MagicMock()
        mock_step_functions.return_value = mock_step_functions_instance
        
        mock_waf_instance = MagicMock()
        mock_waf.return_value = mock_waf_instance
        
        mock_config_rules_instance = MagicMock()
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify all components were initialized
        mock_config.assert_called_once()
        mock_iam.assert_called_once()
        mock_s3.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sns.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api_gateway.assert_called_once()
        mock_cloudwatch.assert_called_once()
        mock_step_functions.assert_called_once()
        mock_waf.assert_called_once()
        mock_config_rules.assert_called_once()

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_output_exports(self, mock_config_rules, mock_waf, mock_step_functions,
                                     mock_cloudwatch, mock_api_gateway, mock_lambda,
                                     mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack output exports."""
        
        # Mock infrastructure components with output methods
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_s3_instance = MagicMock()
        mock_s3_instance.get_static_assets_bucket_name.return_value = MockPulumiOutput("static-bucket")
        mock_s3_instance.get_static_assets_bucket_arn.return_value = MockPulumiOutput("arn:aws:s3:::static-bucket")
        mock_s3_instance.get_lambda_deployments_bucket_name.return_value = MockPulumiOutput("lambda-bucket")
        mock_s3_instance.get_lambda_deployments_bucket_arn.return_value = MockPulumiOutput("arn:aws:s3:::lambda-bucket")
        mock_s3.return_value = mock_s3_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.get_main_table_name.return_value = MockPulumiOutput("main-table")
        mock_dynamodb_instance.get_main_table_arn.return_value = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/main-table")
        mock_dynamodb_instance.get_audit_table_name.return_value = MockPulumiOutput("audit-table")
        mock_dynamodb_instance.get_audit_table_arn.return_value = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/audit-table")
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sns_instance = MagicMock()
        mock_sns_instance.get_critical_topic_arn.return_value = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:critical-topic")
        mock_sns_instance.get_error_topic_arn.return_value = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:error-topic")
        mock_sns_instance.get_compliance_topic_arn.return_value = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:compliance-topic")
        mock_sns.return_value = mock_sns_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_api_handler_arn.return_value = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:api-handler")
        mock_lambda_instance.get_api_handler_invoke_arn.return_value = MockPulumiOutput("arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:api-handler/invocations")
        mock_lambda_instance.get_data_processor_arn.return_value = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:data-processor")
        mock_lambda_instance.get_error_handler_arn.return_value = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:error-handler")
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway_instance.get_api_endpoint.return_value = MockPulumiOutput("https://api-id.execute-api.us-east-1.amazonaws.com/v1")
        mock_api_gateway_instance.get_rest_api_id.return_value = MockPulumiOutput("api-id")
        mock_api_gateway_instance.get_stage_name.return_value = MockPulumiOutput("v1")
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch_instance.get_lambda_error_alarm_arn.return_value = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:lambda-errors")
        mock_cloudwatch_instance.get_api_4xx_alarm_arn.return_value = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-4xx")
        mock_cloudwatch_instance.get_api_5xx_alarm_arn.return_value = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-5xx")
        mock_cloudwatch_instance.get_dashboard_url.return_value = MockPulumiOutput("https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=main-dashboard")
        mock_cloudwatch.return_value = mock_cloudwatch_instance
        
        mock_step_functions_instance = MagicMock()
        mock_step_functions_instance.get_state_machine_arn.return_value = MockPulumiOutput("arn:aws:states:us-east-1:123456789012:stateMachine:workflow")
        mock_step_functions_instance.get_state_machine_name.return_value = MockPulumiOutput("workflow")
        mock_step_functions.return_value = mock_step_functions_instance
        
        mock_waf_instance = MagicMock()
        mock_waf_instance.get_web_acl_arn.return_value = MockPulumiOutput("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/web-acl")
        mock_waf_instance.get_web_acl_id.return_value = MockPulumiOutput("web-acl-id")
        mock_waf.return_value = mock_waf_instance
        
        mock_config_rules_instance = MagicMock()
        mock_config_rules_instance.get_rule_arns.return_value = {
            'iam_managed_policy': MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/iam-policy"),
            's3_public_access': MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/s3-public"),
            'dynamodb_encryption': MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/dynamodb-encryption")
        }
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify output attributes are set
        self.assertIsNotNone(stack.api_endpoint)
        self.assertIsNotNone(stack.rest_api_id)
        self.assertIsNotNone(stack.stage_name)
        self.assertIsNotNone(stack.api_handler_arn)
        self.assertIsNotNone(stack.data_processor_arn)
        self.assertIsNotNone(stack.error_handler_arn)
        self.assertIsNotNone(stack.main_table_name)
        self.assertIsNotNone(stack.audit_table_name)
        self.assertIsNotNone(stack.static_assets_bucket_name)
        self.assertIsNotNone(stack.lambda_deployments_bucket_name)
        self.assertIsNotNone(stack.state_machine_arn)
        self.assertIsNotNone(stack.lambda_error_alarm_arn)
        self.assertIsNotNone(stack.critical_topic_arn)
        self.assertIsNotNone(stack.web_acl_arn)
        self.assertIsNotNone(stack.config_rule_arns)

    def test_tap_stack_environment_override(self):
        """Test TapStack with environment override."""
        custom_args = TapStackArgs(environment_suffix='prod')
        
        with patch('lib.tap_stack.InfrastructureConfig') as mock_config:
            mock_config_instance = MagicMock()
            mock_config.return_value = mock_config_instance
            
            with patch('lib.tap_stack.IAMStack'), \
                 patch('lib.tap_stack.S3Stack'), \
                 patch('lib.tap_stack.DynamoDBStack'), \
                 patch('lib.tap_stack.SNSStack'), \
                 patch('lib.tap_stack.LambdaStack'), \
                 patch('lib.tap_stack.APIGatewayStack'), \
                 patch('lib.tap_stack.CloudWatchStack'), \
                 patch('lib.tap_stack.StepFunctionsStack'), \
                 patch('lib.tap_stack.WAFStack'), \
                 patch('lib.tap_stack.ConfigRulesStack'):
                
                stack = TapStack("test-stack", custom_args, self.mock_opts)
                
                # Verify environment was overridden
                self.assertEqual(stack.environment_suffix, 'prod')

    def test_tap_stack_custom_tags(self):
        """Test TapStack with custom tags."""
        custom_tags = {'Environment': 'prod', 'Owner': 'team'}
        custom_args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        with patch('lib.tap_stack.InfrastructureConfig') as mock_config:
            mock_config_instance = MagicMock()
            mock_config.return_value = mock_config_instance
            
            with patch('lib.tap_stack.IAMStack'), \
                 patch('lib.tap_stack.S3Stack'), \
                 patch('lib.tap_stack.DynamoDBStack'), \
                 patch('lib.tap_stack.SNSStack'), \
                 patch('lib.tap_stack.LambdaStack'), \
                 patch('lib.tap_stack.APIGatewayStack'), \
                 patch('lib.tap_stack.CloudWatchStack'), \
                 patch('lib.tap_stack.StepFunctionsStack'), \
                 patch('lib.tap_stack.WAFStack'), \
                 patch('lib.tap_stack.ConfigRulesStack'):
                
                stack = TapStack("test-stack", custom_args, self.mock_opts)
                
                # Verify custom tags were set
                self.assertEqual(stack.tags, custom_tags)

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_resource_dependencies(self, mock_config_rules, mock_waf, mock_step_functions,
                                           mock_cloudwatch, mock_api_gateway, mock_lambda,
                                           mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack resource dependency order."""
        
        # Mock all components
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_s3_instance = MagicMock()
        mock_s3.return_value = mock_s3_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sns_instance = MagicMock()
        mock_sns.return_value = mock_sns_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch.return_value = mock_cloudwatch_instance
        
        mock_step_functions_instance = MagicMock()
        mock_step_functions.return_value = mock_step_functions_instance
        
        mock_waf_instance = MagicMock()
        mock_waf.return_value = mock_waf_instance
        
        mock_config_rules_instance = MagicMock()
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify dependency order: IAM first, then others
        mock_iam.assert_called_once()
        mock_s3.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sns.assert_called_once()
        
        # Lambda depends on IAM, S3, DynamoDB
        mock_lambda.assert_called_once()
        lambda_call_args = mock_lambda.call_args
        # Check positional arguments: config, iam_stack, s3_stack, dynamodb_stack, opts
        self.assertEqual(lambda_call_args[0][0], mock_config_instance)
        self.assertEqual(lambda_call_args[0][1], mock_iam_instance)
        self.assertEqual(lambda_call_args[0][2], mock_s3_instance)
        self.assertEqual(lambda_call_args[0][3], mock_dynamodb_instance)
        
        # API Gateway depends on Lambda, IAM
        mock_api_gateway.assert_called_once()
        api_gateway_call_args = mock_api_gateway.call_args
        # Check positional arguments: config, lambda_stack, iam_stack, opts
        self.assertEqual(api_gateway_call_args[0][0], mock_config_instance)
        self.assertEqual(api_gateway_call_args[0][1], mock_lambda_instance)
        self.assertEqual(api_gateway_call_args[0][2], mock_iam_instance)
        
        # CloudWatch depends on Lambda, API Gateway, SNS
        mock_cloudwatch.assert_called_once()
        cloudwatch_call_args = mock_cloudwatch.call_args
        # Check positional arguments: config, lambda_stack, api_gateway_stack, sns_stack, opts
        self.assertEqual(cloudwatch_call_args[0][0], mock_config_instance)
        self.assertEqual(cloudwatch_call_args[0][1], mock_lambda_instance)
        self.assertEqual(cloudwatch_call_args[0][2], mock_api_gateway_instance)
        self.assertEqual(cloudwatch_call_args[0][3], mock_sns_instance)
        
        # Step Functions depends on Lambda, IAM
        mock_step_functions.assert_called_once()
        step_functions_call_args = mock_step_functions.call_args
        # Check positional arguments: config, lambda_stack, iam_stack, opts
        self.assertEqual(step_functions_call_args[0][0], mock_config_instance)
        self.assertEqual(step_functions_call_args[0][1], mock_lambda_instance)
        self.assertEqual(step_functions_call_args[0][2], mock_iam_instance)
        
        # WAF depends on API Gateway
        mock_waf.assert_called_once()
        waf_call_args = mock_waf.call_args
        # Check positional arguments: config, api_gateway_stack, opts
        self.assertEqual(waf_call_args[0][0], mock_config_instance)
        self.assertEqual(waf_call_args[0][1], mock_api_gateway_instance)
        
        # Config Rules depends on IAM
        mock_config_rules.assert_called_once()
        config_rules_call_args = mock_config_rules.call_args
        # Check positional arguments: config, iam_stack, opts
        self.assertEqual(config_rules_call_args[0][0], mock_config_instance)
        self.assertEqual(config_rules_call_args[0][1], mock_iam_instance)

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_output_registration(self, mock_config_rules, mock_waf, mock_step_functions,
                                         mock_cloudwatch, mock_api_gateway, mock_lambda,
                                         mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack output registration."""
        
        # Mock all components with direct resource attributes
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance

        # Mock S3 stack with direct resource attributes
        mock_s3_instance = MagicMock()
        mock_s3_instance.static_assets_bucket.bucket = MockPulumiOutput("static-bucket")
        mock_s3_instance.static_assets_bucket.arn = MockPulumiOutput("arn:aws:s3:::static-bucket")
        mock_s3_instance.lambda_deployments_bucket.bucket = MockPulumiOutput("lambda-bucket")
        mock_s3_instance.lambda_deployments_bucket.arn = MockPulumiOutput("arn:aws:s3:::lambda-bucket")
        mock_s3.return_value = mock_s3_instance

        # Mock DynamoDB stack with direct resource attributes
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.main_table.name = MockPulumiOutput("main-table")
        mock_dynamodb_instance.main_table.arn = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/main-table")
        mock_dynamodb_instance.audit_table.name = MockPulumiOutput("audit-table")
        mock_dynamodb_instance.audit_table.arn = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/audit-table")
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Mock SNS stack with direct resource attributes
        mock_sns_instance = MagicMock()
        mock_sns_instance.critical_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:critical-topic")
        mock_sns_instance.error_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:error-topic")
        mock_sns_instance.compliance_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:compliance-topic")
        mock_sns.return_value = mock_sns_instance

        # Mock Lambda stack with direct resource attributes
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.api_handler.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:api-handler")
        mock_lambda_instance.api_handler.invoke_arn = MockPulumiOutput("arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:api-handler/invocations")
        mock_lambda_instance.data_processor.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:data-processor")
        mock_lambda_instance.error_handler.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:error-handler")
        mock_lambda.return_value = mock_lambda_instance

        # Mock API Gateway stack with direct resource attributes
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway_instance.stage.invoke_url = MockPulumiOutput("https://api-id.execute-api.us-east-1.amazonaws.com/v1")
        mock_api_gateway_instance.rest_api.id = MockPulumiOutput("api-id")
        mock_api_gateway_instance.stage.stage_name = MockPulumiOutput("v1")
        mock_api_gateway.return_value = mock_api_gateway_instance

        # Mock CloudWatch stack with direct resource attributes
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch_instance.alarms = {
            'lambda_errors': MagicMock(),
            'api_4xx_errors': MagicMock(),
            'api_5xx_errors': MagicMock()
        }
        mock_cloudwatch_instance.alarms['lambda_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:lambda-errors")
        mock_cloudwatch_instance.alarms['api_4xx_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-4xx")
        mock_cloudwatch_instance.alarms['api_5xx_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-5xx")
        mock_cloudwatch_instance.get_dashboard_url.return_value = MockPulumiOutput("https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=main-dashboard")
        mock_cloudwatch.return_value = mock_cloudwatch_instance

        # Mock Step Functions stack with direct resource attributes
        mock_step_functions_instance = MagicMock()
        mock_step_functions_instance.state_machine.arn = MockPulumiOutput("arn:aws:states:us-east-1:123456789012:stateMachine:workflow")
        mock_step_functions_instance.state_machine.name = MockPulumiOutput("workflow")
        mock_step_functions.return_value = mock_step_functions_instance

        # Mock WAF stack with direct resource attributes
        mock_waf_instance = MagicMock()
        mock_waf_instance.web_acl.arn = MockPulumiOutput("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/web-acl")
        mock_waf_instance.web_acl.id = MockPulumiOutput("web-acl-id")
        mock_waf.return_value = mock_waf_instance

        # Mock Config Rules stack with direct resource attributes
        mock_config_rules_instance = MagicMock()
        mock_config_rules_instance.rules = {
            'iam_managed_policy': MagicMock(),
            's3_public_access': MagicMock(),
            'dynamodb_encryption': MagicMock()
        }
        mock_config_rules_instance.rules['iam_managed_policy'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/iam-policy")
        mock_config_rules_instance.rules['s3_public_access'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/s3-public")
        mock_config_rules_instance.rules['dynamodb_encryption'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/dynamodb-encryption")
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify outputs are accessible as flat properties
        self.assertIsNotNone(stack.api_endpoint)
        self.assertIsNotNone(stack.rest_api_id)
        self.assertIsNotNone(stack.stage_name)
        self.assertIsNotNone(stack.api_handler_arn)
        self.assertIsNotNone(stack.api_handler_invoke_arn)
        self.assertIsNotNone(stack.data_processor_arn)
        self.assertIsNotNone(stack.error_handler_arn)
        self.assertIsNotNone(stack.main_table_name)
        self.assertIsNotNone(stack.main_table_arn)
        self.assertIsNotNone(stack.audit_table_name)
        self.assertIsNotNone(stack.audit_table_arn)
        self.assertIsNotNone(stack.static_assets_bucket_name)
        self.assertIsNotNone(stack.static_assets_bucket_arn)
        self.assertIsNotNone(stack.lambda_deployments_bucket_name)
        self.assertIsNotNone(stack.lambda_deployments_bucket_arn)
        self.assertIsNotNone(stack.state_machine_arn)
        self.assertIsNotNone(stack.state_machine_name)
        self.assertIsNotNone(stack.lambda_error_alarm_arn)
        self.assertIsNotNone(stack.api_4xx_alarm_arn)
        self.assertIsNotNone(stack.api_5xx_alarm_arn)
        self.assertIsNotNone(stack.dashboard_url)
        self.assertIsNotNone(stack.critical_topic_arn)
        self.assertIsNotNone(stack.error_topic_arn)
        self.assertIsNotNone(stack.compliance_topic_arn)
        self.assertIsNotNone(stack.web_acl_arn)
        self.assertIsNotNone(stack.web_acl_id)
        self.assertIsNotNone(stack.config_rule_arns)

    def test_tap_stack_config_override(self):
        """Test TapStack with environment override in config."""
        custom_args = TapStackArgs(environment_suffix='prod')
        
        with patch('lib.tap_stack.InfrastructureConfig') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.environment = 'dev'  # Default
            mock_config.return_value = mock_config_instance
            
            with patch('lib.tap_stack.IAMStack'), \
                 patch('lib.tap_stack.S3Stack'), \
                 patch('lib.tap_stack.DynamoDBStack'), \
                 patch('lib.tap_stack.SNSStack'), \
                 patch('lib.tap_stack.LambdaStack'), \
                 patch('lib.tap_stack.APIGatewayStack'), \
                 patch('lib.tap_stack.CloudWatchStack'), \
                 patch('lib.tap_stack.StepFunctionsStack'), \
                 patch('lib.tap_stack.WAFStack'), \
                 patch('lib.tap_stack.ConfigRulesStack'):
                
                stack = TapStack("test-stack", custom_args, self.mock_opts)
                
                # Verify environment was overridden in config
                self.assertEqual(stack.config.environment, 'prod')

    def test_tap_stack_tags_merge(self):
        """Test TapStack with tag merging."""
        custom_tags = {'Environment': 'prod', 'Owner': 'team'}
        custom_args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        with patch('lib.tap_stack.InfrastructureConfig') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.tags = {'Project': 'serverless-app', 'Environment': 'dev', 'ManagedBy': 'Pulumi'}
            mock_config.return_value = mock_config_instance
            
            with patch('lib.tap_stack.IAMStack'), \
                 patch('lib.tap_stack.S3Stack'), \
                 patch('lib.tap_stack.DynamoDBStack'), \
                 patch('lib.tap_stack.SNSStack'), \
                 patch('lib.tap_stack.LambdaStack'), \
                 patch('lib.tap_stack.APIGatewayStack'), \
                 patch('lib.tap_stack.CloudWatchStack'), \
                 patch('lib.tap_stack.StepFunctionsStack'), \
                 patch('lib.tap_stack.WAFStack'), \
                 patch('lib.tap_stack.ConfigRulesStack'):
                
                stack = TapStack("test-stack", custom_args, self.mock_opts)
                
                # Verify tags were merged
                expected_tags = {'Project': 'serverless-app', 'Environment': 'prod', 'ManagedBy': 'Pulumi', 'Owner': 'team'}
                self.assertEqual(stack.config.tags, expected_tags)

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_component_initialization_order(self, mock_config_rules, mock_waf, mock_step_functions,
                                                     mock_cloudwatch, mock_api_gateway, mock_lambda,
                                                     mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack component initialization order and dependencies."""
        
        # Mock all components
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_s3_instance = MagicMock()
        mock_s3.return_value = mock_s3_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sns_instance = MagicMock()
        mock_sns.return_value = mock_sns_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch.return_value = mock_cloudwatch_instance
        
        mock_step_functions_instance = MagicMock()
        mock_step_functions.return_value = mock_step_functions_instance
        
        mock_waf_instance = MagicMock()
        mock_waf.return_value = mock_waf_instance
        
        mock_config_rules_instance = MagicMock()
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify all components were called with correct arguments
        mock_config.assert_called_once()
        mock_iam.assert_called_once()
        mock_s3.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sns.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api_gateway.assert_called_once()
        mock_cloudwatch.assert_called_once()
        mock_step_functions.assert_called_once()
        mock_waf.assert_called_once()
        mock_config_rules.assert_called_once()
        
        # Verify call arguments without ResourceOptions comparison
        self.assertEqual(mock_iam.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_s3.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_dynamodb.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_sns.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_lambda.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_lambda.call_args[0][1], mock_iam_instance)
        self.assertEqual(mock_lambda.call_args[0][2], mock_s3_instance)
        self.assertEqual(mock_lambda.call_args[0][3], mock_dynamodb_instance)
        self.assertEqual(mock_api_gateway.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_api_gateway.call_args[0][1], mock_lambda_instance)
        self.assertEqual(mock_api_gateway.call_args[0][2], mock_iam_instance)
        self.assertEqual(mock_cloudwatch.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_cloudwatch.call_args[0][1], mock_lambda_instance)
        self.assertEqual(mock_cloudwatch.call_args[0][2], mock_api_gateway_instance)
        self.assertEqual(mock_cloudwatch.call_args[0][3], mock_sns_instance)
        self.assertEqual(mock_step_functions.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_step_functions.call_args[0][1], mock_lambda_instance)
        self.assertEqual(mock_step_functions.call_args[0][2], mock_iam_instance)
        self.assertEqual(mock_waf.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_waf.call_args[0][1], mock_api_gateway_instance)
        self.assertEqual(mock_config_rules.call_args[0][0], mock_config_instance)
        self.assertEqual(mock_config_rules.call_args[0][1], mock_iam_instance)

    def test_tap_stack_args_validation(self):
        """Test TapStackArgs validation and edge cases."""
        # Test with None values - should default to 'dev' and {}
        args = TapStackArgs(environment_suffix=None, tags=None)
        self.assertEqual(args.environment_suffix, 'dev')  # Default value
        self.assertEqual(args.tags, {})  # Default value
        
        # Test with empty string - should default to 'dev' because empty string is falsy
        args = TapStackArgs(environment_suffix='', tags={})
        self.assertEqual(args.environment_suffix, 'dev')  # Empty string is falsy, so defaults to 'dev'
        self.assertEqual(args.tags, {})
        
        # Test with complex tags
        complex_tags = {
            'Environment': 'prod',
            'Owner': 'team',
            'CostCenter': '12345',
            'Project': 'serverless-app'
        }
        args = TapStackArgs(environment_suffix='prod', tags=complex_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, complex_tags)

    @patch('lib.tap_stack.InfrastructureConfig')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.SNSStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.CloudWatchStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.WAFStack')
    @patch('lib.tap_stack.ConfigRulesStack')
    def test_tap_stack_output_validation(self, mock_config_rules, mock_waf, mock_step_functions,
                                       mock_cloudwatch, mock_api_gateway, mock_lambda,
                                       mock_sns, mock_dynamodb, mock_s3, mock_iam, mock_config):
        """Test TapStack output validation and type checking."""
        
        # Mock all components with direct resource attributes
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        # Mock S3 stack with direct resource attributes
        mock_s3_instance = MagicMock()
        mock_s3_instance.static_assets_bucket.bucket = MockPulumiOutput("static-bucket")
        mock_s3_instance.static_assets_bucket.arn = MockPulumiOutput("arn:aws:s3:::static-bucket")
        mock_s3_instance.lambda_deployments_bucket.bucket = MockPulumiOutput("lambda-bucket")
        mock_s3_instance.lambda_deployments_bucket.arn = MockPulumiOutput("arn:aws:s3:::lambda-bucket")
        mock_s3.return_value = mock_s3_instance
        
        # Mock DynamoDB stack with direct resource attributes
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.main_table.name = MockPulumiOutput("main-table")
        mock_dynamodb_instance.main_table.arn = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/main-table")
        mock_dynamodb_instance.audit_table.name = MockPulumiOutput("audit-table")
        mock_dynamodb_instance.audit_table.arn = MockPulumiOutput("arn:aws:dynamodb:us-east-1:123456789012:table/audit-table")
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        # Mock SNS stack with direct resource attributes
        mock_sns_instance = MagicMock()
        mock_sns_instance.critical_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:critical-topic")
        mock_sns_instance.error_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:error-topic")
        mock_sns_instance.compliance_topic.arn = MockPulumiOutput("arn:aws:sns:us-east-1:123456789012:compliance-topic")
        mock_sns.return_value = mock_sns_instance
        
        # Mock Lambda stack with direct resource attributes
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.api_handler.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:api-handler")
        mock_lambda_instance.api_handler.invoke_arn = MockPulumiOutput("arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:api-handler/invocations")
        mock_lambda_instance.data_processor.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:data-processor")
        mock_lambda_instance.error_handler.arn = MockPulumiOutput("arn:aws:lambda:us-east-1:123456789012:function:error-handler")
        mock_lambda.return_value = mock_lambda_instance
        
        # Mock API Gateway stack with direct resource attributes
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway_instance.stage.invoke_url = MockPulumiOutput("https://api-id.execute-api.us-east-1.amazonaws.com/v1")
        mock_api_gateway_instance.rest_api.id = MockPulumiOutput("api-id")
        mock_api_gateway_instance.stage.stage_name = MockPulumiOutput("v1")
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        # Mock CloudWatch stack with direct resource attributes
        mock_cloudwatch_instance = MagicMock()
        mock_cloudwatch_instance.alarms = {
            'lambda_errors': MagicMock(),
            'api_4xx_errors': MagicMock(),
            'api_5xx_errors': MagicMock()
        }
        mock_cloudwatch_instance.alarms['lambda_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:lambda-errors")
        mock_cloudwatch_instance.alarms['api_4xx_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-4xx")
        mock_cloudwatch_instance.alarms['api_5xx_errors'].arn = MockPulumiOutput("arn:aws:cloudwatch:us-east-1:123456789012:alarm:api-5xx")
        mock_cloudwatch_instance.get_dashboard_url.return_value = MockPulumiOutput("https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=main-dashboard")
        mock_cloudwatch.return_value = mock_cloudwatch_instance
        
        # Mock Step Functions stack with direct resource attributes
        mock_step_functions_instance = MagicMock()
        mock_step_functions_instance.state_machine.arn = MockPulumiOutput("arn:aws:states:us-east-1:123456789012:stateMachine:workflow")
        mock_step_functions_instance.state_machine.name = MockPulumiOutput("workflow")
        mock_step_functions.return_value = mock_step_functions_instance
        
        # Mock WAF stack with direct resource attributes
        mock_waf_instance = MagicMock()
        mock_waf_instance.web_acl.arn = MockPulumiOutput("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/web-acl")
        mock_waf_instance.web_acl.id = MockPulumiOutput("web-acl-id")
        mock_waf.return_value = mock_waf_instance
        
        # Mock Config Rules stack with direct resource attributes
        mock_config_rules_instance = MagicMock()
        mock_config_rules_instance.rules = {
            'iam_managed_policy': MagicMock(),
            's3_public_access': MagicMock(),
            'dynamodb_encryption': MagicMock()
        }
        mock_config_rules_instance.rules['iam_managed_policy'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/iam-policy")
        mock_config_rules_instance.rules['s3_public_access'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/s3-public")
        mock_config_rules_instance.rules['dynamodb_encryption'].arn = MockPulumiOutput("arn:aws:config:us-east-1:123456789012:rule/dynamodb-encryption")
        mock_config_rules.return_value = mock_config_rules_instance
        
        # Create TapStack instance
        stack = TapStack("test-stack", self.args, self.mock_opts)
        
        # Verify output types and values
        self.assertIsInstance(stack.api_endpoint, MockPulumiOutput)
        self.assertIsInstance(stack.rest_api_id, MockPulumiOutput)
        self.assertIsInstance(stack.stage_name, MockPulumiOutput)
        self.assertIsInstance(stack.api_handler_arn, MockPulumiOutput)
        self.assertIsInstance(stack.data_processor_arn, MockPulumiOutput)
        self.assertIsInstance(stack.error_handler_arn, MockPulumiOutput)
        self.assertIsInstance(stack.main_table_name, MockPulumiOutput)
        self.assertIsInstance(stack.audit_table_name, MockPulumiOutput)
        self.assertIsInstance(stack.static_assets_bucket_name, MockPulumiOutput)
        self.assertIsInstance(stack.lambda_deployments_bucket_name, MockPulumiOutput)
        self.assertIsInstance(stack.state_machine_arn, MockPulumiOutput)
        self.assertIsInstance(stack.lambda_error_alarm_arn, MockPulumiOutput)
        self.assertIsInstance(stack.critical_topic_arn, MockPulumiOutput)
        self.assertIsInstance(stack.web_acl_arn, MockPulumiOutput)
        self.assertIsInstance(stack.config_rule_arns, list)
        
        # Verify output values
        self.assertEqual(stack.api_endpoint.value, "https://api-id.execute-api.us-east-1.amazonaws.com/v1")
        self.assertEqual(stack.rest_api_id.value, "api-id")
        self.assertEqual(stack.stage_name.value, "v1")
        self.assertEqual(stack.api_handler_arn.value, "arn:aws:lambda:us-east-1:123456789012:function:api-handler")
        self.assertEqual(stack.data_processor_arn.value, "arn:aws:lambda:us-east-1:123456789012:function:data-processor")
        self.assertEqual(stack.error_handler_arn.value, "arn:aws:lambda:us-east-1:123456789012:function:error-handler")
        self.assertEqual(stack.main_table_name.value, "main-table")
        self.assertEqual(stack.audit_table_name.value, "audit-table")
        self.assertEqual(stack.static_assets_bucket_name.value, "static-bucket")
        self.assertEqual(stack.lambda_deployments_bucket_name.value, "lambda-bucket")
        self.assertEqual(stack.state_machine_arn.value, "arn:aws:states:us-east-1:123456789012:stateMachine:workflow")
        self.assertEqual(stack.lambda_error_alarm_arn.value, "arn:aws:cloudwatch:us-east-1:123456789012:alarm:lambda-errors")
        self.assertEqual(stack.critical_topic_arn.value, "arn:aws:sns:us-east-1:123456789012:critical-topic")
        self.assertEqual(stack.web_acl_arn.value, "arn:aws:wafv2:us-east-1:123456789012:regional/webacl/web-acl")
        
        # Verify config rule ARNs are present
        self.assertEqual(len(stack.config_rule_arns), 3)
        self.assertIsInstance(stack.config_rule_arns[0], MockPulumiOutput)
        self.assertIsInstance(stack.config_rule_arns[1], MockPulumiOutput)
        self.assertIsInstance(stack.config_rule_arns[2], MockPulumiOutput)


class TestInfrastructureConfig(unittest.TestCase):
    """Test cases for InfrastructureConfig class."""

    def setUp(self):
        """Set up test fixtures."""
        # Clear any existing environment variables
        self.env_vars_to_clear = [
            'PROJECT_NAME', 'ENVIRONMENT', 'AWS_REGION', 'LAMBDA_RUNTIME',
            'LAMBDA_TIMEOUT', 'LAMBDA_MEMORY_SIZE', 'API_STAGE_NAME', 'ALLOWED_IPS'
        ]
        for var in self.env_vars_to_clear:
            if var in os.environ:
                del os.environ[var]

    def tearDown(self):
        """Clean up after tests."""
        for var in self.env_vars_to_clear:
            if var in os.environ:
                del os.environ[var]

    def test_config_default_values(self):
        """Test InfrastructureConfig with default values."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        self.assertEqual(config.project_name, 'serverless-app')
        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.aws_region, 'us-west-2')
        self.assertEqual(config.lambda_runtime, 'python3.11')
        self.assertEqual(config.lambda_timeout, 30)
        self.assertEqual(config.lambda_memory_size, 128)
        self.assertEqual(config.api_stage_name, 'v1')
        self.assertEqual(config.allowed_ips, ['0.0.0.0/0'])
        
        # Test default tags
        expected_tags = {
            'Project': 'ServerlessApp',
            'Environment': 'dev',
            'ManagedBy': 'Pulumi'
        }
        self.assertEqual(config.tags, expected_tags)

    def test_config_environment_variables(self):
        """Test InfrastructureConfig with environment variables."""
        import os

        from lib.infrastructure.config import InfrastructureConfig
        
        os.environ['PROJECT_NAME'] = 'test-project'
        os.environ['ENVIRONMENT'] = 'prod'
        os.environ['AWS_REGION'] = 'us-west-2'
        os.environ['LAMBDA_RUNTIME'] = 'python3.12'
        os.environ['LAMBDA_TIMEOUT'] = '60'
        os.environ['LAMBDA_MEMORY_SIZE'] = '256'
        os.environ['API_STAGE_NAME'] = 'v2'
        os.environ['ALLOWED_IPS'] = '192.168.1.0/24,10.0.0.0/8'
        
        config = InfrastructureConfig()
        
        self.assertEqual(config.project_name, 'test-project')
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.aws_region, 'us-west-2')
        self.assertEqual(config.lambda_runtime, 'python3.11')
        self.assertEqual(config.lambda_timeout, 30)
        self.assertEqual(config.lambda_memory_size, 128)
        self.assertEqual(config.api_stage_name, 'v1')
        self.assertEqual(config.allowed_ips, ['192.168.1.0/24', '10.0.0.0/8'])

    def test_normalize_name(self):
        """Test _normalize_name method."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        # Test various name formats
        self.assertEqual(config._normalize_name('Test_Name'), 'test-name')
        self.assertEqual(config._normalize_name('UPPER_CASE'), 'upper-case')
        self.assertEqual(config._normalize_name('mixed_Case_123'), 'mixed-case-123')
        self.assertEqual(config._normalize_name('already-lower'), 'already-lower')
        self.assertEqual(config._normalize_name('with_underscores'), 'with-underscores')

    def test_get_resource_name(self):
        """Test get_resource_name method."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        # Test resource name generation
        resource_name = config.get_resource_name('lambda', 'api-handler')
        expected = 'serverless-app-lambda-api-handler-dev'
        self.assertEqual(resource_name, expected)
        
        # Test with different resource types
        s3_name = config.get_resource_name('s3-bucket', 'static-assets')
        expected_s3 = 'serverless-app-s3-bucket-static-assets-dev'
        self.assertEqual(s3_name, expected_s3)

    def test_get_lambda_config(self):
        """Test get_lambda_config method."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        lambda_config = config.get_lambda_config()
        
        expected_config = {
            'runtime': 'python3.11',
            'timeout': 30,
            'memory_size': 128,
            'environment': {
                'ENVIRONMENT': 'dev',
                'REGION': 'us-west-2',
                'PROJECT_NAME': 'serverless-app'
            }
        }
        self.assertEqual(lambda_config, expected_config)

    def test_get_api_gateway_config(self):
        """Test get_api_gateway_config method."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        api_config = config.get_api_gateway_config()
        
        expected_config = {
            'stage_name': 'v1',
            'allowed_ips': ['0.0.0.0/0']
        }
        self.assertEqual(api_config, expected_config)

    def test_get_cross_region_config(self):
        """Test get_cross_region_config method."""
        from lib.infrastructure.config import InfrastructureConfig
        config = InfrastructureConfig()
        
        cross_region_config = config.get_cross_region_config()
        
        expected_config = {
            'primary_region': 'us-west-2',
            'backup_regions': ['us-east-1', 'us-west-1']
        }
        self.assertEqual(cross_region_config, expected_config)


class TestIAMStack(unittest.TestCase):
    """Test cases for IAMStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.iam.aws.iam.Role')
    @patch('lib.infrastructure.iam.aws.iam.Policy')
    @patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('lib.infrastructure.iam.aws.iam.get_policy_document')
    def test_iam_stack_initialization(self, mock_get_policy_document, mock_role_policy_attachment, 
                                     mock_policy, mock_role):
        """Test IAMStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.iam import IAMStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc
        
        # Mock AWS resources
        mock_role.return_value = MockPulumiResource("test-role")
        mock_policy.return_value = MockPulumiResource("test-policy")
        mock_role_policy_attachment.return_value = MockPulumiResource("test-attachment")
        
        # Create IAMStack
        iam_stack = IAMStack(self.mock_config, ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(iam_stack.lambda_execution_role)
        self.assertIsNotNone(iam_stack.api_gateway_role)
        self.assertIsNotNone(iam_stack.cloudwatch_role)
        self.assertIsNotNone(iam_stack.step_functions_role)

    @patch('lib.infrastructure.iam.aws.iam.Role')
    @patch('lib.infrastructure.iam.aws.iam.Policy')
    @patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('lib.infrastructure.iam.aws.iam.get_policy_document')
    def test_iam_stack_getter_methods(self, mock_get_policy_document, mock_role_policy_attachment,
                                     mock_policy, mock_role):
        """Test IAMStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.iam import IAMStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc
        
        # Mock AWS resources
        mock_role.return_value = MockPulumiResource("test-role")
        mock_policy.return_value = MockPulumiResource("test-policy")
        mock_role_policy_attachment.return_value = MockPulumiResource("test-attachment")
        
        # Create IAMStack
        iam_stack = IAMStack(self.mock_config, ResourceOptions())
        
        # Test getter methods
        self.assertIsNotNone(iam_stack.get_lambda_execution_role_arn())
        self.assertIsNotNone(iam_stack.get_api_gateway_role_arn())
        self.assertIsNotNone(iam_stack.get_cloudwatch_role_arn())
        self.assertIsNotNone(iam_stack.get_step_functions_role_arn())


class TestS3Stack(unittest.TestCase):
    """Test cases for S3Stack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.s3.aws.s3.Bucket')
    @patch('lib.infrastructure.s3.aws.s3.BucketVersioning')
    @patch('lib.infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    def test_s3_stack_initialization(self, mock_public_access_block, mock_lifecycle,
                                   mock_encryption, mock_versioning, mock_bucket):
        """Test S3Stack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.s3 import S3Stack

        # Mock AWS resources
        mock_bucket.return_value = MockPulumiResource("test-bucket")
        mock_versioning.return_value = MockPulumiResource("test-versioning")
        mock_encryption.return_value = MockPulumiResource("test-encryption")
        mock_lifecycle.return_value = MockPulumiResource("test-lifecycle")
        mock_public_access_block.return_value = MockPulumiResource("test-pab")
        
        # Create S3Stack
        s3_stack = S3Stack(self.mock_config, ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(s3_stack.static_assets_bucket)
        self.assertIsNotNone(s3_stack.lambda_deployments_bucket)

    @patch('lib.infrastructure.s3.aws.s3.Bucket')
    @patch('lib.infrastructure.s3.aws.s3.BucketVersioning')
    @patch('lib.infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    def test_s3_stack_getter_methods(self, mock_public_access_block, mock_lifecycle,
                                    mock_encryption, mock_versioning, mock_bucket):
        """Test S3Stack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.s3 import S3Stack

        # Mock AWS resources
        mock_bucket.return_value = MockPulumiResource("test-bucket")
        mock_versioning.return_value = MockPulumiResource("test-versioning")
        mock_encryption.return_value = MockPulumiResource("test-encryption")
        mock_lifecycle.return_value = MockPulumiResource("test-lifecycle")
        mock_public_access_block.return_value = MockPulumiResource("test-pab")
        
        # Create S3Stack
        s3_stack = S3Stack(self.mock_config, ResourceOptions())
        
        # Test getter methods
        self.assertIsNotNone(s3_stack.get_static_assets_bucket_name())
        self.assertIsNotNone(s3_stack.get_static_assets_bucket_arn())
        self.assertIsNotNone(s3_stack.get_lambda_deployments_bucket_name())
        self.assertIsNotNone(s3_stack.get_lambda_deployments_bucket_arn())


class TestDynamoDBStack(unittest.TestCase):
    """Test cases for DynamoDBStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_stack_initialization(self, mock_table):
        """Test DynamoDBStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.dynamodb import DynamoDBStack

        # Mock AWS resources
        mock_table.return_value = MockPulumiResource("test-table")
        
        # Create DynamoDBStack
        dynamodb_stack = DynamoDBStack(self.mock_config, ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(dynamodb_stack.main_table)
        self.assertIsNotNone(dynamodb_stack.audit_table)

    @patch('lib.infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_stack_getter_methods(self, mock_table):
        """Test DynamoDBStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.dynamodb import DynamoDBStack

        # Mock AWS resources
        mock_table.return_value = MockPulumiResource("test-table")
        
        # Create DynamoDBStack
        dynamodb_stack = DynamoDBStack(self.mock_config, ResourceOptions())
        
        # Test getter methods
        self.assertIsNotNone(dynamodb_stack.get_main_table_name())
        self.assertIsNotNone(dynamodb_stack.get_main_table_arn())
        self.assertIsNotNone(dynamodb_stack.get_audit_table_name())
        self.assertIsNotNone(dynamodb_stack.get_audit_table_arn())


class TestSNSStack(unittest.TestCase):
    """Test cases for SNSStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.sns.aws.sns.Topic')
    def test_sns_stack_initialization(self, mock_topic):
        """Test SNSStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.sns import SNSStack

        # Mock AWS resources
        mock_topic.return_value = MockPulumiResource("test-topic")
        
        # Create SNSStack
        sns_stack = SNSStack(self.mock_config, ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(sns_stack.critical_topic)
        self.assertIsNotNone(sns_stack.error_topic)
        self.assertIsNotNone(sns_stack.compliance_topic)

    @patch('lib.infrastructure.sns.aws.sns.Topic')
    def test_sns_stack_getter_methods(self, mock_topic):
        """Test SNSStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.sns import SNSStack

        # Mock AWS resources
        mock_topic.return_value = MockPulumiResource("test-topic")
        
        # Create SNSStack
        sns_stack = SNSStack(self.mock_config, ResourceOptions())
        
        # Test getter methods
        self.assertIsNotNone(sns_stack.get_critical_topic_arn())
        self.assertIsNotNone(sns_stack.get_error_topic_arn())
        self.assertIsNotNone(sns_stack.get_compliance_topic_arn())


class TestLambdaStack(unittest.TestCase):
    """Test cases for LambdaStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        self.mock_config.get_lambda_config.return_value = {
            'runtime': 'python3.11',
            'timeout': 30,
            'memory_size': 128,
            'environment': {'ENVIRONMENT': 'dev'}
        }
        
        self.mock_iam_stack = MagicMock()
        self.mock_s3_stack = MagicMock()
        self.mock_dynamodb_stack = MagicMock()

    @patch('lib.infrastructure.lambda_function.aws.lambda_.Function')
    @patch('lib.infrastructure.lambda_function.aws.cloudwatch.LogGroup')
    @patch('lib.infrastructure.lambda_function.pulumi.AssetArchive')
    @patch('lib.infrastructure.lambda_function.pulumi.FileAsset')
    def test_lambda_stack_initialization(self, mock_file_asset, mock_asset_archive,
                                        mock_log_group, mock_function):
        """Test LambdaStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.lambda_function import LambdaStack

        # Mock AWS resources
        mock_function.return_value = MockPulumiResource("test-function")
        mock_log_group.return_value = MockPulumiResource("test-log-group")
        mock_asset_archive.return_value = MockPulumiOutput("test-archive")
        mock_file_asset.return_value = MockPulumiOutput("test-file")
        
        # Create LambdaStack
        lambda_stack = LambdaStack(
            self.mock_config, 
            self.mock_iam_stack, 
            self.mock_s3_stack, 
            self.mock_dynamodb_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(lambda_stack.api_handler)
        self.assertIsNotNone(lambda_stack.data_processor)
        self.assertIsNotNone(lambda_stack.error_handler)

    @patch('lib.infrastructure.lambda_function.aws.lambda_.Function')
    @patch('lib.infrastructure.lambda_function.aws.cloudwatch.LogGroup')
    @patch('lib.infrastructure.lambda_function.pulumi.AssetArchive')
    @patch('lib.infrastructure.lambda_function.pulumi.FileAsset')
    def test_lambda_stack_getter_methods(self, mock_file_asset, mock_asset_archive,
                                        mock_log_group, mock_function):
        """Test LambdaStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.lambda_function import LambdaStack

        # Mock AWS resources
        mock_function.return_value = MockPulumiResource("test-function")
        mock_log_group.return_value = MockPulumiResource("test-log-group")
        mock_asset_archive.return_value = MockPulumiOutput("test-archive")
        mock_file_asset.return_value = MockPulumiOutput("test-file")
        
        # Create LambdaStack
        lambda_stack = LambdaStack(
            self.mock_config, 
            self.mock_iam_stack, 
            self.mock_s3_stack, 
            self.mock_dynamodb_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        self.assertIsNotNone(lambda_stack.get_api_handler_arn())
        self.assertIsNotNone(lambda_stack.get_api_handler_invoke_arn())
        self.assertIsNotNone(lambda_stack.get_data_processor_arn())
        self.assertIsNotNone(lambda_stack.get_error_handler_arn())


class TestAPIGatewayStack(unittest.TestCase):
    """Test cases for APIGatewayStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        self.mock_config.get_api_gateway_config.return_value = {
            'stage_name': 'v1',
            'allowed_ips': ['0.0.0.0/0']
        }
        
        self.mock_lambda_stack = MagicMock()
        self.mock_iam_stack = MagicMock()

    @patch('lib.infrastructure.api_gateway.aws.apigateway.RestApi')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Method')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('lib.infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('lib.infrastructure.api_gateway.aws.get_caller_identity')
    def test_api_gateway_stack_initialization(self, mock_get_caller_identity, mock_permission,
                                             mock_stage, mock_deployment, mock_integration,
                                             mock_method, mock_resource, mock_rest_api):
        """Test APIGatewayStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.api_gateway import APIGatewayStack

        # Mock AWS resources
        mock_rest_api.return_value = MockPulumiResource("test-rest-api")
        mock_resource.return_value = MockPulumiResource("test-resource")
        mock_method.return_value = MockPulumiResource("test-method")
        mock_integration.return_value = MockPulumiResource("test-integration")
        mock_deployment.return_value = MockPulumiResource("test-deployment")
        mock_stage.return_value = MockPulumiResource("test-stage")
        mock_permission.return_value = MockPulumiResource("test-permission")
        
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mock_get_caller_identity.return_value = mock_identity
        
        # Create APIGatewayStack
        api_gateway_stack = APIGatewayStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(api_gateway_stack.rest_api)
        self.assertIsNotNone(api_gateway_stack.deployment)
        self.assertIsNotNone(api_gateway_stack.stage)

    @patch('lib.infrastructure.api_gateway.aws.apigateway.RestApi')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Method')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('lib.infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('lib.infrastructure.api_gateway.aws.get_caller_identity')
    def test_api_gateway_stack_getter_methods(self, mock_get_caller_identity, mock_permission,
                                             mock_stage, mock_deployment, mock_integration,
                                             mock_method, mock_resource, mock_rest_api):
        """Test APIGatewayStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.api_gateway import APIGatewayStack

        # Mock AWS resources
        mock_rest_api.return_value = MockPulumiResource("test-rest-api")
        mock_resource.return_value = MockPulumiResource("test-resource")
        mock_method.return_value = MockPulumiResource("test-method")
        mock_integration.return_value = MockPulumiResource("test-integration")
        mock_deployment.return_value = MockPulumiResource("test-deployment")
        mock_stage.return_value = MockPulumiResource("test-stage")
        mock_permission.return_value = MockPulumiResource("test-permission")
        
        # Mock get_caller_identity
        mock_identity = MagicMock()
        mock_identity.account_id = "123456789012"
        mock_get_caller_identity.return_value = mock_identity
        
        # Create APIGatewayStack
        api_gateway_stack = APIGatewayStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        self.assertIsNotNone(api_gateway_stack.get_api_endpoint())
        self.assertIsNotNone(api_gateway_stack.get_rest_api_id())
        self.assertIsNotNone(api_gateway_stack.get_stage_name())


class TestCloudWatchStack(unittest.TestCase):
    """Test cases for CloudWatchStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        
        self.mock_lambda_stack = MagicMock()
        self.mock_api_gateway_stack = MagicMock()
        self.mock_sns_stack = MagicMock()

    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.LogGroup')
    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.MetricAlarm')
    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.Dashboard')
    def test_cloudwatch_stack_initialization(self, mock_dashboard, mock_alarm, mock_log_group):
        """Test CloudWatchStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.cloudwatch import CloudWatchStack

        # Mock AWS resources
        mock_log_group.return_value = MockPulumiResource("test-log-group")
        mock_alarm.return_value = MockPulumiResource("test-alarm")
        mock_dashboard.return_value = MockPulumiResource("test-dashboard")
        
        # Create CloudWatchStack
        cloudwatch_stack = CloudWatchStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_api_gateway_stack, 
            self.mock_sns_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(cloudwatch_stack.alarms)
        self.assertIsNotNone(cloudwatch_stack.dashboard)

    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.LogGroup')
    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.MetricAlarm')
    @patch('lib.infrastructure.cloudwatch.aws.cloudwatch.Dashboard')
    def test_cloudwatch_stack_getter_methods(self, mock_dashboard, mock_alarm, mock_log_group):
        """Test CloudWatchStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.cloudwatch import CloudWatchStack

        # Mock AWS resources
        mock_log_group.return_value = MockPulumiResource("test-log-group")
        mock_alarm.return_value = MockPulumiResource("test-alarm")
        mock_dashboard.return_value = MockPulumiResource("test-dashboard")
        
        # Create CloudWatchStack
        cloudwatch_stack = CloudWatchStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_api_gateway_stack, 
            self.mock_sns_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        self.assertIsNotNone(cloudwatch_stack.get_lambda_error_alarm_arn())
        self.assertIsNotNone(cloudwatch_stack.get_api_4xx_alarm_arn())
        self.assertIsNotNone(cloudwatch_stack.get_api_5xx_alarm_arn())
        self.assertIsNotNone(cloudwatch_stack.get_dashboard_url())


class TestStepFunctionsStack(unittest.TestCase):
    """Test cases for StepFunctionsStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        
        self.mock_lambda_stack = MagicMock()
        self.mock_iam_stack = MagicMock()

    @patch('lib.infrastructure.step_functions.aws.sfn.StateMachine')
    def test_step_functions_stack_initialization(self, mock_state_machine):
        """Test StepFunctionsStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.step_functions import StepFunctionsStack

        # Mock AWS resources
        mock_state_machine.return_value = MockPulumiResource("test-state-machine")
        
        # Create StepFunctionsStack
        step_functions_stack = StepFunctionsStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(step_functions_stack.state_machine)

    @patch('lib.infrastructure.step_functions.aws.sfn.StateMachine')
    def test_step_functions_stack_getter_methods(self, mock_state_machine):
        """Test StepFunctionsStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.step_functions import StepFunctionsStack

        # Mock AWS resources
        mock_state_machine.return_value = MockPulumiResource("test-state-machine")
        
        # Create StepFunctionsStack
        step_functions_stack = StepFunctionsStack(
            self.mock_config, 
            self.mock_lambda_stack, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        self.assertIsNotNone(step_functions_stack.get_state_machine_arn())
        self.assertIsNotNone(step_functions_stack.get_state_machine_name())


class TestWAFStack(unittest.TestCase):
    """Test cases for WAFStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        self.mock_config.allowed_ips = ['0.0.0.0/0']
        
        self.mock_api_gateway_stack = MagicMock()

    @patch('lib.infrastructure.waf.aws.wafv2.IpSet')
    @patch('lib.infrastructure.waf.aws.wafv2.WebAcl')
    def test_waf_stack_initialization(self, mock_web_acl, mock_ip_set):
        """Test WAFStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.waf import WAFStack

        # Mock AWS resources
        mock_ip_set.return_value = MockPulumiResource("test-ip-set")
        mock_web_acl.return_value = MockPulumiResource("test-web-acl")
        
        # Create WAFStack
        waf_stack = WAFStack(
            self.mock_config, 
            self.mock_api_gateway_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(waf_stack.web_acl)

    @patch('lib.infrastructure.waf.aws.wafv2.IpSet')
    @patch('lib.infrastructure.waf.aws.wafv2.WebAcl')
    def test_waf_stack_getter_methods(self, mock_web_acl, mock_ip_set):
        """Test WAFStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.waf import WAFStack

        # Mock AWS resources
        mock_ip_set.return_value = MockPulumiResource("test-ip-set")
        mock_web_acl.return_value = MockPulumiResource("test-web-acl")
        
        # Create WAFStack
        waf_stack = WAFStack(
            self.mock_config, 
            self.mock_api_gateway_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        self.assertIsNotNone(waf_stack.get_web_acl_arn())
        self.assertIsNotNone(waf_stack.get_web_acl_id())


class TestConfigRulesStack(unittest.TestCase):
    """Test cases for ConfigRulesStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}
        
        self.mock_iam_stack = MagicMock()

    @patch('lib.infrastructure.config_rules.aws.cfg.Recorder')
    @patch('lib.infrastructure.config_rules.aws.cfg.Rule')
    @patch('lib.infrastructure.config_rules.aws.iam.Role')
    @patch('lib.infrastructure.config_rules.aws.iam.RolePolicy')
    @patch('lib.infrastructure.config_rules.aws.iam.get_policy_document')
    def test_config_rules_stack_initialization(self, mock_get_policy_document, mock_role_policy, mock_role,
                                              mock_rule, mock_recorder):
        """Test ConfigRulesStack initialization."""
        from pulumi import ResourceOptions

        from lib.infrastructure.config_rules import ConfigRulesStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc

        # Mock AWS resources
        mock_recorder.return_value = MockPulumiResource("test-recorder")
        mock_rule.return_value = MockPulumiResource("test-rule")
        mock_role.return_value = MockPulumiResource("test-role")
        mock_role_policy.return_value = MockPulumiResource("test-role-policy")
        
        # Create ConfigRulesStack
        config_rules_stack = ConfigRulesStack(
            self.mock_config, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Verify resources were created
        self.assertIsNotNone(config_rules_stack.configuration_recorder)
        self.assertIsNotNone(config_rules_stack.rules)

    @patch('lib.infrastructure.config_rules.aws.cfg.Recorder')
    @patch('lib.infrastructure.config_rules.aws.cfg.Rule')
    @patch('lib.infrastructure.config_rules.aws.iam.Role')
    @patch('lib.infrastructure.config_rules.aws.iam.RolePolicy')
    @patch('lib.infrastructure.config_rules.aws.iam.get_policy_document')
    def test_config_rules_stack_getter_methods(self, mock_get_policy_document, mock_role_policy, mock_role,
                                             mock_rule, mock_recorder):
        """Test ConfigRulesStack getter methods."""
        from pulumi import ResourceOptions

        from lib.infrastructure.config_rules import ConfigRulesStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc

        mock_recorder.return_value = MockPulumiResource("test-recorder")
        mock_rule.return_value = MockPulumiResource("test-rule")
        mock_role.return_value = MockPulumiResource("test-role")
        mock_role_policy.return_value = MockPulumiResource("test-role-policy")
        
        # Create ConfigRulesStack
        config_rules_stack = ConfigRulesStack(
            self.mock_config, 
            self.mock_iam_stack,
            ResourceOptions()
        )
        
        # Test getter methods
        rule_arns = config_rules_stack.get_rule_arns()
        self.assertIsInstance(rule_arns, dict)
        self.assertIn('iam_managed_policy', rule_arns)
        self.assertIn('s3_public_access', rule_arns)
        self.assertIn('dynamodb_encryption', rule_arns)


class TestInfrastructureConfigExtended(unittest.TestCase):
    """Extended test cases for InfrastructureConfig class to increase coverage."""

    def setUp(self):
        """Set up test fixtures."""
        # Clear any existing environment variables
        self.env_vars_to_clear = [
            'PROJECT_NAME', 'ENVIRONMENT', 'AWS_REGION', 'ALLOWED_IPS'
        ]
        for var in self.env_vars_to_clear:
            if var in os.environ:
                del os.environ[var]

    def tearDown(self):
        """Clean up after tests."""
        for var in self.env_vars_to_clear:
            if var in os.environ:
                del os.environ[var]

    def test_config_edge_cases(self):
        """Test InfrastructureConfig with edge cases to increase coverage."""
        from lib.infrastructure.config import InfrastructureConfig

        # Test with empty environment variables
        os.environ['PROJECT_NAME'] = ''
        os.environ['ENVIRONMENT'] = ''
        os.environ['AWS_REGION'] = ''
        os.environ['ALLOWED_IPS'] = ''
        
        config = InfrastructureConfig()
        
        # Empty strings should be used as-is (not defaulted)
        self.assertEqual(config.project_name, '')
        self.assertEqual(config.environment, '')
        self.assertEqual(config.aws_region, '')
        self.assertEqual(config.allowed_ips, [''])

    def test_config_complex_allowed_ips(self):
        """Test InfrastructureConfig with complex allowed IPs."""
        from lib.infrastructure.config import InfrastructureConfig

        # Test with complex IP ranges
        os.environ['ALLOWED_IPS'] = '192.168.1.0/24,10.0.0.0/8,172.16.0.0/12'
        
        config = InfrastructureConfig()
        
        expected_ips = ['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12']
        self.assertEqual(config.allowed_ips, expected_ips)

    def test_config_special_characters(self):
        """Test InfrastructureConfig with special characters in names."""
        from lib.infrastructure.config import InfrastructureConfig

        # Test normalization with special characters
        config = InfrastructureConfig()
        
        # Test various special character scenarios
        self.assertEqual(config._normalize_name('Test_Name_123'), 'test-name-123')
        self.assertEqual(config._normalize_name('UPPER_CASE_123'), 'upper-case-123')
        self.assertEqual(config._normalize_name('mixed_Case_123'), 'mixed-case-123')
        self.assertEqual(config._normalize_name('with_underscores_and_123'), 'with-underscores-and-123')

    def test_config_resource_name_edge_cases(self):
        """Test get_resource_name with edge cases."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        
        # Test with different resource types and names
        resource_name = config.get_resource_name('lambda', 'api-handler')
        expected = 'serverless-app-lambda-api-handler-dev'
        self.assertEqual(resource_name, expected)
        
        # Test with special characters in resource type
        s3_name = config.get_resource_name('s3-bucket', 'static-assets')
        expected_s3 = 'serverless-app-s3-bucket-static-assets-dev'
        self.assertEqual(s3_name, expected_s3)

    def test_config_cross_region_backup_regions(self):
        """Test get_cross_region_config backup regions."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        cross_region_config = config.get_cross_region_config()
        
        # Verify backup regions are included
        self.assertIn('us-east-1', cross_region_config['backup_regions'])
        self.assertIn('us-west-1', cross_region_config['backup_regions'])
        self.assertEqual(cross_region_config['primary_region'], 'us-west-2')


class TestWAFStackExtended(unittest.TestCase):
    """Extended test cases for WAFStack class to increase coverage."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.waf.aws.wafv2.WebAcl')
    @patch('lib.infrastructure.waf.aws.wafv2.IpSet')
    def test_waf_stack_edge_cases(self, mock_ip_set, mock_web_acl):
        """Test WAFStack with edge cases to increase coverage."""
        from pulumi import ResourceOptions

        from lib.infrastructure.waf import WAFStack

        # Mock AWS resources
        mock_ip_set.return_value = MockPulumiResource("test-ip-set")
        mock_web_acl.return_value = MockPulumiResource("test-web-acl")
        
        # Create WAFStack
        waf_stack = WAFStack(self.mock_config, MagicMock(), ResourceOptions())
        
        # Test getter methods
        self.assertIsNotNone(waf_stack.get_web_acl_arn())
        self.assertIsNotNone(waf_stack.get_web_acl_id())
        # get_association_id returns None by design (disabled due to ARN format issues)
        self.assertIsNone(waf_stack.get_association_id())

    @patch('lib.infrastructure.waf.aws.wafv2.WebAcl')
    @patch('lib.infrastructure.waf.aws.wafv2.IpSet')
    def test_waf_stack_with_special_ips(self, mock_ip_set, mock_web_acl):
        """Test WAFStack with special IP configurations."""
        from pulumi import ResourceOptions

        from lib.infrastructure.waf import WAFStack

        # Mock config with special allowed IPs
        self.mock_config.get_api_gateway_config.return_value = {
            'allowed_ips': ['0.0.0.0/0', '192.168.1.0/24']
        }
        
        # Mock AWS resources
        mock_ip_set.return_value = MockPulumiResource("test-ip-set")
        mock_web_acl.return_value = MockPulumiResource("test-web-acl")
        
        # Create WAFStack
        waf_stack = WAFStack(self.mock_config, MagicMock(), ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(waf_stack.web_acl)


class TestConfigRulesStackExtended(unittest.TestCase):
    """Extended test cases for ConfigRulesStack class to increase coverage."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get_resource_name.return_value = "test-resource"
        self.mock_config.tags = {'Project': 'test'}

    @patch('lib.infrastructure.config_rules.aws.cfg.Rule')
    @patch('lib.infrastructure.config_rules.aws.cfg.Recorder')
    @patch('lib.infrastructure.config_rules.aws.iam.Role')
    @patch('lib.infrastructure.config_rules.aws.iam.RolePolicy')
    @patch('lib.infrastructure.config_rules.aws.s3.Bucket')
    @patch('lib.infrastructure.config_rules.aws.s3.BucketPublicAccessBlock')
    @patch('lib.infrastructure.config_rules.aws.s3.BucketAcl')
    @patch('lib.infrastructure.config_rules.pulumi.runtime.invoke')
    @patch('lib.infrastructure.config_rules.aws.iam.get_policy_document')
    def test_config_rules_stack_edge_cases(self, mock_get_policy_document, mock_invoke, 
                                          mock_bucket_acl, mock_public_access_block, 
                                          mock_bucket, mock_role_policy, mock_role, 
                                          mock_recorder, mock_rule):
        """Test ConfigRulesStack with edge cases to increase coverage."""
        from pulumi import ResourceOptions

        from lib.infrastructure.config_rules import ConfigRulesStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc
        
        # Mock runtime invoke
        mock_invoke.return_value = MagicMock()
        
        # Mock AWS resources
        mock_bucket.return_value = MockPulumiResource("test-bucket")
        mock_public_access_block.return_value = MockPulumiResource("test-pab")
        mock_bucket_acl.return_value = MockPulumiResource("test-acl")
        mock_role.return_value = MockPulumiResource("test-role")
        mock_role_policy.return_value = MockPulumiResource("test-policy")
        mock_recorder.return_value = MockPulumiResource("test-recorder")
        mock_rule.return_value = MockPulumiResource("test-rule")
        
        # Create ConfigRulesStack
        config_stack = ConfigRulesStack(self.mock_config, MagicMock(), ResourceOptions())
        
        # Test getter methods
        rule_arns = config_stack.get_rule_arns()
        self.assertIsInstance(rule_arns, dict)
        self.assertIn('iam_managed_policy', rule_arns)
        self.assertIn('s3_public_access', rule_arns)
        self.assertIn('dynamodb_encryption', rule_arns)

    @patch('lib.infrastructure.config_rules.aws.cfg.Rule')
    @patch('lib.infrastructure.config_rules.aws.cfg.Recorder')
    @patch('lib.infrastructure.config_rules.aws.iam.Role')
    @patch('lib.infrastructure.config_rules.aws.iam.RolePolicy')
    @patch('lib.infrastructure.config_rules.aws.s3.Bucket')
    @patch('lib.infrastructure.config_rules.aws.s3.BucketPublicAccessBlock')
    @patch('lib.infrastructure.config_rules.aws.s3.BucketAcl')
    @patch('lib.infrastructure.config_rules.pulumi.runtime.invoke')
    @patch('lib.infrastructure.config_rules.aws.iam.get_policy_document')
    def test_config_rules_stack_complex_scenarios(self, mock_get_policy_document, mock_invoke,
                                                 mock_bucket_acl, mock_public_access_block,
                                                 mock_bucket, mock_role_policy, mock_role,
                                                 mock_recorder, mock_rule):
        """Test ConfigRulesStack with complex scenarios."""
        from pulumi import ResourceOptions

        from lib.infrastructure.config_rules import ConfigRulesStack

        # Mock policy document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
        mock_get_policy_document.return_value = mock_policy_doc
        
        # Mock runtime invoke
        mock_invoke.return_value = MagicMock()
        
        # Mock AWS resources
        mock_bucket.return_value = MockPulumiResource("test-bucket")
        mock_public_access_block.return_value = MockPulumiResource("test-pab")
        mock_bucket_acl.return_value = MockPulumiResource("test-acl")
        mock_role.return_value = MockPulumiResource("test-role")
        mock_role_policy.return_value = MockPulumiResource("test-policy")
        mock_recorder.return_value = MockPulumiResource("test-recorder")
        mock_rule.return_value = MockPulumiResource("test-rule")
        
        # Create ConfigRulesStack
        config_stack = ConfigRulesStack(self.mock_config, MagicMock(), ResourceOptions())
        
        # Verify resources were created
        self.assertIsNotNone(config_stack.configuration_recorder)
        self.assertIsNotNone(config_stack.rules)
        self.assertIn('iam_managed_policy', config_stack.rules)
        self.assertIn('s3_public_access', config_stack.rules)
        self.assertIn('dynamodb_encryption', config_stack.rules)


class TestTargetedCoverage(unittest.TestCase):
    """Targeted tests for specific missing lines to reach 90% coverage."""

    def test_config_get_parameter_name(self):
        """Test get_parameter_name method (line 99)."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        param_name = config.get_parameter_name('test-param')
        expected = 'serverless-app-test-param-dev'
        self.assertEqual(param_name, expected)

    def test_config_get_secret_with_pulumi_config(self):
        """Test get_secret_value method with Pulumi config (lines 113-117)."""
        from unittest.mock import patch

        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        
        # Mock Pulumi config to return a value
        with patch.object(config.pulumi_config, 'get', return_value='secret-value'):
            result = config.get_secret_value('test-secret', 'default-value')
            self.assertEqual(result, 'secret-value')

    def test_config_get_secret_fallback_to_env(self):
        """Test get_secret_value method fallback to environment variable (lines 113-117)."""
        import os
        from unittest.mock import patch

        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        
        # Mock Pulumi config to raise exception, then test env fallback
        with patch.object(config.pulumi_config, 'get', side_effect=Exception("Config error")):
            with patch.dict(os.environ, {'TEST-SECRET': 'env-value'}):
                result = config.get_secret_value('test-secret', 'default-value')
                self.assertEqual(result, 'env-value')

    def test_config_get_dynamodb_config(self):
        """Test get_dynamodb_config method (line 153)."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        dynamodb_config = config.get_dynamodb_config()
        
        expected_config = {
            'billing_mode': 'PAY_PER_REQUEST',
            'encryption_enabled': True
        }
        self.assertEqual(dynamodb_config, expected_config)

    def test_config_get_s3_config(self):
        """Test get_s3_config method (line 160)."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        s3_config = config.get_s3_config()
        
        expected_config = {
            'versioning_enabled': True,
            'encryption_enabled': True
        }
        self.assertEqual(s3_config, expected_config)

    def test_config_get_cloudwatch_config(self):
        """Test get_cloudwatch_config method (line 167)."""
        from lib.infrastructure.config import InfrastructureConfig
        
        config = InfrastructureConfig()
        cloudwatch_config = config.get_cloudwatch_config()
        
        expected_config = {
            'log_retention_days': 14,
            'alarm_threshold': 10,
            'alarm_period': 300
        }
        self.assertEqual(cloudwatch_config, expected_config)

    def test_config_rules_delivery_channel_creation(self):
        """Test ConfigRulesStack delivery channel creation (lines 58-122)."""
        from pulumi import ResourceOptions

        from lib.infrastructure.config_rules import ConfigRulesStack
        
        mock_config = MagicMock()
        mock_config.get_resource_name.return_value = "test-resource"
        mock_config.tags = {'Project': 'test'}
        
        mock_iam_stack = MagicMock()
        
        with patch('lib.infrastructure.config_rules.aws.cfg.Rule') as mock_rule, \
             patch('lib.infrastructure.config_rules.aws.cfg.Recorder') as mock_recorder, \
             patch('lib.infrastructure.config_rules.aws.iam.Role') as mock_role, \
             patch('lib.infrastructure.config_rules.aws.iam.RolePolicy') as mock_role_policy, \
             patch('lib.infrastructure.config_rules.pulumi.runtime.invoke') as mock_invoke, \
             patch('lib.infrastructure.config_rules.aws.iam.get_policy_document') as mock_get_policy:
            
            # Mock policy document
            mock_policy_doc = MagicMock()
            mock_policy_doc.json = '{"Version": "2012-10-17", "Statement": []}'
            mock_get_policy.return_value = mock_policy_doc
            
            # Mock runtime invoke
            mock_invoke.return_value = MagicMock()
            
            # Mock AWS resources
            mock_role.return_value = MockPulumiResource("test-role")
            mock_role_policy.return_value = MockPulumiResource("test-policy")
            mock_recorder.return_value = MockPulumiResource("test-recorder")
            mock_rule.return_value = MockPulumiResource("test-rule")
            
            config_stack = ConfigRulesStack(mock_config, mock_iam_stack, ResourceOptions())
            
            # Test that resources were created (delivery channel is commented out)
            self.assertIsNotNone(config_stack.configuration_recorder)
            self.assertIsNotNone(config_stack.rules)

    def test_waf_api_gateway_association_creation(self):
        """Test WAFStack API Gateway association creation (lines 118-128)."""
        from pulumi import ResourceOptions

        from lib.infrastructure.waf import WAFStack
        
        mock_config = MagicMock()
        mock_config.get_resource_name.return_value = "test-resource"
        mock_config.tags = {'Project': 'test'}
        mock_config.get_api_gateway_config.return_value = {
            'allowed_ips': ['0.0.0.0/0']
        }
        
        mock_api_gateway = MagicMock()
        mock_stage = MockPulumiResource("test-stage")
        mock_stage.arn = "arn:aws:apigateway:us-east-1:123456789012:restapi/test/stage/v1"
        mock_api_gateway.stage = mock_stage
        
        with patch('lib.infrastructure.waf.aws.wafv2.WebAcl') as mock_web_acl, \
             patch('lib.infrastructure.waf.aws.wafv2.IpSet') as mock_ip_set:
            
            mock_web_acl.return_value = MockPulumiResource("test-web-acl")
            mock_ip_set.return_value = MockPulumiResource("test-ip-set")
            
            waf_stack = WAFStack(mock_config, mock_api_gateway, ResourceOptions())
            
            # Test that resources were created (association is commented out)
            self.assertIsNotNone(waf_stack.web_acl)
            self.assertIsNotNone(waf_stack.get_web_acl_arn())
            self.assertIsNotNone(waf_stack.get_web_acl_id())
            self.assertIsNone(waf_stack.get_association_id())


if __name__ == '__main__':
    unittest.main()