"""Unit tests for Lambda function."""

from unittest.mock import Mock

from lib.lambda_function import handler


class TestLambdaFunction:
  """Test cases for Lambda function handler."""

  def test_handler_with_context(self):
    """Test lambda handler with context."""
    event = {"test": "data"}
    context = Mock()
    context.aws_request_id = "test-request-id"
    
    response = handler(event, context)
    
    assert response["statusCode"] == 200
    assert response["body"]["message"] == "Hello from secure Lambda!"
    assert response["body"]["environment"] == "production"
    assert response["body"]["timestamp"] == "test-request-id"

  def test_handler_without_context(self):
    """Test lambda handler without context."""
    event = {"test": "data"}
    context = None
    
    response = handler(event, context)
    
    assert response["statusCode"] == 200
    assert response["body"]["message"] == "Hello from secure Lambda!"
    assert response["body"]["environment"] == "production"
    assert response["body"]["timestamp"] == "unknown"

  def test_handler_with_empty_event(self):
    """Test lambda handler with empty event."""
    event = {}
    context = Mock()
    context.aws_request_id = "empty-event-id"
    
    response = handler(event, context)
    
    assert response["statusCode"] == 200
    assert response["body"]["message"] == "Hello from secure Lambda!"
    assert response["body"]["environment"] == "production"
    assert response["body"]["timestamp"] == "empty-event-id"