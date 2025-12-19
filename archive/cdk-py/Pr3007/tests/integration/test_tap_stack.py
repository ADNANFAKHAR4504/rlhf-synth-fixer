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
        self.dynamodb_client = boto3.client("dynamodb")
        self.apigateway_client = boto3.client("apigateway")
        self.logs_client = boto3.client("logs")
        self.kms_client = boto3.client("kms")

    @mark.it("Validates the Lambda function for API Gateway")
    def test_api_lambda_function(self):
        lambda_arn = flat_outputs.get("ApiLambdaArn")
        self.assertIsNotNone(lambda_arn, "API Lambda ARN is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.8")
            self.assertEqual(response["Configuration"]["Timeout"], 15)
        except ClientError as e:
            self.fail(f"Failed to validate API Lambda function: {str(e)}")

    @mark.it("Validates the Lambda function for DynamoDB Streams")
    def test_stream_lambda_function(self):
        lambda_arn = flat_outputs.get("StreamLambdaArn")
        self.assertIsNotNone(lambda_arn, "Stream Lambda ARN is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.8")
            self.assertEqual(response["Configuration"]["Timeout"], 15)
        except ClientError as e:
            self.fail(f"Failed to validate Stream Lambda function: {str(e)}")

    @mark.it("Validates the DynamoDB table")
    def test_dynamodb_table(self):
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in flat-outputs.json")
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response["Table"]["TableName"], table_name)
            self.assertEqual(response["Table"]["KeySchema"][0]["AttributeName"], "id")
            self.assertEqual(response["Table"]["KeySchema"][0]["KeyType"], "HASH")
            self.assertTrue(response["Table"]["StreamSpecification"]["StreamEnabled"])
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
            self.assertEqual(response["name"], f"serverless-api-{flat_outputs.get('EnvironmentSuffix')}")
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")

    @mark.it("Validates the KMS key")
    def test_kms_key(self):
        kms_key_id = flat_outputs.get("KmsKeyId")
        self.assertIsNotNone(kms_key_id, "KMS Key ID is missing in flat-outputs.json")
        try:
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            self.assertEqual(response["KeyMetadata"]["KeyId"], kms_key_id)
            self.assertTrue(response["KeyMetadata"]["Enabled"])
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {str(e)}")

    @mark.it("Validates CloudWatch log groups for Lambda functions")
    def test_cloudwatch_log_groups(self):
        api_lambda_log_group = f"/aws/lambda/{flat_outputs.get('ApiLambdaArn').split(':')[-1]}"
        stream_lambda_log_group = f"/aws/lambda/{flat_outputs.get('StreamLambdaArn').split(':')[-1]}"
        try:
            api_logs = self.logs_client.describe_log_groups(logGroupNamePrefix=api_lambda_log_group)
            self.assertGreater(len(api_logs["logGroups"]), 0, "API Lambda log group not found")

            stream_logs = self.logs_client.describe_log_groups(logGroupNamePrefix=stream_lambda_log_group)
            self.assertGreater(len(stream_logs["logGroups"]), 0, "Stream Lambda log group not found")
        except ClientError as e:
            self.fail(f"Failed to validate CloudWatch log groups: {str(e)}")
