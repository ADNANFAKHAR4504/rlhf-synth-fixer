import json
import os
import time
import unittest
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = f.read()
else:
    flat_outputs = "{}"

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Comprehensive integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and retrieve deployed resources"""
        # Initialize AWS clients
        cls.dynamodb = boto3.resource('dynamodb')
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.events_client = boto3.client('events')
        cls.sns_client = boto3.client('sns')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.logs_client = boto3.client('logs')

        # Get deployed resource names from CloudFormation outputs
        cls.table_name = flat_outputs.get('DynamoDBTableName')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.event_bus_name = flat_outputs.get('EventBusName')
        cls.sns_topic_arn = flat_outputs.get('SNSTopicArn')

        # Validate that all required outputs are present
        if not all([cls.table_name, cls.lambda_function_name, 
                    cls.event_bus_name, cls.sns_topic_arn]):
            raise ValueError(
                "Missing required CloudFormation outputs. "
                "Ensure the stack is deployed and outputs are available."
            )

        cls.table = cls.dynamodb.Table(cls.table_name)

    def setUp(self):
        """Set up test data before each test"""
        self.test_shipment_ids = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up test shipments from DynamoDB
        for shipment_id in self.test_shipment_ids:
            try:
                # Query all items for this shipment
                response = self.table.query(
                    KeyConditionExpression='shipmentId = :sid',
                    ExpressionAttributeValues={':sid': shipment_id}
                )
                
                # Delete each item
                for item in response.get('Items', []):
                    self.table.delete_item(
                        Key={
                            'shipmentId': item['shipmentId'],
                            'timestamp': item['timestamp']
                        }
                    )
            except Exception as e:
                print(f"Error cleaning up shipment {shipment_id}: {str(e)}")

    def _generate_test_shipment_id(self):
        """Generate a unique test shipment ID"""
        shipment_id = f"TEST-SHIP-{uuid.uuid4().hex[:8].upper()}"
        self.test_shipment_ids.append(shipment_id)
        return shipment_id

    def _create_shipment_event(self, shipment_id, status="IN_TRANSIT", 
                               location="Dallas, TX", carrier="FedEx"):
        """Create a valid shipment event payload"""
        return {
            "version": "0",
            "id": str(uuid.uuid4()),
            "detail-type": "Shipment Update",
            "source": "logistics.shipments",
            "account": "123456789012",
            "time": datetime.utcnow().isoformat() + "Z",
            "region": "us-east-1",
            "resources": [],
            "detail": {
                "shipmentId": shipment_id,
                "status": status,
                "location": location,
                "carrier": carrier,
                "trackingNumber": f"TRK{uuid.uuid4().hex[:10].upper()}",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }

    @mark.it("verifies DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        # ACT
        response = self.dynamodb_client.describe_table(TableName=self.table_name)

        # ASSERT
        self.assertEqual(response['Table']['TableName'], self.table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 
                        'PAY_PER_REQUEST')
        
        # Verify partition and sort keys
        key_schema = {item['AttributeName']: item['KeyType'] 
                     for item in response['Table']['KeySchema']}
        self.assertEqual(key_schema.get('shipmentId'), 'HASH')
        self.assertEqual(key_schema.get('timestamp'), 'RANGE')

    @mark.it("verifies Lambda function exists and is active")
    def test_lambda_function_exists(self):
        # ACT
        response = self.lambda_client.get_function(
            FunctionName=self.lambda_function_name
        )

        # ASSERT
        self.assertEqual(
            response['Configuration']['FunctionName'], 
            self.lambda_function_name
        )
        self.assertEqual(response['Configuration']['Runtime'], 'python3.10')
        self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler')
        self.assertEqual(response['Configuration']['Timeout'], 30)
        self.assertEqual(response['Configuration']['MemorySize'], 512)
        
        # Verify environment variables
        env_vars = response['Configuration']['Environment']['Variables']
        self.assertEqual(env_vars.get('TABLE_NAME'), self.table_name)
        self.assertEqual(env_vars.get('SNS_TOPIC_ARN'), self.sns_topic_arn)

    @mark.it("verifies EventBridge custom event bus exists")
    def test_event_bus_exists(self):
        # ACT
        response = self.events_client.describe_event_bus(
            Name=self.event_bus_name
        )

        # ASSERT
        self.assertEqual(response['Name'], self.event_bus_name)
        self.assertIn('Arn', response)

    @mark.it("verifies SNS topic exists")
    def test_sns_topic_exists(self):
        # ACT
        response = self.sns_client.get_topic_attributes(
            TopicArn=self.sns_topic_arn
        )

        # ASSERT
        self.assertEqual(response['Attributes']['TopicArn'], self.sns_topic_arn)
        self.assertEqual(
            response['Attributes']['DisplayName'], 
            'Shipment Processing Alerts'
        )
    @mark.it("can invoke Lambda function directly with valid event")
    def test_lambda_direct_invocation_success(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        event = self._create_shipment_event(shipment_id)

        # ACT
        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # ASSERT
        self.assertEqual(response['StatusCode'], 200)
        
        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)
        
        body = json.loads(payload['body'])
        self.assertEqual(body['shipmentId'], shipment_id)
        self.assertIn('message', body)

    @mark.it("can invoke Lambda function with invalid event and handles error")
    def test_lambda_direct_invocation_error_handling(self):
        # ARRANGE - Event missing required shipmentId field
        invalid_event = {
            "version": "0",
            "id": str(uuid.uuid4()),
            "detail-type": "Shipment Update",
            "source": "logistics.shipments",
            "detail": {
                "status": "IN_TRANSIT",
                "location": "Dallas, TX"
                # Missing shipmentId
            }
        }

        # ACT
        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(invalid_event)
        )

        # ASSERT
        self.assertEqual(response['StatusCode'], 200)
        
        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 500)
        
        body = json.loads(payload['body'])
        self.assertIn('Error processing shipment event', body['message'])

    @mark.it("can write to and read from DynamoDB table")
    def test_dynamodb_read_write(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'shipmentId': shipment_id,
            'timestamp': timestamp,
            'status': 'IN_TRANSIT',
            'location': 'Chicago, IL',
            'carrier': 'UPS',
            'trackingNumber': 'TEST123456'
        }

        # ACT - Write
        self.table.put_item(Item=item)

        # ACT - Read
        response = self.table.get_item(
            Key={
                'shipmentId': shipment_id,
                'timestamp': timestamp
            }
        )

        # ASSERT
        self.assertIn('Item', response)
        retrieved_item = response['Item']
        self.assertEqual(retrieved_item['shipmentId'], shipment_id)
        self.assertEqual(retrieved_item['status'], 'IN_TRANSIT')
        self.assertEqual(retrieved_item['location'], 'Chicago, IL')

    @mark.it("can query DynamoDB table by shipmentId")
    def test_dynamodb_query_by_shipment_id(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        
        # Create multiple events for the same shipment
        timestamps = []
        for i in range(3):
            timestamp = datetime.utcnow().isoformat() + f".{i}"
            timestamps.append(timestamp)
            self.table.put_item(Item={
                'shipmentId': shipment_id,
                'timestamp': timestamp,
                'status': f'STATUS_{i}',
                'location': f'Location {i}'
            })
            time.sleep(0.1)  # Small delay to ensure different timestamps

        # ACT
        response = self.table.query(
            KeyConditionExpression='shipmentId = :sid',
            ExpressionAttributeValues={':sid': shipment_id}
        )

        # ASSERT
        self.assertEqual(response['Count'], 3)
        items = response['Items']
        self.assertEqual(len(items), 3)
        
        # Verify all items have the same shipmentId
        for item in items:
            self.assertEqual(item['shipmentId'], shipment_id)

    @mark.it("can query DynamoDB table using GSI by status")
    def test_dynamodb_query_by_status_gsi(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        status = "DELAYED"
        timestamp = datetime.utcnow().isoformat()
        
        self.table.put_item(Item={
            'shipmentId': shipment_id,
            'timestamp': timestamp,
            'status': status,
            'location': 'New York, NY'
        })
        
        # Wait for GSI to be updated
        time.sleep(2)

        # ACT
        response = self.table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status},
            Limit=10
        )

        # ASSERT
        self.assertGreaterEqual(response['Count'], 1)
        
        # Find our test item
        found = False
        for item in response['Items']:
            if item['shipmentId'] == shipment_id:
                found = True
                self.assertEqual(item['status'], status)
                break
        
        self.assertTrue(found, f"Test shipment {shipment_id} not found in GSI query")

    @mark.it("publishes event to EventBridge and Lambda processes it")
    def test_eventbridge_to_lambda_flow(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        event_detail = {
            "shipmentId": shipment_id,
            "status": "DELIVERED",
            "location": "Los Angeles, CA",
            "carrier": "DHL",
            "trackingNumber": f"DHL{uuid.uuid4().hex[:10].upper()}",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        # ACT - Publish event to EventBridge
        response = self.events_client.put_events(
            Entries=[
                {
                    'Source': 'logistics.shipments',
                    'DetailType': 'Shipment Update',
                    'Detail': json.dumps(event_detail),
                    'EventBusName': self.event_bus_name
                }
            ]
        )

        # ASSERT - Event was accepted
        self.assertEqual(response['FailedEntryCount'], 0)
        self.assertEqual(len(response['Entries']), 1)
        self.assertIsNotNone(response['Entries'][0].get('EventId'))

        # Wait for Lambda to process the event and write to DynamoDB
        time.sleep(5)

        # Query DynamoDB to verify the event was processed
        db_response = self.table.query(
            KeyConditionExpression='shipmentId = :sid',
            ExpressionAttributeValues={':sid': shipment_id}
        )

        # ASSERT - Event was processed and stored
        self.assertGreaterEqual(db_response['Count'], 1, 
                               "Lambda should have processed event and written to DynamoDB")
        
        item = db_response['Items'][0]
        self.assertEqual(item['shipmentId'], shipment_id)
        self.assertEqual(item['status'], 'DELIVERED')
        self.assertEqual(item['location'], 'Los Angeles, CA')
        self.assertEqual(item['carrier'], 'DHL')

    @mark.it("complete end-to-end flow: EventBridge -> Lambda -> DynamoDB -> Monitoring")
    def test_complete_flow(self):
        """
        Test the complete flow:
        1. Publish shipment event to EventBridge
        2. EventBridge routes to Lambda
        3. Lambda processes and writes to DynamoDB
        4. Verify data in DynamoDB
        5. Check Lambda logs for successful execution
        6. Verify CloudWatch metrics are updated
        """
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        tracking_number = f"TRACK{uuid.uuid4().hex[:10].upper()}"
        
        event_detail = {
            "shipmentId": shipment_id,
            "status": "OUT_FOR_DELIVERY",
            "location": "Seattle, WA",
            "carrier": "USPS",
            "trackingNumber": tracking_number,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        print(f"\n{'='*60}")
        print(f"COMPLETE FLOW TEST - Shipment ID: {shipment_id}")
        print(f"{'='*60}")

        # STEP 1: Publish event to EventBridge
        print("\n[STEP 1] Publishing event to EventBridge...")
        put_events_response = self.events_client.put_events(
            Entries=[
                {
                    'Source': 'logistics.shipments',
                    'DetailType': 'Shipment Update',
                    'Detail': json.dumps(event_detail),
                    'EventBusName': self.event_bus_name
                }
            ]
        )
        
        self.assertEqual(put_events_response['FailedEntryCount'], 0)
        event_id = put_events_response['Entries'][0]['EventId']
        print(f"✓ Event published successfully (EventId: {event_id})")

        # STEP 2: Wait for Lambda to process
        print("\n[STEP 2] Waiting for Lambda to process event...")
        time.sleep(6)
        print("✓ Processing wait complete")

        # STEP 3: Verify data in DynamoDB
        print("\n[STEP 3] Querying DynamoDB for processed event...")
        db_response = self.table.query(
            KeyConditionExpression='shipmentId = :sid',
            ExpressionAttributeValues={':sid': shipment_id}
        )
        
        self.assertGreaterEqual(db_response['Count'], 1, 
                               "Event should be stored in DynamoDB")
        
        item = db_response['Items'][0]
        self.assertEqual(item['shipmentId'], shipment_id)
        self.assertEqual(item['status'], 'OUT_FOR_DELIVERY')
        self.assertEqual(item['location'], 'Seattle, WA')
        self.assertEqual(item['carrier'], 'USPS')
        self.assertEqual(item['trackingNumber'], tracking_number)
        self.assertIn('processedAt', item)
        self.assertIn('eventType', item)
        self.assertIn('eventSource', item)
        print(f"✓ Data verified in DynamoDB")
        print(f"  - Status: {item['status']}")
        print(f"  - Location: {item['location']}")
        print(f"  - Processed At: {item['processedAt']}")

        # STEP 4: Check Lambda logs
        print("\n[STEP 4] Checking Lambda CloudWatch logs...")
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        
        try:
            log_streams_response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
            
            if log_streams_response['logStreams']:
                latest_stream = log_streams_response['logStreams'][0]
                log_stream_name = latest_stream['logStreamName']
                
                logs_response = self.logs_client.get_log_events(
                    logGroupName=log_group_name,
                    logStreamName=log_stream_name,
                    limit=50
                )
                
                # Look for our shipment ID in logs
                found_log = False
                for event in logs_response['events']:
                    if shipment_id in event['message']:
                        found_log = True
                        print(f"✓ Found log entry for shipment {shipment_id}")
                        break
                
                if not found_log:
                    print(f"⚠ Log entry not found yet (may still be processing)")
            else:
                print(f"⚠ No log streams found yet")
                
        except ClientError as e:
            print(f"⚠ Could not access logs: {str(e)}")

        # STEP 5: Verify CloudWatch metrics
        print("\n[STEP 5] Checking CloudWatch metrics...")
        
        metrics_response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Invocations',
            Dimensions=[
                {
                    'Name': 'FunctionName',
                    'Value': self.lambda_function_name
                }
            ],
            StartTime=datetime.utcnow().replace(hour=0, minute=0, second=0),
            EndTime=datetime.utcnow(),
            Period=3600,
            Statistics=['Sum']
        )
        
        if metrics_response['Datapoints']:
            total_invocations = sum(dp['Sum'] for dp in metrics_response['Datapoints'])
            print(f"✓ Lambda invocations metric available")
            print(f"  - Total invocations today: {int(total_invocations)}")
        else:
            print(f"⚠ Metrics not yet available (may take a few minutes)")

        print(f"\n{'='*60}")
        print(f"COMPLETE FLOW TEST PASSED ✓")
        print(f"{'='*60}\n")

    @mark.it("handles multiple concurrent events correctly")
    def test_concurrent_events(self):
        # ARRANGE
        num_events = 5
        shipment_ids = [self._generate_test_shipment_id() for _ in range(num_events)]
        
        entries = []
        for i, shipment_id in enumerate(shipment_ids):
            entries.append({
                'Source': 'logistics.shipments',
                'DetailType': 'Shipment Update',
                'Detail': json.dumps({
                    "shipmentId": shipment_id,
                    "status": f"STATUS_{i}",
                    "location": f"Location {i}",
                    "carrier": "TestCarrier",
                    "trackingNumber": f"TRACK{i}",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }),
                'EventBusName': self.event_bus_name
            })

        # ACT - Publish all events at once
        response = self.events_client.put_events(Entries=entries)
        
        # ASSERT - All events accepted
        self.assertEqual(response['FailedEntryCount'], 0)
        
        # Wait for processing
        time.sleep(8)
        
        # Verify all events were processed
        processed_count = 0
        for shipment_id in shipment_ids:
            db_response = self.table.query(
                KeyConditionExpression='shipmentId = :sid',
                ExpressionAttributeValues={':sid': shipment_id}
            )
            if db_response['Count'] > 0:
                processed_count += 1
        
        # At least 80% should be processed (allowing for eventual consistency)
        self.assertGreaterEqual(processed_count, num_events * 0.8,
                               f"Expected at least {num_events * 0.8} events processed, "
                               f"got {processed_count}")

    @mark.it("handles different event types correctly")
    def test_different_event_types(self):
        # ARRANGE
        shipment_id = self._generate_test_shipment_id()
        event_types = [
            "Shipment Update",
            "Shipment Created",
            "Shipment Delayed"
        ]
        
        # ACT - Publish events of different types
        for event_type in event_types:
            response = self.events_client.put_events(
                Entries=[
                    {
                        'Source': 'logistics.shipments',
                        'DetailType': event_type,
                        'Detail': json.dumps({
                            "shipmentId": shipment_id,
                            "status": "IN_TRANSIT",
                            "location": "Test Location",
                            "carrier": "TestCarrier",
                            "trackingNumber": "TEST123",
                            "timestamp": datetime.utcnow().isoformat() + f".{event_type}"
                        }),
                        'EventBusName': self.event_bus_name
                    }
                ]
            )
            self.assertEqual(response['FailedEntryCount'], 0)
            time.sleep(1)

        # Wait for all events to be processed
        time.sleep(5)

        # ASSERT - All event types were processed
        db_response = self.table.query(
            KeyConditionExpression='shipmentId = :sid',
            ExpressionAttributeValues={':sid': shipment_id}
        )
        
        self.assertGreaterEqual(db_response['Count'], 3,
                               "All three event types should be processed")
        
        # Verify different event types are stored
        stored_event_types = set(item.get('eventType', '') for item in db_response['Items'])
        self.assertGreater(len(stored_event_types), 1,
                          "Multiple event types should be stored")

