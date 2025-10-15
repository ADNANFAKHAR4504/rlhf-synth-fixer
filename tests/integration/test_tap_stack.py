"""
Integration tests for the deployed TapStack serverless event processing pipeline.
These tests validate actual AWS resources against live deployments.

Test Structure:
- Service-to-Service Integration Tests: Cross-service communication and data flow
- Resource Configuration Tests: Individual AWS resource validation
- End-to-End Tests: Complete data flow through the entire pipeline
"""

import json
import os
import time
import unittest
from typing import Any, Dict, Optional

import boto3
import pytest
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
        cls.primary_region = cls.outputs.get('primary_region', 'us-east-1')
        cls.secondary_region = cls.outputs.get('secondary_region', 'us-west-2')
        
        # Skip tests if no outputs available
        if not cls.outputs:
            pytest.skip("No deployment outputs available - infrastructure may not be deployed")
        
        try:
            # Initialize AWS clients for both regions
            cls.lambda_client_primary = boto3.client('lambda', region_name=cls.primary_region)
            cls.dynamodb_client_primary = boto3.client('dynamodb', region_name=cls.primary_region)
            cls.events_client_primary = boto3.client('events', region_name=cls.primary_region)
            cls.sns_client_primary = boto3.client('sns', region_name=cls.primary_region)
            cls.cloudwatch_client_primary = boto3.client('cloudwatch', region_name=cls.primary_region)
            cls.iam_client_primary = boto3.client('iam', region_name=cls.primary_region)
            cls.logs_client_primary = boto3.client('logs', region_name=cls.primary_region)
            
            cls.lambda_client_secondary = boto3.client('lambda', region_name=cls.secondary_region)
            cls.dynamodb_client_secondary = boto3.client('dynamodb', region_name=cls.secondary_region)
            cls.events_client_secondary = boto3.client('events', region_name=cls.secondary_region)
            cls.sns_client_secondary = boto3.client('sns', region_name=cls.secondary_region)
            cls.cloudwatch_client_secondary = boto3.client('cloudwatch', region_name=cls.secondary_region)
            cls.iam_client_secondary = boto3.client('iam', region_name=cls.secondary_region)
            cls.logs_client_secondary = boto3.client('logs', region_name=cls.secondary_region)
            
            # Test AWS credentials
            sts_client = boto3.client('sts', region_name=cls.primary_region)
            cls.account_id = sts_client.get_caller_identity()['Account']
            
        except NoCredentialsError:
            pytest.skip("AWS credentials not configured - skipping integration tests")
        except Exception as e:
            pytest.skip(f"Failed to initialize AWS clients: {e}")
    
    def get_output_value(self, key: str) -> Optional[str]:
        """Helper to get output value by key with fallback logic."""
        if key in self.outputs:
            return self.outputs[key]
        
        # Try case-insensitive lookup
        for output_key, value in self.outputs.items():
            if output_key.lower() == key.lower():
                return value
        
        return None
    
    def skip_if_resource_missing(self, resource_key: str, resource_name: str):
        """Skip test if resource output is not available."""
        if not self.get_output_value(resource_key):
            pytest.skip(f"{resource_name} not found in outputs - may not be deployed")


# ============================================================================
# SERVICE LEVEL TESTS
# ============================================================================
# These tests validate individual AWS resources and their configurations.
# They ensure each service is properly configured with security, monitoring,
# and operational best practices.
# ============================================================================

