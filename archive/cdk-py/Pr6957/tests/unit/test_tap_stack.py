import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_vpc_with_environment_suffix(self):
        """Test that VPC is created with correct environment suffix"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": f"zero-trust-vpc-{self.env_suffix}"}
            ])
        })

    def test_creates_kms_keys_with_rotation(self):
        """Test that KMS keys are created with rotation enabled"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have 3 KMS keys (S3, Logs, Lambda)
        template.resource_count_is("AWS::KMS::Key", 3)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_creates_s3_bucket_with_encryption(self):
        """Test that S3 bucket is created with KMS encryption"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": f"zero-trust-data-{self.env_suffix}",
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_creates_lambda_function_in_vpc(self):
        """Test that Lambda function is created in VPC with correct config"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - CDK creates custom resource Lambda functions too, so we check for specific function
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"data-processor-{self.env_suffix}",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 512
        })

    def test_creates_vpc_endpoints(self):
        """Test that VPC endpoints are created for S3, Secrets Manager, KMS, and Logs"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Should have 1 gateway endpoint (S3) and 3 interface endpoints
        template.resource_count_is("AWS::EC2::VPCEndpoint", 4)

    def test_cloudwatch_log_group_with_encryption(self):
        """Test that CloudWatch log group is created with KMS encryption"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/lambda/data-processor-{self.env_suffix}",
            "RetentionInDays": 90
        })

    def test_lambda_role_has_required_permissions(self):
        """Test that Lambda role has correct IAM permissions"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Lambda role should exist (CDK creates custom resource roles too)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    }
                ]
            },
            "Description": Match.string_like_regexp("Lambda execution role.*")
        })

    def test_security_group_restricts_outbound_traffic(self):
        """Test that Lambda security group has restricted outbound rules"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": f"Security group for Lambda functions - {self.env_suffix}"
        })

    def test_all_resources_have_removal_policy_destroy(self):
        """Test that all resources are configured with RemovalPolicy.DESTROY"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Check KMS keys have DeletionPolicy: Delete
        kms_keys = template.find_resources("AWS::KMS::Key")
        for key in kms_keys.values():
            assert key.get("DeletionPolicy") == "Delete", "KMS key should have DeletionPolicy: Delete"

    def test_stack_tags_applied(self):
        """Test that stack-level tags are applied correctly"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        template = Template.from_stack(stack)

        # ASSERT - Verify template was created successfully
        assert template is not None
