"""Integration tests for TapStack - Tests live deployed AWS resources."""
import json
import os
import uuid
import time

import boto3


# Read outputs from flat-outputs.json
outputs_path = os.path.join(os.getcwd(), "cfn-outputs", "flat-outputs.json")
raw_outputs = json.load(open(outputs_path, "r", encoding="utf-8"))

# Handle nested CDKTF output format: {"TapStackxxx": {"key": "value"}}
# Flatten by merging all stack outputs into a single dict
outputs = {}
for key, value in raw_outputs.items():
    if isinstance(value, dict):
        # Nested format - merge the inner dict
        outputs.update(value)
    else:
        # Flat format - use as-is
        outputs[key] = value

# Get environment variables for region
region = os.environ.get("AWS_REGION", "us-east-1")

# Get outputs from flat-outputs.json
table_name = outputs["dynamodb_table_name"]
bucket_name = outputs["audit_bucket_name"]
lambda_arn = outputs["lambda_arn"]
sns_topic_arn = outputs["sns_topic_arn"]

# Initialize AWS clients
dynamodb_client = boto3.client("dynamodb", region_name=region)
dynamodb_resource = boto3.resource("dynamodb", region_name=region)
s3_client = boto3.client("s3", region_name=region)
lambda_client = boto3.client("lambda", region_name=region)
sns_client = boto3.client("sns", region_name=region)
cloudwatch_client = boto3.client("cloudwatch", region_name=region)


class TestDynamoDBTableIntegration:
    """Integration tests for DynamoDB table."""

    def test_dynamodb_table_exists_and_active(self):
        """Verify DynamoDB table exists and is in ACTIVE state."""
        response = dynamodb_client.describe_table(TableName=table_name)

        assert response["Table"]["TableName"] == table_name
        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_dynamodb_table_has_correct_key_schema(self):
        """Verify DynamoDB table has correct key schema."""
        response = dynamodb_client.describe_table(TableName=table_name)

        key_schema = response["Table"]["KeySchema"]
        hash_key = next(k for k in key_schema if k["KeyType"] == "HASH")
        range_key = next(k for k in key_schema if k["KeyType"] == "RANGE")

        assert hash_key["AttributeName"] == "transaction_id"
        assert range_key["AttributeName"] == "timestamp"

    def test_dynamodb_table_has_pay_per_request_billing(self):
        """Verify DynamoDB table uses PAY_PER_REQUEST billing mode."""
        response = dynamodb_client.describe_table(TableName=table_name)

        billing_mode = response["Table"].get("BillingModeSummary", {}).get(
            "BillingMode", "PAY_PER_REQUEST"
        )
        assert billing_mode == "PAY_PER_REQUEST"

    def test_dynamodb_table_has_point_in_time_recovery_enabled(self):
        """Verify DynamoDB table has point-in-time recovery enabled."""
        response = dynamodb_client.describe_continuous_backups(TableName=table_name)

        pitr_status = response["ContinuousBackupsDescription"][
            "PointInTimeRecoveryDescription"
        ]["PointInTimeRecoveryStatus"]
        assert pitr_status == "ENABLED"

    def test_dynamodb_table_has_gsi_status_index(self):
        """Verify DynamoDB table has status-index GSI."""
        response = dynamodb_client.describe_table(TableName=table_name)

        gsi_list = response["Table"].get("GlobalSecondaryIndexes", [])
        status_index = next(
            (gsi for gsi in gsi_list if gsi["IndexName"] == "status-index"), None
        )

        assert status_index is not None
        assert status_index["IndexStatus"] == "ACTIVE"

    def test_dynamodb_table_has_stream_enabled(self):
        """Verify DynamoDB table has streams enabled."""
        response = dynamodb_client.describe_table(TableName=table_name)

        stream_spec = response["Table"].get("StreamSpecification", {})
        assert stream_spec.get("StreamEnabled") is True
        assert stream_spec.get("StreamViewType") == "NEW_AND_OLD_IMAGES"

    def test_dynamodb_table_can_write_and_read_item(self):
        """Verify DynamoDB table can write and read items."""
        table = dynamodb_resource.Table(table_name)
        test_transaction_id = f"test-{uuid.uuid4()}"
        test_timestamp = int(time.time())

        # Write item
        table.put_item(
            Item={
                "transaction_id": test_transaction_id,
                "timestamp": test_timestamp,
                "status": "test",
                "amount": 100,
            }
        )

        # Read item
        response = table.get_item(
            Key={"transaction_id": test_transaction_id, "timestamp": test_timestamp}
        )

        assert "Item" in response
        assert response["Item"]["transaction_id"] == test_transaction_id
        assert response["Item"]["status"] == "test"

        # Cleanup
        table.delete_item(
            Key={"transaction_id": test_transaction_id, "timestamp": test_timestamp}
        )


class TestS3BucketIntegration:
    """Integration tests for S3 bucket."""

    def test_s3_bucket_exists(self):
        """Verify S3 bucket exists."""
        response = s3_client.head_bucket(Bucket=bucket_name)

        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_bucket_has_versioning_enabled(self):
        """Verify S3 bucket has versioning enabled."""
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        assert response.get("Status") == "Enabled"

    def test_s3_bucket_can_write_and_read_object(self):
        """Verify S3 bucket can write and read objects."""
        test_key = f"test-objects/test-{uuid.uuid4()}.json"
        test_data = {"test": "data", "timestamp": int(time.time())}

        # Write object
        s3_client.put_object(
            Bucket=bucket_name, Key=test_key, Body=json.dumps(test_data)
        )

        # Read object
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        content = json.loads(response["Body"].read().decode("utf-8"))

        assert content["test"] == "data"

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    def test_s3_bucket_region_is_correct(self):
        """Verify S3 bucket is in the correct region."""
        response = s3_client.get_bucket_location(Bucket=bucket_name)

        # us-east-1 returns None for LocationConstraint
        location = response.get("LocationConstraint")
        assert location is None or location == region