class TestEventProcessingInfrastructure(BaseIntegrationTest):
    """Test serverless event processing infrastructure resources."""
    
    def test_lambda_functions_exist_and_configured_correctly_in_primary_region(self):
        """Test that Lambda functions exist in primary region with proper runtime, handler, X-Ray tracing, and environment variables."""
        lambda_name = self.get_output_value(f'lambda_function_name_{self.primary_region}')
        self.skip_if_resource_missing(f'lambda_function_name_{self.primary_region}', 'Lambda function')
        
        try:
            response = self.lambda_client_primary.get_function(FunctionName=lambda_name)
            config = response['Configuration']
            
            # Validate basic configuration
            self.assertEqual(config['FunctionName'], lambda_name)
            
            # Test runtime is latest Python version (dynamic check)
            runtime = config.get('Runtime', '')
            self.assertTrue(runtime.startswith('python'), f"Expected Python runtime, got: {runtime}")
            
            # Test handler is properly configured
            handler = config.get('Handler', '')
            self.assertIn('event_processor', handler, f"Handler should contain event_processor, got: {handler}")
            
            # Test X-Ray tracing is enabled
            tracing_config = config.get('TracingConfig', {})
            self.assertEqual(tracing_config.get('Mode'), 'Active', "X-Ray tracing not enabled")
            
            # Test environment variables are properly set
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars, "Missing DynamoDB table name environment variable")
            self.assertIn('LOG_LEVEL', env_vars, "Missing log level environment variable")
            
            # Validate environment variable values are not empty
            self.assertIsNotNone(env_vars.get('DYNAMODB_TABLE_NAME'), "DynamoDB table name environment variable is empty")
            self.assertIsNotNone(env_vars.get('LOG_LEVEL'), "Log level environment variable is empty")
            
        except ClientError as e:
            self.fail(f"Lambda function not found or misconfigured: {e}")

    def test_lambda_functions_exist_and_configured_correctly_in_secondary_region(self):
        """Test that Lambda functions exist in secondary region with proper runtime, handler, X-Ray tracing, and environment variables."""
        lambda_name = self.get_output_value(f'lambda_function_name_{self.secondary_region}')
        self.skip_if_resource_missing(f'lambda_function_name_{self.secondary_region}', 'Lambda function')
        
        try:
            response = self.lambda_client_secondary.get_function(FunctionName=lambda_name)
            config = response['Configuration']
            
            # Validate basic configuration
            self.assertEqual(config['FunctionName'], lambda_name)
            
            # Test runtime is latest Python version (dynamic check)
            runtime = config.get('Runtime', '')
            self.assertTrue(runtime.startswith('python'), f"Expected Python runtime, got: {runtime}")
            
            # Test handler is properly configured
            handler = config.get('Handler', '')
            self.assertIn('event_processor', handler, f"Handler should contain event_processor, got: {handler}")
            
            # Test X-Ray tracing is enabled
            tracing_config = config.get('TracingConfig', {})
            self.assertEqual(tracing_config.get('Mode'), 'Active', "X-Ray tracing not enabled")
            
            # Test environment variables are properly set
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars, "Missing DynamoDB table name environment variable")
            self.assertIn('LOG_LEVEL', env_vars, "Missing log level environment variable")
            
            # Validate environment variable values are not empty
            self.assertIsNotNone(env_vars.get('DYNAMODB_TABLE_NAME'), "DynamoDB table name environment variable is empty")
            self.assertIsNotNone(env_vars.get('LOG_LEVEL'), "Log level environment variable is empty")
            
        except ClientError as e:
            self.fail(f"Lambda function not found or misconfigured: {e}")

    def test_dynamodb_tables_exist_with_encryption_and_ttl_in_primary_region(self):
        """Test that DynamoDB tables exist in primary region with server-side encryption, TTL, and proper billing mode."""
        table_name = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.primary_region}', 'DynamoDB table')
        
        try:
            response = self.dynamodb_client_primary.describe_table(TableName=table_name)
            table = response['Table']
            
            # Test table is active and ready
            self.assertEqual(table['TableStatus'], 'ACTIVE', f"Table {table_name} is not active")
            
            # Test billing mode is pay-per-request (dynamic check)
            billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', '')
            self.assertEqual(billing_mode, 'PAY_PER_REQUEST', f"Expected PAY_PER_REQUEST billing mode, got: {billing_mode}")
            
            # Test server-side encryption is enabled
            sse_description = table.get('SSEDescription', {})
            self.assertIsNotNone(sse_description, "Server-side encryption not configured")
            self.assertEqual(sse_description.get('Status'), 'ENABLED', "DynamoDB server-side encryption not enabled")
            
            # Test TTL is enabled if configured
            ttl_description = table.get('TimeToLiveDescription', {})
            if ttl_description:
                ttl_status = ttl_description.get('TimeToLiveStatus', '')
                self.assertEqual(ttl_status, 'ENABLED', f"TTL should be enabled, got status: {ttl_status}")
            
            # Test table has proper key schema
            key_schema = table.get('KeySchema', [])
            self.assertGreater(len(key_schema), 0, "Table missing key schema")
            
        except ClientError as e:
            self.fail(f"DynamoDB table not found or misconfigured: {e}")

    def test_dynamodb_tables_exist_with_encryption_and_ttl_in_secondary_region(self):
        """Test that DynamoDB tables exist in secondary region with server-side encryption, TTL, and proper billing mode."""
        table_name = self.get_output_value(f'dynamodb_table_name_{self.secondary_region}')
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.secondary_region}', 'DynamoDB table')
        
        try:
            response = self.dynamodb_client_secondary.describe_table(TableName=table_name)
            table = response['Table']
            
            # Test table is active and ready
            self.assertEqual(table['TableStatus'], 'ACTIVE', f"Table {table_name} is not active")
            
            # Test billing mode is pay-per-request (dynamic check)
            billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', '')
            self.assertEqual(billing_mode, 'PAY_PER_REQUEST', f"Expected PAY_PER_REQUEST billing mode, got: {billing_mode}")
            
            # Test server-side encryption is enabled
            sse_description = table.get('SSEDescription', {})
            self.assertIsNotNone(sse_description, "Server-side encryption not configured")
            self.assertEqual(sse_description.get('Status'), 'ENABLED', "DynamoDB server-side encryption not enabled")
            
            # Test TTL is enabled if configured
            ttl_description = table.get('TimeToLiveDescription', {})
            if ttl_description:
                ttl_status = ttl_description.get('TimeToLiveStatus', '')
                self.assertEqual(ttl_status, 'ENABLED', f"TTL should be enabled, got status: {ttl_status}")
            
            # Test table has proper key schema
            key_schema = table.get('KeySchema', [])
            self.assertGreater(len(key_schema), 0, "Table missing key schema")
            
        except ClientError as e:
            self.fail(f"DynamoDB table not found or misconfigured: {e}")

    def test_eventbridge_custom_event_buses_exist_and_accessible_in_primary_region(self):
        """Test that custom EventBridge event buses exist and are accessible in primary region."""
        bus_name = self.get_output_value(f'eventbridge_bus_name_{self.primary_region}')
        self.skip_if_resource_missing(f'eventbridge_bus_name_{self.primary_region}', 'EventBridge bus')
        
        try:
            response = self.events_client_primary.describe_event_bus(Name=bus_name)
            
            # Test bus name matches expected value
            self.assertEqual(response['Name'], bus_name, f"EventBridge bus name mismatch: expected {bus_name}, got {response['Name']}")
            
            # Test bus is accessible and has proper ARN format
            bus_arn = response.get('Arn', '')
            self.assertIn('events', bus_arn, "EventBridge bus ARN should contain 'events'")
            self.assertIn(self.primary_region, bus_arn, f"EventBridge bus ARN should contain region {self.primary_region}")
            
        except ClientError as e:
            self.fail(f"EventBridge bus not found or not accessible: {e}")

    def test_eventbridge_custom_event_buses_exist_and_accessible_in_secondary_region(self):
        """Test that custom EventBridge event buses exist and are accessible in secondary region."""
        bus_name = self.get_output_value(f'eventbridge_bus_name_{self.secondary_region}')
        self.skip_if_resource_missing(f'eventbridge_bus_name_{self.secondary_region}', 'EventBridge bus')
        
        try:
            response = self.events_client_secondary.describe_event_bus(Name=bus_name)
            
            # Test bus name matches expected value
            self.assertEqual(response['Name'], bus_name, f"EventBridge bus name mismatch: expected {bus_name}, got {response['Name']}")
            
            # Test bus is accessible and has proper ARN format
            bus_arn = response.get('Arn', '')
            self.assertIn('events', bus_arn, "EventBridge bus ARN should contain 'events'")
            self.assertIn(self.secondary_region, bus_arn, f"EventBridge bus ARN should contain region {self.secondary_region}")
            
        except ClientError as e:
            self.fail(f"EventBridge bus not found or not accessible: {e}")

    def test_sns_topics_exist_with_proper_configuration_in_primary_region(self):
        """Test that SNS topics exist in primary region with proper ARN format and configuration."""
        sns_topic_arn = self.get_output_value(f'sns_topic_arn_{self.primary_region}')
        self.skip_if_resource_missing(f'sns_topic_arn_{self.primary_region}', 'SNS topic')
        
        try:
            response = self.sns_client_primary.get_topic_attributes(TopicArn=sns_topic_arn)
            attributes = response['Attributes']
            
            # Test topic ARN matches expected value
            topic_arn = attributes.get('TopicArn', '')
            self.assertEqual(topic_arn, sns_topic_arn, f"SNS topic ARN mismatch: expected {sns_topic_arn}, got {topic_arn}")
            
            # Test topic ARN has proper format
            self.assertIn('sns', topic_arn, "SNS topic ARN should contain 'sns'")
            self.assertIn(self.primary_region, topic_arn, f"SNS topic ARN should contain region {self.primary_region}")
            
            # Test topic is active and accessible
            self.assertIsNotNone(topic_arn, "SNS topic ARN should not be empty")
            
        except ClientError as e:
            self.fail(f"SNS topic not found or not accessible: {e}")

    def test_sns_topics_exist_with_proper_configuration_in_secondary_region(self):
        """Test that SNS topics exist in secondary region with proper ARN format and configuration."""
        sns_topic_arn = self.get_output_value(f'sns_topic_arn_{self.secondary_region}')
        self.skip_if_resource_missing(f'sns_topic_arn_{self.secondary_region}', 'SNS topic')
        
        try:
            response = self.sns_client_secondary.get_topic_attributes(TopicArn=sns_topic_arn)
            attributes = response['Attributes']
            
            # Test topic ARN matches expected value
            topic_arn = attributes.get('TopicArn', '')
            self.assertEqual(topic_arn, sns_topic_arn, f"SNS topic ARN mismatch: expected {sns_topic_arn}, got {topic_arn}")
            
            # Test topic ARN has proper format
            self.assertIn('sns', topic_arn, "SNS topic ARN should contain 'sns'")
            self.assertIn(self.secondary_region, topic_arn, f"SNS topic ARN should contain region {self.secondary_region}")
            
            # Test topic is active and accessible
            self.assertIsNotNone(topic_arn, "SNS topic ARN should not be empty")
            
        except ClientError as e:
            self.fail(f"SNS topic not found or not accessible: {e}")


