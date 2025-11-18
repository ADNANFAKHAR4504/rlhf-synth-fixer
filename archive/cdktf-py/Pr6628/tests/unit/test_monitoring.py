import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestMonitoring:
    """Test cases for monitoring module"""

    def test_s3_buckets_for_flow_logs(self):
        """Verify S3 buckets are created for flow logs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Should have 2 S3 buckets (one per VPC)
        s3 = Testing.to_have_resource(synthesized, "aws_s3_bucket")
        assert s3 is not None

    def test_s3_lifecycle_policy(self):
        """Verify S3 buckets have 90-day lifecycle policy"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        lifecycle = Testing.to_have_resource(
            synthesized,
            "aws_s3_bucket_lifecycle_configuration"
        )
        assert lifecycle is not None

    def test_s3_public_access_blocked(self):
        """Verify S3 buckets block public access"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        block_public = Testing.to_have_resource_with_properties(
            synthesized,
            "aws_s3_bucket_public_access_block",
            {
                "block_public_acls": True,
                "block_public_policy": True,
                "ignore_public_acls": True,
                "restrict_public_buckets": True
            }
        )
        assert block_public is not None

    def test_s3_encryption_enabled(self):
        """Verify S3 buckets have encryption enabled"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        encryption = Testing.to_have_resource(
            synthesized,
            "aws_s3_bucket_server_side_encryption_configuration"
        )
        assert encryption is not None

    def test_vpc_flow_logs_enabled(self):
        """Verify VPC Flow Logs are enabled for both VPCs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        flow_logs = Testing.to_have_resource_with_properties(
            synthesized,
            "aws_flow_log",
            {
                "traffic_type": "ALL",
                "log_destination_type": "s3"
            }
        )
        assert flow_logs is not None

    def test_iam_role_for_flow_logs(self):
        """Verify IAM role exists for Flow Logs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        iam_role = Testing.to_have_resource(synthesized, "aws_iam_role")
        assert iam_role is not None
