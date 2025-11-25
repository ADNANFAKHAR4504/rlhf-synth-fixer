"""
Unit tests for Tag Compliance Validator Lambda function
"""
import json
import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add lib/lambda to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))


@patch('tag_compliance_validator.config')
@patch('tag_compliance_validator.sns')
def test_compliant_resource_with_all_tags(mock_sns, mock_config):
    """Test that a resource with all required tags is marked as COMPLIANT"""
    from tag_compliance_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::Instance',
            'resourceId': 'i-1234567890abcdef0',
            'tags': {
                'Environment': 'prod',
                'Owner': 'security-team',
                'CostCenter': 'CC-12345'
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-123'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation was submitted
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'COMPLIANT'
    assert 'All required tags present' in evaluation['Annotation']

    # Verify SNS was NOT called for compliant resource
    assert not mock_sns.publish.called

    assert response['statusCode'] == 200


@patch('tag_compliance_validator.config')
@patch('tag_compliance_validator.sns')
def test_non_compliant_resource_missing_tags(mock_sns, mock_config):
    """Test that a resource missing required tags is marked as NON_COMPLIANT"""
    from tag_compliance_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::S3::Bucket',
            'resourceId': 'my-test-bucket',
            'tags': {
                'Environment': 'dev'
                # Missing Owner and CostCenter
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-456'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'Owner' in evaluation['Annotation']
    assert 'CostCenter' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called
    sns_call_args = mock_sns.publish.call_args
    assert 'Non-Compliant' in sns_call_args[1]['Subject']

    assert response['statusCode'] == 200


@patch('tag_compliance_validator.config')
@patch('tag_compliance_validator.sns')
def test_resource_with_no_tags(mock_sns, mock_config):
    """Test resource with no tags at all"""
    from tag_compliance_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::Lambda::Function',
            'resourceId': 'my-function',
            'tags': {},
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-789'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify all three tags are reported as missing
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'Environment' in evaluation['Annotation']
    assert 'Owner' in evaluation['Annotation']
    assert 'CostCenter' in evaluation['Annotation']

    assert response['statusCode'] == 200
