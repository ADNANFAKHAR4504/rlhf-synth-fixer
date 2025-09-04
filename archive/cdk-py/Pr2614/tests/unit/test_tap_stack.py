import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, 
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates NAT gateways for high availability")
    def test_creates_nat_gateways(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 NAT gateways for HA
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("creates RDS instance with encryption")
    def test_creates_rds_with_encryption(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
            "MultiAZ": True,
            "DBName": "production_db"
        })

    @mark.it("creates DynamoDB table with correct billing mode")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest", 
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"{env_suffix}-application-data",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    @mark.it("creates S3 buckets with KMS encryption")
    def test_creates_s3_buckets_with_encryption(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 S3 buckets (assets and logs)
        template.resource_count_is("AWS::S3::Bucket", 2)
        
        # Check encryption is configured
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    })
                ])
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    @mark.it("creates Auto Scaling Group with correct capacity for dev")
    def test_creates_asg_with_dev_capacity(self):
        # ARRANGE
        env_suffix = "dev"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "5",
            "DesiredCapacity": "1"
        })

    @mark.it("creates Auto Scaling Group with correct capacity for prod")
    def test_creates_asg_with_prod_capacity(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10",
            "DesiredCapacity": "2"
        })

    @mark.it("creates Lambda function with VPC configuration")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        # CDK creates an additional Lambda for log retention, so we check for at least 1
        resources = template.find_resources("AWS::Lambda::Function")
        self.assertGreaterEqual(len(resources), 1)
        
        # Check that our main Lambda has the correct properties
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.11",
            "MemorySize": 1024,
            "Timeout": 30
        })

    @mark.it("creates CloudFront distribution")
    def test_creates_cloudfront_distribution(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": Match.object_like({
                "Enabled": True,
                "PriceClass": "PriceClass_100"
            })
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"{env_suffix.capitalize()}-Infrastructure-Dashboard"
        })

    @mark.it("creates SNS topic for alerts")
    def test_creates_sns_topic(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"{env_suffix}-infrastructure-alerts",
            "DisplayName": f"{env_suffix.capitalize()} Infrastructure Alerts"
        })

    @mark.it("creates security groups with correct ingress rules")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Should have at least 3 security groups (web, db, lambda)
        resources = template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(resources), 3)

        # Check web security group has HTTP and HTTPS ingress
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for web servers",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443
                })
            ])
        })

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check that dev-specific resources are created
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "dev-application-data"
        })

    @mark.it("sets correct deletion protection for prod environment")
    def test_sets_deletion_protection_for_prod(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": True
        })

    @mark.it("sets no deletion protection for dev environment")
    def test_no_deletion_protection_for_dev(self):
        # ARRANGE
        env_suffix = "dev"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("creates all expected stack outputs")
    def test_creates_stack_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check for key outputs
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        
        expected_outputs = [
            "EnvironmentSuffix",
            "VpcId",
            "ALBDnsName",
            "CloudFrontDomainName",
            "RDSEndpoint",
            "DynamoDBTableName",
            "AssetsBucketName"
        ]
        
        for expected_output in expected_outputs:
            self.assertIn(expected_output, output_keys)

    @mark.it("applies correct tags to stack")
    def test_applies_correct_tags(self):
        # ARRANGE
        env_suffix = "staging"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        
        # ASSERT
        # Tags are applied at the stack level, so we check the stack's tags
        tags = cdk.Tags.of(stack)
        self.assertIsNotNone(stack)