"""
Unit tests for StorageStack.
Tests S3 bucket configuration and cross-region replication.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.storage_stack import StorageStack


@mark.describe("StorageStack")
class TestStorageStack(unittest.TestCase):
    """Test cases for the StorageStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates S3 bucket with versioning")
    def test_bucket_creation(self):
        """Test that S3 bucket is created with versioning enabled."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify bucket exists
        template.resource_count_is("AWS::S3::Bucket", 1)

        # Verify versioning is enabled
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            }
        )

    @mark.it("uses S3-managed encryption")
    def test_bucket_encryption(self):
        """Test that S3 bucket uses encryption."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify encryption is configured
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": Match.object_like({
                    "ServerSideEncryptionConfiguration": Match.any_value()
                })
            }
        )

    @mark.it("blocks all public access")
    def test_bucket_public_access_block(self):
        """Test that bucket blocks all public access."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify public access is blocked
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                }
            }
        )

    @mark.it("configures lifecycle rule for Glacier transition")
    def test_lifecycle_rules(self):
        """Test that lifecycle rule transitions to Glacier."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify lifecycle rule exists
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "LifecycleConfiguration": Match.object_like({
                    "Rules": Match.array_with([
                        Match.object_like({
                            "Transitions": Match.array_with([
                                Match.object_like({
                                    "StorageClass": "GLACIER",
                                    "TransitionInDays": 90
                                })
                            ])
                        })
                    ])
                })
            }
        )

    @mark.it("exports bucket ARN")
    def test_bucket_arn_output(self):
        """Test that bucket ARN is exported."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify bucket ARN is exported
        outputs = template.to_json().get('Outputs', {})
        assert 'BucketArn' in outputs

    @mark.it("exports bucket name")
    def test_bucket_name_output(self):
        """Test that bucket name is exported."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify bucket name is exported
        outputs = template.to_json().get('Outputs', {})
        assert 'BucketName' in outputs

    @mark.it("tags bucket with DR role")
    def test_bucket_tags(self):
        """Test that bucket is tagged with DR role."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify DR-Role tag
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "Tags": Match.array_with([
                    {"Key": "DR-Role", "Value": "primary"}
                ])
            }
        )

    @mark.it("creates replication role in primary when destination provided")
    def test_replication_role(self):
        """Test that replication role is created in primary."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True,
            destination_bucket_arn="arn:aws:s3:::destination-bucket"
        )

        template = Template.from_stack(stack)

        # Verify IAM role for replication exists
        template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("does not create replication in secondary")
    def test_no_replication_secondary(self):
        """Test that replication is not configured in secondary."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="secondary",
            is_primary=False
        )

        template = Template.from_stack(stack)

        # Verify no replication role
        template.resource_count_is("AWS::IAM::Role", 0)

    @mark.it("configures auto-delete for cleanup")
    def test_auto_delete_objects(self):
        """Test that auto-delete is configured for easy cleanup."""
        stack = StorageStack(
            self.app,
            "TestStorageStack",
            environment_suffix="test",
            dr_role="primary",
            is_primary=True
        )

        template = Template.from_stack(stack)

        # Verify custom resource for auto-delete exists
        resources = template.to_json().get('Resources', {})
        auto_delete_resources = [
            k for k, v in resources.items()
            if v.get('Type') == 'Custom::S3AutoDeleteObjects'
        ]
        assert len(auto_delete_resources) > 0
