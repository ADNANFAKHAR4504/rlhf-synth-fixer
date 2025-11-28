"""Unit tests for Transaction API Stack"""

import pytest
from cdktf import Testing
from lib.transaction_api_stack import TransactionApiStack


class TestTransactionApiStack:
    """Unit tests for TransactionApiStack"""

    def test_stack_creation(self):
        """Test that the stack can be created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        assert stack is not None

    def test_stack_synth(self):
        """Test that the stack can be synthesized"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_s3_bucket_created(self):
        """Test that S3 bucket is created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if S3 bucket resource exists in synthesized JSON
        assert "resource" in synthesized
        assert "aws_s3_bucket" in synthesized["resource"]
        assert "TransactionBucket" in synthesized["resource"]["aws_s3_bucket"]

    def test_lambda_functions_created(self):
        """Test that Lambda functions are created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if Lambda function resources exist
        assert "aws_lambda_function" in synthesized["resource"]
        lambda_functions = synthesized["resource"]["aws_lambda_function"]

        assert "UploadHandler" in lambda_functions
        assert "ProcessHandler" in lambda_functions
        assert "StatusHandler" in lambda_functions

    def test_api_gateway_created(self):
        """Test that API Gateway is created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if API Gateway resources exist
        assert "aws_api_gateway_rest_api" in synthesized["resource"]
        assert "TransactionApi" in synthesized["resource"]["aws_api_gateway_rest_api"]

    def test_iam_role_created(self):
        """Test that IAM role is created for Lambda"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if IAM role exists
        assert "aws_iam_role" in synthesized["resource"]
        assert "LambdaExecutionRole" in synthesized["resource"]["aws_iam_role"]

    def test_lambda_permissions_created(self):
        """Test that Lambda permissions for API Gateway are created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if Lambda permissions exist
        assert "aws_lambda_permission" in synthesized["resource"]
        permissions = synthesized["resource"]["aws_lambda_permission"]

        assert "UploadLambdaPermission" in permissions
        assert "ProcessLambdaPermission" in permissions
        assert "StatusLambdaPermission" in permissions

    def test_api_gateway_deployment_created(self):
        """Test that API Gateway deployment is created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if API Gateway deployment exists
        assert "aws_api_gateway_deployment" in synthesized["resource"]
        assert "ApiDeployment" in synthesized["resource"]["aws_api_gateway_deployment"]

    def test_outputs_defined(self):
        """Test that stack outputs are defined"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        synthesized = Testing.synth(stack)

        # Check if outputs are defined
        assert "output" in synthesized
        outputs = synthesized["output"]

        assert "api_endpoint" in outputs
        assert "bucket_name" in outputs
        assert "upload_lambda_arn" in outputs
        assert "process_lambda_arn" in outputs
        assert "status_lambda_arn" in outputs
