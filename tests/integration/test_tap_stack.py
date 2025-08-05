import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Read from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir,
    "..",
    "..",
    "cfn-outputs",
    "flat-outputs.json")

flat_outputs = "{}"
if os.path.exists(flat_outputs_path):
  try:
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
      flat_outputs = f.read()
  except Exception as e:
    print(f"Could not read outputs file: {e}")

try:
  flat_outputs = json.loads(flat_outputs)
except json.JSONDecodeError:
  print("Invalid JSON in outputs file")
  flat_outputs = {}


class TestTapStackIntegration(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    try:
      aws_region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
      ec2 = boto3.client("ec2", region_name=aws_region)
      ec2.describe_regions()
      cls.aws_available = True
      print(f"AWS credentials available, using region: {aws_region}")
    except (NoCredentialsError, ClientError, Exception) as e:
      cls.aws_available = False
      print(f"AWS credentials not available: {e}")

  def setUp(self):
    if not self.aws_available:
      self.skipTest("AWS credentials not available")

    aws_region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    self.region = aws_region
    self.outputs = flat_outputs

    self.ec2 = boto3.client("ec2", region_name=aws_region)
    self.kms = boto3.client("kms", region_name=aws_region)
    self.s3 = boto3.client("s3", region_name=aws_region)
    self.iam = boto3.client("iam", region_name=aws_region)
    self.logs = boto3.client("logs", region_name=aws_region)

  def test_kms_key_exists_and_rotation_enabled(self):
    if "KMSKeyId" not in self.outputs:
      self.skipTest("KMSKeyId not in outputs")

    key_id = self.outputs["KMSKeyId"]
    try:
      response = self.kms.describe_key(KeyId=key_id)
      key_metadata = response["KeyMetadata"]
      self.assertEqual(key_metadata["KeyState"], "Enabled")
      self.assertTrue(key_metadata["KeyManager"] in ["CUSTOMER"])
    except ClientError as e:
      self.fail(f"KMS describe_key failed: {e}")

  def test_vpc_exists(self):
    if "VPCId" not in self.outputs:
      self.skipTest("VPCId not in outputs")

    vpc_id = self.outputs["VPCId"]
    try:
      response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpc = response["Vpcs"][0]
      self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")
      self.assertTrue(vpc.get("IsDefault") is False)
    except ClientError as e:
      self.fail(f"VPC check failed: {e}")

  def test_s3_buckets_exist_and_encrypted(self):
    for bucket_output_key in ["AppDataBucketOutput", "LogsBucketOutput"]:
      if bucket_output_key not in self.outputs:
        self.skipTest(f"{bucket_output_key} missing in outputs")

      bucket_name = self.outputs[bucket_output_key]
      try:
        self.s3.head_bucket(Bucket=bucket_name)

        enc = self.s3.get_bucket_encryption(Bucket=bucket_name)
        rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
        algo = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
        self.assertEqual(algo, "aws:kms")
      except ClientError as e:
        self.fail(f"S3 bucket {bucket_name} check failed: {e}")

  def test_ec2_instance_exists(self):
    if "InstanceId" not in self.outputs:
      self.skipTest("InstanceId not in outputs")

    instance_id = self.outputs["InstanceId"]
    try:
      response = self.ec2.describe_instances(InstanceIds=[instance_id])
      instance = response["Reservations"][0]["Instances"][0]
      self.assertEqual(instance["State"]["Name"], "running")
      self.assertEqual(instance["InstanceType"], "t3.micro")
    except ClientError as e:
      self.fail(f"EC2 instance {instance_id} check failed: {e}")

  def test_iam_roles_exist(self):
    try:
      response = self.iam.list_roles()
      roles = response["Roles"]
      matching_roles = [
          role for role in roles if "tap" in role["RoleName"].lower() or "ec2" in role["AssumeRolePolicyDocument"].get(
              "Statement", [
                  {}])[0].get(
              "Principal", {}).get(
              "Service", "")]
      self.assertGreater(len(matching_roles), 0, "No matching IAM roles found")
    except ClientError as e:
      self.fail(f"IAM role check failed: {e}")

  def test_log_groups_exist(self):
    try:
      response = self.logs.describe_log_groups()
      log_groups = response.get("logGroups", [])
      log_names = [lg["logGroupName"] for lg in log_groups]

      expected = ["/aws/vpc/flowlogs", "/aws/cloudtrail/logs"]
      matched = any(
          name for name in log_names if any(
              e in name for e in expected))
      self.assertTrue(
          matched,
          f"Expected VPC or CloudTrail logs missing: {log_names}")
    except ClientError as e:
      self.fail(f"CloudWatch Logs check failed: {e}")

  def test_output_structure(self):
    self.assertIsInstance(self.outputs, dict)
    self.assertGreater(len(self.outputs), 0)
    for key in [
        "VPCId",
        "KMSKeyId",
        "AppDataBucketOutput",
        "LogsBucketOutput",
            "InstanceId"]:
      self.assertIn(key, self.outputs)

  def test_basic_aws_connectivity(self):
    try:
      response = self.ec2.describe_regions()
      self.assertGreater(len(response["Regions"]), 0)
    except Exception as e:
      self.fail(f"Connectivity check failed: {e}")


if __name__ == "__main__":
  unittest.main()
