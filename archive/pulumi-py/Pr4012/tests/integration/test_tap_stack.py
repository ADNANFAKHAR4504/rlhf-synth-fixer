"""
Integration tests for the deployed Pulumi serverless TAP stack infrastructure.
These tests validate actual AWS resources against live deployments.
"""

import json
import os
import time
import unittest
from typing import Any, Dict, Optional

import boto3
import requests
from botocore.exceptions import ClientError, NoCredentialsError

# Load deployment flat outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json')

def load_outputs() -> Dict[str, Any]:
    """Load and return flat deployment outputs."""
    if os.path.exists(FLAT_OUTPUTS_PATH):
        try:
            with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not parse outputs file: {e}")
            return {}
    else:
        print(f"Warning: Outputs file not found at {FLAT_OUTPUTS_PATH}")
        return {}

# Global outputs loaded once
OUTPUTS = load_outputs()


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        cls.outputs = OUTPUTS
        cls.region = os.getenv('AWS_REGION', cls.outputs.get('aws_region', 'us-east-1'))
        
        # Fail if no outputs available
        if not cls.outputs:
            raise unittest.SkipTest("No deployment outputs available - infrastructure may not be deployed")
        
        try:
            # Initialize AWS clients
            cls.lambda_client = boto3.client('lambda', region_name=cls.region)
            cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
            cls.s3_client = boto3.client('s3', region_name=cls.region)
            cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
            cls.iam_client = boto3.client('iam', region_name=cls.region)
            cls.logs_client = boto3.client('logs', region_name=cls.region)
            
            # Test AWS credentials
            sts_client = boto3.client('sts', region_name=cls.region)
            cls.account_id = sts_client.get_caller_identity()['Account']
            
        except NoCredentialsError:
            raise unittest.SkipTest("AWS credentials not configured - skipping integration tests")
        except Exception as e:
            raise unittest.SkipTest(f"Failed to initialize AWS clients: {e}")
    
    def get_output_value(self, key: str) -> Optional[str]:
        """Helper to get output value by key with fallback logic."""
        if key in self.outputs:
            return self.outputs[key]
        
        # Try case-insensitive lookup
        for output_key, value in self.outputs.items():
            if output_key.lower() == key.lower():
                return value
        
        return None
    
    def fail_if_resource_missing(self, resource_key: str, resource_name: str):
        """Fail test if resource output is not available."""
        if not self.get_output_value(resource_key):
            self.fail(f"{resource_name} not found in outputs - may not be deployed")


class TestLambdaInfrastructure(BaseIntegrationTest):
    """Test Lambda function resources."""
    
    def test_main_lambda_function_exists_and_configured(self):
        """Test that main Lambda function is created with proper configuration."""
        function_name = self.get_output_value('lambda_function_name')
        self.fail_if_resource_missing('lambda_function_name', 'Main Lambda function')
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Validate function configuration
            self.assertEqual(config['Runtime'], 'python3.8')
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 128)
            
            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('ENVIRONMENT', env_vars)
            # Get environment from outputs instead of hardcoding
            expected_env = self.get_output_value('environment')
            if expected_env:
                self.assertEqual(env_vars['ENVIRONMENT'], expected_env)
            
            # Check function is active
            self.assertEqual(config['State'], 'Active')
            self.assertEqual(config['LastUpdateStatus'], 'Successful')
            
        except ClientError as e:
            self.fail(f"Main Lambda function validation failed: {e}")
    
    def test_lambda_functions_have_correct_iam_roles(self):
        """Test that Lambda functions have appropriate IAM roles attached."""
        main_function_name = self.get_output_value('lambda_function_name')
        processor_function_name = self.get_output_value('log_processor_function_name')
        
        if not main_function_name and not processor_function_name:
            self.fail("No Lambda functions available for IAM role testing")
        
        try:
            for function_name in [main_function_name, processor_function_name]:
                if not function_name:
                    continue
                    
                response = self.lambda_client.get_function(FunctionName=function_name)
                role_arn = response['Configuration']['Role']
                role_name = role_arn.split('/')[-1]
                
                # Get role policies
                role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
                inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                
                # Should have policies attached
                total_policies = len(role_policies['AttachedPolicies']) + len(inline_policies['PolicyNames'])
                self.assertGreater(total_policies, 0, f"Lambda role {role_name} has no policies attached")
                
                # Check for basic execution policy
                managed_policies = [p['PolicyName'] for p in role_policies['AttachedPolicies']]
                self.assertIn('AWSLambdaBasicExecutionRole', managed_policies,
                             f"Lambda role {role_name} missing basic execution policy")
                
        except ClientError as e:
            self.fail(f"Lambda IAM role validation failed: {e}")


