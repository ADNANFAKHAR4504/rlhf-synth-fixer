"""Unit tests for Lambda function."""

import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import importlib.util

# Add lambda directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

# Set environment variables before import
os.environ['METADATA_TABLE'] = 'test-table'
os.environ['ENVIRONMENT'] = 'test'
os.environ['METRICS_NAMESPACE'] = 'TestNamespace'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# Import Lambda function modules
spec = importlib.util.spec_from_file_location("processor",
                                               os.path.join(os.path.dirname(__file__),
                                                           '../../lib/lambda/processor.py'))
processor_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(processor_module)

handler = processor_module.handler
process_shipment_data = processor_module.process_shipment_data
store_metadata = processor_module.store_metadata
send_metric = processor_module.send_metric


@pytest.fixture
def s3_event():
    """Create a sample S3 event."""
    return {
        'Records': [{
            's3': {
                'bucket': {'name': 'test-bucket'},
                'object': {
                    'key': 'test-file.json',
                    'size': 1024
                }
            }
        }]
    }


def test_handler_success(s3_event):
    """Test successful file processing."""
    with patch.object(processor_module, 's3_client') as mock_s3, \
         patch.object(processor_module, 'dynamodb_client') as mock_ddb, \
         patch.object(processor_module, 'cloudwatch_client') as mock_cw:

        # Mock S3 response
        test_data = b'{"shipment_id": "123", "status": "delivered", "timestamp": "2024-01-01T00:00:00Z"}'
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: test_data)
        }

        # Call handler
        result = handler(s3_event, None)

        # Assertions
        assert result['statusCode'] == 200
        assert 'File processed successfully' in result['body']
        mock_ddb.put_item.assert_called_once()
        mock_cw.put_metric_data.assert_called()


def test_handler_failure(s3_event):
    """Test file processing failure."""
    with patch.object(processor_module, 's3_client') as mock_s3, \
         patch.object(processor_module, 'dynamodb_client') as mock_ddb, \
         patch.object(processor_module, 'cloudwatch_client') as mock_cw:

        # Mock S3 error
        mock_s3.get_object.side_effect = Exception("S3 error")

        # Call handler
        result = handler(s3_event, None)

        # Assertions
        assert result['statusCode'] == 500
        assert 'error' in result['body']


def test_process_shipment_data_json():
    """Test processing JSON shipment data."""
    data = b'[{"shipment_id": "1", "status": "shipped", "timestamp": "2024-01-01"}]'
    result = process_shipment_data(data)
    assert result == 1


def test_process_shipment_data_csv():
    """Test processing CSV shipment data."""
    data = b'header\nrow1\nrow2\nrow3'
    result = process_shipment_data(data)
    assert result == 4


def test_store_metadata():
    """Test storing metadata to DynamoDB."""
    with patch.object(processor_module, 'dynamodb_client') as mock_ddb:
        store_metadata(
            filename='test.json',
            upload_timestamp='2024-01-01T00:00:00Z',
            processing_status='SUCCESS',
            processing_duration=1.5,
            records_processed=10
        )

        mock_ddb.put_item.assert_called_once()
        call_args = mock_ddb.put_item.call_args[1]
        assert call_args['TableName'] == 'test-table'
        assert 'filename' in call_args['Item']


def test_send_metric():
    """Test sending metrics to CloudWatch."""
    with patch.object(processor_module, 'cloudwatch_client') as mock_cw:
        send_metric('TestMetric', 1.0)

        mock_cw.put_metric_data.assert_called_once()
        call_args = mock_cw.put_metric_data.call_args[1]
        assert call_args['Namespace'] == 'TestNamespace'
        assert call_args['MetricData'][0]['MetricName'] == 'TestMetric'
