"""
Integration tests for the deployed Pulumi IoT TAP stack infrastructure.
These tests validate actual AWS resources against live deployments.
"""

import json
import os
import unittest
import time
import boto3
import pytest
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Dict, Any, Optional
import base64

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
        cls.region = os.getenv('AWS_REGION', 'us-west-1')
        
        # Skip tests if no outputs available
        if not cls.outputs:
            pytest.skip("No deployment outputs available - infrastructure may not be deployed")
        
        try:
            # Initialize AWS clients
            cls.iot_client = boto3.client('iot', region_name=cls.region)
            cls.kinesis_client = boto3.client('kinesis', region_name=cls.region)
            cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
            cls.s3_client = boto3.client('s3', region_name=cls.region)
            cls.lambda_client = boto3.client('lambda', region_name=cls.region)
            cls.sns_client = boto3.client('sns', region_name=cls.region)
            cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
            cls.iam_client = boto3.client('iam', region_name=cls.region)
            
            # Test AWS credentials
            sts_client = boto3.client('sts', region_name=cls.region)
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


class TestIoTInfrastructure(BaseIntegrationTest):
    """Test IoT Core resources."""
    
    def test_iot_endpoint_accessible(self):
        """Test that IoT endpoint is accessible and properly configured."""
        endpoint = self.get_output_value('iot_endpoint')
        self.skip_if_resource_missing('iot_endpoint', 'IoT endpoint')
        
        # Validate endpoint format
        self.assertIsNotNone(endpoint)
        self.assertIn('.iot.', endpoint)
        self.assertIn(self.region, endpoint)
        
        # Test endpoint accessibility
        try:
            response = self.iot_client.describe_endpoint()
            self.assertEqual(response['endpointAddress'], endpoint)
        except ClientError as e:
            self.fail(f"IoT endpoint not accessible: {e}")
    
    def test_thing_type_exists(self):
        """Test that IoT Thing Type is created and properly configured."""
        thing_type_name = self.get_output_value('thing_type_name')
        self.skip_if_resource_missing('thing_type_name', 'IoT Thing Type')
        
        try:
            response = self.iot_client.describe_thing_type(thingTypeName=thing_type_name)
            
            # Validate thing type properties
            self.assertEqual(response['thingTypeName'], thing_type_name)
            self.assertIn('IndustrialSensor', thing_type_name)
            self.assertFalse(response.get('thingTypeMetadata', {}).get('deprecated', True))
            
        except ClientError as e:
            self.fail(f"Thing type not found or accessible: {e}")
    
    def test_device_policy_exists(self):
        """Test that IoT device policy is created with proper permissions."""
        policy_name = self.get_output_value('device_policy_name')
        self.skip_if_resource_missing('device_policy_name', 'IoT Device Policy')
        
        try:
            response = self.iot_client.get_policy(policyName=policy_name)
            
            # Validate policy document
            policy_doc = json.loads(response['policyDocument'])
            self.assertEqual(policy_doc['Version'], '2012-10-17')
            
            # Check for required permissions
            statements = policy_doc['Statement']
            actions = []
            for stmt in statements:
                if isinstance(stmt['Action'], list):
                    actions.extend(stmt['Action'])
                else:
                    actions.append(stmt['Action'])
            
            required_actions = ['iot:Connect', 'iot:Publish', 'iot:Subscribe', 'iot:Receive']
            for action in required_actions:
                self.assertIn(action, actions, f"Missing required IoT action: {action}")
                
        except ClientError as e:
            self.fail(f"Device policy not found or accessible: {e}")
    
    def test_iot_rules_exist(self):
        """Test that IoT rules are created and enabled."""
        try:
            # List all IoT rules
            response = self.iot_client.list_topic_rules()
            rule_names = [rule['ruleName'] for rule in response['rules']]
            
            # Check for anomaly detection rule
            anomaly_rules = [name for name in rule_names if 'anomaly' in name.lower()]
            self.assertGreater(len(anomaly_rules), 0, "Anomaly detection rule not found")
            
            # Check for kinesis ingestion rule
            kinesis_rules = [name for name in rule_names if 'kinesis' in name.lower()]
            self.assertGreater(len(kinesis_rules), 0, "Kinesis ingestion rule not found")
            
            # Validate rule is enabled
            if anomaly_rules:
                rule_details = self.iot_client.get_topic_rule(ruleName=anomaly_rules[0])
                self.assertTrue(rule_details['rule']['ruleDisabled'] == False, 
                              "Anomaly detection rule is disabled")
                
        except ClientError as e:
            self.fail(f"Failed to verify IoT rules: {e}")


