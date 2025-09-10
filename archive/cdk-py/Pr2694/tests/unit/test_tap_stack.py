"""Unit tests for TAP stack."""
import unittest
import aws_cdk as cdk
from aws_cdk import assertions
from lib.tap_stack import TapStack


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        # Don't specify account/region for unit tests
        self.stack = TapStack(self.app, "TestStack")

    def test_stack_creation(self):
        """Test that stack can be created without errors."""
        self.assertIsNotNone(self.stack)

    def test_vpc_creation(self):
        """Test VPC creation."""
        template = assertions.Template.from_stack(self.stack)

        # Check that VPC is created
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_s3_bucket_creation(self):
        """Test S3 bucket creation with proper configuration."""
        template = assertions.Template.from_stack(self.stack)

        # Check that S3 bucket is created with encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    def test_rds_instance_creation(self):
        """Test RDS instance creation."""
        template = assertions.Template.from_stack(self.stack)

        # Check that RDS instance is created
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "MultiAZ": False,
            "StorageEncrypted": False,
            "BackupRetentionPeriod": 7
        })

    def test_lambda_function_creation(self):
        """Test Lambda function creation."""
        template = assertions.Template.from_stack(self.stack)

        # Check that Lambda function is created
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 256
        })

    def test_security_groups_creation(self):
        """Test security groups creation."""
        template = assertions.Template.from_stack(self.stack)

        # Check that security groups are created
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    def test_parameter_store_entries(self):
        """Test Parameter Store entries creation."""
        template = assertions.Template.from_stack(self.stack)

        # Check that SSM parameters are created
        template.resource_count_is("AWS::SSM::Parameter", 4)


if __name__ == '__main__':
    unittest.main()
