"""Unit tests for Lambda functions."""
import os
import sys
import json
from unittest.mock import Mock, patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'lib', 'lambda'
))

# pylint: disable=wrong-import-position,import-error
with patch.dict('os.environ', {
    'MODERATION_TABLE': 'test-table',
    'HUMAN_REVIEW_QUEUE': 'https://sqs.us-west-1.amazonaws.com/123456789012/test-queue',
    'NOTIFICATION_TOPIC': 'arn:aws:sns:us-west-1:123456789012:test-topic',
    'CONFIDENCE_THRESHOLD': '75',
    'TOXICITY_THRESHOLD': '0.7',
    'CONTENT_BUCKET': 'test-bucket',
    'AWS_REGION': 'us-west-1'
}):
    import image_moderation
    import text_moderation
    import result_processor
# pylint: enable=wrong-import-position,import-error


class TestImageModerationLambda:
    """Test suite for Image Moderation Lambda function."""

    @patch('image_moderation.sns')
    @patch('image_moderation.sqs')
    @patch('image_moderation.dynamodb')
    @patch('image_moderation.rekognition')
    def test_image_moderation_success(self, mock_rekognition, mock_dynamodb, mock_sqs, mock_sns):
        """Test successful image moderation."""
        # Setup mocks
        mock_rekognition.detect_moderation_labels.return_value = {
            'ModerationLabels': [
                {
                    'Confidence': 80.0,
                    'Name': 'Explicit Nudity',
                    'ParentName': 'Nudity'
                }
            ]
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'contentId': 'test-content-123',
            's3Bucket': 'test-bucket',
            's3Key': 'images/test.jpg'
        }

        # Call handler
        result = image_moderation.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['contentId'] == 'test-content-123'
        assert result['requiresReview'] is True
        assert 'moderationResult' in result

        # Verify Rekognition was called
        mock_rekognition.detect_moderation_labels.assert_called_once()
        call_args = mock_rekognition.detect_moderation_labels.call_args[1]
        assert call_args['Image']['S3Object']['Bucket'] == 'test-bucket'
        assert call_args['Image']['S3Object']['Name'] == 'images/test.jpg'

        # Verify DynamoDB was called
        mock_table.put_item.assert_called_once()

        # Verify SNS was called for high confidence label
        mock_sns.publish.assert_called_once()

    @patch('image_moderation.dynamodb')
    @patch('image_moderation.rekognition')
    def test_image_moderation_no_review_needed(self, mock_rekognition, mock_dynamodb):
        """Test image moderation when no review is needed."""
        # Setup mocks
        mock_rekognition.detect_moderation_labels.return_value = {
            'ModerationLabels': [
                {
                    'Confidence': 50.0,  # Below threshold
                    'Name': 'Suggestive',
                    'ParentName': ''
                }
            ]
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'contentId': 'test-content-456',
            's3Bucket': 'test-bucket',
            's3Key': 'images/safe.jpg'
        }

        # Call handler
        result = image_moderation.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['requiresReview'] is False

        # Verify DynamoDB was called with approved status
        put_call_args = mock_table.put_item.call_args[1]['Item']
        assert put_call_args['reviewStatus'] == 'approved'

    @patch('image_moderation.rekognition')
    def test_image_moderation_error_handling(self, mock_rekognition):
        """Test error handling in image moderation."""
        # Setup mock to raise exception
        mock_rekognition.detect_moderation_labels.side_effect = Exception("Rekognition error")

        # Test event
        event = {
            'contentId': 'test-content-789',
            's3Bucket': 'test-bucket',
            's3Key': 'images/error.jpg'
        }

        # Call handler and expect exception
        try:
            image_moderation.handler(event, {})
            assert False, "Expected exception not raised"
        except Exception as e:
            assert str(e) == "Rekognition error"