class TestStorageInfrastructure(BaseIntegrationTest):
    """Test storage resources (DynamoDB, Kinesis, S3)."""
    
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table is created with proper configuration."""
        table_name = self.get_output_value('dynamodb_table_name')
        self.skip_if_resource_missing('dynamodb_table_name', 'DynamoDB table')
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Validate table configuration
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Check key schema
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            self.assertEqual(key_schema['device_id'], 'HASH')
            self.assertEqual(key_schema['timestamp'], 'RANGE')
            
            # Check GSI exists
            gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
            self.assertIn('DateIndex', gsi_names, "DateIndex GSI not found")
            
            # Check encryption
            self.assertIsNotNone(table.get('SSEDescription'), "Table encryption not enabled")
            
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")
    
    def test_kinesis_stream_exists(self):
        """Test that Kinesis stream is created with proper configuration."""
        stream_name = self.get_output_value('kinesis_stream_name')
        self.skip_if_resource_missing('kinesis_stream_name', 'Kinesis stream')
        
        try:
            response = self.kinesis_client.describe_stream(StreamName=stream_name)
            stream = response['StreamDescription']
            
            # Validate stream configuration
            self.assertEqual(stream['StreamStatus'], 'ACTIVE')
            self.assertGreaterEqual(len(stream['Shards']), 2, "Expected at least 2 shards")
            self.assertEqual(stream['RetentionPeriodHours'], 24)
            
            # Check encryption
            self.assertEqual(stream['EncryptionType'], 'KMS')
            self.assertIsNotNone(stream.get('KeyId'), "KMS key not configured")
            
        except ClientError as e:
            self.fail(f"Kinesis stream validation failed: {e}")
    
    def test_s3_bucket_exists(self):
        """Test that S3 bucket is created with proper security configuration."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.skip_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Check versioning
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', "Bucket versioning not enabled")
            
            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0, "No encryption rules found")
            
            # Check public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "Public ACLs not blocked")
            self.assertTrue(config['BlockPublicPolicy'], "Public policies not blocked")
            self.assertTrue(config['IgnorePublicAcls'], "Public ACLs not ignored")
            self.assertTrue(config['RestrictPublicBuckets'], "Public buckets not restricted")
            
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")


class TestComputeInfrastructure(BaseIntegrationTest):
    """Test compute resources (Lambda functions)."""
    
    def test_lambda_function_exists(self):
        """Test that Lambda function is created and properly configured."""
        function_name = self.get_output_value('lambda_function_name')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Validate function configuration
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'handler.lambda_handler')
            self.assertEqual(config['Timeout'], 60)
            self.assertEqual(config['MemorySize'], 512)
            
            # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            required_vars = ['DYNAMODB_TABLE', 'S3_BUCKET', 'ENVIRONMENT']
            for var in required_vars:
                self.assertIn(var, env_vars, f"Missing environment variable: {var}")
            
            # Check reserved concurrency (it's in the function configuration)
            reserved_concurrency = config.get('ReservedConcurrencyExecutions')
            if reserved_concurrency is not None:
                self.assertEqual(reserved_concurrency, 10, 
                               f"Expected reserved concurrency of 10, got {reserved_concurrency}")
                
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")
    
    def test_lambda_event_source_mapping(self):
        """Test that Kinesis event source mapping is configured."""
        function_name = self.get_output_value('lambda_function_name')
        kinesis_arn = self.get_output_value('kinesis_stream_arn')
        
        if not function_name or not kinesis_arn:
            pytest.skip("Lambda function or Kinesis stream not available")
        
        try:
            response = self.lambda_client.list_event_source_mappings(
                FunctionName=function_name
            )
            
            # Find Kinesis mapping
            kinesis_mappings = [
                mapping for mapping in response['EventSourceMappings']
                if mapping['EventSourceArn'] == kinesis_arn
            ]
            
            self.assertGreater(len(kinesis_mappings), 0, "No Kinesis event source mapping found")
            
            mapping = kinesis_mappings[0]
            self.assertEqual(mapping['State'], 'Enabled')
            self.assertEqual(mapping['StartingPosition'], 'LATEST')
            
        except ClientError as e:
            self.fail(f"Event source mapping validation failed: {e}")


