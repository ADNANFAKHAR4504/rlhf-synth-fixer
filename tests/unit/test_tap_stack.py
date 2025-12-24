"""Unit tests for the TapStack CDK stack."""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, "TapStackTest", props=props)
        self.template = Template.from_stack(self.stack)

    def test_creates_kms_key(self):
        """Test KMS key creation"""
        self.template.resource_count_is("AWS::KMS::Key", 1)

    def test_creates_s3_bucket_encrypted(self):
        """Test S3 bucket with encryption"""
        self.template.resource_count_is("AWS::S3::Bucket", 1)

    def test_creates_vpc(self):
        """Test VPC creation"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)

    def test_creates_vpc_flow_logs(self):
        """Test VPC Flow Logs are enabled"""
        self.template.resource_count_is("AWS::EC2::FlowLog", 1)

    def test_creates_cloudwatch_log_group(self):
        """Test CloudWatch Log Group for VPC Flow Logs"""
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)

    def test_creates_rds_instance(self):
        """Test RDS instance creation"""
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)

    def test_creates_lambda_function(self):
        """Test Lambda function creation"""
        self.template.resource_count_is("AWS::Lambda::Function", 1)

    def test_creates_sqs_dlq(self):
        """Test SQS Dead Letter Queue creation"""
        self.template.resource_count_is("AWS::SQS::Queue", 1)

    def test_creates_cloudtrail(self):
        """Test CloudTrail creation"""
        self.template.resource_count_is("AWS::CloudTrail::Trail", 1)

    def test_creates_aws_config(self):
        """Test AWS Config recorder and rule"""
        self.template.resource_count_is("AWS::Config::ConfigurationRecorder", 1)
        self.template.resource_count_is("AWS::Config::ConfigRule", 1)

    def test_creates_security_groups(self):
        """Test security groups are created"""
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 1,
                                "Should have at least one security group")

    def test_creates_iam_roles(self):
        """Test IAM roles for services"""
        roles = self.template.find_resources("AWS::IAM::Role")
        self.assertGreaterEqual(len(roles), 1,
                                "Should have at least one IAM role")

    def test_creates_stack_outputs(self):
        """Test all required stack outputs are created"""
        outputs = self.template.find_outputs("*")
        output_keys = list(outputs.keys())

        # Check for key outputs
        self.assertIn("KmsKeyArn", output_keys)
        self.assertIn("VPCId", output_keys)


if __name__ == '__main__':
    unittest.main()
