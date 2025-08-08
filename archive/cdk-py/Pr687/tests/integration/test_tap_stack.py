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

@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the deployed TapStack resources using boto3"""

  @mark.it("S3 bucket exists and is accessible")
  def test_s3_bucket_exists(self):
    bucket_name = flat_outputs.get("S3BucketName")
    self.assertIsNotNone(bucket_name, "S3BucketName output is missing")
    s3 = boto3.client("s3")
    try:
      s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
      self.fail(f"S3 bucket '{bucket_name}' does not exist or is not accessible: {e}")

  @mark.it("CloudFront distribution exists")
  def test_cloudfront_distribution_exists(self):
    cf_domain = flat_outputs.get("CloudFrontDomainName")
    self.assertIsNotNone(cf_domain, "CloudFrontDomainName output is missing")
    cf = boto3.client("cloudfront")
    # List distributions and check for the domain name
    paginator = cf.get_paginator('list_distributions')
    found = False
    for page in paginator.paginate():
      for dist in page.get("DistributionList", {}).get("Items", []):
        if dist.get("DomainName") == cf_domain:
          found = True
          break
      if found:
        break
    self.assertTrue(found, f"CloudFront distribution '{cf_domain}' not found in AWS account.")

  @mark.it("ALB exists and is active")
  def test_alb_exists(self):
    alb_dns = flat_outputs.get("LoadBalancerDNS")
    self.assertIsNotNone(alb_dns, "LoadBalancerDNS output is missing")
    
    # Extract ALB ARN components from the DNS name
    # DNS format: TapSta-TapAL-sb09SrdGS7qZ-1099203313.us-west-2.elb.amazonaws.com
    dns_parts = alb_dns.split('.')
    alb_name = dns_parts[0]  # TapSta-TapAL-sb09SrdGS7qZ-1099203313
    region = dns_parts[1]    # us-west-2
    
    elbv2 = boto3.client("elbv2", region_name=region)
    
    try:
      # Try to get the ALB by name pattern
      response = elbv2.describe_load_balancers()
      
      found_alb = None
      for lb in response.get("LoadBalancers", []):
        # Check if DNS name matches exactly
        if lb.get("DNSName") == alb_dns:
          found_alb = lb
          break
        # Fallback: check if ALB name contains our pattern
        elif alb_name in lb.get("LoadBalancerName", ""):
          found_alb = lb
          break
      
      self.assertIsNotNone(found_alb, f"ALB with DNS '{alb_dns}' not found in {region}")
      self.assertEqual(found_alb.get("State", {}).get("Code"), "active", "ALB is not active")
      
      # Additional validation using the output data
      self.assertEqual(found_alb.get("DNSName"), alb_dns, "ALB DNS name doesn't match output")
      self.assertEqual(found_alb.get("Type"), "application", "ALB is not an Application Load Balancer")
      self.assertEqual(found_alb.get("Scheme"), "internet-facing", "ALB is not internet-facing")
      
    except ClientError as e:
      self.fail(f"Failed to describe load balancers in {region}: {e}")

