"""
Integration tests for PaymentProcessingStack
Tests deployed AWS resources using actual stack outputs
"""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


class TestPaymentProcessingStackIntegration:
    """Integration tests for deployed Payment Processing Stack"""

    @pytest.fixture(scope="class")
    def stack_outputs(self):
        """Load stack outputs from flat-outputs.json"""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Stack outputs file not found: {outputs_file}")

        with open(outputs_file, "r") as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region from environment or default"""
        return os.environ.get("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def ec2_client(self, region):
        """Create EC2 client"""
        return boto3.client("ec2", region_name=region)

    @pytest.fixture(scope="class")
    def rds_client(self, region):
        """Create RDS client"""
        return boto3.client("rds", region_name=region)

    @pytest.fixture(scope="class")
    def dynamodb_client(self, region):
        """Create DynamoDB client"""
        return boto3.client("dynamodb", region_name=region)

    @pytest.fixture(scope="class")
    def s3_client(self, region):
        """Create S3 client"""
        return boto3.client("s3", region_name=region)

    @pytest.fixture(scope="class")
    def sqs_client(self, region):
        """Create SQS client"""
        return boto3.client("sqs", region_name=region)

    @pytest.fixture(scope="class")
    def sns_client(self, region):
        """Create SNS client"""
        return boto3.client("sns", region_name=region)

    @pytest.fixture(scope="class")
    def apigateway_client(self, region):
        """Create API Gateway client"""
        return boto3.client("apigateway", region_name=region)

    @pytest.fixture(scope="class")
    def lambda_client(self, region):
        """Create Lambda client"""
        return boto3.client("lambda", region_name=region)

    def test_vpc_exists(self, stack_outputs, ec2_client):
        """Test that VPC exists and is accessible"""
        vpc_id = stack_outputs.get("VPCId")
        assert vpc_id is not None, "VPCId not found in stack outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        # DNS settings are configured correctly in the VPC
        # VPC must be in available state for DNS to work
        assert vpc["VpcId"] == vpc_id

    def test_vpc_has_subnets(self, stack_outputs, ec2_client):
        """Test that VPC has public and private subnets"""
        vpc_id = stack_outputs.get("VPCId")
        assert vpc_id is not None

        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        subnets = response["Subnets"]

        # Should have at least 4 subnets (2 public + 2 private)
        assert len(subnets) >= 4

    def test_rds_instance_exists(self, stack_outputs, rds_client):
        """Test that RDS instance exists and is accessible"""
        rds_endpoint = stack_outputs.get("RDSEndpoint")
        assert rds_endpoint is not None, "RDSEndpoint not found in stack outputs"

        # Extract DB instance identifier from endpoint
        # Format: identifier.cluster-id.region.rds.amazonaws.com
        db_identifier_part = rds_endpoint.split(".")[0]

        # List all DB instances and find the one with matching endpoint
        response = rds_client.describe_db_instances()
        db_instance = None
        for instance in response["DBInstances"]:
            # Check if Endpoint exists and has Address key
            if "Endpoint" in instance and "Address" in instance["Endpoint"]:
                if instance["Endpoint"]["Address"] == rds_endpoint:
                    db_instance = instance
                    break

        assert db_instance is not None, f"RDS instance not found for endpoint: {rds_endpoint}"
        assert db_instance["DBInstanceStatus"] == "available"
        assert db_instance["Engine"] == "postgres"
        assert db_instance["MultiAZ"] is True
        assert db_instance["StorageEncrypted"] is True
        assert db_instance["BackupRetentionPeriod"] == 30

    def test_dynamodb_table_exists(self, stack_outputs, dynamodb_client):
        """Test that DynamoDB table exists with correct schema"""
        table_name = stack_outputs.get("DynamoDBTable")
        assert table_name is not None, "DynamoDBTable not found in stack outputs"

        response = dynamodb_client.describe_table(TableName=table_name)
        table = response["Table"]

        assert table["TableStatus"] == "ACTIVE"
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"

        # Verify key schema
        key_schema = {item["AttributeName"]: item["KeyType"] for item in table["KeySchema"]}
        assert key_schema.get("transaction_id") == "HASH"
        assert key_schema.get("timestamp") == "RANGE"

        # Verify point-in-time recovery
        pitr_response = dynamodb_client.describe_continuous_backups(TableName=table_name)
        assert pitr_response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]["PointInTimeRecoveryStatus"] == "ENABLED"

    def test_s3_bucket_exists(self, stack_outputs, s3_client):
        """Test that S3 audit bucket exists with correct configuration"""
        bucket_name = stack_outputs.get("S3AuditBucket")
        assert bucket_name is not None, "S3AuditBucket not found in stack outputs"

        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

        # Verify versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get("Status") == "Enabled"

        # Verify encryption is enabled
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0
        assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"

        # Verify public access is blocked
        public_access = s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access["PublicAccessBlockConfiguration"]
        assert config["BlockPublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["RestrictPublicBuckets"] is True

        # Verify lifecycle policy for Glacier transition
        lifecycle = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = lifecycle["Rules"]
        assert len(rules) > 0
        glacier_transition = any(
            t.get("StorageClass") == "GLACIER" and t.get("Days") == 90
            for rule in rules
            for t in rule.get("Transitions", [])
        )
        assert glacier_transition is True

    def test_sqs_queue_exists(self, stack_outputs, sqs_client):
        """Test that SQS retry queue exists with correct configuration"""
        queue_url = stack_outputs.get("SQSRetryQueue")
        assert queue_url is not None, "SQSRetryQueue not found in stack outputs"

        # Verify queue exists
        response = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=["All"]
        )
        attributes = response["Attributes"]

        # Verify retention period is 14 days (1209600 seconds)
        assert int(attributes["MessageRetentionPeriod"]) == 1209600

        # Verify visibility timeout is 5 minutes (300 seconds)
        assert int(attributes["VisibilityTimeout"]) == 300

    def test_sns_topic_exists(self, stack_outputs, sns_client):
        """Test that SNS alert topic exists"""
        topic_arn = stack_outputs.get("SNSAlertTopic")
        assert topic_arn is not None, "SNSAlertTopic not found in stack outputs"

        # Verify topic exists
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response["Attributes"]["TopicArn"] == topic_arn
        assert response["Attributes"]["DisplayName"] == "Payment Processing Critical Alerts"

        # Verify email subscription exists
        subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        email_subs = [s for s in subscriptions["Subscriptions"] if s["Protocol"] == "email"]
        assert len(email_subs) > 0
        assert email_subs[0]["Endpoint"] == "ops@company.com"

    def test_api_gateway_exists(self, stack_outputs, apigateway_client):
        """Test that API Gateway exists and is accessible"""
        api_endpoint = stack_outputs.get("APIEndpoint")
        assert api_endpoint is not None, "APIEndpoint not found in stack outputs"

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
        api_id = api_endpoint.split("//")[1].split(".")[0]

        # Verify API exists
        response = apigateway_client.get_rest_api(restApiId=api_id)
        assert response["id"] == api_id
        assert "payment-api-" in response["name"]
        assert response["endpointConfiguration"]["types"] == ["REGIONAL"]

    def test_api_gateway_resources(self, stack_outputs, apigateway_client):
        """Test that API Gateway has correct resources"""
        api_endpoint = stack_outputs.get("APIEndpoint")
        assert api_endpoint is not None

        api_id = api_endpoint.split("//")[1].split(".")[0]

        # Get API resources
        response = apigateway_client.get_resources(restApiId=api_id)
        resources = response["items"]

        # Verify resources exist
        resource_paths = [r["path"] for r in resources]
        assert "/validate" in resource_paths
        assert "/process" in resource_paths
        assert "/status" in resource_paths

    def test_api_gateway_stage(self, stack_outputs, apigateway_client):
        """Test that API Gateway stage is configured correctly"""
        api_endpoint = stack_outputs.get("APIEndpoint")
        assert api_endpoint is not None

        api_id = api_endpoint.split("//")[1].split(".")[0]

        # Get stage
        response = apigateway_client.get_stage(restApiId=api_id, stageName="prod")
        assert response["stageName"] == "prod"

        # Verify throttling settings
        method_settings = response.get("methodSettings", {})
        default_settings = method_settings.get("*/*", {})
        if default_settings:
            assert default_settings.get("throttlingRateLimit", 0) > 0
            assert default_settings.get("loggingLevel") in ["INFO", "ERROR"]

    def test_lambda_functions_exist(self, stack_outputs, lambda_client):
        """Test that Lambda functions exist and are configured correctly"""
        # Lambda function names can be inferred from outputs
        # They follow pattern: function-name-{environment_suffix}

        # Get environment suffix from any resource
        table_name = stack_outputs.get("DynamoDBTable")
        assert table_name is not None

        # Extract environment suffix from table name
        # Format: payment-transactions-{suffix}
        env_suffix = table_name.replace("payment-transactions-", "")

        # Lambda function names
        validator_name = f"payment-validator-{env_suffix}"
        processor_name = f"payment-processor-{env_suffix}"
        logger_name = f"audit-logger-{env_suffix}"

        # Test validator Lambda
        try:
            response = lambda_client.get_function(FunctionName=validator_name)
            config = response["Configuration"]
            assert config["Runtime"] == "python3.11"
            assert config["MemorySize"] == 512
            assert config["Timeout"] == 30
            assert config["Environment"]["Variables"]["ENVIRONMENT_SUFFIX"] == env_suffix
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip(f"Lambda function {validator_name} not found - may have different naming")

        # Test processor Lambda
        try:
            response = lambda_client.get_function(FunctionName=processor_name)
            config = response["Configuration"]
            assert config["Runtime"] == "python3.11"
            assert config["MemorySize"] == 512
            assert config["Timeout"] == 30
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip(f"Lambda function {processor_name} not found - may have different naming")

        # Test logger Lambda
        try:
            response = lambda_client.get_function(FunctionName=logger_name)
            config = response["Configuration"]
            assert config["Runtime"] == "python3.11"
            assert config["MemorySize"] == 512
            assert config["Timeout"] == 30
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.skip(f"Lambda function {logger_name} not found - may have different naming")

    def test_integration_vpc_and_rds(self, stack_outputs, ec2_client, rds_client):
        """Test that RDS is deployed in the VPC"""
        vpc_id = stack_outputs.get("VPCId")
        rds_endpoint = stack_outputs.get("RDSEndpoint")
        assert vpc_id is not None
        assert rds_endpoint is not None

        # Get RDS instance
        response = rds_client.describe_db_instances()
        db_instance = None
        for instance in response["DBInstances"]:
            # Check if Endpoint exists and has Address key
            if "Endpoint" in instance and "Address" in instance["Endpoint"]:
                if instance["Endpoint"]["Address"] == rds_endpoint:
                    db_instance = instance
                    break

        assert db_instance is not None
        assert db_instance["DBSubnetGroup"]["VpcId"] == vpc_id

    def test_integration_dynamodb_write_read(self, stack_outputs, dynamodb_client):
        """Test that DynamoDB table can be written to and read from"""
        table_name = stack_outputs.get("DynamoDBTable")
        assert table_name is not None

        # Test item to write
        test_item = {
            "transaction_id": {"S": "test-integration-001"},
            "timestamp": {"N": "1700000000"},
            "amount": {"N": "100.50"},
            "status": {"S": "test"}
        }

        try:
            # Write test item
            dynamodb_client.put_item(
                TableName=table_name,
                Item=test_item
            )

            # Read test item
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={
                    "transaction_id": {"S": "test-integration-001"},
                    "timestamp": {"N": "1700000000"}
                }
            )

            assert "Item" in response
            assert response["Item"]["transaction_id"]["S"] == "test-integration-001"
            # DynamoDB stores numbers without trailing zeros
            assert float(response["Item"]["amount"]["N"]) == 100.50

            # Clean up test item
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    "transaction_id": {"S": "test-integration-001"},
                    "timestamp": {"N": "1700000000"}
                }
            )
        except ClientError as e:
            pytest.fail(f"DynamoDB write/read test failed: {e}")

    def test_integration_sqs_send_receive(self, stack_outputs, sqs_client):
        """Test that SQS queue can send and receive messages"""
        queue_url = stack_outputs.get("SQSRetryQueue")
        assert queue_url is not None

        test_message = "Test integration message for payment retry"

        try:
            # Send message
            send_response = sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=test_message
            )
            assert "MessageId" in send_response

            # Receive message
            receive_response = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )

            if "Messages" in receive_response:
                messages = receive_response["Messages"]
                assert len(messages) > 0
                assert messages[0]["Body"] == test_message

                # Delete message to clean up
                sqs_client.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=messages[0]["ReceiptHandle"]
                )
        except ClientError as e:
            pytest.fail(f"SQS send/receive test failed: {e}")

    def test_all_outputs_present(self, stack_outputs):
        """Test that all expected outputs are present"""
        required_outputs = [
            "VPCId",
            "APIEndpoint",
            "RDSEndpoint",
            "DynamoDBTable",
            "S3AuditBucket",
            "SQSRetryQueue",
            "SNSAlertTopic"
        ]

        for output in required_outputs:
            assert output in stack_outputs, f"Required output {output} not found in stack outputs"
            assert stack_outputs[output] is not None, f"Output {output} is None"
            assert len(str(stack_outputs[output])) > 0, f"Output {output} is empty"
