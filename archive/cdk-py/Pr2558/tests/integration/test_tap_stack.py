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
    """Integration tests for the deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients for integration tests"""
        self.s3_client = boto3.client('s3')
        self.dynamodb_client = boto3.client('dynamodb')
        self.rds_client = boto3.client('rds')
        self.elb_client = boto3.client('elbv2')
        self.lambda_client = boto3.client('lambda')
        self.sns_client = boto3.client('sns')
        self.apigateway_client = boto3.client('apigateway')

    @mark.it("Validate S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        bucket_name = flat_outputs.get("S3BucketName")
        self.assertIsNotNone(bucket_name, "S3 bucket name is missing in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("Validate DynamoDB table exists")
    def test_dynamodb_table_exists(self):
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in outputs")

        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("Validate RDS instance exists and is available")
    def test_rds_instance_exists(self):
        rds_endpoint = flat_outputs.get("RDSEndpoint")
        self.assertIsNotNone(rds_endpoint, "RDS endpoint is missing in outputs")

        try:
            response = self.rds_client.describe_db_instances()
            rds_instances = [db['Endpoint']['Address'] for db in response['DBInstances']]
            self.assertIn(rds_endpoint, rds_instances, "RDS instance is not available")
        except ClientError as e:
            self.fail(f"RDS instance validation failed: {e}")

    @mark.it("Validate Application Load Balancer exists")
    def test_alb_exists(self):
        alb_dns_name = flat_outputs.get("ALBDNSName")
        self.assertIsNotNone(alb_dns_name, "ALB DNS name is missing in outputs")

        try:
            response = self.elb_client.describe_load_balancers()
            alb_dns_names = [lb['DNSName'] for lb in response['LoadBalancers']]
            self.assertIn(alb_dns_name, alb_dns_names, "ALB is not available")
        except ClientError as e:
            self.fail(f"ALB validation failed: {e}")

    @mark.it("Validate Lambda function exists")
    def test_lambda_function_exists(self):
        lambda_function_name = flat_outputs.get("LambdaFunctionName")
        self.assertIsNotNone(lambda_function_name, "Lambda function name is missing in outputs")

        try:
            response = self.lambda_client.get_function(FunctionName=lambda_function_name)
            self.assertEqual(response['Configuration']['FunctionName'], lambda_function_name)
        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("Validate SNS topic exists")
    def test_sns_topic_exists(self):
        sns_topic_arn = flat_outputs.get("SNSTopicArn")
        self.assertIsNotNone(sns_topic_arn, "SNS topic ARN is missing in outputs")

        try:
            response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertEqual(response['Attributes']['TopicArn'], sns_topic_arn)
        except ClientError as e:
            self.fail(f"SNS topic validation failed: {e}")

    @mark.it("Validate API Gateway exists")
    def test_api_gateway_exists(self):
        api_gateway_url = flat_outputs.get("APIGatewayURL")
        self.assertIsNotNone(api_gateway_url, "API Gateway URL is missing in outputs")

        try:
            response = self.apigateway_client.get_rest_apis()
            api_gateway_ids = [api['id'] for api in response['items']]
            api_id_from_url = api_gateway_url.split("//")[1].split(".")[0]
            self.assertIn(api_id_from_url, api_gateway_ids, "API Gateway is not available")
        except ClientError as e:
            self.fail(f"API Gateway validation failed: {e}")
