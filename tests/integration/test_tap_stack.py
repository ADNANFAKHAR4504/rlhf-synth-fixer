import json
import os
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""

  @mark.it("tests ALB endpoint is accessible")
  def test_alb_endpoint_accessible(self):
    # ARRANGE
    if 'LoadBalancerDNS' not in flat_outputs:
      self.skipTest("LoadBalancerDNS not found in outputs")

    import requests

    # ACT
    alb_dns = flat_outputs['LoadBalancerDNS']
    try:
      response = requests.get(f"http://{alb_dns}", timeout=30)

      # ASSERT
      self.assertEqual(response.status_code, 200)
      self.assertIn("Tap Web Application", response.text)
    except requests.RequestException as e:
      self.fail(f"Failed to connect to ALB: {e}")

  @mark.it("tests RDS database endpoint exists")
  def test_rds_endpoint_exists(self):
    # ARRANGE
    if 'DatabaseEndpoint' not in flat_outputs:
      self.skipTest("DatabaseEndpoint not found in outputs")

    # ASSERT
    db_endpoint = flat_outputs['DatabaseEndpoint']
    self.assertIsNotNone(db_endpoint)
    self.assertTrue(db_endpoint.endswith('.rds.amazonaws.com'))

  @mark.it("tests S3 buckets are accessible")
  def test_s3_buckets_accessible(self):
    # ARRANGE
    import boto3
    s3_client = boto3.client('s3')

    # Find S3 buckets in outputs
    s3_buckets = [key for key in flat_outputs.keys() 
           if 'bucket' in key.lower() or 'S3' in key]

    if not s3_buckets:
      self.skipTest("No S3 buckets found in outputs")

    # ACT & ASSERT
    for bucket_key in s3_buckets:
      bucket_name = flat_outputs[bucket_key]
      try:
        s3_client.head_bucket(Bucket=bucket_name)
      except Exception as e:
        self.fail(f"S3 bucket {bucket_name} not accessible: {e}")

  @mark.it("tests DynamoDB table is accessible")
  def test_dynamodb_table_accessible(self):
    # ARRANGE
    import boto3
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

    # Find DynamoDB table in outputs
    table_keys = [key for key in flat_outputs.keys() 
           if 'table' in key.lower() or 'dynamo' in key.lower()]

    if not table_keys:
      self.skipTest("No DynamoDB table found in outputs")

    # ACT & ASSERT
    for table_key in table_keys:
      table_name = flat_outputs[table_key]
      try:
        table = dynamodb.Table(table_name)
        table.load()  # This will raise an exception if table doesn't exist
        self.assertEqual(table.table_status, 'ACTIVE')
      except Exception as e:
        self.fail(f"DynamoDB table {table_name} not accessible: {e}")

  @mark.it("tests CloudFront distribution is accessible")
  def test_cloudfront_distribution_accessible(self):
    # ARRANGE
    if 'CloudFrontDomainName' not in flat_outputs:
      self.skipTest("CloudFrontDomainName not found in outputs")

    import requests

    # ACT
    cf_domain = flat_outputs['CloudFrontDomainName']
    try:
      response = requests.get(f"https://{cf_domain}", timeout=60)

      # ASSERT
      self.assertEqual(response.status_code, 200)
      self.assertIn("Tap Web Application", response.text)
    except requests.RequestException as e:
      self.fail(f"Failed to connect to CloudFront: {e}")
