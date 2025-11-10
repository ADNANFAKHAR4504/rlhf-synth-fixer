"""Unit tests for compute.py"""
from unittest.mock import Mock, patch

import pytest

from lib.compute import ComputeStack


@pytest.fixture
def mock_outputs():
    """Create mock Pulumi outputs"""
    return {
        'vpc_id': Mock(return_value='vpc-12345'),
        'private_subnet_ids': [Mock(return_value='subnet-12345')],
        'lambda_security_group_id': Mock(return_value='sg-12345'),
        'dynamodb_table_name': Mock(return_value='test-table'),
        'dynamodb_table_arn': Mock(return_value='arn:aws:dynamodb:region:account:table/test-table'),
        'rds_endpoint': Mock(return_value='test-db.cluster-123.region.rds.amazonaws.com')
    }

@pytest.fixture
def mock_tags():
    """Create mock tags"""
    return {
        'Environment': 'test',
        'Project': 'tap'
    }

@patch('pulumi_aws.iam.Role')
@patch('pulumi_aws.iam.RolePolicyAttachment')
def test_compute_stack_creates_lambda_role(mock_policy_attachment, mock_role, mock_outputs, mock_tags):
    """Test that ComputeStack creates IAM role for Lambda"""
    compute = ComputeStack(
        name='test-compute',
        environment='test',
        environment_suffix='dev',
        vpc_id=mock_outputs['vpc_id'],
        private_subnet_ids=mock_outputs['private_subnet_ids'],
        lambda_security_group_id=mock_outputs['lambda_security_group_id'],
        dynamodb_table_name=mock_outputs['dynamodb_table_name'],
        dynamodb_table_arn=mock_outputs['dynamodb_table_arn'],
        rds_endpoint=mock_outputs['rds_endpoint'],
        tags=mock_tags
    )

    mock_role.assert_called_once()
    mock_policy_attachment.assert_called_once()
