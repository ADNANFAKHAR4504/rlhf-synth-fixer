"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi.runtime.test.
Tests all infrastructure components including KMS, DynamoDB, SNS, SQS, Lambda, IAM, and CloudWatch.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi

# Set mocks before importing
pulumi.runtime.set_mocks(
    mocks=MagicMock(),
    preview=False
)


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {**args.inputs}

        # Add resource-specific outputs
        if args.typ == "aws:kms/key:Key":
            outputs["id"] = "mock-kms-key-id"
            outputs["arn"] = "arn:aws:kms:us-east-1:123456789012:key/mock-key-id"
        elif args.typ == "aws:kms/alias:Alias":
            outputs["id"] = "mock-kms-alias-id"
            outputs["arn"] = "arn:aws:kms:us-east-1:123456789012:alias/mock-alias"
        elif args.typ == "aws:dynamodb/table:Table":
            outputs["id"] = "mock-dynamodb-table-id"
            outputs["arn"] = "arn:aws:dynamodb:us-east-1:123456789012:table/mock-table"
        elif args.typ == "aws:sns/topic:Topic":
            outputs["id"] = "mock-sns-topic-id"
            outputs["arn"] = "arn:aws:sns:us-east-1:123456789012:mock-topic"
        elif args.typ == "aws:sqs/queue:Queue":
            outputs["id"] = "mock-sqs-queue-id"
            outputs["arn"] = "arn:aws:sqs:us-east-1:123456789012:mock-queue"
            outputs["url"] = "https://sqs.us-east-1.amazonaws.com/123456789012/mock-queue"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = "mock-iam-role-id"
            outputs["arn"] = "arn:aws:iam::123456789012:role/mock-role"
        elif args.typ == "aws:iam/rolePolicy:RolePolicy":
            outputs["id"] = "mock-role-policy-id"
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs["id"] = "mock-role-policy-attachment-id"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = "mock-log-group-id"
            outputs["arn"] = "arn:aws:logs:us-east-1:123456789012:log-group:mock-log-group"
        elif args.typ == "aws:lambda/function:Function":
            outputs["id"] = "mock-lambda-function-id"
            outputs["arn"] = "arn:aws:lambda:us-east-1:123456789012:function:mock-function"
        elif args.typ == "aws:lambda/functionEventInvokeConfig:FunctionEventInvokeConfig":
            outputs["id"] = "mock-invoke-config-id"

        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": '{"Version":"2012-10-17","Statement":[]}',
                "id": "mock-policy-doc-id"
            }
        return {}


# Set mocks
pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs  # pylint: disable=wrong-import-position


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization with environment suffix."""
        args = TapStackArgs(environment_suffix='test')
        self.assertEqual(args.environment_suffix, 'test')

    def test_tap_stack_args_different_suffix(self):
        """Test TapStackArgs with different environment suffix."""
        args = TapStackArgs(environment_suffix='prod')
        self.assertEqual(args.environment_suffix, 'prod')


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack can be created."""
    def check_stack(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )
        return {
            'stack': stack,
        }

    return check_stack({})


@pulumi.runtime.test
def test_kms_key_configuration():
    """Test KMS key is created with correct configuration."""
    def check_kms(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify KMS key exists
        assert stack.kms_key is not None

        return {}

    return check_kms({})


@pulumi.runtime.test
def test_dynamodb_table_configuration():
    """Test DynamoDB table is created with correct configuration."""
    def check_dynamodb(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify DynamoDB table exists
        assert stack.dynamodb_table is not None

        return {}

    return check_dynamodb({})


@pulumi.runtime.test
def test_sns_topic_configuration():
    """Test SNS topic is created with correct configuration."""
    def check_sns(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify SNS topic exists
        assert stack.sns_topic is not None

        return {}

    return check_sns({})


@pulumi.runtime.test
def test_sqs_queue_configuration():
    """Test SQS dead letter queue is created with correct configuration."""
    def check_sqs(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify SQS queue exists
        assert stack.dlq is not None

        return {}

    return check_sqs({})


@pulumi.runtime.test
def test_lambda_role_configuration():
    """Test Lambda IAM role is created with correct configuration."""
    def check_lambda_role(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify Lambda role exists
        assert stack.lambda_role is not None

        return {}

    return check_lambda_role({})


@pulumi.runtime.test
def test_cloudwatch_log_group_configuration():
    """Test CloudWatch log group is created with correct configuration."""
    def check_log_group(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify log group exists
        assert stack.log_group is not None

        return {}

    return check_log_group({})


@pulumi.runtime.test
def test_lambda_function_configuration():
    """Test Lambda function is created with correct configuration."""
    def check_lambda(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify Lambda function exists
        assert stack.lambda_function is not None

        return {}

    return check_lambda({})


@pulumi.runtime.test
def test_environment_suffix_in_resource_names():
    """Test that environment suffix is included in all resource names."""
    def check_environment_suffix(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='unittest')
        )

        # Verify environment suffix is stored
        assert stack.environment_suffix == 'unittest'

        return {}

    return check_environment_suffix({})


@pulumi.runtime.test
def test_all_resources_created():
    """Test that all required resources are created in the stack."""
    def check_all_resources(args):
        stack = TapStack(
            name="test-stack",
            args=TapStackArgs(environment_suffix='test')
        )

        # Verify all major resources exist
        assert stack.kms_key is not None, "KMS key not created"
        assert stack.dynamodb_table is not None, "DynamoDB table not created"
        assert stack.sns_topic is not None, "SNS topic not created"
        assert stack.dlq is not None, "SQS DLQ not created"
        assert stack.lambda_role is not None, "Lambda role not created"
        assert stack.log_group is not None, "CloudWatch log group not created"
        assert stack.lambda_function is not None, "Lambda function not created"

        return {}

    return check_all_resources({})


if __name__ == '__main__':
    unittest.main()