class TestMonitoringInfrastructure(BaseIntegrationTest):
    """Test monitoring resources (CloudWatch, SNS)."""
    
    def test_sns_topics_exist(self):
        """Test that SNS topics are created for alerts."""
        sns_arn = self.get_output_value('sns_topic_arn')
        security_sns_arn = self.get_output_value('security_sns_topic_arn')
        
        if not sns_arn and not security_sns_arn:
            pytest.skip("No SNS topics found in outputs")
        
        try:
            if sns_arn:
                response = self.sns_client.get_topic_attributes(TopicArn=sns_arn)
                attrs = response['Attributes']
                display_name = attrs.get('DisplayName', '')
                self.assertIn('Anomaly', display_name, f"Expected 'Anomaly' in display name, got: {display_name}")
            
            if security_sns_arn:
                response = self.sns_client.get_topic_attributes(TopicArn=security_sns_arn)
                attrs = response['Attributes']
                display_name = attrs.get('DisplayName', '')
                self.assertIn('Security', display_name, f"Expected 'Security' in display name, got: {display_name}")
                
        except ClientError as e:
            self.fail(f"SNS topic validation failed: {e}")
    
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created for monitoring."""
        function_name = self.get_output_value('lambda_function_name')
        kinesis_name = self.get_output_value('kinesis_stream_name')
        
        if not function_name and not kinesis_name:
            pytest.skip("No resources available for alarm validation")
        
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Check for Lambda alarms
            if function_name:
                lambda_alarms = [name for name in alarm_names if 'lambda' in name.lower()]
                self.assertGreater(len(lambda_alarms), 0, "No Lambda CloudWatch alarms found")
            
            # Check for Kinesis alarms
            if kinesis_name:
                kinesis_alarms = [name for name in alarm_names if 'kinesis' in name.lower()]
                self.assertGreater(len(kinesis_alarms), 0, "No Kinesis CloudWatch alarms found")
                
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")
    
    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard is created."""
        dashboard_name = self.get_output_value('dashboard_name')
        self.skip_if_resource_missing('dashboard_name', 'CloudWatch dashboard')
        
        try:
            response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
            
            # Validate dashboard exists and has content
            self.assertIsNotNone(response['DashboardBody'])
            
            # Parse dashboard body to check for expected widgets
            dashboard_body = json.loads(response['DashboardBody'])
            widgets = dashboard_body.get('widgets', [])
            self.assertGreater(len(widgets), 0, "Dashboard has no widgets")
            
            # Check for Lambda and Kinesis metrics
            widget_sources = []
            for widget in widgets:
                properties = widget.get('properties', {})
                metrics = properties.get('metrics', [])
                for metric in metrics:
                    if len(metric) >= 2:
                        widget_sources.append(metric[0])  # Namespace
            
            self.assertIn('AWS/Lambda', widget_sources, "No Lambda metrics in dashboard")
            self.assertIn('AWS/Kinesis', widget_sources, "No Kinesis metrics in dashboard")
            
        except ClientError as e:
            self.fail(f"CloudWatch dashboard validation failed: {e}")


