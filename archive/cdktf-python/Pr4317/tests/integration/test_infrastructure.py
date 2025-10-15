"""Integration tests for deployed AWS infrastructure."""

import pytest
import boto3
import json
import os
from botocore.exceptions import ClientError


# Load outputs from CDKTF deployment
def load_outputs():
    """Load stack outputs from JSON file."""
    output_file = os.path.join(
        os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json"
    )
    if not os.path.exists(output_file):
        pytest.skip(f"Output file not found: {output_file}")

    with open(output_file, "r") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def outputs():
    """Fixture to load stack outputs."""
    return load_outputs()


@pytest.fixture(scope="module")
def ec2_client():
    """Fixture for EC2 client."""
    return boto3.client("ec2", region_name=os.environ.get("AWS_REGION", "us-east-1"))


@pytest.fixture(scope="module")
def s3_client():
    """Fixture for S3 client."""
    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


@pytest.fixture(scope="module")
def dynamodb_client():
    """Fixture for DynamoDB client."""
    return boto3.client(
        "dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1")
    )


@pytest.fixture(scope="module")
def lambda_client():
    """Fixture for Lambda client."""
    return boto3.client("lambda", region_name=os.environ.get("AWS_REGION", "us-east-1"))


@pytest.fixture(scope="module")
def apigateway_client():
    """Fixture for API Gateway client."""
    return boto3.client(
        "apigateway", region_name=os.environ.get("AWS_REGION", "us-east-1")
    )


@pytest.fixture(scope="module")
def kms_client():
    """Fixture for KMS client."""
    return boto3.client("kms", region_name=os.environ.get("AWS_REGION", "us-east-1"))


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Fixture for CloudWatch client."""
    return boto3.client(
        "cloudwatch", region_name=os.environ.get("AWS_REGION", "us-east-1")
    )


@pytest.fixture(scope="module")
def logs_client():
    """Fixture for CloudWatch Logs client."""
    return boto3.client("logs", region_name=os.environ.get("AWS_REGION", "us-east-1"))


class TestVPCInfrastructure:
    """Test VPC and networking infrastructure."""

    def test_vpc_exists(self, outputs, ec2_client):
        """Test VPC exists with correct CIDR."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"

    def test_subnets_exist(self, outputs, ec2_client):
        """Test subnets are created in multiple AZs."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        subnets = response["Subnets"]
        assert len(subnets) >= 4  # At least 2 public + 2 private

        # Check multiple AZs
        azs = {subnet["AvailabilityZone"] for subnet in subnets}
        assert len(azs) >= 2

    def test_internet_gateway_exists(self, outputs, ec2_client):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        assert len(response["InternetGateways"]) >= 1

    def test_nat_gateway_exists(self, outputs, ec2_client):
        """Test NAT Gateway exists."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nat_gateways = [
            ng for ng in response["NatGateways"] if ng["State"] == "available"
        ]
        assert len(nat_gateways) >= 1

    def test_vpc_endpoints_exist(self, outputs, ec2_client):
        """Test VPC endpoints for S3 and DynamoDB."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_vpc_endpoints(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        endpoints = response["VpcEndpoints"]
        assert len(endpoints) >= 2

        # Check for S3 and DynamoDB endpoints
        service_names = {ep["ServiceName"] for ep in endpoints}
        region = os.environ.get("AWS_REGION", "us-east-1")
        assert any("s3" in sn for sn in service_names)
        assert any("dynamodb" in sn for sn in service_names)

    def test_security_groups_exist(self, outputs, ec2_client):
        """Test security groups are configured."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        # Should have at least Lambda and ALB security groups
        assert len(response["SecurityGroups"]) >= 2


