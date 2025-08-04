import boto3
import json
import os
import sys
from botocore.exceptions import ClientError

# -- CONFIGURATION --

# Pulumi stack name (change or load from env)
STACK_NAME = os.getenv("PULUMI_STACK_NAME", "TapStack-TapStackpr405")

# Pulumi stack outputs (can be loaded dynamically or hardcoded here)
STACK_OUTPUTS = {
  "database_security_group_id": "sg-0727946b1b01d29d6",
  "kms_key_arn": "arn:aws:kms:us-east-1:123456789012:key/4d56d8c1-d0d6-4fb8-bd2d-a363093283ef",
  "primary_vpc_id": "vpc-0314e80071f0754f5",
  "private_subnet_ids": ["subnet-0352a11771a3b3280","subnet-027f5367ae5a01742"],
  "public_subnet_ids": ["subnet-053dc0bb759cc8a48","subnet-0fc2cbff1a25a7be9"],
  "secure_s3_bucket": "secure-projectx-data-us-west-2-tapstackpr405",
}

# AWS Regions (can be extracted from ARNs or inputs)
REGION_S3 = "us-west-2"
REGION_KMS = "us-east-1"
REGION_EC2 = "us-west-2"

# Initialize clients
ec2_client = boto3.client("ec2", region_name=REGION_EC2)
s3_client = boto3.client("s3", region_name=REGION_S3)
kms_client = boto3.client("kms", region_name=REGION_KMS)

def assert_true(condition, msg):
  if not condition:
    raise AssertionError(msg)

def check_s3_bucket(bucket_name):
  print(f"Checking S3 bucket: {bucket_name}")
  try:
    # Head bucket will raise if bucket doesn't exist or access denied
    s3_client.head_bucket(Bucket=bucket_name)
    print(f"  ✓ Bucket '{bucket_name}' exists and is accessible.")
  except ClientError as e:
    raise AssertionError(f"S3 bucket '{bucket_name}' does not exist or inaccessible: {e}")

  # Optional: Check bucket encryption
  try:
    enc = s3_client.get_bucket_encryption(Bucket=bucket_name)
    rules = enc['ServerSideEncryptionConfiguration']['Rules']
    assert_true(len(rules) > 0, "Bucket encryption rules not found")
    print("  ✓ Bucket encryption is configured.")
  except ClientError as e:
    raise AssertionError(f"Failed to get bucket encryption for '{bucket_name}': {e}")

def check_security_group(sg_id):
  print(f"Checking Security Group: {sg_id}")
  try:
    response = ec2_client.describe_security_groups(GroupIds=[sg_id])
    sgs = response.get("SecurityGroups", [])
    assert_true(len(sgs) == 1, f"Security Group {sg_id} not found")
    sg = sgs[0]
    print(f"  ✓ Security Group found with description: {sg.get('Description')}")
    # Optional: Check inbound/outbound rules count
    print(f"  - Ingress rules count: {len(sg.get('IpPermissions', []))}")
    print(f"  - Egress rules count: {len(sg.get('IpPermissionsEgress', []))}")
  except ClientError as e:
    raise AssertionError(f"Error describing Security Group '{sg_id}': {e}")

def check_kms_key(kms_arn):
  print(f"Checking KMS Key: {kms_arn}")
  try:
    key_id = kms_arn.split("/")[-1]
    response = kms_client.describe_key(KeyId=key_id)
    key_metadata = response.get("KeyMetadata", {})
    assert_true(key_metadata.get("KeyId") == key_id, "KMS key ID mismatch")
    assert_true(key_metadata.get("Enabled"), "KMS key is not enabled")
    print(f"  ✓ KMS key '{key_id}' is enabled and available.")
  except ClientError as e:
    raise AssertionError(f"Error describing KMS Key '{kms_arn}': {e}")

def check_vpc(vpc_id):
  print(f"Checking VPC: {vpc_id}")
  try:
    response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpcs = response.get("Vpcs", [])
    assert_true(len(vpcs) == 1, f"VPC {vpc_id} not found")
    vpc = vpcs[0]
    print(f"  ✓ VPC found with CIDR block: {vpc.get('CidrBlock')}")
  except ClientError as e:
    raise AssertionError(f"Error describing VPC '{vpc_id}': {e}")

def check_subnets(subnet_ids, expected_public=False):
  print(f"Checking {'public' if expected_public else 'private'} subnets:")
  try:
    response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
    subnets = response.get("Subnets", [])
    assert_true(len(subnets) == len(subnet_ids), "One or more subnets not found")
    for subnet in subnets:
      print(f"  ✓ Subnet {subnet['SubnetId']} - CIDR: {subnet['CidrBlock']} - AZ: {subnet['AvailabilityZone']}")
      # Optional: Check if public or private by checking MapPublicIpOnLaunch
      is_public = subnet.get("MapPublicIpOnLaunch", False)
      assert_true(is_public == expected_public,
        f"Subnet {subnet['SubnetId']} public status mismatch (expected {expected_public})")
  except ClientError as e:
    raise AssertionError(f"Error describing subnets '{subnet_ids}': {e}")

def run_all_checks():
  print(f"Starting integration tests for Pulumi stack: {STACK_NAME}\n")

  check_s3_bucket(STACK_OUTPUTS["secure_s3_bucket"])
  print()

  check_security_group(STACK_OUTPUTS["database_security_group_id"])
  print()

  check_kms_key(STACK_OUTPUTS["kms_key_arn"])
  print()

  check_vpc(STACK_OUTPUTS["primary_vpc_id"])
  print()

  check_subnets(STACK_OUTPUTS["private_subnet_ids"], expected_public=False)
  print()

  check_subnets(STACK_OUTPUTS["public_subnet_ids"], expected_public=True)
  print()

  print("All integration checks passed successfully.")

if __name__ == "__main__":
  try:
    run_all_checks()
  except AssertionError as e:
    print(f"Test failed: {e}")
    sys.exit(1)
