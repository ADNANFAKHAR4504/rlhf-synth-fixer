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
        self.ec2_client = boto3.client("ec2")
        self.iam_client = boto3.client("iam")

    @mark.it("Validates the Lambda function")
    def test_lambda_function(self):
        lambda_name = flat_outputs.get("LambdaFunctionName")
        self.assertIsNotNone(lambda_name, "Lambda function name is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 30)
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
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {str(e)}")

    @mark.it("Validates the API Gateway")
    def test_api_gateway(self):
        api_endpoint = flat_outputs.get("TapApiGatewayEndpoint72B98B78")
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint is missing in flat-outputs.json")
        try:
            # Extract the API ID from the endpoint URL
            api_id = api_endpoint.split("//")[1].split(".")[0]
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            self.assertEqual(response["name"], "Tap API")
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")

    @mark.it("Validates the CloudWatch Log Group")
    def test_cloudwatch_log_group(self):
        log_group_name = flat_outputs.get("CloudwatchLogGroupName")
        self.assertIsNotNone(log_group_name, "CloudWatch log group name is missing in flat-outputs.json")
        try:
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            self.assertGreater(len(response["logGroups"]), 0, "Log group not found")
        except ClientError as e:
            self.fail(f"Failed to validate CloudWatch log group: {str(e)}")

    @mark.it("Validates the VPC")
    def test_vpc(self):
        vpc_id = flat_outputs.get("VpcId")
        self.assertIsNotNone(vpc_id, "VPC ID is missing in flat-outputs.json")
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response["Vpcs"]), 1, "VPC not found")
            self.assertEqual(response["Vpcs"][0]["VpcId"], vpc_id)
        except ClientError as e:
            self.fail(f"Failed to validate VPC: {str(e)}")

    @mark.it("Validates the IAM Role")
    def test_iam_role(self):
        role_arn = flat_outputs.get("LambdaRoleArn")
        self.assertIsNotNone(role_arn, "IAM role ARN is missing in flat-outputs.json")
        try:
            role_name = role_arn.split("/")[-1]
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertEqual(response["Role"]["Arn"], role_arn)
        except ClientError as e:
            self.fail(f"Failed to validate IAM role: {str(e)}")
