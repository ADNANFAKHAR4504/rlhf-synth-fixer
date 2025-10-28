"""Integration tests for deployed TAP infrastructure using AWS SDK"""
import json
import os
from pathlib import Path
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark


# Load outputs from flat-outputs.json
def load_stack_outputs():
    """Load CloudFormation outputs from flat-outputs.json"""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

    if not outputs_path.exists():
        raise FileNotFoundError(
            f"flat-outputs.json not found at {outputs_path}. "
            "Please run deployment first to generate outputs."
        )

    with open(outputs_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load configuration from environment and metadata
def load_config():
    """Load configuration from environment variables and metadata.json"""
    metadata_path = Path(__file__).parent.parent.parent / "metadata.json"

    config = {
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "environment_suffix": os.getenv("ENVIRONMENT_SUFFIX", "dev"),
    }

    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            config["account_id"] = metadata.get("account_id", "")

    return config


# Global configuration and outputs
CONFIG = load_config()
OUTPUTS = load_stack_outputs()


@mark.describe("VPC and Networking Integration Tests")
class TestVPCIntegration(unittest.TestCase):
    """Integration tests for VPC and networking resources"""

    @classmethod
    def setUpClass(cls):
        """Set up EC2 client for tests"""
        cls.ec2_client = boto3.client("ec2", region_name=CONFIG["region"])
        cls.vpc_id = OUTPUTS.get("VPCId")

    @mark.it("VPC exists and is available")
    def test_vpc_exists(self):
        """Test that VPC exists and is in available state"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["State"], "available")
        self.assertTrue(vpc["EnableDnsHostnames"])
        self.assertTrue(vpc["EnableDnsSupport"])

    @mark.it("VPC has correct CIDR block")
    def test_vpc_cidr_block(self):
        """Test that VPC has the expected CIDR block"""
        # Construct output key dynamically
        env_capitalized = (
            CONFIG["environment_suffix"][0].upper() + CONFIG["environment_suffix"][1:]
        )
        expected_cidr = OUTPUTS.get(
            f"TapStackdev-NetworkSecurityStackdevTapVPCdev{env_capitalized}Ref",
            "10.0.0.0/16"
        )

        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response["Vpcs"][0]

        # Check if expected CIDR is in the VPC's CIDR blocks
        cidr_blocks = [block["CidrBlock"] for block in vpc.get("CidrBlockAssociationSet", [])]
        self.assertTrue(
            any("10.0.0.0/16" in cidr for cidr in cidr_blocks),
            f"Expected CIDR 10.0.0.0/16 not found in {cidr_blocks}"
        )

    @mark.it("Private subnets exist and are configured correctly")
    def test_private_subnets_exist(self):
        """Test that private subnets exist"""
        # Get private subnet IDs from outputs
        subnet_keys = [k for k in OUTPUTS.keys() if "PrivateSubnet" in k and "Ref" in k]
        private_subnet_ids = [OUTPUTS[k] for k in subnet_keys if OUTPUTS[k]]

        self.assertGreater(len(private_subnet_ids), 0, "No private subnets found in outputs")

        # Verify each subnet exists
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids[:2])  # Check first 2
        self.assertGreater(len(response["Subnets"]), 0)

        for subnet in response["Subnets"]:
            self.assertEqual(subnet["VpcId"], self.vpc_id)
            self.assertEqual(subnet["State"], "available")

    @mark.it("Security groups exist with proper configurations")
    def test_security_groups_exist(self):
        """Test that security groups exist and have proper rules"""
        sg_id = OUTPUTS.get("SSHSecurityGroupId")
        if not sg_id:
            self.skipTest("No security group ID found in outputs")

        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])

        self.assertEqual(len(response["SecurityGroups"]), 1)
        sg = response["SecurityGroups"][0]
        self.assertEqual(sg["VpcId"], self.vpc_id)
        self.assertTrue(len(sg["IpPermissions"]) > 0 or len(sg["IpPermissionsEgress"]) > 0)

    @mark.it("VPC has internet gateway attached")
    def test_vpc_has_internet_gateway(self):
        """Test that VPC has an internet gateway attached"""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [self.vpc_id]}]
        )

        self.assertGreater(len(response["InternetGateways"]), 0)
        igw = response["InternetGateways"][0]
        self.assertEqual(igw["Attachments"][0]["State"], "available")


@mark.describe("S3 Storage Integration Tests")
class TestS3Integration(unittest.TestCase):
    """Integration tests for S3 buckets"""

    @classmethod
    def setUpClass(cls):
        """Set up S3 client for tests"""
        cls.s3_client = boto3.client("s3", region_name=CONFIG["region"])
        cls.main_bucket_name = OUTPUTS.get("MainBucketName")
        cls.log_bucket_name = OUTPUTS.get("LogBucketName")

    @mark.it("Main S3 bucket exists and is accessible")
    def test_main_bucket_exists(self):
        """Test that main S3 bucket exists"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.main_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Main bucket does not exist or is not accessible: {e}")

    @mark.it("Main bucket has versioning enabled")
    def test_main_bucket_versioning(self):
        """Test that main bucket has versioning enabled"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_versioning(Bucket=self.main_bucket_name)
        self.assertEqual(response.get("Status"), "Enabled")

    @mark.it("Main bucket has encryption enabled")
    def test_main_bucket_encryption(self):
        """Test that main bucket has encryption configured"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_encryption(Bucket=self.main_bucket_name)

        self.assertIn("Rules", response)
        self.assertGreater(len(response["Rules"]), 0)

        rule = response["Rules"][0]
        self.assertIn("ApplyServerSideEncryptionByDefault", rule)
        sse_algorithm = rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
        self.assertIn(sse_algorithm, ["AES256", "aws:kms"])

    @mark.it("Main bucket blocks public access")
    def test_main_bucket_public_access_block(self):
        """Test that main bucket blocks all public access"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_public_access_block(Bucket=self.main_bucket_name)

        config = response["PublicAccessBlockConfiguration"]
        self.assertTrue(config["BlockPublicAcls"])
        self.assertTrue(config["IgnorePublicAcls"])
        self.assertTrue(config["BlockPublicPolicy"])
        self.assertTrue(config["RestrictPublicBuckets"])

    @mark.it("Log bucket exists and is accessible")
    def test_log_bucket_exists(self):
        """Test that log S3 bucket exists"""
        if not self.log_bucket_name:
            self.skipTest("Log bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.log_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Log bucket does not exist or is not accessible: {e}")

    @mark.it("Can write and read from main bucket")
    def test_main_bucket_read_write(self):
        """Test that we can write to and read from main bucket"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        test_key = "integration-test/test-file.txt"
        test_content = b"Integration test content"

        try:
            # Write test file
            self.s3_client.put_object(
                Bucket=self.main_bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Read test file
            response = self.s3_client.get_object(
                Bucket=self.main_bucket_name,
                Key=test_key
            )

            content = response["Body"].read()
            self.assertEqual(content, test_content)

        finally:
            # Clean up
            try:
                self.s3_client.delete_object(
                    Bucket=self.main_bucket_name,
                    Key=test_key
                )
            except Exception:
                pass


@mark.describe("KMS Integration Tests")
class TestKMSIntegration(unittest.TestCase):
    """Integration tests for KMS keys"""

    @classmethod
    def setUpClass(cls):
        """Set up KMS client for tests"""
        cls.kms_client = boto3.client("kms", region_name=CONFIG["region"])
        cls.kms_key_arn = OUTPUTS.get("KMSKeyArn")

    @mark.it("KMS key exists and is enabled")
    def test_kms_key_exists(self):
        """Test that KMS key exists and is enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.describe_key(KeyId=key_id)

        key_metadata = response["KeyMetadata"]
        self.assertEqual(key_metadata["KeyState"], "Enabled")
        self.assertTrue(key_metadata["Enabled"])

    @mark.it("KMS key has rotation enabled")
    def test_kms_key_rotation(self):
        """Test that KMS key has automatic rotation enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.get_key_rotation_status(KeyId=key_id)

        self.assertTrue(response["KeyRotationEnabled"])


@mark.describe("IAM Integration Tests")
class TestIAMIntegration(unittest.TestCase):
    """Integration tests for IAM roles"""

    @classmethod
    def setUpClass(cls):
        """Set up IAM client for tests"""
        cls.iam_client = boto3.client("iam", region_name=CONFIG["region"])
        cls.iam_role_arn = OUTPUTS.get("IAMRoleArn")

    @mark.it("IAM execution role exists")
    def test_iam_role_exists(self):
        """Test that IAM execution role exists"""
        if not self.iam_role_arn:
            self.skipTest("IAM role ARN not found in outputs")

        role_name = self.iam_role_arn.split("/")[-1]
        response = self.iam_client.get_role(RoleName=role_name)

        role = response["Role"]
        self.assertEqual(role["Arn"], self.iam_role_arn)
        self.assertIn("AssumeRolePolicyDocument", role)


@mark.describe("SNS Integration Tests")
class TestSNSIntegration(unittest.TestCase):
    """Integration tests for SNS topics"""

    @classmethod
    def setUpClass(cls):
        """Set up SNS client for tests"""
        cls.sns_client = boto3.client("sns", region_name=CONFIG["region"])
        cls.notification_topic_arn = OUTPUTS.get("NotificationTopicArn")
        cls.alert_topic_arn = OUTPUTS.get("SecurityAlertTopicArn")

    @mark.it("Notification SNS topic exists")
    def test_notification_topic_exists(self):
        """Test that notification SNS topic exists"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.notification_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.notification_topic_arn)

    @mark.it("Alert SNS topic exists")
    def test_alert_topic_exists(self):
        """Test that alert SNS topic exists"""
        if not self.alert_topic_arn:
            self.skipTest("Alert topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.alert_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.alert_topic_arn)

    @mark.it("Can publish message to notification topic")
    def test_publish_to_notification_topic(self):
        """Test that we can publish messages to notification topic"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.publish(
            TopicArn=self.notification_topic_arn,
            Message="Integration test message",
            Subject="Integration Test"
        )

        self.assertIn("MessageId", response)
        self.assertTrue(len(response["MessageId"]) > 0)


