"""Unit tests for TapStack."""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new_resource method - returns resource name and inputs."""
        return [args.name + '_id', args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock call method - returns mocked responses for Pulumi functions."""
        if args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": '{"Version": "2012-10-17", "Statement": []}'
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack."""

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012',
        'AWS_REGION': 'us-east-1',
        'REPOSITORY': 'test-repo',
        'COMMIT_AUTHOR': 'test-author',
        'PR_NUMBER': '123',
        'TEAM': 'test-team'
    })
    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test that TapStack can be created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify stack was created
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012',
        'AWS_REGION': 'us-east-1'
    })
    @pulumi.runtime.test
    def test_tap_stack_with_tags(self):
        """Test TapStack with custom tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {"CustomTag": "CustomValue"}
        args = TapStackArgs(environment_suffix="test", tags=custom_tags)
        stack = TapStack("test-stack", args)

        # Verify tags are applied
        self.assertIn("CustomTag", stack.default_tags)
        self.assertEqual(stack.default_tags["CustomTag"], "CustomValue")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_kms_key_creation(self):
        """Test KMS key is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify KMS key exists
        self.assertIsNotNone(stack.kms_key)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_s3_artifacts_bucket_creation(self):
        """Test S3 artifacts bucket is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify S3 bucket exists
        self.assertIsNotNone(stack.artifacts_bucket)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_ecr_repository_creation(self):
        """Test ECR repository is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify ECR repository exists
        self.assertIsNotNone(stack.ecr_repository)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_github_secret_creation(self):
        """Test GitHub secret is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify GitHub secret exists
        self.assertIsNotNone(stack.github_secret)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify SNS topic exists
        self.assertIsNotNone(stack.sns_topic)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_iam_roles_creation(self):
        """Test IAM roles are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify IAM roles exist
        self.assertIsNotNone(stack.pipeline_role)
        self.assertIsNotNone(stack.codebuild_role)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_cloudwatch_log_groups_creation(self):
        """Test CloudWatch Log Groups are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify log groups exist
        self.assertIsNotNone(stack.build_log_group)
        self.assertIsNotNone(stack.unit_test_log_group)
        self.assertIsNotNone(stack.integration_test_log_group)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_codebuild_projects_creation(self):
        """Test CodeBuild projects are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify CodeBuild projects exist
        self.assertIsNotNone(stack.build_project)
        self.assertIsNotNone(stack.unit_test_project)
        self.assertIsNotNone(stack.integration_test_project)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_codepipeline_creation(self):
        """Test CodePipeline is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify pipeline exists
        self.assertIsNotNone(stack.pipeline)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_cloudwatch_event_rule_creation(self):
        """Test CloudWatch Event Rule is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify event rule exists
        self.assertIsNotNone(stack.pipeline_event_rule)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_create_infrastructure_function(self):
        """Test create_infrastructure helper function."""
        from lib.tap_stack import create_infrastructure

        stack = create_infrastructure("test")

        # Verify stack is created with correct environment
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'dev',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_get_env_function(self):
        """Test get_env helper function."""
        from lib.tap_stack import get_env

        # Test with existing env var
        result = get_env("ENVIRONMENT_SUFFIX", "fallback")
        self.assertEqual(result, "dev")

        # Test with non-existing env var
        result = get_env("NON_EXISTENT_VAR", "fallback")
        self.assertEqual(result, "fallback")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'prod',
        'AWS_ACCOUNT_ID': '987654321098'
    })
    @pulumi.runtime.test
    def test_different_environment_suffix(self):
        """Test stack creation with different environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="prod")
        stack = TapStack("prod-stack", args)

        # Verify environment suffix is applied
        self.assertEqual(stack.environment_suffix, "prod")
        self.assertEqual(stack.default_tags["Environment"], "prod")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012',
        'REPOSITORY': 'custom-repo',
        'TEAM': 'custom-team'
    })
    @pulumi.runtime.test
    def test_environment_variables_in_tags(self):
        """Test that environment variables are properly included in tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify environment variables are in tags
        self.assertEqual(stack.default_tags["Repository"], "custom-repo")
        self.assertEqual(stack.default_tags["Team"], "custom-team")

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_tap_stack_args_dataclass(self):
        """Test TapStackArgs dataclass."""
        from lib.tap_stack import TapStackArgs

        # Test with just environment_suffix
        args1 = TapStackArgs(environment_suffix="test")
        self.assertEqual(args1.environment_suffix, "test")
        self.assertIsNone(args1.tags)

        # Test with tags
        args2 = TapStackArgs(environment_suffix="test", tags={"Key": "Value"})
        self.assertEqual(args2.environment_suffix, "test")
        self.assertEqual(args2.tags, {"Key": "Value"})

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_default_tags_structure(self):
        """Test default tags structure."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify all required tags are present
        required_tags = ["Environment", "Repository", "Author", "PRNumber", "Team", "Project"]
        for tag in required_tags:
            self.assertIn(tag, stack.default_tags)

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_ACCOUNT_ID': '123456789012'
    })
    @pulumi.runtime.test
    def test_stack_resource_attributes(self):
        """Test that all expected resources are created as stack attributes."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Verify all expected attributes exist
        expected_attributes = [
            'kms_key', 'artifacts_bucket', 'ecr_repository', 'github_secret',
            'sns_topic', 'pipeline_role', 'codebuild_role', 'build_log_group',
            'unit_test_log_group', 'integration_test_log_group', 'build_project',
            'unit_test_project', 'integration_test_project', 'pipeline', 'pipeline_event_rule'
        ]

        for attr in expected_attributes:
            self.assertTrue(hasattr(stack, attr), f"Missing attribute: {attr}")


if __name__ == "__main__":
    unittest.main()