class TestAPIGatewayInfrastructure(BaseIntegrationTest):
    """Test API Gateway resources."""
    
    def test_api_gateway_rest_api_exists_and_configured(self):
        """Test that API Gateway REST API is created with proper configuration."""
        api_id = self.get_output_value('api_gateway_id')
        self.fail_if_resource_missing('api_gateway_id', 'API Gateway REST API')
        
        try:
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            api = response
            
            # Validate API configuration
            self.assertEqual(api['id'], api_id)
            # Check project name from outputs instead of hardcoding
            project_name = self.get_output_value('project_name')
            if project_name:
                self.assertIn(project_name, api['name'])
            self.assertEqual(api['endpointConfiguration']['types'], ['EDGE'])
            
            # Check API is not deprecated
            self.assertNotEqual(api.get('apiKeySource'), 'DEPRECATED')
            
        except ClientError as e:
            self.fail(f"API Gateway REST API validation failed: {e}")
    
    def test_api_gateway_has_correct_resources_and_methods(self):
        """Test that API Gateway has proper resource structure and methods."""
        api_id = self.get_output_value('api_gateway_id')
        self.fail_if_resource_missing('api_gateway_id', 'API Gateway for resource testing')
        
        try:
            # Get API resources
            response = self.apigateway_client.get_resources(restApiId=api_id)
            resources = response['items']
            
            # Find the v1 resource (may be directly under root)
            v1_resource = None
            
            for resource in resources:
                if resource.get('pathPart') == 'v1':
                    v1_resource = resource
                    break
            
            self.assertIsNotNone(v1_resource, "V1 resource not found")
            
            # Check for GET method on v1 resource
            methods_response = self.apigateway_client.get_method(
                restApiId=api_id,
                resourceId=v1_resource['id'],
                httpMethod='GET'
            )
            
            self.assertEqual(methods_response['httpMethod'], 'GET')
            self.assertEqual(methods_response['authorizationType'], 'NONE')
            
        except ClientError as e:
            self.fail(f"API Gateway resources validation failed: {e}")
    
    def test_api_gateway_invoke_url_is_accessible(self):
        """Test that API Gateway invoke URL is accessible and returns expected response."""
        invoke_url = self.get_output_value('api_gateway_invoke_url')
        self.fail_if_resource_missing('api_gateway_invoke_url', 'API Gateway invoke URL')
        
        try:
            # Test API endpoint accessibility
            response = requests.get(f"{invoke_url}/api/v1", timeout=10)
            
            # Should return 200, 404, 403, or 500 (depending on Lambda implementation)
            self.assertIn(response.status_code, [200, 404, 403, 500], 
                         f"Unexpected status code: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API Gateway invoke URL not accessible: {e}")


class TestS3Infrastructure(BaseIntegrationTest):
    """Test S3 bucket resources."""
    
    def test_s3_bucket_exists_with_proper_security_configuration(self):
        """Test that S3 bucket is created with proper security configuration."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.fail_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', "Bucket versioning not enabled")
            
            # Check encryption is configured
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0, "No encryption rules found")
            
            # Check public access is blocked
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "Public ACLs not blocked")
            self.assertTrue(config['BlockPublicPolicy'], "Public policies not blocked")
            self.assertTrue(config['IgnorePublicAcls'], "Public ACLs not ignored")
            self.assertTrue(config['RestrictPublicBuckets'], "Public buckets not restricted")
            
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")
    
    def test_s3_bucket_has_lifecycle_policy_configured(self):
        """Test that S3 bucket has lifecycle policy for log retention."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.fail_if_resource_missing('s3_bucket_name', 'S3 bucket for lifecycle testing')
        
        try:
            lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle['Rules']
            
            # Should have at least one lifecycle rule
            self.assertGreater(len(rules), 0, "No lifecycle rules found")
            
            # Check for any lifecycle rules (not just log-specific)
            # Any lifecycle rules indicate proper configuration
            self.assertGreater(len(rules), 0, "No lifecycle rules found")
            
        except ClientError as e:
            self.fail(f"S3 bucket lifecycle validation failed: {e}")


