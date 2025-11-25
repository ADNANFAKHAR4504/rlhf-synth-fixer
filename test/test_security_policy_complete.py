"""
Additional unit tests for Security Policy Validator to achieve 100% coverage
"""
import json
import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add lib/lambda to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.ssm')
@patch('security_policy_validator.sns')
def test_ec2_ami_validation_ssm_exception(mock_sns, mock_ssm, mock_config):
    """Test EC2 instance when SSM parameter fetch fails"""
    from security_policy_validator import lambda_handler

    # Mock SSM exception
    mock_ssm.get_parameter.side_effect = Exception('Parameter not found')

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::Instance',
            'resourceId': 'i-test-no-ssm',
            'configuration': {
                'imageId': 'ami-unknown'
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-ssm-error'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    response = lambda_handler(event, context)

    # Should still work even if SSM fails (graceful degradation)
    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_security_group_with_allowed_access(mock_sns, mock_config):
    """Test security group with restricted access is marked as COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::SecurityGroup',
            'resourceId': 'sg-secure123',
            'configuration': {
                'ipPermissions': [
                    {
                        'ipProtocol': 'tcp',
                        'fromPort': 443,
                        'toPort': 443,
                        'ipRanges': [
                            {'cidrIp': '10.0.0.0/16'}  # Private network, not 0.0.0.0/0
                        ]
                    }
                ]
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-secure-sg'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'COMPLIANT'
    assert 'No security policy violations' in evaluation['Annotation']

    # Verify SNS was NOT called
    assert not mock_sns.publish.called

    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_s3_bucket_with_encryption(mock_sns, mock_config):
    """Test S3 bucket with encryption is marked as COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::S3::Bucket',
            'resourceId': 'my-secure-bucket',
            'configuration': {
                'serverSideEncryptionConfiguration': {
                    'rules': [
                        {
                            'applyServerSideEncryptionByDefault': {
                                'sseAlgorithm': 'AES256'
                            }
                        }
                    ]
                },
                'publicAccessBlockConfiguration': {
                    'blockPublicAcls': True,
                    'blockPublicPolicy': True,
                    'ignorePublicAcls': True,
                    'restrictPublicBuckets': True
                }
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-secure-s3'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'COMPLIANT'
    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_other_resource_types(mock_sns, mock_config):
    """Test that other resource types (not EC2, SG, or S3) are processed"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::Lambda::Function',
            'resourceId': 'my-function',
            'configuration': {
                'runtime': 'python3.9'
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-lambda'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Should be marked as compliant since no checks apply
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'COMPLIANT'
    assert response['statusCode'] == 200
