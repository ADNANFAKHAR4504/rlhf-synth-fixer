"""Unit tests for Transaction API Stack"""

import json
import pytest
from cdktf import Testing
from lib.transaction_api_stack import TransactionApiStack


@pytest.fixture(scope="module")
def synthesized_stack():
    """Fixture that creates and synthesizes stack once for all tests"""
    app = Testing.app()
    stack = TransactionApiStack(app, "TestStack")
    synthesized_str = Testing.synth(stack)
    return json.loads(synthesized_str)


class TestTransactionApiStack:
    """Unit tests for TransactionApiStack"""

    def test_stack_creation(self):
        """Test that the stack can be created"""
        app = Testing.app()
        stack = TransactionApiStack(app, "TestStack")
        assert stack is not None

    def test_s3_bucket_created(self, synthesized_stack):
        """Test that S3 bucket is created"""
        # Check if S3 bucket resource exists in synthesized JSON
        assert "resource" in synthesized_stack
        assert "aws_s3_bucket" in synthesized_stack["resource"]
        assert "TransactionBucket" in synthesized_stack["resource"]["aws_s3_bucket"]

    def test_lambda_functions_created(self, synthesized_stack):
        """Test that Lambda functions are created"""
        # Check if Lambda function resources exist
        assert "aws_lambda_function" in synthesized_stack["resource"]
        lambda_functions = synthesized_stack["resource"]["aws_lambda_function"]

        assert "UploadHandler" in lambda_functions
        assert "ProcessHandler" in lambda_functions
        assert "StatusHandler" in lambda_functions

    def test_api_gateway_created(self, synthesized_stack):
        """Test that API Gateway is created"""
        # Check if API Gateway resources exist
        assert "aws_api_gateway_rest_api" in synthesized_stack["resource"]
        assert "TransactionApi" in synthesized_stack["resource"]["aws_api_gateway_rest_api"]

    def test_iam_role_created(self, synthesized_stack):
        """Test that IAM role is created for Lambda"""
        # Check if IAM role exists
        assert "aws_iam_role" in synthesized_stack["resource"]
        assert "LambdaExecutionRole" in synthesized_stack["resource"]["aws_iam_role"]

    def test_lambda_permissions_created(self, synthesized_stack):
        """Test that Lambda permissions for API Gateway are created"""
        # Check if Lambda permissions exist
        assert "aws_lambda_permission" in synthesized_stack["resource"]
        permissions = synthesized_stack["resource"]["aws_lambda_permission"]

        assert "UploadLambdaPermission" in permissions
        assert "ProcessLambdaPermission" in permissions
        assert "StatusLambdaPermission" in permissions

    def test_api_gateway_deployment_created(self, synthesized_stack):
        """Test that API Gateway deployment is created"""
        # Check if API Gateway deployment exists
        assert "aws_api_gateway_deployment" in synthesized_stack["resource"]
        assert "ApiDeployment" in synthesized_stack["resource"]["aws_api_gateway_deployment"]

    def test_outputs_defined(self, synthesized_stack):
        """Test that stack outputs are defined"""
        # Check if outputs are defined
        assert "output" in synthesized_stack
        outputs = synthesized_stack["output"]

        assert "api_endpoint" in outputs
        assert "bucket_name" in outputs
        assert "upload_lambda_arn" in outputs
        assert "process_lambda_arn" in outputs
        assert "status_lambda_arn" in outputs
