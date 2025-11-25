"""
Unit tests for Security Policy Validator Lambda function
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
def test_ec2_instance_with_approved_ami(mock_sns, mock_ssm, mock_config):
    """Test EC2 instance using approved AMI is marked as COMPLIANT"""
    from security_policy_validator import lambda_handler

    # Mock SSM Parameter Store response
    mock_ssm.get_parameter.return_value = {
        'Parameter': {
            'Value': '["ami-12345678", "ami-87654321"]'
        }
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::Instance',
            'resourceId': 'i-1234567890abcdef0',
            'configuration': {
                'imageId': 'ami-12345678'
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-123'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'

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
@patch('security_policy_validator.ssm')
@patch('security_policy_validator.sns')
def test_ec2_instance_with_unapproved_ami(mock_sns, mock_ssm, mock_config):
    """Test EC2 instance using unapproved AMI is marked as NON_COMPLIANT"""
    from security_policy_validator import lambda_handler

    # Mock SSM Parameter Store response
    mock_ssm.get_parameter.return_value = {
        'Parameter': {
            'Value': '["ami-12345678", "ami-87654321"]'
        }
    }

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::Instance',
            'resourceId': 'i-badinstance123',
            'configuration': {
                'imageId': 'ami-99999999'  # Not in approved list
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-456'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'ami-99999999' in evaluation['Annotation']
    assert 'not in approved list' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called

    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_security_group_with_unrestricted_access(mock_sns, mock_config):
    """Test security group allowing 0.0.0.0/0 is marked as NON_COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::EC2::SecurityGroup',
            'resourceId': 'sg-insecure123',
            'configuration': {
                'ipPermissions': [
                    {
                        'ipProtocol': 'tcp',
                        'fromPort': 22,
                        'toPort': 22,
                        'ipRanges': [
                            {'cidrIp': '0.0.0.0/0'}
                        ]
                    }
                ]
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-789'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert '0.0.0.0/0' in evaluation['Annotation']
    assert 'unrestricted access' in evaluation['Annotation']

    # Verify SNS notification was sent
    assert mock_sns.publish.called

    assert response['statusCode'] == 200


@patch('security_policy_validator.config_client')
@patch('security_policy_validator.sns')
def test_s3_bucket_without_encryption(mock_sns, mock_config):
    """Test S3 bucket without encryption is marked as NON_COMPLIANT"""
    from security_policy_validator import lambda_handler

    event = {
        'configurationItem': json.dumps({
            'resourceType': 'AWS::S3::Bucket',
            'resourceId': 'my-insecure-bucket',
            'configuration': {
                'serverSideEncryptionConfiguration': None,
                'publicAccessBlockConfiguration': {
                    'blockPublicAcls': True,
                    'blockPublicPolicy': True,
                    'ignorePublicAcls': True,
                    'restrictPublicBuckets': True
                }
            },
            'configurationItemCaptureTime': '2025-01-01T00:00:00.000Z'
        }),
        'resultToken': 'test-token-abc'
    }

    context = Mock()
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

    response = lambda_handler(event, context)

    # Verify Config evaluation
    assert mock_config.put_evaluations.called
    call_args = mock_config.put_evaluations.call_args
    evaluation = call_args[1]['Evaluations'][0]

    assert evaluation['ComplianceType'] == 'NON_COMPLIANT'
    assert 'encryption' in evaluation['Annotation'].lower()

    # Verify SNS notification was sent
    assert mock_sns.publish.called

    assert response['statusCode'] == 200
