import boto3
import os
import pytest
from botocore.exceptions import ClientError

# Stack name (for display)
STACK_NAME = os.getenv("PULUMI_STACK_NAME") or "TapStack-TapStackpr405" or "TapStackpr405"

# Outputs (normally parsed from pulumi stack output --json)
STACK_OUTPUTS = {
  "database_security_group_id": "sg-0727946b1b01d29d6",
  "kms_key_arn": "arn:aws:kms:us-east-1:123456789012:key/4d56d8c1-d0d6-4fb8-bd2d-a363093283ef",
  "primary_vpc_id": "vpc-0314e80071f0754f5",
  "private_subnet_ids": ["subnet-0352a11771a3b3280", "subnet-027f5367ae5a01742"],
  "public_subnet_ids": ["subnet-053dc0bb759cc8a48", "subnet-0fc2cbff1a25a7be9"],
  "secure_s3_bucket": "secure-projectx-data-us-west-2-tapstackpr405",
}

REGION_S3 = "us-west-2"
REGION_KMS = "us-east-1"
REGION_EC2 = "us-west-2"

ec2_client = boto3.client("ec2", region_name=REGION_EC2)
s3_client = boto3.client("s3", region_name=REGION_S3)
kms_client = boto3.client("kms", region_name=REGION_KMS)

def assert_exists(condition, msg):
  assert condition, msg

def test_s3_bucket_exists():
  bucket = STACK_OUTPUTS["secure_s3_bucket"]
  try:
    s3_client.head_bucket(Bucket=bucket)
  except ClientError as e:
    pytest.fail(f"S3 bucket '{bucket}' is missing or inaccessible: {e}")

def test_s3_bucket_encryption():
  bucket = STACK_OUTPUTS["secure_s3_bucket"]
  try:
    enc = s3_client.get_bucket_encryption(Bucket=bucket)
    rules = enc['ServerSideEncryptionConfiguration']['Rules']
    assert_exists(len(rules) > 0, "No bucket encryption rules")
  except ClientError as e:
    pytest.fail(f"S3 encryption config missing: {e}")

def test_security_group_exists():
  sg_id = STACK_OUTPUTS["database_security_group_id"]
  try:
    result = ec2_client.describe_security_groups(GroupIds=[sg_id])
    sgs = result.get("SecurityGroups", [])
    assert_exists(len(sgs) == 1, f"Security group '{sg_id}' not found")
  except ClientError as e:
    pytest.fail(f"Security group check failed: {e}")

def test_kms_key_exists():
  kms_arn = STACK_OUTPUTS["kms_key_arn"]
  key_id = kms_arn.split("/")[-1]
  try:
    result = kms_client.describe_key(KeyId=key_id)
    key = result["KeyMetadata"]
    assert_exists(key["KeyId"] == key_id, "Key ID mismatch")
    assert_exists(key["Enabled"], "KMS key not enabled")
  except ClientError as e:
    pytest.fail(f"KMS key check failed: {e}")

def test_vpc_exists():
  vpc_id = STACK_OUTPUTS["primary_vpc_id"]
  try:
    result = ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpcs = result["Vpcs"]
    assert_exists(len(vpcs) == 1, f"VPC '{vpc_id}' not found")
  except ClientError as e:
    pytest.fail(f"VPC check failed: {e}")

@pytest.mark.parametrize("subnet_type", ["private_subnet_ids", "public_subnet_ids"])
def test_subnets_exist(subnet_type):
  ids = STACK_OUTPUTS[subnet_type]
  try:
    result = ec2_client.describe_subnets(SubnetIds=ids)
    found = result["Subnets"]
    assert_exists(len(found) == len(ids), f"Some {subnet_type} are missing")
  except ClientError as e:
    pytest.fail(f"{subnet_type} check failed: {e}")
