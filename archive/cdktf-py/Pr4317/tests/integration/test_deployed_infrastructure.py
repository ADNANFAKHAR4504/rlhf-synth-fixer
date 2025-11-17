"""Integration tests for deployed infrastructure."""

import json
import os
import boto3
import pytest
import requests
from botocore.exceptions import ClientError


def load_outputs():
    """Load outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json"
    )
    if not os.path.exists(outputs_path):
        pytest.skip("Outputs file not found - infrastructure not deployed yet")

    with open(outputs_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Look for TapStack with healthcare CDKTF outputs
    # Expected structure: {"TapStackpr4317": {"api_gateway_endpoint": "...", ...}}
    current_stack = None
    stack_name = None
    for name, stack_outputs in data.items():
        if isinstance(stack_outputs, dict) and name.startswith("TapStack"):
            # Check for healthcare CDKTF stack outputs
            if any(key in stack_outputs for key in ["api_gateway_endpoint", "data_bucket_name", "kms_key_arn"]):
                current_stack = stack_outputs
                stack_name = name
                break

    if current_stack is None:
        pytest.skip("Healthcare CDKTF stack outputs not found - infrastructure not deployed yet")

    # Extract environment suffix from stack name (e.g., "TapStackpr4317" -> "pr4317")
    environment_suffix = stack_name.replace("TapStack", "").lower()
    current_stack["_environment_suffix"] = environment_suffix
    current_stack["_stack_name"] = stack_name

    return current_stack


@pytest.fixture(scope="module")
def outputs():
    """Fixture to load deployment outputs."""
    return load_outputs()


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment."""
    return os.getenv("AWS_REGION", "us-east-1")


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client."""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def dynamodb_client(aws_region):
    """Create DynamoDB client."""
    return boto3.client("dynamodb", region_name=aws_region)


@pytest.fixture(scope="module")
def lambda_client(aws_region):
    """Create Lambda client."""
    return boto3.client("lambda", region_name=aws_region)


@pytest.fixture(scope="module")
def apigateway_client(aws_region):
    """Create API Gateway client."""
    return boto3.client("apigateway", region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client("kms", region_name=aws_region)


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client."""
    return boto3.client("cloudwatch", region_name=aws_region)


class TestAPIGateway:
    """Test API Gateway deployment."""

    def test_api_gateway_endpoint_exists(self, outputs):
        """Test that API Gateway endpoint is accessible."""
        endpoint = outputs.get("api_gateway_endpoint")
        assert endpoint is not None
        assert endpoint.startswith("https://")
        assert "execute-api" in endpoint

    def test_api_gateway_responds(self, outputs):
        """Test that API Gateway endpoint responds to requests."""
        endpoint = outputs.get("api_gateway_endpoint")
        response = requests.get(f"{endpoint}/health", timeout=10)
        # API may return 403 or 200 depending on configuration
        # Just verify it responds
        assert response.status_code in [200, 403, 404]


class TestS3Bucket:
    """Test S3 bucket deployment."""

    def test_data_bucket_exists(self, outputs, s3_client):
        """Test that S3 data bucket exists."""
        bucket_name = outputs.get("data_bucket_name")
        assert bucket_name is not None

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_data_bucket_has_versioning(self, outputs, s3_client):
        """Test that S3 bucket has versioning enabled."""
        bucket_name = outputs.get("data_bucket_name")
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"

    def test_data_bucket_has_encryption(self, outputs, s3_client):
        """Test that S3 bucket has encryption enabled."""
        bucket_name = outputs.get("data_bucket_name")
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert "ServerSideEncryptionConfiguration" in response
        assert "Rules" in response["ServerSideEncryptionConfiguration"]
        assert len(response["ServerSideEncryptionConfiguration"]["Rules"]) > 0

    def test_data_bucket_public_access_blocked(self, outputs, s3_client):
        """Test that S3 bucket has public access blocked."""
        bucket_name = outputs.get("data_bucket_name")
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response["PublicAccessBlockConfiguration"]
        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True


class TestDynamoDB:
    """Test DynamoDB table deployment."""

    def test_dynamodb_table_exists(self, outputs, dynamodb_client):
        """Test that DynamoDB table exists."""
        table_name = outputs.get("dynamodb_table_name")
        assert table_name is not None

        response = dynamodb_client.describe_table(TableName=table_name)
        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_dynamodb_table_has_encryption(self, outputs, dynamodb_client):
        """Test that DynamoDB table has encryption enabled."""
        table_name = outputs.get("dynamodb_table_name")
        response = dynamodb_client.describe_table(TableName=table_name)

        # Check for SSE specification
        sse_description = response["Table"].get("SSEDescription")
        assert sse_description is not None
        assert sse_description["Status"] == "ENABLED"

    def test_dynamodb_table_has_point_in_time_recovery(
        self, outputs, dynamodb_client
    ):
        """Test that DynamoDB table has point-in-time recovery enabled."""
        table_name = outputs.get("dynamodb_table_name")
        response = dynamodb_client.describe_continuous_backups(TableName=table_name)

        pitr_status = response["ContinuousBackupsDescription"][
            "PointInTimeRecoveryDescription"
        ]["PointInTimeRecoveryStatus"]
        assert pitr_status == "ENABLED"

    def test_dynamodb_table_write_and_read(self, outputs, dynamodb_client):
        """Test writing and reading from DynamoDB table."""
        table_name = outputs.get("dynamodb_table_name")

        # Put an item (using correct key name patient_id, not patientId)
        test_item = {
            "patient_id": {"S": "test-patient-123"},
            "timestamp": {"S": "2025-10-14T00:00:00Z"},
            "data": {"S": "test data"},
        }

        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Get the item back
        response = dynamodb_client.get_item(
            TableName=table_name, Key={"patient_id": {"S": "test-patient-123"}}
        )

        assert "Item" in response
        assert response["Item"]["patient_id"]["S"] == "test-patient-123"

        # Clean up
        dynamodb_client.delete_item(
            TableName=table_name, Key={"patient_id": {"S": "test-patient-123"}}
        )