@mark.describe("RDS Integration Tests")
class TestRDSIntegration(unittest.TestCase):
    """Integration tests for RDS database"""

    @classmethod
    def setUpClass(cls):
        """Set up RDS and Secrets Manager clients"""
        cls.rds_client = boto3.client("rds", region_name=CONFIG["region"])
        cls.secretsmanager_client = boto3.client("secretsmanager", region_name=CONFIG["region"])
        cls.database_endpoint = OUTPUTS.get("DatabaseEndpoint")
        cls.database_secret_arn = OUTPUTS.get("DatabaseSecretArn")

    @mark.it("RDS database instance exists and is available")
    def test_rds_instance_exists(self):
        """Test that RDS database instance exists"""
        if not self.database_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        # Extract DB instance identifier from endpoint
        db_instance_id = self.database_endpoint.split(".")[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )

        self.assertEqual(len(response["DBInstances"]), 1)
        db_instance = response["DBInstances"][0]
        self.assertEqual(db_instance["DBInstanceStatus"], "available")
        self.assertTrue(db_instance["StorageEncrypted"])

    @mark.it("Database credentials secret exists")
    def test_database_secret_exists(self):
        """Test that database credentials secret exists in Secrets Manager"""
        if not self.database_secret_arn:
            self.skipTest("Database secret ARN not found in outputs")

        response = self.secretsmanager_client.describe_secret(
            SecretId=self.database_secret_arn
        )

        self.assertEqual(response["ARN"], self.database_secret_arn)
        self.assertIn("Name", response)

    @mark.it("Can retrieve database credentials from Secrets Manager")
    def test_retrieve_database_credentials(self):
        """Test that we can retrieve database credentials"""
        if not self.database_secret_arn:
            self.skipTest("Database secret ARN not found in outputs")

        response = self.secretsmanager_client.get_secret_value(
            SecretId=self.database_secret_arn
        )

        self.assertIn("SecretString", response)
        secret = json.loads(response["SecretString"])

        self.assertIn("username", secret)
        self.assertIn("password", secret)
        self.assertIn("host", secret)
        self.assertIn("port", secret)