class TestLambdaFunctionIntegration:
    """Integration tests for Lambda function."""

    def test_lambda_function_exists(self):
        """Verify Lambda function exists."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["FunctionName"] == function_name

    def test_lambda_function_has_correct_runtime(self):
        """Verify Lambda function uses Python 3.11 runtime."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["Runtime"] == "python3.11"

    def test_lambda_function_has_correct_handler(self):
        """Verify Lambda function has correct handler."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["Handler"] == "payment_processor.handler"

    def test_lambda_function_has_correct_memory(self):
        """Verify Lambda function has correct memory configuration."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["MemorySize"] == 512

    def test_lambda_function_has_correct_timeout(self):
        """Verify Lambda function has correct timeout configuration."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        assert response["Configuration"]["Timeout"] == 30

    def test_lambda_function_has_environment_variables(self):
        """Verify Lambda function has required environment variables."""
        function_name = lambda_arn.split(":")[-1]
        response = lambda_client.get_function(FunctionName=function_name)

        env_vars = response["Configuration"]["Environment"]["Variables"]
        assert "DYNAMODB_TABLE" in env_vars
        assert "S3_BUCKET" in env_vars
        assert env_vars["DYNAMODB_TABLE"] == table_name
        assert env_vars["S3_BUCKET"] == bucket_name

    def test_lambda_function_can_be_invoked(self):
        """Verify Lambda function can be invoked successfully."""
        function_name = lambda_arn.split(":")[-1]
        test_payload = {
            "transaction_id": f"integration-test-{uuid.uuid4()}",
            "amount": 99,
        }

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_payload),
        )

        assert response["StatusCode"] == 200

        response_payload = json.loads(response["Payload"].read().decode("utf-8"))
        assert response_payload["statusCode"] == 200

        body = json.loads(response_payload["body"])
        assert body["message"] == "Payment processed"
        assert body["transaction_id"] == test_payload["transaction_id"]


class TestSNSTopicIntegration:
    """Integration tests for SNS topic."""

    def test_sns_topic_exists(self):
        """Verify SNS topic exists."""
        response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)

        assert "Attributes" in response
        assert response["Attributes"]["TopicArn"] == sns_topic_arn

    def test_sns_topic_has_correct_name(self):
        """Verify SNS topic has correct name format."""
        response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)

        topic_name = sns_topic_arn.split(":")[-1]
        assert "payment-notifications" in topic_name


class TestCloudWatchAlarmsIntegration:
    """Integration tests for CloudWatch alarms."""

    def test_lambda_errors_alarm_exists(self):
        """Verify Lambda errors alarm exists."""
        environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        alarm_name = f"payment-lambda-errors-{environment_suffix}"

        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response["MetricAlarms"]) > 0
        alarm = response["MetricAlarms"][0]
        assert alarm["AlarmName"] == alarm_name
        assert alarm["MetricName"] == "Errors"
        assert alarm["Namespace"] == "AWS/Lambda"

    def test_dynamodb_throttle_alarm_exists(self):
        """Verify DynamoDB throttle alarm exists."""
        environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        alarm_name = f"payments-table-throttle-{environment_suffix}"

        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response["MetricAlarms"]) > 0
        alarm = response["MetricAlarms"][0]
        assert alarm["AlarmName"] == alarm_name
        assert alarm["Namespace"] == "AWS/DynamoDB"


class TestEndToEndPaymentProcessing:
    """End-to-end integration tests for payment processing."""

    def test_payment_processing_flow(self):
        """Test complete payment processing flow from Lambda to DynamoDB and S3."""
        function_name = lambda_arn.split(":")[-1]
        test_transaction_id = f"e2e-test-{uuid.uuid4()}"
        test_amount = 150

        # Invoke Lambda function
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(
                {"transaction_id": test_transaction_id, "amount": test_amount}
            ),
        )

        assert response["StatusCode"] == 200

        # Allow time for Lambda to complete
        time.sleep(2)

        # Verify data was written to DynamoDB
        table = dynamodb_resource.Table(table_name)
        scan_response = table.scan(
            FilterExpression="transaction_id = :tid",
            ExpressionAttributeValues={":tid": test_transaction_id},
        )

        assert len(scan_response["Items"]) > 0
        item = scan_response["Items"][0]
        assert item["transaction_id"] == test_transaction_id
        assert item["amount"] == test_amount
        assert item["status"] == "completed"

        # Verify audit log was written to S3
        s3_key = f"transactions/{test_transaction_id}.json"
        s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        s3_content = json.loads(s3_response["Body"].read().decode("utf-8"))

        assert s3_content["transaction_id"] == test_transaction_id
        assert s3_content["amount"] == test_amount

        # Cleanup DynamoDB
        table.delete_item(
            Key={
                "transaction_id": test_transaction_id,
                "timestamp": item["timestamp"],
            }
        )

        # Cleanup S3
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)

    def test_payment_with_missing_transaction_id_uses_default(self):
        """Test payment with missing transaction ID uses 'unknown'."""
        function_name = lambda_arn.split(":")[-1]

        # Invoke Lambda function without transaction_id
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps({"amount": 50}),
        )

        assert response["StatusCode"] == 200

        response_payload = json.loads(response["Payload"].read().decode("utf-8"))
        body = json.loads(response_payload["body"])
        assert body["transaction_id"] == "unknown"
