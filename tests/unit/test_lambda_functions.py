"""
Unit tests for Lambda function handlers.
"""
import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock, Mock
from datetime import datetime

# Add lib/lambda to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

# Set required environment variables before importing handlers
os.environ['METADATA_TABLE_NAME'] = 'test-metadata-table'
os.environ['UPLOAD_BUCKET_NAME'] = 'test-upload-bucket'
os.environ['LOG_LEVEL'] = 'INFO'


class TestImageProcessor:
    """Test suite for image processor Lambda function."""
    
    @pytest.fixture
    def s3_event(self):
        """Create a sample S3 event for testing."""
        return {
            'Records': [
                {
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'test-images/photo.jpg'
                        }
                    }
                }
            ]
        }
    
    @patch('image_processor.dynamodb')
    @patch('image_processor.s3_client')
    def test_handler_success(self, mock_s3, mock_dynamodb, s3_event):
        """Test successful image processing."""
        from image_processor import handler
        
        # Mock S3 head_object response
        mock_s3.head_object.return_value = {
            'ContentLength': 1024,
            'LastModified': datetime.now(),
            'ContentType': 'image/jpeg'
        }
        
        # Mock S3 presigned URL generation
        mock_s3.generate_presigned_url.return_value = 'https://test-url.com'
        
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Call handler
        result = handler(s3_event, None)
        
        # Assertions
        assert result['statusCode'] == 200
        assert 'Image processing completed' in json.loads(result['body'])['message']
        mock_table.put_item.assert_called_once()
        mock_s3.head_object.assert_called_once()
    
    @patch('image_processor.dynamodb')
    @patch('image_processor.s3_client')
    def test_handler_error_handling(self, mock_s3, mock_dynamodb, s3_event):
        """Test error handling in image processor."""
        from image_processor import handler
        
        # Mock S3 to raise an error
        mock_s3.head_object.side_effect = Exception("S3 error")
        
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Call handler
        result = handler(s3_event, None)
        
        # Should still return success but store error in DynamoDB
        assert result['statusCode'] == 200
        # Error should be stored in DynamoDB
        mock_table.put_item.assert_called()
        call_args = mock_table.put_item.call_args[1]['Item']
        assert call_args['status'] == 'error'
        assert 'S3 error' in call_args['error']
    
    def test_perform_image_analysis(self):
        """Test image analysis function."""
        from image_processor import perform_image_analysis
        
        result = perform_image_analysis('test-bucket', 'test.jpg')
        
        assert 'description' in result
        assert 'confidence' in result
        assert 'tags' in result
        assert result['format'] == 'JPG'


class TestDocumentProcessor:
    """Test suite for document processor Lambda function."""
    
    @pytest.fixture
    def s3_event(self):
        """Create a sample S3 event for testing."""
        return {
            'Records': [
                {
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'documents/file.txt'
                        }
                    }
                }
            ]
        }
    
    @patch('document_processor.dynamodb')
    @patch('document_processor.s3_client')
    def test_handler_txt_file(self, mock_s3, mock_dynamodb, s3_event):
        """Test processing of text files."""
        from document_processor import handler
        
        # Mock S3 responses
        mock_s3.head_object.return_value = {
            'ContentLength': 500,
            'LastModified': datetime.now(),
            'ContentType': 'text/plain'
        }
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: b'Sample text content')
        }
        mock_s3.generate_presigned_url.return_value = 'https://test-url.com'
        
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Call handler
        result = handler(s3_event, None)
        
        # Assertions
        assert result['statusCode'] == 200
        assert 'Document processing completed' in json.loads(result['body'])['message']
        mock_table.put_item.assert_called_once()
    
    def test_extract_document_text_txt(self):
        """Test text extraction from TXT files."""
        from document_processor import extract_document_text
        
        with patch('document_processor.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': MagicMock(read=lambda: b'Test content')
            }
            
            result = extract_document_text('bucket', 'file.txt')
            assert result == 'Test content'
    
    def test_extract_document_text_pdf(self):
        """Test text extraction from PDF files."""
        from document_processor import extract_document_text
        
        result = extract_document_text('bucket', 'file.pdf')
        assert 'PDF content extracted' in result
        assert 'Amazon Textract' in result
    
    def test_analyze_document_content(self):
        """Test document content analysis."""
        from document_processor import analyze_document_content
        
        text = "This is a sample text with multiple words for testing purposes."
        result = analyze_document_content(text)
        
        assert result['word_count'] == 11
        assert result['character_count'] == len(text)
        assert result['estimated_reading_time_minutes'] >= 1
        assert 'content_summary' in result


class TestDataProcessor:
    """Test suite for data processor Lambda function."""
    
    @pytest.fixture
    def csv_event(self):
        """Create a sample S3 event for CSV file."""
        return {
            'Records': [
                {
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'data/sample.csv'
                        }
                    }
                }
            ]
        }
    
    @pytest.fixture
    def json_event(self):
        """Create a sample S3 event for JSON file."""
        return {
            'Records': [
                {
                    's3': {
                        'bucket': {
                            'name': 'test-bucket'
                        },
                        'object': {
                            'key': 'data/sample.json'
                        }
                    }
                }
            ]
        }
    
    @patch('data_processor.dynamodb')
    @patch('data_processor.s3_client')
    def test_handler_csv_file(self, mock_s3, mock_dynamodb, csv_event):
        """Test processing of CSV files."""
        from data_processor import handler
        
        # Mock S3 responses
        mock_s3.head_object.return_value = {
            'ContentLength': 1000,
            'LastModified': datetime.now(),
            'ContentType': 'text/csv'
        }
        csv_content = "header1,header2,header3\nvalue1,value2,value3\nvalue4,value5,value6"
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: csv_content.encode('utf-8'))
        }
        mock_s3.generate_presigned_url.return_value = 'https://test-url.com'
        
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Call handler
        result = handler(csv_event, None)
        
        # Assertions
        assert result['statusCode'] == 200
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]['Item']
        assert call_args['status'] == 'processed'
        assert call_args['analysis']['file_type'] == 'csv'
    
    @patch('data_processor.dynamodb')
    @patch('data_processor.s3_client')
    def test_handler_json_file(self, mock_s3, mock_dynamodb, json_event):
        """Test processing of JSON files."""
        from data_processor import handler
        
        # Mock S3 responses
        mock_s3.head_object.return_value = {
            'ContentLength': 500,
            'LastModified': datetime.now(),
            'ContentType': 'application/json'
        }
        json_content = '{"key": "value", "number": 42}'
        mock_s3.get_object.return_value = {
            'Body': MagicMock(read=lambda: json_content.encode('utf-8'))
        }
        mock_s3.generate_presigned_url.return_value = 'https://test-url.com'
        
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        
        # Call handler
        result = handler(json_event, None)
        
        # Assertions
        assert result['statusCode'] == 200
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]['Item']
        assert call_args['status'] == 'processed'
        assert call_args['analysis']['file_type'] == 'json'
    
    def test_process_csv_data(self):
        """Test CSV data processing."""
        from data_processor import process_csv_data
        
        csv_content = "name,age,city\nJohn,30,NYC\nJane,25,LA\nBob,35,Chicago"
        result = process_csv_data(csv_content, 'test.csv')
        
        assert result['file_type'] == 'csv'
        assert result['total_rows'] == 3
        assert result['total_columns'] == 3
        assert result['headers'] == ['name', 'age', 'city']
        assert len(result['sample_rows']) == 3
    
    def test_process_json_data(self):
        """Test JSON data processing."""
        from data_processor import process_json_data
        
        json_content = '{"users": [{"name": "John"}, {"name": "Jane"}], "count": 2}'
        result = process_json_data(json_content, 'test.json')
        
        assert result['file_type'] == 'json'
        assert result['data_type'] == 'dict'
        assert result['validation']['is_valid_json'] is True
        assert 'structure_analysis' in result
    
    def test_infer_column_types(self):
        """Test column type inference."""
        from data_processor import infer_column_types
        
        data_rows = [
            ['John', '30', '150.5'],
            ['Jane', '25', '160.2'],
            ['Bob', '35', '180.9']
        ]
        headers = ['name', 'age', 'height']
        
        result = infer_column_types(data_rows, headers)
        
        assert result['name'] == 'string'
        assert result['age'] == 'integer'
        assert result['height'] == 'float'


