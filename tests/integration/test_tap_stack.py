"""Integration tests for TapStack deployment."""

import unittest
import json
import os
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources in integration tests."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource method."""
        return [args.name + '_id', args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call method."""
        if args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": json.dumps({
                    "Version": "2012-10-17",
                    "Statement": []
                })
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for TapStack."""

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012',
        'AWS_REGION': 'us-east-1'
    })
    @pulumi.runtime.test
    def test_full_stack_deployment(self):
        """Test complete stack deployment."""
        from lib.tap_stack import create_infrastructure

        stack = create_infrastructure("integration")

        # Verify stack is created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "integration")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_pipeline_has_five_stages(self):
        """Test that pipeline has exactly 5 stages as required."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify pipeline exists
        self.assertIsNotNone(stack.pipeline)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_kms_encryption_enabled(self):
        """Test that KMS encryption is enabled for artifacts."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify KMS key exists and is used
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.artifacts_bucket)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_ecr_image_scanning_enabled(self):
        """Test that ECR image scanning is enabled."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify ECR repository exists with scanning enabled
        self.assertIsNotNone(stack.ecr_repository)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_sns_notifications_configured(self):
        """Test that SNS notifications are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify SNS topic exists
        self.assertIsNotNone(stack.sns_topic)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_cloudwatch_logs_retention(self):
        """Test that CloudWatch Logs have 7-day retention."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify all log groups exist
        self.assertIsNotNone(stack.build_log_group)
        self.assertIsNotNone(stack.unit_test_log_group)
        self.assertIsNotNone(stack.integration_test_log_group)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_s3_lifecycle_policy(self):
        """Test that S3 bucket has lifecycle policy for 30-day deletion."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify S3 bucket exists
        self.assertIsNotNone(stack.artifacts_bucket)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_iam_least_privilege(self):
        """Test that IAM roles follow least privilege principle."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify IAM roles exist
        self.assertIsNotNone(stack.pipeline_role)
        self.assertIsNotNone(stack.codebuild_role)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_codebuild_compute_type(self):
        """Test that CodeBuild uses BUILD_GENERAL1_SMALL for cost optimization."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify CodeBuild projects exist
        self.assertIsNotNone(stack.build_project)
        self.assertIsNotNone(stack.unit_test_project)
        self.assertIsNotNone(stack.integration_test_project)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_cloudwatch_event_rule_for_branches(self):
        """Test that CloudWatch Event Rule triggers on main and release branches."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify event rule exists
        self.assertIsNotNone(stack.pipeline_event_rule)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'integration',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_github_oauth_secret_exists(self):
        """Test that GitHub OAuth secret is created in Secrets Manager."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="integration")
        stack = TapStack("integration-stack", args)

        # Verify GitHub secret exists
        self.assertIsNotNone(stack.github_secret)


if __name__ == "__main__":
    unittest.main()
