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
    flat_outputs = json.loads(f.read())
else:
  flat_outputs = {}

REGION = "us-west-2"

@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the deployed TapStack resources using boto3"""

  @mark.it("Load Balancer exists")
  def test_load_balancer_exists(self):
    alb_dns = flat_outputs.get("LoadBalancerDNS")
    self.assertIsNotNone(alb_dns, "LoadBalancerDNS output is missing")
    elbv2 = boto3.client("elbv2", region_name=REGION)
    try:
      lbs = elbv2.describe_load_balancers()
      found = any(lb["DNSName"] == alb_dns for lb in lbs["LoadBalancers"])
      self.assertTrue(found, f"Load Balancer with DNS '{alb_dns}' not found")
    except ClientError as e:
      self.fail(f"Load Balancer '{alb_dns}' does not exist: {e}")

  @mark.it("RDS instance endpoint exists")
  def test_rds_instance_exists(self):
    db_endpoint = flat_outputs.get("DatabaseEndpoint")
    self.assertIsNotNone(db_endpoint, "DatabaseEndpoint output is missing")
    rds = boto3.client("rds", region_name=REGION)
    try:
      instances = rds.describe_db_instances()
      found = any(db["Endpoint"]["Address"] == db_endpoint for db in instances["DBInstances"])
      self.assertTrue(found, f"RDS instance with endpoint '{db_endpoint}' not found")
    except ClientError as e:
      self.fail(f"RDS instance with endpoint '{db_endpoint}' does not exist: {e}")

  @mark.it("Database secret exists in Secrets Manager")
  def test_database_secret_exists(self):
    secret_arn = flat_outputs.get("DatabaseSecretArn")
    self.assertIsNotNone(secret_arn, "DatabaseSecretArn output is missing")
    sm = boto3.client("secretsmanager", region_name=REGION)
    try:
      response = sm.describe_secret(SecretId=secret_arn)
      self.assertEqual(response["ARN"], secret_arn)
    except ClientError as e:
      self.fail(f"Database secret '{secret_arn}' does not exist: {e}")