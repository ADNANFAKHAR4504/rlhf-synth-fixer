"""Unit tests for E-Commerce infrastructure stack."""

import pytest
import json
from cdktf import Testing
from lib.tap_stack import TapStack


class TestECommerceStack:
    """Test cases for E-Commerce infrastructure."""

    @pytest.fixture
    def stack(self):
        """Create a test stack."""
        app = Testing.app()
        return TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={
                "tags": {
                    "Environment": "test",
                    "Project": "ecommerce",
                    "Owner": "test-team"
                }
            }
        )

    def test_stack_creation(self, stack):
        """Test stack can be created."""
        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_created(self, stack):
        """Test VPC is created with correct configuration."""
        synthesized = Testing.synth(stack)
        assert "aws_vpc" in synthesized
        assert "10.0.0.0/16" in synthesized

    def test_subnets_created(self, stack):
        """Test all required subnets are created."""
        synthesized = Testing.synth(stack)
        # Should have 2 public + 4 private = 6 total
        assert synthesized.count("aws_subnet") >= 6

    def test_security_groups_created(self, stack):
        """Test security groups are created."""
        synthesized = Testing.synth(stack)
        # Check for ALB, ECS, and Aurora security groups
        assert synthesized.count("aws_security_group") >= 3
        assert "ecommerce-alb-sg-test" in synthesized
        assert "ecommerce-ecs-sg-test" in synthesized
        assert "ecommerce-aurora-sg-test" in synthesized

    def test_aurora_cluster_created(self, stack):
        """Test Aurora Serverless v2 cluster is created."""
        synthesized = Testing.synth(stack)
        assert "aws_rds_cluster" in synthesized
        assert "aurora-postgresql" in synthesized
        assert "serverlessv2_scaling_configuration" in synthesized
        assert "0.5" in synthesized  # min ACU
        assert "1.0" in synthesized or "1" in synthesized  # max ACU

    def test_secrets_manager_created(self, stack):
        """Test Secrets Manager secret is created."""
        synthesized = Testing.synth(stack)
        assert "aws_secretsmanager_secret" in synthesized
        assert "ecommerce-db-credentials-test" in synthesized

    def test_s3_bucket_created(self, stack):
        """Test S3 bucket for static assets is created."""
        synthesized = Testing.synth(stack)
        assert "aws_s3_bucket" in synthesized
        assert "ecommerce-static-assets-test" in synthesized

    def test_cloudfront_distribution_created(self, stack):
        """Test CloudFront distribution is created."""
        synthesized = Testing.synth(stack)
        assert "aws_cloudfront_distribution" in synthesized
        assert "redirect-to-https" in synthesized

    def test_alb_created(self, stack):
        """Test Application Load Balancer is created."""
        synthesized = Testing.synth(stack)
        assert "aws_lb" in synthesized
        assert "ecommerce-alb-test" in synthesized
        assert "application" in synthesized

    def test_target_groups_created(self, stack):
        """Test target groups for blue/green deployment are created."""
        synthesized = Testing.synth(stack)
        assert "aws_lb_target_group" in synthesized
        assert "ecommerce-tg-blue-test" in synthesized
        assert "ecommerce-tg-green-test" in synthesized

    def test_waf_web_acl_created(self, stack):
        """Test WAF WebACL with rate limiting is created."""
        synthesized = Testing.synth(stack)
        assert "aws_wafv2_web_acl" in synthesized
        assert "ecommerce-waf-test" in synthesized
        assert "RateLimitRule" in synthesized
        assert "2000" in synthesized  # rate limit

    def test_ecs_cluster_created(self, stack):
        """Test ECS cluster is created."""
        synthesized = Testing.synth(stack)
        assert "aws_ecs_cluster" in synthesized
        assert "ecommerce-cluster-test" in synthesized

    def test_ecs_service_created(self, stack):
        """Test ECS service is created with correct configuration."""
        synthesized = Testing.synth(stack)
        assert "aws_ecs_service" in synthesized
        assert "ecommerce-service-test" in synthesized
        assert "FARGATE" in synthesized

    def test_ecs_task_definition_created(self, stack):
        """Test ECS task definition is created."""
        synthesized = Testing.synth(stack)
        assert "aws_ecs_task_definition" in synthesized
        assert "ecommerce-task-test" in synthesized

    def test_autoscaling_configured(self, stack):
        """Test auto-scaling is configured for ECS service."""
        synthesized = Testing.synth(stack)
        assert "aws_appautoscaling_target" in synthesized
        assert "aws_appautoscaling_policy" in synthesized
        assert "70" in synthesized  # CPU threshold

    def test_iam_roles_created(self, stack):
        """Test IAM roles are created for ECS tasks."""
        synthesized = Testing.synth(stack)
        assert "aws_iam_role" in synthesized
        assert synthesized.count("aws_iam_role") >= 3  # execution, task, rotation

    def test_cloudwatch_log_group_created(self, stack):
        """Test CloudWatch log group is created for ECS."""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_log_group" in synthesized
        assert "/ecs/ecommerce-test" in synthesized

    def test_resource_tagging(self, stack):
        """Test all resources have required tags."""
        synthesized = Testing.synth(stack)
        # Check for Environment, Project, Owner tags
        assert synthesized.count("Environment") >= 20
        assert synthesized.count("Project") >= 20
        assert synthesized.count("Owner") >= 20

    def test_environment_suffix_in_names(self, stack):
        """Test resource names include environment suffix."""
        synthesized = Testing.synth(stack)
        assert synthesized.count("-test") >= 30  # Many resources should have suffix

    def test_nat_gateways_created(self, stack):
        """Test NAT gateways are created for high availability."""
        synthesized = Testing.synth(stack)
        assert "aws_nat_gateway" in synthesized
        assert synthesized.count("aws_nat_gateway") >= 2

    def test_https_security(self, stack):
        """Test HTTPS security is configured."""
        synthesized = Testing.synth(stack)
        # ALB should allow port 443
        assert "443" in synthesized
        # CloudFront should redirect to HTTPS
        assert "redirect-to-https" in synthesized

    def test_database_in_private_subnet(self, stack):
        """Test database is in private subnet."""
        synthesized = Testing.synth(stack)
        assert "aws_db_subnet_group" in synthesized
        assert "ecommerce-private-db-subnet" in synthesized

    def test_multi_az_configuration(self, stack):
        """Test multi-AZ configuration is present."""
        synthesized = Testing.synth(stack)
        # Should reference both AZs
        assert "us-east-1a" in synthesized
        assert "us-east-1b" in synthesized


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
