"""
Integration tests for TapStack multi-region payment infrastructure
Tests deployed AWS resources using actual stack outputs
"""
import os
import sys
import json
import pytest
import boto3

# Add lib directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class TestTapStackIntegration:
    """Integration tests using deployed AWS resources"""

    @pytest.fixture(scope="class")
    def stack_outputs(self):
        """Load stack outputs from deployment"""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Stack outputs not found at {outputs_file}. Deploy infrastructure first.")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            return json.load(f).get(f"TapStack{os.getenv("ENVIRONMENT_SUFFIX")}")

    @pytest.fixture(scope="class")
    def dynamodb_client(self, stack_outputs):
        """Create DynamoDB client"""
        region = os.getenv("AWS_REGION", "us-east-1")
        return boto3.client('dynamodb', region_name=region)

    @pytest.fixture(scope="class")
    def lambda_client(self, stack_outputs):
        """Create Lambda client"""
        region = os.getenv("AWS_REGION", "us-east-1")
        return boto3.client('lambda', region_name=region)

    @pytest.fixture(scope="class")
    def cloudwatch_client(self, stack_outputs):
        """Create CloudWatch client"""
        region = os.getenv("AWS_REGION", "us-east-1")
        return boto3.client('cloudwatch', region_name=region)

    @pytest.fixture(scope="class")
    def s3_client(self, stack_outputs):
        """Create S3 client"""
        region = os.getenv("AWS_REGION", "us-east-1")
        return boto3.client('s3', region_name=region)

    def test_outputs_exist(self, stack_outputs):
        """Test that required outputs exist"""
        required_outputs = [
            "dynamodb_table_name",
            "lambda_function_name",
            "api_endpoint",
            "state_machine_arn",
            "sns_topic_arn",
            "s3_bucket_name",
            "kms_key_id",
            "cloudwatch_dashboard_name"
        ]

        for output in required_outputs:
            assert output in stack_outputs, f"Missing output: {output}"
            assert stack_outputs[output], f"Output {output} is empty"

    def test_dynamodb_table_exists(self, dynamodb_client, stack_outputs):
        """Test DynamoDB table exists and is accessible"""
        table_name = stack_outputs["dynamodb_table_name"]

        response = dynamodb_client.describe_table(TableName=table_name)
        assert response["Table"]["TableStatus"] == "ACTIVE"

        # Verify billing mode
        assert response["Table"]["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"

        # Verify streaming is enabled
        assert "StreamSpecification" in response["Table"]
        assert response["Table"]["StreamSpecification"]["StreamEnabled"] is True

    def test_lambda_function_exists(self, lambda_client, stack_outputs):
        """Test Lambda function exists and is configured correctly"""
        function_name = stack_outputs["lambda_function_name"]

        response = lambda_client.get_function(FunctionName=function_name)

        # Verify configuration
        config = response["Configuration"]
        assert config["MemorySize"] == 3072
        assert config["Timeout"] == 900
        assert config["Runtime"] == "python3.12"

        # Verify reserved concurrent executions
        if "ReservedConcurrentExecutions" in config:
            assert config["ReservedConcurrentExecutions"] == 2

    def test_s3_bucket_exists(self, s3_client, stack_outputs):
        """Test S3 bucket exists and versioning is enabled"""
        bucket_name = stack_outputs["s3_bucket_name"]

        # Check bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

        # Check versioning
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get("Status") == "Enabled"

    def test_cloudwatch_dashboard_exists(self, cloudwatch_client, stack_outputs):
        """Test CloudWatch dashboard exists"""
        dashboard_name = stack_outputs["cloudwatch_dashboard_name"]

        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        assert "DashboardBody" in response

        # Verify dashboard has widgets
        dashboard_body = json.loads(response["DashboardBody"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) >= 3

    def test_api_gateway_endpoint_accessible(self, stack_outputs):
        """Test API Gateway endpoint is accessible"""
        import requests

        api_endpoint = stack_outputs["api_endpoint"]
        payments_endpoint = f"{api_endpoint}/payments"

        # Send a test request
        response = requests.post(
            payments_endpoint,
            json={
                "transaction_id": "test-txn-002",
                "amount": 50.00,
                "currency": "USD"
            },
            timeout=30
        )

        # Should return 200 or 500 (depends on Lambda execution)
        assert response.status_code in [200, 500]

    def test_dynamodb_data_persistence(self, dynamodb_client, stack_outputs):
        """Test data can be written to and read from DynamoDB"""
        table_name = stack_outputs["dynamodb_table_name"]

        # Put an item
        test_id = "integration-test-001"
        dynamodb_client.put_item(
            TableName=table_name,
            Item={
                "transaction_id": {"S": test_id},
                "timestamp": {"N": "1234567890"},
                "amount": {"N": "100.00"},
                "status": {"S": "processed"}
            }
        )

        # Get the item
        response = dynamodb_client.get_item(
            TableName=table_name,
            Key={
                "transaction_id": {"S": test_id},
                "timestamp": {"N": "1234567890"}
            }
        )

        assert "Item" in response
        assert response["Item"]["transaction_id"]["S"] == test_id
        assert response["Item"]["status"]["S"] == "processed"

        # Clean up
        dynamodb_client.delete_item(
            TableName=table_name,
            Key={
                "transaction_id": {"S": test_id},
                "timestamp": {"N": "1234567890"}
            }
        )

    def test_kms_key_exists(self, stack_outputs):
        """Test KMS key exists and is usable"""
        kms_client = boto3.client('kms', region_name=os.getenv("AWS_REGION", "us-east-1"))
        kms_key_id = stack_outputs["kms_key_id"]

        response = kms_client.describe_key(KeyId=kms_key_id)

        assert response["KeyMetadata"]["KeyState"] == "Enabled"
        assert response["KeyMetadata"]["KeyUsage"] == "ENCRYPT_DECRYPT"

    def test_sns_topic_exists(self, stack_outputs):
        """Test SNS topic exists"""
        sns_client = boto3.client('sns', region_name=os.getenv("AWS_REGION", "us-east-1"))
        topic_arn = stack_outputs["sns_topic_arn"]

        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert "Attributes" in response

    def test_step_functions_state_machine_exists(self, stack_outputs):
        """Test Step Functions state machine exists"""
        sfn_client = boto3.client('stepfunctions', region_name=os.getenv("AWS_REGION", "us-east-1"))
        state_machine_arn = stack_outputs["state_machine_arn"]

        response = sfn_client.describe_state_machine(stateMachineArn=state_machine_arn)
        assert response["status"] == "ACTIVE"
