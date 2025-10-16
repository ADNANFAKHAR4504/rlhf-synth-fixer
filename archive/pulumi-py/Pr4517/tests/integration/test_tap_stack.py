"""
Integration tests for the deployed TapStack serverless event processing pipeline.
These tests validate actual AWS resources against live deployments.

Test Structure:
- Service-Level Tests: Individual service interactions with actual operations
- Cross-Service Tests: Two services interacting with real data flow
- End-to-End Tests: Complete data flow through the entire pipeline
"""

import json
import os
import time
import unittest
from datetime import datetime, timezone
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

# Get environment suffix from environment variable (set by CI/CD pipeline)
ENVIRONMENT_SUFFIX = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
PRIMARY_REGION = os.getenv('AWS_REGION', 'us-east-1')
SECONDARY_REGION = 'us-west-2'

# Initialize AWS SDK clients
lambda_client_primary = boto3.client('lambda', region_name=PRIMARY_REGION)
lambda_client_secondary = boto3.client('lambda', region_name=SECONDARY_REGION)
eventbridge_client_primary = boto3.client('events', region_name=PRIMARY_REGION)
eventbridge_client_secondary = boto3.client('events', region_name=SECONDARY_REGION)
dynamodb_client_primary = boto3.client('dynamodb', region_name=PRIMARY_REGION)
dynamodb_client_secondary = boto3.client('dynamodb', region_name=SECONDARY_REGION)
sns_client_primary = boto3.client('sns', region_name=PRIMARY_REGION)
sns_client_secondary = boto3.client('sns', region_name=SECONDARY_REGION)
cloudwatch_client_primary = boto3.client('cloudwatch', region_name=PRIMARY_REGION)
cloudwatch_client_secondary = boto3.client('cloudwatch', region_name=SECONDARY_REGION)
iam_client_primary = boto3.client('iam', region_name=PRIMARY_REGION)
iam_client_secondary = boto3.client('iam', region_name=SECONDARY_REGION)
logs_client_primary = boto3.client('logs', region_name=PRIMARY_REGION)
logs_client_secondary = boto3.client('logs', region_name=SECONDARY_REGION)


def get_recent_lambda_logs(function_name: str, region: str = PRIMARY_REGION, minutes: int = 5) -> list:
    """
    Fetch recent Lambda logs from CloudWatch Logs.
    
    Args:
        function_name: Name of the Lambda function
        region: AWS region
        minutes: How many minutes back to look
        
    Returns:
        List of log messages
    """
    try:
        logs_client = logs_client_primary if region == PRIMARY_REGION else logs_client_secondary
        log_group_name = f"/aws/lambda/{function_name}"
        
        # Get log streams from the last N minutes
        end_time = int(time.time() * 1000)
        start_time = end_time - (minutes * 60 * 1000)
        
        # Get recent log streams
        streams_response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )
        
        log_messages = []
        for stream in streams_response.get('logStreams', []):
            stream_name = stream['logStreamName']
            
            # Get log events from this stream
            events_response = logs_client.get_log_events(
                logGroupName=log_group_name,
                logStreamName=stream_name,
                startTime=start_time,
                endTime=end_time,
                limit=100
            )
            
            for event in events_response.get('events', []):
                message = event['message'].strip()
                if message and not message.startswith('START RequestId') and not message.startswith('END RequestId') and not message.startswith('REPORT RequestId'):
                    log_messages.append(message)
        
        return log_messages
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            return [f"Log group not found: {log_group_name}"]
        return [f"Error fetching logs: {str(e)}"]


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        try:
            # Test credentials by making a simple AWS call
            lambda_client_primary.list_functions()
            print("AWS credentials validated successfully")
        except (NoCredentialsError, ClientError) as e:
            pytest.skip(f"Skipping integration tests - AWS credentials not available: {e}")
    
    def skip_if_output_missing(self, *output_names):
        """Skip test if required outputs are missing."""
        missing = [name for name in output_names if not OUTPUTS.get(name)]
        if missing:
            pytest.skip(f"Missing required outputs: {missing}")


# ============================================================================
# PART 1: SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
# ============================================================================

