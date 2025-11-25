"""
Edge case unit tests for Security Policy Validator to achieve 100% coverage
"""
import json
import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add lib/lambda to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_security_group_with_ipv6_unrestricted_access(mock_sns, mock_config):
    """Test security group allowing ::/0 (IPv6) is marked as NON_COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::SecurityGroup',
            'resourceId': 'sg-ipv6-insecure',
            'configuration': {
                'ipPermissions': [
                    {
                        'ipProtocol': 'tcp',
                        'fromPort': 443,
                        'toPort': 443,
                        'ipv6Ranges': [
                            {'cidrIpv6': '::/0'}  # Unrestricted IPv6 access
                        ]
                    }
                ]
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-ipv6-sg'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert '::/0' in evaluation['Annotation']
    assert 'unrestricted IPv6 access' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called

    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_s3_bucket_without_public_access_blocks(mock_sns, mock_config):
    """Test S3 bucket without all public access blocks is marked as NON_COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::S3::Bucket',
            'resourceId': 'my-public-bucket',
            'configuration': {
                'serverSideEncryptionConfiguration': {
                    'rules': [{'applyServerSideEncryptionByDefault': {'sseAlgorithm': 'AES256'}}]
                },
                'publicAccessBlockConfiguration': {
                    'blockPublicAcls': True,
                    'blockPublicPolicy': False,  # Missing this block
                    'ignorePublicAcls': True,
                    'restrictPublicBuckets': True
                }
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-public-s3'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'public access blocks' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called

    assert response['statusCode'] == 200
