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
        self.sns_client = boto3.client("sns")
        self.apigateway_client = boto3.client("apigateway")
        self.kms_client = boto3.client("kms")
        self.dynamodb_client = boto3.client("dynamodb")

    @mark.it("Validates the Lambda function")
    def test_lambda_function(self):
        lambda_arn = flat_outputs.get("LambdaFunArn")
        self.assertIsNotNone(lambda_arn, "Lambda ARN is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 300)
            self.assertEqual(response["Configuration"]["MemorySize"], 512)
        except ClientError as e:
            self.fail(f"Failed to validate Lambda function: {str(e)}")

    @mark.it("Validates the S3 bucket")
    def test_s3_bucket(self):
        bucket_name = flat_outputs.get("S3BucketName")
        self.assertIsNotNone(bucket_name, "S3 bucket name is missing in flat-outputs.json")
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response["Status"], "Enabled", "S3 bucket versioning is not enabled")
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {str(e)}")

    @mark.it("Validates the DynamoDB table")
    def test_dynamodb_table(self):
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in flat-outputs.json")
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response["Table"]["TableName"], table_name)
            self.assertEqual(response["Table"]["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {str(e)}")

    @mark.it("Validates the KMS key")
    def test_kms_key(self):
        kms_key_id = flat_outputs.get("KMSKeyId")
        self.assertIsNotNone(kms_key_id, "KMS key ID is missing in flat-outputs.json")
        try:
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            self.assertTrue(response["KeyMetadata"]["Enabled"], "KMS key is not enabled")
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {str(e)}")

    @mark.it("Validates the API Gateway")
    def test_api_gateway(self):
        api_endpoint = flat_outputs.get("ApiGatewayUrl")
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint is missing in flat-outputs.json")
        try:
            # Extract the API ID from the endpoint URL
            api_id = api_endpoint.split("//")[1].split(".")[0]
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            self.assertEqual(response["name"], "Serverless File Upload API")
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")