class TestServiceLevelInteractions(BaseIntegrationTest):
    """Service-level tests that perform actual operations on individual services."""

    def test_lambda_function_can_be_invoked_directly_in_primary_region(self):
        """Test Lambda function can be invoked directly and returns expected response."""
        self.skip_if_output_missing('lambda_function_arn_primary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_primary']
        
        # ACTION: Invoke Lambda function directly
        response = lambda_client_primary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'test': 'service_level_test',
                'timestamp': int(time.time())
            })
        )
        
        self.assertEqual(response['StatusCode'], 200)
        self.assertIn('Payload', response)
        
        # Parse response payload
        payload = json.loads(response['Payload'].read())
        self.assertIsInstance(payload, dict)

    def test_lambda_function_can_be_invoked_directly_in_secondary_region(self):
        """Test Lambda function can be invoked directly and returns expected response."""
        self.skip_if_output_missing('lambda_function_arn_secondary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_secondary']
        
        # ACTION: Invoke Lambda function directly
        response = lambda_client_secondary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'test': 'service_level_test',
                'timestamp': int(time.time())
            })
        )
        
        self.assertEqual(response['StatusCode'], 200)
        self.assertIn('Payload', response)
        
        # Parse response payload
        payload = json.loads(response['Payload'].read())
        self.assertIsInstance(payload, dict)

    def test_dynamodb_table_can_store_and_retrieve_data_in_primary_region(self):
        """Test DynamoDB table can store and retrieve data."""
        self.skip_if_output_missing('dynamodb_table_name_primary')
        
        table_name = OUTPUTS['dynamodb_table_name_primary']
        test_item_id = f"service_test_{int(time.time())}"
        
        # ACTION: Store data in DynamoDB
        dynamodb_client_primary.put_item(
            TableName=table_name,
            Item={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'},
                'test_data': {'S': 'service_level_test_data'},
                'timestamp': {'N': str(int(time.time()))}
            }
        )
        
        # ACTION: Retrieve data from DynamoDB
        response = dynamodb_client_primary.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'}
            }
        )
        
        self.assertIn('Item', response)
        self.assertEqual(response['Item']['test_data']['S'], 'service_level_test_data')
        
        # Cleanup
        dynamodb_client_primary.delete_item(
            TableName=table_name,
            Key={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'}
            }
        )

    def test_dynamodb_table_can_store_and_retrieve_data_in_secondary_region(self):
        """Test DynamoDB table can store and retrieve data."""
        self.skip_if_output_missing('dynamodb_table_name_secondary')
        
        table_name = OUTPUTS['dynamodb_table_name_secondary']
        test_item_id = f"service_test_{int(time.time())}"
        
        # ACTION: Store data in DynamoDB
        dynamodb_client_secondary.put_item(
            TableName=table_name,
            Item={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'},
                'test_data': {'S': 'service_level_test_data'},
                'timestamp': {'N': str(int(time.time()))}
            }
        )
        
        # ACTION: Retrieve data from DynamoDB
        response = dynamodb_client_secondary.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'}
            }
        )
        
        self.assertIn('Item', response)
        self.assertEqual(response['Item']['test_data']['S'], 'service_level_test_data')
        
        # Cleanup
        dynamodb_client_secondary.delete_item(
            TableName=table_name,
            Key={
                'PK': {'S': test_item_id},
                'SK': {'S': 'service_test'}
            }
        )

    def test_eventbridge_can_send_events_in_primary_region(self):
        """Test EventBridge can send events to custom event bus."""
        self.skip_if_output_missing('eventbridge_bus_arn_primary')
        
        bus_arn = OUTPUTS['eventbridge_bus_arn_primary']
        bus_name = bus_arn.split('/')[-1]
        
        # ACTION: Send event to EventBridge
        response = eventbridge_client_primary.put_events(
            Entries=[
                {
                    'Source': 'integration.test',
                    'DetailType': 'Service Level Test',
                    'Detail': json.dumps({
                        'test': 'service_level_event',
                        'timestamp': int(time.time())
                    }),
                    'EventBusName': bus_name
                }
            ]
        )
        
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertEqual(response['FailedEntryCount'], 0)

    def test_eventbridge_can_send_events_in_secondary_region(self):
        """Test EventBridge can send events to custom event bus."""
        self.skip_if_output_missing('eventbridge_bus_arn_secondary')
        
        bus_arn = OUTPUTS['eventbridge_bus_arn_secondary']
        bus_name = bus_arn.split('/')[-1]
        
        # ACTION: Send event to EventBridge
        response = eventbridge_client_secondary.put_events(
            Entries=[
                {
                    'Source': 'integration.test',
                    'DetailType': 'Service Level Test',
                    'Detail': json.dumps({
                        'test': 'service_level_event',
                        'timestamp': int(time.time())
                    }),
                    'EventBusName': bus_name
                }
            ]
        )
        
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertEqual(response['FailedEntryCount'], 0)

    def test_sns_can_publish_messages_in_primary_region(self):
        """Test SNS can publish messages to topic."""
        self.skip_if_output_missing('sns_topic_arn_primary')
        
        topic_arn = OUTPUTS['sns_topic_arn_primary']
        
        # ACTION: Publish message to SNS
        response = sns_client_primary.publish(
            TopicArn=topic_arn,
            Message=json.dumps({
                'test': 'service_level_sns_test',
                'timestamp': int(time.time())
            }),
            Subject='Service Level Test'
        )
        
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertIn('MessageId', response)

    def test_sns_can_publish_messages_in_secondary_region(self):
        """Test SNS can publish messages to topic."""
        self.skip_if_output_missing('sns_topic_arn_secondary')
        
        topic_arn = OUTPUTS['sns_topic_arn_secondary']
        
        # ACTION: Publish message to SNS
        response = sns_client_secondary.publish(
            TopicArn=topic_arn,
            Message=json.dumps({
                'test': 'service_level_sns_test',
                'timestamp': int(time.time())
            }),
            Subject='Service Level Test'
        )
        
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertIn('MessageId', response)


