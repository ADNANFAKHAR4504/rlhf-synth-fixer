"""
Unit tests for the Lambda function code.
Tests the Lambda handler function and S3 record processing.
"""

import json
import os
# Import the Lambda handler
import sys
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/infrastructure/lambda_code'))

from app import lambda_handler, process_s3_record


class TestLambdaHandler:
    """Test cases for Lambda handler function."""
    
    def test_lambda_handler_single_record(self):
        """Test Lambda handler with single S3 record."""
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file.json'}
                    }
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {
                'status': 'success',
                'bucket': 'test-input-bucket',
                'key': 'test/file.json'
            }
            
            result = lambda_handler(event, Mock())
            
            # Verify response structure
            assert result['statusCode'] == 200
            assert 'body' in result
            
            # Verify processing was called
            mock_process.assert_called_once()
            
            # Verify response body
            body = json.loads(result['body'])
            assert len(body) == 1
            assert body[0]['status'] == 'success'
    
    def test_lambda_handler_multiple_records(self):
        """Test Lambda handler with multiple S3 records."""
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file1.json'}
                    }
                },
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file2.json'}
                    }
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {
                'status': 'success',
                'bucket': 'test-input-bucket',
                'key': 'test/file1.json'
            }
            
            result = lambda_handler(event, Mock())
            
            # Verify all records were processed
            assert mock_process.call_count == 2
            
            # Verify response structure
            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert len(body) == 2
    
    def test_lambda_handler_non_s3_record(self):
        """Test Lambda handler with non-S3 record."""
        event = {
            'Records': [
                {
                    'eventSource': 'aws:sqs',
                    'body': 'test message'
                }
            ]
        }
        
        result = lambda_handler(event, Mock())
        
        # Verify response structure
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 1
        assert body[0]['status'] == 'skipped'
        assert body[0]['reason'] == 'Not an S3 event record'
    
    def test_lambda_handler_mixed_records(self):
        """Test Lambda handler with mixed record types."""
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file.json'}
                    }
                },
                {
                    'eventSource': 'aws:sqs',
                    'body': 'test message'
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {
                'status': 'success',
                'bucket': 'test-input-bucket',
                'key': 'test/file.json'
            }
            
            result = lambda_handler(event, Mock())
            
            # Verify S3 record was processed
            mock_process.assert_called_once()
            
            # Verify response structure
            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert len(body) == 2
            assert body[0]['status'] == 'success'
            assert body[1]['status'] == 'skipped'
    
    def test_lambda_handler_empty_records(self):
        """Test Lambda handler with empty records."""
        event = {'Records': []}
        
        result = lambda_handler(event, Mock())
        
        # Verify response structure
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 0


class TestS3RecordProcessing:
    """Test cases for S3 record processing."""
    
    def test_process_s3_record_success(self):
        """Test successful S3 record processing."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 operations
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            # Verify successful processing
            assert result['status'] == 'success'
            assert result['bucket'] == 'test-input-bucket'
            assert result['key'] == 'test/file.json'
            assert 'processed_at' in result
    
    def test_process_s3_record_s3_error(self):
        """Test S3 record processing with S3 error."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 error
            mock_s3.get_object.side_effect = Exception("S3 error")
            
            result = process_s3_record(record)
            
            # Verify error handling
            assert result['status'] == 'error'
            assert 'error' in result
            assert 'S3 error' in result['error']
    
    def test_process_s3_record_processing_error(self):
        """Test S3 record processing with processing error."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 operations
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'invalid json'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            
            result = process_s3_record(record)
            
            # Verify error handling
            assert result['status'] == 'error'
            assert 'error' in result
    
    def test_process_s3_record_upload_error(self):
        """Test S3 record processing with upload error."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 operations
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.side_effect = Exception("Upload error")
            
            result = process_s3_record(record)
            
            # Verify error handling
            assert result['status'] == 'error'
            assert 'error' in result
            assert 'Upload error' in result['error']
    
    def test_process_s3_record_data_processing(self):
        """Test S3 record data processing logic."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        test_data = {"test": "data", "value": 123}
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 operations
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=json.dumps(test_data).encode()))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            # Verify successful processing
            assert result['status'] == 'success'
            assert result['bucket'] == 'test-input-bucket'
            assert result['key'] == 'test/file.json'
            
            # Verify S3 operations were called
            mock_s3.get_object.assert_called_once_with(
                Bucket='test-input-bucket',
                Key='test/file.json'
            )
            mock_s3.put_object.assert_called_once()
    
    def test_process_s3_record_metadata_extraction(self):
        """Test S3 record metadata extraction."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Mock S3 operations
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            # Verify metadata extraction
            assert result['status'] == 'success'
            assert 'metadata' in result
            assert result['metadata']['content_type'] == 'application/json'
            assert result['metadata']['content_length'] == 15
    
    def test_process_s3_record_output_bucket_configuration(self):
        """Test S3 record processing with output bucket configuration."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            with patch.dict(os.environ, {'OUTPUT_BUCKET': 'test-output-bucket'}):
                # Mock S3 operations
                mock_s3.get_object.return_value = {
                    'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
                }
                mock_s3.head_object.return_value = {
                    'ContentType': 'application/json',
                    'ContentLength': 15,
                    'LastModified': datetime.now()
                }
                mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
                
                result = process_s3_record(record)
                
                # Verify output bucket usage
                assert result['status'] == 'success'
                mock_s3.put_object.assert_called_once()
                
                # Verify put_object was called with output bucket
                put_call_args = mock_s3.put_object.call_args
                assert put_call_args[1]['Bucket'] == 'test-output-bucket'
    
    def test_process_s3_record_logging(self):
        """Test S3 record processing logging."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            with patch('app.logger') as mock_logger:
                # Mock S3 operations
                mock_s3.get_object.return_value = {
                    'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
                }
                mock_s3.head_object.return_value = {
                    'ContentType': 'application/json',
                    'ContentLength': 15,
                    'LastModified': datetime.now()
                }
                mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
                
                result = process_s3_record(record)
                
                # Verify logging
                assert mock_logger.info.called
                assert mock_logger.info.call_count >= 2  # At least start and success logs
