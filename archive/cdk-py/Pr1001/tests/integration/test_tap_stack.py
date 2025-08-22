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

  @mark.it("S3 bucket exists and is encrypted")
  def test_app_bucket_exists_and_encrypted(self):
    bucket_name = flat_outputs.get("AppBucketName")
    self.assertIsNotNone(bucket_name, "AppBucketName output is missing")
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

  @mark.it("CloudTrail exists")
  def test_cloudtrail_exists(self):
    trail_arn = flat_outputs.get("CloudTrailArn")
    self.assertIsNotNone(trail_arn, "CloudTrailArn output is missing")
    cloudtrail_client = boto3.client("cloudtrail", region_name=REGION)
    try:
      trails = cloudtrail_client.list_trails()["Trails"]
      arns = [t["TrailARN"] for t in trails]
      self.assertIn(trail_arn, arns)
    except ClientError as e:
      self.fail(f"CloudTrail '{trail_arn}' does not exist: {e}")

  @mark.it("Backup vault exists")
  def test_backup_vault_exists(self):
    vault_name = flat_outputs.get("BackupVaultName")
    self.assertIsNotNone(vault_name, "BackupVaultName output is missing")
    backup_client = boto3.client("backup", region_name=REGION)
    try:
      vaults = backup_client.list_backup_vaults()["BackupVaultList"]
      names = [v["BackupVaultName"] for v in vaults]
      self.assertIn(vault_name, names)
    except ClientError as e:
      self.fail(f"Backup vault '{vault_name}' does not exist: {e}")

  @mark.it("Lambda function exists")
  def test_lambda_function_exists(self):
    function_name = flat_outputs.get("LambdaFunctionName")
    self.assertIsNotNone(function_name, "LambdaFunctionName output is missing")
    lambda_client = boto3.client("lambda", region_name=REGION)
    try:
      response = lambda_client.get_function(FunctionName=function_name)
      self.assertIn("Configuration", response)
    except ClientError as e:
      self.fail(f"Lambda function '{function_name}' does not exist: {e}")

  @mark.it("WAF Web ACL exists")
  def test_waf_web_acl_exists(self):
    web_acl_arn = flat_outputs.get("WebAclArn")
    self.assertIsNotNone(web_acl_arn, "WebAclArn output is missing")
    wafv2 = boto3.client("wafv2", region_name=REGION)
    try:
      scope = "REGIONAL"
      arn_parts = web_acl_arn.split(":")
      name = web_acl_arn.split("/")[-2]
      id_ = web_acl_arn.split("/")[-1]
      response = wafv2.get_web_acl(Name=name, Scope=scope, Id=id_)
      self.assertEqual(response["WebACL"]["ARN"], web_acl_arn)
    except ClientError as e:
      self.fail(f"WAF Web ACL '{web_acl_arn}' does not exist: {e}")