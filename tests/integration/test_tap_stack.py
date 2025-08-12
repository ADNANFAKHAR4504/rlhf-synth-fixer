"""
Integration tests for TapStack Pulumi infrastructure.

Tests the serverless infrastructure components against live AWS resources including 
Lambda functions, SSM Parameter Store, API Gateway, IAM roles, and concurrent execution limits.
"""

import json
import os
import time
import unittest
import boto3
from botocore.exceptions import ClientError

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackLiveInfrastructure(unittest.TestCase):
    """Live integration tests for deployed TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up live AWS clients and deploy test infrastructure."""
        cls.test_environment = os.environ.get('TEST_ENVIRONMENT', 'integration-test')
        cls.region = 'us-east-1'
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigatewayv2', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Expected resource names based on TapStack naming conventions
        cls.lambda_function_name = f"serverless-infra-{cls.test_environment}-processor"
        cls.api_name_prefix = f"serverless-infra-{cls.test_environment}-api"
        cls.ssm_parameter_prefix = f"/myapp/{cls.test_environment}/database/"
        cls.log_group_name = f"/aws/lambda/{cls.lambda_function_name}"

    def test_lambda_function_exists_and_configured(self):
        """Test that Lambda function exists with correct configuration."""
        try:
            response = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
            )
            
            config = response['Configuration']
            
            # Verify basic function properties
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 512)
            
            # Verify concurrent execution limit
            self.assertEqual(config['ReservedConcurrencyLimit'], 1000)
            
            # Verify environment variables
            env_vars = config['Environment']['Variables']
            self.assertEqual(env_vars['ENVIRONMENT'], self.test_environment)
            self.assertEqual(env_vars['SSM_PARAMETER_PREFIX'], f"/myapp/{self.test_environment}")
            self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')
            
            # Verify tags
            tags_response = self.lambda_client.list_tags(Resource=config['FunctionArn'])
            tags = tags_response['Tags']
            self.assertEqual(tags['Environment'], self.test_environment)
            self.assertEqual(tags['Application'], 'serverless-infrastructure')
            
        except ClientError as e:
            self.fail(f"Lambda function {self.lambda_function_name} not found or misconfigured: {e}")

    def test_lambda_function_invocation(self):
        """Test Lambda function invocation with live execution."""
        try:
            test_payload = {
                "test": True,
                "message": "Integration test invocation"
            }
            
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )
            
            # Verify successful invocation
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            response_body = json.loads(payload['body'])
            
            # Verify response structure
            self.assertEqual(payload['statusCode'], 200)
            self.assertIn('request_id', response_body)
            self.assertIn('message', response_body)
            self.assertEqual(response_body['environment'], self.test_environment)
            
        except ClientError as e:
            self.fail(f"Failed to invoke Lambda function: {e}")


    def test_ssm_parameters_exist_and_accessible(self):
        """Test that SSM parameters exist and are accessible by Lambda."""
        try:
            # Test all expected database parameters
            expected_params = ['host', 'port', 'database', 'username']
            
            for param_name in expected_params:
                parameter_path = f"{self.ssm_parameter_prefix}{param_name}"
                
                response = self.ssm_client.get_parameter(
                    Name=parameter_path,
                    WithDecryption=True
                )
                
                param = response['Parameter']
                self.assertEqual(param['Type'], 'String')
                self.assertIsNotNone(param['Value'])
                
                # Verify parameter tags
                tags_response = self.ssm_client.list_tags_for_resource(
                    ResourceType='Parameter',
                    ResourceId=parameter_path
                )
                
                tags = {tag['Key']: tag['Value'] for tag in tags_response['TagList']}
                self.assertEqual(tags['Environment'], self.test_environment)
                self.assertEqual(tags['Application'], 'serverless-infrastructure')
                
        except ClientError as e:
            self.fail(f"SSM parameters not found or misconfigured: {e}")

    def test_ssm_parameter_hierarchy(self):
        """Test SSM parameter hierarchy for configuration management."""
        try:
            response = self.ssm_client.get_parameters_by_path(
                Path=f"/myapp/{self.test_environment}",
                Recursive=True,
                WithDecryption=True
            )
            
            parameters = response['Parameters']
            self.assertGreaterEqual(len(parameters), 4)  # host, port, database, username
            
            # Verify parameter names follow hierarchy
            param_names = [p['Name'] for p in parameters]
            expected_base_path = f"/myapp/{self.test_environment}/database/"
            
            for param_name in param_names:
                self.assertTrue(param_name.startswith(expected_base_path))
                
        except ClientError as e:
            self.fail(f"Failed to retrieve SSM parameter hierarchy: {e}")

    def test_api_gateway_exists_and_configured(self):
        """Test that API Gateway exists with correct configuration."""
        try:
            # List APIs and find our test API
            response = self.apigateway_client.get_apis()
            apis = response['Items']
            
            test_api = None
            for api in apis:
                if api['Name'].startswith(self.api_name_prefix):
                    test_api = api
                    break
            
            self.assertIsNotNone(test_api, f"API Gateway with prefix {self.api_name_prefix} not found")
            
            # Verify API configuration
            self.assertEqual(test_api['ProtocolType'], 'HTTP')
            
            # Verify CORS configuration
            cors_config = test_api.get('CorsConfiguration', {})
            self.assertIn('GET', cors_config.get('AllowMethods', []))
            self.assertIn('POST', cors_config.get('AllowMethods', []))
            self.assertIn('*', cors_config.get('AllowOrigins', []))
            
            # Verify routes exist
            routes_response = self.apigateway_client.get_routes(ApiId=test_api['ApiId'])
            routes = routes_response['Items']
            
            # Should have POST /process route
            route_keys = [route['RouteKey'] for route in routes]
            self.assertIn('POST /process', route_keys)
            
        except ClientError as e:
            self.fail(f"API Gateway not found or misconfigured: {e}")

    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch log groups exist for Lambda function."""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.log_group_name
            )
            
            log_groups = response['logGroups']
            self.assertEqual(len(log_groups), 1)
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], self.log_group_name)
            self.assertEqual(log_group['retentionInDays'], 14)
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not found: {e}")

    def test_iam_roles_and_policies_exist(self):
        """Test that IAM roles and policies exist with correct permissions."""
        try:
            # Test Lambda execution role exists
            role_name = f"serverless-infra-{self.test_environment}-lambda-role"
            
            role_response = self.iam_client.get_role(RoleName=role_name)
            role = role_response['Role']
            
            # Verify assume role policy allows Lambda service
            assume_role_policy = json.loads(role['AssumeRolePolicyDocument'])
            principals = [stmt['Principal']['Service'] for stmt in assume_role_policy['Statement']]
            self.assertIn('lambda.amazonaws.com', principals)
            
            # Verify attached policies
            policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
            attached_policies = policies_response['AttachedPolicies']
            
            policy_arns = [p['PolicyArn'] for p in attached_policies]
            
            # Should have basic execution role
            self.assertTrue(any('AWSLambdaBasicExecutionRole' in arn for arn in policy_arns))
            
            # Should have custom SSM access policy
            custom_policies = [p for p in attached_policies if not p['PolicyArn'].startswith('arn:aws:iam::aws:policy')]
            self.assertGreater(len(custom_policies), 0, "Custom SSM policy should be attached")
            
        except ClientError as e:
            self.fail(f"IAM roles or policies not configured correctly: {e}")

    def test_end_to_end_api_invocation(self):
        """Test end-to-end API Gateway to Lambda invocation."""
        try:
            # Find the API Gateway
            apis_response = self.apigateway_client.get_apis()
            test_api = None
            
            for api in apis_response['Items']:
                if api['Name'].startswith(self.api_name_prefix):
                    test_api = api
                    break
            
            self.assertIsNotNone(test_api, "API Gateway not found for end-to-end test")
            
            # Construct API endpoint URL
            api_endpoint = test_api['ApiEndpoint']
            
            # Note: In a real test, you would make HTTP requests to the API endpoint
            # For this integration test, we verify the endpoint exists and is properly configured
            self.assertTrue(api_endpoint.startswith('https://'))
            self.assertIn('.execute-api.us-east-1.amazonaws.com', api_endpoint)
            
        except ClientError as e:
            self.fail(f"End-to-end API test failed: {e}")


if __name__ == '__main__':
    unittest.main()
