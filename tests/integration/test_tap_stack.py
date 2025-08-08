import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

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

  def setUp(self):
    # Set the correct region
    self.region = "us-west-2"

  @mark.it("KMS Key exists and is enabled")
  def test_kms_key_exists(self):
    kms_arn = flat_outputs.get("KmsKeyArn")
    self.assertIsNotNone(kms_arn, "KmsKeyArn output is missing")
    # Extract key ID from ARN if it's a full ARN
    if kms_arn.startswith("arn:aws:kms:"):
      key_id = kms_arn.split("/")[-1]
    else:
      key_id = kms_arn
    
    kms = boto3.client("kms", region_name=self.region)
    response = kms.describe_key(KeyId=key_id)
    self.assertEqual(response["KeyMetadata"]["KeyState"], "Enabled")

  @mark.it("CloudTrail S3 bucket exists")
  def test_cloudtrail_bucket_exists(self):
    bucket_name = flat_outputs.get("CloudTrailBucketName")
    self.assertIsNotNone(bucket_name, "CloudTrailBucketName output is missing")
    s3 = boto3.client("s3", region_name=self.region)
    try:
      s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
      self.fail(f"S3 bucket '{bucket_name}' does not exist or is not accessible: {e}")

  @mark.it("Config S3 bucket exists")
  def test_config_bucket_exists(self):
    bucket_name = flat_outputs.get("ConfigBucketName")
    self.assertIsNotNone(bucket_name, "ConfigBucketName output is missing")
    s3 = boto3.client("s3", region_name=self.region)
    try:
      s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
      self.fail(f"S3 bucket '{bucket_name}' does not exist or is not accessible: {e}")

  @mark.it("VPC exists")
  def test_vpc_exists(self):
    vpc_id = flat_outputs.get("VpcId")
    self.assertIsNotNone(vpc_id, "VpcId output is missing")
    ec2 = boto3.client("ec2", region_name=self.region)
    try:
      response = ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(len(response["Vpcs"]), 1)
    except ClientError as e:
      self.fail(f"VPC '{vpc_id}' does not exist: {e}")

  @mark.it("RDS instance exists and is available")
  def test_rds_instance_exists(self):
    endpoint = flat_outputs.get("RdsEndpointAddress")
    self.assertIsNotNone(endpoint, "RdsEndpointAddress output is missing")
    rds = boto3.client("rds", region_name=self.region)
    try:
      instances = rds.describe_db_instances()["DBInstances"]
      found = False
      for db in instances:
        if db.get("Endpoint", {}).get("Address") == endpoint:
          found = True
          self.assertEqual(db["DBInstanceStatus"], "available")
          break
      self.assertTrue(found, f"RDS instance with endpoint '{endpoint}' not found.")
    except ClientError as e:
      self.fail(f"Error checking RDS instances: {e}")

  @mark.it("Lambda function exists")
  def test_lambda_exists(self):
    function_name = flat_outputs.get("LambdaFunctionName")
    self.assertIsNotNone(function_name, "LambdaFunctionName output is missing")
    lambda_client = boto3.client("lambda", region_name=self.region)
    try:
      response = lambda_client.get_function(FunctionName=function_name)
      self.assertIn("Configuration", response)
    except ClientError as e:
      self.fail(f"Lambda function '{function_name}' does not exist: {e}")

  @mark.it("SQS DLQ exists")
  def test_dlq_exists(self):
    dlq_name = flat_outputs.get("DLQName")
    self.assertIsNotNone(dlq_name, "DLQName output is missing")
    sqs = boto3.client("sqs", region_name=self.region)
    try:
      # List all queues and check if our DLQ exists
      queues = sqs.list_queues().get("QueueUrls", [])
      found = any(dlq_name in url for url in queues)
      self.assertTrue(found, f"SQS DLQ '{dlq_name}' not found.")
    except ClientError as e:
      self.fail(f"Error checking SQS queues: {e}")

  @mark.it("AWS Config rule exists")
  def test_config_rule_exists(self):
    config_client = boto3.client("config", region_name=self.region)
    try:
      rules = config_client.describe_config_rules()
      rule_names = [rule["ConfigRuleName"] for rule in rules["ConfigRules"]]
      found = any("S3BucketPublicAccessProhibited" in name for name in rule_names)
      self.assertTrue(found, "S3 public access Config rule not found")
    except ClientError as e:
      if "ConfigurationRecorderNotAvailable" in str(e):
        self.skipTest("AWS Config is not properly configured in this account/region")
      else:
        self.fail(f"Unexpected error checking Config rule: {e}")
