"""
Unit tests for Compute Stack (Lambda).
"""

import unittest
import pulumi
from lib.compute import ComputeStack


class TestComputeStack(unittest.TestCase):
    """Test Compute Stack creation."""

    @pulumi.runtime.test
    def test_compute_stack_initialization(self):
        """Test Compute stack can be initialized."""
        compute_stack = ComputeStack(
            'test-compute',
            vpc_id=pulumi.Output.from_input('vpc-12345'),
            private_subnet_ids=[
                pulumi.Output.from_input('subnet-1'),
                pulumi.Output.from_input('subnet-2')
            ],
            db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:test'),
            dynamodb_table_name=pulumi.Output.from_input('test-table'),
            reserved_concurrency=None,
            environment_suffix='test',
            tags={'Test': 'true'}
        )

        # Verify outputs exist
        assert compute_stack.lambda_function_arn is not None
        assert compute_stack.lambda_function_name is not None

    @pulumi.runtime.test
    def test_compute_stack_with_reserved_concurrency(self):
        """Test Compute stack with reserved concurrency."""
        compute_stack = ComputeStack(
            'test-compute-concurrency',
            vpc_id=pulumi.Output.from_input('vpc-12345'),
            private_subnet_ids=[pulumi.Output.from_input('subnet-1')],
            db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:db'),
            dynamodb_table_name=pulumi.Output.from_input('payments-table'),
            reserved_concurrency=100,
            environment_suffix='prod',
            tags={'Environment': 'prod'}
        )

        # Verify stack created
        assert compute_stack is not None
        assert compute_stack.lambda_function is not None
        assert compute_stack.lambda_sg is not None
        assert compute_stack.lambda_role is not None

    @pulumi.runtime.test
    def test_compute_stack_security_group(self):
        """Test security group creation."""
        compute_stack = ComputeStack(
            'test-compute-sg',
            vpc_id=pulumi.Output.from_input('vpc-abc123'),
            private_subnet_ids=[pulumi.Output.from_input('subnet-xyz')],
            db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:creds'),
            dynamodb_table_name=pulumi.Output.from_input('data-table'),
            reserved_concurrency=None,
            environment_suffix='dev',
            tags={}
        )

        # Verify security group exists
        assert compute_stack.lambda_sg is not None

    @pulumi.runtime.test
    def test_compute_stack_iam_role(self):
        """Test IAM role creation."""
        compute_stack = ComputeStack(
            'test-compute-iam',
            vpc_id=pulumi.Output.from_input('vpc-test'),
            private_subnet_ids=[pulumi.Output.from_input('subnet-test')],
            db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret'),
            dynamodb_table_name=pulumi.Output.from_input('test-ddb'),
            reserved_concurrency=50,
            environment_suffix='staging',
            tags={'Stage': 'staging'}
        )

        # Verify IAM role exists
        assert compute_stack.lambda_role is not None

    @pulumi.runtime.test
    def test_compute_stack_lambda_configuration(self):
        """Test Lambda function configuration."""
        compute_stack = ComputeStack(
            'test-lambda-config',
            vpc_id=pulumi.Output.from_input('vpc-config'),
            private_subnet_ids=[
                pulumi.Output.from_input('subnet-a'),
                pulumi.Output.from_input('subnet-b')
            ],
            db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:us-east-1:123456789012:secret:config'),
            dynamodb_table_name=pulumi.Output.from_input('config-table'),
            reserved_concurrency=None,
            environment_suffix='test',
            tags={}
        )

        # Verify Lambda function exists
        assert compute_stack.lambda_function is not None


if __name__ == '__main__':
    unittest.main()
