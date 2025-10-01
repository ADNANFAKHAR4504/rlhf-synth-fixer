import json
import os
import unittest
import requests

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the flat-outputs.json file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
lambda_client = boto3.client("lambda")
s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
apigateway_client = boto3.client("apigateway")
sns_client = boto3.client("sns")
cloudwatch_client = boto3.client("cloudwatch")


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up the test environment"""
        self.flat_outputs = flat_outputs

    @mark.it("Validates the S3 bucket exists and has versioning enabled")
    def test_s3_bucket_exists(self):
        bucket_name = self.flat_outputs.get("LogsBucketName")
        self.assertIsNotNone(bucket_name, "LogsBucketName is missing in flat-outputs.json")

        try:
            # Check if the bucket exists
            s3_client.head_bucket(Bucket=bucket_name)

            # Check if versioning is enabled
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response.get("Status"), "Enabled", "S3 bucket versioning is not enabled")
            
            # Check if encryption is enabled
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn("ServerSideEncryptionConfiguration", response, "S3 bucket encryption is not configured")
            
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {e}")

    @mark.it("Validates the DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_exists(self):
        table_name = self.flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDBTableName is missing in flat-outputs.json")

        try:
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response["Table"]
            
            # Check table status
            self.assertEqual(table["TableStatus"], "ACTIVE", "DynamoDB table is not active")
            
            # Check primary key
            key_schema = table["KeySchema"]
            primary_key = next((key for key in key_schema if key["KeyType"] == "HASH"), None)
            self.assertIsNotNone(primary_key, "Primary key not found")
            self.assertEqual(primary_key["AttributeName"], "userId", "Primary key is not userId")
            
            # Check if GSI exists
            gsi = table.get("GlobalSecondaryIndexes", [])
            email_index = next((index for index in gsi if index["IndexName"] == "emailIndex"), None)
            self.assertIsNotNone(email_index, "emailIndex GSI not found")
            
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {e}")

    @mark.it("Validates the Lambda functions exist and are configured correctly")
    def test_lambda_functions_exist(self):
        try:
            # List all Lambda functions
            response = lambda_client.list_functions()
            functions = response["Functions"]
            
            # Look for ProcessUserFunction and GetUserFunction
            process_user_func = next((func for func in functions if "ProcessUserFunction" in func["FunctionName"]), None)
            get_user_func = next((func for func in functions if "GetUserFunction" in func["FunctionName"]), None)
            
            self.assertIsNotNone(process_user_func, "ProcessUserFunction not found")
            self.assertIsNotNone(get_user_func, "GetUserFunction not found")
            
            # Check runtime
            self.assertEqual(process_user_func["Runtime"], "python3.9", "ProcessUserFunction runtime is incorrect")
            self.assertEqual(get_user_func["Runtime"], "python3.9", "GetUserFunction runtime is incorrect")
            
            # Check timeout
            self.assertEqual(process_user_func["Timeout"], 30, "ProcessUserFunction timeout is incorrect")
            self.assertEqual(get_user_func["Timeout"], 30, "GetUserFunction timeout is incorrect")
            
            # Check environment variables
            env_vars = process_user_func.get("Environment", {}).get("Variables", {})
            self.assertIn("DYNAMODB_TABLE_NAME", env_vars, "DYNAMODB_TABLE_NAME env var not found")
            self.assertIn("LOGS_BUCKET_NAME", env_vars, "LOGS_BUCKET_NAME env var not found")
            
        except ClientError as e:
            self.fail(f"Failed to validate Lambda functions: {e}")

    @mark.it("Validates the API Gateway exists and has correct configuration")
    def test_api_gateway_endpoints(self):
        api_endpoint = self.flat_outputs.get("ApiEndpoint")
        process_user_endpoint = self.flat_outputs.get("ProcessUserEndpoint")
        get_user_endpoint = self.flat_outputs.get("GetUserEndpoint")

        self.assertIsNotNone(api_endpoint, "ApiEndpoint is missing in flat-outputs.json")
        self.assertIsNotNone(process_user_endpoint, "ProcessUserEndpoint is missing in flat-outputs.json")
        self.assertIsNotNone(get_user_endpoint, "GetUserEndpoint is missing in flat-outputs.json")

        try:
            # Extract API ID from the endpoint URL
            api_id = api_endpoint.split("//")[1].split(".")[0]
            
            # Get API Gateway details
            response = apigateway_client.get_rest_api(restApiId=api_id)
            self.assertIn("name", response, "API Gateway name not found")
            
            # Get resources and methods
            resources_response = apigateway_client.get_resources(restApiId=api_id)
            resources = resources_response["items"]
            
            # Check if /users resource exists
            users_resource = next((res for res in resources if res.get("pathPart") == "users"), None)
            self.assertIsNotNone(users_resource, "/users resource not found")
            
            # Check if POST method exists on /users
            if "resourceMethods" in users_resource:
                self.assertIn("POST", users_resource["resourceMethods"], "POST method not found on /users")
            
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {e}")

    @mark.it("Validates the SNS topic exists")
    def test_sns_topic_exists(self):
        topic_arn = self.flat_outputs.get("SNSTopicArn")
        self.assertIsNotNone(topic_arn, "SNSTopicArn is missing in flat-outputs.json")

        try:
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIn("Attributes", response, "SNS topic attributes not found")
            
            # Check display name
            display_name = response["Attributes"].get("DisplayName")
            self.assertIsNotNone(display_name, "SNS topic display name not found")
            
        except ClientError as e:
            self.fail(f"Failed to validate SNS topic: {e}")

    @mark.it("Validates CloudWatch alarms exist")
    def test_cloudwatch_alarms_exist(self):
        try:
            # List all alarms
            response = cloudwatch_client.describe_alarms()
            alarms = response["MetricAlarms"]
            
            # Look for Lambda error alarms
            lambda_alarms = [alarm for alarm in alarms if "LambdaErrorAlarm" in alarm["AlarmName"]]
            self.assertGreaterEqual(len(lambda_alarms), 2, "Expected at least 2 Lambda error alarms")
            
            # Check alarm configuration
            for alarm in lambda_alarms:
                self.assertEqual(alarm["ComparisonOperator"], "GreaterThanOrEqualToThreshold", 
                               "Alarm comparison operator is incorrect")
                self.assertEqual(alarm["Threshold"], 1.0, "Alarm threshold is incorrect")
                
        except ClientError as e:
            self.fail(f"Failed to validate CloudWatch alarms: {e}")

    @mark.it("Validates DynamoDB data operations")
    def test_dynamodb_operations(self):
        """Test DynamoDB operations directly"""
        table_name = self.flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDBTableName is missing in flat-outputs.json")
        
        try:
            # Test putting an item
            test_item = {
                "userId": {"S": "integration-test-user"},
                "email": {"S": "integration@test.com"},
                "name": {"S": "Integration Test User"}
            }
            
            dynamodb_client.put_item(TableName=table_name, Item=test_item)
            
            # Test getting the item
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={"userId": {"S": "integration-test-user"}}
            )
            
            self.assertIn("Item", response, "Item not found in DynamoDB")
            item = response["Item"]
            self.assertEqual(item["userId"]["S"], "integration-test-user", "Retrieved userId doesn't match")
            
            # Clean up - delete the test item
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={"userId": {"S": "integration-test-user"}}
            )
            
        except ClientError as e:
            self.fail(f"DynamoDB operations test failed: {e}")
