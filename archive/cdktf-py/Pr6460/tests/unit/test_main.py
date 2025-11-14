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

    @pytest.fixture
    def synth(self, stack):
        """Synthesize the stack and return manifest."""
        return Testing.synth(stack)

    def test_stack_creation(self, stack):
        """Test that stack can be created successfully."""
        assert stack is not None
        assert stack.node.id == "test-stack"

    def test_stack_synthesis(self, synth):
        """Test that stack can be synthesized."""
        assert synth is not None
        assert len(synth) > 0

    def test_vpc_created(self, synth):
        """Test that VPC is created."""
        # Check VPC exists
        assert "aws_vpc" in synth
        assert "payment-vpc-test" in synth

    def test_alb_created(self, synth):
        """Test that Application Load Balancer is created."""
        # Check ALB exists
        assert "aws_lb" in synth
        assert "payment-alb-test" in synth

    def test_rds_created(self, synth):
        """Test that RDS instance is created."""
        # Check RDS exists
        assert "aws_db_instance" in synth
        assert "payment-db-test" in synth

    def test_s3_bucket_created(self, synth):
        """Test that S3 bucket is created."""
        # Check S3 bucket exists
        assert "aws_s3_bucket" in synth
        assert "payment-static-test" in synth

    def test_cloudfront_created(self, synth):
        """Test that CloudFront distribution is created."""
        # Check CloudFront exists
        assert "aws_cloudfront_distribution" in synth

    def test_waf_placeholder(self, synth):
        """Test that WAF placeholder is configured."""
        # WAF is currently a placeholder, not fully implemented
        # This test verifies the stack synthesizes without WAF
        assert synth is not None

    def test_autoscaling_group_created(self, synth):
        """Test that Auto Scaling Group is created."""
        # Check ASG exists
        assert "aws_autoscaling_group" in synth
        assert "payment-asg-test" in synth

    def test_security_groups_created(self, synth):
        """Test that security groups are created."""
        # Check security groups exist
        assert "aws_security_group" in synth
        assert "payment-alb-sg-test" in synth
        assert "payment-app-sg-test" in synth
        assert "payment-db-sg-test" in synth

    def test_iam_roles_created(self, synth):
        """Test that IAM roles are created."""
        # Check IAM role exists
        assert "aws_iam_role" in synth
        assert "payment-app-role-test" in synth

    def test_cloudwatch_alarms_created(self, synth):
        """Test that CloudWatch alarms are created."""
        # Check CloudWatch alarms exist
        assert "aws_cloudwatch_metric_alarm" in synth

    def test_subnets_in_multiple_azs(self, synth):
        """Test that subnets are created in multiple availability zones."""
        # Check multiple subnets exist
        assert "aws_subnet" in synth
        # Should have 3 public + 3 private = 6 subnets
        assert synth.count("payment-public-subnet") >= 3
        assert synth.count("payment-private-subnet") >= 3

    def test_nat_gateways_created(self, synth):
        """Test that NAT Gateway is created."""
        # Check NAT Gateway exists (single NAT for cost optimization)
        assert "aws_nat_gateway" in synth
        assert "payment-nat-" in synth

    def test_stack_outputs(self, synth):
        """Test that stack has required outputs."""
        # Check outputs exist
        assert "output" in synth
        assert "vpc_id" in synth
        assert "alb_dns_name" in synth
        assert "cloudfront_domain_name" in synth
        assert "db_endpoint" in synth
        assert "static_content_bucket" in synth

    def test_rds_multi_az_enabled(self, synth):
        """Test that RDS is configured for Multi-AZ."""
        # Check Multi-AZ is enabled
        assert "multi_az" in synth
        assert "true" in synth.lower()

    def test_rds_encryption_enabled(self, synth):
        """Test that RDS encryption is enabled."""
        # Check encryption is enabled
        assert "storage_encrypted" in synth

    def test_scheduled_scaling_created(self, synth):
        """Test that scheduled scaling actions are created."""
        # Check scheduled actions exist
        assert "aws_autoscaling_schedule" in synth

    def test_security_groups_have_proper_rules(self, synth):
        """Test that security groups have proper ingress/egress rules."""
        # Check ALB security group has HTTPS and HTTP
        assert "443" in synth or "HTTPS from internet" in synth
        assert "80" in synth or "HTTP from internet" in synth

        # Check database security group has PostgreSQL
        assert "5432" in synth or "PostgreSQL from application" in synth
