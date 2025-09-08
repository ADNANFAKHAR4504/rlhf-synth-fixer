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
        self.ec2_client = boto3.client("ec2")

    @mark.it("Validates the Lambda functions")
    def test_lambda_functions(self):
        # Validate Hello Lambda
        hello_lambda_arn = flat_outputs.get("HelloLambdaArn")
        self.assertIsNotNone(hello_lambda_arn, "HelloLambdaArn is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=hello_lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 300)
            self.assertEqual(response["Configuration"]["MemorySize"], 512)
        except ClientError as e:
            self.fail(f"Failed to validate Hello Lambda: {str(e)}")

        # Validate Data Processor Lambda
        data_processor_lambda_arn = flat_outputs.get("DataProcessorLambdaArn")
        self.assertIsNotNone(data_processor_lambda_arn, "DataProcessorLambdaArn is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=data_processor_lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 300)
            self.assertEqual(response["Configuration"]["MemorySize"], 512)
        except ClientError as e:
            self.fail(f"Failed to validate Data Processor Lambda: {str(e)}")

    @mark.it("Validates the S3 bucket")
    def test_s3_bucket(self):
        bucket_name = flat_outputs.get("LambdaCodeBucketName")
        self.assertIsNotNone(bucket_name, "LambdaCodeBucketName is missing in flat-outputs.json")
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response["Status"], "Enabled", "S3 bucket versioning is not enabled")
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {str(e)}")

    @mark.it("Validates the SNS topic")
    def test_sns_topic(self):
        sns_topic_arn = flat_outputs.get("SNSTopicArn")
        self.assertIsNotNone(sns_topic_arn, "SNSTopicArn is missing in flat-outputs.json")
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertIn("Attributes", response)
            self.assertEqual(response["Attributes"]["TopicArn"], sns_topic_arn)
        except ClientError as e:
            self.fail(f"Failed to validate SNS topic: {str(e)}")

    @mark.it("Validates the API Gateway")
    def test_api_gateway(self):
        api_gateway_url = flat_outputs.get("ApiGatewayUrl")
        self.assertIsNotNone(api_gateway_url, "ApiGatewayUrl is missing in flat-outputs.json")
        try:
            # Extract the API ID from the URL
            api_id = api_gateway_url.split("//")[1].split(".")[0]
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")

    @mark.it("Validates the KMS key")
    def test_kms_key(self):
        kms_key_id = flat_outputs.get("KMSKeyId")
        self.assertIsNotNone(kms_key_id, "KMSKeyId is missing in flat-outputs.json")
        try:
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            self.assertTrue(response["KeyMetadata"]["Enabled"], "KMS key is not enabled")
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {str(e)}")

    @mark.it("Validates the VPC")
    def test_vpc(self):
        vpc_id = flat_outputs.get("VPCId")
        self.assertIsNotNone(vpc_id, "VPCId is missing in flat-outputs.json")
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response["Vpcs"]), 1, "VPC not found")
            self.assertEqual(response["Vpcs"][0]["VpcId"], vpc_id)
        except ClientError as e:
            self.fail(f"Failed to validate VPC: {str(e)}")
