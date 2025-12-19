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

    @mark.it("Assets S3 bucket exists")
    def test_assets_bucket_exists(self):
        bucket_name = flat_outputs.get("AssetsBucketName")
        self.assertIsNotNone(bucket_name, "AssetsBucketName output is missing")
        s3 = boto3.client("s3", region_name=REGION)
        try:
            s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Assets S3 bucket '{bucket_name}' does not exist: {e}")

    @mark.it("Logs S3 bucket exists")
    def test_logs_bucket_exists(self):
        bucket_name = flat_outputs.get("LogsBucketName")
        self.assertIsNotNone(bucket_name, "LogsBucketName output is missing")
        s3 = boto3.client("s3", region_name=REGION)
        try:
            s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Logs S3 bucket '{bucket_name}' does not exist: {e}")

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
            found = any(
                db.get("Endpoint", {}).get("Address") == db_endpoint
                for db in instances["DBInstances"]
            )
            self.assertTrue(
                found, f"RDS instance with endpoint '{db_endpoint}' not found"
            )
        except ClientError as e:
            self.fail(
                f"RDS instance with endpoint '{db_endpoint}' does not exist: {e}"
            )
