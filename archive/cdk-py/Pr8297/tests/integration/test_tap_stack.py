import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# LocalStack configuration
LOCALSTACK_ENDPOINT = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
os.environ["AWS_ACCESS_KEY_ID"] = os.getenv("AWS_ACCESS_KEY_ID", "test")
os.environ["AWS_SECRET_ACCESS_KEY"] = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TapStack resources using boto3"""

    @mark.it("Lambda function exists")
    def test_lambda_function_exists(self):
        function_name = flat_outputs.get("LambdaFunctionName")
        self.assertIsNotNone(function_name, "LambdaFunctionName output is missing")
        lambda_client = boto3.client("lambda", region_name=REGION, endpoint_url=LOCALSTACK_ENDPOINT)
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            self.assertIn("Configuration", response)
        except ClientError as e:
            self.fail(f"Lambda function '{function_name}' does not exist: {e}")

    @mark.it("API Gateway endpoint is reachable")
    def test_api_gateway_endpoint_reachable(self):
        api_endpoint = flat_outputs.get("ApiEndpoint")
        self.assertIsNotNone(api_endpoint, "ApiEndpoint output is missing")
        import requests
        try:
            response = requests.get(api_endpoint)
            self.assertIn(response.status_code, [200, 403, 401])
        except Exception as e:
            self.fail(f"API Gateway endpoint '{api_endpoint}' is not reachable: {e}")

    @mark.it("Lambda function ARN matches deployed function")
    def test_lambda_function_arn(self):
        function_name = flat_outputs.get("LambdaFunctionName")
        function_arn = flat_outputs.get("LambdaFunctionArn")
        self.assertIsNotNone(function_name, "LambdaFunctionName output is missing")
        self.assertIsNotNone(function_arn, "LambdaFunctionArn output is missing")
        lambda_client = boto3.client("lambda", region_name=REGION, endpoint_url=LOCALSTACK_ENDPOINT)
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            deployed_arn = response["Configuration"]["FunctionArn"]
            self.assertEqual(function_arn, deployed_arn)
        except ClientError as e:
            self.fail(f"Could not validate Lambda ARN: {e}")

    @mark.it("API Gateway ID exists")
    def test_api_gateway_id_exists(self):
        api_id = flat_outputs.get("HttpApiId")
        self.assertIsNotNone(api_id, "HttpApiId output is missing")
        apigw = boto3.client("apigatewayv2", region_name=REGION, endpoint_url=LOCALSTACK_ENDPOINT)
        try:
            response = apigw.get_api(ApiId=api_id)
            self.assertEqual(response["ApiId"], api_id)
        except ClientError as e:
            self.fail(f"API Gateway with ID '{api_id}' does not exist: {e}")
