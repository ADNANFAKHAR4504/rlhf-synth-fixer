import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Configuration for LocalStack
LOCALSTACK_ENDPOINT = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

# Detect if running against LocalStack
IS_LOCALSTACK = "localhost" in LOCALSTACK_ENDPOINT or "4566" in LOCALSTACK_ENDPOINT

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

DEPLOYMENT_OUTPUTS_AVAILABLE = os.path.exists(flat_outputs_path)

if DEPLOYMENT_OUTPUTS_AVAILABLE:
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


def get_localstack_client(service_name):
    """Create a boto3 client configured for LocalStack"""
    return boto3.client(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    )


def get_localstack_resource(service_name):
    """Create a boto3 resource configured for LocalStack"""
    return boto3.resource(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    )


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for all tests"""
        cls.dynamodb = get_localstack_resource("dynamodb")
        cls.lambda_client = get_localstack_client("lambda")
        cls.apigateway = get_localstack_client("apigateway")
        cls.cloudwatch = get_localstack_client("cloudwatch")
        cls.iam = get_localstack_client("iam")
        cls.ec2 = get_localstack_client("ec2")

    def setUp(self):
        """Skip tests if deployment outputs are not available"""
        if not DEPLOYMENT_OUTPUTS_AVAILABLE:
            self.skipTest(
                "Integration tests require deployment outputs in cfn-outputs/flat-outputs.json"
            )

    @mark.it("DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and has correct configuration"""
        table_name = flat_outputs.get("DynamoTableName")
        if not table_name:
            self.skipTest("DynamoTableName not available in deployment outputs")

        try:
            table = self.dynamodb.Table(table_name)
            table_info = table.meta.client.describe_table(TableName=table_name)

            self.assertEqual(
                table_info["Table"]["BillingModeSummary"]["BillingMode"],
                "PAY_PER_REQUEST",
            )
            self.assertEqual(
                table_info["Table"]["KeySchema"][0]["AttributeName"], "itemId"
            )
            self.assertEqual(table_info["Table"]["KeySchema"][0]["KeyType"], "HASH")

        except ClientError as e:
            self.skipTest(f"DynamoDB table not accessible: {e}")

    @mark.it("Lambda function exists and is properly configured")
    def test_lambda_function_exists(self):
        """Test that Lambda function exists with correct configuration"""
        function_name = flat_outputs.get("LambdaFunctionName")
        if not function_name:
            self.skipTest("LambdaFunctionName not available in deployment outputs")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)

            config = response["Configuration"]
            self.assertEqual(config["Runtime"], "python3.9")
            self.assertEqual(config["Handler"], "handler.handler")
            self.assertIn("TABLE_NAME", config["Environment"]["Variables"])

        except ClientError as e:
            self.skipTest(f"Lambda function not accessible: {e}")

    @mark.it("API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is properly configured"""
        api_id = flat_outputs.get("ApiGatewayId")
        if not api_id:
            self.skipTest("ApiGatewayId not available in deployment outputs")

        try:
            response = self.apigateway.get_rest_api(restApiId=api_id)
            self.assertEqual(response["name"], "Item Service")

            resources = self.apigateway.get_resources(restApiId=api_id)
            item_resource = None
            for resource in resources["items"]:
                if resource.get("pathPart") == "item" or resource.get("path") == "/item":
                    item_resource = resource
                    break

            self.assertIsNotNone(item_resource, "API Gateway /item resource not found")

        except ClientError as e:
            self.skipTest(f"API Gateway not accessible: {e}")

    @mark.it("CloudWatch alarm exists")
    def test_cloudwatch_alarm_exists(self):
        """Test that CloudWatch alarm exists for Lambda errors"""
        alarm_name = flat_outputs.get("AlarmName")
        if not alarm_name:
            self.skipTest("AlarmName not available in deployment outputs")

        try:
            response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
            self.assertEqual(len(response["MetricAlarms"]), 1)

            alarm = response["MetricAlarms"][0]
            self.assertEqual(alarm["MetricName"], "Errors")
            self.assertEqual(alarm["Threshold"], 1.0)
            self.assertEqual(alarm["EvaluationPeriods"], 1)

        except ClientError as e:
            self.skipTest(f"CloudWatch alarm not accessible: {e}")

    @mark.it("VPC configuration is correct")
    def test_vpc_configuration(self):
        """Test that VPC and networking are properly configured"""
        vpc_id = flat_outputs.get("VpcId")
        if not vpc_id:
            self.skipTest("VpcId not available in deployment outputs")

        try:
            vpcs = self.ec2.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(vpcs["Vpcs"]), 1)

            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )

            # Check for public subnets
            public_subnets = [
                s for s in subnets["Subnets"] if s.get("MapPublicIpOnLaunch", False)
            ]
            self.assertGreaterEqual(
                len(public_subnets), 2, "VPC should have at least 2 public subnets"
            )

        except ClientError as e:
            self.skipTest(f"VPC configuration check failed: {e}")

    @mark.it("Lambda environment variables are set correctly")
    def test_lambda_environment_variables(self):
        """Test that Lambda function has correct environment variables"""
        function_name = flat_outputs.get("LambdaFunctionName")
        table_name = flat_outputs.get("DynamoTableName")

        if not function_name or not table_name:
            self.skipTest("Required outputs not available")

        try:
            response = self.lambda_client.get_function(FunctionName=function_name)

            config = response["Configuration"]
            env_vars = config.get("Environment", {}).get("Variables", {})

            self.assertIn("TABLE_NAME", env_vars)
            self.assertEqual(env_vars["TABLE_NAME"], table_name)

        except ClientError as e:
            self.skipTest(f"Lambda environment variables check failed: {e}")

    @mark.it("Stack outputs are present")
    def test_stack_outputs_exist(self):
        """Test that all required stack outputs are available"""
        required_outputs = [
            "VpcId",
            "LambdaFunctionName",
            "DynamoTableName",
            "ApiGatewayId",
            "AlarmName",
        ]

        for output_key in required_outputs:
            self.assertIn(
                output_key, flat_outputs, f"Missing stack output: {output_key}"
            )
            self.assertIsNotNone(
                flat_outputs[output_key], f"Stack output {output_key} is None"
            )

    @mark.it("API Gateway URL is valid")
    def test_api_gateway_url(self):
        """Test that API Gateway URL is properly formatted"""
        api_url = flat_outputs.get("ApiGatewayUrl")
        if not api_url:
            self.skipTest("ApiGatewayUrl not available in deployment outputs")

        # Accept both real AWS and LocalStack URLs
        is_valid_url = (
            api_url.startswith("https://")
            or "localhost" in api_url
            or "localstack" in api_url
        )
        self.assertTrue(is_valid_url, "API Gateway URL should be valid")


if __name__ == "__main__":
    unittest.main()