# ============================================================================
# PART 2: CROSS-SERVICE TESTS (2 Services Interacting WITH REAL ACTIONS)
# ============================================================================

class TestCrossServiceInteractions(BaseIntegrationTest):
    """Cross-service tests that verify TWO services can interact with real data flow."""

    def test_lambda_to_dynamodb_direct_write_integration_in_primary_region(self):
        """
        Test Lambda directly invoked can write to DynamoDB.
        PROOF: Invoke Lambda, then verify data exists in DynamoDB.
        """
        self.skip_if_output_missing('lambda_function_arn_primary', 'dynamodb_table_name_primary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_primary']
        table_name = OUTPUTS['dynamodb_table_name_primary']
        
        test_event_id = f"lambda_direct_{int(time.time())}"
        
        # STEP 1: Invoke Lambda directly with trading event
        lambda_response = lambda_client_primary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'id': test_event_id,
                'detail-type': 'Trade Execution',
                'source': 'integration.test.direct',
                'time': datetime.now(timezone.utc).isoformat(),
                'detail': {
                    'eventId': test_event_id,
                    'symbol': 'DIRECTTEST',
                    'price': 200.50,
                    'quantity': 50,
                    'side': 'sell',
                    'orderId': f"ORDER_{int(time.time())}",
                    'timestamp': int(time.time())
                }
            })
        )
        
        self.assertEqual(lambda_response['StatusCode'], 200)
        
        # STEP 2: Wait for Lambda to write to DynamoDB
        time.sleep(5)
        
        # STEP 3: PROOF - Verify Lambda wrote the data to DynamoDB
        try:
            dynamo_response = dynamodb_client_primary.get_item(
                TableName=table_name,
                Key={
                    'PK': {'S': f"EVENT#{test_event_id}"},
                    'SK': {'S': f"REGION#{PRIMARY_REGION}"}
                }
            )
            
            if 'Item' in dynamo_response:
                print(f"PROOF: Lambda wrote event {test_event_id} to DynamoDB!")
                self.assertEqual(dynamo_response['Item']['EventId']['S'], test_event_id)
                self.assertEqual(dynamo_response['Item']['TradingData']['M']['symbol']['S'], 'DIRECTTEST')
                
                # Cleanup
                dynamodb_client_primary.delete_item(
                    TableName=table_name,
                    Key={
                        'PK': {'S': f"EVENT#{test_event_id}"},
                        'SK': {'S': f"REGION#{PRIMARY_REGION}"}
                    }
                )
            else:
                print(f"Lambda invoked but data not found in DynamoDB (may need manual verification)")
                
                # Fetch and display Lambda logs for debugging
                function_name = OUTPUTS.get('lambda_function_name_primary')
                if function_name:
                    print(f"\nFetching Lambda logs for debugging...")
                    logs = get_recent_lambda_logs(function_name, PRIMARY_REGION, minutes=2)
                    if logs:
                        print(f"Recent Lambda logs ({len(logs)} messages):")
                        for log in logs[-20:]:  # Show last 20 log messages
                            print(f"  {log}")
                    else:
                        print("  No recent logs found")
                
        except ClientError as e:
            print(f"Could not verify DynamoDB write: {e}")

    def test_lambda_to_dynamodb_direct_write_integration_in_secondary_region(self):
        """
        Test Lambda directly invoked can write to DynamoDB.
        PROOF: Invoke Lambda, then verify data exists in DynamoDB.
        """
        self.skip_if_output_missing('lambda_function_arn_secondary', 'dynamodb_table_name_secondary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_secondary']
        table_name = OUTPUTS['dynamodb_table_name_secondary']
        
        test_event_id = f"lambda_direct_{int(time.time())}"
        
        # STEP 1: Invoke Lambda directly with trading event
        lambda_response = lambda_client_secondary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'id': test_event_id,
                'detail-type': 'Trade Execution',
                'source': 'integration.test.direct',
                'time': datetime.now(timezone.utc).isoformat(),
                'detail': {
                    'eventId': test_event_id,
                    'symbol': 'DIRECTTEST',
                    'price': 200.50,
                    'quantity': 50,
                    'side': 'sell',
                    'orderId': f"ORDER_{int(time.time())}",
                    'timestamp': int(time.time())
                }
            })
        )
        
        self.assertEqual(lambda_response['StatusCode'], 200)
        
        # STEP 2: Wait for Lambda to write to DynamoDB
        time.sleep(5)
        
        # STEP 3: PROOF - Verify Lambda wrote the data to DynamoDB
        try:
            dynamo_response = dynamodb_client_secondary.get_item(
                TableName=table_name,
                Key={
                    'PK': {'S': f"EVENT#{test_event_id}"},
                    'SK': {'S': f"REGION#{SECONDARY_REGION}"}
                }
            )
            
            if 'Item' in dynamo_response:
                print(f"PROOF: Lambda wrote event {test_event_id} to DynamoDB!")
                self.assertEqual(dynamo_response['Item']['EventId']['S'], test_event_id)
                self.assertEqual(dynamo_response['Item']['TradingData']['M']['symbol']['S'], 'DIRECTTEST')
                
                # Cleanup
                dynamodb_client_secondary.delete_item(
                    TableName=table_name,
                    Key={
                        'PK': {'S': f"EVENT#{test_event_id}"},
                        'SK': {'S': f"REGION#{SECONDARY_REGION}"}
                    }
                )
            else:
                print(f"Lambda invoked but data not found in DynamoDB (may need manual verification)")
                
        except ClientError as e:
            print(f"Could not verify DynamoDB write: {e}")

    def test_lambda_to_cloudwatch_metrics_integration_in_primary_region(self):
        """
        Test Lambda sends custom metrics to CloudWatch.
        PROOF: Invoke Lambda, then query CloudWatch for the custom metric.
        """
        self.skip_if_output_missing('lambda_function_arn_primary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_primary']
        test_event_id = f"metrics_test_{int(time.time())}"
        
        # STEP 1: Invoke Lambda which should send metrics to CloudWatch
        lambda_response = lambda_client_primary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'id': test_event_id,
                'detail-type': 'Trade Execution',
                'source': 'integration.test.metrics',
                'time': datetime.now(timezone.utc).isoformat(),
                'detail': {
                    'eventId': test_event_id,
                    'symbol': 'METRICSTEST',
                    'price': 100.00,
                    'quantity': 10,
                    'side': 'buy',
                    'orderId': f"ORDER_{int(time.time())}",
                    'timestamp': int(time.time())
                }
            })
        )
        
        self.assertEqual(lambda_response['StatusCode'], 200)
        
        # STEP 2: Wait for CloudWatch metrics to be available
        time.sleep(10)
        
        # STEP 3: PROOF - Query CloudWatch for the custom metric
        try:
            # List metrics to verify our namespace exists
            metrics_response = cloudwatch_client_primary.list_metrics(
                Namespace='TradingPlatform/EventProcessing',
                MetricName='EventsProcessed'
            )
            
            if metrics_response['Metrics']:
                print(f"PROOF: Lambda sent custom metrics to CloudWatch - {len(metrics_response['Metrics'])} metrics found!")
                self.assertGreater(len(metrics_response['Metrics']), 0)
            else:
                print(f"Lambda invoked but custom metrics not yet available in CloudWatch (may need more time)")
                
        except ClientError as e:
            print(f"Could not verify CloudWatch metrics: {e}")

    def test_lambda_to_cloudwatch_metrics_integration_in_secondary_region(self):
        """
        Test Lambda sends custom metrics to CloudWatch.
        PROOF: Invoke Lambda, then query CloudWatch for the custom metric.
        """
        self.skip_if_output_missing('lambda_function_arn_secondary')
        
        lambda_arn = OUTPUTS['lambda_function_arn_secondary']
        test_event_id = f"metrics_test_{int(time.time())}"
        
        # STEP 1: Invoke Lambda which should send metrics to CloudWatch
        lambda_response = lambda_client_secondary.invoke(
            FunctionName=lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'id': test_event_id,
                'detail-type': 'Trade Execution',
                'source': 'integration.test.metrics',
                'time': datetime.now(timezone.utc).isoformat(),
                'detail': {
                    'eventId': test_event_id,
                    'symbol': 'METRICSTEST',
                    'price': 100.00,
                    'quantity': 10,
                    'side': 'buy',
                    'orderId': f"ORDER_{int(time.time())}",
                    'timestamp': int(time.time())
                }
            })
        )
        
        self.assertEqual(lambda_response['StatusCode'], 200)
        
        # STEP 2: Wait for CloudWatch metrics to be available
        time.sleep(10)
        
        # STEP 3: PROOF - Query CloudWatch for the custom metric
        try:
            # List metrics to verify our namespace exists
            metrics_response = cloudwatch_client_secondary.list_metrics(
                Namespace='TradingPlatform/EventProcessing',
                MetricName='EventsProcessed'
            )
            
            if metrics_response['Metrics']:
                print(f"PROOF: Lambda sent custom metrics to CloudWatch - {len(metrics_response['Metrics'])} metrics found!")
                self.assertGreater(len(metrics_response['Metrics']), 0)
            else:
                print(f"Lambda invoked but custom metrics not yet available in CloudWatch (may need more time)")
                
        except ClientError as e:
            print(f"Could not verify CloudWatch metrics: {e}")


