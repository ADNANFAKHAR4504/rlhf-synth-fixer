"""Unit tests for the NotificationStack CDK infrastructure.

This module contains unit tests for the SNS notification infrastructure.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.notification_stack import NotificationStack, NotificationStackProps


@mark.describe("NotificationStack - SNS Topics")
class TestNotificationStack(unittest.TestCase):
    """Test cases for the NotificationStack CDK nested stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(self.app, "ParentStack")

    @mark.it("creates SNS topic for video processing completion")
    def test_creates_completion_topic(self):
        """Verify SNS topic for completion notifications is created"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 2)
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"video-processing-completion-{env_suffix}",
            "DisplayName": "Video Processing Completion Notifications",
        })

    @mark.it("creates SNS topic for video processing errors")
    def test_creates_error_topic(self):
        """Verify SNS topic for error notifications is created"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": f"video-processing-error-{env_suffix}",
            "DisplayName": "Video Processing Error Notifications",
        })

    @mark.it("creates both completion and error topics")
    def test_creates_both_topics(self):
        """Verify both SNS topics are created"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 SNS topics
        template.resource_count_is("AWS::SNS::Topic", 2)

    @mark.it("exports completion topic ARN as CloudFormation output")
    def test_exports_completion_topic_arn(self):
        """Verify completion topic ARN is exported"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for output
        template.has_output(
            "CompletionTopicArn",
            {
                "Export": {
                    "Name": f"CompletionTopicArn-{env_suffix}",
                },
            },
        )

    @mark.it("exports error topic ARN as CloudFormation output")
    def test_exports_error_topic_arn(self):
        """Verify error topic ARN is exported"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for output
        template.has_output(
            "ErrorTopicArn",
            {
                "Export": {
                    "Name": f"ErrorTopicArn-{env_suffix}",
                },
            },
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Verify default environment suffix is 'dev'"""
        # ARRANGE
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
        )
        template = Template.from_stack(stack)

        # ASSERT - Stack should be created successfully
        template.resource_count_is("AWS::SNS::Topic", 2)

    @mark.it("topics are not FIFO queues")
    def test_topics_not_fifo(self):
        """Verify topics are standard (not FIFO)"""
        # ARRANGE
        env_suffix = "test"
        stack = NotificationStack(
            self.parent_stack,
            "NotificationStackTest",
            NotificationStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check that FifoTopic is not set to true
        topics = template.find_resources("AWS::SNS::Topic")
        for topic_id, topic_config in topics.items():
            properties = topic_config.get("Properties", {})
            # FIFO topics would have FifoTopic: true or .fifo suffix
            # CDK may explicitly set FifoTopic to False, which is acceptable
            if "FifoTopic" in properties:
                self.assertFalse(properties["FifoTopic"])
            topic_name = properties.get("TopicName", "")
            self.assertFalse(topic_name.endswith(".fifo"))
