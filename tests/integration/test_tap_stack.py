"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import os
import unittest

import boto3
import pulumi
from pulumi import automation as auto

"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""


# class TestTapStackLiveIntegration(unittest.TestCase):
#   """Integration tests against live deployed Pulumi stack."""

#   def setUp(self):
#     """Set up integration test with live stack."""
#     self.stack_name = "dev"  # Your live Pulumi stack name (just the env part)
#     self.project_name = "tap-infra"  # Your Pulumi project name
#     self.s3_client = boto3.client('s3')
    
#     # Configure Pulumi to use S3 backend (not Pulumi Cloud)
#     self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')

class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure using actual deployment outputs."""
    
    def setUp(self):
        """Set up integration test with deployment outputs from environment or dep.txt."""
        # Read deployment outputs from environment variables or dep.txt file
        self.deployment_outputs = self._load_deployment_outputs()
        
        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda')
        self.s3_client = boto3.client('s3')
        self.apigateway_client = boto3.client('apigateway')
        self.sqs_client = boto3.client('sqs')
        self.sns_client = boto3.client('sns')
        self.cloudwatch_client = boto3.client('cloudwatch')
        self.ssm_client = boto3.client('ssm')
        self.xray_client = boto3.client('xray')
        self.iam_client = boto3.client('iam')

    def _load_deployment_outputs(self):
        """Load deployment outputs from environment variables."""
        # Get environment suffix (e.g., pr3158)
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Construct resource names using the environment suffix pattern
        outputs = {
            'api_gateway_id': os.getenv('API_GATEWAY_ID'),
            'api_gateway_url': os.getenv('API_GATEWAY_URL'),
            'dashboard_url': f"serverless-app-{env_suffix}-dashboard",
            'dlq_arn': os.getenv('DLQ_ARN'),
            'dlq_url': os.getenv('DLQ_URL'),
            'environment_variables': {
                "ENVIRONMENT": env_suffix,
                "PARAMETER_PREFIX": f"/serverless-app-{env_suffix}",
                "REGION": "us-east-1",
                "S3_BUCKET_NAME": os.getenv('S3_BUCKET_NAME', f"sa-{env_suffix}-tapsta-262252")
            },
            'failover_function_arn': os.getenv('FAILOVER_FUNCTION_ARN'),
            'failover_function_name': f"serverless-app-{env_suffix}-failover-failover",
            'lambda_function_arn': os.getenv('LAMBDA_FUNCTION_ARN'),
            'lambda_function_invoke_arn': os.getenv('LAMBDA_FUNCTION_INVOKE_ARN'),
            'lambda_function_name': f"serverless-app-{env_suffix}",
            'parameter_prefix': f"/serverless-app-{env_suffix}",
            's3_bucket_arn': os.getenv('S3_BUCKET_ARN'),
            's3_bucket_name': os.getenv('S3_BUCKET_NAME', f"sa-{env_suffix}-tapsta-262252"),
            'sns_topic_arn': os.getenv('SNS_TOPIC_ARN'),
            'xray_group_name': f"serverless-app-{env_suffix}-group"
        }
        
        # Override with actual values from environment if available
        if os.getenv('API_GATEWAY_ID'):
            outputs['api_gateway_id'] = os.getenv('API_GATEWAY_ID')
        if os.getenv('API_GATEWAY_URL'):
            outputs['api_gateway_url'] = os.getenv('API_GATEWAY_URL')
        if os.getenv('S3_BUCKET_NAME'):
            outputs['s3_bucket_name'] = os.getenv('S3_BUCKET_NAME')
            outputs['s3_bucket_arn'] = f"arn:aws:s3:::{os.getenv('S3_BUCKET_NAME')}"
            outputs['environment_variables']['S3_BUCKET_NAME'] = os.getenv('S3_BUCKET_NAME')
        
        return outputs

    def test_lambda_function_exists_and_active(self):
        """Test that main Lambda function exists and is active."""
        function_name = self.deployment_outputs['lambda_function_name']
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
        except Exception as e:
            self.fail(f"Failed to get Lambda function {function_name}: {e}")
        
        # Test function exists and is active
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Timeout'], 180)  # 3 minutes
        self.assertEqual(response['Configuration']['MemorySize'], 128)
        
        # Test X-Ray tracing is enabled
        self.assertTrue(response['Configuration']['TracingConfig']['Mode'] == 'Active')
        
        # Test environment variables match deployment outputs
        env_vars = response['Configuration']['Environment']['Variables']
        expected_env_vars = self.deployment_outputs.get('environment_variables', {})
        for key, expected_value in expected_env_vars.items():
            self.assertEqual(env_vars[key], expected_value)

    def test_failover_lambda_function_exists(self):
        """Test that failover Lambda function exists and is active."""
        function_name = self.deployment_outputs['failover_function_name']
        
        response = self.lambda_client.get_function(FunctionName=function_name)
        
        # Test function exists and is active
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Timeout'], 180)  # 3 minutes

    def test_s3_bucket_exists_and_configured(self):
        """Test that S3 bucket exists and is properly configured."""
        bucket_name = self.deployment_outputs['s3_bucket_name']
        
        try:
            # Test bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Test bucket versioning
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning['Status'], 'Enabled')
            
            # Test bucket encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            
            # Test bucket public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['BlockPublicAcls'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['BlockPublicPolicy'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['IgnorePublicAcls'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['RestrictPublicBuckets'])
        except Exception as e:
            self.fail(f"Failed to verify S3 bucket {bucket_name}: {e}")

    def test_api_gateway_exists_and_configured(self):
        """Test that API Gateway exists and is properly configured."""
        api_id = self.deployment_outputs['api_gateway_id']
        
        # Test API exists
        response = self.apigateway_client.get_rest_api(restApiId=api_id)
        self.assertEqual(response['id'], api_id)
        # Don't hardcode the name - just check it exists and is not empty
        self.assertIsNotNone(response['name'])
        self.assertNotEqual(response['name'], '')
        
        # Test API has resources
        resources = self.apigateway_client.get_resources(restApiId=api_id)
        self.assertGreater(len(resources['items']), 0)
        
        # Test API has stages - don't hardcode stage name
        stages = self.apigateway_client.get_stages(restApiId=api_id)
        self.assertGreater(len(stages['item']), 0)

    def test_dead_letter_queue_exists(self):
        """Test that Dead Letter Queue exists and is configured."""
        dlq_arn = self.deployment_outputs['dlq_arn']
        
        # Extract queue name from ARN
        queue_name = dlq_arn.split(':')[-1]
        
        try:
            # Get account ID
            account_id = self.sqs_client.get_caller_identity()['Account']
            
            # Test queue exists
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=f"https://sqs.us-east-1.amazonaws.com/{account_id}/{queue_name}",
                AttributeNames=['All']
            )
            
            # Verify queue exists and has correct retention period
            self.assertIn('QueueArn', response['Attributes'])
            self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '1209600')  # 14 days
        except Exception as e:
            self.fail(f"Failed to verify DLQ {queue_name}: {e}")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists."""
        topic_arn = self.deployment_outputs['sns_topic_arn']
        
        # Skip if no SNS topic ARN provided
        if not topic_arn or '***' in topic_arn:
            self.skipTest("SNS topic ARN not available or contains placeholder values")
        
        try:
            # Test topic exists
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertEqual(response['Attributes']['TopicArn'], topic_arn)
        except Exception as e:
            self.fail(f"Failed to verify SNS topic {topic_arn}: {e}")

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        dashboard_name = self.deployment_outputs['dashboard_url']
        
        # Test dashboard exists
        response = self.cloudwatch_client.get_dashboards()
        dashboard_names = [dashboard['DashboardName'] for dashboard in response['DashboardEntries']]
        self.assertIn(dashboard_name, dashboard_names)

    def test_xray_group_exists(self):
        """Test that X-Ray group exists."""
        group_name = self.deployment_outputs['xray_group_name']
        
        # Test group exists
        response = self.xray_client.get_group(GroupName=group_name)
        self.assertEqual(response['Group']['GroupName'], group_name)

    def test_parameter_store_parameters_exist(self):
        """Test that Parameter Store parameters exist."""
        parameter_prefix = self.deployment_outputs['parameter_prefix']
        
        # Test parameters exist
        response = self.ssm_client.get_parameters_by_path(Path=parameter_prefix, Recursive=True)
        self.assertGreater(len(response['Parameters']), 0)
        
        # Test that parameters have the correct prefix
        for param in response['Parameters']:
            self.assertTrue(param['Name'].startswith(parameter_prefix), 
                          f"Parameter {param['Name']} should start with {parameter_prefix}")

    def test_lambda_iam_role_exists(self):
        """Test that Lambda execution role exists and has correct permissions."""
        function_name = self.deployment_outputs['lambda_function_name']
        
        # Get function configuration
        response = self.lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        
        # Test role exists
        role_name = role_arn.split('/')[-1]
        role_response = self.iam_client.get_role(RoleName=role_name)
        self.assertEqual(role_response['Role']['RoleName'], role_name)
        
        # Test role has correct trust policy
        trust_policy = role_response['Role']['AssumeRolePolicyDocument']
        self.assertIn('lambda.amazonaws.com', str(trust_policy))

    def test_api_gateway_lambda_integration(self):
        """Test that API Gateway is properly integrated with Lambda."""
        api_id = self.deployment_outputs['api_gateway_id']
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        
        # Get API resources
        resources = self.apigateway_client.get_resources(restApiId=api_id)
        
        # Find the ANY method resource
        any_resource = None
        for resource in resources['items']:
            if resource['path'] == '/{proxy+}':
                any_resource = resource
                break
        
        self.assertIsNotNone(any_resource, "API Gateway should have {proxy+} resource")
        
        # Test integration exists
        methods = self.apigateway_client.get_method(
            restApiId=api_id,
            resourceId=any_resource['id'],
            httpMethod='ANY'
        )
        
        # Test integration type
        integration = self.apigateway_client.get_integration(
            restApiId=api_id,
            resourceId=any_resource['id'],
            httpMethod='ANY'
        )
        
        self.assertEqual(integration['type'], 'AWS_PROXY')
        self.assertIn(lambda_function_name, integration['uri'])

    def test_lambda_dead_letter_queue_configuration(self):
        """Test that Lambda is configured with Dead Letter Queue."""
        function_name = self.deployment_outputs['lambda_function_name']
        dlq_arn = self.deployment_outputs['dlq_arn']
        
        # Get function configuration
        response = self.lambda_client.get_function(FunctionName=function_name)
        
        # Test DLQ configuration
        self.assertIn('DeadLetterConfig', response['Configuration'])
        self.assertEqual(response['Configuration']['DeadLetterConfig']['TargetArn'], dlq_arn)

    def test_environment_variables_consistency(self):
        """Test that environment variables are consistent across deployment."""
        expected_env_vars = self.deployment_outputs['environment_variables']
        
        # Test Lambda function environment variables
        function_name = self.deployment_outputs['lambda_function_name']
        response = self.lambda_client.get_function(FunctionName=function_name)
        actual_env_vars = response['Configuration']['Environment']['Variables']
        
        for key, expected_value in expected_env_vars.items():
            self.assertEqual(actual_env_vars[key], expected_value)

    def test_infrastructure_completeness(self):
        """Test that all expected infrastructure components are deployed."""
        # Test all major components exist
        components = [
            ('Lambda Function', self.deployment_outputs['lambda_function_name']),
            ('Failover Lambda', self.deployment_outputs['failover_function_name']),
            ('S3 Bucket', self.deployment_outputs['s3_bucket_name']),
            ('API Gateway', self.deployment_outputs['api_gateway_id']),
            ('SNS Topic', self.deployment_outputs['sns_topic_arn']),
            ('Dead Letter Queue', self.deployment_outputs['dlq_arn']),
            ('X-Ray Group', self.deployment_outputs['xray_group_name']),
            ('CloudWatch Dashboard', self.deployment_outputs['dashboard_url'])
        ]
        
        for component_name, component_id in components:
            self.assertIsNotNone(component_id, f"{component_name} should have an ID")
            self.assertNotEqual(component_id, "", f"{component_name} ID should not be empty")

    def test_security_configurations(self):
        """Test that security configurations are properly set."""
        # Test S3 bucket security
        bucket_name = self.deployment_outputs['s3_bucket_name']
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        
        # All public access should be blocked
        for setting in ['BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets']:
            self.assertTrue(public_access['PublicAccessBlockConfiguration'][setting])
        
        # Test Lambda function security (X-Ray tracing)
        function_name = self.deployment_outputs['lambda_function_name']
        response = self.lambda_client.get_function(FunctionName=function_name)
        self.assertEqual(response['Configuration']['TracingConfig']['Mode'], 'Active')

    def test_monitoring_setup(self):
        """Test that monitoring is properly configured."""
        # Test CloudWatch dashboard
        dashboard_name = self.deployment_outputs['dashboard_url']
        response = self.cloudwatch_client.get_dashboards()
        dashboard_names = [dashboard['DashboardName'] for dashboard in response['DashboardEntries']]
        self.assertIn(dashboard_name, dashboard_names)
        
        # Test X-Ray group
        group_name = self.deployment_outputs['xray_group_name']
        response = self.xray_client.get_group(GroupName=group_name)
        self.assertEqual(response['Group']['GroupName'], group_name)
        
        # Test SNS topic for notifications
        topic_arn = self.deployment_outputs['sns_topic_arn']
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        self.assertEqual(response['Attributes']['TopicArn'], topic_arn)
    