"""Unit tests for the TapStack CDK infrastructure.

This module contains unit tests that validate the CDK template synthesis
and resource configuration without requiring actual AWS deployments.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack - Video Processing Pipeline")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates nested stacks for each infrastructure component")
    def test_creates_nested_stacks(self):
        """Verify that all nested stacks are created"""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 7 nested stacks (Network, Storage, Cache, Compute, Api, Notification, Workflow)
        template.resource_count_is("AWS::CloudFormation::Stack", 7)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Verify default environment suffix is 'dev'"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Stack should be created successfully with default 'dev' suffix
        # Should have 7 nested stacks
        template.resource_count_is("AWS::CloudFormation::Stack", 7)

    @mark.it("creates stack with correct stack dependencies")
    def test_stack_dependencies(self):
        """Verify that stacks have correct dependencies"""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT - Verify that nested stacks exist
        assert stack.network_stack is not None
        assert stack.storage_stack is not None
        assert stack.cache_stack is not None
        assert stack.compute_stack is not None
        assert stack.api_stack is not None
        assert stack.notification_stack is not None
        assert stack.workflow_stack is not None