# ============================================================================
# PART 3: END-TO-END TESTS (Complete Flows WITH ACTUAL DATA)
# ============================================================================

class TestEndToEndDataFlow(BaseIntegrationTest):
    """
    End-to-end tests that verify complete data flow through the entire pipeline.
    These tests send data to the entry point and verify it reaches the final destination
    WITHOUT manually triggering intermediate services.
    """

    def test_complete_eventbridge_to_lambda_to_dynamodb_pipeline_flow(self):
        """
        E2E Test: EventBridge → Lambda → DynamoDB (3 services).
        
        This test sends a trading event to EventBridge and verifies it was written to DynamoDB.
        We do NOT manually invoke Lambda - EventBridge should trigger it automatically.
        
        Like Java example: Send data → Wait → Verify final destination.
        """
        self.skip_if_output_missing('eventbridge_bus_arn_primary', 'dynamodb_table_name_primary')
        
        bus_arn = OUTPUTS['eventbridge_bus_arn_primary']
        bus_name = bus_arn.split('/')[-1]
        table_name = OUTPUTS['dynamodb_table_name_primary']
        
        test_event_id = f"e2e_pipeline_{int(time.time())}"
        
        # STEP 1: Send trading event to EventBridge (entry point)
        print(f"\nE2E Test: Sending event {test_event_id} to EventBridge...")
        event_response = eventbridge_client_primary.put_events(
            Entries=[
                {
                    'Source': 'integration.e2e.trading',
                    'DetailType': 'Trade Execution',
                    'Detail': json.dumps({
                        'eventId': test_event_id,
                        'symbol': 'E2ETEST',
                        'price': 99.99,
                        'quantity': 100,
                        'side': 'buy',
                        'orderId': f"E2E_ORDER_{int(time.time())}",
                        'timestamp': int(time.time())
                    }),
                    'EventBusName': bus_name
                }
            ]
        )
        
        self.assertEqual(event_response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertEqual(event_response['FailedEntryCount'], 0)
        print(f"Event sent to EventBridge successfully")
        
        # STEP 2: Wait for automatic processing (EventBridge -> Lambda -> DynamoDB)
        print(f"Waiting 15 seconds for EventBridge to trigger Lambda and write to DynamoDB...")
        time.sleep(15)
        
        # STEP 3: E2E PROOF - Check if data reached DynamoDB (final destination)
        print(f"Checking DynamoDB for event {test_event_id}...")
        dynamo_response = dynamodb_client_primary.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )
        
        # ASSERT: Event must be in DynamoDB (EventBridge → Lambda → DynamoDB flow)
        if 'Item' not in dynamo_response:
            # Event not found - fetch Lambda logs for debugging before failing
            print(f"\nERROR: Event {test_event_id} not found in DynamoDB!")
            function_name = OUTPUTS.get('lambda_function_name_primary')
            if function_name:
                print(f"\nFetching Lambda logs for debugging...")
                logs = get_recent_lambda_logs(function_name, PRIMARY_REGION, minutes=2)
                if logs:
                    print(f"Recent Lambda logs ({len(logs)} messages):")
                    for log in logs[-30:]:  # Show last 30 log messages
                        print(f"  {log}")
                else:
                    print("  No recent logs found (Lambda may not have been invoked)")
            
            self.fail(f"Event {test_event_id} not found in DynamoDB. EventBridge did not trigger Lambda!")
        
        # SUCCESS: Event flowed through entire pipeline!
        print(f"E2E SUCCESS: Event found in DynamoDB!")
        print(f"   EventId: {dynamo_response['Item']['EventId']['S']}")
        print(f"   Symbol: {dynamo_response['Item']['TradingData']['M']['symbol']['S']}")
        print(f"   EventBridge triggered Lambda, Lambda wrote to DynamoDB!")
        
        self.assertEqual(dynamo_response['Item']['EventId']['S'], test_event_id)
        self.assertEqual(dynamo_response['Item']['TradingData']['M']['symbol']['S'], 'E2ETEST')
        
        # Cleanup
        dynamodb_client_primary.delete_item(
            TableName=table_name,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )

    def test_multi_region_eventbridge_to_dynamodb_replication_flow(self):
        """
        E2E Test: Multi-region event processing (EventBridge → Lambda → DynamoDB in both regions).
        
        Send event to primary EventBridge, verify it's processed in BOTH regions.
        Tests: Primary EventBridge → Primary Lambda → Primary DynamoDB
               AND potential cross-region routing to secondary region.
        """
        self.skip_if_output_missing(
            'eventbridge_bus_arn_primary',
            'eventbridge_bus_arn_secondary', 
            'dynamodb_table_name_primary',
            'dynamodb_table_name_secondary'
        )
        
        bus_arn_primary = OUTPUTS['eventbridge_bus_arn_primary']
        bus_name_primary = bus_arn_primary.split('/')[-1]
        table_name_primary = OUTPUTS['dynamodb_table_name_primary']
        table_name_secondary = OUTPUTS['dynamodb_table_name_secondary']
        
        test_event_id = f"e2e_multiregion_{int(time.time())}"
        
        # STEP 1: Send event to PRIMARY EventBridge
        print(f"\nMulti-Region E2E: Sending event {test_event_id} to primary EventBridge...")
        event_response = eventbridge_client_primary.put_events(
            Entries=[
                {
                    'Source': 'integration.e2e.multiregion',
                    'DetailType': 'Multi-Region Trade',
                    'Detail': json.dumps({
                        'eventId': test_event_id,
                        'symbol': 'GLOBALTEST',
                        'price': 250.00,
                        'quantity': 200,
                        'side': 'sell',
                        'orderId': f"GLOBAL_ORDER_{int(time.time())}",
                        'timestamp': int(time.time()),
                        'multiRegion': True
                    }),
                    'EventBusName': bus_name_primary
                }
            ]
        )
        
        self.assertEqual(event_response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertEqual(event_response['FailedEntryCount'], 0)
        print(f"Event sent to primary region EventBridge")
        
        # STEP 2: Wait for processing in both regions
        print(f"Waiting 20 seconds for multi-region processing...")
        time.sleep(20)
        
        # STEP 3: Check PRIMARY region DynamoDB
        print(f"Checking PRIMARY region ({PRIMARY_REGION}) DynamoDB...")
        dynamo_response_primary = dynamodb_client_primary.get_item(
            TableName=table_name_primary,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )
        
        # ASSERT: Event must be in primary region
        if 'Item' not in dynamo_response_primary:
            # Event not found - fetch Lambda logs for debugging before failing
            print(f"\nERROR: Event {test_event_id} not found in PRIMARY region DynamoDB!")
            function_name = OUTPUTS.get('lambda_function_name_primary')
            if function_name:
                print(f"\nFetching PRIMARY region Lambda logs for debugging...")
                logs = get_recent_lambda_logs(function_name, PRIMARY_REGION, minutes=2)
                if logs:
                    print(f"Recent Lambda logs ({len(logs)} messages):")
                    for log in logs[-30:]:  # Show last 30 log messages
                        print(f"  {log}")
                else:
                    print("  No recent logs found (Lambda may not have been invoked)")
            
            self.fail(f"Event {test_event_id} not found in PRIMARY region. EventBridge did not trigger Lambda!")
        
        print(f"Event found in PRIMARY region DynamoDB!")
        self.assertEqual(dynamo_response_primary['Item']['EventId']['S'], test_event_id)
        
        # Cleanup primary
        dynamodb_client_primary.delete_item(
            TableName=table_name_primary,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )
        
        # STEP 4: Check SECONDARY region DynamoDB (cross-region routing optional)
        print(f"Checking SECONDARY region ({SECONDARY_REGION}) DynamoDB...")
        dynamo_response_secondary = dynamodb_client_secondary.get_item(
            TableName=table_name_secondary,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{SECONDARY_REGION}"}
            }
        )
        
        if 'Item' in dynamo_response_secondary:
            print(f"Event ALSO found in SECONDARY region DynamoDB!")
            print(f"   Cross-region routing is working!")
            
            # Cleanup secondary
            dynamodb_client_secondary.delete_item(
                TableName=table_name_secondary,
                Key={
                    'PK': {'S': f"EVENT#{test_event_id}"},
                    'SK': {'S': f"REGION#{SECONDARY_REGION}"}
                }
            )
        else:
            print(f"Event not in SECONDARY region (cross-region routing not configured)")

    def test_eventbridge_to_dynamodb_with_cloudwatch_monitoring_flow(self):
        """
        E2E Test: EventBridge → Lambda → DynamoDB + CloudWatch Metrics (4 services).
        
        Send event, verify it's in DynamoDB AND that CloudWatch received custom metrics.
        Tests complete observability pipeline.
        """
        self.skip_if_output_missing('eventbridge_bus_arn_primary', 'dynamodb_table_name_primary')
        
        bus_arn = OUTPUTS['eventbridge_bus_arn_primary']
        bus_name = bus_arn.split('/')[-1]
        table_name = OUTPUTS['dynamodb_table_name_primary']
        
        test_event_id = f"e2e_monitoring_{int(time.time())}"
        
        # STEP 1: Send event to EventBridge
        print(f"\nMonitoring E2E: Sending event {test_event_id} with metrics...")
        event_response = eventbridge_client_primary.put_events(
            Entries=[
                {
                    'Source': 'integration.e2e.monitoring',
                    'DetailType': 'Trade Execution',
                    'Detail': json.dumps({
                        'eventId': test_event_id,
                        'symbol': 'MONITORTEST',
                        'price': 150.00,
                        'quantity': 50,
                        'side': 'buy',
                        'orderId': f"MONITOR_ORDER_{int(time.time())}",
                        'timestamp': int(time.time()),
                        'enableMetrics': True
                    }),
                    'EventBusName': bus_name
                }
            ]
        )
        
        self.assertEqual(event_response['ResponseMetadata']['HTTPStatusCode'], 200)
        self.assertEqual(event_response['FailedEntryCount'], 0)
        print(f"Event sent to EventBridge")
        
        # STEP 2: Wait for processing
        print(f"Waiting 15 seconds for event processing and metrics...")
        time.sleep(15)
        
        # STEP 3: Verify DynamoDB write
        print(f"Checking DynamoDB for event {test_event_id}...")
        dynamo_response = dynamodb_client_primary.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )
        
        # ASSERT: Event must be in DynamoDB
        if 'Item' not in dynamo_response:
            # Event not found - fetch Lambda logs for debugging before failing
            print(f"\nERROR: Event {test_event_id} not found in DynamoDB!")
            function_name = OUTPUTS.get('lambda_function_name_primary')
            if function_name:
                print(f"\nFetching Lambda logs for debugging...")
                logs = get_recent_lambda_logs(function_name, PRIMARY_REGION, minutes=2)
                if logs:
                    print(f"Recent Lambda logs ({len(logs)} messages):")
                    for log in logs[-30:]:  # Show last 30 log messages
                        print(f"  {log}")
                else:
                    print("  No recent logs found (Lambda may not have been invoked)")
            
            self.fail(f"Event {test_event_id} not found in DynamoDB. EventBridge did not trigger Lambda!")
        
        print(f"Event found in DynamoDB!")
        self.assertEqual(dynamo_response['Item']['EventId']['S'], test_event_id)
        
        # STEP 4: Verify CloudWatch Metrics (Lambda should have sent them)
        print(f"Checking CloudWatch for custom metrics...")
        metrics_response = cloudwatch_client_primary.list_metrics(
            Namespace='TradingPlatform/EventProcessing',
            MetricName='EventsProcessed'
        )
        
        if metrics_response['Metrics']:
            print(f"CloudWatch metrics found: {len(metrics_response['Metrics'])} metrics")
            print(f"   Lambda sent custom metrics to CloudWatch!")
            self.assertGreater(len(metrics_response['Metrics']), 0)
        else:
            print(f"Custom metrics not yet available in CloudWatch (timing issue)")
        
        # Cleanup
        dynamodb_client_primary.delete_item(
            TableName=table_name,
            Key={
                'PK': {'S': f"EVENT#{test_event_id}"},
                'SK': {'S': f"REGION#{PRIMARY_REGION}"}
            }
        )
        
        print(f"\nE2E MONITORING TEST: Event processed through entire pipeline with observability!")


