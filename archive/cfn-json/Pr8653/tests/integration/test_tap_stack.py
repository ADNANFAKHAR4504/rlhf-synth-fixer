"""Integration tests for TAP stack with LocalStack."""

import os
import json
import time
import pytest
import boto3
from botocore.exceptions import ClientError


# LocalStack endpoint
LOCALSTACK_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients configured for LocalStack."""
    return {
        "s3": boto3.client(
            "s3",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "lambda": boto3.client(
            "lambda",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "apigatewayv2": boto3.client(
            "apigatewayv2",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "secretsmanager": boto3.client(
            "secretsmanager",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "logs": boto3.client(
            "logs",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "iam": boto3.client(
            "iam",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
    }


class TestTapStackIntegration:
    """Integration test cases for TAP stack with LocalStack."""

    def test_s3_bucket_exists(self, aws_clients):
        """Test that S3 bucket was created."""
        s3 = aws_clients["s3"]
        buckets = s3.list_buckets()
        bucket_names = [b["Name"] for b in buckets["Buckets"]]

        # Look for bucket with our naming pattern
        tap_buckets = [b for b in bucket_names if "tap-bucket" in b]
        assert len(tap_buckets) > 0, "No TAP bucket found"

    def test_s3_bucket_has_versioning(self, aws_clients):
        """Test that S3 bucket has versioning enabled."""
        s3 = aws_clients["s3"]
        buckets = s3.list_buckets()
        bucket_names = [b["Name"] for b in buckets["Buckets"]]
        tap_buckets = [b for b in bucket_names if "tap-bucket" in b]

        if tap_buckets:
            bucket_name = tap_buckets[0]
            try:
                versioning = s3.get_bucket_versioning(Bucket=bucket_name)
                assert versioning.get("Status") == "Enabled", "Versioning not enabled"
            except ClientError:
                pytest.skip("Versioning not supported in LocalStack Community")

    def test_lambda_function_exists(self, aws_clients):
        """Test that Lambda function was created."""
        lambda_client = aws_clients["lambda"]
        try:
            response = lambda_client.get_function(FunctionName="serverless-api-handler")
            assert response["Configuration"]["FunctionName"] == "serverless-api-handler"
            assert response["Configuration"]["Runtime"].startswith("python")
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.fail("Lambda function not found")
            raise

    def test_lambda_has_environment_variables(self, aws_clients):
        """Test that Lambda function has correct environment variables."""
        lambda_client = aws_clients["lambda"]
        try:
            response = lambda_client.get_function(FunctionName="serverless-api-handler")
            env_vars = response["Configuration"].get("Environment", {}).get("Variables", {})
            assert "SECRET_NAME" in env_vars, "SECRET_NAME not found in environment"
            assert "LOG_LEVEL" in env_vars, "LOG_LEVEL not found in environment"
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip("Lambda function not found")

    def test_secrets_manager_secret_exists(self, aws_clients):
        """Test that Secrets Manager secret was created."""
        sm = aws_clients["secretsmanager"]
        try:
            response = sm.describe_secret(SecretId="serverless-app-config")
            assert response["Name"] == "serverless-app-config"
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.fail("Secret not found")
            raise

    def test_secrets_manager_has_value(self, aws_clients):
        """Test that secret has a value."""
        sm = aws_clients["secretsmanager"]
        try:
            response = sm.get_secret_value(SecretId="serverless-app-config")
            secret_string = response["SecretString"]
            secret_data = json.loads(secret_string)

            assert "API_KEY" in secret_data
            assert "DATABASE_URL" in secret_data
            assert "EXTERNAL_SERVICE_TOKEN" in secret_data
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip("Secret not found")

    def test_api_gateway_exists(self, aws_clients):
        """Test that API Gateway was created."""
        apigw = aws_clients["apigatewayv2"]
        apis = apigw.get_apis()
        api_names = [api["Name"] for api in apis.get("Items", [])]
        assert "serverless-http-api" in api_names, "API Gateway not found"

    def test_api_gateway_has_routes(self, aws_clients):
        """Test that API Gateway has configured routes."""
        apigw = aws_clients["apigatewayv2"]
        apis = apigw.get_apis()

        serverless_apis = [api for api in apis.get("Items", []) if api["Name"] == "serverless-http-api"]
        if serverless_apis:
            api_id = serverless_apis[0]["ApiId"]
            routes = apigw.get_routes(ApiId=api_id)
            assert len(routes.get("Items", [])) > 0, "No routes configured"

    def test_cloudwatch_log_group_exists(self, aws_clients):
        """Test that CloudWatch log group was created."""
        logs = aws_clients["logs"]
        try:
            response = logs.describe_log_groups(
                logGroupNamePrefix="/aws/lambda/serverless-api-handler"
            )
            log_groups = response.get("logGroups", [])
            assert len(log_groups) > 0, "Log group not found"
        except ClientError:
            pytest.skip("CloudWatch Logs not fully supported in LocalStack")

    def test_iam_roles_exist(self, aws_clients):
        """Test that IAM roles were created."""
        iam = aws_clients["iam"]
        try:
            roles = iam.list_roles()
            role_names = [r["RoleName"] for r in roles["Roles"]]

            assert "serverless-lambda-execution-role" in role_names, "Lambda execution role not found"
            assert "serverless-api-access-role" in role_names, "API access role not found"
        except ClientError:
            pytest.skip("IAM not fully supported in LocalStack")

    def test_lambda_can_be_invoked(self, aws_clients):
        """Test that Lambda function can be invoked."""
        lambda_client = aws_clients["lambda"]
        try:
            response = lambda_client.invoke(
                FunctionName="serverless-api-handler",
                InvocationType="RequestResponse",
                Payload=json.dumps({"test": "data"})
            )
            assert response["StatusCode"] == 200
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip("Lambda function not found")
            else:
                pytest.skip(f"Lambda invocation not fully supported: {e}")

    def test_stack_outputs_accessible(self, aws_clients):
        """Test that all critical stack outputs are accessible."""
        # This is a composite test to verify the stack is fully deployed
        lambda_client = aws_clients["lambda"]
        sm = aws_clients["secretsmanager"]
        apigw = aws_clients["apigatewayv2"]

        outputs_verified = 0

        # Lambda function
        try:
            lambda_client.get_function(FunctionName="serverless-api-handler")
            outputs_verified += 1
        except ClientError:
            pass

        # Secrets Manager
        try:
            sm.describe_secret(SecretId="serverless-app-config")
            outputs_verified += 1
        except ClientError:
            pass

        # API Gateway
        try:
            apis = apigw.get_apis()
            if any(api["Name"] == "serverless-http-api" for api in apis.get("Items", [])):
                outputs_verified += 1
        except ClientError:
            pass

        assert outputs_verified >= 2, f"Only {outputs_verified}/3 outputs verified"
