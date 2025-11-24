"""
Unit tests for deployment and validation scripts.
Tests all functions and code paths to achieve 100% coverage.
"""
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open
import os

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import validate_template
import deploy_stack


class TestValidateTemplate(unittest.TestCase):
    """Tests for validate_template.py script."""

    def setUp(self):
        """Set up test fixtures."""
        self.valid_template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Test template",
            "Resources": {
                "TestResource": {
                    "Type": "AWS::S3::Bucket"
                }
            },
            "Parameters": {"TestParam": {"Type": "String"}},
            "Outputs": {"TestOutput": {"Value": "test"}}
        }

    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_validate_template_success(self, mock_exists, mock_file):
        """Test successful template validation."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.valid_template)

        with patch('json.load', return_value=self.valid_template):
            result = validate_template.validate_template()
            self.assertTrue(result)

    @patch('pathlib.Path.exists')
    def test_validate_template_file_not_found(self, mock_exists):
        """Test validation with missing template file."""
        mock_exists.return_value = False

        with self.assertRaises(SystemExit) as cm:
            validate_template.validate_template()
        self.assertEqual(cm.exception.code, 1)

    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_validate_template_invalid_json(self, mock_exists, mock_file):
        """Test validation with invalid JSON."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = "invalid json {"

        with patch('json.load', side_effect=json.JSONDecodeError("test", "test", 0)):
            with self.assertRaises(SystemExit) as cm:
                validate_template.validate_template()
            self.assertEqual(cm.exception.code, 1)

    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_validate_template_missing_required_keys(self, mock_exists, mock_file):
        """Test validation with missing required keys."""
        mock_exists.return_value = True
        incomplete_template = {"Resources": {}}

        with patch('json.load', return_value=incomplete_template):
            with self.assertRaises(SystemExit) as cm:
                validate_template.validate_template()
            self.assertEqual(cm.exception.code, 1)

    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_validate_template_no_resources(self, mock_exists, mock_file):
        """Test validation with no resources."""
        mock_exists.return_value = True
        template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Test",
            "Resources": {}
        }

        with patch('json.load', return_value=template):
            with self.assertRaises(SystemExit) as cm:
                validate_template.validate_template()
            self.assertEqual(cm.exception.code, 1)

    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_validate_template_general_exception(self, mock_exists, mock_file):
        """Test validation with general exception."""
        mock_exists.return_value = True

        with patch('json.load', side_effect=Exception("Test error")):
            with self.assertRaises(SystemExit) as cm:
                validate_template.validate_template()
            self.assertEqual(cm.exception.code, 1)