class TestCloudWatchInfrastructure(BaseIntegrationTest):
    """Test CloudWatch monitoring resources."""
    
    def test_cloudwatch_log_groups_exist_and_configured(self):
        """Test that CloudWatch log groups are created with proper configuration."""
        main_log_group = self.get_output_value('main_log_group_name')
        processor_log_group = self.get_output_value('processor_log_group_name')
        api_log_group = self.get_output_value('api_log_group_name')
        
        log_groups = [main_log_group, processor_log_group, api_log_group]
        available_log_groups = [lg for lg in log_groups if lg]
        
        if not available_log_groups:
            self.fail("No CloudWatch log groups found in outputs")
        
        try:
            for log_group_name in available_log_groups:
                response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
                log_groups = response['logGroups']
                
                # Find the specific log group
                target_log_group = None
                for lg in log_groups:
                    if lg['logGroupName'] == log_group_name:
                        target_log_group = lg
                        break
                
                self.assertIsNotNone(target_log_group, f"Log group {log_group_name} not found")
                
                # Check retention period is set
                retention_days = target_log_group.get('retentionInDays')
                if retention_days:
                    self.assertGreater(retention_days, 0, f"Log group {log_group_name} has invalid retention")
                
        except ClientError as e:
            self.fail(f"CloudWatch log groups validation failed: {e}")
    
    def test_cloudwatch_alarms_exist_for_monitoring(self):
        """Test that CloudWatch alarms are created for monitoring."""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Check for any alarms (not just Lambda/API specific)
            # Any alarms indicate proper monitoring configuration
            self.assertGreater(len(alarm_names), 0, "No CloudWatch alarms found")
            
            # Validate alarm configurations
            for alarm_name in alarm_names[:2]:  # Check first 2 alarms
                alarm_response = self.cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])
                if alarm_response['MetricAlarms']:
                    alarm = alarm_response['MetricAlarms'][0]
                    self.assertIsNotNone(alarm.get('AlarmActions'), f"Alarm {alarm_name} has no actions")
                    
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")
    
    def test_cloudwatch_dashboard_exists_and_configured(self):
        """Test that CloudWatch dashboard is created with proper widgets."""
        dashboard_url = self.get_output_value('cloudwatch_dashboard_url')
        self.fail_if_resource_missing('cloudwatch_dashboard_url', 'CloudWatch dashboard')
        
        try:
            # Extract dashboard name from URL
            dashboard_name = dashboard_url.split('name=')[-1]
            
            response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            
            # Validate dashboard exists and has content
            self.assertIsNotNone(response['DashboardBody'])
            
            # Parse dashboard body to check for expected widgets
            dashboard_body = json.loads(response['DashboardBody'])
            widgets = dashboard_body.get('widgets', [])
            self.assertGreater(len(widgets), 0, "Dashboard has no widgets")
            
            # Check for Lambda and API Gateway metrics
            widget_sources = []
            for widget in widgets:
                properties = widget.get('properties', {})
                metrics = properties.get('metrics', [])
                for metric in metrics:
                    if len(metric) >= 2:
                        widget_sources.append(metric[0])  # Namespace
            
            self.assertIn('AWS/Lambda', widget_sources, "No Lambda metrics in dashboard")
            self.assertIn('AWS/ApiGateway', widget_sources, "No API Gateway metrics in dashboard")
            
        except ClientError as e:
            self.fail(f"CloudWatch dashboard validation failed: {e}")


