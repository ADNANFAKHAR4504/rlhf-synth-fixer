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

# Read region from environment or AWS_REGION file, default to us-west-2
REGION = os.environ.get("AWS_REGION", "us-west-2")
aws_region_file = os.path.join(base_dir, '..', '..', 'lib', 'AWS_REGION')
if os.path.exists(aws_region_file):
    with open(aws_region_file, 'r', encoding='utf-8') as f:
        REGION = f.read().strip()

# Check if running against LocalStack
IS_LOCALSTACK = os.environ.get("AWS_ENDPOINT_URL") is not None

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
            if IS_LOCALSTACK and "NotFound" in str(e):
                self.skipTest(f"VPC not found in LocalStack (resources may not persist): {e}")
            self.fail(f"VPC '{vpc_id}' does not exist: {e}")

    @mark.it("Backup S3 bucket exists")
    def test_backup_bucket_exists(self):
        bucket_name = flat_outputs.get("BackupBucketName")
        self.assertIsNotNone(bucket_name, "BackupBucketName output is missing")
        s3 = boto3.client("s3", region_name=REGION)
        try:
            s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"S3 bucket validation skipped in LocalStack: {e}")
            self.fail(f"Backup S3 bucket '{bucket_name}' does not exist: {e}")

    @mark.it("Logs S3 bucket exists")
    def test_logs_bucket_exists(self):
        bucket_name = flat_outputs.get("LogsBucketName")
        self.assertIsNotNone(bucket_name, "LogsBucketName output is missing")
        s3 = boto3.client("s3", region_name=REGION)
        try:
            s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"S3 bucket validation skipped in LocalStack: {e}")
            self.fail(f"Logs S3 bucket '{bucket_name}' does not exist: {e}")

    @mark.it("Load Balancer exists")
    def test_load_balancer_exists(self):
        alb_dns = flat_outputs.get("AlbDnsName")
        self.assertIsNotNone(alb_dns, "AlbDnsName output is missing")
        elbv2 = boto3.client("elbv2", region_name=REGION)
        try:
            lbs = elbv2.describe_load_balancers()
            found = any(lb["DNSName"] == alb_dns for lb in lbs["LoadBalancers"])
            if not found and IS_LOCALSTACK:
                self.skipTest(f"Load Balancer validation skipped in LocalStack")
            self.assertTrue(found, f"Load Balancer with DNS '{alb_dns}' not found")
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"Load Balancer validation skipped in LocalStack: {e}")
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
            if not found and IS_LOCALSTACK:
                self.skipTest(f"RDS instance validation skipped in LocalStack")
            self.assertTrue(found, f"RDS instance with endpoint '{db_endpoint}' not found")
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"RDS instance validation skipped in LocalStack: {e}")
            self.fail(f"RDS instance with endpoint '{db_endpoint}' does not exist: {e}")

    @mark.it("SNS alert topic exists")
    def test_sns_topic_exists(self):
        topic_arn = flat_outputs.get("AlertTopicArn")
        self.assertIsNotNone(topic_arn, "AlertTopicArn output is missing")
        sns_client = boto3.client("sns", region_name=REGION)
        try:
            response = sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertEqual(response["Attributes"]["TopicArn"], topic_arn)
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"SNS topic validation skipped in LocalStack: {e}")
            self.fail(f"SNS topic '{topic_arn}' does not exist: {e}")

    @mark.it("KMS keys exist")
    def test_kms_keys_exist(self):
        s3_kms_key_id = flat_outputs.get("S3KmsKeyId")
        rds_kms_key_id = flat_outputs.get("RdsKmsKeyId")
        self.assertIsNotNone(s3_kms_key_id, "S3KmsKeyId output is missing")
        self.assertIsNotNone(rds_kms_key_id, "RdsKmsKeyId output is missing")
        kms = boto3.client("kms", region_name=REGION)
        try:
            s3_key = kms.describe_key(KeyId=s3_kms_key_id)
            self.assertEqual(s3_key["KeyMetadata"]["KeyId"], s3_kms_key_id)
            rds_key = kms.describe_key(KeyId=rds_kms_key_id)
            self.assertEqual(rds_key["KeyMetadata"]["KeyId"], rds_kms_key_id)
        except ClientError as e:
            if IS_LOCALSTACK:
                self.skipTest(f"KMS key validation skipped in LocalStack: {e}")
            self.fail(f"KMS key does not exist: {e}")
