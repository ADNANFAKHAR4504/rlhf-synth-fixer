"""Unit tests for TapStack CDK stack"""
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
    def test_creates_vpc(self):
        """Test VPC creation with proper configuration"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": Match.array_with(
                    [{"Key": "Name", "Value": Match.string_like_regexp(".*testenv.*")}]
                )
            },
        )

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        """Test KMS key creation with rotation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties("AWS::KMS::Key", {"EnableKeyRotation": True})

    @mark.it("creates ECS cluster with correct name")
    def test_creates_ecs_cluster(self):
        """Test ECS cluster creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties(
            "AWS::ECS::Cluster", {"ClusterName": f"video-processing-cluster-{env_suffix}"}
        )

    @mark.it("creates RDS instance with Multi-AZ enabled")
    def test_creates_rds_multiaz(self):
        """Test RDS instance with Multi-AZ configuration"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {"MultiAZ": True, "StorageEncrypted": True, "DeletionProtection": False},
        )

    @mark.it("creates ElastiCache replication group with Multi-AZ")
    def test_creates_elasticache_multiaz(self):
        """Test ElastiCache replication group with Multi-AZ"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)
        template.has_resource_properties(
            "AWS::ElastiCache::ReplicationGroup",
            {
                "MultiAZEnabled": True,
                "AutomaticFailoverEnabled": True,
                "NumCacheClusters": 2,
                "AtRestEncryptionEnabled": True,
                "TransitEncryptionEnabled": False,
            },
        )

    @mark.it("creates EFS file system with encryption")
    def test_creates_efs_encrypted(self):
        """Test EFS file system with encryption"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EFS::FileSystem", 1)
        template.has_resource_properties("AWS::EFS::FileSystem", {"Encrypted": True})

    @mark.it("creates API Gateway REST API")
    def test_creates_api_gateway(self):
        """Test API Gateway REST API creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {"Name": f"video-metadata-api-{env_suffix}"},
        )

    @mark.it("creates CloudWatch log groups")
    def test_creates_cloudwatch_logs(self):
        """Test CloudWatch log groups creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for ECS and API Gateway log groups
        template.resource_count_is("AWS::Logs::LogGroup", 2)

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        """Test security groups creation"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - ECS, RDS, ElastiCache, EFS security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties(
            "AWS::ECS::Cluster", {"ClusterName": "video-processing-cluster-dev"}
        )
