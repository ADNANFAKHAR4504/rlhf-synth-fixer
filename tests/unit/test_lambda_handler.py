import json
import os
import unittest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

from pytest import mark

# Mock AWS SDK before importing the handler
import sys
sys.path.append('lib/lambda')

# Mock boto3 before importing the handler
with patch('boto3.client'), patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket', 'AWS_DEFAULT_REGION': 'us-west-2'}):
    import lambda_handler
    from lambda_handler import lambda_handler, process_s3_record, get_s3_object_metadata, store_in_dynamodb


@mark.describe("Lambda Handler")
class TestLambdaHandler(unittest.TestCase):
    """Test cases for the Lambda handler function"""

    def setUp(self):
        """Set up test environment"""
        self.mock_event = {
            'Records': [
                {
                    'eventSource': 'aws:s3',
                    'eventName': 's3:ObjectCreated:Put',
                    'eventTime': '2023-01-01T00:00:00.000Z',
                    'awsRegion': 'us-west-2',
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'test-file.txt',
                            'size': 1024,
                            'eTag': 'test-etag'
                        }
                    }
                }
            ]
        }
        
        self.mock_context = Mock()

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3')
    @mark.it("processes S3 event successfully")
    def test_lambda_handler_success(self, mock_s3, mock_dynamodb):
        # ARRANGE
        mock_s3.head_object.return_value = {
            'ContentType': 'text/plain',
            'LastModified': datetime(2023, 1, 1)
        }
        mock_dynamodb.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

        # ACT
        result = lambda_handler(self.mock_event, self.mock_context)

        # ASSERT
        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['processed_count'], 1)
        self.assertEqual(response_body['error_count'], 0)
        
        # Verify DynamoDB was called
        mock_dynamodb.put_item.assert_called_once()
        call_args = mock_dynamodb.put_item.call_args
        self.assertEqual(call_args[1]['TableName'], 'test-table')

    @mark.it("handles missing TABLE_NAME environment variable")
    def test_lambda_handler_missing_table_name(self):
        # ARRANGE
        with patch.dict(os.environ, {}, clear=True):
            # Re-import the module to get fresh environment variables
            import importlib
            importlib.reload(lambda_handler)
            # ACT & ASSERT
            with self.assertRaises(ValueError) as context:
                lambda_handler.lambda_handler(self.mock_event, self.mock_context)
            
            self.assertIn("TABLE_NAME environment variable is required", str(context.exception))

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3')
    @mark.it("handles DynamoDB errors gracefully")
    def test_lambda_handler_dynamodb_error(self, mock_s3, mock_dynamodb):
        # ARRANGE
        mock_s3.head_object.return_value = {}
        mock_dynamodb.put_item.side_effect = Exception("DynamoDB error")

        # ACT
        result = lambda_handler(self.mock_event, self.mock_context)

        # ASSERT
        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['processed_count'], 0)
        self.assertEqual(response_body['error_count'], 1)
        self.assertIn("DynamoDB error", response_body['errors'][0])

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3')
    @mark.it("processes multiple records")
    def test_lambda_handler_multiple_records(self, mock_s3, mock_dynamodb):
        # ARRANGE
        event_with_multiple_records = {
            'Records': [
                self.mock_event['Records'][0],
                {
                    'eventSource': 'aws:s3',
                    'eventName': 's3:ObjectCreated:Copy',
                    'eventTime': '2023-01-01T01:00:00.000Z',
                    'awsRegion': 'us-west-2',
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'test-file-2.txt',
                            'size': 2048,
                            'eTag': 'test-etag-2'
                        }
                    }
                }
            ]
        }
        
        mock_s3.head_object.return_value = {}
        mock_dynamodb.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

        # ACT
        result = lambda_handler(event_with_multiple_records, self.mock_context)

        # ASSERT
        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['processed_count'], 2)
        self.assertEqual(response_body['error_count'], 0)
        
        # Verify DynamoDB was called twice
        self.assertEqual(mock_dynamodb.put_item.call_count, 2)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    @patch('lambda_handler.dynamodb')
    @patch('lambda_handler.s3')
    @mark.it("creates correct DynamoDB item structure")
    def test_process_s3_record_item_structure(self, mock_s3, mock_dynamodb):
        # ARRANGE
        mock_s3.head_object.return_value = {
            'ContentType': 'application/json',
            'LastModified': datetime(2023, 1, 1, 12, 0, 0)
        }
        mock_dynamodb.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

        # ACT
        result = process_s3_record(self.mock_event['Records'][0])

        # ASSERT
        self.assertEqual(result, 1)
        
        # Check the DynamoDB item structure
        call_args = mock_dynamodb.put_item.call_args
        item = call_args[1]['Item']
        
        # Verify required fields
        self.assertIn('pk', item)
        self.assertIn('sk', item)
        self.assertEqual(item['pk']['S'], 'OBJECT#test-file.txt')
        self.assertTrue(item['sk']['S'].startswith('CREATED#'))
        self.assertEqual(item['bucket_name']['S'], 'test-bucket')
        self.assertEqual(item['object_key']['S'], 'test-file.txt')
        self.assertEqual(item['object_size']['N'], '1024')
        self.assertEqual(item['etag']['S'], 'test-etag')
        self.assertEqual(item['event_source']['S'], 'aws:s3')
        self.assertEqual(item['event_name']['S'], 's3:ObjectCreated:Put')
        self.assertEqual(item['aws_region']['S'], 'us-west-2')
        self.assertEqual(item['content_type']['S'], 'application/json')

    @patch('lambda_handler.s3')
    @mark.it("handles S3 head_object errors gracefully")
    def test_get_s3_object_metadata_error(self, mock_s3):
        # ARRANGE
        from botocore.exceptions import ClientError
        mock_s3.head_object.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchKey'}}, 
            'HeadObject'
        )

        # ACT
        result = get_s3_object_metadata('test-bucket', 'nonexistent-key')

        # ASSERT
        self.assertEqual(result, {})

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    @patch('lambda_handler.dynamodb')
    @mark.it("handles conditional check failures in DynamoDB")
    def test_store_in_dynamodb_conditional_check_failure(self, mock_dynamodb):
        # ARRANGE
        from botocore.exceptions import ClientError
        mock_dynamodb.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'PutItem'
        )
        
        test_item = {
            'pk': {'S': 'test-pk'},
            'sk': {'S': 'test-sk'}
        }

        # ACT & ASSERT - Should not raise exception
        try:
            store_in_dynamodb(test_item)
        except Exception:
            self.fail("store_in_dynamodb should handle ConditionalCheckFailedException gracefully")

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    @patch('lambda_handler.dynamodb')
    @mark.it("handles other DynamoDB errors")
    def test_store_in_dynamodb_other_error(self, mock_dynamodb):
        # ARRANGE
        from botocore.exceptions import ClientError
        mock_dynamodb.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'PutItem'
        )
        
        test_item = {
            'pk': {'S': 'test-pk'},
            'sk': {'S': 'test-sk'}
        }

        # ACT & ASSERT
        with self.assertRaises(ClientError):
            store_in_dynamodb(test_item)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    @mark.it("handles URL-encoded S3 object keys")
    def test_process_s3_record_url_encoded_key(self):
        # ARRANGE
        event_with_encoded_key = {
            'eventSource': 'aws:s3',
            'eventName': 's3:ObjectCreated:Put',
            'eventTime': '2023-01-01T00:00:00.000Z',
            'awsRegion': 'us-west-2',
            's3': {
                'bucket': {
                    'name': 'test-bucket'
                },
                'object': {
                    'key': 'path%2Fto%2Ffile%20with%20spaces.txt',  # URL encoded key
                    'size': 1024,
                    'eTag': 'test-etag'
                }
            }
        }

        with patch('lambda_handler.dynamodb') as mock_dynamodb, \
             patch('lambda_handler.s3') as mock_s3:
            
            mock_s3.head_object.return_value = {}
            mock_dynamodb.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

            # ACT
            result = process_s3_record(event_with_encoded_key)

            # ASSERT
            self.assertEqual(result, 1)
            
            # Verify the key was URL decoded
            call_args = mock_dynamodb.put_item.call_args
            item = call_args[1]['Item']
            self.assertEqual(item['object_key']['S'], 'path/to/file with spaces.txt')
            self.assertEqual(item['pk']['S'], 'OBJECT#path/to/file with spaces.txt')