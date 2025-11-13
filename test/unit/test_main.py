"""Unit tests for main payment processing stack."""

import pytest
from cdktf import Testing
from lib.main import PaymentProcessingStack


class TestPaymentProcessingStack:
    """Test suite for PaymentProcessingStack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return PaymentProcessingStack(app, "test-stack", environment_suffix="test")

    def test_stack_creation(self, stack):
        """Test that stack can be created successfully."""
        assert stack is not None
        assert stack.node.id == "test-stack"

    def test_stack_synthesis(self, stack):
        """Test that stack can be synthesized."""
        manifest = Testing.synth(stack)
        assert manifest is not None

        # Verify resources are created
        snapshot = Testing.to_hcl(manifest)
        assert snapshot is not None
        assert len(snapshot) > 0

    def test_vpc_created(self, stack):
        """Test that VPC is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check VPC exists
        assert "aws_vpc" in snapshot
        assert "payment-vpc-test" in str(snapshot)

    def test_alb_created(self, stack):
        """Test that Application Load Balancer is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check ALB exists
        assert "aws_lb" in snapshot
        assert "payment-alb-test" in str(snapshot)

    def test_rds_created(self, stack):
        """Test that RDS instance is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check RDS exists
        assert "aws_db_instance" in snapshot
        assert "payment-db-test" in str(snapshot)

    def test_s3_bucket_created(self, stack):
        """Test that S3 bucket is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check S3 bucket exists
        assert "aws_s3_bucket" in snapshot
        assert "payment-static-test" in str(snapshot)

    def test_cloudfront_created(self, stack):
        """Test that CloudFront distribution is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check CloudFront exists
        assert "aws_cloudfront_distribution" in snapshot

    def test_waf_created(self, stack):
        """Test that WAF Web ACL is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check WAF exists
        assert "aws_wafv2_web_acl" in snapshot
        assert "payment-waf-test" in str(snapshot)

    def test_autoscaling_group_created(self, stack):
        """Test that Auto Scaling Group is created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check ASG exists
        assert "aws_autoscaling_group" in snapshot
        assert "payment-asg-test" in str(snapshot)

    def test_security_groups_created(self, stack):
        """Test that security groups are created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check security groups exist
        assert "aws_security_group" in snapshot
        assert "payment-alb-sg-test" in str(snapshot)
        assert "payment-app-sg-test" in str(snapshot)
        assert "payment-db-sg-test" in str(snapshot)

    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check IAM role exists
        assert "aws_iam_role" in snapshot
        assert "payment-app-role-test" in str(snapshot)

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check CloudWatch alarms exist
        assert "aws_cloudwatch_metric_alarm" in snapshot

    def test_subnets_in_multiple_azs(self, stack):
        """Test that subnets are created in multiple availability zones."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check multiple subnets exist
        assert "aws_subnet" in snapshot
        # Should have 3 public + 3 private = 6 subnets
        assert str(snapshot).count("payment-public-subnet") >= 3
        assert str(snapshot).count("payment-private-subnet") >= 3

    def test_nat_gateways_created(self, stack):
        """Test that NAT Gateways are created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check NAT Gateways exist
        assert "aws_nat_gateway" in snapshot
        # Should have 3 NAT Gateways (one per AZ)
        assert str(snapshot).count("payment-nat-") >= 3

    def test_stack_outputs(self, stack):
        """Test that stack has required outputs."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check outputs exist
        assert "output" in snapshot
        assert "vpc_id" in str(snapshot)
        assert "alb_dns_name" in str(snapshot)
        assert "cloudfront_domain_name" in str(snapshot)
        assert "db_endpoint" in str(snapshot)
        assert "static_content_bucket" in str(snapshot)

    def test_rds_multi_az_enabled(self, stack):
        """Test that RDS is configured for Multi-AZ."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check Multi-AZ is enabled
        assert "multi_az" in str(snapshot)
        assert "true" in str(snapshot).lower()

    def test_rds_encryption_enabled(self, stack):
        """Test that RDS encryption is enabled."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check encryption is enabled
        assert "storage_encrypted" in str(snapshot)

    def test_scheduled_scaling_created(self, stack):
        """Test that scheduled scaling actions are created."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check scheduled actions exist
        assert "aws_autoscaling_schedule" in snapshot

    def test_waf_rules_configured(self, stack):
        """Test that WAF rules are properly configured."""
        manifest = Testing.synth(stack)
        snapshot = Testing.to_hcl(manifest)

        # Check WAF managed rule sets
        assert "AWSManagedRulesCommonRuleSet" in str(snapshot)
        assert "AWSManagedRulesKnownBadInputsRuleSet" in str(snapshot)
        assert "AWSManagedRulesSQLiRuleSet" in str(snapshot)
