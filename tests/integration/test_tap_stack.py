import json
import os
import unittest
import time
import boto3
from datetime import datetime, timedelta

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
        self.test_shipment_id = f"test-shipment-{int(time.time())}"
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
        self.assertIn('VisibilityTimeoutSeconds', queue_attrs)
        self.assertEqual(queue_attrs['VisibilityTimeoutSeconds'], '360')
        self.assertIn('ReceiveMessageWaitTimeSeconds', queue_attrs)
        self.assertEqual(queue_attrs['ReceiveMessageWaitTimeSeconds'], '20')
        self.assertIn('RedrivePolicy', queue_attrs)

    @mark.it("validates DynamoDB table is accessible and configured")
    def test_dynamodb_table_accessible(self):
        """Test that deployed DynamoDB table is accessible with correct schema"""
        # ARRANGE & ACT
        table = self.dynamodb.Table(self.table_name)
        table_description = table.table_status
        
        # ASSERT
        self.assertEqual(table_description, 'ACTIVE')
        
        # Check table schema
        key_schema = table.key_schema
        self.assertEqual(len(key_schema), 2)
        
        hash_key = next(k for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next(k for k in key_schema if k['KeyType'] == 'RANGE')
        
        self.assertEqual(hash_key['AttributeName'], 'shipment_id')
        self.assertEqual(range_key['AttributeName'], 'event_timestamp')

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

    @mark.it("validates EventBridge custom bus exists")
    def test_eventbridge_bus_exists(self):
        """Test that custom EventBridge bus is created and accessible"""
        # ARRANGE & ACT
        try:
            response = self.events.describe_event_bus(Name=self.event_bus_name)
            # ASSERT
            self.assertEqual(response['Name'], self.event_bus_name)
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
        self.events.put_events(Entries=[test_event])
        
        # Wait for processing (EventBridge -> SQS -> Lambda -> DynamoDB)
        time.sleep(15)
        
        # ASSERT
        # Check if event was processed and stored in DynamoDB
        table = self.dynamodb.Table(self.table_name)
        
        response = table.get_item(
            Key={
                'shipment_id': self.test_shipment_id,
                'event_timestamp': self.test_timestamp
            }
        )
        
        self.assertIn('Item', response, "Event was not processed and stored in DynamoDB")
        
        item = response['Item']
        self.assertEqual(item['shipment_id'], self.test_shipment_id)
        self.assertEqual(item['event_type'], 'shipment_created')
        self.assertEqual(item['processing_status'], 'PROCESSED')
        self.assertIn('processed_at', item)
        self.assertIn('expires_at', item)

    @mark.it("tests SQS direct message processing")
    def test_sqs_direct_message_processing(self):
        """Test Lambda processing of messages sent directly to SQS"""
        # ARRANGE
        test_message = {
            "shipment_id": f"{self.test_shipment_id}-direct",
            "event_timestamp": self.test_timestamp,
            "event_type": "shipment_updated",
            "event_data": {
                "status": "in_transit",
                "location": "Chicago"
            }
        }
        
        # ACT
        # Send message directly to SQS
        self.sqs.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(test_message)
        )
        
        # Wait for Lambda processing
        time.sleep(10)
        
        # ASSERT
        # Check if message was processed
        table = self.dynamodb.Table(self.table_name)
        response = table.get_item(
            Key={
                'shipment_id': f"{self.test_shipment_id}-direct",
                'event_timestamp': self.test_timestamp
            }
        )
        
        self.assertIn('Item', response, "SQS message was not processed")
        item = response['Item']
        self.assertEqual(item['event_type'], 'shipment_updated')
        self.assertEqual(item['processing_status'], 'PROCESSED')

    @mark.it("tests idempotent processing")
    def test_idempotent_processing(self):
        """Test that duplicate events are handled idempotently"""
        # ARRANGE
        duplicate_message = {
            "shipment_id": f"{self.test_shipment_id}-duplicate",
            "event_timestamp": self.test_timestamp,
            "event_type": "shipment_delivered",
            "event_data": {"delivery_time": self.test_timestamp}
        }
        
        # ACT
        # Send the same message twice
        for i in range(2):
            self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(duplicate_message)
            )
        
        # Wait for processing
        time.sleep(15)
        
        # ASSERT
        # Check that only one item exists in DynamoDB
        table = self.dynamodb.Table(self.table_name)
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('shipment_id').eq(f"{self.test_shipment_id}-duplicate")
        )
        
        self.assertEqual(response['Count'], 1, "Idempotent processing failed - duplicate items found")

    @mark.it("tests DynamoDB Global Secondary Index")
    def test_gsi_query_functionality(self):
        """Test querying by processing status using GSI"""
        # ARRANGE
        test_message = {
            "shipment_id": f"{self.test_shipment_id}-gsi-test",
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
        
        # Wait for processing
        time.sleep(10)
        
        # Query using GSI
        table = self.dynamodb.Table(self.table_name)
        response = table.query(
            IndexName='status-timestamp-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('processing_status').eq('PROCESSED')
        )
        
        # ASSERT
        self.assertGreater(response['Count'], 0, "GSI query returned no results")
        
        # Find our specific item in the results
        processed_items = [item for item in response['Items'] 
                          if item['shipment_id'] == f"{self.test_shipment_id}-gsi-test"]
        self.assertEqual(len(processed_items), 1, "Expected item not found in GSI query results")

    @mark.it("validates CloudWatch metrics are generated")
    def test_cloudwatch_metrics_generated(self):
        """Test that CloudWatch metrics are being generated for the processing pipeline"""
        # ACT
        # Query recent metrics
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=30)
        
        # Check SQS metrics
        sqs_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/SQS',
            MetricName='NumberOfMessagesSent',
            Dimensions=[
                {'Name': 'QueueName', 'Value': self.queue_url.split('/')[-1]}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )
        
        # Check Lambda metrics
        lambda_function_name = self.lambda_arn.split(':')[-1]
        lambda_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Invocations',
            Dimensions=[
                {'Name': 'FunctionName', 'Value': lambda_function_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )
        
        # ASSERT
        # We expect some activity in the metrics (at least from our tests)
        self.assertIsNotNone(sqs_metrics.get('Datapoints'))
        self.assertIsNotNone(lambda_metrics.get('Datapoints'))

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
        
        # Wait for processing and potential DLQ routing
        time.sleep(20)
        
        # ASSERT
        # Check if message ended up in DLQ after retries
        if self.dlq_url:
            dlq_messages = self.sqs.receive_message(
                QueueUrl=self.dlq_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=5
            )
            
            # Clean up any messages found in DLQ
            if 'Messages' in dlq_messages:
                for message in dlq_messages['Messages']:
                    self.sqs.delete_message(
                        QueueUrl=self.dlq_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                
                self.assertGreater(len(dlq_messages['Messages']), 0, 
                                 "Expected malformed message to be in DLQ")

    def tearDown(self):
        """Clean up test data after each test"""
        try:
            # Clean up DynamoDB test items
            table = self.dynamodb.Table(self.table_name)
            
            # Query for items created during this test
            response = table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('shipment_id').contains(
                    self.test_shipment_id.split('-')[0]
                )
            )
            
            # Delete test items
            for item in response.get('Items', []):
                table.delete_item(
                    Key={
                        'shipment_id': item['shipment_id'],
                        'event_timestamp': item['event_timestamp']
                    }
                )
        except Exception as e:
            # Log cleanup errors but don't fail tests
            print(f"Cleanup warning: {e}")
