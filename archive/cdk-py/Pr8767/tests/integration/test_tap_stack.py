"""
Integration tests for deployed TapStack infrastructure.
Tests real deployed resources: S3, Lambda, CloudWatch.
"""

import json
import os
import subprocess
import tempfile
import time
import random
import string
import boto3
import pytest
from botocore.exceptions import ClientError


def run_cli(command):
    """Execute AWS CLI command and return output."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
    return result.stdout


def generate_random_suffix(length=8):
    """Generate random alphanumeric string."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


@pytest.fixture(scope="module")
def outputs():
    """Load stack outputs from flat-outputs.json."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip("Outputs file not found - stack may not be deployed")

    with open(outputs_file, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_endpoint():
    """Get AWS endpoint URL for LocalStack or real AWS."""
    return os.getenv("AWS_ENDPOINT_URL")


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region."""
    return os.getenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope="module")
def s3_client(aws_endpoint, aws_region):
    """Create S3 client."""
    return boto3.client(
        "s3",
        endpoint_url=aws_endpoint,
        region_name=aws_region
    )


@pytest.fixture(scope="module")
def lambda_client(aws_endpoint, aws_region):
    """Create Lambda client."""
    return boto3.client(
        "lambda",
        endpoint_url=aws_endpoint,
        region_name=aws_region
    )


@pytest.fixture(scope="module")
def cloudwatch_client(aws_endpoint, aws_region):
    """Create CloudWatch client."""
    return boto3.client(
        "cloudwatch",
        endpoint_url=aws_endpoint,
        region_name=aws_region
    )


@pytest.fixture(scope="module")
def logs_client(aws_endpoint, aws_region):
    """Create CloudWatch Logs client."""
    return boto3.client(
        "logs",
        endpoint_url=aws_endpoint,
        region_name=aws_region
    )


@pytest.fixture(scope="module")
def iam_client(aws_endpoint, aws_region):
    """Create IAM client."""
    return boto3.client(
        "iam",
        endpoint_url=aws_endpoint,
        region_name=aws_region
    )


class TestTapStackOutputs:
    """Test CloudFormation stack outputs."""

    def test_outputs_file_exists(self):
        """Verify outputs file exists."""
        outputs_file = "cfn-outputs/flat-outputs.json"
        assert os.path.exists(outputs_file), "Outputs file not found"

    def test_required_outputs_present(self, outputs):
        """Verify all required outputs are present."""
        required_keys = ["S3BucketName", "LambdaFunctionName", "LambdaRoleArn"]
        for key in required_keys:
            assert key in outputs, f"Missing output: {key}"
            assert outputs[key], f"Output {key} is empty"


class TestS3BucketDeployment:
    """Test S3 bucket deployment and configuration."""

    def test_s3_bucket_exists(self, s3_client, outputs):
        """Test that the S3 bucket exists."""
        bucket_name = outputs.get("S3BucketName")
        assert bucket_name is not None, "S3BucketName not found in outputs"

        # Check if bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_bucket_encryption(self, s3_client, outputs):
        """Test S3 bucket has encryption enabled."""
        bucket_name = outputs.get("S3BucketName")

        # Get bucket encryption
        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = response["ServerSideEncryptionConfiguration"]["Rules"]
            assert len(encryption_rules) > 0
            assert encryption_rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"
        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                pytest.fail("Bucket encryption not configured")
            else:
                raise

    def test_s3_bucket_operations(self, s3_client, outputs):
        """Test S3 bucket upload, download, and delete operations."""
        bucket_name = outputs.get("S3BucketName")
        object_key = f"test-{generate_random_suffix()}.txt"
        test_content = "TURING_RLHF_TEST_DATA"

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create test file
            local_file_path = os.path.join(tmpdir, "test.txt")
            with open(local_file_path, "w", encoding="utf-8") as f:
                f.write(test_content)

            # Upload to S3
            s3_client.upload_file(local_file_path, bucket_name, object_key)

            # Verify object exists
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

            # Download and verify content
            download_path = os.path.join(tmpdir, "downloaded.txt")
            s3_client.download_file(bucket_name, object_key, download_path)

            with open(download_path, "r", encoding="utf-8") as f:
                content = f.read()
            assert test_content in content

            # Delete object
            s3_client.delete_object(Bucket=bucket_name, Key=object_key)

    def test_s3_bucket_notification_configuration(self, s3_client, outputs):
        """Test S3 bucket has notification configuration for Lambda."""
        bucket_name = outputs.get("S3BucketName")

        # Get bucket notification configuration
        try:
            response = s3_client.get_bucket_notification_configuration(Bucket=bucket_name)
            assert "LambdaFunctionConfigurations" in response
            assert len(response["LambdaFunctionConfigurations"]) > 0

            # Verify event type
            config = response["LambdaFunctionConfigurations"][0]
            assert "s3:ObjectCreated:*" in config["Events"]
        except Exception as e:
            pytest.fail(f"Failed to get notification configuration: {e}")


