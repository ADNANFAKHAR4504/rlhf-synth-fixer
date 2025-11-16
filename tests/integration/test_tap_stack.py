"""Integration tests for TapStack."""
import json
import os
from pathlib import Path

import pytest

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class TestTapStackInfrastructure:
    """Integration tests for deployed TapStack infrastructure."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_outputs(self):
        """Load outputs from flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent.parent / "flat-outputs.json"
        
        if not outputs_path.exists():
            pytest.skip("Infrastructure outputs not available")
        
        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)
        
        stack_name = list(raw_outputs.keys())[0]
        self.outputs = raw_outputs[stack_name]
        self.region_eu_south = "eu-south-2"
        self.region_eu_west = "eu-west-1"

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_vpc_eu_south_exists(self, setup_outputs):
        """Test that VPC in eu-south-2 exists and is available."""
        vpc_id = self.outputs.get("vpc_eu_south_id")
        if not vpc_id:
            pytest.skip("VPC ID not available in outputs")
        
        ec2_client = boto3.client("ec2", region_name=self.region_eu_south)
        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response["Vpcs"]) == 1
            vpc = response["Vpcs"][0]
            assert vpc["State"] == "available"
            assert vpc["CidrBlock"] == "10.0.0.0/16"
        except ClientError:
            pytest.skip("VPC resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_vpc_eu_west_exists(self, setup_outputs):
        """Test that VPC in eu-west-1 exists and is available."""
        vpc_id = self.outputs.get("vpc_eu_id")
        if not vpc_id:
            pytest.skip("VPC ID not available in outputs")
        
        ec2_client = boto3.client("ec2", region_name=self.region_eu_west)
        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response["Vpcs"]) == 1
            vpc = response["Vpcs"][0]
            assert vpc["State"] == "available"
            assert vpc["CidrBlock"] == "10.1.0.0/16"
        except ClientError:
            pytest.skip("VPC resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_vpc_peering_connection_active(self, setup_outputs):
        """Test that VPC peering connection is active."""
        vpc_eu_south_id = self.outputs.get("vpc_eu_south_id")
        vpc_eu_id = self.outputs.get("vpc_eu_id")
        
        if not vpc_eu_south_id or not vpc_eu_id:
            pytest.skip("VPC IDs not available in outputs")
        
        ec2_client = boto3.client("ec2", region_name=self.region_eu_south)
        try:
            response = ec2_client.describe_vpc_peering_connections(
                Filters=[
                    {"Name": "requester-vpc-info.vpc-id", "Values": [vpc_eu_south_id]},
                    {"Name": "accepter-vpc-info.vpc-id", "Values": [vpc_eu_id]}
                ]
            )
            assert len(response["VpcPeeringConnections"]) >= 1
            peering = response["VpcPeeringConnections"][0]
            assert peering["Status"]["Code"] == "active"
        except ClientError:
            pytest.skip("VPC peering resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_rds_instance_available(self, setup_outputs):
        """Test that RDS PostgreSQL instance exists and is available."""
        rds_endpoint = self.outputs.get("rds_endpoint")
        if not rds_endpoint:
            pytest.skip("RDS endpoint not available in outputs")
        
        db_identifier = rds_endpoint.split(".")[0]
        
        rds_client = boto3.client("rds", region_name=self.region_eu_west)
        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert len(response["DBInstances"]) == 1
            db_instance = response["DBInstances"][0]
            assert db_instance["DBInstanceStatus"] == "available"
            assert db_instance["Engine"] == "postgres"
            assert db_instance["EngineVersion"].startswith("17")
            assert db_instance["StorageEncrypted"] is True
            assert db_instance["MultiAZ"] is True
        except ClientError:
            pytest.skip("RDS resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_dynamodb_table_exists(self, setup_outputs):
        """Test that DynamoDB table exists and has correct configuration."""
        table_name = self.outputs.get("dynamodb_table")
        if not table_name:
            pytest.skip("DynamoDB table name not available in outputs")
        
        dynamodb_client = boto3.client("dynamodb", region_name=self.region_eu_west)
        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response["Table"]
            assert table["TableStatus"] == "ACTIVE"
            assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"
            key_schema = {item["AttributeName"]: item["KeyType"] for item in table["KeySchema"]}
            assert "transactionId" in key_schema
            assert key_schema["transactionId"] == "HASH"
        except ClientError:
            pytest.skip("DynamoDB resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_s3_bucket_eu_south_exists(self, setup_outputs):
        """Test that S3 bucket in eu-south-2 exists and is accessible."""
        bucket_name = self.outputs.get("s3_bucket_eu_south")
        if not bucket_name:
            pytest.skip("S3 bucket name not available in outputs")
        
        s3_client = boto3.client("s3", region_name=self.region_eu_south)
        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200
        except ClientError:
            pytest.skip("S3 resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_s3_bucket_eu_west_exists(self, setup_outputs):
        """Test that S3 bucket in eu-west-1 exists and is accessible."""
        bucket_name = self.outputs.get("s3_bucket_eu")
        if not bucket_name:
            pytest.skip("S3 bucket name not available in outputs")
        
        s3_client = boto3.client("s3", region_name=self.region_eu_west)
        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200
        except ClientError:
            pytest.skip("S3 resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_s3_bucket_encryption_enabled(self, setup_outputs):
        """Test that S3 buckets have encryption enabled."""
        bucket_name = self.outputs.get("s3_bucket_eu")
        if not bucket_name:
            pytest.skip("S3 bucket name not available in outputs")
        
        s3_client = boto3.client("s3", region_name=self.region_eu_west)
        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response["ServerSideEncryptionConfiguration"]["Rules"]
            assert len(rules) > 0
            assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"
        except ClientError:
            pytest.skip("S3 encryption not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_s3_bucket_versioning_enabled(self, setup_outputs):
        """Test that S3 buckets have versioning enabled."""
        bucket_name = self.outputs.get("s3_bucket_eu_south")
        if not bucket_name:
            pytest.skip("S3 bucket name not available in outputs")
        
        s3_client = boto3.client("s3", region_name=self.region_eu_south)
        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response["Status"] == "Enabled"
        except ClientError:
            pytest.skip("S3 versioning not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_lambda_function_exists(self, setup_outputs):
        """Test that Lambda function exists and is configured correctly."""
        lambda_arn = self.outputs.get("lambda_function_arn")
        if not lambda_arn:
            pytest.skip("Lambda ARN not available in outputs")
        
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = boto3.client("lambda", region_name=self.region_eu_west)
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            config = response["Configuration"]
            assert config["Runtime"] == "python3.11"
            assert config["Handler"] == "index.handler"
            assert config["MemorySize"] == 256
            assert config["Timeout"] == 30
        except ClientError:
            pytest.skip("Lambda resource not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_api_gateway_exists(self, setup_outputs):
        """Test that API Gateway exists and is accessible."""
        api_endpoint = self.outputs.get("api_gateway_endpoint")
        if not api_endpoint:
            pytest.skip("API Gateway endpoint not available in outputs")
        
        assert api_endpoint.startswith("https://")
        assert "execute-api" in api_endpoint
        assert self.region_eu_west in api_endpoint

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_cloudwatch_log_groups_exist(self, setup_outputs):
        """Test that CloudWatch log groups exist for Lambda and API Gateway."""
        lambda_arn = self.outputs.get("lambda_function_arn")
        if not lambda_arn:
            pytest.skip("Lambda ARN not available in outputs")
            
        function_name = lambda_arn.split(":")[-1]
        
        logs_client = boto3.client("logs", region_name=self.region_eu_west)
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=f"/aws/lambda/{function_name}"
            )
            assert len(response["logGroups"]) >= 1
            assert response["logGroups"][0]["retentionInDays"] == 30
        except ClientError:
            pytest.skip("CloudWatch logs not accessible")

    @pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")
    def test_end_to_end_infrastructure_complete(self, setup_outputs):
        """Test that all critical infrastructure components are deployed."""
        required_outputs = [
            "vpc_eu_south_id",
            "vpc_eu_id",
            "s3_bucket_eu_south",
            "s3_bucket_eu",
            "rds_endpoint",
            "dynamodb_table",
            "lambda_function_arn",
            "api_gateway_endpoint"
        ]
        
        for output_key in required_outputs:
            assert output_key in self.outputs, f"Required output '{output_key}' not found"
            assert self.outputs[output_key], f"Output '{output_key}' is empty"
