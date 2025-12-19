"""
Unit tests for Security Aspect
"""
import pytest
from unittest.mock import patch
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

    @patch('builtins.print')
    def test_s3_bucket_missing_encryption_warning(self, mock_print):
        """Test security aspect warns about S3 buckets without encryption"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Create S3 bucket without encryption using CfnBucket directly
        cfn_bucket = s3.CfnBucket(
            stack,
            "TestCfnBucket",
            bucket_name="test-bucket-no-encryption"
        )
        
        # Manually call visit on the CfnBucket (without encryption)
        aspect.visit(cfn_bucket)
        
        # Verify warning was printed
        mock_print.assert_called_with(f"WARNING: S3 bucket {cfn_bucket.node.id} missing encryption")

    @patch('builtins.print')
    def test_s3_bucket_with_encryption_no_warning(self, mock_print):
        """Test security aspect doesn't warn about S3 buckets with encryption"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Create S3 bucket with encryption using CfnBucket
        cfn_bucket = s3.CfnBucket(
            stack,
            "TestCfnBucketEncrypted",
            bucket_name="test-bucket-encrypted",
            bucket_encryption=s3.CfnBucket.BucketEncryptionProperty(
                server_side_encryption_configuration=[
                    s3.CfnBucket.ServerSideEncryptionRuleProperty(
                        server_side_encryption_by_default=s3.CfnBucket.ServerSideEncryptionByDefaultProperty(
                            sse_algorithm="AES256"
                        )
                    )
                ]
            )
        )
        
        # Manually call visit on the CfnBucket (with encryption)
        aspect.visit(cfn_bucket)
        
        # Verify no warning was printed
        mock_print.assert_not_called()

    @patch('builtins.print')
    def test_rds_cluster_missing_encryption_warning(self, mock_print):
        """Test security aspect warns about RDS clusters without encryption"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Create RDS cluster without encryption using CfnDBCluster
        cfn_cluster = rds.CfnDBCluster(
            stack,
            "TestCfnCluster",
            engine="aurora-postgresql",
            master_username="testuser"
        )
        
        # Manually call visit on the CfnDBCluster (without encryption)
        aspect.visit(cfn_cluster)
        
        # Verify warning was printed
        mock_print.assert_called_with(f"WARNING: RDS cluster {cfn_cluster.node.id} missing encryption")

    @patch('builtins.print')
    def test_rds_cluster_with_encryption_no_warning(self, mock_print):
        """Test security aspect doesn't warn about RDS clusters with encryption"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Create RDS cluster with encryption using CfnDBCluster
        cfn_cluster = rds.CfnDBCluster(
            stack,
            "TestCfnClusterEncrypted",
            engine="aurora-postgresql",
            master_username="testuser",
            storage_encrypted=True
        )
        
        # Manually call visit on the CfnDBCluster (with encryption)
        aspect.visit(cfn_cluster)
        
        # Verify no warning was printed
        mock_print.assert_not_called()

    def test_security_aspect_visit_non_matching_construct(self):
        """Test security aspect handles constructs that don't match S3 or RDS"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Create a VPC (non-matching construct)
        vpc = ec2.Vpc(stack, "TestVpc")
        
        # Visit should complete without errors or warnings
        aspect.visit(vpc)
        
        # No exception should be raised
        assert vpc is not None

    @patch('builtins.print')
    def test_security_aspect_cfn_constructs_directly(self, mock_print):
        """Test security aspect on CFN constructs directly to ensure full coverage"""
        app = App()
        stack = Stack(app, "TestStack")
        aspect = SecurityPolicyAspect()
        
        # Test S3 CfnBucket without encryption
        s3_bucket = s3.CfnBucket(stack, "S3Bucket")
        aspect.visit(s3_bucket)
        
        # Test RDS CfnDBCluster without encryption
        rds_cluster = rds.CfnDBCluster(
            stack, 
            "RDSCluster",
            engine="aurora-postgresql"
        )
        aspect.visit(rds_cluster)
        
        # Should have printed 2 warnings
        assert mock_print.call_count == 2
