"""Unit tests for quiz_processor Lambda function."""
import json
import os
import sys
import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch, call
import pytest

# Add the lib directory to the path to import the Lambda functions
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../lib')))


class TestQuizProcessor(unittest.TestCase):
    """Test cases for the quiz processor Lambda function."""

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE_NAME': 'test-quiz-results',
        'AWS_XRAY_TRACING_NAME': 'test-quiz-processor'
    })
    @patch('boto3.resource')
    @patch('aws_xray_sdk.core.patch_all')
    def setUp(self, mock_patch_all, mock_resource):
        """Set up test environment."""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_resource.return_value = mock_dynamodb

        # Import after mocking
        from quiz_processor import lambda_handler, process_quiz, calculate_score
        self.lambda_handler = lambda_handler
        self.process_quiz = process_quiz
        self.calculate_score = calculate_score
        self.mock_table = mock_table

    def tearDown(self):
        """Clean up after tests."""
        pass  # Cleanup handled by decorators

    def test_calculate_score_all_correct(self):
        """Test score calculation when all answers are correct."""
        student_answers = {
            'q1': 'a',
            'q2': 'b',
            'q3': 'c'
        }
        correct_answers = {
            'q1': 'a',
            'q2': 'b',
            'q3': 'c'
        }
        score = self.calculate_score(student_answers, correct_answers)
        self.assertEqual(score, 100.0)

    def test_calculate_score_partial_correct(self):
        """Test score calculation with partial correct answers."""
        student_answers = {
            'q1': 'a',
            'q2': 'b',
            'q3': 'd'
        }
        correct_answers = {
            'q1': 'a',
            'q2': 'b',
            'q3': 'c'
        }
        score = self.calculate_score(student_answers, correct_answers)
        self.assertAlmostEqual(score, 66.67, places=2)

    def test_calculate_score_none_correct(self):
        """Test score calculation when no answers are correct."""
        student_answers = {
            'q1': 'd',
            'q2': 'd',
            'q3': 'd'
        }
        correct_answers = {
            'q1': 'a',
            'q2': 'b',
            'q3': 'c'
        }
        score = self.calculate_score(student_answers, correct_answers)
        self.assertEqual(score, 0.0)

    def test_calculate_score_empty_correct_answers(self):
        """Test score calculation with no correct answers provided."""
        student_answers = {'q1': 'a'}
        correct_answers = {}
        score = self.calculate_score(student_answers, correct_answers)
        self.assertEqual(score, 0)

    def test_process_quiz_success(self):
        """Test successful quiz processing."""
        # Test data
        quiz_data = {
            'student_id': 'student123',
            'quiz_id': 'quiz456',
            'answers': {'q1': 'a', 'q2': 'b'},
            'correct_answers': {'q1': 'a', 'q2': 'b'}
        }

        # Call the function
        with patch('quiz_processor.datetime') as mock_datetime:
            mock_now = datetime(2024, 1, 1, 12, 0, 0)
            mock_datetime.utcnow.return_value = mock_now

            result = self.process_quiz(quiz_data)

            # Verify DynamoDB was called
            self.mock_table.put_item.assert_called_once()

            # Verify the result
            self.assertEqual(result['student_id'], 'student123')
            self.assertEqual(result['quiz_id'], 'quiz456')
            self.assertEqual(result['score'], 100.0)
            self.assertEqual(result['total_questions'], 2)
            self.assertEqual(result['status'], 'completed')

    def test_process_quiz_missing_student_id(self):
        """Test quiz processing with missing student_id."""
        quiz_data = {
            'quiz_id': 'quiz456',
            'answers': {'q1': 'a'},
            'correct_answers': {'q1': 'a'}
        }

        with self.assertRaises(KeyError):
            self.process_quiz(quiz_data)

    def test_process_quiz_dynamodb_error(self):
        """Test quiz processing when DynamoDB fails."""
        # Mock DynamoDB error
        self.mock_table.put_item.side_effect = Exception("DynamoDB error")

        quiz_data = {
            'student_id': 'student123',
            'quiz_id': 'quiz456',
            'answers': {'q1': 'a'},
            'correct_answers': {'q1': 'a'}
        }

        with self.assertRaises(Exception) as context:
            self.process_quiz(quiz_data)

        self.assertIn("DynamoDB error", str(context.exception))

    @patch('quiz_processor.process_quiz')
    def test_lambda_handler_success(self, mock_process_quiz):
        """Test successful Lambda handler execution."""
        # Mock process_quiz
        mock_process_quiz.return_value = {
            'student_id': 'student123',
            'score': 100
        }

        # Test event
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'student_id': 'student123',
                        'quiz_id': 'quiz456',
                        'answers': {'q1': 'a'},
                        'correct_answers': {'q1': 'a'}
                    })
                }
            ]
        }

        # Call handler
        result = self.lambda_handler(event, None)

        # Verify result
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['processed'], 1)
        self.assertEqual(body['failed'], 0)

    @patch('quiz_processor.process_quiz')
    def test_lambda_handler_invalid_json(self, mock_process_quiz):
        """Test Lambda handler with invalid JSON in message."""
        event = {
            'Records': [
                {
                    'body': 'invalid json'
                }
            ]
        }

        with self.assertRaises(json.JSONDecodeError):
            self.lambda_handler(event, None)

    @patch('quiz_processor.process_quiz')
    def test_lambda_handler_multiple_messages(self, mock_process_quiz):
        """Test Lambda handler with multiple messages."""
        # Mock process_quiz
        mock_process_quiz.return_value = {'student_id': 'student', 'score': 100}

        # Test event with multiple records
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'student_id': f'student{i}',
                        'quiz_id': f'quiz{i}',
                        'answers': {'q1': 'a'},
                        'correct_answers': {'q1': 'a'}
                    })
                } for i in range(3)
            ]
        }

        # Call handler
        result = self.lambda_handler(event, None)

        # Verify result
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['processed'], 3)
        self.assertEqual(body['failed'], 0)

        # Verify process_quiz was called 3 times
        self.assertEqual(mock_process_quiz.call_count, 3)

    @patch('quiz_processor.process_quiz')
    def test_lambda_handler_partial_batch_failure(self, mock_process_quiz):
        """Test Lambda handler with some messages failing."""
        # Mock process_quiz to fail on second call
        mock_process_quiz.side_effect = [
            {'student_id': 'student1', 'score': 100},
            Exception("Processing error"),
            {'student_id': 'student3', 'score': 90}
        ]

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'student_id': f'student{i}',
                        'quiz_id': f'quiz{i}',
                        'answers': {'q1': 'a'},
                        'correct_answers': {'q1': 'a'}
                    })
                } for i in range(3)
            ]
        }

        # The handler should raise an exception due to the failure
        with self.assertRaises(Exception) as context:
            self.lambda_handler(event, None)

        self.assertIn("Processing error", str(context.exception))


if __name__ == '__main__':
    unittest.main()