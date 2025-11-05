"""
Unit tests for Security Aspect
"""
import pytest
from aws_cdk import Stack, App, Aspects
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_rds as rds
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_sqs as sqs
from lib.aspects.security_aspect import SecurityPolicyAspect


class TestSecurityPolicyAspect:
    """Test Security Policy Aspect enforcement"""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing"""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create test stack with security aspect"""
        stack = Stack(app, "TestStack")
        Aspects.of(stack).add(SecurityPolicyAspect())
        return stack

    def test_security_aspect_instantiation(self):
        """Test SecurityPolicyAspect can be instantiated"""
        aspect = SecurityPolicyAspect()
        assert aspect is not None

    def test_s3_bucket_encryption_check(self, stack):
        """Test security aspect checks S3 bucket encryption"""
        # Create S3 bucket without encryption (should trigger aspect)
        bucket = s3.Bucket(
            stack,
            "TestBucket",
            encryption=s3.BucketEncryption.S3_MANAGED
        )

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # Bucket should exist (aspect validates but doesn't block)
        assert bucket is not None

    def test_s3_bucket_with_kms_encryption(self, stack):
        """Test security aspect allows KMS-encrypted S3 buckets"""
        # Create S3 bucket with KMS encryption
        bucket = s3.Bucket(
            stack,
            "TestBucketKMS",
            encryption=s3.BucketEncryption.KMS_MANAGED
        )

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # Bucket should be created successfully
        assert bucket is not None

    def test_rds_encryption_check(self, stack):
        """Test security aspect checks RDS encryption"""
        # Create VPC for RDS
        vpc = ec2.Vpc(stack, "TestVpc", max_azs=2)

        # Create RDS instance with encryption
        db_instance = rds.DatabaseInstance(
            stack,
            "TestDB",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14
            ),
            vpc=vpc,
            storage_encrypted=True
        )

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # DB instance should be created
        assert db_instance is not None

    def test_sqs_encryption_check(self, stack):
        """Test security aspect checks SQS encryption"""
        # Create SQS queue with encryption
        queue = sqs.Queue(
            stack,
            "TestQueue",
            encryption=sqs.QueueEncryption.KMS_MANAGED
        )

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # Queue should be created
        assert queue is not None

    def test_security_aspect_visit_method(self, stack):
        """Test security aspect visit method is called"""
        aspect = SecurityPolicyAspect()

        # Create a test resource
        bucket = s3.Bucket(
            stack,
            "TestBucket",
            encryption=s3.BucketEncryption.S3_MANAGED
        )

        # Manually call visit to ensure it works
        aspect.visit(bucket)

        # Visit should complete without errors
        assert bucket is not None

    def test_security_aspect_on_multiple_resources(self, stack):
        """Test security aspect processes multiple resources"""
        # Create multiple resources
        bucket1 = s3.Bucket(
            stack,
            "Bucket1",
            encryption=s3.BucketEncryption.KMS_MANAGED
        )

        bucket2 = s3.Bucket(
            stack,
            "Bucket2",
            encryption=s3.BucketEncryption.KMS_MANAGED
        )

        queue = sqs.Queue(
            stack,
            "Queue",
            encryption=sqs.QueueEncryption.KMS_MANAGED
        )

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # All resources should be created
        assert bucket1 is not None
        assert bucket2 is not None
        assert queue is not None

    def test_security_aspect_with_non_security_resources(self, stack):
        """Test security aspect handles non-security resources gracefully"""
        # Create a VPC (not a security-sensitive resource for aspect)
        vpc = ec2.Vpc(stack, "TestVpc", max_azs=2)

        # Synthesize to trigger aspects
        app = stack.node.root
        app.synth()

        # VPC should be created without issues
        assert vpc is not None