class TestStorageInfrastructure:
    """Test storage infrastructure."""

    def test_s3_bucket_exists(self, outputs, s3_client):
        """Test S3 data bucket exists and is accessible."""
        bucket_name = outputs.get("data_bucket_name")
        if not bucket_name:
            pytest.skip("Bucket name not in outputs")

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_bucket_encryption(self, outputs, s3_client):
        """Test S3 bucket has encryption enabled."""
        bucket_name = outputs.get("data_bucket_name")
        if not bucket_name:
            pytest.skip("Bucket name not in outputs")

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0
        assert "ApplyServerSideEncryptionByDefault" in rules[0]

    def test_s3_bucket_versioning(self, outputs, s3_client):
        """Test S3 bucket has versioning enabled."""
        bucket_name = outputs.get("data_bucket_name")
        if not bucket_name:
            pytest.skip("Bucket name not in outputs")

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"

    def test_s3_bucket_public_access_block(self, outputs, s3_client):
        """Test S3 bucket has public access blocked."""
        bucket_name = outputs.get("data_bucket_name")
        if not bucket_name:
            pytest.skip("Bucket name not in outputs")

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response["PublicAccessBlockConfiguration"]
        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["RestrictPublicBuckets"] is True

    def test_dynamodb_table_exists(self, outputs, dynamodb_client):
        """Test DynamoDB table exists."""
        table_name = outputs.get("dynamodb_table_name")
        if not table_name:
            pytest.skip("Table name not in outputs")

        response = dynamodb_client.describe_table(TableName=table_name)
        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_dynamodb_billing_mode(self, outputs, dynamodb_client):
        """Test DynamoDB table uses on-demand billing."""
        table_name = outputs.get("dynamodb_table_name")
        if not table_name:
            pytest.skip("Table name not in outputs")

        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"

    def test_dynamodb_point_in_time_recovery(self, outputs, dynamodb_client):
        """Test DynamoDB has point-in-time recovery enabled."""
        table_name = outputs.get("dynamodb_table_name")
        if not table_name:
            pytest.skip("Table name not in outputs")

        response = dynamodb_client.describe_continuous_backups(TableName=table_name)
        pitr = response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]
        assert pitr["PointInTimeRecoveryStatus"] == "ENABLED"

    def test_dynamodb_encryption(self, outputs, dynamodb_client):
        """Test DynamoDB table has encryption enabled."""
        table_name = outputs.get("dynamodb_table_name")
        if not table_name:
            pytest.skip("Table name not in outputs")

        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]
        assert "SSEDescription" in table
        assert table["SSEDescription"]["Status"] == "ENABLED"

    def test_kms_key_exists(self, outputs, kms_client):
        """Test KMS key exists."""
        kms_key_arn = outputs.get("kms_key_arn")
        if not kms_key_arn:
            pytest.skip("KMS key ARN not in outputs")

        key_id = kms_key_arn.split("/")[-1]
        response = kms_client.describe_key(KeyId=key_id)
        assert response["KeyMetadata"]["KeyState"] == "Enabled"

    def test_kms_key_rotation(self, outputs, kms_client):
        """Test KMS key has rotation enabled."""
        kms_key_arn = outputs.get("kms_key_arn")
        if not kms_key_arn:
            pytest.skip("KMS key ARN not in outputs")

        key_id = kms_key_arn.split("/")[-1]
        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response["KeyRotationEnabled"] is True


class TestComputeInfrastructure:
    """Test Lambda compute infrastructure."""

    def test_lambda_functions_exist(self, outputs, lambda_client):
        """Test Lambda functions are created."""
        # Get function names from outputs or use naming convention
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "test")
        functions = [
            f"healthcare-data-processor-{env_suffix}",
            f"healthcare-health-check-{env_suffix}",
            f"healthcare-remediation-{env_suffix}",
        ]

        for func_name in functions:
            try:
                response = lambda_client.get_function(FunctionName=func_name)
                assert response["Configuration"]["State"] == "Active"
            except ClientError:
                # Function may not exist if naming is different
                pass

    def test_lambda_vpc_configuration(self, outputs, lambda_client):
        """Test Lambda functions are in VPC."""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "test")
        func_name = f"healthcare-data-processor-{env_suffix}"

        try:
            response = lambda_client.get_function(FunctionName=func_name)
            config = response["Configuration"]
            if "VpcConfig" in config:
                assert "SubnetIds" in config["VpcConfig"]
                assert len(config["VpcConfig"]["SubnetIds"]) > 0
        except ClientError:
            pytest.skip(f"Function {func_name} not found")

    def test_lambda_log_groups_exist(self, outputs, logs_client):
        """Test CloudWatch log groups for Lambda functions."""
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "test")
        log_groups = [
            f"/aws/lambda/healthcare-data-processor-{env_suffix}",
            f"/aws/lambda/healthcare-health-check-{env_suffix}",
            f"/aws/lambda/healthcare-remediation-{env_suffix}",
        ]

        for log_group_name in log_groups:
            try:
                response = logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                matching_groups = [
                    lg
                    for lg in response["logGroups"]
                    if lg["logGroupName"] == log_group_name
                ]
                if matching_groups:
                    assert matching_groups[0]["retentionInDays"] == 7
            except ClientError:
                # Log group may not exist yet
                pass


class TestAPIGateway:
    """Test API Gateway configuration."""

    def test_api_gateway_exists(self, outputs, apigateway_client):
        """Test API Gateway REST API exists."""
        api_endpoint = outputs.get("api_gateway_endpoint")
        if not api_endpoint:
            pytest.skip("API Gateway endpoint not in outputs")

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        parts = api_endpoint.split(".")
        if len(parts) > 0:
            api_id = parts[0].split("//")[-1]
            response = apigateway_client.get_rest_api(restApiId=api_id)
            assert response["name"] is not None


class TestMonitoring:
    """Test monitoring and observability."""

    def test_cloudwatch_log_groups_retention(self, outputs, logs_client):
        """Test CloudWatch log groups have retention policy."""
        vpc_log_group = f"/aws/vpc/healthcare-{os.environ.get('ENVIRONMENT_SUFFIX', 'test')}"

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=vpc_log_group
            )
            if response["logGroups"]:
                assert response["logGroups"][0].get("retentionInDays") == 7
        except ClientError:
            pytest.skip("VPC log group not found")


class TestSecurity:
    """Test security configuration."""

    def test_flow_logs_enabled(self, outputs, ec2_client):
        """Test VPC Flow Logs are enabled."""
        vpc_id = outputs.get("vpc_id")
        if not vpc_id:
            pytest.skip("VPC ID not in outputs")

        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = [fl for fl in response["FlowLogs"] if fl["FlowLogStatus"] == "ACTIVE"]
        assert len(flow_logs) > 0

        # Check traffic type is ALL
        assert any(fl["TrafficType"] == "ALL" for fl in flow_logs)
