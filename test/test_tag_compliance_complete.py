"""
Additional unit tests for Tag Compliance Validator to achieve 100% coverage
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
def test_non_compliant_resource_no_sns_topic(mock_sns, mock_config):
    """Test non-compliant resource when SNS topic ARN is not set"""
    from tag_compliance_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::S3::Bucket',
            'resourceId': 'my-bucket-no-sns',
            'tags': {},  # Missing all required tags
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-no-sns'
    }

    context = Mock()
    # Do not set SNS_TOPIC_ARN environment variable
    if 'SNS_TOPIC_ARN' in os.environ:
        del os.environ['SNS_TOPIC_ARN']

    response = lambda_handler(event, context)

    # Verify Config evaluation was submitted
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'

    # Verify SNS was NOT called (no topic ARN set)
    assert not mock_sns.publish.called

    assert response['statusCode'] == 200