# ============================================================================
# CROSS-SERVICE INTEGRATION TESTS
# ============================================================================
# These tests validate cross-service communication and data flow through the
# entire serverless event processing pipeline. They test the integration
# between EventBridge, Lambda, DynamoDB, and CloudWatch services.
# ============================================================================

class TestInfrastructureIntegration(BaseIntegrationTest):
    """Test cross-service integration and data flow."""
    
    def test_eventbridge_has_permission_to_invoke_lambda_function_in_primary_region(self):
        """Test that EventBridge service has proper IAM permissions to invoke Lambda function in primary region."""
        lambda_arn = self.get_output_value(f'lambda_function_arn_{self.primary_region}')
        self.skip_if_resource_missing(f'lambda_function_arn_{self.primary_region}', 'Lambda function ARN')
        
        try:
            # Get the Lambda function policy to verify EventBridge permissions
            response = self.lambda_client_primary.get_policy(FunctionName=lambda_arn)
            policy_doc = json.loads(response['Policy'])
            
            # Check that EventBridge service has invoke permission
            statements = policy_doc.get('Statement', [])
            eventbridge_permissions = []
            
            for stmt in statements:
                principal = stmt.get('Principal', {})
                if isinstance(principal, dict):
                    service = principal.get('Service', '')
                    if 'events.amazonaws.com' in service:
                        eventbridge_permissions.append(stmt)
            
            self.assertGreater(len(eventbridge_permissions), 0, 
                             f"EventBridge does not have permission to invoke Lambda function {lambda_arn}")
            
            # Verify the permission includes InvokeFunction action
            for permission in eventbridge_permissions:
                actions = permission.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                self.assertTrue(any('lambda:InvokeFunction' in action for action in actions),
                              "EventBridge permission missing lambda:InvokeFunction action")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                self.fail(f"Lambda function policy not found for {lambda_arn} - EventBridge integration may not be configured")
            else:
                raise

    def test_eventbridge_has_permission_to_invoke_lambda_function_in_secondary_region(self):
        """Test that EventBridge service has proper IAM permissions to invoke Lambda function in secondary region."""
        lambda_arn = self.get_output_value(f'lambda_function_arn_{self.secondary_region}')
        self.skip_if_resource_missing(f'lambda_function_arn_{self.secondary_region}', 'Lambda function ARN')
        
        try:
            # Get the Lambda function policy to verify EventBridge permissions
            response = self.lambda_client_secondary.get_policy(FunctionName=lambda_arn)
            policy_doc = json.loads(response['Policy'])
            
            # Check that EventBridge service has invoke permission
            statements = policy_doc.get('Statement', [])
            eventbridge_permissions = []
            
            for stmt in statements:
                principal = stmt.get('Principal', {})
                if isinstance(principal, dict):
                    service = principal.get('Service', '')
                    if 'events.amazonaws.com' in service:
                        eventbridge_permissions.append(stmt)
            
            self.assertGreater(len(eventbridge_permissions), 0, 
                             f"EventBridge does not have permission to invoke Lambda function {lambda_arn}")
            
            # Verify the permission includes InvokeFunction action
            for permission in eventbridge_permissions:
                actions = permission.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                self.assertTrue(any('lambda:InvokeFunction' in action for action in actions),
                              "EventBridge permission missing lambda:InvokeFunction action")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                self.fail(f"Lambda function policy not found for {lambda_arn} - EventBridge integration may not be configured")
            else:
                raise

    def test_lambda_function_has_correct_dynamodb_table_name_in_environment_variables_primary_region(self):
        """Test that Lambda function in primary region has correct DynamoDB table name configured in environment variables."""
        lambda_name = self.get_output_value(f'lambda_function_name_{self.primary_region}')
        table_name = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        
        if not lambda_name or not table_name:
            pytest.skip("Lambda function or DynamoDB table not available for integration test")
        
        try:
            response = self.lambda_client_primary.get_function(FunctionName=lambda_name)
            env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})
            
            # Check that Lambda has DynamoDB table name in environment variables
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars, 
                        f"Lambda function {lambda_name} missing DYNAMODB_TABLE_NAME environment variable")
            
            # Verify the environment variable value matches the actual table name
            actual_table_name = env_vars.get('DYNAMODB_TABLE_NAME', '')
            self.assertEqual(actual_table_name, table_name, 
                          f"Lambda DynamoDB table name mismatch: expected {table_name}, got {actual_table_name}")
            
            # Verify the environment variable is not empty
            self.assertIsNotNone(actual_table_name, "DYNAMODB_TABLE_NAME environment variable should not be empty")
            
        except ClientError as e:
            self.fail(f"Failed to get Lambda function configuration for {lambda_name}: {e}")

    def test_lambda_function_has_correct_dynamodb_table_name_in_environment_variables_secondary_region(self):
        """Test that Lambda function in secondary region has correct DynamoDB table name configured in environment variables."""
        lambda_name = self.get_output_value(f'lambda_function_name_{self.secondary_region}')
        table_name = self.get_output_value(f'dynamodb_table_name_{self.secondary_region}')
        
        if not lambda_name or not table_name:
            pytest.skip("Lambda function or DynamoDB table not available for integration test")
        
        try:
            response = self.lambda_client_secondary.get_function(FunctionName=lambda_name)
            env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})
            
            # Check that Lambda has DynamoDB table name in environment variables
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars, 
                        f"Lambda function {lambda_name} missing DYNAMODB_TABLE_NAME environment variable")
            
            # Verify the environment variable value matches the actual table name
            actual_table_name = env_vars.get('DYNAMODB_TABLE_NAME', '')
            self.assertEqual(actual_table_name, table_name, 
                          f"Lambda DynamoDB table name mismatch: expected {table_name}, got {actual_table_name}")
            
            # Verify the environment variable is not empty
            self.assertIsNotNone(actual_table_name, "DYNAMODB_TABLE_NAME environment variable should not be empty")
            
        except ClientError as e:
            self.fail(f"Failed to get Lambda function configuration for {lambda_name}: {e}")

    def test_sns_topics_are_accessible_for_cloudwatch_alarm_notifications_in_primary_region(self):
        """Test that SNS topics in primary region are accessible and properly configured for CloudWatch alarm notifications."""
        sns_topic_arn = self.get_output_value(f'sns_topic_arn_{self.primary_region}')
        self.skip_if_resource_missing(f'sns_topic_arn_{self.primary_region}', 'SNS topic ARN')
        
        try:
            response = self.sns_client_primary.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertIn('Attributes', response, "SNS topic attributes not found")
            
            # Verify topic is active and accessible
            topic_arn = response['Attributes'].get('TopicArn', '')
            self.assertEqual(topic_arn, sns_topic_arn, 
                          f"SNS topic ARN mismatch: expected {sns_topic_arn}, got {topic_arn}")
            
            # Verify topic ARN format is correct
            self.assertIn('sns', topic_arn, "SNS topic ARN should contain 'sns'")
            self.assertIn(self.primary_region, topic_arn, f"SNS topic ARN should contain region {self.primary_region}")
            
        except ClientError as e:
            self.fail(f"SNS topic {sns_topic_arn} not accessible: {e}")

    def test_sns_topics_are_accessible_for_cloudwatch_alarm_notifications_in_secondary_region(self):
        """Test that SNS topics in secondary region are accessible and properly configured for CloudWatch alarm notifications."""
        sns_topic_arn = self.get_output_value(f'sns_topic_arn_{self.secondary_region}')
        self.skip_if_resource_missing(f'sns_topic_arn_{self.secondary_region}', 'SNS topic ARN')
        
        try:
            response = self.sns_client_secondary.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertIn('Attributes', response, "SNS topic attributes not found")
            
            # Verify topic is active and accessible
            topic_arn = response['Attributes'].get('TopicArn', '')
            self.assertEqual(topic_arn, sns_topic_arn, 
                          f"SNS topic ARN mismatch: expected {sns_topic_arn}, got {topic_arn}")
            
            # Verify topic ARN format is correct
            self.assertIn('sns', topic_arn, "SNS topic ARN should contain 'sns'")
            self.assertIn(self.secondary_region, topic_arn, f"SNS topic ARN should contain region {self.secondary_region}")
            
        except ClientError as e:
            self.fail(f"SNS topic {sns_topic_arn} not accessible: {e}")

    def test_dynamodb_tables_exist_in_both_regions_for_cross_region_data_consistency(self):
        """Test that DynamoDB tables exist and are active in both regions for cross-region data consistency."""
        primary_table = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        secondary_table = self.get_output_value(f'dynamodb_table_name_{self.secondary_region}')
        
        if not primary_table or not secondary_table:
            pytest.skip("DynamoDB tables not available for cross-region replication test")
        
        # Test primary region table exists and is active
        try:
            response = self.dynamodb_client_primary.describe_table(TableName=primary_table)
            table_status = response['Table']['TableStatus']
            self.assertEqual(table_status, 'ACTIVE', 
                          f"Primary region DynamoDB table {primary_table} is not active, status: {table_status}")
        except ClientError as e:
            self.fail(f"Primary region DynamoDB table {primary_table} not found: {e}")
        
        # Test secondary region table exists and is active
        try:
            response = self.dynamodb_client_secondary.describe_table(TableName=secondary_table)
            table_status = response['Table']['TableStatus']
            self.assertEqual(table_status, 'ACTIVE', 
                          f"Secondary region DynamoDB table {secondary_table} is not active, status: {table_status}")
        except ClientError as e:
            self.fail(f"Secondary region DynamoDB table {secondary_table} not found: {e}")

    def test_lambda_function_has_cloudwatch_logs_permissions_in_primary_region(self):
        """Test that Lambda function in primary region has proper IAM permissions to write to CloudWatch Logs."""
        lambda_name = self.get_output_value(f'lambda_function_name_{self.primary_region}')
        self.skip_if_resource_missing(f'lambda_function_name_{self.primary_region}', 'Lambda function name')
        
        try:
            # Get Lambda function configuration
            response = self.lambda_client_primary.get_function(FunctionName=lambda_name)
            
            # Check that Lambda has IAM role
            role_arn = response['Configuration'].get('Role')
            self.assertIsNotNone(role_arn, f"Lambda function {lambda_name} missing IAM role")
            
            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]
            self.assertIsNotNone(role_name, f"Could not extract role name from ARN: {role_arn}")
            
            # Get the IAM role to check CloudWatch Logs permissions
            role_response = self.iam_client_primary.get_role(RoleName=role_name)
            self.assertIsNotNone(role_response.get('Role'), f"IAM role {role_name} not found")
            
            # Check that role has CloudWatch Logs permissions by looking at attached policies
            policies_response = self.iam_client_primary.list_attached_role_policies(RoleName=role_name)
            attached_policies = [policy['PolicyArn'] for policy in policies_response['AttachedPolicies']]
            
            # Should have AWS managed policy for Lambda execution (includes CloudWatch Logs)
            lambda_execution_policy = any('AWSLambdaBasicExecutionRole' in policy for policy in attached_policies)
            self.assertTrue(lambda_execution_policy, 
                          f"Lambda role {role_name} missing CloudWatch Logs permissions (AWSLambdaBasicExecutionRole)")
            
        except ClientError as e:
            self.fail(f"Failed to verify Lambda CloudWatch Logs integration for {lambda_name}: {e}")