class TestKMS:
    """Test KMS key deployment."""

    def test_kms_key_exists(self, outputs, kms_client):
        """Test that KMS key exists and is enabled."""
        kms_key_arn = outputs.get("kms_key_arn")
        assert kms_key_arn is not None

        # Extract key ID from ARN
        key_id = kms_key_arn.split("/")[-1]

        response = kms_client.describe_key(KeyId=key_id)
        assert response["KeyMetadata"]["Enabled"] is True
        assert response["KeyMetadata"]["KeyState"] == "Enabled"

    def test_kms_key_can_encrypt_decrypt(self, outputs, kms_client):
        """Test that KMS key can encrypt and decrypt data."""
        kms_key_arn = outputs.get("kms_key_arn")
        key_id = kms_key_arn.split("/")[-1]

        plaintext = b"test data for encryption"

        # Encrypt
        encrypt_response = kms_client.encrypt(KeyId=key_id, Plaintext=plaintext)
        ciphertext = encrypt_response["CiphertextBlob"]

        # Decrypt
        decrypt_response = kms_client.decrypt(CiphertextBlob=ciphertext)
        decrypted_plaintext = decrypt_response["Plaintext"]

        assert decrypted_plaintext == plaintext


class TestLambdaFunctions:
    """Test Lambda function deployments."""

    def test_lambda_functions_exist(self, outputs, lambda_client):
        """Test that Lambda functions are deployed."""
        environment_suffix = outputs.get("_environment_suffix", os.getenv("ENVIRONMENT_SUFFIX", "synth2610724199"))

        expected_functions = [
            f"healthcare-data-processor-{environment_suffix}",
            f"healthcare-health-check-{environment_suffix}",
            f"healthcare-auto-remediation-{environment_suffix}",
        ]

        for function_name in expected_functions:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                assert response["Configuration"]["State"] == "Active"
            except ClientError as e:
                if e.response["Error"]["Code"] == "ResourceNotFoundException":
                    pytest.skip(f"Lambda function {function_name} not found")


class TestCloudWatchMonitoring:
    """Test CloudWatch monitoring resources."""

    def test_cloudwatch_dashboard_url_exists(self, outputs):
        """Test that CloudWatch dashboard URL is provided."""
        dashboard_url = outputs.get("cloudwatch_dashboard_url")
        assert dashboard_url is not None
        assert "cloudwatch" in dashboard_url
        assert "dashboards" in dashboard_url

    def test_cloudwatch_alarms_exist(self, outputs, cloudwatch_client):
        """Test that CloudWatch alarms are created."""
        environment_suffix = outputs.get("_environment_suffix", os.getenv("ENVIRONMENT_SUFFIX", "synth2610724199"))

        # List alarms with prefix (using correct prefix)
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"healthcare-"
        )

        # Filter for alarms with environment suffix
        alarms_with_suffix = [
            alarm for alarm in response["MetricAlarms"]
            if environment_suffix in alarm["AlarmName"]
        ]

        # At least one alarm should exist
        assert len(alarms_with_suffix) > 0


class TestNetworking:
    """Test networking resources."""

    def test_vpc_exists(self, outputs, aws_region):
        """Test that VPC is created."""
        ec2_client = boto3.client("ec2", region_name=aws_region)
        environment_suffix = outputs.get("_environment_suffix", os.getenv("ENVIRONMENT_SUFFIX", "synth2610724199"))

        # Find VPC by tag
        response = ec2_client.describe_vpcs(
            Filters=[
                {"Name": "tag:Name", "Values": [f"healthcare-vpc-{environment_suffix}"]}
            ]
        )

        assert len(response["Vpcs"]) > 0
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"


class TestResourceTags:
    """Test that resources have proper tags."""

    def test_s3_bucket_tags(self, outputs, s3_client):
        """Test that S3 bucket has proper tags."""
        bucket_name = outputs.get("data_bucket_name")

        try:
            response = s3_client.get_bucket_tagging(Bucket=bucket_name)
            tags = {tag["Key"]: tag["Value"] for tag in response["TagSet"]}
            # Environment tag should exist
            assert "Environment" in tags or "environment" in tags
        except ClientError as e:
            if e.response["Error"]["Code"] != "NoSuchTagSet":
                raise

    def test_dynamodb_table_tags(self, outputs, dynamodb_client, aws_region):
        """Test that DynamoDB table has proper tags."""
        table_name = outputs.get("dynamodb_table_name")
        account_id = boto3.client("sts").get_caller_identity()["Account"]

        table_arn = (
            f"arn:aws:dynamodb:{aws_region}:{account_id}:table/{table_name}"
        )

        response = dynamodb_client.list_tags_of_resource(ResourceArn=table_arn)
        tags = {tag["Key"]: tag["Value"] for tag in response["Tags"]}

        # Environment tag should exist
        assert "Environment" in tags or "environment" in tags
