"""Unit tests for PipelineStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.pipeline_stack import PipelineStack


@mark.describe("PipelineStack")
class TestPipelineStack(unittest.TestCase):
    """Test cases for the PipelineStack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App(context={
            "approvalEmail": "test@example.com",
            "codeStarConnectionArn": "arn:aws:codestar-connections:us-east-1:123456789012:connection/test"
        })
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates artifact S3 bucket")
    def test_creates_artifact_bucket(self):
        """Test that artifact S3 bucket is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "BucketName": "cicd-artifacts-test"
            })
        )

    @mark.it("creates cache S3 bucket")
    def test_creates_cache_bucket(self):
        """Test that cache S3 bucket is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "BucketName": "build-cache-test"
            })
        )

    @mark.it("creates SNS topic for approvals")
    def test_creates_approval_topic(self):
        """Test that SNS topic for approvals is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::SNS::Topic",
            Match.object_like({
                "DisplayName": "Pipeline Approval Notifications"
            })
        )

    @mark.it("creates SNS topic for failures")
    def test_creates_failure_topic(self):
        """Test that SNS topic for failures is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::SNS::Topic",
            Match.object_like({
                "DisplayName": "Pipeline Failure Notifications"
            })
        )

    @mark.it("creates ECR repository")
    def test_creates_ecr_repository(self):
        """Test that ECR repository is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::ECR::Repository",
            Match.object_like({
                "RepositoryName": "build-image-test"
            })
        )

    @mark.it("creates build CodeBuild project")
    def test_creates_build_project(self):
        """Test that build CodeBuild project is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::CodeBuild::Project",
            Match.object_like({
                "Name": "app-build-test"
            })
        )

    @mark.it("creates test CodeBuild project")
    def test_creates_test_project(self):
        """Test that test CodeBuild project is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::CodeBuild::Project",
            Match.object_like({
                "Name": "app-test-test"
            })
        )

    @mark.it("creates CodePipeline")
    def test_creates_pipeline(self):
        """Test that CodePipeline is created"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::CodePipeline::Pipeline",
            Match.object_like({
                "Name": "cicd-pipeline-test"
            })
        )

    @mark.it("configures bucket versioning")
    def test_configures_bucket_versioning(self):
        """Test that S3 buckets have versioning enabled"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            })
        )

    @mark.it("configures bucket encryption")
    def test_configures_bucket_encryption(self):
        """Test that S3 buckets have encryption enabled"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.any_value()
                }
            })
        )

    @mark.it("configures SNS email subscription")
    def test_configures_email_subscription(self):
        """Test that SNS topic has email subscription"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::SNS::Subscription",
            Match.object_like({
                "Protocol": "email",
                "Endpoint": "test@example.com"
            })
        )

    @mark.it("configures build cache")
    def test_configures_build_cache(self):
        """Test that build project has cache configuration"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        template.has_resource_properties(
            "AWS::CodeBuild::Project",
            Match.object_like({
                "Cache": {
                    "Type": "S3"
                }
            })
        )

    @mark.it("adds ec2:TerminateInstances deny policy to CodeBuild role")
    def test_codebuild_role_deny_terminate(self):
        """Test that CodeBuild role has explicit deny for ec2:TerminateInstances"""
        pipeline_stack = PipelineStack(
            self.stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        # Verify that at least one IAM policy has deny for ec2:TerminateInstances
        template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Action": "ec2:TerminateInstances"
                        })
                    ])
                })
            })
        )
