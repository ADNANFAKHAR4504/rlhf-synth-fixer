import json
import os
import unittest
import boto3
import requests
from botocore.exceptions import ClientError, NoCredentialsError
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
  """Integration tests for deployed TapStack resources using cfn-outputs/flat-outputs.json"""

  @classmethod
  def setUpClass(cls):
    """Set up AWS clients and load outputs"""
    # Load outputs
    cls.outputs = flat_outputs
    
    # Set up AWS clients
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    try:
      cls.s3 = boto3.client("s3", region_name=region)
      cls.dynamodb = boto3.client("dynamodb", region_name=region)
      cls.dynamodb_resource = boto3.resource("dynamodb", region_name=region)
      cls.sns = boto3.client("sns", region_name=region)
      cls.lambda_client = boto3.client("lambda", region_name=region)
      cls.apigw = boto3.client("apigateway", region_name=region)
      cls.ec2 = boto3.client("ec2", region_name=region)
      cls.kms = boto3.client("kms", region_name=region)
      cls.secrets_manager = boto3.client("secretsmanager", region_name=region)
      cls.cloudtrail = boto3.client("cloudtrail", region_name=region)
      cls.logs = boto3.client("logs", region_name=region)
    except NoCredentialsError:
      cls.skipTest("AWS credentials not configured")

  def skip_if_output_missing(self, key):
    """Skip test if required output is missing"""
    if key not in self.outputs or not self.outputs[key]:
      self.skipTest(f"Output '{key}' not found in flat-outputs.json")

  @mark.it("S3 bucket exists and has correct encryption")
  def test_s3_bucket_exists_and_encrypted(self):
    self.skip_if_output_missing("S3BucketOutput")
    bucket_name = self.outputs["S3BucketOutput"]
    
    try:
      # Check bucket exists
      self.s3.head_bucket(Bucket=bucket_name)
      
      # Check encryption
      resp = self.s3.get_bucket_encryption(Bucket=bucket_name)
      rules = resp["ServerSideEncryptionConfiguration"]["Rules"]
      algo = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
      self.assertEqual(algo, "aws:kms")
      
      # Check versioning
      versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
      self.assertEqual(versioning.get("Status"), "Enabled")
      
      # Check public access block
      public_access = self.s3.get_public_access_block(Bucket=bucket_name)
      config = public_access["PublicAccessBlockConfiguration"]
      self.assertTrue(config["BlockPublicAcls"])
      self.assertTrue(config["BlockPublicPolicy"])
      self.assertTrue(config["IgnorePublicAcls"])
      self.assertTrue(config["RestrictPublicBuckets"])
      
    except ClientError as e:
      self.fail(f"S3 bucket test failed: {e}")

  @mark.it("DynamoDB table exists with correct configuration")
  def test_dynamodb_table_exists(self):
    self.skip_if_output_missing("DDBTableOutput")
    table_name = self.outputs["DDBTableOutput"]
    
    try:
      resp = self.dynamodb.describe_table(TableName=table_name)
      table = resp["Table"]
      
      # Check table name
      self.assertEqual(table["TableName"], table_name)
      
      # Check key schema
      key_schema = table["KeySchema"]
      self.assertEqual(len(key_schema), 2)
      self.assertEqual(key_schema[0]["AttributeName"], "objectKey")
      self.assertEqual(key_schema[0]["KeyType"], "HASH")
      self.assertEqual(key_schema[1]["AttributeName"], "uploadTime")
      self.assertEqual(key_schema[1]["KeyType"], "RANGE")
      
      # Check billing mode
      self.assertEqual(table["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")
      
      # Check encryption
      self.assertTrue(table["SSEDescription"]["Status"] in ["ENABLED", "ENABLING"])
      
      # Check stream
      self.assertIn("StreamSpecification", table)
      self.assertTrue(table["StreamSpecification"]["StreamEnabled"])
      
    except ClientError as e:
      self.fail(f"DynamoDB table test failed: {e}")

  @mark.it("SNS topic exists")
  def test_sns_topic_exists(self):
    self.skip_if_output_missing("SNSTopicOutput")
    topic_arn = self.outputs["SNSTopicOutput"]
    
    try:
      resp = self.sns.get_topic_attributes(TopicArn=topic_arn)
      self.assertEqual(resp["Attributes"]["TopicArn"], topic_arn)
      
      # Check KMS encryption
      self.assertIn("KmsMasterKeyId", resp["Attributes"])
      
    except ClientError as e:
      self.fail(f"SNS topic test failed: {e}")

  @mark.it("Lambda function exists and is active")
  def test_lambda_function_exists(self):
    self.skip_if_output_missing("LambdaFunctionOutput")
    lambda_name = self.outputs["LambdaFunctionOutput"]
    
    try:
      resp = self.lambda_client.get_function(FunctionName=lambda_name)
      config = resp["Configuration"]
      
      self.assertEqual(config["FunctionName"], lambda_name)
      self.assertEqual(config["State"], "Active")
      self.assertEqual(config["Runtime"], "python3.11")
      self.assertEqual(config["Handler"], "index.lambda_handler")
      self.assertEqual(config["Timeout"], 30)
      self.assertEqual(config["MemorySize"], 256)
      
      # Check VPC configuration
      self.assertIn("VpcConfig", config)
      self.assertIsNotNone(config["VpcConfig"]["VpcId"])
      
      # Check environment variables
      env_vars = config["Environment"]["Variables"]
      self.assertIn("DDB_TABLE", env_vars)
      self.assertIn("SNS_TOPIC", env_vars)
      self.assertIn("S3_BUCKET", env_vars)
      
    except ClientError as e:
      self.fail(f"Lambda function test failed: {e}")

  @mark.it("API Gateway exists and health endpoint responds")
  def test_api_gateway_exists_and_health_check(self):
    self.skip_if_output_missing("ApiGatewayOutput")
    api_url = self.outputs["ApiGatewayOutput"]
    
    try:
      # Test health endpoint
      health_url = f"{api_url}health"
      response = requests.get(health_url, timeout=10)
      
      self.assertEqual(response.status_code, 200)
      response_data = response.json()
      self.assertEqual(response_data["status"], "healthy")
      self.assertEqual(response_data["service"], "tap-microservice")
      
    except Exception as e:
      self.fail(f"API Gateway health check failed: {e}")

  @mark.it("VPC exists with correct configuration")
  def test_vpc_exists(self):
    self.skip_if_output_missing("VpcIdOutput")
    vpc_id = self.outputs["VpcIdOutput"]
    
    try:
      resp = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = resp["Vpcs"][0]
      
      self.assertEqual(vpc["VpcId"], vpc_id)
      self.assertTrue(vpc["EnableDnsHostnames"])
      self.assertTrue(vpc["EnableDnsSupport"])
      
    except ClientError as e:
      self.fail(f"VPC test failed: {e}")

  @mark.it("Public subnets exist and are properly configured")
  def test_public_subnet_ids_exist(self):
    self.skip_if_output_missing("PublicSubnetIdsOutput")
    subnet_ids = self.outputs["PublicSubnetIdsOutput"].split(",")
    
    try:
      resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
      subnets = resp["Subnets"]
      
      self.assertEqual(len(subnets), len(subnet_ids))
      
      # Check each subnet is in a public route table
      for subnet in subnets:
        route_tables = self.ec2.describe_route_tables(
          Filters=[
            {"Name": "association.subnet-id", "Values": [subnet["SubnetId"]]}
          ]
        )["RouteTables"]
        
        # Check for internet gateway route
        has_igw_route = any(
          route.get("GatewayId", "").startswith("igw-")
          for rt in route_tables
          for route in rt.get("Routes", [])
        )
        self.assertTrue(has_igw_route, f"Subnet {subnet['SubnetId']} is not public")
        
    except ClientError as e:
      self.fail(f"Public subnet test failed: {e}")

  @mark.it("Private subnets exist and are properly configured")
  def test_private_subnet_ids_exist(self):
    self.skip_if_output_missing("PrivateSubnetIdsOutput")
    subnet_ids = self.outputs["PrivateSubnetIdsOutput"].split(",")
    
    try:
      resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
      subnets = resp["Subnets"]
      
      self.assertEqual(len(subnets), len(subnet_ids))
      
      # Check each subnet has NAT gateway route
      for subnet in subnets:
        route_tables = self.ec2.describe_route_tables(
          Filters=[
            {"Name": "association.subnet-id", "Values": [subnet["SubnetId"]]}
          ]
        )["RouteTables"]
        
        # Check for NAT gateway route
        has_nat_route = any(
          route.get("NatGatewayId", "").startswith("nat-")
          for rt in route_tables
          for route in rt.get("Routes", [])
        )
        self.assertTrue(has_nat_route, f"Subnet {subnet['SubnetId']} doesn't have NAT route")
        
    except ClientError as e:
      self.fail(f"Private subnet test failed: {e}")

  @mark.it("Lambda function can be invoked successfully")
  def test_lambda_function_invocation(self):
    self.skip_if_output_missing("LambdaFunctionOutput")
    lambda_name = self.outputs["LambdaFunctionOutput"]
    
    try:
      # Invoke Lambda function with test payload
      test_payload = {
        "test": True,
        "message": "Integration test"
      }
      
      response = self.lambda_client.invoke(
        FunctionName=lambda_name,
        InvocationType="RequestResponse",
        Payload=json.dumps(test_payload)
      )
      
      self.assertEqual(response["StatusCode"], 200)
      
      # Parse response
      response_payload = json.loads(response["Payload"].read())
      self.assertEqual(response_payload["statusCode"], 200)
      
      response_body = json.loads(response_payload["body"])
      self.assertEqual(response_body["message"], "Data processed successfully")
      self.assertIn("timestamp", response_body)
      
    except ClientError as e:
      self.fail(f"Lambda invocation test failed: {e}")

  @mark.it("S3 bucket notifications trigger Lambda")
  def test_s3_lambda_integration(self):
    self.skip_if_output_missing("S3BucketOutput")
    self.skip_if_output_missing("LambdaFunctionOutput")
    self.skip_if_output_missing("DDBTableOutput")
    
    bucket_name = self.outputs["S3BucketOutput"]
    table_name = self.outputs["DDBTableOutput"]
    test_key = "integration-test/test-file.txt"
    test_content = "Integration test content"
    
    try:
      # Upload test file to S3
      self.s3.put_object(
        Bucket=bucket_name,
        Key=test_key,
        Body=test_content
      )
      
      # Wait a moment for Lambda to process
      import time
      time.sleep(5)
      
      # Check if record was created in DynamoDB
      table = self.dynamodb_resource.Table(table_name)
      
      # Query for the test object
      response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('objectKey').eq(test_key)
      )
      
      self.assertGreater(len(response['Items']), 0, "No records found in DynamoDB")
      
      item = response['Items'][0]
      self.assertEqual(item['objectKey'], test_key)
      self.assertEqual(item['eventType'], 'S3_OBJECT_CREATED')
      self.assertEqual(item['bucketName'], bucket_name)
      
      # Clean up
      self.s3.delete_object(Bucket=bucket_name, Key=test_key)
      
    except Exception as e:
      self.fail(f"S3-Lambda integration test failed: {e}")

  @mark.it("API Gateway process endpoint works")
  def test_api_gateway_process_endpoint(self):
    self.skip_if_output_missing("ApiGatewayOutput")
    api_url = self.outputs["ApiGatewayOutput"]
    
    try:
      # Test process endpoint
      process_url = f"{api_url}process"
      test_data = {"test": "integration test data"}
      
      response = requests.post(
        process_url,
        json=test_data,
        headers={"Content-Type": "application/json"},
        timeout=10
      )
      
      self.assertEqual(response.status_code, 200)
      response_data = response.json()
      self.assertEqual(response_data["message"], "Processing initiated")
      
    except Exception as e:
      self.fail(f"API Gateway process endpoint test failed: {e}")

  @mark.it("CloudTrail is logging API calls")
  def test_cloudtrail_logging(self):
    try:
      # Check if CloudTrail is active
      trails = self.cloudtrail.describe_trails()["trailList"]
      tap_trails = [t for t in trails if "tap-microservice-trail" in t["Name"]]
      
      self.assertGreater(len(tap_trails), 0, "TAP CloudTrail not found")
      
      trail = tap_trails[0]
      self.assertTrue(trail["IncludeGlobalServiceEvents"])
      self.assertTrue(trail["IsMultiRegionTrail"])
      self.assertTrue(trail["LogFileValidationEnabled"])
      
      # Verify the trail has a valid S3 bucket
      self.assertIsNotNone(trail.get("S3BucketName"))
      
      # Check trail status - most important validation
      status = self.cloudtrail.get_trail_status(Name=trail["TrailARN"])
      self.assertTrue(status["IsLogging"])
      
      # Optional: Print trail info for debugging
      print(f"CloudTrail found: {trail['Name']}")
      print(f"S3 Bucket: {trail.get('S3BucketName')}")
      print(f"Is Logging: {status['IsLogging']}")
      
    except Exception as e:
      self.fail(f"CloudTrail test failed: {e}")

  @mark.it("VPC Flow Logs are enabled")
  def test_vpc_flow_logs(self):
    self.skip_if_output_missing("VpcIdOutput")
    vpc_id = self.outputs["VpcIdOutput"]
    
    try:
      # Check VPC Flow Logs
      flow_logs = self.ec2.describe_flow_logs(
        Filters=[
          {"Name": "resource-id", "Values": [vpc_id]}
        ]
      )["FlowLogs"]
      
      self.assertGreater(len(flow_logs), 0, "No VPC Flow Logs found")
      
      flow_log = flow_logs[0]
      self.assertEqual(flow_log["FlowLogStatus"], "ACTIVE")
      self.assertEqual(flow_log["TrafficType"], "ALL")
      self.assertEqual(flow_log["LogDestinationType"], "cloud-watch-logs")
      
    except Exception as e:
      self.fail(f"VPC Flow Logs test failed: {e}")

  @mark.it("Secrets Manager secrets exist and are encrypted")
  def test_secrets_manager_secrets(self):
    try:
      # List secrets
      secrets = self.secrets_manager.list_secrets()["SecretList"]
      tap_secrets = [s for s in secrets if any(tag.get("Value") == "tap" for tag in s.get("Tags", []))]
      
      self.assertGreaterEqual(len(tap_secrets), 2, "Expected at least 2 TAP secrets")
      
      for secret in tap_secrets:
        # Check encryption
        self.assertIsNotNone(secret.get("KmsKeyId"))
        
        # Try to retrieve secret (should work with proper permissions)
        try:
          secret_value = self.secrets_manager.get_secret_value(SecretId=secret["ARN"])
          self.assertIsNotNone(secret_value["SecretString"])
        except ClientError as e:
          if e.response["Error"]["Code"] != "AccessDenied":
            raise
          
    except Exception as e:
      self.fail(f"Secrets Manager test failed: {e}")

if __name__ == "__main__":
  unittest.main()
