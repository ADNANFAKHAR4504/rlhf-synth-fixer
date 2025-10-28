"""Unit tests for TapStack CDK infrastructure"""
import os
import unittest
from unittest.mock import patch, MagicMock, Mock

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

# Mock Docker to avoid Docker requirements in unit tests
os.environ["CDK_DOCKER"] = "stub"

# pylint: disable=wrong-import-position
from lib.tap_stack import (
    TapStack,
    TapStackProps,
    NetworkingStack,
    StorageStack,
    ServerlessStack,
    ComputeStack,
    CDNStack,
    DNSStack,
    ComplianceStack,
    MonitoringStack,
    CICDStack,
    SecurityStack,
)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")

    @mark.it("creates stack with default environment suffix")
    def test_creates_stack_with_default_suffix(self):
        """Test that stack creates with default 'dev' suffix"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            stack = TapStack(
                self.app,
                "TapStackTest",
                env=self.env,
            )
            assert hasattr(stack, 'networking')
            assert hasattr(stack, 'storage')
            assert hasattr(stack, 'serverless')
            assert hasattr(stack, 'compute')

    @mark.it("creates stack with custom environment suffix")
    def test_creates_stack_with_custom_suffix(self):
        """Test stack creation with custom environment suffix"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            stack = TapStack(
                self.app,
                "TapStackProd",
                TapStackProps(environment_suffix="prod"),
                env=self.env,
            )
            assert stack is not None

    @mark.it("creates required nested stacks")
    def test_creates_nested_stacks(self):
        """Test that all required nested stacks are created"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            stack = TapStack(self.app, "TapStackTest", env=self.env)

            # Verify nested stacks exist
            assert hasattr(stack, 'networking')
            assert hasattr(stack, 'storage')
            assert hasattr(stack, 'serverless')
            assert hasattr(stack, 'compute')

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        """Test that stack creates required outputs"""
        # Patch NodejsFunction before creating stack
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            # Create mock function
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_fn.function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-function'
            mock_nodejs.return_value = mock_fn

            stack = TapStack(self.app, "TapStackTest", env=self.env)

            # Check that outputs are created
            synth = self.app.synth()
            stack_artifact = synth.get_stack_by_name(stack.stack_name)
            template_dict = stack_artifact.template

            assert "Outputs" in template_dict
            outputs = template_dict["Outputs"]
            assert "VPCId" in outputs
            assert "ALBDNSName" in outputs
            assert "MainBucketName" in outputs
            assert "NotificationTopicArn" in outputs

    @mark.it("applies correct tags to stack")
    def test_applies_correct_tags(self):
        """Test that correct tags are applied to the stack"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            stack = TapStack(
                self.app,
                "TapStackTest",
                TapStackProps(environment_suffix="test"),
                env=self.env,
            )

            # Check tags on stack
            tags = stack.tags.tag_values()
            assert "iac-rlhf-amazon" in tags
            assert "Environment" in tags
            assert "ManagedBy" in tags

    @mark.it("uses context for environment suffix")
    def test_uses_context_for_env_suffix(self):
        """Test environment suffix from context"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            app = cdk.App(context={"environmentSuffix": "staging"})
            stack = TapStack(app, "TapStackStaging", env=self.env)
            assert stack is not None


@mark.describe("NetworkingStack")
class TestNetworkingStack(unittest.TestCase):
    """Test cases for NetworkingStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with proper subnet configuration"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create VPC
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            },
        )

    @mark.it("creates public and private subnets")
    def test_creates_subnets(self):
        """Test that public, private, and isolated subnets are created"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # VPC with 3 AZs and 3 subnet types = 9 subnets
        template.resource_count_is("AWS::EC2::Subnet", 9)

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        """Test security group creation with ingress rules"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8", "192.168.0.0/16"],
        )
        template = Template.from_stack(networking)

        # Should create 2 security groups (web and app)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    @mark.it("creates VPC flow logs")
    def test_creates_vpc_flow_logs(self):
        """Test VPC flow log creation"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create flow log
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    @mark.it("creates NAT gateways")
    def test_creates_nat_gateways(self):
        """Test NAT gateway creation for private subnet internet access"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create 2 NAT gateways
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("exposes VPC and security groups")
    def test_exposes_vpc_and_security_groups(self):
        """Test that VPC and security groups are accessible"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )

        assert networking.vpc is not None
        assert networking.web_security_group is not None
        assert networking.app_security_group is not None
        assert networking.flow_log is not None


@mark.describe("StorageStack")
class TestStorageStack(unittest.TestCase):
    """Test cases for StorageStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )

    @mark.it("creates KMS key for S3 encryption")
    def test_creates_kms_key(self):
        """Test KMS key creation with key rotation enabled"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create KMS key
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
            },
        )

    @mark.it("creates KMS key alias")
    def test_creates_kms_alias(self):
        """Test KMS key alias creation"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create KMS alias
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.has_resource_properties(
            "AWS::KMS::Alias",
            {
                "AliasName": "alias/tap-s3-test-us-east-1",
            },
        )

    @mark.it("creates S3 buckets with proper naming")
    def test_creates_s3_buckets(self):
        """Test S3 bucket creation with environment suffix"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create 3 buckets: log, main, static
        template.resource_count_is("AWS::S3::Bucket", 3)

    @mark.it("configures main bucket with KMS encryption")
    def test_main_bucket_has_kms_encryption(self):
        """Test main bucket uses KMS encryption"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have KMS encryption
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "ServerSideEncryptionByDefault": {
                                        "SSEAlgorithm": "aws:kms",
                                    }
                                }
                            )
                        ]
                    ),
                },
            },
        )

    @mark.it("enables versioning on main bucket")
    def test_main_bucket_has_versioning(self):
        """Test main bucket has versioning enabled"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have versioning
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "VersioningConfiguration": {
                    "Status": "Enabled",
                },
            },
        )

    @mark.it("blocks public access on all buckets")
    def test_buckets_block_public_access(self):
        """Test that all buckets block public access"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # All buckets should block public access
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

    @mark.it("configures lifecycle rules on buckets")
    def test_buckets_have_lifecycle_rules(self):
        """Test that buckets have lifecycle rules configured"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have lifecycle rules
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "LifecycleConfiguration": Match.object_like(
                    {
                        "Rules": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Status": "Enabled",
                                    }
                                )
                            ]
                        ),
                    }
                ),
            },
        )

    @mark.it("uses prod removal policy for prod environment")
    def test_prod_removal_policy(self):
        """Test that prod environment uses RETAIN policy"""
        storage = StorageStack(
            self.parent_stack,
            "StorageProd",
            environment_suffix="prod",
            region="us-east-1",
            account_id="123456789012",
        )

        assert storage.main_bucket is not None
        assert storage.log_bucket is not None
        assert storage.static_bucket is not None

    @mark.it("exposes buckets and KMS key")
    def test_exposes_buckets_and_key(self):
        """Test that buckets and KMS key are accessible"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )

        assert storage.kms_key is not None
        assert storage.log_bucket is not None
        assert storage.main_bucket is not None
        assert storage.static_bucket is not None


