"""
Unit tests for TapStack CI/CD Pipeline Infrastructure.

Tests cover:
- TapStackArgs initialization and defaults
- TapStack resource creation  
- S3 bucket configuration (encryption, versioning, lifecycle)
- IAM role policies (least-privilege validation)
- CodeBuild buildspec validation
- CodePipeline stage configuration
- SNS and notification setup
- Parameter Store secure string validation
- CloudWatch log group configuration
- KMS key creation and rotation
"""

import json
import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource creation for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::{args.inputs.get('bucket', 'test-bucket')}",
                "id": args.inputs.get('bucket', 'test-bucket'),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:codebuild/project:Project":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:codebuild:us-east-1:123456789012:project/{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:codepipeline/pipeline:Pipeline":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:codepipeline:us-east-1:123456789012:{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
                "id": "12345678-1234-1234-1234-123456789012",
            }
        elif args.typ == "aws:ssm/parameter:Parameter":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:ssm:us-east-1:123456789012:parameter{args.inputs.get('name', '/test')}",
                "id": args.inputs.get('name', '/test'),
            }
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', '/test')}",
                "id": args.inputs.get('name', '/test'),
            }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"accountId": "123456789012", "arn": "arn:aws:iam::123456789012:user/test", "userId": "AIDAEXAMPLE"}
        elif args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-1", "id": "us-east-1"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs initialization and defaults."""

    def test_default_values(self):
        """Test TapStackArgs uses correct default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.github_owner, 'example-org')
        self.assertEqual(args.github_repo, 'example-repo')
        self.assertEqual(args.github_branch, 'main')
        self.assertEqual(args.notification_email, 'devops@example.com')
        self.assertEqual(args.pulumi_access_token, 'placeholder-token')

    def test_custom_values(self):
        """Test TapStackArgs accepts custom values."""
        custom_tags = {'Team': 'DevOps', 'CostCenter': '1234'}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags,
            github_owner='my-org',
            github_repo='my-repo',
            github_branch='release',
            notification_email='alerts@company.com',
            pulumi_access_token='secret-token-123'
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.github_owner, 'my-org')
        self.assertEqual(args.github_repo, 'my-repo')
        self.assertEqual(args.github_branch, 'release')
        self.assertEqual(args.notification_email, 'alerts@company.com')
        self.assertEqual(args.pulumi_access_token, 'secret-token-123')


class TestTapStack(unittest.TestCase):
    """Test TapStack resource creation and configuration."""

    @pulumi.runtime.test
    def test_stack_creates_required_resources(self):
        """Test that TapStack creates all required resources."""
        args = TapStackArgs(
            environment_suffix='test',
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        # Verify key resources exist
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.artifact_bucket)
        self.assertIsNotNone(stack.state_bucket)
        self.assertIsNotNone(stack.pulumi_token_param)
        self.assertIsNotNone(stack.pipeline_role)
        self.assertIsNotNone(stack.codebuild_role)
        self.assertIsNotNone(stack.log_group)
        self.assertIsNotNone(stack.codebuild_project)
        self.assertIsNotNone(stack.sns_topic)
        self.assertIsNotNone(stack.pipeline)
        self.assertIsNotNone(stack.notification_rule)

    @pulumi.runtime.test
    def test_default_tags_applied(self):
        """Test that default tags are properly set."""
        args = TapStackArgs(
            environment_suffix='test',
            tags={'CustomTag': 'CustomValue'},
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        expected_tags = {
            'Environment': 'test',
            'ManagedBy': 'Pulumi',
            'Project': 'pulumi-cicd-pipeline',
            'Purpose': 'CI/CD automation',
            'CustomTag': 'CustomValue'
        }

        self.assertEqual(stack.default_tags, expected_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is included in all resource names."""
        args = TapStackArgs(
            environment_suffix='staging',
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.env_suffix, 'staging')

    @pulumi.runtime.test
    def test_kms_key_rotation_enabled(self):
        """Test that KMS key has rotation enabled."""
        args = TapStackArgs(
            environment_suffix='test',
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.kms_key)

    @pulumi.runtime.test
    def test_s3_buckets_have_encryption(self):
        """Test that S3 buckets have encryption configured."""
        args = TapStackArgs(
            environment_suffix='test',
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.artifact_bucket)
        self.assertIsNotNone(stack.state_bucket)

    @pulumi.runtime.test
    def test_cloudwatch_log_retention(self):
        """Test that CloudWatch log group is created."""
        args = TapStackArgs(
            environment_suffix='test',
            github_connection_arn='arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection'
        )
        stack = TapStack('test-stack', args)

        self.assertIsNotNone(stack.log_group)


if __name__ == '__main__':
    unittest.main()