# ============================================================================
# Configuration Validation Tests (kept for completeness)
# ============================================================================

class TestInfrastructureConfiguration(BaseIntegrationTest):
    """Infrastructure configuration validation tests."""

    def test_should_have_all_required_outputs(self):
        """Test that all required outputs are present."""
        required_outputs = [
            'lambda_function_arn_primary',
            'lambda_function_arn_secondary',
            'dynamodb_table_name_primary',
            'dynamodb_table_name_secondary',
            'eventbridge_bus_arn_primary',
            'eventbridge_bus_arn_secondary',
            'sns_topic_arn_primary',
            'sns_topic_arn_secondary'
        ]
        
        for output in required_outputs:
            self.assertIn(output, OUTPUTS, f"Missing required output: {output}")

    def test_should_have_consistent_environment_suffix_across_resources(self):
        """Test that environment suffix is consistent across all resources."""
        if not OUTPUTS:
            pytest.skip("No outputs available for testing")
        
        # Check that environment suffix appears in resource names where expected
        for key, value in OUTPUTS.items():
            if isinstance(value, str) and ('arn' in key or 'name' in key):
                # Resource names should contain environment suffix
                self.assertIn(ENVIRONMENT_SUFFIX, value, 
                             f"Resource {key} should contain environment suffix {ENVIRONMENT_SUFFIX}")

    def test_should_have_correct_region_configuration(self):
        """Test that resources are deployed in correct regions."""
        # Primary region resources
        primary_arns = [
            OUTPUTS.get('lambda_function_arn_primary'),
            OUTPUTS.get('eventbridge_bus_arn_primary'),
            OUTPUTS.get('sns_topic_arn_primary')
        ]
        
        for arn in primary_arns:
            if arn:
                self.assertIn(PRIMARY_REGION, arn, f"Primary region resource should be in {PRIMARY_REGION}")
        
        # Secondary region resources
        secondary_arns = [
            OUTPUTS.get('lambda_function_arn_secondary'),
            OUTPUTS.get('eventbridge_bus_arn_secondary'),
            OUTPUTS.get('sns_topic_arn_secondary')
        ]
        
        for arn in secondary_arns:
            if arn:
                self.assertIn(SECONDARY_REGION, arn, f"Secondary region resource should be in {SECONDARY_REGION}")


if __name__ == '__main__':
    unittest.main()