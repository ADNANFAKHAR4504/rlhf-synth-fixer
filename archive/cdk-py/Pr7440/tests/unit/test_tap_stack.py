"""Unit tests for TapStack infrastructure"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with the correct configuration")
    def test_creates_vpc_with_correct_config(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates Aurora database cluster")
    def test_creates_aurora_cluster(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBCluster", 1)
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-mysql",
            "EngineVersion": "8.0.mysql_aurora.3.04.0",
            "DeletionProtection": False,  # dev environment
            "StorageEncrypted": True
        })

    @mark.it("creates Aurora reader instances")
    def test_creates_aurora_readers(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - 1 writer + 2 readers = 3 total
        template.resource_count_is("AWS::RDS::DBInstance", 3)

    @mark.it("creates DynamoDB tables")
    def test_creates_dynamodb_tables(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::DynamoDB::Table", 3)

    @mark.it("creates ElastiCache Redis cluster")
    def test_creates_redis_cluster(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "Engine": "redis",
            "CacheNodeType": "cache.r6g.4xlarge",
            "NumNodeGroups": 4,
            "ReplicasPerNodeGroup": 2,
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    @mark.it("creates Auto Scaling Group")
    def test_creates_autoscaling_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "12",
            "MaxSize": "25",
            "DesiredCapacity": "15"
        })

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("creates security groups with proper configuration")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - ALB, EC2, RDS, Redis security groups = 4 total
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 4)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates stack outputs for important resources")
    def test_creates_stack_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check for key outputs
        outputs = template.find_outputs("*")
        self.assertIn("VpcId", outputs)
        self.assertIn("AuroraClusterEndpoint", outputs)
        self.assertIn("RedisConfigurationEndpoint", outputs)
        self.assertIn("AlbArn", outputs)
        self.assertIn("AutoScalingGroupName", outputs)

    @mark.it("sets RemovalPolicy.DESTROY for dev environment")
    def test_removal_policy_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - DynamoDB tables should have DeletionPolicy: Delete
        template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete"
        })

    @mark.it("enables encryption for data at rest")
    def test_encryption_at_rest(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        # Aurora
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True
        })
        # Redis
        template.has_resource_properties("AWS::ElastiCache::ReplicationGroup", {
            "AtRestEncryptionEnabled": True,
            "TransitEncryptionEnabled": True
        })
        # DynamoDB
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })
