"""
Unit tests for validation Lambda function
Achieves 100% code coverage for all functions and branches
"""
import unittest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import sys

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))

import validation


class TestValidationHandler(unittest.TestCase):
    """Test cases for main handler function"""

    def setUp(self):
        """Set up test fixtures"""
        os.environ['SOURCE_BUCKET'] = 'test-source-bucket'
        os.environ['TARGET_BUCKET'] = 'test-target-bucket'
        os.environ['METADATA_TABLE'] = 'test-metadata-table'

    @patch('validation.publish_validation_metrics')
    @patch('validation.validate_document')
    @patch('validation.get_sample_documents')
    def test_handler_all_consistent(self, mock_get_docs, mock_validate, mock_publish):
        """Test handler when all documents are consistent"""
        mock_get_docs.return_value = ['doc1.pdf', 'doc2.pdf']
        mock_validate.side_effect = [
            {'key': 'doc1.pdf', 'consistent': True, 'reason': 'Match'},
            {'key': 'doc2.pdf', 'consistent': True, 'reason': 'Match'}
        ]
        mock_publish.return_value = None

        event = {}
        context = Mock()
        result = validation.handler(event, context)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['documents_validated'], 2)
        self.assertEqual(len(body['inconsistencies']), 0)
        self.assertTrue(body['validation_passed'])

    @patch('validation.publish_validation_metrics')
    @patch('validation.validate_document')
    @patch('validation.get_sample_documents')
    def test_handler_with_inconsistencies(self, mock_get_docs, mock_validate, mock_publish):
        """Test handler when inconsistencies are found"""
        mock_get_docs.return_value = ['doc1.pdf', 'doc2.pdf']
        mock_validate.side_effect = [
            {'key': 'doc1.pdf', 'consistent': True, 'reason': 'Match'},
            {'key': 'doc2.pdf', 'consistent': False, 'reason': 'ETag mismatch'}
        ]
        mock_publish.return_value = None

        event = {}
        context = Mock()
        result = validation.handler(event, context)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['documents_validated'], 2)
        self.assertEqual(len(body['inconsistencies']), 1)
        self.assertFalse(body['validation_passed'])
        self.assertEqual(body['inconsistencies'][0]['key'], 'doc2.pdf')

    @patch('validation.publish_validation_metrics')
    @patch('validation.validate_document')
    @patch('validation.get_sample_documents')
    def test_handler_no_documents(self, mock_get_docs, mock_validate, mock_publish):
        """Test handler when no documents are found"""
        mock_get_docs.return_value = []
        mock_publish.return_value = None

        event = {}
        context = Mock()
        result = validation.handler(event, context)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['documents_validated'], 0)
        self.assertEqual(len(body['inconsistencies']), 0)
        self.assertTrue(body['validation_passed'])

    @patch('validation.get_sample_documents')
    def test_handler_exception_handling(self, mock_get_docs):
        """Test handler exception handling"""
        mock_get_docs.side_effect = Exception('S3 error')

        event = {}
        context = Mock()
        result = validation.handler(event, context)

        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertIn('error', body)
        self.assertIn('S3 error', body['error'])


class TestGetSampleDocuments(unittest.TestCase):
    """Test cases for get_sample_documents function"""

    def setUp(self):
        """Set up test fixtures"""
        os.environ['SOURCE_BUCKET'] = 'test-source-bucket'

    @patch('validation.s3_client')
    def test_get_sample_documents_success(self, mock_s3):
        """Test successful retrieval of sample documents"""
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'doc{i}.pdf'} for i in range(1, 21)
            ]
        }

        result = validation.get_sample_documents()

        self.assertEqual(len(result), 10)
        self.assertEqual(result[0], 'doc1.pdf')
        self.assertEqual(result[9], 'doc10.pdf')
        self.assertEqual(mock_s3.list_objects_v2.call_count, 1)

    @patch('validation.s3_client')
    def test_get_sample_documents_empty_bucket(self, mock_s3):
        """Test when bucket is empty"""
        mock_s3.list_objects_v2.return_value = {}

        result = validation.get_sample_documents()

        self.assertEqual(len(result), 0)

    @patch('validation.s3_client')
    def test_get_sample_documents_less_than_10(self, mock_s3):
        """Test when bucket has less than 10 documents"""
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'doc{i}.pdf'} for i in range(1, 6)
            ]
        }

        result = validation.get_sample_documents()

        self.assertEqual(len(result), 5)

    @patch('validation.s3_client')
    def test_get_sample_documents_exception(self, mock_s3):
        """Test exception handling in get_sample_documents"""
        mock_s3.list_objects_v2.side_effect = Exception('S3 list error')

        result = validation.get_sample_documents()

        self.assertEqual(len(result), 0)