class TestApiHandler:
    """Test suite for API handler Lambda function."""
    
    @patch('api_handler.dynamodb')
    def test_list_all_files(self, mock_dynamodb):
        """Test listing all files endpoint."""
        from api_handler import handler
        
        # Mock DynamoDB table and scan
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': [
                {'fileId': 'file1', 'fileName': 'test1.jpg', 'status': 'processed'},
                {'fileId': 'file2', 'fileName': 'test2.pdf', 'status': 'processed'}
            ]
        }
        mock_dynamodb.Table.return_value = mock_table
        
        # Create API Gateway event
        event = {
            'httpMethod': 'GET',
            'path': '/files',
            'pathParameters': {},
            'queryStringParameters': {}
        }
        
        result = handler(event, None)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'files' in body
        assert len(body['files']) == 2
        assert body['count'] == 2
    
    @patch('api_handler.dynamodb')
    def test_get_file_metadata(self, mock_dynamodb):
        """Test getting specific file metadata."""
        from api_handler import handler
        
        # Mock DynamoDB table and get_item
        mock_table = MagicMock()
        mock_table.get_item.return_value = {
            'Item': {
                'fileId': 'file1',
                'fileName': 'test.jpg',
                'fileType': 'image',
                'status': 'processed',
                'bucketName': 'test-bucket'
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        # Create API Gateway event
        event = {
            'httpMethod': 'GET',
            'path': '/files/file1',
            'pathParameters': {'fileId': 'file1'},
            'queryStringParameters': {}
        }
        
        result = handler(event, None)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'file' in body
        assert body['file']['fileId'] == 'file1'
    
    @patch('api_handler.dynamodb')
    def test_get_file_status(self, mock_dynamodb):
        """Test getting file processing status."""
        from api_handler import handler
        
        # Mock DynamoDB table and get_item
        mock_table = MagicMock()
        mock_table.get_item.return_value = {
            'Item': {
                'fileId': 'file1',
                'fileName': 'test.jpg',
                'status': 'processed',
                'uploadTime': '2024-01-01T10:00:00',
                'processedTime': '2024-01-01T10:01:00'
            }
        }
        mock_dynamodb.Table.return_value = mock_table
        
        # Create API Gateway event
        event = {
            'httpMethod': 'GET',
            'path': '/files/file1/status',
            'pathParameters': {'fileId': 'file1'},
            'queryStringParameters': {}
        }
        
        result = handler(event, None)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert 'status' in body
        assert body['status']['status'] == 'processed'
    
    def test_create_error_response(self):
        """Test error response creation."""
        from api_handler import create_error_response
        
        result = create_error_response(404, 'Not found', 'File does not exist')
        
        assert result['statusCode'] == 404
        body = json.loads(result['body'])
        assert body['error'] == 'Not found'
        assert body['details'] == 'File does not exist'
    
    def test_get_cors_headers(self):
        """Test CORS headers generation."""
        from api_handler import get_cors_headers
        
        headers = get_cors_headers()
        
        assert headers['Content-Type'] == 'application/json'
        assert headers['Access-Control-Allow-Origin'] == '*'
        assert 'Access-Control-Allow-Methods' in headers
        assert 'Access-Control-Allow-Headers' in headers