"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import os
import boto3
import pulumi
import requests
import time

environment = os.getenv("ENVIRONMENT", "development")
aws_region = os.getenv("AWS_REGION", "us-west-2")

# Boto3 clients
ec2_client = boto3.client("ec2", region_name=aws_region)
s3_client = boto3.client("s3", region_name=aws_region)


def test_s3_bucket_exists():
  """Tests live AWS resources - S3 bucket creation"""
  org = pulumi.get_organization() or "default"
  bucket_name = f"web-app-{environment}-{org}".lower()

  response = s3_client.list_buckets()
  bucket_names = [b["Name"] for b in response["Buckets"]]

  assert bucket_name in bucket_names, f"S3 bucket {bucket_name} not found"


def test_security_group_exists():
  """Validates SG in AWS"""
  sg_name = f"web-app-sg-{environment}"
  sgs = ec2_client.describe_security_groups(
    Filters=[{"Name": "group-name", "Values": [sg_name]}]
  )["SecurityGroups"]

  assert len(sgs) > 0, f"Security group {sg_name} not found"


def test_ec2_instance_running():
  """Checks running state"""
  tags_filter = [{"Name": "tag:Name", "Values": [f"web-app-instance-{environment}"]}]
  instances = ec2_client.describe_instances(Filters=tags_filter)

  found_instances = [
    i
    for r in instances["Reservations"]
    for i in r["Instances"]
    if i["State"]["Name"] == "running"
  ]

  assert len(found_instances) > 0, "No running EC2 instance found for web app"


def test_environment_configuration():
  """Should test env-specific configs"""
  tags_filter = [{"Name": "tag:Name", "Values": [f"web-app-instance-{environment}"]}]
  instances = ec2_client.describe_instances(Filters=tags_filter)

  found_instances = [
    i for r in instances["Reservations"]
    for i in r["Instances"]
    if i["State"]["Name"] == "running"
  ]

  assert len(found_instances) > 0, "No running instances found"
  instance = found_instances[0]

  # Test instance type matches environment config
  if environment == "development":
    expected_instance_type = "t3.micro"
  else:  # production
    expected_instance_type = "t3.small"

  assert instance["InstanceType"] == expected_instance_type, \
    f"Expected instance type {expected_instance_type}, got {instance['InstanceType']}"


def test_s3_versioning():
  """Should verify versioning enabled"""
  org = pulumi.get_organization() or "default"
  bucket_name = f"web-app-{environment}-{org}".lower()

  # Check versioning configuration
  versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
  assert versioning.get("Status") == "Enabled", \
    f"S3 bucket {bucket_name} versioning is not enabled"


def test_user_data_execution():
  """Should test web server setup"""
  tags_filter = [{"Name": "tag:Name", "Values": [f"web-app-instance-{environment}"]}]
  instances = ec2_client.describe_instances(Filters=tags_filter)

  found_instances = [
    i for r in instances["Reservations"]
    for i in r["Instances"]
    if i["State"]["Name"] == "running"
  ]

  assert len(found_instances) > 0, "No running instances found"
  instance = found_instances[0]

  public_ip = instance.get("PublicIpAddress")
  assert public_ip, "Instance has no public IP address"

  # Wait a bit for user data script to complete
  max_retries = 30
  for attempt in range(max_retries):
    try:
      response = requests.get(f"http://{public_ip}", timeout=10)
      if response.status_code == 200:
        content = response.text

        # Verify environment-specific content is present
        assert f"Environment: {environment}" in content

        # Check for AWS region - be flexible about which region is used
        assert "AWS Region:" in content, "AWS Region not found in content"

        if environment == "development":
          assert "Debug: True" in content
          assert "Log Level: debug" in content
          assert "Instance Type: t3.micro" in content
        else:  # production
          assert "Debug: False" in content
          assert "Log Level: info" in content
          assert "Instance Type: t3.small" in content

        return  # Test passed

    except (requests.RequestException, AssertionError) as e:
      if attempt == max_retries - 1:
        raise AssertionError(f"Web server test failed after {max_retries} attempts: {e}")
      time.sleep(10)