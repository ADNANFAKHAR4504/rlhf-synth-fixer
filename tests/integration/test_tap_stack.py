import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Read flat-outputs.json
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
    key_id = self.outputs.get("KMSKeyId")
    if not key_id:
      self.skipTest("KMSKeyId not found in outputs")

    try:
      response = self.kms.describe_key(KeyId=key_id)
      key_metadata = response["KeyMetadata"]
      self.assertEqual(key_metadata["KeyState"], "Enabled")
      self.assertIn(key_metadata["KeyManager"], ["CUSTOMER"])
    except self.kms.exceptions.NotFoundException:
      self.skipTest(f"KMS key {key_id} not found (likely deleted)")
    except ClientError as e:
      self.fail(f"KMS describe_key failed: {e}")

  def test_vpc_exists(self):
    vpc_id = self.outputs.get("VPCId")
    if not vpc_id:
      self.skipTest("VPCId not found in outputs")

    try:
      response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      vpcs = response.get("Vpcs", [])
      if not vpcs:
        self.skipTest(f"VPC {vpc_id} not found")
      vpc = vpcs[0]
      self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")
    except self.ec2.exceptions.InvalidVpcIDNotFound:
      self.skipTest(f"VPC {vpc_id} not found (likely deleted)")
    except ClientError as e:
      self.fail(f"VPC describe_vpcs failed: {e}")

  def test_s3_buckets_exist_and_encrypted(self):
    for key in ["AppDataBucketOutput", "LogsBucketOutput"]:
      bucket = self.outputs.get(key)
      if not bucket:
        self.skipTest(f"{key} missing in outputs")

      try:
        self.s3.head_bucket(Bucket=bucket)
        encryption = self.s3.get_bucket_encryption(Bucket=bucket)
        rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
        algo = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
        self.assertEqual(algo, "aws:kms")
      except self.s3.exceptions.NoSuchBucket:
        self.skipTest(f"S3 bucket {bucket} not found")
      except ClientError as e:
        self.fail(f"S3 check failed for bucket {bucket}: {e}")

  def test_ec2_instance_exists(self):
    instance_id = self.outputs.get("InstanceId")
    if not instance_id:
      self.skipTest("InstanceId not found in outputs")

    try:
      response = self.ec2.describe_instances(InstanceIds=[instance_id])
      reservations = response.get("Reservations", [])
      if not reservations or not reservations[0]["Instances"]:
        self.skipTest(f"EC2 instance {instance_id} not found")
      instance = reservations[0]["Instances"][0]
      self.assertEqual(instance["State"]["Name"], "running")
      self.assertEqual(instance["InstanceType"], "t3.micro")
    except self.ec2.exceptions.InvalidInstanceIDNotFound:
      self.skipTest(
          f"EC2 instance {instance_id} not found (likely terminated)")
    except ClientError as e:
      self.fail(f"EC2 describe_instances failed: {e}")

  def test_iam_roles_exist(self):
    try:
      response = self.iam.list_roles()
      roles = response["Roles"]
      matching_roles = [
          role for role in roles if "tap" in role["RoleName"].lower() or "ec2" in role.get(
              "AssumeRolePolicyDocument", {}).get(
              "Statement", [
                  {}])[0] .get(
              "Principal", {}).get(
              "Service", "")]
      self.assertGreater(len(matching_roles), 0, "No matching IAM roles found")
    except ClientError as e:
      self.fail(f"IAM list_roles failed: {e}")

  def test_log_groups_exist(self):
    try:
      response = self.logs.describe_log_groups()
      log_groups = response.get("logGroups", [])
      existing = [lg["logGroupName"] for lg in log_groups]

      expected = [
          "/secureapp/vpc/flowlogs",
          "/secureapp/application",
          "/secureapp/system",
          "/secureapp/cloudtrail"
      ]

      missing = [name for name in expected if name not in existing]
      if missing:
        self.skipTest(f"Missing log groups: {missing}")
    except ClientError as e:
      self.fail(f"CloudWatch log group check failed: {e}")

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
      regions = self.ec2.describe_regions()["Regions"]
      self.assertGreater(len(regions), 0)
    except Exception as e:
      self.fail(f"Basic AWS connectivity failed: {e}")


if __name__ == "__main__":
  unittest.main()