class TestTextModerationLambda:
    """Test suite for Text Moderation Lambda function."""

    @patch('text_moderation.sns')
    @patch('text_moderation.sqs')
    @patch('text_moderation.dynamodb')
    @patch('text_moderation.s3')
    @patch('text_moderation.comprehend')
    def test_text_moderation_toxic_content(  # pylint: disable=too-many-positional-arguments
            self, mock_comprehend, mock_s3, mock_dynamodb, mock_sqs, mock_sns):
        """Test text moderation with toxic content."""
        # Setup mocks
        mock_s3.get_object.return_value = {
            'Body': Mock(read=Mock(return_value=b'This is toxic content'))
        }

        mock_comprehend.detect_toxic_content.return_value = {
            'ResultList': [
                {
                    'Toxicity': 0.85,
                    'Labels': [
                        {'Name': 'HATE_SPEECH', 'Score': 0.85}
                    ]
                }
            ]
        }

        mock_comprehend.detect_sentiment.return_value = {
            'Sentiment': 'NEGATIVE',
            'SentimentScore': {
                'Positive': 0.1,
                'Negative': 0.8,
                'Neutral': 0.05,
                'Mixed': 0.05
            }
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'contentId': 'test-text-123',
            's3Bucket': 'test-bucket',
            's3Key': 'text/toxic.txt'
        }

        # Call handler
        result = text_moderation.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['requiresReview'] is True

        # Verify Comprehend was called
        mock_comprehend.detect_toxic_content.assert_called_once()
        mock_comprehend.detect_sentiment.assert_called_once()

        # Verify SNS was called for toxic content
        mock_sns.publish.assert_called_once()

    @patch('text_moderation.dynamodb')
    @patch('text_moderation.s3')
    @patch('text_moderation.comprehend')
    def test_text_moderation_safe_content(self, mock_comprehend, mock_s3, mock_dynamodb):
        """Test text moderation with safe content."""
        # Setup mocks
        mock_s3.get_object.return_value = {
            'Body': Mock(read=Mock(return_value=b'This is safe content'))
        }

        mock_comprehend.detect_toxic_content.return_value = {
            'ResultList': [
                {
                    'Toxicity': 0.1,
                    'Labels': []
                }
            ]
        }

        mock_comprehend.detect_sentiment.return_value = {
            'Sentiment': 'POSITIVE',
            'SentimentScore': {
                'Positive': 0.9,
                'Negative': 0.05,
                'Neutral': 0.03,
                'Mixed': 0.02
            }
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'contentId': 'test-text-456',
            's3Bucket': 'test-bucket',
            's3Key': 'text/safe.txt'
        }

        # Call handler
        result = text_moderation.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['requiresReview'] is False

        # Verify DynamoDB was called with approved status
        put_call_args = mock_table.put_item.call_args[1]['Item']
        assert put_call_args['reviewStatus'] == 'approved'

    @patch('text_moderation.s3')
    @patch('text_moderation.comprehend')
    def test_text_moderation_long_text(self, mock_comprehend, mock_s3):
        """Test text moderation with long text (multiple segments)."""
        # Setup mocks - text longer than 1KB
        long_text = 'x' * 3000
        mock_s3.get_object.return_value = {
            'Body': Mock(read=Mock(return_value=long_text.encode()))
        }

        mock_comprehend.detect_toxic_content.return_value = {
            'ResultList': [
                {
                    'Toxicity': 0.2,
                    'Labels': []
                }
            ]
        }

        mock_comprehend.detect_sentiment.return_value = {
            'Sentiment': 'NEUTRAL',
            'SentimentScore': {}
        }

        mock_table = Mock()
        with patch('text_moderation.dynamodb') as mock_dynamodb:
            mock_dynamodb.Table.return_value = mock_table

            # Test event
            event = {
                'contentId': 'test-text-789',
                's3Bucket': 'test-bucket',
                's3Key': 'text/long.txt'
            }

            # Call handler
            result = text_moderation.handler(event, {})

            # Assertions
            assert result['statusCode'] == 200

            # Verify multiple segments were processed
            assert mock_comprehend.detect_toxic_content.call_count == 3  # 3000 chars = 3 segments


class TestResultProcessorLambda:
    """Test suite for Result Processor Lambda function."""

    @patch('result_processor.s3')
    @patch('result_processor.dynamodb')
    def test_result_processor_approved_content(self, mock_dynamodb, mock_s3):
        """Test result processor for approved content."""
        # Setup mocks
        mock_table = Mock()
        mock_table.get_item.return_value = {
            'Item': {
                'contentId': 'test-123',
                'timestamp': 1234567890,
                'reviewStatus': 'approved'
            }
        }
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'moderationResult': {
                'contentId': 'test-123',
                'timestamp': 1234567890,
                'reviewStatus': 'approved',
                's3Location': 's3://test-bucket/original/file.jpg'
            }
        }

        # Call handler
        result = result_processor.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['contentId'] == 'test-123'

        # Verify DynamoDB was updated
        mock_table.update_item.assert_called_once()

        # Verify S3 copy was called for approved content
        mock_s3.copy_object.assert_called_once()
        copy_args = mock_s3.copy_object.call_args[1]
        assert copy_args['Key'] == 'processed/original/file.jpg'

    @patch('result_processor.s3')
    @patch('result_processor.dynamodb')
    def test_result_processor_rejected_content(self, mock_dynamodb, mock_s3):
        """Test result processor for rejected content."""
        # Setup mocks
        mock_table = Mock()
        mock_table.get_item.return_value = {
            'Item': {
                'contentId': 'test-456',
                'timestamp': 1234567890,
                'reviewStatus': 'rejected'
            }
        }
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'moderationResult': {
                'contentId': 'test-456',
                'timestamp': 1234567890,
                'reviewStatus': 'rejected',
                's3Location': 's3://test-bucket/original/bad.jpg'
            }
        }

        # Call handler
        result = result_processor.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200

        # Verify S3 copy was NOT called for rejected content
        mock_s3.copy_object.assert_not_called()

    @patch('result_processor.dynamodb')
    def test_result_processor_no_s3_location(self, mock_dynamodb):
        """Test result processor when no S3 location is provided."""
        # Setup mocks
        mock_table = Mock()
        mock_table.get_item.return_value = {
            'Item': {
                'contentId': 'test-789',
                'timestamp': 1234567890
            }
        }
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'moderationResult': {
                'contentId': 'test-789',
                'timestamp': 1234567890,
                'reviewStatus': 'approved'
            }
        }

        # Call handler
        result = result_processor.handler(event, {})

        # Assertions
        assert result['statusCode'] == 200
        assert result['contentId'] == 'test-789'

    @patch('result_processor.dynamodb')
    def test_result_processor_error_handling(self, mock_dynamodb):
        """Test error handling in result processor."""
        # Setup mock to raise exception
        mock_table = Mock()
        mock_table.get_item.side_effect = Exception("DynamoDB error")
        mock_dynamodb.Table.return_value = mock_table

        # Test event
        event = {
            'moderationResult': {
                'contentId': 'test-error',
                'timestamp': 1234567890
            }
        }

        # Call handler and expect exception
        try:
            result_processor.handler(event, {})
            assert False, "Expected exception not raised"
        except Exception as e:
            assert str(e) == "DynamoDB error"
