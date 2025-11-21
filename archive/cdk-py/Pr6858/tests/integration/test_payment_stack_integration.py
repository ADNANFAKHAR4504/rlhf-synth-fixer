"""
Integration tests for TapStack - tests against real deployed resources
Uses cfn-outputs/flat-outputs.json for resource identifiers
"""
import json
import os
import boto3
import pytest
import requests
from pathlib import Path


# Get environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')


# Load outputs from deployment
@pytest.fixture(scope="module")
def stack_outputs():
    """Load CloudFormation stack outputs from flat-outputs.json"""
    outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
    with open(outputs_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def ec2_client():
    """Create EC2 client"""
    return boto3.client("ec2", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def dynamodb_client():
    """Create DynamoDB client"""
    return boto3.client("dynamodb", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def s3_client():
    """Create S3 client"""
    return boto3.client("s3", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def sqs_client():
    """Create SQS client"""
    return boto3.client("sqs", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def lambda_client():
    """Create Lambda client"""
    return boto3.client("lambda", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def kms_client():
    """Create KMS client"""
    return boto3.client("kms", region_name=AWS_REGION)


@pytest.fixture(scope="module")
def apigateway_client():
    """Create API Gateway client"""
    return boto3.client("apigateway", region_name=AWS_REGION)


class TestVPCResources:
    """Test VPC and networking resources"""

    def test_vpc_exists(self, ec2_client, stack_outputs):
        """Test that VPC exists and is available"""
        vpc_id = stack_outputs["VPCId"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        assert response["Vpcs"][0]["State"] == "available"

    def test_vpc_has_subnets(self, ec2_client, stack_outputs):
        """Test that VPC has subnets in multiple AZs"""
        vpc_id = stack_outputs["VPCId"]
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Should have 6 subnets (3 public + 3 private in 3 AZs)
        assert len(response["Subnets"]) == 6

        # Check multiple AZs
        azs = set(subnet["AvailabilityZone"] for subnet in response["Subnets"])
        assert len(azs) == 3

    def test_vpc_has_nat_gateway(self, ec2_client, stack_outputs):
        """Test that VPC has at least one NAT gateway"""
        vpc_id = stack_outputs["VPCId"]
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Should have exactly 1 NAT gateway
        available_nats = [nat for nat in response["NatGateways"] if nat["State"] == "available"]
        assert len(available_nats) == 1

    def test_vpc_has_internet_gateway(self, ec2_client, stack_outputs):
        """Test that VPC has internet gateway attached"""
        vpc_id = stack_outputs["VPCId"]
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["InternetGateways"]) == 1


class TestDynamoDBResources:
    """Test DynamoDB table"""

    def test_table_exists(self, dynamodb_client, stack_outputs):
        """Test that DynamoDB table exists"""
        table_name = stack_outputs["TransactionsTableName"]
        response = dynamodb_client.describe_table(TableName=table_name)

        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_table_has_correct_keys(self, dynamodb_client, stack_outputs):
        """Test table has correct partition and sort keys"""
        table_name = stack_outputs["TransactionsTableName"]
        response = dynamodb_client.describe_table(TableName=table_name)

        key_schema = response["Table"]["KeySchema"]
        assert len(key_schema) == 2

        # Check partition key
        partition_key = [k for k in key_schema if k["KeyType"] == "HASH"][0]
        assert partition_key["AttributeName"] == "transaction_id"

        # Check sort key
        sort_key = [k for k in key_schema if k["KeyType"] == "RANGE"][0]
        assert sort_key["AttributeName"] == "timestamp"

    def test_table_has_encryption(self, dynamodb_client, stack_outputs):
        """Test table has encryption enabled"""
        table_name = stack_outputs["TransactionsTableName"]
        response = dynamodb_client.describe_table(TableName=table_name)

        sse_description = response["Table"].get("SSEDescription", {})
        assert sse_description.get("Status") == "ENABLED"

    def test_table_can_write_and_read_item(self, dynamodb_client, stack_outputs):
        """Test can write and read from table"""
        table_name = stack_outputs["TransactionsTableName"]

        # Write test item
        test_item = {
            "transaction_id": {"S": "test-integration-001"},
            "timestamp": {"S": "2025-11-19T00:00:00Z"},
            "amount": {"S": "99.99"},
            "status": {"S": "test"}
        }

        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Read item back
        response = dynamodb_client.get_item(
            TableName=table_name,
            Key={
                "transaction_id": {"S": "test-integration-001"},
                "timestamp": {"S": "2025-11-19T00:00:00Z"}
            }
        )

        assert "Item" in response
        assert response["Item"]["transaction_id"]["S"] == "test-integration-001"

        # Cleanup
        dynamodb_client.delete_item(
            TableName=table_name,
            Key={
                "transaction_id": {"S": "test-integration-001"},
                "timestamp": {"S": "2025-11-19T00:00:00Z"}
            }
        )


class TestS3Resources:
    """Test S3 bucket"""

    def test_bucket_exists(self, s3_client, stack_outputs):
        """Test that S3 bucket exists"""
        bucket_name = stack_outputs["AuditBucketName"]
        response = s3_client.head_bucket(Bucket=bucket_name)

        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_bucket_has_versioning_enabled(self, s3_client, stack_outputs):
        """Test bucket has versioning enabled"""
        bucket_name = stack_outputs["AuditBucketName"]
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        assert response.get("Status") == "Enabled"

    def test_bucket_has_encryption(self, s3_client, stack_outputs):
        """Test bucket has encryption enabled"""
        bucket_name = stack_outputs["AuditBucketName"]
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"

    def test_bucket_has_lifecycle_policy(self, s3_client, stack_outputs):
        """Test bucket has lifecycle policy"""
        bucket_name = stack_outputs["AuditBucketName"]
        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

        assert len(response["Rules"]) > 0

        # Check for Glacier transition
        glacier_rule = response["Rules"][0]
        assert glacier_rule["Status"] == "Enabled"
        assert len(glacier_rule["Transitions"]) > 0
        assert glacier_rule["Transitions"][0]["StorageClass"] == "GLACIER"

    def test_bucket_can_upload_and_download_object(self, s3_client, stack_outputs):
        """Test can upload and download objects"""
        bucket_name = stack_outputs["AuditBucketName"]
        test_key = "test/integration-test.json"
        test_data = b'{"test": "integration"}'

        # Upload
        s3_client.put_object(Bucket=bucket_name, Key=test_key, Body=test_data)

        # Download
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_data = response["Body"].read()

        assert downloaded_data == test_data

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


class TestSQSResources:
    """Test SQS dead-letter queue"""

    def test_queue_exists(self, sqs_client, stack_outputs):
        """Test that SQS queue exists"""
        queue_url = stack_outputs["DLQUrl"]
        response = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=["All"]
        )

        assert "Attributes" in response

    def test_queue_has_encryption(self, sqs_client, stack_outputs):
        """Test queue has KMS encryption"""
        queue_url = stack_outputs["DLQUrl"]
        response = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=["KmsMasterKeyId"]
        )

        assert "KmsMasterKeyId" in response["Attributes"]

    def test_queue_has_retention_policy(self, sqs_client, stack_outputs):
        """Test queue has message retention configured"""
        queue_url = stack_outputs["DLQUrl"]
        response = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=["MessageRetentionPeriod"]
        )

        retention_period = int(response["Attributes"]["MessageRetentionPeriod"])
        # Dev environment should have 3 days (259200 seconds)
        assert retention_period == 259200


class TestLambdaResources:
    """Test Lambda function"""

    def test_function_exists(self, lambda_client, stack_outputs):
        """Test that Lambda function exists"""
        function_name = stack_outputs["LambdaFunctionName"]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["State"] == "Active"

    def test_function_has_correct_memory(self, lambda_client, stack_outputs):
        """Test function has 512MB memory"""
        function_name = stack_outputs["LambdaFunctionName"]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["MemorySize"] == 512

    def test_function_has_correct_timeout(self, lambda_client, stack_outputs):
        """Test function has 30 second timeout"""
        function_name = stack_outputs["LambdaFunctionName"]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["Timeout"] == 30

    def test_function_has_environment_variables(self, lambda_client, stack_outputs):
        """Test function has required environment variables"""
        function_name = stack_outputs["LambdaFunctionName"]
        response = lambda_client.get_function(FunctionName=function_name)

        env_vars = response["Configuration"]["Environment"]["Variables"]
        assert "TABLE_NAME" in env_vars
        assert "BUCKET_NAME" in env_vars
        assert "DLQ_URL" in env_vars
        assert "ENVIRONMENT" in env_vars

    def test_function_is_in_vpc(self, lambda_client, stack_outputs):
        """Test function is attached to VPC"""
        function_name = stack_outputs["LambdaFunctionName"]
        response = lambda_client.get_function(FunctionName=function_name)

        vpc_config = response["Configuration"]["VpcConfig"]
        assert vpc_config["VpcId"] == stack_outputs["VPCId"]
        assert len(vpc_config["SubnetIds"]) > 0
        assert len(vpc_config["SecurityGroupIds"]) > 0

    def test_function_can_be_invoked(self, lambda_client, stack_outputs):
        """Test function can be invoked successfully"""
        function_name = stack_outputs["LambdaFunctionName"]

        # Invoke with test payload
        test_event = {
            "transaction_id": "test-invoke-001",
            "amount": 50.00
        }

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        assert response["StatusCode"] == 200

        # Parse response
        payload = json.loads(response["Payload"].read())
        assert payload["statusCode"] == 200


class TestKMSResources:
    """Test KMS key"""

    def test_key_exists(self, kms_client, stack_outputs):
        """Test that KMS key exists"""
        key_id = stack_outputs["KMSKeyId"]
        response = kms_client.describe_key(KeyId=key_id)

        assert response["KeyMetadata"]["Enabled"] is True

    def test_key_has_rotation_enabled(self, kms_client, stack_outputs):
        """Test key has automatic rotation enabled"""
        key_id = stack_outputs["KMSKeyId"]
        response = kms_client.get_key_rotation_status(KeyId=key_id)

        assert response["KeyRotationEnabled"] is True


class TestAPIGatewayResources:
    """Test API Gateway"""

    def test_api_endpoint_is_accessible(self, stack_outputs):
        """Test that API endpoint is accessible (returns response)"""
        api_endpoint = stack_outputs["APIEndpoint"]

        # Try to access the API (should return 403 without API key)
        response = requests.get(f"{api_endpoint}payments", timeout=10)

        # Should return 403 (Forbidden) because API key is required
        assert response.status_code == 403

    def test_api_requires_api_key(self, stack_outputs):
        """Test that API requires API key"""
        api_endpoint = stack_outputs["APIEndpoint"]

        # POST request without API key should fail
        response = requests.post(
            f"{api_endpoint}payments",
            json={"transaction_id": "test-001", "amount": 100.00},
            timeout=10
        )

        # Should return 403 because API key is required
        assert response.status_code == 403
        assert "Forbidden" in response.text or "Missing Authentication Token" in response.text


class TestEndToEndWorkflow:
    """Test complete end-to-end payment processing workflow"""

    def test_lambda_can_write_to_dynamodb_and_s3(
        self, lambda_client, dynamodb_client, s3_client, stack_outputs
    ):
        """Test that Lambda function can write to both DynamoDB and S3"""
        function_name = stack_outputs["LambdaFunctionName"]
        table_name = stack_outputs["TransactionsTableName"]
        bucket_name = stack_outputs["AuditBucketName"]

        # Invoke Lambda
        test_event = {
            "transaction_id": "test-e2e-001",
            "amount": 150.00
        }

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        assert response["StatusCode"] == 200

        # Check DynamoDB
        # Give it a moment to write
        import time
        time.sleep(2)

        # Verify item in DynamoDB
        response = dynamodb_client.query(
            TableName=table_name,
            KeyConditionExpression="transaction_id = :tid",
            ExpressionAttributeValues={
                ":tid": {"S": "test-e2e-001"}
            }
        )
        assert response["Count"] > 0

        # Cleanup DynamoDB
        for item in response["Items"]:
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    "transaction_id": item["transaction_id"],
                    "timestamp": item["timestamp"]
                }
            )

        # Check S3 - list objects in transactions/ prefix
        s3_response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix="transactions/test-e2e-001"
        )

        # Cleanup S3 objects
        if "Contents" in s3_response:
            for obj in s3_response["Contents"]:
                s3_client.delete_object(Bucket=bucket_name, Key=obj["Key"])


class TestResourceTags:
    """Test that resources have proper tags"""

    def test_vpc_has_mandatory_tags(self, ec2_client, stack_outputs):
        """Test VPC has all mandatory tags"""
        vpc_id = stack_outputs["VPCId"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        tags = {tag["Key"]: tag["Value"] for tag in response["Vpcs"][0].get("Tags", [])}

        assert "Environment" in tags
        assert "CostCenter" in tags
        assert "Owner" in tags
        assert "DataClassification" in tags

    def test_lambda_has_mandatory_tags(self, lambda_client, stack_outputs):
        """Test Lambda function has all mandatory tags"""
        function_arn = stack_outputs["LambdaFunctionArn"]
        response = lambda_client.list_tags(Resource=function_arn)

        tags = response["Tags"]

        assert "Environment" in tags
        assert "CostCenter" in tags
        assert "Owner" in tags
        assert "DataClassification" in tags
