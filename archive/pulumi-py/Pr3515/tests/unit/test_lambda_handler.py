"""
test_lambda_handler.py

Unit tests for the Lambda function handler that processes images.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import sys
import os
from decimal import Decimal
from datetime import datetime
import io

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Set environment variables before importing handler
os.environ['WEBP_BUCKET'] = 'test-webp-bucket'
os.environ['JPEG_BUCKET'] = 'test-jpeg-bucket'
os.environ['PNG_BUCKET'] = 'test-png-bucket'
os.environ['METADATA_TABLE'] = 'test-metadata-table'

# Import the handler after setting environment variables
from lambda_handler import process_image


class TestLambdaHandler(unittest.TestCase):
    """Test cases for Lambda image processing handler."""

    def setUp(self):
        """Set up test fixtures."""
        self.sample_event = {
            'Records': [{
                's3': {
                    'bucket': {
                        'name': 'test-upload-bucket'
                    },
                    'object': {
                        'key': 'test-image.jpg',
                        'size': 1024000
                    }
                }
            }]
        }
        self.context = MagicMock()

    @patch('lambda_handler.cloudwatch')
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3_client')
    @patch('lambda_handler.Image')
    @patch('lambda_handler.uuid.uuid4')
    def test_successful_image_processing(
        self, mock_uuid, mock_image_class, mock_s3, mock_dynamodb, mock_cloudwatch
    ):
        """Test successful image processing workflow."""
        # Mock UUID generation
        mock_uuid.return_value = 'test-uuid-1234'

        # Mock S3 get_object response
        mock_body = MagicMock()
        mock_body.read.return_value = b'fake-image-data'
        mock_s3.get_object.return_value = {'Body': mock_body}

        # Mock PIL Image
        mock_img = MagicMock()
        mock_img.mode = 'RGB'
        mock_image_class.open.return_value = mock_img

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Execute handler
        result = process_image(self.sample_event, self.context)

        # Verify S3 get_object was called
        mock_s3.get_object.assert_called_once_with(
            Bucket='test-upload-bucket',
            Key='test-image.jpg'
        )

        # Verify image was opened
        mock_image_class.open.assert_called_once()

        # Verify images were saved in all formats
        self.assertEqual(mock_img.save.call_count, 3)  # WebP, JPEG, PNG

        # Verify S3 put_object was called for each format
        self.assertEqual(mock_s3.put_object.call_count, 3)

        # Verify DynamoDB table put_item was called
        mock_table.put_item.assert_called_once()
        dynamo_call = mock_table.put_item.call_args[1]['Item']
        self.assertEqual(dynamo_call['image_id'], 'test-uuid-1234')
        self.assertEqual(dynamo_call['original_filename'], 'test-image.jpg')
        self.assertEqual(dynamo_call['conversion_status'], 'completed')

        # Verify CloudWatch metrics were sent
        mock_cloudwatch.put_metric_data.assert_called()

        # Verify response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['image_id'], 'test-uuid-1234')

    @patch('lambda_handler.cloudwatch')
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3_client')
    def test_s3_download_error(self, mock_s3, mock_dynamodb, mock_cloudwatch):
        """Test handling of S3 download errors."""
        # Mock S3 error
        mock_s3.get_object.side_effect = Exception("S3 download error")

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Execute handler and expect exception
        with self.assertRaises(Exception) as context:
            process_image(self.sample_event, self.context)

        self.assertIn("S3 download error", str(context.exception))

        # Verify error metric was sent to CloudWatch
        mock_cloudwatch.put_metric_data.assert_called()
        metric_call = mock_cloudwatch.put_metric_data.call_args
        metrics = metric_call[1]['MetricData']
        self.assertEqual(metrics[0]['MetricName'], 'ProcessingErrors')

    @patch('lambda_handler.cloudwatch')
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3_client')
    @patch('lambda_handler.Image')
    @patch('lambda_handler.uuid.uuid4')
    def test_image_conversion_with_rgba(
        self, mock_uuid, mock_image_class, mock_s3, mock_dynamodb, mock_cloudwatch
    ):
        """Test image conversion handles RGBA mode correctly."""
        # Mock UUID generation
        mock_uuid.return_value = 'test-uuid-rgba'

        # Mock S3 get_object response
        mock_body = MagicMock()
        mock_body.read.return_value = b'fake-image-data'
        mock_s3.get_object.return_value = {'Body': mock_body}

        # Mock PIL Image with RGBA mode
        mock_img = MagicMock()
        mock_img.mode = 'RGBA'
        mock_converted_img = MagicMock()
        mock_img.convert.return_value = mock_converted_img
        mock_image_class.open.return_value = mock_img

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Execute handler
        result = process_image(self.sample_event, self.context)

        # Verify image was converted from RGBA to RGB for JPEG
        mock_img.convert.assert_called_with('RGB')

        # Verify success
        self.assertEqual(result['statusCode'], 200)

    @patch('lambda_handler.cloudwatch')
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3_client')
    @patch('lambda_handler.Image')
    def test_multiple_format_outputs(
        self, mock_image_class, mock_s3, mock_dynamodb, mock_cloudwatch
    ):
        """Test that all three format outputs are created correctly."""
        # Mock S3 get_object response
        mock_body = MagicMock()
        mock_body.read.return_value = b'fake-image-data'
        mock_s3.get_object.return_value = {'Body': mock_body}

        # Mock PIL Image
        mock_img = MagicMock()
        mock_img.mode = 'RGB'
        mock_image_class.open.return_value = mock_img

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Execute handler
        process_image(self.sample_event, self.context)

        # Verify S3 put_object calls for each format
        put_calls = mock_s3.put_object.call_args_list
        self.assertEqual(len(put_calls), 3)

        # Check buckets and content types
        buckets_called = {call[1]['Bucket'] for call in put_calls}
        content_types = {call[1]['ContentType'] for call in put_calls}

        self.assertEqual(buckets_called, {'test-webp-bucket', 'test-jpeg-bucket', 'test-png-bucket'})
        self.assertEqual(content_types, {'image/webp', 'image/jpeg', 'image/png'})

    @patch('lambda_handler.cloudwatch')
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3_client')
    @patch('lambda_handler.Image')
    def test_error_logging_to_dynamodb(
        self, mock_image_class, mock_s3, mock_dynamodb, mock_cloudwatch
    ):
        """Test error information is logged to DynamoDB on failure."""
        # Mock S3 get_object response
        mock_body = MagicMock()
        mock_body.read.return_value = b'fake-image-data'
        mock_s3.get_object.return_value = {'Body': mock_body}

        # Mock PIL Image to raise error during save
        mock_img = MagicMock()
        mock_img.save.side_effect = Exception("Image processing error")
        mock_image_class.open.return_value = mock_img

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        # Execute handler and expect exception
        with self.assertRaises(Exception):
            process_image(self.sample_event, self.context)

        # Verify error was logged to DynamoDB
        mock_table.put_item.assert_called()
        dynamo_call = mock_table.put_item.call_args[1]['Item']
        self.assertEqual(dynamo_call['conversion_status'], 'failed')
        self.assertIn('Image processing error', dynamo_call['error_message'])


if __name__ == '__main__':
    unittest.main()