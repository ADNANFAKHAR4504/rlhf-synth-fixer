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
        flat_outputs = json.load(f)
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

    @mark.it("Bastion host EC2 instance exists")
    def test_bastion_host_exists(self):
        instance_id = flat_outputs.get("BastionHostId")
        self.assertIsNotNone(instance_id, "BastionHostId output is missing")
        ec2 = boto3.client("ec2", region_name=REGION)
        try:
            response = ec2.describe_instances(InstanceIds=[instance_id])
            self.assertGreaterEqual(len(response["Reservations"]), 1)
            self.assertEqual(response["Reservations"][0]["Instances"][0]["InstanceId"], instance_id)
        except ClientError as e:
            self.fail(f"Bastion host instance '{instance_id}' does not exist: {e}")

    @mark.it("S3 bucket for app data exists and is encrypted")
    def test_app_data_bucket_exists_and_encrypted(self):
        bucket_name = flat_outputs.get("AppDataBucketName")
        self.assertIsNotNone(bucket_name, "AppDataBucketName output is missing")
        s3 = boto3.client("s3", region_name=REGION)
        try:
            s3.head_bucket(Bucket=bucket_name)
            enc = s3.get_bucket_encryption(Bucket=bucket_name)
            rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
            self.assertTrue(any(
                rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"
                for rule in rules
            ))
        except ClientError as e:
            self.fail(f"S3 bucket '{bucket_name}' does not exist or is not encrypted: {e}")

    @mark.it("RDS instance endpoint is reachable")
    def test_rds_instance_exists(self):
        endpoint = flat_outputs.get("DatabaseEndpoint")
        self.assertIsNotNone(endpoint, "DatabaseEndpoint output is missing")
        rds = boto3.client("rds", region_name=REGION)
        try:
            instances = rds.describe_db_instances()
            found = any(db["Endpoint"]["Address"] == endpoint for db in instances["DBInstances"])
            self.assertTrue(found, f"RDS instance with endpoint '{endpoint}' not found")
        except ClientError as e:
            self.fail(f"RDS instance with endpoint '{endpoint}' does not exist: {e}")

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
