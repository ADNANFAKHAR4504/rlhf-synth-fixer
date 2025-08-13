import json
import os
import unittest
from unittest.mock import patch, MagicMock
import boto3
import pytest
from moto import mock_aws
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack using live AWS services"""

  def setUp(self):
    """Set up AWS credentials from environment for live testing"""
    self.aws_region = os.getenv("AWS_REGION", "us-west-1")
    self.api_gateway_url = flat_outputs.get("api_gateway_url")
    self.lambda_function_name = flat_outputs.get("lambda_function_name")
    self.dynamodb_table_name = flat_outputs.get("dynamodb_table_name")
    self.vpc_id = flat_outputs.get("vpc_id")

    # Fail early if outputs are missing
    missing = [
        key for key in [
            "api_gateway_url",
            "lambda_function_name",
            "dynamodb_table_name",
            "vpc_id"
        ] if flat_outputs.get(key) is None
    ]
    if missing:
      raise ValueError(f"Missing required stack outputs: {', '.join(missing)}")

    self.lambda_client = boto3.client("lambda", region_name=self.aws_region)
    self.apigw_client = boto3.client("apigateway", region_name=self.aws_region)
    self.dynamodb_client = boto3.client(
        "dynamodb", region_name=self.aws_region)
    self.ec2_client = boto3.client("ec2", region_name=self.aws_region)

  @mark.it("should successfully invoke the Lambda function")
  def test_lambda_invocation(self):
    """Invoke the deployed Lambda function and validate the response"""
    response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType="RequestResponse",
        Payload=json.dumps({"test": "integration"}).encode()
    )
    payload = json.loads(response['Payload'].read().decode())
    self.assertEqual(response['StatusCode'], 200)
    self.assertIn('statusCode', payload)
    self.assertEqual(payload['statusCode'], 200)

  @mark.it("should confirm DynamoDB table exists and is active")
  def test_dynamodb_table_exists(self):
    """Check that the DynamoDB table exists and is ACTIVE"""
    response = self.dynamodb_client.describe_table(
        TableName=self.dynamodb_table_name
    )
    self.assertEqual(
        response['Table']['TableStatus'], 'ACTIVE',
        f"DynamoDB table {self.dynamodb_table_name} is not ACTIVE"
    )

  @mark.it("should confirm API Gateway endpoint is reachable")
  def test_api_gateway_reachable(self):
    """Send an HTTP request to API Gateway endpoint"""
    import requests
    url = f"{self.api_gateway_url}/hello"
    r = requests.get(url)
    self.assertEqual(
        r.status_code,
        200,
        f"API Gateway returned {
            r.status_code}")
    self.assertIn("message", r.json())

  @mark.it("should confirm VPC exists in the correct region")
  def test_vpc_exists(self):
    """Check that the VPC exists"""
    response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
    self.assertEqual(len(response['Vpcs']), 1)
    self.assertEqual(response['Vpcs'][0]['VpcId'], self.vpc_id)


if __name__ == "__main__":
  unittest.main()