class TestDeployStack(unittest.TestCase):
    """Tests for deploy_stack.py script."""

    def test_get_environment_suffix_from_env(self):
        """Test getting environment suffix from environment variable."""
        with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test123'}):
            suffix = deploy_stack.get_environment_suffix()
            self.assertEqual(suffix, 'test123')

    def test_get_environment_suffix_default(self):
        """Test getting default environment suffix."""
        with patch.dict(os.environ, {}, clear=True):
            suffix = deploy_stack.get_environment_suffix()
            self.assertEqual(suffix, 'syntht4f0b9i4')

    @patch('boto3.client')
    def test_create_vpc_if_needed_existing_stack(self, mock_boto_client):
        """Test VPC creation when stack already exists."""
        mock_cf_client = MagicMock()
        mock_ec2_client = MagicMock()

        # Mock existing stack
        mock_cf_client.describe_stacks.return_value = {
            'Stacks': [{
                'Outputs': [
                    {'OutputKey': 'VpcId', 'OutputValue': 'vpc-123'},
                    {'OutputKey': 'PrivateSubnetIds', 'OutputValue': 'subnet-1,subnet-2,subnet-3'}
                ]
            }]
        }

        vpc_id, subnet_ids = deploy_stack.create_vpc_if_needed(
            mock_cf_client, mock_ec2_client, 'test'
        )

        self.assertEqual(vpc_id, 'vpc-123')
        self.assertEqual(subnet_ids, ['subnet-1', 'subnet-2', 'subnet-3'])

    @patch('boto3.client')
    def test_create_vpc_if_needed_create_new(self, mock_boto_client):
        """Test VPC creation when stack doesn't exist."""
        mock_cf_client = MagicMock()
        mock_ec2_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'Stack does not exist'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack doesn't exist initially, then exists after creation
        mock_cf_client.describe_stacks.side_effect = [
            mock_cf_client.exceptions.ClientError(error_response, 'describe_stacks'),
            {
                'Stacks': [{
                    'Outputs': [
                        {'OutputKey': 'VpcId', 'OutputValue': 'vpc-new'},
                        {'OutputKey': 'PrivateSubnetIds', 'OutputValue': 'subnet-a,subnet-b,subnet-c'}
                    ]
                }]
            }
        ]

        # Mock waiter
        mock_waiter = MagicMock()
        mock_cf_client.get_waiter.return_value = mock_waiter

        vpc_id, subnet_ids = deploy_stack.create_vpc_if_needed(
            mock_cf_client, mock_ec2_client, 'test'
        )

        self.assertEqual(vpc_id, 'vpc-new')
        self.assertEqual(subnet_ids, ['subnet-a', 'subnet-b', 'subnet-c'])
        mock_cf_client.create_stack.assert_called_once()
        mock_waiter.wait.assert_called_once()

    @patch('boto3.client')
    def test_create_vpc_if_needed_creation_error(self, mock_boto_client):
        """Test VPC creation failure."""
        mock_cf_client = MagicMock()
        mock_ec2_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'Stack does not exist'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack doesn't exist
        mock_cf_client.describe_stacks.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'describe_stacks'
        )

        # Mock creation failure
        mock_cf_client.create_stack.side_effect = Exception("Creation failed")

        with self.assertRaises(SystemExit) as cm:
            deploy_stack.create_vpc_if_needed(mock_cf_client, mock_ec2_client, 'test')
        self.assertEqual(cm.exception.code, 1)

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_create_new(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment creating new stack."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'does not exist'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack doesn't exist initially
        mock_cf_client.describe_stacks.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'describe_stacks'
        )

        # Mock waiter
        mock_waiter = MagicMock()
        mock_cf_client.get_waiter.return_value = mock_waiter

        stack_name = deploy_stack.deploy_eks_stack(
            mock_cf_client, 'vpc-123', ['subnet-1', 'subnet-2', 'subnet-3'], 'test'
        )

        self.assertEqual(stack_name, 'eks-microservices-test')
        mock_cf_client.create_stack.assert_called_once()
        mock_waiter.wait.assert_called_once()

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_update_existing(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment updating existing stack."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Mock stack exists
        mock_cf_client.describe_stacks.return_value = {'Stacks': [{}]}

        # Mock waiter
        mock_waiter = MagicMock()
        mock_cf_client.get_waiter.return_value = mock_waiter

        stack_name = deploy_stack.deploy_eks_stack(
            mock_cf_client, 'vpc-123', ['subnet-1', 'subnet-2', 'subnet-3'], 'test'
        )

        self.assertEqual(stack_name, 'eks-microservices-test')
        mock_cf_client.update_stack.assert_called_once()
        mock_waiter.wait.assert_called_once()

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_no_updates(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment when no updates needed."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'No updates are to be performed'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack exists
        mock_cf_client.describe_stacks.return_value = {'Stacks': [{}]}

        # Mock no updates needed
        mock_cf_client.update_stack.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'update_stack'
        )

        stack_name = deploy_stack.deploy_eks_stack(
            mock_cf_client, 'vpc-123', ['subnet-1', 'subnet-2', 'subnet-3'], 'test'
        )

        self.assertEqual(stack_name, 'eks-microservices-test')

    @patch('boto3.client')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_template_not_found(self, mock_exists, mock_boto_client):
        """Test EKS stack deployment with missing template."""
        mock_exists.return_value = False
        mock_cf_client = MagicMock()

        with self.assertRaises(SystemExit) as cm:
            deploy_stack.deploy_eks_stack(
                mock_cf_client, 'vpc-123', ['subnet-1'], 'test'
            )
        self.assertEqual(cm.exception.code, 1)

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_deployment_error(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment failure."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'does not exist'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack doesn't exist
        mock_cf_client.describe_stacks.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'describe_stacks'
        )

        # Mock deployment failure
        mock_cf_client.create_stack.side_effect = Exception("Deployment failed")

        # Mock describe_stack_events for error reporting
        mock_cf_client.describe_stack_events.return_value = {
            'StackEvents': [
                {
                    'ResourceType': 'AWS::EKS::Cluster',
                    'ResourceStatus': 'CREATE_FAILED',
                    'ResourceStatusReason': 'Test failure'
                }
            ]
        }

        with self.assertRaises(SystemExit) as cm:
            deploy_stack.deploy_eks_stack(
                mock_cf_client, 'vpc-123', ['subnet-1'], 'test'
            )
        self.assertEqual(cm.exception.code, 1)

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.mkdir')
    def test_save_outputs_success(self, mock_mkdir, mock_file, mock_boto_client):
        """Test saving stack outputs successfully."""
        mock_cf_client = MagicMock()

        mock_cf_client.describe_stacks.return_value = {
            'Stacks': [{
                'Outputs': [
                    {'OutputKey': 'EksClusterName', 'OutputValue': 'test-cluster'},
                    {'OutputKey': 'EksClusterArn', 'OutputValue': 'arn:aws:eks:us-east-1:123:cluster/test'}
                ]
            }]
        }

        result = deploy_stack.save_outputs(mock_cf_client, 'test-stack')

        self.assertTrue(result)
        mock_mkdir.assert_called_once()

    @patch('boto3.client')
    def test_save_outputs_error(self, mock_boto_client):
        """Test saving stack outputs with error."""
        mock_cf_client = MagicMock()

        mock_cf_client.describe_stacks.side_effect = Exception("Failed to get outputs")

        result = deploy_stack.save_outputs(mock_cf_client, 'test-stack')

        self.assertFalse(result)

    @patch('boto3.client')
    @patch('deploy_stack.create_vpc_if_needed')
    @patch('deploy_stack.deploy_eks_stack')
    @patch('deploy_stack.save_outputs')
    @patch.dict(os.environ, {'AWS_REGION': 'us-west-2', 'ENVIRONMENT_SUFFIX': 'test'})
    def test_main_success(self, mock_save, mock_deploy, mock_vpc, mock_boto_client):
        """Test main deployment function."""
        # Mock all sub-functions
        mock_vpc.return_value = ('vpc-123', ['subnet-1', 'subnet-2', 'subnet-3'])
        mock_deploy.return_value = 'test-stack'
        mock_save.return_value = True

        # Mock boto3 clients
        mock_cf_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_boto_client.side_effect = [mock_cf_client, mock_ec2_client]

        # Call main
        deploy_stack.main()

        # Verify all functions were called
        mock_vpc.assert_called_once()
        mock_deploy.assert_called_once()
        mock_save.assert_called_once()

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_update_error_unexpected(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment with unexpected update error."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'SomeOtherError', 'Message': 'Unexpected error'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack exists
        mock_cf_client.describe_stacks.return_value = {'Stacks': [{}]}

        # Mock unexpected error on update
        mock_cf_client.update_stack.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'update_stack'
        )

        # Mock describe_stack_events
        mock_cf_client.describe_stack_events.return_value = {
            'StackEvents': [
                {
                    'ResourceType': 'AWS::EKS::Cluster',
                    'ResourceStatus': 'UPDATE_FAILED',
                    'ResourceStatusReason': 'Test failure'
                }
            ]
        }

        with self.assertRaises(SystemExit) as cm:
            deploy_stack.deploy_eks_stack(
                mock_cf_client, 'vpc-123', ['subnet-1'], 'test'
            )
        self.assertEqual(cm.exception.code, 1)

    @patch('boto3.client')
    @patch('builtins.open', new_callable=mock_open, read_data='{"test": "template"}')
    @patch('pathlib.Path.exists')
    def test_deploy_eks_stack_error_with_events_failure(self, mock_exists, mock_file, mock_boto_client):
        """Test EKS stack deployment error when describe_stack_events also fails."""
        mock_exists.return_value = True
        mock_cf_client = MagicMock()

        # Create a proper ClientError mock
        error_response = {'Error': {'Code': 'ValidationError', 'Message': 'does not exist'}}
        mock_cf_client.exceptions.ClientError = type('ClientError', (Exception,), {})

        # Mock stack doesn't exist
        mock_cf_client.describe_stacks.side_effect = mock_cf_client.exceptions.ClientError(
            error_response, 'describe_stacks'
        )

        # Mock deployment failure
        mock_cf_client.create_stack.side_effect = Exception("Deployment failed")

        # Mock describe_stack_events failure
        mock_cf_client.describe_stack_events.side_effect = Exception("Events failed")

        with self.assertRaises(SystemExit) as cm:
            deploy_stack.deploy_eks_stack(
                mock_cf_client, 'vpc-123', ['subnet-1'], 'test'
            )
        self.assertEqual(cm.exception.code, 1)


if __name__ == '__main__':  # pragma: no cover
    unittest.main()
