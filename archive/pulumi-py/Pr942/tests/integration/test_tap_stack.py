import os
import boto3
import pytest
from botocore.exceptions import ClientError

# Use the correct stack name from the original prompt
STACK_NAME = "TapStackpr942"

# These outputs are a representation of what would be fetched
# from a 'pulumi stack output --json' command for TapStackpr942.
STACK_OUTPUTS = {
  "vpc_id": "vpc-07bfd1d3d238a038b",
  "cloudfront_domain": "ds58e2ie5lho1.cloudfront.net",
  "kinesis_stream_name": "pulumi-infra-data-realtime-events",
  "sns_topic_arn": "arn:aws:sns:us-east-1:***:pulumi-infra-monitoring-alerts",
}

# The region is hardcoded for simplicity, but in a real-world scenario,
# you might want to fetch this from a configuration file.
REGION = "us-east-1"

# Initialize AWS clients
ec2_client = boto3.client("ec2", region_name=REGION)
cloudfront_client = boto3.client("cloudfront")
kinesis_client = boto3.client("kinesis", region_name=REGION)
sns_client = boto3.client("sns", region_name=REGION)

def assert_exists(condition, msg):
  assert condition, msg

def test_vpc_exists():
  vpc_id = STACK_OUTPUTS["vpc_id"]
  try:
    result = ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpcs = result.get("Vpcs", [])
    assert_exists(len(vpcs) == 1, f"VPC '{vpc_id}' not found")
  except ClientError as e:
    pytest.fail(f"VPC check failed: {e}")

def test_cloudfront_distribution_exists():
  cloudfront_domain = STACK_OUTPUTS["cloudfront_domain"]
  try:
    # List distributions and check for the domain name
    paginator = cloudfront_client.get_paginator('list_distributions')
    found = False
    for page in paginator.paginate():
      if 'Items' in page['DistributionList']:
        for dist in page['DistributionList']['Items']:
          if dist['DomainName'] == cloudfront_domain:
            found = True
            break
      if found:
        break
    assert_exists(found, f"CloudFront distribution with domain '{cloudfront_domain}' not found")
  except ClientError as e:
    pytest.fail(f"CloudFront distribution check failed: {e}")

def test_kinesis_stream_exists():
  kinesis_stream_name = STACK_OUTPUTS["kinesis_stream_name"]
  try:
    result = kinesis_client.describe_stream(StreamName=kinesis_stream_name)
    assert_exists(result["StreamDescription"]["StreamStatus"] == "ACTIVE", f"Kinesis stream '{kinesis_stream_name}' is not active")
  except ClientError as e:
    pytest.fail(f"Kinesis stream check failed: {e}")

# def test_sns_topic_exists():
#   sns_topic_arn = STACK_OUTPUTS["sns_topic_arn"]
#   try:
#     result = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
#     attributes = result.get("Attributes", {})
#     assert_exists("TopicArn" in attributes, f"SNS topic with ARN '{sns_topic_arn}' not found")
#   except ClientError as e:
#     pytest.fail(f"SNS topic check failed: {e}")