@mark.describe("ALB Integration Tests")
class TestALBIntegration(unittest.TestCase):
    """Integration tests for Application Load Balancer"""

    @classmethod
    def setUpClass(cls):
        """Set up ELBv2 client for tests"""
        cls.elbv2_client = boto3.client("elbv2", region_name=CONFIG["region"])
        cls.alb_dns_name = OUTPUTS.get("ALBDNSName")

    @mark.it("Application Load Balancer exists")
    def test_alb_exists(self):
        """Test that ALB exists and is active"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # List all load balancers and find ours by DNS name
        response = self.elbv2_client.describe_load_balancers()

        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]
        self.assertEqual(len(albs), 1)

        alb = albs[0]
        self.assertEqual(alb["State"]["Code"], "active")
        self.assertEqual(alb["Scheme"], "internet-facing")

    @mark.it("ALB has target groups configured")
    def test_alb_target_groups(self):
        """Test that ALB has target groups"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # Get load balancer ARN
        response = self.elbv2_client.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]

        if not albs:
            self.skipTest("ALB not found")

        alb_arn = albs[0]["LoadBalancerArn"]

        # Get target groups for this ALB
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        self.assertGreater(len(tg_response["TargetGroups"]), 0)

        # Verify health check configuration
        for tg in tg_response["TargetGroups"]:
            self.assertTrue(tg["HealthCheckEnabled"])
            self.assertEqual(tg["HealthCheckPath"], "/health")


@mark.describe("CloudTrail Integration Tests")
class TestCloudTrailIntegration(unittest.TestCase):
    """Integration tests for CloudTrail"""

    @classmethod
    def setUpClass(cls):
        """Set up CloudTrail client for tests"""
        cls.cloudtrail_client = boto3.client("cloudtrail", region_name=CONFIG["region"])
        cls.cloudtrail_arn = OUTPUTS.get("CloudTrailArn")

    @mark.it("CloudTrail exists and is logging")
    def test_cloudtrail_exists(self):
        """Test that CloudTrail exists and is logging"""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not found in outputs")

        trail_name = self.cloudtrail_arn.split("/")[-1]

        response = self.cloudtrail_client.get_trail_status(Name=trail_name)

        self.assertTrue(response["IsLogging"])

    @mark.it("CloudTrail has event selectors configured")
    def test_cloudtrail_event_selectors(self):
        """Test that CloudTrail has proper event selectors"""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not found in outputs")

        trail_name = self.cloudtrail_arn.split("/")[-1]

        response = self.cloudtrail_client.get_event_selectors(TrailName=trail_name)

        self.assertIn("EventSelectors", response)
        self.assertGreater(len(response["EventSelectors"]), 0)


if __name__ == "__main__":
    unittest.main()