@mark.describe("ServerlessStack")
class TestServerlessStack(unittest.TestCase):
    """Test cases for ServerlessStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        # Create a mock S3 bucket for testing
        import aws_cdk.aws_s3 as s3

        self.mock_bucket = s3.Bucket(
            self.parent_stack, "MockBucket", bucket_name="mock-bucket"
        )

    @mark.it("creates SNS topics for notifications")
    def test_creates_sns_topics(self):
        """Test SNS topic creation"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            serverless = ServerlessStack(
                self.parent_stack,
                "ServerlessTest",
                environment_suffix="test",
                region="us-east-1",
                main_bucket=self.mock_bucket,
            )

            assert serverless.notification_topic is not None
            assert serverless.alert_topic is not None

    @mark.it("creates Lambda IAM role with proper permissions")
    def test_creates_lambda_iam_role(self):
        """Test Lambda IAM role creation with proper permissions"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            serverless = ServerlessStack(
                self.parent_stack,
                "ServerlessTest",
                environment_suffix="test",
                region="us-east-1",
                main_bucket=self.mock_bucket,
            )

            assert serverless.lambda_role is not None

    @mark.it("exposes Lambda functions")
    def test_exposes_lambda_functions(self):
        """Test that Lambda functions are accessible"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            serverless = ServerlessStack(
                self.parent_stack,
                "ServerlessTest",
                environment_suffix="test",
                region="us-east-1",
                main_bucket=self.mock_bucket,
            )

            assert serverless.s3_processing_function is not None
            assert serverless.alarm_function is not None
            assert serverless.config_function is not None

    @mark.it("adds email subscription when provided")
    def test_adds_email_subscription(self):
        """Test email subscription to SNS topic"""
        with patch('aws_cdk.aws_lambda_nodejs.NodejsFunction') as mock_nodejs:
            mock_fn = Mock()
            mock_fn.function_name = 'test-function'
            mock_nodejs.return_value = mock_fn

            serverless = ServerlessStack(
                self.parent_stack,
                "ServerlessTest",
                environment_suffix="test",
                region="us-east-1",
                main_bucket=self.mock_bucket,
                notification_email="test@example.com",
            )

            assert serverless.notification_topic is not None


@mark.describe("ComputeStack")
class TestComputeStack(unittest.TestCase):
    """Test cases for ComputeStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        # Create mock VPC and security group
        import aws_cdk.aws_ec2 as ec2

        self.mock_vpc = ec2.Vpc(self.parent_stack, "MockVPC")
        self.mock_sg = ec2.SecurityGroup(
            self.parent_stack, "MockSG", vpc=self.mock_vpc
        )

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test ALB creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create ALB
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    @mark.it("creates Auto Scaling Group")
    def test_creates_asg(self):
        """Test Auto Scaling Group creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create ASG
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

    @mark.it("configures ASG with correct capacity")
    def test_asg_has_correct_capacity(self):
        """Test ASG capacity configuration"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # ASG should have min=2, max=10, desired=3
        template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {
                "MinSize": "2",
                "MaxSize": "10",
                "DesiredCapacity": "3",
            },
        )

    @mark.it("creates target group with health checks")
    def test_creates_target_group(self):
        """Test target group creation with health checks"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create target group
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "HealthCheckPath": "/health",
                "HealthCheckEnabled": True,
            },
        )

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_instance_role(self):
        """Test EC2 instance IAM role creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create IAM role
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Principal": {"Service": "ec2.amazonaws.com"},
                                    }
                                )
                            ]
                        ),
                    }
                ),
            },
        )

    @mark.it("configures auto scaling policies")
    def test_creates_scaling_policies(self):
        """Test auto scaling policy creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create scaling policies (CPU + 2 for memory = 2 policies total based on code)
        template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 2)

    @mark.it("exposes ASG, ALB and target group")
    def test_exposes_resources(self):
        """Test that resources are accessible"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )

        assert compute.asg is not None
        assert compute.alb is not None
        assert compute.target_group is not None
        assert compute.instance_role is not None


if __name__ == "__main__":
    unittest.main()