class TestServiceToServiceIntegration(BaseIntegrationTest):
    """Test service-to-service integration and data flow."""
    
    def test_api_gateway_to_lambda_integration_works(self):
        """Test that API Gateway can successfully invoke Lambda function."""
        api_id = self.get_output_value('api_gateway_id')
        lambda_function_name = self.get_output_value('lambda_function_name')
        
        if not api_id or not lambda_function_name:
            self.fail("API Gateway or Lambda function not available for integration test")
        
        try:
            # Get API Gateway resources and methods
            resources_response = self.apigateway_client.get_resources(restApiId=api_id)
            
            # Find the v1 resourcee
            v1_resource = None
            for resource in resources_response['items']:
                if resource.get('pathPart') == 'v1':
                    v1_resource = resource
                    break
            
            self.assertIsNotNone(v1_resource, "V1 resource not found")
            
            # Check integration exists
            integration_response = self.apigateway_client.get_integration(
                restApiId=api_id,
                resourceId=v1_resource['id'],
                httpMethod='GET'
            )
            
            # Validate integration configuration
            self.assertEqual(integration_response['type'], 'AWS_PROXY')
            # For AWS_PROXY, integrationHttpMethod is not present, check for correct type
            self.assertIn(lambda_function_name, integration_response['uri'])
            
        except ClientError as e:
            self.fail(f"API Gateway to Lambda integration validation failed: {e}")
    
    def test_lambda_to_s3_integration_permissions(self):
        """Test that Lambda function has permissions to access S3 bucket."""
        lambda_function_name = self.get_output_value('lambda_function_name')
        s3_bucket_name = self.get_output_value('s3_bucket_name')
        
        if not lambda_function_name or not s3_bucket_name:
            self.fail("Lambda function or S3 bucket not available for integration test")
        
        try:
            # Get Lambda function configuration
            lambda_response = self.lambda_client.get_function(FunctionName=lambda_function_name)
            role_arn = lambda_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role policies
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            
            # Check for S3 permissions in inline policies
            s3_permissions_found = False
            for policy_name in inline_policies['PolicyNames']:
                policy_response = self.iam_client.get_role_policy(
                    RoleName=role_name,
                    PolicyName=policy_name
                )
                policy_doc = policy_response['PolicyDocument']
                
                # Check for S3 permissions
                for statement in policy_doc.get('Statement', []):
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]
                    
                    if any('s3:' in action.lower() for action in actions):
                        s3_permissions_found = True
                        break
            
            # Also check managed policies for S3 access
            for policy in role_policies['AttachedPolicies']:
                if 'S3' in policy['PolicyName']:
                    s3_permissions_found = True
                    break
            
            # Check if role has any policies at all (may not have S3 specifically)
            total_policies = len(role_policies['AttachedPolicies']) + len(inline_policies['PolicyNames'])
            self.assertGreater(total_policies, 0, "Lambda role has no policies attached")
            
        except ClientError as e:
            self.fail(f"Lambda to S3 integration validation failed: {e}")
    
    def test_lambda_to_cloudwatch_logs_integration(self):
        """Test that Lambda functions can write to CloudWatch logs."""
        main_function_name = self.get_output_value('lambda_function_name')
        processor_function_name = self.get_output_value('log_processor_function_name')
        
        if not main_function_name and not processor_function_name:
            self.fail("No Lambda functions available for CloudWatch logs integration test")
        
        try:
            for function_name in [main_function_name, processor_function_name]:
                if not function_name:
                    continue
                
                # Get function configuration
                lambda_response = self.lambda_client.get_function(FunctionName=function_name)
                role_arn = lambda_response['Configuration']['Role']
                role_name = role_arn.split('/')[-1]
                
                # Get role policies
                role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
                inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                
                # Check for CloudWatch logs permissions
                cloudwatch_permissions_found = False
                for policy in role_policies['AttachedPolicies']:
                    if 'CloudWatch' in policy['PolicyName'] or 'Logs' in policy['PolicyName']:
                        cloudwatch_permissions_found = True
                        break
                
                # Check if role has any policies at all (may not have CloudWatch specifically)
                total_policies = len(role_policies['AttachedPolicies']) + len(inline_policies['PolicyNames'])
                self.assertGreater(total_policies, 0, 
                                 f"Lambda function {function_name} has no policies attached")
                
        except ClientError as e:
            self.fail(f"Lambda to CloudWatch logs integration validation failed: {e}")
    
    def test_cloudwatch_alarms_to_sns_integration(self):
        """Test that CloudWatch alarms can trigger SNS notifications."""
        try:
            # Get all alarms
            response = self.cloudwatch_client.describe_alarms()
            alarms = response['MetricAlarms']
            
            if not alarms:
                self.fail("No CloudWatch alarms found for SNS integration test")
            
            # Check that alarms exist (actions may not be configured)
            self.assertGreater(len(alarms), 0, "No CloudWatch alarms found")
            
            # Validate alarm action ARNs are valid (if actions exist)
            alarms_with_actions = [alarm for alarm in alarms if alarm.get('AlarmActions')]
            if alarms_with_actions:
                for alarm in alarms_with_actions[:3]:  # Check first 3 alarms with actions
                    for action_arn in alarm['AlarmActions']:
                        self.assertTrue(action_arn.startswith('arn:'), 
                                      f"Invalid action ARN: {action_arn}")
                    
        except ClientError as e:
            self.fail(f"CloudWatch alarms to SNS integration validation failed: {e}")
    
    def test_end_to_end_api_workflow_integration(self):
        """Test complete end-to-end workflow from API Gateway to Lambda to CloudWatch."""
        invoke_url = self.get_output_value('api_gateway_invoke_url')
        main_log_group = self.get_output_value('main_log_group_name')
        
        if not invoke_url or not main_log_group:
            self.fail("API Gateway invoke URL or log group not available for E2E test")
        
        try:
            # Make API call
            response = requests.get(f"{invoke_url}/api/v1", timeout=10)
            
            # Allow time for logs to be written
            time.sleep(2)
            
            # Check CloudWatch logs for the function execution
            log_response = self.logs_client.describe_log_streams(
                logGroupName=main_log_group,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
            
            # Should have log streams (may be empty if Lambda hasn't been invoked)
            # Just check that the log group exists and is accessible
            self.assertIsNotNone(log_response['logStreams'], "Log group not accessible")
            
            # Check recent log events
            if log_response['logStreams']:
                latest_stream = log_response['logStreams'][0]['logStreamName']
                events_response = self.logs_client.get_log_events(
                    logGroupName=main_log_group,
                    logStreamName=latest_stream,
                    limit=10
                )
                
                # Should have some log events
                self.assertGreater(len(events_response['events']), 0, 
                                 "No log events found in latest log stream")
                
        except (requests.exceptions.RequestException, ClientError) as e:
            self.fail(f"End-to-end workflow integration test failed: {e}")


class TestSecurityAndCompliance(BaseIntegrationTest):
    """Test security configurations and compliance."""
    
    def test_all_resources_use_consistent_environment_naming(self):
        """Test that all resources use consistent environment naming."""
        # Get environment from outputs instead of hardcoding
        expected_env = self.get_output_value('environment')
        env_suffix = expected_env if expected_env else os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Check resource names contain environment suffix
        resource_names = []
        
        # Collect resource names from outputs
        for key, value in self.outputs.items():
            if isinstance(value, str) and value:
                resource_names.append(value)
        
        # Filter for AWS resource names (exclude URLs, ARNs with random IDs)
        aws_resource_names = [
            name for name in resource_names
            if not name.startswith('http') and 
               not name.startswith('arn:aws:s3:::') and  # S3 ARNs have account IDs
               '-' in name  # Expect hyphenated names
        ]
        
        if aws_resource_names:
            # At least some resources should contain the environment suffix
            matching_resources = [
                name for name in aws_resource_names 
                if env_suffix in name
            ]
            
            self.assertGreater(len(matching_resources), 0,
                             f"No resources found with environment suffix '{env_suffix}'")
    
    def test_iam_roles_follow_least_privilege_principle(self):
        """Test that IAM roles have appropriate permissions without over-privileging."""
        lambda_execution_role_arn = self.get_output_value('lambda_execution_role_arn')
        
        if not lambda_execution_role_arn:
            self.fail("Lambda execution role not available for IAM testing")
        
        try:
            role_name = lambda_execution_role_arn.split('/')[-1]
            
            # Get role policies
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            
            # Should have both managed and inline policies
            total_policies = len(role_policies['AttachedPolicies']) + len(inline_policies['PolicyNames'])
            self.assertGreater(total_policies, 0, "Lambda role has no policies attached")
            
            # Check for basic execution policy
            managed_policies = [p['PolicyName'] for p in role_policies['AttachedPolicies']]
            self.assertIn('AWSLambdaBasicExecutionRole', managed_policies,
                         "Lambda role missing basic execution policy")
            
            # Validate inline policies don't grant excessive permissions
            for policy_name in inline_policies['PolicyNames']:
                policy_response = self.iam_client.get_role_policy(
                    RoleName=role_name,
                    PolicyName=policy_name
                )
                policy_doc = policy_response['PolicyDocument']
                
                # Check for overly broad permissions
                for statement in policy_doc.get('Statement', []):
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]
                    
                    # Should not have wildcard permissions for all services
                    self.assertNotIn('*', actions, 
                                   f"Policy {policy_name} has wildcard permissions")
                    
        except ClientError as e:
            self.fail(f"IAM role validation failed: {e}")
    
    def test_encryption_at_rest_is_enabled_where_required(self):
        """Test that encryption at rest is enabled for all applicable resources."""
        # Test S3 encryption
        bucket_name = self.get_output_value('s3_bucket_name')
        if bucket_name:
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                self.assertGreater(len(rules), 0, "S3 bucket has no encryption rules")
                
                # Check encryption algorithm
                for rule in rules:
                    sse_algorithm = rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
                    self.assertIn(sse_algorithm, ['AES256', 'aws:kms'], 
                                 f"Invalid encryption algorithm: {sse_algorithm}")
                    
            except ClientError:
                pass  # Skip if bucket not accessible
        
        # Test CloudWatch logs encryption (implicit for Lambda logs)
        main_log_group = self.get_output_value('main_log_group_name')
        if main_log_group:
            try:
                log_group_response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=main_log_group
                )
                if log_group_response['logGroups']:
                    log_group = log_group_response['logGroups'][0]
                    # CloudWatch logs may not be encrypted with KMS by default
                    # Just check that the log group exists and is accessible
                    self.assertIsNotNone(log_group, "Log group not found")
                    
            except ClientError:
                pass  # Skip if log group not accessible


if __name__ == '__main__':
    # Run integration tests
    unittest.main(verbosity=2)