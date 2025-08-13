import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load outputs from cfn-outputs/flat-outputs.json
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

  @mark.it("VPC exists")
  def test_vpc_exists(self):
    vpc_id = flat_outputs.get("VpcId")
    self.assertIsNotNone(vpc_id, "VpcId output is missing")
    ec2 = boto3.client("ec2", region_name=REGION)
    try:
      response = ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(len(response["Vpcs"]), 1)
    except ClientError as e:
      self.fail(f"VPC '{vpc_id}' does not exist: {e}")

  @mark.it("S3 buckets exist and are encrypted")
  def test_s3_buckets_exist_and_encrypted(self):
    for bucket_key in ["WebAssetsBucketName", "UserUploadsBucketName", "AppDataBucketName"]:
      bucket_name = flat_outputs.get(bucket_key)
      self.assertIsNotNone(bucket_name, f"{bucket_key} output is missing")
      s3 = boto3.client("s3", region_name=REGION)
      try:
        s3.head_bucket(Bucket=bucket_name)
        enc = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
        self.assertTrue(any(
          rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"
          for rule in rules
        ))
      except ClientError as e:
        self.fail(f"S3 bucket '{bucket_name}' does not exist or is not encrypted: {e}")

  @mark.it("RDS instance exists")
  def test_rds_instance_exists(self):
    rds_id = flat_outputs.get("RdsInstanceIdentifier")
    self.assertIsNotNone(rds_id, "RdsInstanceIdentifier output is missing")
    rds = boto3.client("rds", region_name=REGION)
    try:
      response = rds.describe_db_instances(DBInstanceIdentifier=rds_id)
      self.assertEqual(len(response["DBInstances"]), 1)
      db = response["DBInstances"][0]
      self.assertTrue(db["StorageEncrypted"])
      self.assertEqual(db["Engine"], "mysql")
    except ClientError as e:
      self.fail(f"RDS instance '{rds_id}' does not exist or is not encrypted: {e}")

  @mark.it("S3 KMS key exists")
  def test_s3_kms_key_exists(self):
    key_id = flat_outputs.get("S3KmsKeyId")
    self.assertIsNotNone(key_id, "S3KmsKeyId output is missing")
    kms = boto3.client("kms", region_name=REGION)
    try:
      response = kms.describe_key(KeyId=key_id)
      self.assertEqual(response["KeyMetadata"]["KeyId"], key_id)
      self.assertTrue(response["KeyMetadata"]["Enabled"])
    except ClientError as e:
      self.fail(f"KMS key '{key_id}' does not exist or is not enabled: {e}")