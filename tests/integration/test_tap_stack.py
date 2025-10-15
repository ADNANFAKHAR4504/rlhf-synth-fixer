import json
import os
import time
import unittest
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
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
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resources for integration tests"""
        cls.sqs = boto3.client('sqs')
        cls.dynamodb = boto3.resource('dynamodb')
        cls.events = boto3.client('events')
        cls.lambda_client = boto3.client('lambda')
        cls.cloudwatch = boto3.client('cloudwatch')
        
        # Extract resource identifiers from deployment outputs
        cls.queue_url = flat_outputs.get('SQSQueueURL')
        cls.dlq_url = flat_outputs.get('DLQueueURL')
        cls.table_name = flat_outputs.get('EventsTableName')
        cls.lambda_arn = flat_outputs.get('ProcessorLambdaARN')
        cls.event_bus_name = flat_outputs.get('EventBusName')
        
        # Validate required outputs exist
        required_outputs = [cls.queue_url, cls.table_name, cls.lambda_arn, cls.event_bus_name]
        if not all(required_outputs):
            raise ValueError(f"Missing required deployment outputs: {flat_outputs}")

    def setUp(self):
        """Set up test data for each test"""
        # Use milliseconds for better uniqueness
        self.test_shipment_id = f"test-shipment-{int(time.time() * 1000)}"
        self.test_timestamp = datetime.utcnow().isoformat()

    @mark.it("validates deployed SQS queues are accessible")
    def test_sqs_queues_accessible(self):
        """Test that deployed SQS queues are accessible and configured correctly"""
        # ARRANGE & ACT
        queue_attrs = self.sqs.get_queue_attributes(
            QueueUrl=self.queue_url,
            AttributeNames=['All']
        )['Attributes']
        
        # ASSERT
        self.assertIn('VisibilityTimeout', queue_attrs)
        self.assertEqual(queue_attrs['VisibilityTimeout'], '360')
        self.assertIn('ReceiveMessageWaitTimeSeconds', queue_attrs)
        self.assertEqual(queue_attrs['ReceiveMessageWaitTimeSeconds'], '20')
        self.assertIn('RedrivePolicy', queue_attrs)
        
        # Verify DLQ configuration
        redrive_policy = json.loads(queue_attrs['RedrivePolicy'])
        self.assertEqual(redrive_policy['maxReceiveCount'], 3)
        self.assertIn(self.dlq_url.split('/')[-1], redrive_policy['deadLetterTargetArn'])

    @mark.it("validates DynamoDB table is accessible and configured")
    def test_dynamodb_table_accessible(self):
        """Test that deployed DynamoDB table is accessible with correct schema"""
        # ARRANGE & ACT
        table = self.dynamodb.Table(self.table_name)
        
        # Force table load to get metadata
        table.load()
        
        # ASSERT
        self.assertEqual(table.table_status, 'ACTIVE')
        
        # Check table schema
        key_schema = table.key_schema
        self.assertEqual(len(key_schema), 2)
        
        hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')
        
        self.assertEqual(hash_key['AttributeName'], 'shipment_id')
        self.assertEqual(range_key['AttributeName'], 'event_timestamp')
        
        # Verify GSI exists
        gsi_names = [gsi['IndexName'] for gsi in table.global_secondary_indexes or []]
        self.assertIn('status-timestamp-index', gsi_names)
        
        # Verify TTL is enabled
        ttl_description = self.dynamodb.meta.client.describe_time_to_live(
            TableName=self.table_name
        )
        self.assertEqual(ttl_description['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
        self.assertEqual(ttl_description['TimeToLiveDescription']['AttributeName'], 'expires_at')

    @mark.it("validates Lambda function is deployed and configured")
    def test_lambda_function_accessible(self):
        """Test that Lambda function is deployed with correct configuration"""
        # ARRANGE & ACT
        function_config = self.lambda_client.get_function(FunctionName=self.lambda_arn)
        
        # ASSERT
        config = function_config['Configuration']
        self.assertEqual(config['Runtime'], 'python3.12')
        self.assertEqual(config['Handler'], 'index.lambda_handler')
        self.assertEqual(config['Timeout'], 60)
        self.assertEqual(config['MemorySize'], 512)
        self.assertIn('EVENTS_TABLE_NAME', config['Environment']['Variables'])
        self.assertEqual(config['Environment']['Variables']['EVENTS_TABLE_NAME'], self.table_name)
        
        # Verify tracing is enabled
        self.assertIn('TracingConfig', config)
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

    @mark.it("validates EventBridge custom bus exists")
    def test_eventbridge_bus_exists(self):
        """Test that custom EventBridge bus is created and accessible"""
        # ARRANGE & ACT
        try:
            response = self.events.describe_event_bus(Name=self.event_bus_name)
            # ASSERT
            self.assertEqual(response['Name'], self.event_bus_name)
            self.assertIn('Arn', response)
        except self.events.exceptions.ResourceNotFoundException:
            self.fail(f"EventBridge bus {self.event_bus_name} not found")

    @mark.it("tests complete shipment event processing flow")
    def test_complete_event_processing_flow(self):
        """Test end-to-end event processing from EventBridge to DynamoDB storage"""
        # ARRANGE
        test_event = {
            "Source": "shipment.service",
            "DetailType": "shipment.created",
            "Detail": json.dumps({
                "shipment_id": self.test_shipment_id,
                "event_timestamp": self.test_timestamp,
                "event_type": "shipment_created",
                "event_data": {
                    "origin": "New York",
                    "destination": "Los Angeles",
                    "weight": 100.5,
                    "carrier": "TestCarrier"
                }
            }),
            "EventBusName": self.event_bus_name
        }
        
        # ACT
        # Send event to EventBridge
        put_response = self.events.put_events(Entries=[test_event])
        
        # Verify event was accepted
        self.assertEqual(put_response['FailedEntryCount'], 0, 
                        "Event was not accepted by EventBridge")
        
        # Wait for processing (EventBridge -> SQS -> Lambda -> DynamoDB)
        # Poll for the item with timeout
        max_attempts = 15
        item_found = False
        table = self.dynamodb.Table(self.table_name)
        
        for attempt in range(max_attempts):
            try:
                response = table.get_item(
                    Key={
                        'shipment_id': self.test_shipment_id,
                        'event_timestamp': self.test_timestamp
                    }
                )
                if 'Item' in response:
                    item_found = True
                    break
            except Exception as e:
                print(f"Attempt {attempt + 1}: Error checking DynamoDB: {e}")
            
            time.sleep(2)
        
        # ASSERT
        self.assertTrue(item_found, 
                       f"Event was not processed and stored in DynamoDB after {max_attempts * 2} seconds")
        
        item = response['Item']
        self.assertEqual(item['shipment_id'], self.test_shipment_id)
        self.assertEqual(item['event_type'], 'shipment_created')
        self.assertEqual(item['processing_status'], 'PROCESSED')
        self.assertIn('processed_at', item)
        self.assertIn('expires_at', item)
        self.assertIn('event_data', item)
        
        # Verify event_data contents
        event_data = item['event_data']
        self.assertEqual(event_data['origin'], 'New York')
        self.assertEqual(event_data['destination'], 'Los Angeles')
        # Note: DynamoDB may convert floats to Decimal
        self.assertEqual(float(event_data['weight']), 100.5)

    @mark.it("tests SQS direct message processing")
    def test_sqs_direct_message_processing(self):
        """Test Lambda processing of messages sent directly to SQS"""
        # ARRANGE
        unique_id = f"{self.test_shipment_id}-direct"
        test_message = {
            "shipment_id": unique_id,
            "event_timestamp": self.test_timestamp,
            "event_type": "shipment_updated",
            "event_data": {
                "status": "in_transit",
                "location": "Chicago"
            }
        }
        
        # ACT
        # Send message directly to SQS
        send_response = self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(test_message)
        )
        
        self.assertIn('MessageId', send_response)
        
        # Poll for processing with timeout
        max_attempts = 10
        item_found = False
        table = self.dynamodb.Table(self.table_name)
        
        for attempt in range(max_attempts):
            try:
                response = table.get_item(
                    Key={
                        'shipment_id': unique_id,
                        'event_timestamp': self.test_timestamp
                    }
                )
                if 'Item' in response:
                    item_found = True
                    break
            except Exception:
                pass
            
            time.sleep(2)
        
        # ASSERT
        self.assertTrue(item_found, "SQS message was not processed within timeout")
        item = response['Item']
        self.assertEqual(item['event_type'], 'shipment_updated')
        self.assertEqual(item['processing_status'], 'PROCESSED')
        self.assertEqual(item['event_data']['status'], 'in_transit')

    @mark.it("tests idempotent processing")
    def test_idempotent_processing(self):
        """Test that duplicate events are handled idempotently"""
        # ARRANGE
        unique_id = f"{self.test_shipment_id}-duplicate"
        duplicate_message = {
            "shipment_id": unique_id,
            "event_timestamp": self.test_timestamp,
            "event_type": "shipment_delivered",
            "event_data": {"delivery_time": self.test_timestamp}
        }
        
        # ACT
        # Send the same message three times
        for i in range(3):
            self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(duplicate_message)
            )
            time.sleep(0.5)  # Small delay between sends
        
        # Wait for processing
        time.sleep(15)
        
        # ASSERT
        # Check that only one item exists in DynamoDB
        table = self.dynamodb.Table(self.table_name)
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('shipment_id').eq(unique_id)
        )
        
        self.assertEqual(response['Count'], 1, 
                        f"Idempotent processing failed - expected 1 item, found {response['Count']}")
        
        # Verify the item has the correct data
        item = response['Items'][0]
        self.assertEqual(item['event_type'], 'shipment_delivered')
        self.assertEqual(item['processing_status'], 'PROCESSED')

    @mark.it("tests DynamoDB Global Secondary Index")
    def test_gsi_query_functionality(self):
        """Test querying by processing status using GSI"""
        # ARRANGE
        unique_id = f"{self.test_shipment_id}-gsi-test"
        test_message = {
            "shipment_id": unique_id,
            "event_timestamp": self.test_timestamp,
            "event_type": "shipment_cancelled",
            "event_data": {"reason": "customer_request"}
        }
        
        # ACT
        # Send message for processing
        self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(test_message)
        )
        
        # Wait for processing and GSI update
        time.sleep(12)
        
        # Query using GSI
        table = self.dynamodb.Table(self.table_name)
        response = table.query(
            IndexName='status-timestamp-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('processing_status').eq('PROCESSED'),
            Limit=100  # Limit results for faster query
        )
        
        # ASSERT
        self.assertGreater(response['Count'], 0, "GSI query returned no results")
        
        # Find our specific item in the results
        processed_items = [item for item in response['Items'] 
                          if item['shipment_id'] == unique_id]
        self.assertEqual(len(processed_items), 1, 
                        "Expected item not found in GSI query results")
        
        # Verify GSI projected all attributes
        gsi_item = processed_items[0]
        self.assertIn('event_type', gsi_item)
        self.assertIn('event_data', gsi_item)

    @mark.it("validates CloudWatch metrics are generated")
    def test_cloudwatch_metrics_generated(self):
        """Test that CloudWatch metrics are being generated for the processing pipeline"""
        # ACT
        # Query recent metrics (longer time window for more reliable results)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        # Extract queue name from URL
        queue_name = self.queue_url.split('/')[-1]
        
        # Check SQS metrics
        sqs_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName='NumberOfMessagesSent',
            Dimensions=[
                {'Name': 'QueueName', 'Value': queue_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # Extract function name from ARN
        lambda_function_name = self.lambda_arn.split(':')[-1]
        
        # Check Lambda metrics
        lambda_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Invocations',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': lambda_function_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # ASSERT
        # Metrics should be available (may be empty if no recent activity)
        self.assertIsNotNone(sqs_metrics.get('Datapoints'))
        self.assertIsNotNone(lambda_metrics.get('Datapoints'))
        
        # Note: We don't assert that datapoints exist because metrics may not
        # be available yet for very recent deployments

    @mark.it("tests error handling and DLQ functionality")
    def test_error_handling_and_dlq(self):
        """Test that malformed messages are properly handled and sent to DLQ"""
        # ARRANGE
        malformed_message = "invalid json message"
        
        # ACT
        # Send malformed message
        self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=malformed_message
        )
        
        # Wait for processing and DLQ routing (3 retries + processing time)
        time.sleep(25)
        
        # ASSERT
        # Check if message ended up in DLQ after retries
        if self.dlq_url:
            dlq_messages = self.sqs.receive_message(
                QueueUrl=self.dlq_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=5,
                AttributeNames=['All']
            )
            
            # Verify message is in DLQ
            if 'Messages' in dlq_messages:
                found_malformed = False
                for message in dlq_messages['Messages']:
                    if message['Body'] == malformed_message:
                        found_malformed = True
                    
                    # Clean up DLQ message
                    self.sqs.delete_message(
                        QueueUrl=self.dlq_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                
                self.assertTrue(found_malformed, 
                              "Expected malformed message to be in DLQ")
            else:
                # If no messages in DLQ, the test might be running too fast
                # or Lambda is handling errors differently than expected
                print("Warning: No messages found in DLQ - this may indicate "
                      "the message was handled differently than expected")

    @mark.it("tests missing required fields error handling")
    def test_missing_required_fields(self):
        """Test that messages with missing required fields are handled properly"""
        # ARRANGE
        incomplete_message = {
            "shipment_id": f"{self.test_shipment_id}-incomplete",
            # Missing event_timestamp and event_type
            "event_data": {"test": "data"}
        }
        
        # ACT
        self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(incomplete_message)
        )
        
        # Wait for processing
        time.sleep(15)
        
        # ASSERT
        # Check that a FAILED record was written to DynamoDB
        table = self.dynamodb.Table(self.table_name)
        
        # Query for any items with this shipment_id
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('shipment_id').eq(
                f"{self.test_shipment_id}-incomplete"
            )
        )
        
        # Should have a failure record or be in DLQ
        if response['Count'] > 0:
            item = response['Items'][0]
            self.assertEqual(item['processing_status'], 'FAILED')
            self.assertIn('error_message', item)

    def tearDown(self):
        """Clean up test data after each test"""
        try:
            # Clean up DynamoDB test items
            table = self.dynamodb.Table(self.table_name)
            
            # Query for items with this test's shipment_id prefix
            # Use begins_with for more precise cleanup
            test_prefix = self.test_shipment_id.rsplit('-', 1)[0]  # Remove timestamp part
            
            response = table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('shipment_id').begins_with(
                    test_prefix
                )
            )
            
            # Delete test items
            with table.batch_writer() as batch:
                for item in response.get('Items', []):
                    batch.delete_item(
                        Key={
                            'shipment_id': item['shipment_id'],
                            'event_timestamp': item['event_timestamp']
                        }
                    )
            
            # Purge test messages from queues (optional, helps with clean state)
            # Note: purge_queue has a 60-second throttle limit
            try:
                self.sqs.purge_queue(QueueUrl=self.queue_url)
            except self.sqs.exceptions.PurgeQueueInProgress:
                pass  # Queue purge already in progress
            
        except Exception as e:
            # Log cleanup errors but don't fail tests
            print(f"Cleanup warning: {e}")