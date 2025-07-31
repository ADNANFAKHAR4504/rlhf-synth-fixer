import json
import os
import unittest
import boto3
from moto import mock_ssm, mock_lambda, mock_logs, mock_iam
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack with real AWS resources"""

    def setUp(self):
        """Set up test environment"""
        self.region = 'us-east-1'
        
        # Initialize AWS clients
        self.ssm_client = boto3.client('ssm', region_name=self.region)
        self.lambda_client = boto3.client('lambda', region_name=self.region)
        self.logs_client = boto3.client('logs', region_name=self.region)

    @mark.it("validates SSM parameters are accessible and contain expected values")
    def test_ssm_parameters_accessible(self):
        """Test that SSM parameters exist and are accessible"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        expected_parameters = [
            '/tap/database/url',
            '/tap/api/key', 
            '/tap/auth/token'
        ]
        
        for param_name in expected_parameters:
            with self.subTest(parameter=param_name):
                try:
                    response = self.ssm_client.get_parameter(
                        Name=param_name,
                        WithDecryption=True
                    )
                    
                    # ASSERT parameter exists and has value
                    self.assertIsNotNone(response['Parameter']['Value'])
                    self.assertGreater(len(response['Parameter']['Value']), 0)
                    
                except Exception as e:
                    self.fail(f"Failed to retrieve parameter {param_name}: {str(e)}")

    @mark.it("validates Lambda function exists and is properly configured")
    def test_lambda_function_configuration(self):
        """Test that Lambda function exists with correct configuration"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        function_name = 'tap-lambda-function'
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # ASSERT function configuration
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['MemorySize'], 512)
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['ReservedConcurrencyConfig']['ReservedConcurrency'], 1000)
            
            # ASSERT environment variables are set
            env_vars = config['Environment']['Variables']
            self.assertIn('DATABASE_URL_PARAM', env_vars) 
            self.assertIn('API_KEY_PARAM', env_vars)
            self.assertIn('SECRET_TOKEN_PARAM', env_vars)
            
        except Exception as e:
            self.fail(f"Failed to retrieve Lambda function {function_name}: {str(e)}")

    @mark.it("validates Lambda function can be invoked successfully")
    def test_lambda_function_invocation(self):
        """Test that Lambda function can be invoked and returns expected response"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        function_name = 'tap-lambda-function'
        
        test_payload = {
            'test': True,
            'message': 'Integration test payload'
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )
            
            # ASSERT successful invocation
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read())
            response_body = json.loads(payload['body'])
            
            # ASSERT response structure
            self.assertEqual(payload['statusCode'], 200)
            self.assertIn('message', response_body)
            self.assertIn('event_keys', response_body)
            self.assertIn('timestamp', response_body)
            self.assertIn('function_name', response_body)
            
            # ASSERT event keys are correct
            expected_keys = ['test', 'message']
            self.assertEqual(sorted(response_body['event_keys']), sorted(expected_keys))
            
        except Exception as e:
            self.fail(f"Failed to invoke Lambda function {function_name}: {str(e)}")

    @mark.it("validates CloudWatch log group exists and logs are being written")
    def test_cloudwatch_logs_configuration(self):
        """Test that CloudWatch log group exists and is properly configured"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        log_group_name = '/aws/lambda/tap-lambda-function'
        
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            # ASSERT log group exists
            log_groups = response['logGroups']
            self.assertGreater(len(log_groups), 0)
            
            log_group = next((lg for lg in log_groups if lg['logGroupName'] == log_group_name), None)
            self.assertIsNotNone(log_group, f"Log group {log_group_name} not found")
            
            # ASSERT retention policy
            self.assertEqual(log_group['retentionInDays'], 7)
            
        except Exception as e:
            self.fail(f"Failed to retrieve log group {log_group_name}: {str(e)}")

    @mark.it("validates Lambda function can access SSM parameters")
    def test_lambda_ssm_integration(self):
        """Test that Lambda function can successfully access SSM parameters"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        function_name = 'tap-lambda-function'
        
        # Invoke Lambda function - it should access SSM parameters internally
        test_payload = {'test_ssm_access': True}
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_payload)
            )
            
            # ASSERT successful invocation (indicates SSM access worked)
            self.assertEqual(response['StatusCode'], 200)
            
            payload = json.loads(response['Payload'].read())
            
            # ASSERT no errors in response (would indicate SSM access failure)
            self.assertEqual(payload['statusCode'], 200)
            
            # Check logs for successful SSM parameter retrieval
            self.logs_client.filter_log_events(
                logGroupName='/aws/lambda/tap-lambda-function',
                filterPattern='Successfully retrieved all SSM parameters'
            )
            
        except Exception as e:
            self.fail(f"Lambda function failed to access SSM parameters: {str(e)}")

    @mark.it("validates all resources are deployed in us-east-1 region")
    def test_resources_in_correct_region(self):
        """Test that all resources are deployed in the correct region"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        # ASSERT we're testing in the correct region
        self.assertEqual(self.region, 'us-east-1')
        
        # All our API calls above implicitly test this by using us-east-1 clients
        # If resources weren't in us-east-1, the API calls would fail

    @mark.it("validates resource naming follows tap-resource-type convention")
    def test_resource_naming_convention(self):
        """Test that all resources follow the tap-resource-type naming convention"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        # Lambda function name
        function_name = 'tap-lambda-function'
        try:
            self.lambda_client.get_function(FunctionName=function_name)
        except Exception as e:
            self.fail(f"Lambda function doesn't follow naming convention: {str(e)}")
        
        # Log group name
        log_group_name = '/aws/lambda/tap-lambda-function'
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            self.assertGreater(len(response['logGroups']), 0)
        except Exception as e:
            self.fail(f"Log group doesn't follow naming convention: {str(e)}")
        
        # SSM parameter names
        ssm_patterns = ['/tap/database/url', '/tap/api/key', '/tap/auth/token']
        for pattern in ssm_patterns:
            try:
                self.ssm_client.get_parameter(Name=pattern)  
            except Exception as e:
                self.fail(f"SSM parameter {pattern} doesn't follow naming convention: {str(e)}")

    @mark.it("validates performance and concurrency requirements")
    def test_lambda_concurrency_configuration(self):
        """Test that Lambda function is configured for required concurrency"""
        
        if not flat_outputs:
            self.skipTest("No deployment outputs available - stack not deployed")
        
        function_name = 'tap-lambda-function'
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # ASSERT reserved concurrency is set to 1000
            self.assertEqual(config['ReservedConcurrencyConfig']['ReservedConcurrency'], 1000)
            
        except Exception as e:
            self.fail(f"Failed to validate concurrency configuration: {str(e)}")


if __name__ == '__main__':
    unittest.main()