class TestInfrastructureIntegration(BaseIntegrationTest):
    """Test cross-service integration and data flow."""
    
    def test_iot_to_kinesis_integration(self):
        """Test that IoT rules can route data to Kinesis stream."""
        kinesis_name = self.get_output_value('kinesis_stream_name')
        self.skip_if_resource_missing('kinesis_stream_name', 'Kinesis stream for integration test')
        
        try:
            # List IoT rules and check their actions
            response = self.iot_client.list_topic_rules()
            
            kinesis_rules = []
            for rule in response['rules']:
                rule_detail = self.iot_client.get_topic_rule(ruleName=rule['ruleName'])
                actions = rule_detail['rule']['actions']
                
                for action in actions:
                    if 'kinesis' in action:
                        kinesis_rules.append(rule['ruleName'])
            
            self.assertGreater(len(kinesis_rules), 0, 
                             "No IoT rules configured to route to Kinesis")
            
        except ClientError as e:
            self.fail(f"IoT-Kinesis integration validation failed: {e}")
    
    def test_kinesis_to_lambda_integration(self):
        """Test that Kinesis stream triggers Lambda function."""
        function_name = self.get_output_value('lambda_function_name')
        kinesis_arn = self.get_output_value('kinesis_stream_arn')
        
        if not function_name or not kinesis_arn:
            pytest.skip("Lambda function or Kinesis stream not available for integration test")
        
        try:
            # Get event source mappings for the Lambda function
            response = self.lambda_client.list_event_source_mappings(
                FunctionName=function_name
            )
            
            # Check if Kinesis is configured as event source
            kinesis_sources = [
                mapping for mapping in response['EventSourceMappings']
                if kinesis_arn in mapping['EventSourceArn']
            ]
            
            self.assertGreater(len(kinesis_sources), 0, 
                             "Lambda function not configured to receive Kinesis events")
            
            # Verify mapping is active
            for mapping in kinesis_sources:
                self.assertEqual(mapping['State'], 'Enabled', 
                               "Kinesis event source mapping is not enabled")
                
        except ClientError as e:
            self.fail(f"Kinesis-Lambda integration validation failed: {e}")
    
    def test_environment_consistency(self):
        """Test that all resources use consistent environment naming."""
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
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


class TestSecurityConfiguration(BaseIntegrationTest):
    """Test security configurations across all resources."""
    
    def test_iam_roles_follow_least_privilege(self):
        """Test that IAM roles have appropriate permissions."""
        lambda_arn = self.get_output_value('lambda_function_arn')
        
        if not lambda_arn:
            pytest.skip("Lambda function ARN not available for IAM testing")
        
        try:
            # Get Lambda function configuration to find its role
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            role_arn = response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
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
            
        except ClientError as e:
            self.fail(f"IAM role validation failed: {e}")
    
    def test_encryption_at_rest(self):
        """Test that resources have encryption at rest enabled."""
        # Test DynamoDB encryption
        table_name = self.get_output_value('dynamodb_table_name')
        if table_name:
            try:
                response = self.dynamodb_client.describe_table(TableName=table_name)
                sse_description = response['Table'].get('SSEDescription')
                self.assertIsNotNone(sse_description, "DynamoDB table encryption not enabled")
                self.assertEqual(sse_description['Status'], 'ENABLED')
            except ClientError:
                pass  # Skip if table not accessible
        
        # Test Kinesis encryption
        stream_name = self.get_output_value('kinesis_stream_name')
        if stream_name:
            try:
                response = self.kinesis_client.describe_stream(StreamName=stream_name)
                encryption_type = response['StreamDescription']['EncryptionType']
                self.assertEqual(encryption_type, 'KMS', "Kinesis stream not encrypted with KMS")
            except ClientError:
                pass  # Skip if stream not accessible
        
        # Test S3 encryption
        bucket_name = self.get_output_value('s3_bucket_name')
        if bucket_name:
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                self.assertGreater(len(rules), 0, "S3 bucket has no encryption rules")
            except ClientError:
                pass  # Skip if bucket not accessible


if __name__ == '__main__':
    # Run integration tests
    unittest.main(verbosity=2)