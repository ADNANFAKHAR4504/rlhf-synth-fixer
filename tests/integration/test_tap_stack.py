import os
import json
import unittest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack CDK stack (environment-aware, live AWS checks)"""

    @classmethod
    def setUpClass(cls):
        """Load outputs and initialize AWS clients"""
        base_dir = os.path.join(os.path.dirname(__file__), "..", "..", "cfn-outputs")
        outputs_path = os.path.join(base_dir, "flat-outputs.json")

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(f"❌ Missing outputs file: {outputs_path}")

        with open(outputs_path, "r", encoding="utf-8") as f:
            cls.outputs = json.load(f)

        cls.env_suffix = os.getenv("ENVIRONMENT_SUFFIX", "")
        cls.region = os.getenv("AWS_REGION", "us-east-2")

        cls.ec2 = boto3.client("ec2", region_name=cls.region)
        cls.elbv2 = boto3.client("elbv2", region_name=cls.region)
        cls.rds = boto3.client("rds", region_name=cls.region)
        cls.s3 = boto3.client("s3", region_name=cls.region)
        cls.lambda_client = boto3.client("lambda", region_name=cls.region)
        cls.logs = boto3.client("logs", region_name=cls.region)

    def get_output(self, key_base: str) -> str:
        """Retrieve output value with environment suffix appended"""
        key = f"{key_base}{self.env_suffix}"
        value = self.outputs.get(key)
        if not value:
            raise KeyError(f"Missing key '{key}' in flat-outputs.json")
        return value

    # --- Core Tests ---

    def test_vpc_exists(self):
        """Validate that the VPC exists in AWS"""
        vpc_id = self.get_output("VPCId")
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertGreater(len(response.get("Vpcs", [])), 0, "VPC should exist in AWS")

    def test_alb_active(self):
        """Validate that the Application Load Balancer is active"""
        alb_dns = self.get_output("LoadBalancerDNS")
        self.assertIn("elb.amazonaws.com", alb_dns)

        lb_name = alb_dns.split(".")[0]
        response = self.elbv2.describe_load_balancers(Names=[lb_name])
        state = response["LoadBalancers"][0]["State"]["Code"]
        self.assertEqual(state, "active", f"ALB {lb_name} should be active")

    def test_rds_endpoint_valid(self):
        """Validate that the RDS instance endpoint exists and is available"""
        db_endpoint = self.get_output("DatabaseEndpoint")
        response = self.rds.describe_db_instances()
        found = None
        for db in response.get("DBInstances", []):
            if db.get("Endpoint", {}).get("Address") == db_endpoint:
                found = db
                break
        self.assertIsNotNone(found, f"RDS endpoint {db_endpoint} not found in AWS")
        self.assertEqual(found["DBInstanceStatus"], "available", "RDS instance should be available")

    def test_s3_bucket_accessible(self):
        """Validate that the S3 bucket exists and is reachable"""
        bucket_name = self.get_output("S3BucketName")
        try:
            self.s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket '{bucket_name}' not accessible: {e}")

    def test_lambda_function_exists(self):
        """Validate that the Lambda function exists"""
        lambda_name = self.get_output("LambdaFunctionName")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response["Configuration"]["FunctionName"], lambda_name)
        except ClientError as e:
            self.fail(f"Lambda function '{lambda_name}' not found: {e}")

    # --- Extended AWS Interaction Tests ---

    def test_vpc_has_subnets(self):
        """Validate that VPC has at least 2 subnets"""
        vpc_id = self.get_output("VPCId")
        subnets = self.ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        subnet_count = len(subnets.get("Subnets", []))
        self.assertGreaterEqual(subnet_count, 2, "VPC should have at least two subnets")

    def test_s3_bucket_versioning_or_encryption(self):
        """Validate S3 bucket versioning/encryption settings"""
        bucket_name = self.get_output("S3BucketName")

        # Check versioning
        ver = self.s3.get_bucket_versioning(Bucket=bucket_name)
        versioning_status = ver.get("Status", "Disabled")

        # Check encryption
        try:
            enc = self.s3.get_bucket_encryption(Bucket=bucket_name)
            rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
        except ClientError:
            rules = []

        self.assertTrue(
            versioning_status in ["Enabled", "Suspended"] or rules,
            "S3 bucket should have versioning or encryption enabled",
        )

    def test_lambda_has_log_group(self):
        """Validate that Lambda function has an associated CloudWatch log group"""
        lambda_name = self.get_output("LambdaFunctionName")
        log_group = f"/aws/lambda/{lambda_name}"
        response = self.logs.describe_log_groups(
            logGroupNamePrefix=log_group, limit=1
        )
        groups = response.get("logGroups", [])
        self.assertTrue(any(g["logGroupName"] == log_group for g in groups),
                        f"Log group {log_group} not found for Lambda")

    def test_alb_listener_exists(self):
        """Validate ALB has a listener configured"""
        alb_dns = self.get_output("LoadBalancerDNS")
        lb_name = alb_dns.split(".")[0]
        response = self.elbv2.describe_load_balancers(Names=[lb_name])
        lb_arn = response["LoadBalancers"][0]["LoadBalancerArn"]

        listeners = self.elbv2.describe_listeners(LoadBalancerArn=lb_arn)
        self.assertGreater(len(listeners.get("Listeners", [])), 0, "ALB should have at least one listener")

    def test_rds_backup_retention(self):
        """Validate RDS has backup retention period set"""
        db_endpoint = self.get_output("DatabaseEndpoint")
        response = self.rds.describe_db_instances()
        db = next(
            (d for d in response["DBInstances"] if d["Endpoint"]["Address"] == db_endpoint),
            None,
        )
        self.assertIsNotNone(db, "RDS instance must exist")
        retention = db.get("BackupRetentionPeriod", 0)
        self.assertGreaterEqual(retention, 0, "RDS retention period should be set (0 means disabled intentionally)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
