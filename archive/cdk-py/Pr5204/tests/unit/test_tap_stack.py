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

    @mark.it("creates disaster recovery stack with correct resources")
    def test_creates_disaster_recovery_stack(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Verify disaster recovery resources are created
        # Should have 2 RDS instances (primary + read replica)
        template.resource_count_is("AWS::RDS::DBInstance", 2)
        template.resource_count_is("AWS::EFS::FileSystem", 1)
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.resource_count_is("AWS::ElastiCache::ReplicationGroup", 1)

    @mark.it("exposes important resource properties")
    def test_exposes_resource_properties(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT - Verify stack exposes required properties
        self.assertIsNotNone(stack.database_endpoint)
        self.assertIsNotNone(stack.efs_id)
        self.assertIsNotNone(stack.cache_endpoint)
        self.assertIsNotNone(stack.secret_arn)

    @mark.it("creates nested disaster recovery stack construct")
    def test_creates_nested_disaster_recovery_stack(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")

        # ASSERT - Verify the disaster recovery stack is created
        self.assertIsNotNone(stack.dr_stack)
        self.assertEqual(stack.dr_stack.node.id, "DisasterRecoveryStack")
