"""
Additional unit tests for Drift Detection Validator to achieve 100% coverage
"""
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add lib/lambda to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))


@patch('drift_detection_validator.cfn')
@patch('drift_detection_validator.config_client')
def test_drift_detection_failed(mock_config, mock_cfn):
    """Test that drift detection failure is handled properly"""
    from drift_detection_validator import lambda_handler

    # Mock drift detection failure
    mock_cfn.detect_stack_drift.return_value = {
        'StackDriftDetectionId': 'drift-id-failed'
    }
    mock_cfn.describe_stack_drift_detection_status.return_value = {
        'DetectionStatus': 'DETECTION_FAILED',
        'Timestamp': '2025-01-01T00:00:00.000Z'
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'my-failed-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-failed'
    }

    context = Mock()

    response = lambda_handler(event, context)

    assert response['statusCode'] == 500
    assert 'Drift detection failed' in response['body']


@patch('drift_detection_validator.cfn')
@patch('drift_detection_validator.time')
def test_drift_detection_timeout(mock_time, mock_cfn):
    """Test that drift detection timeout is handled"""
    from drift_detection_validator import lambda_handler

    # Mock drift detection that never completes
    mock_cfn.detect_stack_drift.return_value = {
        'StackDriftDetectionId': 'drift-id-timeout'
    }
    mock_cfn.describe_stack_drift_detection_status.return_value = {
        'DetectionStatus': 'DETECTION_IN_PROGRESS',
        'Timestamp': '2025-01-01T00:00:00.000Z'
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'my-timeout-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-timeout'
    }

    context = Mock()

    response = lambda_handler(event, context)

    assert response['statusCode'] == 500
    assert 'Drift detection timed out' in response['body']


@patch('drift_detection_validator.cfn')
def test_validation_error_handling(mock_cfn):
    """Test ClientError ValidationError handling"""
    from drift_detection_validator import lambda_handler

    # Mock ValidationError
    error = Exception('ValidationError')
    error.response = {'Error': {'Code': 'ValidationError', 'Message': 'Stack does not exist'}}
    mock_cfn.detect_stack_drift.side_effect = error

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'non-existent-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-error'
    }

    context = Mock()

    response = lambda_handler(event, context)

    assert response['statusCode'] == 200
    assert 'does not support drift detection' in response['body']


@patch('drift_detection_validator.cfn')
def test_generic_exception_handling(mock_cfn):
    """Test generic exception handling"""
    from drift_detection_validator import lambda_handler

    # Mock generic exception
    mock_cfn.detect_stack_drift.side_effect = Exception('Unknown error')

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'error-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-generic-error'
    }

    context = Mock()

    response = lambda_handler(event, context)

    assert response['statusCode'] == 500
    assert 'Unknown error' in response['body']