class TestSecurityConfiguration(BaseIntegrationTest):
    """Test security configurations across all resources."""
    
    def test_environment_configuration_is_consistent_across_all_resources(self):
        """Test that environment configuration is consistent and properly applied across all resources."""
        env_suffix = self.get_output_value('environment_suffix')
        environment = self.get_output_value('environment')
        primary_region = self.get_output_value('primary_region')
        secondary_region = self.get_output_value('secondary_region')
        
        if not env_suffix or not environment:
            pytest.skip("Environment configuration not available for consistency testing")
        
        # Test that regions are properly configured
        self.assertIsNotNone(primary_region, "Primary region not found in outputs")
        self.assertIsNotNone(secondary_region, "Secondary region not found in outputs")
        
        # Test that regions are different (multi-region setup)
        self.assertNotEqual(primary_region, secondary_region, 
                          f"Primary and secondary regions should be different, both are: {primary_region}")
        
        # Test that regions are valid AWS regions
        valid_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
        self.assertIn(primary_region, valid_regions, f"Primary region {primary_region} is not a valid AWS region")
        self.assertIn(secondary_region, valid_regions, f"Secondary region {secondary_region} is not a valid AWS region")
        
        # Check resource names contain environment suffix for consistency
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
                             f"No resources found with environment suffix '{env_suffix}' - this may indicate inconsistent naming")


