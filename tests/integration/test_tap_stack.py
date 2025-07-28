import json
import os
import unittest
import requests
import boto3
from pytest import mark
from botocore.exceptions import ClientError


# Load flat-outputs.json
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
  """Integration tests for the deployed TapStack"""

  def setUp(self):
    self.api_url = flat_outputs.get("ApiEndpoint")
    self.lambda_name = flat_outputs.get("LambdaFunctionName")
    self.lambda_arn = flat_outputs.get("LambdaFunctionArn")
    self.role_name = flat_outputs.get("LambdaExecutionRoleName")
    self.api_id = flat_outputs.get("ApiGatewayRestApiId")

    self.lambda_client = boto3.client("lambda")
    self.iam_client = boto3.client("iam")
    self.apigw_client = boto3.client("apigateway")

  @mark.it("should respond to POST /myresource with expected message")
  def test_post_to_myresource_returns_expected_response(self):
    if not self.api_url:
      self.skipTest("Missing ApiEndpoint in flat-outputs.json")

    url = self.api_url.rstrip("/") + "/myresource"
    headers = {"Content-Type": "application/json"}
    payload = {"test": "data"}

    response = requests.post(url, headers=headers, json=payload)

    self.assertEqual(response.status_code, 200)
    body = response.json()
    self.assertEqual(body, "Hello from Turing!")

  @mark.it("Lambda function exists and is active")
  def test_lambda_function_exists(self):
    if not self.lambda_name:
      self.skipTest("Missing LambdaFunctionName in flat-outputs.json")

    response = self.lambda_client.get_function(FunctionName=self.lambda_name)
    self.assertEqual(
        response['Configuration']['FunctionName'],
        self.lambda_name)
    self.assertEqual(response['Configuration']['State'], 'Active')

  @mark.it("Lambda function ARN is valid")
  def test_lambda_function_arn_valid(self):
    if not self.lambda_arn:
      self.skipTest("Missing LambdaFunctionArn in flat-outputs.json")

    try:
      response = self.lambda_client.get_function(FunctionName=self.lambda_arn)
      self.assertEqual(
          response['Configuration']['FunctionArn'],
          self.lambda_arn)
    except ClientError as e:
      self.fail(f"Lambda ARN invalid or inaccessible: {str(e)}")

  @mark.it("IAM role for Lambda exists")
  def test_lambda_execution_role_exists(self):
    if not self.role_name:
      self.skipTest("Missing LambdaExecutionRoleName in flat-outputs.json")

    try:
      response = self.iam_client.get_role(RoleName=self.role_name)
      self.assertEqual(response['Role']['RoleName'], self.role_name)
    except ClientError as e:
      self.fail(f"IAM Role does not exist: {str(e)}")

  @mark.it("API Gateway REST API exists")
  def test_api_gateway_rest_api_exists(self):
    if not self.api_id:
      self.skipTest("Missing ApiGatewayRestApiId in flat-outputs.json")

    try:
      response = self.apigw_client.get_rest_api(restApiId=self.api_id)
      self.assertEqual(response['id'], self.api_id)
    except ClientError as e:
      self.fail(f"API Gateway REST API not found: {str(e)}")
