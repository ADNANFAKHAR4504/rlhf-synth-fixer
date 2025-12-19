import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for integration tests"""
        self.lambda_client = boto3.client("lambda")
        self.s3_client = boto3.client("s3")
        self.dynamodb_client = boto3.client("dynamodb")
        self.apigateway_client = boto3.client("apigateway")
        self.logs_client = boto3.client("logs")
        self.iam_client = boto3.client("iam")

    @mark.it("Validates the Lambda function")
    def test_lambda_function(self):
        lambda_arn = flat_outputs.get("LambdaFunctionArn")
        self.assertIsNotNone(lambda_arn, "Lambda function ARN is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 30)
            self.assertEqual(response["Configuration"]["MemorySize"], 256)
        except ClientError as e:
            self.fail(f"Failed to validate Lambda function: {str(e)}")

    @mark.it("Validates the DynamoDB table")
    def test_dynamodb_table(self):
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in flat-outputs.json")
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response["Table"]["TableName"], table_name)
            self.assertEqual(response["Table"]["ProvisionedThroughput"]["ReadCapacityUnits"], 5)
            self.assertEqual(response["Table"]["ProvisionedThroughput"]["WriteCapacityUnits"], 5)
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {str(e)}")

    @mark.it("Validates the API Gateway")
    def test_api_gateway(self):
        api_url = flat_outputs.get("ApiGatewayUrl")
        self.assertIsNotNone(api_url, "API Gateway URL is missing in flat-outputs.json")
        try:
            # Extract the API ID from the URL
            api_id = api_url.split("//")[1].split(".")[0]
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")

    @mark.it("Validates the CloudWatch Log Group")
    def test_cloudwatch_log_group(self):
        log_group_name = flat_outputs.get("LogGroupName")
        self.assertIsNotNone(log_group_name, "CloudWatch log group name is missing in flat-outputs.json")
        try:
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            self.assertGreater(len(response["logGroups"]), 0, "Log group not found")
        except ClientError as e:
            self.fail(f"Failed to validate CloudWatch log group: {str(e)}")

    @mark.it("Validates the IAM Role")
    def test_iam_role(self):
        role_name = flat_outputs.get("IamRoleName")
        self.assertIsNotNone(role_name, "IAM role name is missing in flat-outputs.json")
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertEqual(response["Role"]["RoleName"], role_name)
        except ClientError as e:
            self.fail(f"Failed to validate IAM role: {str(e)}")