class TestValidateDocument(unittest.TestCase):
    """Test cases for validate_document function"""

    def setUp(self):
        """Set up test fixtures"""
        os.environ['SOURCE_BUCKET'] = 'test-source-bucket'
        os.environ['TARGET_BUCKET'] = 'test-target-bucket'

    @patch('validation.s3_client')
    def test_validate_document_consistent(self, mock_s3):
        """Test validation when document is consistent"""
        mock_s3.head_object.side_effect = [
            {'ETag': '"abc123"'},  # Source
            {'ETag': '"abc123"'}   # Target
        ]

        result = validation.validate_document('test.pdf')

        self.assertEqual(result['key'], 'test.pdf')
        self.assertTrue(result['consistent'])
        self.assertEqual(result['reason'], 'Match')
        self.assertEqual(mock_s3.head_object.call_count, 2)

    @patch('validation.s3_client')
    def test_validate_document_etag_mismatch(self, mock_s3):
        """Test validation when ETags don't match"""
        mock_s3.head_object.side_effect = [
            {'ETag': '"abc123"'},  # Source
            {'ETag': '"xyz789"'}   # Target
        ]

        result = validation.validate_document('test.pdf')

        self.assertEqual(result['key'], 'test.pdf')
        self.assertFalse(result['consistent'])
        self.assertEqual(result['reason'], 'ETag mismatch')

    @patch('validation.s3_client')
    def test_validate_document_not_replicated(self, mock_s3):
        """Test validation when document is not replicated to target"""
        # Create a mock NoSuchKey exception
        no_such_key_error = type('NoSuchKey', (Exception,), {})()
        mock_s3.exceptions.NoSuchKey = no_such_key_error.__class__

        mock_s3.head_object.side_effect = [
            {'ETag': '"abc123"'},  # Source
            no_such_key_error  # Target
        ]

        result = validation.validate_document('test.pdf')

        self.assertEqual(result['key'], 'test.pdf')
        self.assertFalse(result['consistent'])
        self.assertEqual(result['reason'], 'Document not replicated to target')

    @patch('validation.s3_client')
    def test_validate_document_missing_etag(self, mock_s3):
        """Test validation when ETag is missing"""
        mock_s3.head_object.side_effect = [
            {},  # Source without ETag
            {}   # Target without ETag
        ]

        result = validation.validate_document('test.pdf')

        self.assertEqual(result['key'], 'test.pdf')
        self.assertTrue(result['consistent'])  # Both have empty ETags

    @patch('validation.s3_client')
    def test_validate_document_source_error(self, mock_s3):
        """Test validation when source object check fails"""
        mock_s3.head_object.side_effect = Exception('S3 error')

        result = validation.validate_document('test.pdf')

        self.assertEqual(result['key'], 'test.pdf')
        self.assertFalse(result['consistent'])
        self.assertIn('Validation error', result['reason'])


class TestPublishValidationMetrics(unittest.TestCase):
    """Test cases for publish_validation_metrics function"""

    @patch('validation.cloudwatch')
    def test_publish_metrics_success_with_passed(self, mock_cloudwatch):
        """Test successful metrics publishing with validation passed"""
        mock_cloudwatch.put_metric_data = Mock()

        results = {
            'documents_validated': 10,
            'inconsistencies': [],
            'validation_passed': True
        }

        validation.publish_validation_metrics(results)

        mock_cloudwatch.put_metric_data.assert_called_once()
        call_args = mock_cloudwatch.put_metric_data.call_args
        metric_data = call_args[1]['MetricData']

        self.assertEqual(len(metric_data), 3)
        self.assertEqual(metric_data[0]['MetricName'], 'DocumentsValidated')
        self.assertEqual(metric_data[0]['Value'], 10)
        self.assertEqual(metric_data[1]['MetricName'], 'InconsistenciesFound')
        self.assertEqual(metric_data[1]['Value'], 0)
        self.assertEqual(metric_data[2]['MetricName'], 'ValidationPassed')
        self.assertEqual(metric_data[2]['Value'], 1)

    @patch('validation.cloudwatch')
    def test_publish_metrics_success_with_failed(self, mock_cloudwatch):
        """Test successful metrics publishing with validation failed"""
        mock_cloudwatch.put_metric_data = Mock()

        results = {
            'documents_validated': 5,
            'inconsistencies': ['error1', 'error2'],
            'validation_passed': False
        }

        validation.publish_validation_metrics(results)

        mock_cloudwatch.put_metric_data.assert_called_once()
        call_args = mock_cloudwatch.put_metric_data.call_args
        metric_data = call_args[1]['MetricData']

        self.assertEqual(metric_data[1]['Value'], 2)
        self.assertEqual(metric_data[2]['Value'], 0)

    @patch('validation.cloudwatch')
    def test_publish_metrics_failure(self, mock_cloudwatch):
        """Test metrics publishing failure"""
        mock_cloudwatch.put_metric_data.side_effect = Exception('CloudWatch error')

        results = {
            'documents_validated': 0,
            'inconsistencies': [],
            'validation_passed': True
        }

        # Should not raise exception, just log
        validation.publish_validation_metrics(results)


class TestEnvironmentVariables(unittest.TestCase):
    """Test environment variable handling"""

    def test_environment_variables_present(self):
        """Test all required environment variables are accessed"""
        os.environ['SOURCE_BUCKET'] = 'test-source'
        os.environ['TARGET_BUCKET'] = 'test-target'
        os.environ['METADATA_TABLE'] = 'test-table'

        # Reload module to pick up env vars
        import importlib
        importlib.reload(validation)

        self.assertEqual(validation.SOURCE_BUCKET, 'test-source')
        self.assertEqual(validation.TARGET_BUCKET, 'test-target')
        self.assertEqual(validation.METADATA_TABLE, 'test-table')


if __name__ == '__main__':
    unittest.main()
