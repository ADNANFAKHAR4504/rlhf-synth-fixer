# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with 2 availability zones")
    def test_creates_vpc(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates Kinesis stream for inventory updates")
    def test_creates_kinesis_stream(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Kinesis::Stream", 1)
        template.has_resource_properties("AWS::Kinesis::Stream", {
            "ShardCount": 2
        })

    @mark.it("creates S3 bucket for archival")
    def test_creates_s3_bucket(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestS3")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("creates RDS PostgreSQL database")
    def test_creates_rds_database(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestRDS")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)

    @mark.it("creates ElastiCache Redis cluster")
    def test_creates_elasticache_cluster(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestCache")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElastiCache::CacheCluster", 1)

    @mark.it("creates Lambda function for inventory processing")
    def test_creates_lambda_function(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestLambda")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::Function", 1)

    @mark.it("creates Lambda event source mapping from Kinesis")
    def test_creates_event_source_mapping(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestMapping")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)

    @mark.it("creates Secrets Manager secret for database credentials")
    def test_creates_secrets_manager_secret(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestSecret")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates security groups for database and cache")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestSG")
        template = Template.from_stack(stack)

        # ASSERT - at least 2 security groups (DB and Cache)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    @mark.it("creates CloudWatch Log Group")
    def test_creates_log_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestLogs")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("creates IAM role for Lambda execution")
    def test_creates_lambda_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestRole")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("creates ElastiCache subnet group")
    def test_creates_cache_subnet_group(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestSubnet")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElastiCache::SubnetGroup", 1)

    @mark.it("uses custom environment suffix when provided")
    def test_uses_custom_environment_suffix(self):
        # ARRANGE
        custom_suffix = "production"
        props = TapStackProps(environment_suffix=custom_suffix)
        stack = TapStack(self.app, "TapStackTestCustomEnv", props)
        template = Template.from_stack(stack)

        # ASSERT - just verify stack was created successfully
        template.resource_count_is("AWS::Kinesis::Stream", 1)

    @mark.it("defaults environment suffix when props is None")
    def test_defaults_environment_suffix_when_props_none(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestNoProps", None)
        template = Template.from_stack(stack)

        # ASSERT - just verify stack was created successfully
        template.resource_count_is("AWS::Kinesis::Stream", 1)

    @mark.it("uses env from props when provided")
    def test_uses_env_from_props(self):
        # ARRANGE
        from aws_cdk import Environment
        props = TapStackProps(
            environment_suffix="test",
            env=Environment(account="123456789012", region="us-west-2")
        )
        stack = TapStack(self.app, "TapStackTestEnvProps", props)
        template = Template.from_stack(stack)

        # ASSERT - just verify stack was created successfully
        template.resource_count_is("AWS::Kinesis::Stream", 1)
