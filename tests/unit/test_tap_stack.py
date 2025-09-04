"""Unit tests for TAP stack."""
import unittest
from unittest.mock import Mock, patch
import aws_cdk as cdk
from lib.tap_stack import TapStack


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")

    def test_stack_creation(self):
        """Test that stack can be created without errors."""
        stack = TapStack(self.app, "TestStack", env=self.env)
        self.assertIsNotNone(stack)

    def test_vpc_creation(self):
        """Test VPC creation."""
        stack = TapStack(self.app, "TestStack", env=self.env)
        template = cdk.assertions.Template.from_stack(stack)

        # Check that VPC is created
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_s3_bucket_creation(self):
        """Test S3 bucket creation with proper configuration."""
        stack = TapStack(self.app, "TestStack", env=self.env)
        template = cdk.assertions.Template.from_stack(stack)

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
        stack = TapStack(self.app, "TestStack", env=self.env)
        template = cdk.assertions.Template.from_stack(stack)

        # Check that RDS instance is created
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "MultiAZ": True,
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7
        })

    def test_lambda_function_creation(self):
        """Test Lambda function creation."""
        stack = TapStack(self.app, "TestStack", env=self.env)
        template = cdk.assertions.Template.from_stack(stack)

        # Check that Lambda function is created
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 256
        })


if __name__ == '__main__':
    unittest.main()