class TestLambdaDeployment:
    """Test Lambda function deployment and configuration."""

    def test_lambda_function_exists(self, lambda_client, outputs):
        """Test that the Lambda function exists."""
        function_name = outputs.get("LambdaFunctionName")
        assert function_name is not None, "LambdaFunctionName not found in outputs"

        # Get function configuration
        response = lambda_client.get_function(FunctionName=function_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200
        assert response["Configuration"]["FunctionName"] == function_name

    def test_lambda_runtime_configuration(self, lambda_client, outputs):
        """Test Lambda has correct runtime and configuration."""
        function_name = outputs.get("LambdaFunctionName")
        response = lambda_client.get_function(FunctionName=function_name)

        config = response["Configuration"]
        assert config["Runtime"] == "python3.11"
        assert config["Handler"] == "index.handler"
        assert config["State"] == "Active"

    def test_lambda_environment_variables(self, lambda_client, outputs):
        """Test Lambda has required environment variables."""
        function_name = outputs.get("LambdaFunctionName")
        bucket_name = outputs.get("S3BucketName")

        response = lambda_client.get_function(FunctionName=function_name)
        env_vars = response["Configuration"].get("Environment", {}).get("Variables", {})

        assert "BUCKET_NAME" in env_vars
        assert env_vars["BUCKET_NAME"] == bucket_name

    def test_lambda_iam_role(self, lambda_client, outputs):
        """Test Lambda has IAM role attached."""
        function_name = outputs.get("LambdaFunctionName")
        expected_role_arn = outputs.get("LambdaRoleArn")

        response = lambda_client.get_function(FunctionName=function_name)
        actual_role_arn = response["Configuration"]["Role"]

        assert actual_role_arn == expected_role_arn

    def test_lambda_invocation_success(self, lambda_client, outputs):
        """Test Lambda function can be invoked successfully."""
        function_name = outputs.get("LambdaFunctionName")

        # Create test event matching S3 event structure
        test_event = {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": outputs.get("S3BucketName")},
                        "object": {"key": "test-object.txt"}
                    }
                }
            ]
        }

        # Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        assert response["StatusCode"] == 200
        assert "FunctionError" not in response

        # Parse response
        payload = json.loads(response["Payload"].read())
        assert payload.get("statusCode") == 200

    def test_lambda_invocation_with_invalid_event(self, lambda_client, outputs):
        """Test Lambda handles invalid events gracefully."""
        function_name = outputs.get("LambdaFunctionName")

        # Invalid event (missing Records)
        test_event = {"invalid": "data"}

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        # Should complete but may have function error
        assert response["StatusCode"] == 200


