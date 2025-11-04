"""Integration tests for TapStack SMS Notification System.

This module contains integration tests that verify the deployed infrastructure
components work correctly together. Tests are region-agnostic and use dynamic
values from CDK outputs.
"""

import json
import os
import unittest
import boto3
import time
import re
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

from pytest import mark

# Load CDK outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs_content = f.read().strip()
        flat_outputs = json.loads(flat_outputs_content) if flat_outputs_content else {}
else:
    flat_outputs = {}


@mark.describe("TapStack SMS Notification System Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack SMS notification system"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and extract outputs once for all tests"""
        # Check if outputs are available
        if not flat_outputs:
            raise unittest.SkipTest("No CDK outputs found - stack may not be deployed")
        
        # Extract region from SNS Topic ARN or Lambda ARN
        cls.region = cls._extract_region_from_outputs()
        
        # Initialize AWS clients with extracted region
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Extract outputs from CDK deployment
        cls.notification_logs_table_name = flat_outputs.get('NotificationLogsTableName')
        cls.customer_preferences_table_name = flat_outputs.get('CustomerPreferencesTableName')
        cls.lambda_function_name = flat_outputs.get('NotificationProcessorLambdaArn', '').split(':')[-1]
        cls.lambda_function_arn = flat_outputs.get('NotificationProcessorLambdaArn')
        cls.sms_topic_arn = flat_outputs.get('SMSTopicArn')
        cls.email_topic_arn = flat_outputs.get('EmailTopicArn')
        cls.environment_suffix = flat_outputs.get('EnvironmentSuffix')
        
        # Validate required outputs
        required_outputs = [
            cls.notification_logs_table_name,
            cls.customer_preferences_table_name,
            cls.lambda_function_name,
            cls.sms_topic_arn,
            cls.email_topic_arn
        ]
        
        if not all(required_outputs):
            raise unittest.SkipTest("Required CDK outputs missing")
        
        # Test data for integration tests
        cls.test_order_data = [
            {
                "orderId": "TEST-ORDER-001",
                "customerId": "TEST-CUSTOMER-001",
                "orderStatus": "confirmed",
                "customerPhone": "+15551234567",
                "customerEmail": "test.customer1@example.com",
                "orderDetails": {
                    "items": ["Product A", "Product B"],
                    "total": 99.99,
                    "trackingNumber": "TRK123456789"
                }
            },
            {
                "orderId": "TEST-ORDER-002",
                "customerId": "TEST-CUSTOMER-002",
                "orderStatus": "shipped",
                "customerPhone": "+15559876543",
                "customerEmail": "test.customer2@example.com",
                "orderDetails": {
                    "items": ["Product C"],
                    "total": 49.99,
                    "trackingNumber": "TRK987654321"
                }
            }
        ]
        
        cls.test_customer_preferences = [
            {
                "customerId": "TEST-CUSTOMER-001",
                "smsEnabled": True,
                "emailEnabled": True,
                "language": "en",
                "timezone": "America/New_York"
            },
            {
                "customerId": "TEST-CUSTOMER-002",
                "smsEnabled": False,
                "emailEnabled": True,
                "language": "en",
                "timezone": "America/Los_Angeles"
            }
        ]

    @classmethod
    def _extract_region_from_outputs(cls) -> str:
        """Extract AWS region from ARNs in outputs"""
        # Try to extract from SNS Topic ARN first
        sms_topic_arn = flat_outputs.get('SMSTopicArn', '')
        if sms_topic_arn:
            # ARN format: arn:aws:sns:region:account:topic-name
            match = re.match(r'arn:aws:sns:([^:]+):', sms_topic_arn)
            if match:
                return match.group(1)
        
        # Try to extract from Lambda ARN
        lambda_arn = flat_outputs.get('NotificationProcessorLambdaArn', '')
        if lambda_arn:
            # ARN format: arn:aws:lambda:region:account:function:function-name
            match = re.match(r'arn:aws:lambda:([^:]+):', lambda_arn)
            if match:
                return match.group(1)
        
        # Fallback to environment variable or default
        return os.environ.get('AWS_REGION', os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))

    @classmethod
    def tearDownClass(cls):
        """Clean up test data after all tests"""
        if hasattr(cls, 'dynamodb') and cls.notification_logs_table_name:
            try:
                # Clean up test notification logs
                logs_table = cls.dynamodb.Table(cls.notification_logs_table_name)
                for order_data in cls.test_order_data:
                    try:
                        logs_table.delete_item(Key={'orderId': order_data['orderId']})
                    except Exception:
                        pass  # Ignore cleanup errors
            except Exception:
                pass
        
        if hasattr(cls, 'dynamodb') and cls.customer_preferences_table_name:
            try:
                # Clean up test customer preferences
                prefs_table = cls.dynamodb.Table(cls.customer_preferences_table_name)
                for pref_data in cls.test_customer_preferences:
                    try:
                        prefs_table.delete_item(Key={'customerId': pref_data['customerId']})
                    except Exception:
                        pass  # Ignore cleanup errors
            except Exception:
                pass

    def setUp(self):
        """Set up test data before each test"""
        try:
            # Insert test customer preferences
            prefs_table = self.dynamodb.Table(self.customer_preferences_table_name)
            for pref_data in self.test_customer_preferences:
                prefs_table.put_item(Item=pref_data)
            
            # Allow for eventual consistency
            time.sleep(1)
        except Exception as e:
            self.skipTest(f"Failed to set up test data: {e}")

    @mark.it("validates DynamoDB notification logs table exists and is properly configured")
    def test_notification_logs_table_configuration(self):
        """Test that notification logs DynamoDB table exists with correct configuration"""
        try:
            table = self.dynamodb.Table(self.notification_logs_table_name)
            table.load()
        except ClientError as e:
            self.fail(f"Notification logs table {self.notification_logs_table_name} not found: {e}")
        
        # Get detailed table description
        table_description = self.dynamodb_client.describe_table(
            TableName=self.notification_logs_table_name
        )['Table']
        
        # Validate basic table properties
        self.assertEqual(table.table_name, self.notification_logs_table_name)
        self.assertEqual(table_description['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema (orderId as partition key, timestamp as sort key)
        key_schema = {item['AttributeName']: item['KeyType'] for item in table_description['KeySchema']}
        self.assertIn('orderId', key_schema)
        self.assertEqual(key_schema['orderId'], 'HASH')  # Partition key
        self.assertIn('timestamp', key_schema)
        self.assertEqual(key_schema['timestamp'], 'RANGE')  # Sort key
        
        # Check attribute definitions
        attributes = {attr['AttributeName']: attr['AttributeType'] 
                     for attr in table_description['AttributeDefinitions']}
        self.assertIn('orderId', attributes)
        self.assertEqual(attributes['orderId'], 'S')  # String type
        self.assertIn('timestamp', attributes)
        self.assertEqual(attributes['timestamp'], 'S')  # String type
        
        # Check encryption
        self.assertIn('SSEDescription', table_description)
        self.assertEqual(table_description['SSEDescription']['Status'], 'ENABLED')
        
        # Check point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.notification_logs_table_name
        )
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')
        
        # Check for Global Secondary Index (DeliveryStatusIndex)
        gsi_found = False
        for gsi in table_description.get('GlobalSecondaryIndexes', []):
            if gsi['IndexName'] == 'DeliveryStatusIndex':
                gsi_found = True
                gsi_key_schema = {item['AttributeName']: item['KeyType'] for item in gsi['KeySchema']}
                self.assertIn('deliveryStatus', gsi_key_schema)
                self.assertEqual(gsi_key_schema['deliveryStatus'], 'HASH')
                break
        
        self.assertTrue(gsi_found, "DeliveryStatusIndex GSI not found")
        
        print(f"✅ Notification logs table '{self.notification_logs_table_name}' is properly configured")

    @mark.it("validates DynamoDB customer preferences table exists and is properly configured")
    def test_customer_preferences_table_configuration(self):
        """Test that customer preferences DynamoDB table exists with correct configuration"""
        try:
            table = self.dynamodb.Table(self.customer_preferences_table_name)
            table.load()
        except ClientError as e:
            self.fail(f"Customer preferences table {self.customer_preferences_table_name} not found: {e}")
        
        # Get detailed table description
        table_description = self.dynamodb_client.describe_table(
            TableName=self.customer_preferences_table_name
        )['Table']
        
        # Validate basic table properties
        self.assertEqual(table.table_name, self.customer_preferences_table_name)
        self.assertEqual(table_description['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema (customerId as partition key)
        key_schema = {item['AttributeName']: item['KeyType'] for item in table_description['KeySchema']}
        self.assertIn('customerId', key_schema)
        self.assertEqual(key_schema['customerId'], 'HASH')  # Partition key
        
        # Check attribute definitions
        attributes = {attr['AttributeName']: attr['AttributeType'] 
                     for attr in table_description['AttributeDefinitions']}
        self.assertIn('customerId', attributes)
        self.assertEqual(attributes['customerId'], 'S')  # String type
        
        # Check encryption
        self.assertIn('SSEDescription', table_description)
        self.assertEqual(table_description['SSEDescription']['Status'], 'ENABLED')
        
        print(f"✅ Customer preferences table '{self.customer_preferences_table_name}' is properly configured")

    @mark.it("validates Lambda notification processor function exists and is properly configured")
    def test_lambda_function_configuration(self):
        """Test that Lambda notification processor function exists with correct configuration"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        except ClientError as e:
            self.fail(f"Lambda function {self.lambda_function_name} not found: {e}")
        
        function_config = response['Configuration']
        
        # Validate basic function properties
        self.assertEqual(function_config['FunctionName'], self.lambda_function_name)
        self.assertEqual(function_config['Runtime'], 'python3.11')
        self.assertEqual(function_config['Handler'], 'index.lambda_handler')
        self.assertEqual(function_config['Timeout'], 300)  # 5 minutes
        self.assertEqual(function_config['MemorySize'], 512)
        
        # Check environment variables
        env_vars = function_config.get('Environment', {}).get('Variables', {})
        self.assertIn('NOTIFICATION_LOGS_TABLE', env_vars)
        self.assertEqual(env_vars['NOTIFICATION_LOGS_TABLE'], self.notification_logs_table_name)
        self.assertIn('CUSTOMER_PREFERENCES_TABLE', env_vars)
        self.assertEqual(env_vars['CUSTOMER_PREFERENCES_TABLE'], self.customer_preferences_table_name)
        self.assertIn('SMS_TOPIC_ARN', env_vars)
        self.assertEqual(env_vars['SMS_TOPIC_ARN'], self.sms_topic_arn)
        self.assertIn('EMAIL_TOPIC_ARN', env_vars)
        self.assertEqual(env_vars['EMAIL_TOPIC_ARN'], self.email_topic_arn)
        self.assertIn('LOG_LEVEL', env_vars)
        self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')
        
        # Check IAM role exists and has correct pattern
        role_arn = function_config['Role']
        self.assertIn('notification-processor-role', role_arn.lower())
        
        print(f"✅ Lambda function '{self.lambda_function_name}' is properly configured")
        print(f"   Runtime: {function_config['Runtime']}")
        print(f"   Timeout: {function_config['Timeout']}s")
        print(f"   Memory: {function_config['MemorySize']}MB")
        print(f"   Environment variables: {len(env_vars)} configured")

    @mark.it("validates SNS topics exist and are properly configured")
    def test_sns_topics_configuration(self):
        """Test that SMS and email SNS topics exist with correct configuration"""
        # Test SMS Topic
        try:
            sms_response = self.sns_client.get_topic_attributes(TopicArn=self.sms_topic_arn)
            sms_attributes = sms_response['Attributes']
            
            # Validate SMS topic name pattern
            sms_topic_name = sms_attributes['TopicArn'].split(':')[-1]
            self.assertTrue(sms_topic_name.startswith('order-updates-sms-'),
                          f"SMS topic name should start with 'order-updates-sms-', got: {sms_topic_name}")
            
            print(f"✅ SMS topic '{sms_topic_name}' is properly configured")
            
        except ClientError as e:
            self.fail(f"SMS topic {self.sms_topic_arn} not found or not accessible: {e}")
        
        # Test Email Topic
        try:
            email_response = self.sns_client.get_topic_attributes(TopicArn=self.email_topic_arn)
            email_attributes = email_response['Attributes']
            
            # Validate email topic name pattern
            email_topic_name = email_attributes['TopicArn'].split(':')[-1]
            self.assertTrue(email_topic_name.startswith('order-updates-email-'),
                          f"Email topic name should start with 'order-updates-email-', got: {email_topic_name}")
            
            print(f"✅ Email topic '{email_topic_name}' is properly configured")
            
        except ClientError as e:
            self.fail(f"Email topic {self.email_topic_arn} not found or not accessible: {e}")

    @mark.it("validates CloudWatch log group exists for Lambda function")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists for Lambda function with proper retention"""
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        
        try:
            log_groups_response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
        except ClientError as e:
            self.fail(f"Error checking CloudWatch log groups: {e}")
        
        # Find the exact log group
        log_group_found = False
        for log_group in log_groups_response['logGroups']:
            if log_group['logGroupName'] == log_group_name:
                log_group_found = True
                # Check retention period (14 days)
                self.assertEqual(log_group.get('retentionInDays'), 14)
                break
        
        self.assertTrue(log_group_found, f"Log group {log_group_name} not found")
        print(f"✅ CloudWatch log group '{log_group_name}' exists with 14-day retention")

    @mark.it("validates Lambda function can process SMS notification requests successfully")
    def test_lambda_function_sms_notification_processing(self):
        """Test that Lambda function can process order notification events for SMS"""
        # Test data for SMS-enabled customer
        test_event = self.test_order_data[0]  # Customer with SMS enabled
        
        try:
            # Invoke Lambda function
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
            
            # Parse response
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            
            # Validate response structure
            self.assertEqual(response['StatusCode'], 200)
            self.assertIn('statusCode', payload)
            self.assertIn('body', payload)
            
            # Parse response body
            body = json.loads(payload['body'])
            self.assertTrue(body['success'])
            self.assertEqual(body['orderId'], test_event['orderId'])
            
            # Allow time for DynamoDB write
            time.sleep(2)
            
            # Verify notification log was created using Query (since table has composite key)
            logs_table = self.dynamodb.Table(self.notification_logs_table_name)
            log_response = logs_table.query(
                KeyConditionExpression=Key('orderId').eq(test_event['orderId'])
            )
            
            # Validate log entry exists
            self.assertGreater(log_response['Count'], 0, "No notification log entries found")
            log_item = log_response['Items'][0]  # Get the first/latest item
            self.assertEqual(log_item['orderId'], test_event['orderId'])
            self.assertEqual(log_item['customerId'], test_event['customerId'])
            self.assertEqual(log_item['orderStatus'], test_event['orderStatus'])
            self.assertIn('timestamp', log_item)
            self.assertIn('notificationMethod', log_item)
            self.assertIn('deliveryStatus', log_item)
            
            print(f"✅ Lambda function successfully processed SMS notification for order {test_event['orderId']}")
            print(f"   Notification method: {log_item.get('notificationMethod', 'unknown')}")
            print(f"   Delivery status: {log_item.get('deliveryStatus', 'unknown')}")
            
        except ClientError as e:
            self.fail(f"Lambda function invocation failed: {e}")

    @mark.it("validates Lambda function can process email fallback notifications")
    def test_lambda_function_email_fallback_processing(self):
        """Test that Lambda function processes email fallback for SMS-disabled customers"""
        # Test data for SMS-disabled customer
        test_event = self.test_order_data[1]  # Customer with SMS disabled
        
        try:
            # Invoke Lambda function
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
            
            # Parse response
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            
            # Validate response structure
            self.assertEqual(response['StatusCode'], 200)
            self.assertIn('statusCode', payload)
            self.assertIn('body', payload)
            
            # Parse response body
            body = json.loads(payload['body'])
            self.assertTrue(body['success'])
            self.assertEqual(body['orderId'], test_event['orderId'])
            
            # Allow time for DynamoDB write
            time.sleep(2)
            
            # Verify notification log was created using Query (since table has composite key)
            logs_table = self.dynamodb.Table(self.notification_logs_table_name)
            log_response = logs_table.query(
                KeyConditionExpression=Key('orderId').eq(test_event['orderId'])
            )
            
            # Validate log entry exists
            self.assertGreater(log_response['Count'], 0, "No notification log entries found")
            log_item = log_response['Items'][0]  # Get the first/latest item
            self.assertEqual(log_item['orderId'], test_event['orderId'])
            self.assertEqual(log_item['customerId'], test_event['customerId'])
            self.assertIn('notificationMethod', log_item)
            
            # Debug information
            print(f"Debug: notification method = '{log_item.get('notificationMethod', 'unknown')}'")
            print(f"Debug: delivery status = '{log_item.get('deliveryStatus', 'unknown')}'")
            print(f"Debug: full log item = {log_item}")
            
            # Should be email since SMS is disabled for this customer
            # Accept either 'email' or 'email_fallback' as valid email notification methods
            notification_method = log_item.get('notificationMethod', '')
            self.assertTrue(
                'email' in notification_method.lower(),
                f"Expected notification method to contain 'email', but got: '{notification_method}'"
            )
            
            print(f"✅ Lambda function successfully processed email notification for order {test_event['orderId']}")
            print(f"   Notification method: {log_item.get('notificationMethod', 'unknown')}")
            print(f"   Delivery status: {log_item.get('deliveryStatus', 'unknown')}")
            
        except ClientError as e:
            self.fail(f"Lambda function invocation failed: {e}")

    @mark.it("validates Lambda function handles missing required fields gracefully")
    def test_lambda_function_error_handling(self):
        """Test that Lambda function handles invalid input gracefully"""
        # Test with missing required fields
        invalid_event = {
            "orderId": "TEST-INVALID-001",
            # Missing customerId and orderStatus
            "customerEmail": "test@example.com"
        }
        
        try:
            # Invoke Lambda function with invalid data
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(invalid_event)
            )
            
            # Parse response
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            
            # Should return error response
            self.assertEqual(response['StatusCode'], 200)  # Lambda executed successfully
            self.assertIn('statusCode', payload)
            self.assertEqual(payload['statusCode'], 500)  # Application error
            
            # Parse error body
            body = json.loads(payload['body'])
            self.assertFalse(body['success'])
            self.assertIn('error', body)
            
            print(f"✅ Lambda function properly handles invalid input with error: {body['error']}")
            
        except ClientError as e:
            self.fail(f"Lambda function invocation failed: {e}")

    @mark.it("validates system components work together end-to-end")
    def test_end_to_end_notification_system(self):
        """Test complete notification flow from order event to logged notification"""
        # Use fresh test data
        e2e_event = {
            "orderId": "E2E-TEST-ORDER-001",
            "customerId": "E2E-TEST-CUSTOMER-001",
            "orderStatus": "delivered",
            "customerPhone": "+15551112222",
            "customerEmail": "e2e.test@example.com",
            "orderDetails": {
                "items": ["End-to-End Test Product"],
                "total": 123.45,
                "trackingNumber": "E2E123456789"
            }
        }
        
        # Set up customer preferences for E2E test
        e2e_preferences = {
            "customerId": "E2E-TEST-CUSTOMER-001",
            "smsEnabled": True,
            "emailEnabled": True,
            "language": "en"
        }
        
        try:
            # Insert test customer preferences
            prefs_table = self.dynamodb.Table(self.customer_preferences_table_name)
            prefs_table.put_item(Item=e2e_preferences)
            time.sleep(1)
            
            # Process notification through Lambda
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(e2e_event)
            )
            
            # Validate Lambda response
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            self.assertEqual(response['StatusCode'], 200)
            body = json.loads(payload['body'])
            self.assertTrue(body['success'])
            
            # Allow time for all async operations
            time.sleep(3)
            
            # Verify notification log was created using Query (since table has composite key)
            logs_table = self.dynamodb.Table(self.notification_logs_table_name)
            log_response = logs_table.query(
                KeyConditionExpression=Key('orderId').eq(e2e_event['orderId'])
            )
            
            self.assertGreater(log_response['Count'], 0, "No notification log entries found")
            log_item = log_response['Items'][0]  # Get the first/latest item
            
            # Validate complete log entry
            self.assertEqual(log_item['orderId'], e2e_event['orderId'])
            self.assertEqual(log_item['customerId'], e2e_event['customerId'])
            self.assertEqual(log_item['orderStatus'], e2e_event['orderStatus'])
            self.assertIn('timestamp', log_item)
            self.assertIn('message', log_item)
            self.assertIn('delivered', log_item['message'])  # Status should be in message
            
            print(f"✅ End-to-end notification system test completed successfully")
            print(f"   Order ID: {log_item['orderId']}")
            print(f"   Customer ID: {log_item['customerId']}")
            print(f"   Notification method: {log_item.get('notificationMethod', 'unknown')}")
            print(f"   Message: {log_item.get('message', 'No message')[:50]}...")
            
            # Clean up E2E test data
            try:
                # For notification logs, delete using the composite key (orderId + timestamp)
                if log_item and 'timestamp' in log_item:
                    logs_table.delete_item(Key={
                        'orderId': e2e_event['orderId'],
                        'timestamp': log_item['timestamp']
                    })
                # Customer preferences table uses single key
                prefs_table.delete_item(Key={'customerId': e2e_preferences['customerId']})
            except Exception:
                pass  # Ignore cleanup errors
            
        except ClientError as e:
            self.fail(f"End-to-end test failed: {e}")

    @mark.it("validates all infrastructure components are deployed in the same region")
    def test_resource_region_consistency(self):
        """Test that all resources are deployed in the same AWS region"""
        # Extract regions from different ARNs
        sms_region = self.sms_topic_arn.split(':')[3] if self.sms_topic_arn else None
        email_region = self.email_topic_arn.split(':')[3] if self.email_topic_arn else None
        lambda_region = self.lambda_function_arn.split(':')[3] if self.lambda_function_arn else None
        
        # All regions should match
        regions = [sms_region, email_region, lambda_region]
        unique_regions = set(filter(None, regions))
        
        self.assertEqual(len(unique_regions), 1, 
                        f"Resources deployed across multiple regions: {unique_regions}")
        
        # Should match the region we're using for clients
        deployed_region = unique_regions.pop()
        self.assertEqual(deployed_region, self.region,
                        f"Deployed region {deployed_region} doesn't match client region {self.region}")
        
        print(f"✅ All resources are deployed in region: {deployed_region}")

    @mark.it("validates IAM permissions allow Lambda to access all required services")
    def test_lambda_iam_permissions(self):
        """Test that Lambda function has proper IAM permissions for all required services"""
        try:
            # Get Lambda function configuration to get role ARN
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role policies
            policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Should have basic Lambda execution policy
            policy_arns = [policy['PolicyArn'] for policy in policies_response['AttachedPolicies']]
            lambda_execution_policy = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            self.assertIn(lambda_execution_policy, policy_arns,
                         "Lambda execution role missing basic execution policy")
            
            # Get inline policies for additional permissions
            inline_policies_response = self.iam_client.list_role_policies(RoleName=role_name)
            
            # Should have inline policies for DynamoDB, SNS, and SES access
            self.assertGreater(len(inline_policies_response['PolicyNames']), 0,
                             "No inline policies found for Lambda role")
            
            print(f"✅ Lambda function has proper IAM role with required permissions")
            print(f"   Role: {role_name}")
            print(f"   Attached policies: {len(policy_arns)}")
            print(f"   Inline policies: {len(inline_policies_response['PolicyNames'])}")
            
        except ClientError as e:
            self.fail(f"Failed to validate IAM permissions: {e}")


if __name__ == "__main__":
    unittest.main()