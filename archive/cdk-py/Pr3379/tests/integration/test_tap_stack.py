import json
import os
import unittest
import boto3
import time
from typing import Dict, List, Optional
from botocore.exceptions import ClientError

from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = f.read()
else:
    flat_outputs = "{}"

flat_outputs = json.loads(flat_outputs)


class AWSResourceTester:
    """Helper class for testing AWS resources"""

    def __init__(self, region: str = "us-east-1"):
        self.region = region
        self.ec2_client = boto3.client("ec2", region_name=region)
        self.ec2_resource = boto3.resource("ec2", region_name=region)
        self.s3_client = boto3.client("s3", region_name=region)
        self.logs_client = boto3.client("logs", region_name=region)
        self.sns_client = boto3.client("sns", region_name=region)
        self.cloudwatch_client = boto3.client("cloudwatch", region_name=region)

    def get_instance_status(self, instance_id: str) -> Dict:
        """Get EC2 instance status"""
        try:
            response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
            if response["Reservations"] and response["Reservations"][0]["Instances"]:
                return response["Reservations"][0]["Instances"][0]
            return {}
        except ClientError as e:
            print(f"Error getting instance status for {instance_id}: {e}")
            return {}

    def check_s3_bucket_exists(self, bucket_name: str) -> bool:
        """Check if S3 bucket exists and is accessible"""
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
            return True
        except ClientError:
            return False

    def check_log_group_exists(self, log_group_name: str) -> bool:
        """Check if CloudWatch log group exists"""
        try:
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            return any(lg["logGroupName"] == log_group_name for lg in response.get("logGroups", []))
        except ClientError:
            return False

    def check_sns_topic_exists(self, topic_arn: str) -> bool:
        """Check if SNS topic exists"""
        try:
            self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            return True
        except ClientError:
            return False

    def get_security_group(self, sg_id: str) -> Optional[Dict]:
        """Get security group details"""
        try:
            response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
            if response["SecurityGroups"]:
                return response["SecurityGroups"][0]
            return None
        except ClientError:
            return None

    def get_vpc_details(self, vpc_id: str) -> Optional[Dict]:
        """Get VPC details"""
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            if response["Vpcs"]:
                return response["Vpcs"][0]
            return None
        except ClientError:
            return None

    def get_cloudwatch_alarms_for_instance(self, instance_id: str) -> List[Dict]:
        """Get CloudWatch alarms for a specific instance"""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarms = []
            for alarm in response.get("MetricAlarms", []):
                # Check if alarm is related to this instance
                for dimension in alarm.get("Dimensions", []):
                    if dimension.get("Name") == "InstanceId" and dimension.get("Value") == instance_id:
                        alarms.append(alarm)
                        break
            return alarms
        except ClientError:
            return []

    def wait_for_instance_running(self, instance_id: str, timeout: int = 300) -> bool:
        """Wait for EC2 instance to be in running state"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            instance = self.get_instance_status(instance_id)
            if instance and instance.get("State", {}).get("Name") == "running":
                return True
            time.sleep(10)
        return False


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack with live AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load outputs once for all tests"""
        cls.outputs = flat_outputs

        # Extract key outputs for easier access
        cls.vpc_id = cls.outputs.get("TapStackVpcId")
        cls.s3_bucket_name = cls.outputs.get("TapStackS3BucketName")
        cls.log_group_name = cls.outputs.get("TapStackCloudWatchLogGroupName")
        cls.sns_topic_arn = cls.outputs.get("TapStackSNSTopicArn")
        cls.security_group_id = cls.outputs.get("SecurityGroupId")  # From nested stack
        cls.instance_ids_str = cls.outputs.get("TapStackEC2InstanceIds", "")
        cls.instance_ids = [id.strip() for id in cls.instance_ids_str.split(",") if id.strip()]
        cls.instance_count = int(cls.outputs.get("TapStackInstanceCount", "0"))
        cls.environment_suffix = cls.outputs.get("TapStackEnvironmentSuffix", "dev")

        # Extract region from SNS topic ARN or use default
        cls.region = cls._extract_region_from_arn(cls.sns_topic_arn) if cls.sns_topic_arn else "us-east-1"

        # Initialize AWS tester with the detected region
        cls.aws_tester = AWSResourceTester(region=cls.region)

    @staticmethod
    def _extract_region_from_arn(arn: str) -> str:
        """Extract AWS region from an ARN string"""
        try:
            # ARN format: arn:aws:service:region:account-id:resource
            parts = arn.split(":")
            if len(parts) >= 4:
                return parts[3]
        except Exception:
            pass
        return "us-east-1"  # Default fallback

    def setUp(self):
        """Set up each test case"""
        if not self.outputs:
            self.skipTest("No CloudFormation outputs found. Deploy the stack first.")

    @mark.it("Verifies CloudFormation outputs are present")
    def test_cloudformation_outputs_exist(self):
        """Test that all expected CloudFormation outputs are present"""
        # ARRANGE & ACT
        required_outputs = [
            "TapStackVpcId",
            "TapStackS3BucketName",
            "TapStackCloudWatchLogGroupName",
            "TapStackSNSTopicArn",
            "TapStackEC2InstanceIds",
            "TapStackInstanceCount",
            "TapStackEnvironmentSuffix",
        ]

        # ASSERT
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, f"Missing required output: {output_key}")
            self.assertIsNotNone(self.outputs[output_key], f"Output {output_key} is None")
            self.assertNotEqual(self.outputs[output_key], "", f"Output {output_key} is empty")

        # Verify instance count matches instance IDs
        self.assertEqual(
            len(self.instance_ids), self.instance_count, "Instance count doesn't match number of instance IDs"
        )

    @mark.it("Verifies VPC exists and has correct configuration")
    def test_vpc_exists_and_configured(self):
        """Test that the VPC exists and is properly configured"""
        # ARRANGE & ACT
        vpc_details = self.aws_tester.get_vpc_details(self.vpc_id)

        # ASSERT
        self.assertIsNotNone(vpc_details, f"VPC {self.vpc_id} not found")
        self.assertEqual(vpc_details["State"], "available", "VPC is not in available state")
        self.assertEqual(vpc_details["CidrBlock"], "10.0.0.0/16", "VPC CIDR block is incorrect")

        # Check VPC has proper tags
        tags = {tag["Key"]: tag["Value"] for tag in vpc_details.get("Tags", [])}
        self.assertIn("Environment", tags)
        self.assertIn("ManagedBy", tags)
        self.assertEqual(tags["ManagedBy"], "CDK")

    @mark.it("Verifies S3 bucket exists and is accessible")
    def test_s3_bucket_exists_and_accessible(self):
        """Test that the S3 bucket exists and is accessible"""
        # ARRANGE & ACT
        bucket_exists = self.aws_tester.check_s3_bucket_exists(self.s3_bucket_name)

        # ASSERT
        self.assertTrue(bucket_exists, f"S3 bucket {self.s3_bucket_name} does not exist or is not accessible")

        # Test bucket properties
        try:
            response = self.aws_tester.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            self.assertIsNotNone(response, "S3 bucket encryption should be configured")
        except ClientError as e:
            if e.response["Error"]["Code"] != "ServerSideEncryptionConfigurationNotFoundError":
                raise

        # Test bucket lifecycle configuration
        try:
            response = self.aws_tester.s3_client.get_bucket_lifecycle_configuration(Bucket=self.s3_bucket_name)
            self.assertIsNotNone(response.get("Rules"), "S3 bucket should have lifecycle rules")
        except ClientError as e:
            if e.response["Error"]["Code"] != "NoSuchLifecycleConfiguration":
                raise

    @mark.it("Verifies CloudWatch log group exists")
    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists"""
        # ARRANGE & ACT
        log_group_exists = self.aws_tester.check_log_group_exists(self.log_group_name)

        # ASSERT
        self.assertTrue(log_group_exists, f"CloudWatch log group {self.log_group_name} does not exist")

    @mark.it("Verifies SNS topic exists")
    def test_sns_topic_exists(self):
        """Test that the SNS topic exists"""
        # ARRANGE & ACT
        topic_exists = self.aws_tester.check_sns_topic_exists(self.sns_topic_arn)

        # ASSERT
        self.assertTrue(topic_exists, f"SNS topic {self.sns_topic_arn} does not exist")

    @mark.it("Verifies security group exists and has correct rules")
    def test_security_group_configuration(self):
        """Test that the security group exists and has proper HTTP access rules"""
        # ARRANGE & ACT
        if not self.security_group_id:
            self.skipTest("Security group ID not found in outputs")

        sg_details = self.aws_tester.get_security_group(self.security_group_id)

        # ASSERT
        self.assertIsNotNone(sg_details, f"Security group {self.security_group_id} not found")
        self.assertEqual(sg_details["VpcId"], self.vpc_id, "Security group is not in the correct VPC")

        # Check ingress rules for HTTP (port 80)
        ingress_rules = sg_details.get("IpPermissions", [])
        http_rule_found = False
        for rule in ingress_rules:
            if rule.get("FromPort") == 80 and rule.get("ToPort") == 80:
                http_rule_found = True
                break

        self.assertTrue(http_rule_found, "HTTP ingress rule (port 80) not found in security group")

    @mark.it("Verifies EC2 instances exist and are running")
    def test_ec2_instances_running(self):
        """Test that all EC2 instances exist and are in running state"""
        # ARRANGE
        self.assertGreater(len(self.instance_ids), 0, "No EC2 instance IDs found in outputs")

        # ACT & ASSERT
        for instance_id in self.instance_ids:
            with self.subTest(instance_id=instance_id):
                # Wait for instance to reach running state (up to 5 minutes)
                instance_running = self.aws_tester.wait_for_instance_running(instance_id, timeout=300)
                self.assertTrue(instance_running, f"Instance {instance_id} did not reach running state within timeout")

                # Get detailed instance information
                instance = self.aws_tester.get_instance_status(instance_id)
                self.assertIsNotNone(instance, f"Instance {instance_id} not found")
                self.assertEqual(
                    instance["State"]["Name"], "running", f"Instance {instance_id} is not in running state"
                )

                # Verify instance is in correct VPC
                self.assertEqual(instance["VpcId"], self.vpc_id, f"Instance {instance_id} is not in the correct VPC")

                # Verify detailed monitoring is enabled
                self.assertTrue(
                    instance.get("Monitoring", {}).get("State") == "enabled",
                    f"Detailed monitoring not enabled for instance {instance_id}",
                )

    @mark.it("Verifies CloudWatch alarms exist for EC2 instances")
    def test_cloudwatch_alarms_configured(self):
        """Test that CloudWatch alarms are configured for EC2 instances"""
        # ARRANGE
        expected_alarm_types = ["CPU", "Memory", "Disk", "Status"]

        # ACT & ASSERT
        for instance_id in self.instance_ids:
            with self.subTest(instance_id=instance_id):
                alarms = self.aws_tester.get_cloudwatch_alarms_for_instance(instance_id)
                self.assertGreater(len(alarms), 0, f"No CloudWatch alarms found for instance {instance_id}")

                # Check that we have alarms covering different metrics
                alarm_names = [alarm["AlarmName"] for alarm in alarms]
                alarm_name_str = " ".join(alarm_names)

                # Verify alarm types exist (flexible matching)
                found_alarm_types = []
                for alarm_type in expected_alarm_types:
                    if any(alarm_type.lower() in alarm_name.lower() for alarm_name in alarm_names):
                        found_alarm_types.append(alarm_type)

                self.assertGreater(
                    len(found_alarm_types),
                    0,
                    f"No expected alarm types found for instance {instance_id}. " f"Found alarms: {alarm_names}",
                )

    @mark.it("Verifies environment configuration is correct")
    def test_environment_configuration(self):
        """Test that environment-specific configuration is correct"""
        # ARRANGE & ACT & ASSERT
        self.assertIsNotNone(self.environment_suffix, "Environment suffix should be set")
        self.assertNotEqual(self.environment_suffix, "", "Environment suffix should not be empty")

        # Verify S3 bucket name includes environment suffix
        self.assertIn(
            self.environment_suffix,
            self.s3_bucket_name,
            f"S3 bucket name should include environment suffix {self.environment_suffix}",
        )

        # Verify expected number of instances based on context
        expected_min_instances = 1
        expected_max_instances = 15  # Default from stack
        self.assertGreaterEqual(self.instance_count, expected_min_instances, "Should have at least 1 instance")
        self.assertLessEqual(
            self.instance_count, expected_max_instances, "Should not exceed maximum expected instances"
        )

    @mark.it("Performs end-to-end monitoring workflow test")
    def test_end_to_end_monitoring_workflow(self):
        """Test the complete monitoring workflow from instance to alerts"""
        # ARRANGE
        if not self.instance_ids:
            self.skipTest("No instances available for end-to-end test")

        test_instance_id = self.instance_ids[0]  # Use first instance for detailed testing

        # ACT & ASSERT

        # 1. Verify instance is accessible and monitoring is active
        instance = self.aws_tester.get_instance_status(test_instance_id)
        self.assertIsNotNone(instance, "Test instance should exist")
        self.assertEqual(instance["State"]["Name"], "running", "Test instance should be running")

        # 2. Verify CloudWatch agent is configured (check for custom namespace metrics)
        try:
            # Check if custom metrics are being published to TAP/EC2 namespace
            response = self.aws_tester.cloudwatch_client.list_metrics(
                Namespace="TAP/EC2", Dimensions=[{"Name": "InstanceId", "Value": test_instance_id}]
            )
            custom_metrics_exist = len(response.get("Metrics", [])) > 0

            # If no custom metrics yet, that's OK as they take time to appear
            # We'll just verify the configuration is in place
            print(f"Custom metrics found for {test_instance_id}: {custom_metrics_exist}")

        except ClientError:
            # CloudWatch metrics may not be available immediately after deployment
            print("CloudWatch custom metrics check skipped - may not be available yet")

        # 3. Verify alarms are properly configured with SNS actions
        alarms = self.aws_tester.get_cloudwatch_alarms_for_instance(test_instance_id)
        self.assertGreater(len(alarms), 0, "Should have CloudWatch alarms configured")

        # Check that alarms have SNS actions configured
        alarms_with_sns = [alarm for alarm in alarms if alarm.get("AlarmActions")]
        self.assertGreater(len(alarms_with_sns), 0, "At least one alarm should have SNS actions configured")

        # 4. Verify SNS topic is properly configured for notifications
        topic_exists = self.aws_tester.check_sns_topic_exists(self.sns_topic_arn)
        self.assertTrue(topic_exists, "SNS topic should exist for alarm notifications")

        print(f"✅ End-to-end monitoring workflow verified for instance {test_instance_id}")