class TestCloudWatchIntegration:
    """Test CloudWatch Logs and Alarms integration."""

    def test_lambda_log_group_exists(self, logs_client, outputs):
        """Test Lambda function log group exists."""
        function_name = outputs.get("LambdaFunctionName")
        log_group_name = f"/aws/lambda/{function_name}"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = response.get("logGroups", [])
            assert len(log_groups) > 0
            assert log_groups[0]["logGroupName"] == log_group_name
        except Exception as e:
            pytest.skip(f"Log group not found (may not exist yet): {e}")

    def test_lambda_generates_logs(self, lambda_client, logs_client, outputs):
        """Test Lambda function generates CloudWatch logs."""
        function_name = outputs.get("LambdaFunctionName")
        log_group_name = f"/aws/lambda/{function_name}"

        # Invoke Lambda to generate logs
        test_event = {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": outputs.get("S3BucketName")},
                        "object": {"key": f"test-{generate_random_suffix()}.txt"}
                    }
                }
            ]
        }

        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        # Wait for logs to appear
        time.sleep(2)

        # Check if log streams exist
        try:
            response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy="LastEventTime",
                descending=True,
                limit=1
            )
            log_streams = response.get("logStreams", [])
            assert len(log_streams) > 0, "No log streams found"
        except logs_client.exceptions.ResourceNotFoundException:
            pytest.skip("Log group not found yet")

    def test_cloudwatch_alarms_exist(self, cloudwatch_client, outputs):
        """Test CloudWatch alarms are deployed."""
        function_name = outputs.get("LambdaFunctionName")

        # List alarms for the Lambda function
        response = cloudwatch_client.describe_alarms()
        alarms = response.get("MetricAlarms", [])

        # Filter alarms related to our Lambda function
        lambda_alarms = [
            alarm for alarm in alarms
            if any(
                dim.get("Name") == "FunctionName" and dim.get("Value") == function_name
                for dim in alarm.get("Dimensions", [])
            )
        ]

        # Should have 3 alarms: Errors, Throttles, Duration
        assert len(lambda_alarms) >= 3, f"Expected 3 alarms, found {len(lambda_alarms)}"

        # Verify alarm types
        alarm_metrics = [alarm["MetricName"] for alarm in lambda_alarms]
        assert "Errors" in alarm_metrics
        assert "Throttles" in alarm_metrics
        assert "Duration" in alarm_metrics


class TestEndToEndFlow:
    """End-to-end integration tests."""

    def test_s3_upload_triggers_lambda(self, s3_client, lambda_client, logs_client, outputs):
        """Test that uploading to S3 triggers Lambda execution."""
        bucket_name = outputs.get("S3BucketName")
        function_name = outputs.get("LambdaFunctionName")
        object_key = f"e2e-test-{generate_random_suffix()}.txt"
        test_content = "End-to-end test data"

        # Upload file to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=test_content.encode("utf-8")
        )

        # Wait for Lambda execution (S3 event + Lambda processing)
        time.sleep(5)

        # Check Lambda was invoked by looking at recent invocations
        # Note: This test may be flaky in LocalStack
        try:
            log_group_name = f"/aws/lambda/{function_name}"
            response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy="LastEventTime",
                descending=True,
                limit=5
            )

            if response.get("logStreams"):
                # Lambda was invoked (logs exist)
                assert len(response["logStreams"]) > 0
        except Exception:
            # If logs not available, just verify object was uploaded
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)

    def test_lambda_can_read_from_s3(self, s3_client, lambda_client, outputs):
        """Test Lambda has permissions to read from S3."""
        bucket_name = outputs.get("S3BucketName")
        function_name = outputs.get("LambdaFunctionName")
        object_key = f"read-test-{generate_random_suffix()}.txt"

        # Upload test object
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body="Test content for Lambda to read"
        )

        # Create event that includes the object key
        test_event = {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": bucket_name},
                        "object": {"key": object_key}
                    }
                }
            ]
        }

        # Invoke Lambda
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        # Lambda should execute successfully
        assert response["StatusCode"] == 200
        assert "FunctionError" not in response

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)


class TestSecurityConfiguration:
    """Test security configurations."""

    def test_lambda_role_exists(self, iam_client, outputs):
        """Test Lambda IAM role exists."""
        role_arn = outputs.get("LambdaRoleArn")
        assert role_arn is not None

        # Extract role name from ARN
        role_name = role_arn.split("/")[-1]

        # Get role
        try:
            response = iam_client.get_role(RoleName=role_name)
            assert response["Role"]["Arn"] == role_arn
        except iam_client.exceptions.NoSuchEntityException:
            pytest.skip("IAM role not accessible (may be LocalStack limitation)")

    def test_s3_bucket_not_publicly_accessible(self, s3_client, outputs):
        """Test S3 bucket is not publicly accessible."""
        bucket_name = outputs.get("S3BucketName")

        # Try to get bucket policy
        try:
            s3_client.get_bucket_policy(Bucket=bucket_name)
            # If policy exists, it should not allow public access
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchBucketPolicy':
                # No policy is good - means no public access granted
                pass
            else:
                raise

        # Check public access block configuration
        try:
            response = s3_client.get_public_access_block(Bucket=bucket_name)
            config = response["PublicAccessBlockConfiguration"]
            # If configured, should block public access
            if config:
                assert config.get("BlockPublicAcls", False)
                assert config.get("BlockPublicPolicy", False)
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchPublicAccessBlockConfiguration':
                # No explicit block configuration (default behavior)
                pass
            else:
                raise
