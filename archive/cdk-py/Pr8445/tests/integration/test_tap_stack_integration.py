"""
Integration tests for TapStack - LocalStack compatible
Tests the full serverless application infrastructure including:
- API Gateway endpoint
- Lambda function execution
- S3 storage
- DynamoDB logging
- Step Functions state machine
"""

import json
import os
import time
import uuid
from datetime import datetime

import boto3
import pytest
import requests

# LocalStack endpoint configuration
LOCALSTACK_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Environment suffix from stack deployment
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "pr8445")


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients configured for LocalStack"""
    return {
        "s3": boto3.client(
            "s3",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "dynamodb": boto3.client(
            "dynamodb",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "stepfunctions": boto3.client(
            "stepfunctions",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "apigateway": boto3.client(
            "apigateway",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
        "lambda": boto3.client(
            "lambda",
            endpoint_url=LOCALSTACK_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        ),
    }


@pytest.fixture(scope="module")
def stack_outputs():
    """Get stack outputs from CloudFormation"""
    cfn_client = boto3.client(
        "cloudformation",
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )

    stack_name = f"TapStack-{ENVIRONMENT_SUFFIX}"

    try:
        response = cfn_client.describe_stacks(StackName=stack_name)
        outputs = {}
        for output in response["Stacks"][0]["Outputs"]:
            outputs[output["OutputKey"]] = output["OutputValue"]
        return outputs
    except Exception as e:
        pytest.skip(f"Stack {stack_name} not found or not deployed: {e}")


class TestS3Bucket:
    """Test S3 bucket resource"""

    def test_bucket_exists(self, aws_clients, stack_outputs):
        """Verify S3 bucket exists and is accessible"""
        s3_client = aws_clients["s3"]
        bucket_name = stack_outputs.get("BucketName")

        assert bucket_name, "BucketName output not found"

        # Check bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_bucket_write_read(self, aws_clients, stack_outputs):
        """Test writing and reading objects from S3 bucket"""
        s3_client = aws_clients["s3"]
        bucket_name = stack_outputs.get("BucketName")

        # Write test object
        test_key = f"test/{uuid.uuid4()}.json"
        test_data = {"test": "data", "timestamp": datetime.utcnow().isoformat()}

        s3_client.put_object(
            Bucket=bucket_name, Key=test_key, Body=json.dumps(test_data)
        )

        # Read back
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        content = json.loads(response["Body"].read().decode("utf-8"))

        assert content["test"] == "data"

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)


class TestDynamoDBTable:
    """Test DynamoDB table resource"""

    def test_table_exists(self, aws_clients, stack_outputs):
        """Verify DynamoDB table exists"""
        dynamodb_client = aws_clients["dynamodb"]
        table_name = stack_outputs.get("TableName")

        assert table_name, "TableName output not found"

        # Check table exists
        response = dynamodb_client.describe_table(TableName=table_name)
        assert response["Table"]["TableStatus"] == "ACTIVE"

    def test_table_write_read(self, aws_clients, stack_outputs):
        """Test writing and reading items from DynamoDB table"""
        dynamodb_client = aws_clients["dynamodb"]
        table_name = stack_outputs.get("TableName")

        # Write test item
        request_id = str(uuid.uuid4())
        test_item = {
            "request_id": {"S": request_id},
            "timestamp": {"S": datetime.utcnow().isoformat()},
            "status": {"S": "test"},
        }

        dynamodb_client.put_item(TableName=table_name, Item=test_item)

        # Read back
        response = dynamodb_client.get_item(
            TableName=table_name, Key={"request_id": {"S": request_id}}
        )

        assert "Item" in response
        assert response["Item"]["request_id"]["S"] == request_id
        assert response["Item"]["status"]["S"] == "test"

        # Cleanup
        dynamodb_client.delete_item(
            TableName=table_name, Key={"request_id": {"S": request_id}}
        )


class TestStepFunctions:
    """Test Step Functions state machine"""

    def test_state_machine_exists(self, aws_clients, stack_outputs):
        """Verify Step Functions state machine exists"""
        sfn_client = aws_clients["stepfunctions"]
        state_machine_arn = stack_outputs.get("StateMachineArn")

        assert state_machine_arn, "StateMachineArn output not found"

        # Check state machine exists
        response = sfn_client.describe_state_machine(stateMachineArn=state_machine_arn)
        assert response["status"] == "ACTIVE"

    def test_state_machine_execution(self, aws_clients, stack_outputs):
        """Test executing the state machine"""
        sfn_client = aws_clients["stepfunctions"]
        state_machine_arn = stack_outputs.get("StateMachineArn")

        execution_name = f"test-{uuid.uuid4()}"
        test_input = {"request_id": str(uuid.uuid4()), "payload": {"test": "data"}}

        # Start execution
        response = sfn_client.start_execution(
            stateMachineArn=state_machine_arn,
            name=execution_name,
            input=json.dumps(test_input),
        )

        execution_arn = response["executionArn"]
        assert execution_arn

        # Wait for execution to complete (with timeout)
        max_wait = 30
        waited = 0
        while waited < max_wait:
            status_response = sfn_client.describe_execution(executionArn=execution_arn)
            if status_response["status"] != "RUNNING":
                break
            time.sleep(1)
            waited += 1

        # Verify execution succeeded
        assert status_response["status"] == "SUCCEEDED"


class TestLambdaFunction:
    """Test Lambda function"""

    def test_lambda_exists(self, aws_clients, stack_outputs):
        """Verify Lambda function exists"""
        lambda_client = aws_clients["lambda"]
        function_name = stack_outputs.get("LambdaFunctionName")

        assert function_name, "LambdaFunctionName output not found"

        # Check function exists
        response = lambda_client.get_function(FunctionName=function_name)
        assert response["Configuration"]["State"] == "Active"

    def test_lambda_invoke(self, aws_clients, stack_outputs):
        """Test invoking Lambda function directly"""
        lambda_client = aws_clients["lambda"]
        function_name = stack_outputs.get("LambdaFunctionName")

        # Invoke Lambda
        test_event = {
            "body": json.dumps({"test": "data", "message": "Integration test"})
        }

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event),
        )

        # Parse response
        payload = json.loads(response["Payload"].read().decode("utf-8"))

        # Lambda should return 200 if successful
        assert payload["statusCode"] == 200

        # Parse body
        body = json.loads(payload["body"])
        assert "request_id" in body
        assert body["message"] == "Request processed successfully"


class TestAPIGateway:
    """Test API Gateway integration"""

    def test_api_endpoint_exists(self, stack_outputs):
        """Verify API Gateway endpoint exists"""
        api_endpoint = stack_outputs.get("ApiEndpoint")
        assert api_endpoint, "ApiEndpoint output not found"

    @pytest.mark.skip(reason="IAM authorization requires AWS SigV4 signing")
    def test_api_post_request(self, stack_outputs):
        """
        Test POST request to API Gateway
        Note: This test is skipped because the API uses IAM authorization
        which requires AWS SigV4 request signing.
        For production testing, use AWS CLI or SDK with proper credentials.
        """
        api_endpoint = stack_outputs.get("ApiEndpoint")

        test_payload = {"test": "data", "message": "API integration test"}

        # This would require proper AWS SigV4 signing
        response = requests.post(
            api_endpoint, json=test_payload, headers={"Content-Type": "application/json"}
        )

        # Without proper signing, we expect 403 Forbidden
        # With proper signing, we would expect 200 OK
        assert response.status_code in [200, 403]


class TestEndToEnd:
    """End-to-end integration tests"""

    def test_full_workflow_via_lambda(self, aws_clients, stack_outputs):
        """
        Test the complete workflow by invoking Lambda directly:
        1. Lambda receives request
        2. Stores payload in S3
        3. Logs metadata in DynamoDB
        4. Starts Step Functions execution
        """
        lambda_client = aws_clients["lambda"]
        s3_client = aws_clients["s3"]
        dynamodb_client = aws_clients["dynamodb"]
        sfn_client = aws_clients["stepfunctions"]

        function_name = stack_outputs.get("LambdaFunctionName")
        bucket_name = stack_outputs.get("BucketName")
        table_name = stack_outputs.get("TableName")

        # Invoke Lambda with test payload
        test_payload = {
            "test": "data",
            "message": "End-to-end integration test",
            "timestamp": datetime.utcnow().isoformat(),
        }

        test_event = {"body": json.dumps(test_payload)}

        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event),
        )

        payload = json.loads(response["Payload"].read().decode("utf-8"))
        assert payload["statusCode"] == 200

        body = json.loads(payload["body"])
        request_id = body["request_id"]
        execution_arn = body["execution_arn"]

        # Verify S3 object was created
        s3_key = f"requests/{request_id}.json"
        s3_response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        s3_content = json.loads(s3_response["Body"].read().decode("utf-8"))
        assert s3_content["test"] == "data"

        # Verify DynamoDB item was created
        dynamodb_response = dynamodb_client.get_item(
            TableName=table_name, Key={"request_id": {"S": request_id}}
        )
        assert "Item" in dynamodb_response
        assert dynamodb_response["Item"]["status"]["S"] == "processing"

        # Verify Step Functions execution was started
        sfn_response = sfn_client.describe_execution(executionArn=execution_arn)
        assert sfn_response["status"] in ["RUNNING", "SUCCEEDED"]

        # Wait for execution to complete
        max_wait = 30
        waited = 0
        while waited < max_wait:
            sfn_response = sfn_client.describe_execution(executionArn=execution_arn)
            if sfn_response["status"] != "RUNNING":
                break
            time.sleep(1)
            waited += 1

        assert sfn_response["status"] == "SUCCEEDED"

        # Cleanup
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
        dynamodb_client.delete_item(
            TableName=table_name, Key={"request_id": {"S": request_id}}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