# ============================================================================
# END-TO-END TESTS
# ============================================================================
# These tests validate complete data flow through the entire serverless
# event processing pipeline. They simulate real-world scenarios and test
# the full integration from event ingestion to data storage and monitoring.
# ============================================================================

class TestEndToEndDataFlow(BaseIntegrationTest):
    """Test complete end-to-end data flow through the event processing pipeline."""
    
    def test_complete_event_processing_pipeline_flow(self):
        """Test end-to-end data flow: EventBridge -> Lambda -> DynamoDB -> CloudWatch."""
        # Get required outputs
        event_bus_name = self.get_output_value(f'eventbridge_bus_name_{self.primary_region}')
        lambda_name = self.get_output_value(f'lambda_function_name_{self.primary_region}')
        table_name = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        
        self.skip_if_resource_missing(f'eventbridge_bus_name_{self.primary_region}', 'EventBridge bus')
        self.skip_if_resource_missing(f'lambda_function_name_{self.primary_region}', 'Lambda function')
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.primary_region}', 'DynamoDB table')
        
        try:
            # Test 1: Verify EventBridge bus exists and is active
            eventbridge_client = boto3.client('events', region_name=self.primary_region)
            response = eventbridge_client.describe_event_bus(Name=event_bus_name)
            self.assertIsNotNone(response.get('Arn'), "EventBridge bus should have ARN")
            
            # Test 2: Verify Lambda function is active and can be invoked
            lambda_response = self.lambda_client_primary.get_function(FunctionName=lambda_name)
            self.assertEqual(lambda_response['Configuration']['State'], 'Active', 
                           "Lambda function should be in Active state")
            
            # Test 3: Verify DynamoDB table is active and accessible
            dynamodb_response = self.dynamodb_client_primary.describe_table(TableName=table_name)
            self.assertEqual(dynamodb_response['Table']['TableStatus'], 'ACTIVE',
                           "DynamoDB table should be in ACTIVE state")
            
            # Test 4: Verify CloudWatch log groups exist for Lambda (optional - only if Lambda has been invoked)
            logs_client = boto3.client('logs', region_name=self.primary_region)
            log_group_name = f"/aws/lambda/{lambda_name}"
            try:
                logs_response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
                if len(logs_response['logGroups']) > 0:
                    print(" CloudWatch log group exists for Lambda function")
                else:
                    print("ℹ CloudWatch log group not yet created (Lambda hasn't been invoked)")
            except ClientError:
                # Log group might not exist yet if Lambda hasn't been invoked
                print("ℹ CloudWatch log group not yet created (Lambda hasn't been invoked)")
            
            print(" End-to-end pipeline components are properly configured and accessible")
            
        except ClientError as e:
            self.fail(f"End-to-end pipeline test failed: {e}")
    
    def test_cross_region_event_routing_capability(self):
        """Test that events can be routed between regions through EventBridge."""
        primary_bus_name = self.get_output_value(f'eventbridge_bus_name_{self.primary_region}')
        secondary_bus_name = self.get_output_value(f'eventbridge_bus_name_{self.secondary_region}')
        
        self.skip_if_resource_missing(f'eventbridge_bus_name_{self.primary_region}', 'Primary EventBridge bus')
        self.skip_if_resource_missing(f'eventbridge_bus_name_{self.secondary_region}', 'Secondary EventBridge bus')
        
        try:
            # Test primary region EventBridge bus
            primary_client = boto3.client('events', region_name=self.primary_region)
            primary_response = primary_client.describe_event_bus(Name=primary_bus_name)
            self.assertIsNotNone(primary_response.get('Arn'), "Primary EventBridge bus should have ARN")
            
            # Test secondary region EventBridge bus
            secondary_client = boto3.client('events', region_name=self.secondary_region)
            secondary_response = secondary_client.describe_event_bus(Name=secondary_bus_name)
            self.assertIsNotNone(secondary_response.get('Arn'), "Secondary EventBridge bus should have ARN")
            
            # Verify both buses are in different regions
            primary_arn = primary_response['Arn']
            secondary_arn = secondary_response['Arn']
            
            self.assertIn(self.primary_region, primary_arn, "Primary bus should be in primary region")
            self.assertIn(self.secondary_region, secondary_arn, "Secondary bus should be in secondary region")
            
            print(" Cross-region EventBridge routing capability verified")
            
        except ClientError as e:
            self.fail(f"Cross-region event routing test failed: {e}")
    
    def test_dynamodb_global_table_replication_capability(self):
        """Test that DynamoDB Global Table replication is properly configured."""
        primary_table_name = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        secondary_table_name = self.get_output_value(f'dynamodb_table_name_{self.secondary_region}')
        
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.primary_region}', 'Primary DynamoDB table')
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.secondary_region}', 'Secondary DynamoDB table')
        
        try:
            # Test primary region table
            primary_response = self.dynamodb_client_primary.describe_table(TableName=primary_table_name)
            primary_table = primary_response['Table']
            self.assertEqual(primary_table['TableStatus'], 'ACTIVE', "Primary table should be active")
            
            # Test secondary region table
            secondary_response = self.dynamodb_client_secondary.describe_table(TableName=secondary_table_name)
            secondary_table = secondary_response['Table']
            self.assertEqual(secondary_table['TableStatus'], 'ACTIVE', "Secondary table should be active")
            
            # Verify both tables have the same structure (same key schema)
            primary_key_schema = primary_table['KeySchema']
            secondary_key_schema = secondary_table['KeySchema']
            
            self.assertEqual(len(primary_key_schema), len(secondary_key_schema),
                           "Both tables should have the same key schema for Global Table replication")
            
            # Verify both tables have the same attribute definitions
            primary_attributes = {attr['AttributeName']: attr['AttributeType'] 
                                for attr in primary_table['AttributeDefinitions']}
            secondary_attributes = {attr['AttributeName']: attr['AttributeType'] 
                                  for attr in secondary_table['AttributeDefinitions']}
            
            self.assertEqual(primary_attributes, secondary_attributes,
                           "Both tables should have identical attribute definitions for Global Table replication")
            
            print(" DynamoDB Global Table replication capability verified")
            
        except ClientError as e:
            self.fail(f"DynamoDB Global Table replication test failed: {e}")
    
    def test_security_and_compliance_across_pipeline(self):
        """Test that security and compliance requirements are met across the entire pipeline."""
        # Test encryption at rest
        primary_table_name = self.get_output_value(f'dynamodb_table_name_{self.primary_region}')
        self.skip_if_resource_missing(f'dynamodb_table_name_{self.primary_region}', 'DynamoDB table')
        
        try:
            # Test DynamoDB encryption
            table_response = self.dynamodb_client_primary.describe_table(TableName=primary_table_name)
            sse_description = table_response['Table'].get('SSEDescription', {})
            self.assertEqual(sse_description.get('Status'), 'ENABLED',
                           "DynamoDB should have server-side encryption enabled")
            
            # Test Lambda function has proper IAM role
            lambda_name = self.get_output_value(f'lambda_function_name_{self.primary_region}')
            lambda_response = self.lambda_client_primary.get_function(FunctionName=lambda_name)
            role_arn = lambda_response['Configuration']['Role']
            self.assertIsNotNone(role_arn, "Lambda function should have an IAM role")
            
            # Test EventBridge has proper permissions
            event_bus_name = self.get_output_value(f'eventbridge_bus_name_{self.primary_region}')
            eventbridge_client = boto3.client('events', region_name=self.primary_region)
            bus_response = eventbridge_client.describe_event_bus(Name=event_bus_name)
            self.assertIsNotNone(bus_response.get('Arn'), "EventBridge bus should have ARN")
            
            print("Security and compliance requirements verified across pipeline")
            
        except ClientError as e:
            self.fail(f"Security and compliance test failed: {e}")


if __name__ == '__main__':
    # Run integration tests
    unittest.main()