import unittest
import json
import base64
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime
import sys
import os

# Add lib directory to path to import the lambda handler
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

# Mock the environment variables before importing
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'
os.environ['ALERT_THRESHOLD'] = '80'
os.environ['EVENT_BUS_NAME'] = 'test-event-bus'
os.environ['ENVIRONMENT'] = 'test'

# Mock boto3 before importing lambda_handler
with patch('boto3.resource'), patch('boto3.client'):
    from lambda_handler import TrafficDataProcessor, lambda_handler


class TestTrafficDataProcessor(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.processor = TrafficDataProcessor()
        
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events')
    @patch('lambda_handler.cloudwatch')
    def test_init(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test TrafficDataProcessor initialization."""
        processor = TrafficDataProcessor()
        self.assertEqual(processor.processed_count, 0)
        self.assertEqual(processor.error_count, 0)
        self.assertEqual(processor.metrics_buffer, [])
        self.assertEqual(processor.alerts_buffer, [])
        
    def test_decode_kinesis_record(self):
        """Test Kinesis record decoding."""
        test_data = {'sensor_id': 'sensor-123', 'zone_id': 'zone-1'}
        encoded_data = base64.b64encode(json.dumps(test_data).encode('utf-8')).decode('utf-8')
        
        record = {
            'kinesis': {
                'data': encoded_data
            }
        }
        
        decoded_data = self.processor._decode_kinesis_record(record)
        self.assertEqual(decoded_data, test_data)
        
    def test_generate_unique_id(self):
        """Test unique ID generation."""
        data = {
            'sensor_id': 'sensor-123',
            'timestamp': '2023-01-01T12:00:00Z',
            'vehicle_count': 50
        }
        
        unique_id = self.processor._generate_unique_id(data)
        self.assertIsInstance(unique_id, str)
        self.assertEqual(len(unique_id), 32)  # MD5 hash length
        
        # Same data should produce same ID
        unique_id2 = self.processor._generate_unique_id(data)
        self.assertEqual(unique_id, unique_id2)
        
    def test_calculate_traffic_flow_score(self):
        """Test traffic flow score calculation."""
        # Test normal conditions
        score = self.processor._calculate_traffic_flow_score(50, 45.0, 30.0)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
        
        # Test high congestion
        score_high_congestion = self.processor._calculate_traffic_flow_score(100, 10.0, 90.0)
        self.assertLess(score_high_congestion, 50)
        
        # Test optimal conditions
        score_optimal = self.processor._calculate_traffic_flow_score(50, 60.0, 10.0)
        self.assertGreater(score_optimal, 50)
        
    def test_process_sensor_data_valid(self):
        """Test processing valid sensor data."""
        data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'timestamp': '2023-01-01T12:00:00Z',
            'vehicle_count': 50,
            'avg_speed': 45.5,
            'congestion_index': 30.2,
            'temperature': 25.0,
            'weather_condition': 'sunny'
        }
        
        processed = self.processor._process_sensor_data(data)
        
        self.assertEqual(processed['sensor_id'], 'sensor-123')
        self.assertEqual(processed['zone_id'], 'zone-1')
        self.assertEqual(processed['vehicle_count'], 50)
        self.assertIsInstance(processed['avg_speed'], Decimal)
        self.assertIsInstance(processed['congestion_index'], Decimal)
        self.assertIsInstance(processed['traffic_flow_score'], Decimal)
        self.assertIn('unique_id', processed)
        self.assertIn('processed_at', processed)
        self.assertIn('ttl', processed)
        self.assertEqual(processed['environment'], 'test')
        self.assertIsInstance(processed['temperature'], Decimal)
        self.assertEqual(processed['weather_condition'], 'sunny')
        
    def test_process_sensor_data_missing_fields(self):
        """Test processing sensor data with missing required fields."""
        data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1'
            # Missing required fields
        }
        
        with self.assertRaises(ValueError) as context:
            self.processor._process_sensor_data(data)
        
        self.assertIn('Missing required field', str(context.exception))
        
    def test_check_congestion_alert_normal(self):
        """Test congestion alert check for normal levels."""
        data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'unique_id': 'test-id',
            'congestion_index': Decimal('50.0'),
            'vehicle_count': 30,
            'avg_speed': Decimal('45.0'),
            'traffic_flow_score': Decimal('75.0'),
            'timestamp': '2023-01-01T12:00:00Z'
        }
        
        initial_alerts = len(self.processor.alerts_buffer)
        self.processor._check_congestion_alert(data)
        self.assertEqual(len(self.processor.alerts_buffer), initial_alerts)
        
    def test_check_congestion_alert_warning(self):
        """Test congestion alert check for warning level."""
        data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'unique_id': 'test-id',
            'congestion_index': Decimal('85.0'),
            'vehicle_count': 80,
            'avg_speed': Decimal('25.0'),
            'traffic_flow_score': Decimal('35.0'),
            'timestamp': '2023-01-01T12:00:00Z'
        }
        
        self.processor._check_congestion_alert(data)
        self.assertEqual(len(self.processor.alerts_buffer), 1)
        
        alert = self.processor.alerts_buffer[0]
        self.assertEqual(alert['Source'], 'traffic.analytics')
        self.assertEqual(alert['DetailType'], 'CongestionAlert')
        self.assertIn('WARNING', json.loads(alert['Detail'])['alert_level'])
        
    def test_check_congestion_alert_critical(self):
        """Test congestion alert check for critical level."""
        data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'unique_id': 'test-id',
            'congestion_index': Decimal('95.0'),
            'vehicle_count': 120,
            'avg_speed': Decimal('10.0'),
            'traffic_flow_score': Decimal('15.0'),
            'timestamp': '2023-01-01T12:00:00Z'
        }
        
        self.processor._check_congestion_alert(data)
        self.assertEqual(len(self.processor.alerts_buffer), 1)
        
        alert = self.processor.alerts_buffer[0]
        alert_detail = json.loads(alert['Detail'])
        self.assertEqual(alert_detail['alert_level'], 'CRITICAL')
        
    def test_collect_metrics(self):
        """Test metrics collection."""
        data = {
            'zone_id': 'zone-1',
            'sensor_id': 'sensor-123',
            'congestion_index': Decimal('75.5'),
            'vehicle_count': 60,
            'traffic_flow_score': Decimal('45.2')
        }
        
        initial_metrics = len(self.processor.metrics_buffer)
        self.processor._collect_metrics(data)
        
        # Should add 4 metrics
        self.assertEqual(len(self.processor.metrics_buffer), initial_metrics + 4)
        
        # Check metric names
        metric_names = [metric['MetricName'] for metric in self.processor.metrics_buffer[-4:]]
        expected_names = ['ProcessedSensorData', 'CongestionIndex', 'VehicleCount', 'TrafficFlowScore']
        self.assertEqual(set(metric_names), set(expected_names))
        
    def test_record_error_metric(self):
        """Test error metric recording."""
        error_type = 'TestError'
        
        initial_metrics = len(self.processor.metrics_buffer)
        self.processor._record_error_metric(error_type)
        
        self.assertEqual(len(self.processor.metrics_buffer), initial_metrics + 1)
        
        error_metric = self.processor.metrics_buffer[-1]
        self.assertEqual(error_metric['MetricName'], 'ProcessingErrors')
        self.assertEqual(error_metric['Value'], 1)
        
    @patch('lambda_handler.dynamodb')
    def test_batch_write_to_dynamodb_success(self, mock_dynamodb):
        """Test successful DynamoDB batch write."""
        mock_batch_write = Mock()
        mock_batch_write.return_value = {'UnprocessedItems': {}}
        mock_dynamodb.batch_write_item = mock_batch_write
        
        items = [{'PutRequest': {'Item': {'id': f'item-{i}'}}} for i in range(5)]
        
        self.processor._batch_write_to_dynamodb(items)
        
        mock_batch_write.assert_called_once()
        call_args = mock_batch_write.call_args[1]
        self.assertEqual(len(call_args['RequestItems']['test-table']), 5)
        
    @patch('lambda_handler.dynamodb')
    def test_batch_write_to_dynamodb_with_unprocessed(self, mock_dynamodb):
        """Test DynamoDB batch write with unprocessed items."""
        mock_batch_write = Mock()
        mock_batch_write.return_value = {
            'UnprocessedItems': {
                'test-table': [{'PutRequest': {'Item': {'id': 'unprocessed-item'}}}]
            }
        }
        mock_dynamodb.batch_write_item = mock_batch_write
        
        items = [{'PutRequest': {'Item': {'id': 'item-1'}}}]
        
        # Should not raise an exception
        self.processor._batch_write_to_dynamodb(items)
        
    @patch('lambda_handler.events')
    def test_send_alerts_success(self, mock_events):
        """Test successful alert sending."""
        mock_put_events = Mock()
        mock_put_events.return_value = {'FailedEntryCount': 0}
        mock_events.put_events = mock_put_events
        
        self.processor.alerts_buffer = [
            {
                'Source': 'traffic.analytics',
                'DetailType': 'CongestionAlert',
                'Detail': '{"test": "data"}',
                'EventBusName': 'test-event-bus'
            }
        ]
        
        self.processor._send_alerts()
        
        mock_put_events.assert_called_once()
        
    @patch('lambda_handler.cloudwatch')
    def test_publish_metrics_success(self, mock_cloudwatch):
        """Test successful metrics publishing."""
        mock_put_metric_data = Mock()
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        self.processor.metrics_buffer = [
            {
                'MetricName': 'TestMetric',
                'Value': 1.0,
                'Unit': 'Count',
                'Dimensions': [{'Name': 'Zone', 'Value': 'zone-1'}]
            }
        ]
        
        self.processor._publish_metrics()
        
        mock_put_metric_data.assert_called_once()
        call_args = mock_put_metric_data.call_args[1]
        self.assertEqual(call_args['Namespace'], 'TrafficAnalytics')
        self.assertEqual(len(call_args['MetricData']), 1)


class TestLambdaHandler(unittest.TestCase):
    @patch('lambda_handler.TrafficDataProcessor')
    def test_lambda_handler(self, mock_processor_class):
        """Test the main lambda handler function."""
        mock_processor = Mock()
        mock_processor.process_batch.return_value = {
            'statusCode': 200,
            'batchItemsProcessed': 5,
            'errors': 0,
            'alertsSent': 1
        }
        mock_processor_class.return_value = mock_processor
        
        event = {
            'Records': [
                {
                    'kinesis': {
                        'data': base64.b64encode(json.dumps({
                            'sensor_id': 'sensor-123',
                            'zone_id': 'zone-1',
                            'vehicle_count': 50,
                            'avg_speed': 45.0,
                            'congestion_index': 75.0
                        }).encode('utf-8')).decode('utf-8')
                    }
                }
            ]
        }
        
        context = Mock()
        
        result = lambda_handler(event, context)
        
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['batchItemsProcessed'], 5)
        self.assertEqual(result['errors'], 0)
        self.assertEqual(result['alertsSent'], 1)
        
        mock_processor.process_batch.assert_called_once_with(event)


class TestIntegrationFlow(unittest.TestCase):
    """Test the full integration flow."""
    
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events')
    @patch('lambda_handler.cloudwatch')
    def test_process_batch_with_real_data(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test process_batch with realistic sensor data."""
        # Mock DynamoDB
        mock_batch_write = Mock()
        mock_batch_write.return_value = {'UnprocessedItems': {}}
        mock_dynamodb.batch_write_item = mock_batch_write
        
        # Mock EventBridge
        mock_put_events = Mock()
        mock_put_events.return_value = {'FailedEntryCount': 0}
        mock_events.put_events = mock_put_events
        
        # Mock CloudWatch
        mock_put_metric_data = Mock()
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        # Create test event
        sensor_data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'timestamp': '2023-01-01T12:00:00Z',
            'vehicle_count': 85,
            'avg_speed': 20.0,
            'congestion_index': 95.0  # Above threshold for alert
        }
        
        kinesis_record = {
            'kinesis': {
                'data': base64.b64encode(json.dumps(sensor_data).encode('utf-8')).decode('utf-8')
            }
        }
        
        event = {'Records': [kinesis_record]}
        
        processor = TrafficDataProcessor()
        result = processor.process_batch(event)
        
        # Verify results
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['batchItemsProcessed'], 1)
        self.assertEqual(result['alertsSent'], 1)
        self.assertEqual(result['errors'], 0)
        
        # Verify DynamoDB was called
        mock_batch_write.assert_called_once()
        
        # Verify EventBridge was called for alert
        mock_put_events.assert_called_once()
        
        # Verify CloudWatch metrics were published
        mock_put_metric_data.assert_called()
        
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events') 
    @patch('lambda_handler.cloudwatch')
    def test_process_batch_with_errors(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test process_batch with malformed data that causes errors."""
        # Mock DynamoDB to fail
        mock_batch_write = Mock()
        mock_batch_write.side_effect = Exception("DynamoDB error")
        mock_dynamodb.batch_write_item = mock_batch_write
        
        # Mock CloudWatch
        mock_put_metric_data = Mock()
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        # Create test event with malformed data
        malformed_data = {'incomplete': 'data'}  # Missing required fields
        
        kinesis_record = {
            'kinesis': {
                'data': base64.b64encode(json.dumps(malformed_data).encode('utf-8')).decode('utf-8')
            }
        }
        
        event = {'Records': [kinesis_record]}
        
        processor = TrafficDataProcessor()
        result = processor.process_batch(event)
        
        # Should handle errors gracefully
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['errors'], 1)
        self.assertEqual(result['batchItemsProcessed'], 0)
        
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events')
    @patch('lambda_handler.cloudwatch')
    def test_process_batch_large_batch(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test process_batch with large batch exceeding limits."""
        # Mock services
        mock_batch_write = Mock()
        mock_batch_write.return_value = {'UnprocessedItems': {}}
        mock_dynamodb.batch_write_item = mock_batch_write
        
        mock_put_events = Mock()
        mock_put_events.return_value = {'FailedEntryCount': 0}
        mock_events.put_events = mock_put_events
        
        mock_put_metric_data = Mock()
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        # Create event with 30 records (exceeds DynamoDB batch limit of 25)
        records = []
        for i in range(30):
            sensor_data = {
                'sensor_id': f'sensor-{i}',
                'zone_id': 'zone-1',
                'vehicle_count': 50,
                'avg_speed': 45.0,
                'congestion_index': 85.0  # Above threshold
            }
            records.append({
                'kinesis': {
                    'data': base64.b64encode(json.dumps(sensor_data).encode('utf-8')).decode('utf-8')
                }
            })
        
        event = {'Records': records}
        
        processor = TrafficDataProcessor()
        result = processor.process_batch(event)
        
        # Should process all records
        self.assertEqual(result['batchItemsProcessed'], 30)
        self.assertEqual(result['alertsSent'], 30)
        
        # Should batch DynamoDB writes (only first 25 items written)
        mock_batch_write.assert_called()
        
        # Should batch EventBridge events (only first 10 alerts sent)
        mock_put_events.assert_called()
        
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events')
    @patch('lambda_handler.cloudwatch')
    def test_eventbridge_failure_handling(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test handling EventBridge failures."""
        # Mock DynamoDB
        mock_batch_write = Mock()
        mock_batch_write.return_value = {'UnprocessedItems': {}}
        mock_dynamodb.batch_write_item = mock_batch_write
        
        # Mock EventBridge to fail
        mock_put_events = Mock()
        mock_put_events.side_effect = Exception("EventBridge error")
        mock_events.put_events = mock_put_events
        
        # Mock CloudWatch
        mock_put_metric_data = Mock()
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        # Create event with high congestion (triggers alert)
        sensor_data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'vehicle_count': 100,
            'avg_speed': 10.0,
            'congestion_index': 95.0
        }
        
        kinesis_record = {
            'kinesis': {
                'data': base64.b64encode(json.dumps(sensor_data).encode('utf-8')).decode('utf-8')
            }
        }
        
        event = {'Records': [kinesis_record]}
        
        processor = TrafficDataProcessor()
        result = processor.process_batch(event)
        
        # Should handle EventBridge error gracefully
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['batchItemsProcessed'], 1)
        
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.events')
    @patch('lambda_handler.cloudwatch')
    def test_cloudwatch_failure_handling(self, mock_cloudwatch, mock_events, mock_dynamodb):
        """Test handling CloudWatch failures."""
        # Mock DynamoDB
        mock_batch_write = Mock()
        mock_batch_write.return_value = {'UnprocessedItems': {}}
        mock_dynamodb.batch_write_item = mock_batch_write
        
        # Mock EventBridge
        mock_put_events = Mock()
        mock_put_events.return_value = {'FailedEntryCount': 0}
        mock_events.put_events = mock_put_events
        
        # Mock CloudWatch to fail
        mock_put_metric_data = Mock()
        mock_put_metric_data.side_effect = Exception("CloudWatch error")
        mock_cloudwatch.put_metric_data = mock_put_metric_data
        
        # Create normal event
        sensor_data = {
            'sensor_id': 'sensor-123',
            'zone_id': 'zone-1',
            'vehicle_count': 50,
            'avg_speed': 45.0,
            'congestion_index': 50.0
        }
        
        kinesis_record = {
            'kinesis': {
                'data': base64.b64encode(json.dumps(sensor_data).encode('utf-8')).decode('utf-8')
            }
        }
        
        event = {'Records': [kinesis_record]}
        
        processor = TrafficDataProcessor()
        result = processor.process_batch(event)
        
        # Should handle CloudWatch error gracefully
        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(result['batchItemsProcessed'], 1)


if __name__ == '__main__':
    unittest.main()