"""
Unit tests for Drift Detection Validator Lambda function
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
@patch('drift_detection_validator.sns')
@patch('drift_detection_validator.s3')
def test_stack_in_sync_no_drift(mock_s3, mock_sns, mock_config, mock_cfn):
    """Test CloudFormation stack with no drift is marked as COMPLIANT"""
    from drift_detection_validator import lambda_handler

    # Mock drift detection responses
    mock_cfn.detect_stack_drift.return_value = {
        'StackDriftDetectionId': 'drift-id-123'
    }
    mock_cfn.describe_stack_drift_detection_status.return_value = {
        'DetectionStatus': 'DETECTION_COMPLETE',
        'StackDriftStatus': 'IN_SYNC',
        'Timestamp': '2025-01-01T00:00:00.000Z'
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'my-test-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-123'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['REPORTS_BUCKET'] = 'compliance-reports-test'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'COMPLIANT'
    assert 'IN_SYNC' in evaluation['Annotation']

    # Verify SNS was NOT called for compliant stack
    assert not mock_sns.publish.called
    # Verify S3 report was NOT created
    assert not mock_s3.put_object.called

    assert response['statusCode'] == 200


@patch('drift_detection_validator.cfn')
@patch('drift_detection_validator.config_client')
@patch('drift_detection_validator.sns')
@patch('drift_detection_validator.s3')
def test_stack_with_drift(mock_s3, mock_sns, mock_config, mock_cfn):
    """Test CloudFormation stack with drift is marked as NON_COMPLIANT"""
    from drift_detection_validator import lambda_handler

    # Mock drift detection responses
    mock_cfn.detect_stack_drift.return_value = {
        'StackDriftDetectionId': 'drift-id-456'
    }
    mock_cfn.describe_stack_drift_detection_status.return_value = {
        'DetectionStatus': 'DETECTION_COMPLETE',
        'StackDriftStatus': 'DRIFTED',
        'Timestamp': '2025-01-01T00:00:00.000Z'
    }
    mock_cfn.describe_stack_resource_drifts.return_value = {
        'StackResourceDrifts': [
            {
                'StackResourceDriftStatus': 'MODIFIED',
                'LogicalResourceId': 'MyBucket',
                'ResourceType': 'AWS::S3::Bucket'
            }
        ]
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::CloudFormation::Stack',
            'resourceId': 'my-drifted-stack',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-456'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['REPORTS_BUCKET'] = 'compliance-reports-test'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'DRIFTED' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called
    sns_call_args = mock_sns.publish.call_args
    assert 'Drift Detected' in sns_call_args[1]['Subject']

    # Verify S3 drift report was created
    assert mock_s3.put_object.called
    s3_call_args = mock_s3.put_object.call_args
    assert s3_call_args[1]['Bucket'] == 'compliance-reports-test'
    assert 'drift-reports/' in s3_call_args[1]['Key']

    assert response['statusCode'] == 200


@patch('drift_detection_validator.cfn')
def test_non_cloudformation_resource(mock_cfn):
    """Test that non-CloudFormation resources are skipped"""
    from drift_detection_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::Instance',
            'resourceId': 'i-1234567890abcdef0',
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-789'
    }

    context = Mock()

    response = lambda_handler(event, context)

    # Verify drift detection was NOT initiated
    assert not mock_cfn.detect_stack_drift.called

    assert response['statusCode'] == 200
    assert 'Not a CloudFormation stack' in response['body']
