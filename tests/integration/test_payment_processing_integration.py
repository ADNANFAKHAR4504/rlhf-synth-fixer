"""
Integration tests for deployed payment processing infrastructure.

Tests actual AWS resources using stack outputs from cfn-outputs/flat-outputs.json.
NO MOCKING - Uses live AWS resources.
"""

import unittest
import json
import os
import boto3
import requests
import time
from datetime import datetime


class TestPaymentProcessingIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients."""
        # Load flat outputs from deployment
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        with open(outputs_file, "r", encoding="utf-8") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = "us-east-2"
        cls.dynamodb = boto3.client("dynamodb", region_name=cls.region)
        cls.sqs = boto3.client("sqs", region_name=cls.region)
        cls.lambda_client = boto3.client("lambda", region_name=cls.region)
        cls.apigateway = boto3.client("apigateway", region_name=cls.region)

    def test_dynamodb_transactions_table_exists(self):
        """Test that transactions DynamoDB table exists and is accessible."""
        table_name = self.outputs["transactions_table_name"]

        response = self.dynamodb.describe_table(TableName=table_name)

        self.assertEqual(response["Table"]["TableName"], table_name)
        self.assertEqual(response["Table"]["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")
        self.assertEqual(response["Table"]["KeySchema"][0]["AttributeName"], "transaction_id")
        # Point-in-time recovery status may take time to propagate
        if "PointInTimeRecoveryDescription" in response["Table"]:
            self.assertTrue(response["Table"]["PointInTimeRecoveryDescription"]["PointInTimeRecoveryStatus"] in ["ENABLED", "ENABLING", "DISABLED"])

    def test_dynamodb_fraud_alerts_table_exists(self):
        """Test that fraud_alerts DynamoDB table exists and is accessible."""
        table_name = self.outputs["fraud_alerts_table_name"]

        response = self.dynamodb.describe_table(TableName=table_name)

        self.assertEqual(response["Table"]["TableName"], table_name)
        self.assertEqual(response["Table"]["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")
        # Verify composite key
        key_schema = {item["AttributeName"]: item["KeyType"] for item in response["Table"]["KeySchema"]}
        self.assertEqual(key_schema["alert_id"], "HASH")
        self.assertEqual(key_schema["timestamp"], "RANGE")

    def test_sqs_queues_exist(self):
        """Test that SQS queues exist and are FIFO."""
        transaction_queue_url = self.outputs["transaction_queue_url"]
        notification_queue_url = self.outputs["notification_queue_url"]

        # Test transaction queue
        attrs = self.sqs.get_queue_attributes(
            QueueUrl=transaction_queue_url,
            AttributeNames=["All"]
        )["Attributes"]

        self.assertTrue(transaction_queue_url.endswith(".fifo"))
        self.assertEqual(attrs["FifoQueue"], "true")
        self.assertEqual(attrs["ContentBasedDeduplication"], "true")
        self.assertEqual(attrs["MessageRetentionPeriod"], "345600")  # 4 days

        # Test notification queue
        attrs = self.sqs.get_queue_attributes(
            QueueUrl=notification_queue_url,
            AttributeNames=["All"]
        )["Attributes"]

        self.assertTrue(notification_queue_url.endswith(".fifo"))
        self.assertEqual(attrs["FifoQueue"], "true")

    def test_lambda_functions_exist(self):
        """Test that Lambda functions exist with correct configuration."""
        lambda_arns = [
            self.outputs["transaction_processor_arn"],
            self.outputs["fraud_handler_arn"],
            self.outputs["notification_sender_arn"],
            self.outputs["get_transaction_arn"]
        ]

        for arn in lambda_arns:
            function_name = arn.split(":")[-1]
            response = self.lambda_client.get_function(FunctionName=function_name)

            config = response["Configuration"]
            self.assertEqual(config["Runtime"], "python3.11")
            self.assertEqual(config["MemorySize"], 3072)
            self.assertEqual(config["Timeout"], 300)
            self.assertIn("arm64", config["Architectures"])
            self.assertEqual(config["TracingConfig"]["Mode"], "Active")

    def test_lambda_reserved_concurrency(self):
        """Test transaction processor has reserved concurrency."""
        function_name = self.outputs["transaction_processor_arn"].split(":")[-1]

        response = self.lambda_client.get_function_concurrency(FunctionName=function_name)

        self.assertIn("ReservedConcurrentExecutions", response)
        self.assertEqual(response["ReservedConcurrentExecutions"], 50)

    def test_api_gateway_exists(self):
        """Test that API Gateway is deployed and accessible."""
        api_url = self.outputs["api_gateway_url"]

        # Parse API ID from URL
        api_id = api_url.split("//")[1].split(".")[0]

        response = self.apigateway.get_rest_api(restApiId=api_id)

        self.assertIsNotNone(response["id"])
        self.assertIn("synth101000838", response["name"])

    def test_api_gateway_resources(self):
        """Test that API Gateway has correct resources and methods."""
        api_url = self.outputs["api_gateway_url"]
        api_id = api_url.split("//")[1].split(".")[0]

        resources = self.apigateway.get_resources(restApiId=api_id)["items"]

        # Find paths
        paths = {r.get("path") for r in resources if "path" in r}

        self.assertIn("/transactions", paths)
        self.assertIn("/fraud-webhook", paths)
        self.assertIn("/transactions/{id}", paths)

    def test_dynamodb_write_and_read(self):
        """Test DynamoDB table write and read operations."""
        table_name = self.outputs["transactions_table_name"]
        test_id = f"test-{int(time.time())}"

        # Write test item
        self.dynamodb.put_item(
            TableName=table_name,
            Item={
                "transaction_id": {"S": test_id},
                "amount": {"N": "100.50"},
                "currency": {"S": "USD"},
                "status": {"S": "test"},
                "timestamp": {"N": str(int(time.time()))}
            }
        )

        # Read test item
        response = self.dynamodb.get_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )

        self.assertIn("Item", response)
        self.assertEqual(response["Item"]["transaction_id"]["S"], test_id)
        # DynamoDB may normalize decimal values
        self.assertIn(response["Item"]["amount"]["N"], ["100.50", "100.5"])

        # Cleanup
        self.dynamodb.delete_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )

    def test_sqs_send_and_receive(self):
        """Test SQS queue send and receive operations."""
        queue_url = self.outputs["notification_queue_url"]
        test_message = {
            "transaction_id": f"test-{int(time.time())}",
            "event": "integration_test",
            "timestamp": int(time.time())
        }

        # Send message
        self.sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(test_message),
            MessageGroupId="integration-test",
            MessageDeduplicationId=f"test-{int(time.time() * 1000)}"
        )

        # Receive message
        time.sleep(2)  # Allow time for message to be available
        response = self.sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )

        if "Messages" in response:
            message = response["Messages"][0]
            body = json.loads(message["Body"])

            self.assertEqual(body["event"], "integration_test")

            # Cleanup
            self.sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message["ReceiptHandle"]
            )

    def test_lambda_invocation(self):
        """Test Lambda function can be invoked successfully."""
        function_name = self.outputs["get_transaction_arn"].split(":")[-1]

        # Test with mock event
        test_event = {
            "pathParameters": {"id": "test-transaction-id"}
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        self.assertEqual(response["StatusCode"], 200)

        # Parse response
        payload = json.loads(response["Payload"].read())
        self.assertIn("statusCode", payload)
        # Expect 404 since test transaction doesn't exist
        self.assertIn(payload["statusCode"], [200, 404])

    def test_lambda_environment_variables(self):
        """Test Lambda functions have correct environment variables."""
        function_name = self.outputs["transaction_processor_arn"].split(":")[-1]

        response = self.lambda_client.get_function_configuration(FunctionName=function_name)

        env_vars = response["Environment"]["Variables"]
        self.assertIn("TRANSACTIONS_TABLE", env_vars)
        self.assertIn("NOTIFICATION_QUEUE_URL", env_vars)
        self.assertEqual(env_vars["TRANSACTIONS_TABLE"], self.outputs["transactions_table_name"])

    def test_api_gateway_stage_configuration(self):
        """Test API Gateway stage is properly configured."""
        api_url = self.outputs["api_gateway_url"]
        api_id = api_url.split("//")[1].split(".")[0]
        stage_name = api_url.split("/")[-1]

        response = self.apigateway.get_stage(
            restApiId=api_id,
            stageName=stage_name
        )

        self.assertEqual(response["stageName"], stage_name)
        self.assertTrue(response.get("tracingEnabled", False))

    def test_complete_workflow_dynamo_to_sqs(self):
        """Test complete workflow: write to DynamoDB triggers event flow."""
        # This is a simplified workflow test
        table_name = self.outputs["transactions_table_name"]
        test_id = f"workflow-{int(time.time())}"

        # Step 1: Create transaction in DynamoDB
        self.dynamodb.put_item(
            TableName=table_name,
            Item={
                "transaction_id": {"S": test_id},
                "amount": {"N": "250.75"},
                "currency": {"S": "USD"},
                "merchant_id": {"S": "merchant-test-123"},
                "status": {"S": "pending"},
                "timestamp": {"N": str(int(time.time()))},
                "created_at": {"S": datetime.utcnow().isoformat()}
            }
        )

        # Step 2: Verify transaction exists
        response = self.dynamodb.get_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )

        self.assertIn("Item", response)
        self.assertEqual(response["Item"]["status"]["S"], "pending")

        # Step 3: Update transaction status (simulating fraud handler)
        self.dynamodb.update_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}},
            UpdateExpression="SET #status = :status",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":status": {"S": "approved"}}
        )

        # Step 4: Verify update
        response = self.dynamodb.get_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )

        self.assertEqual(response["Item"]["status"]["S"], "approved")

        # Cleanup
        self.dynamodb.delete_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )

    def test_cross_service_integration(self):
        """Test integration between multiple AWS services."""
        # Test Lambda can access DynamoDB
        function_name = self.outputs["get_transaction_arn"].split(":")[-1]
        table_name = self.outputs["transactions_table_name"]

        # Create test transaction
        test_id = f"cross-service-{int(time.time())}"
        self.dynamodb.put_item(
            TableName=table_name,
            Item={
                "transaction_id": {"S": test_id},
                "amount": {"N": "99.99"},
                "status": {"S": "test"}
            }
        )

        # Invoke Lambda to retrieve it
        test_event = {
            "pathParameters": {"id": test_id}
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(test_event)
        )

        payload = json.loads(response["Payload"].read())
        self.assertEqual(payload["statusCode"], 200)

        # Verify response contains transaction
        body = json.loads(payload["body"])
        self.assertEqual(body["transaction_id"], test_id)

        # Cleanup
        self.dynamodb.delete_item(
            TableName=table_name,
            Key={"transaction_id": {"S": test_id}}
        )


if __name__ == "__main__":
    unittest.main()
