import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}

REGION = "us-west-2"

@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the deployed TapStack resources using boto3"""

  @mark.it("KMS Key exists and is enabled")
  def test_kms_key_exists(self):
    kms_key_id = flat_outputs.get("KMSKeyId")
    self.assertIsNotNone(kms_key_id, "KMSKeyId output is missing")
    kms = boto3.client("kms", region_name=REGION)
    response = kms.describe_key(KeyId=kms_key_id)
    self.assertEqual(response["KeyMetadata"]["KeyState"], "Enabled")

  @mark.it("VPC exists")
  def test_vpc_exists(self):
    vpc_id = flat_outputs.get("VPCId")
    self.assertIsNotNone(vpc_id, "VPCId output is missing")
    ec2 = boto3.client("ec2", region_name=REGION)
    try:
      response = ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(len(response["Vpcs"]), 1)
    except ClientError as e:
      self.fail(f"VPC '{vpc_id}' does not exist: {e}")

  @mark.it("RDS instance exists and is available")
  def test_rds_instance_exists(self):
    endpoint = flat_outputs.get("DatabaseEndpoint")
    self.assertIsNotNone(endpoint, "DatabaseEndpoint output is missing")
    rds = boto3.client("rds", region_name=REGION)
    instances = rds.describe_db_instances()["DBInstances"]
    found = False
    for db in instances:
      if db.get("Endpoint", {}).get("Address") == endpoint:
        found = True
        self.assertEqual(db["DBInstanceStatus"], "available")
        break
    self.assertTrue(found, f"RDS instance with endpoint '{endpoint}' not found.")

  @mark.it("S3 buckets exist")
  def test_s3_buckets_exist(self):
    bucket_names = flat_outputs.get("S3BucketNames")
    self.assertIsNotNone(bucket_names, "S3BucketNames output is missing")
    s3 = boto3.client("s3", region_name=REGION)
    for bucket in bucket_names.split(","):
      try:
        s3.head_bucket(Bucket=bucket)
      except ClientError as e:
        self.fail(f"S3 bucket '{bucket}' does not exist or is not accessible: {e}")