"""Unit tests for stack synthesis and resource validation."""

import pytest
import json
from cdktf import Testing
from lib.tap_stack import TapStack


class TestStackSynthesis:
    """Test suite for stack synthesis."""

    def test_stack_synthesizes_successfully(self, stack_config):
        """Test that the stack synthesizes without errors."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert synthesized is not None
        assert len(synthesized) > 0

    def test_stack_has_required_providers(self, stack_config):
        """Test that AWS provider is configured."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Check for AWS provider
        assert any("aws" in str(resource).lower() for resource in synthesized)

    def test_stack_has_s3_backend(self, stack_config):
        """Test that S3 backend is configured."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # The backend configuration should be present
        assert "terraform" in json.dumps(synthesized).lower()


class TestVPCResources:
    """Test suite for VPC and networking resources."""

    def test_vpc_is_created(self, stack_config):
        """Test that VPC resource is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Check for VPC resource
        assert Testing.to_have_resource(synthesized, "aws_vpc")

    def test_subnets_are_created(self, stack_config):
        """Test that public and private subnets are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Check for subnet resources (3 public + 3 private = 6 total)
        subnet_count = sum(1 for resource in synthesized if "aws_subnet" in str(resource))
        assert subnet_count >= 6, "Should have at least 6 subnets"

    def test_internet_gateway_is_created(self, stack_config):
        """Test that Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_internet_gateway")

    def test_security_groups_are_created(self, stack_config):
        """Test that security groups for ALB and ECS are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have ALB and ECS security groups
        sg_count = sum(1 for resource in synthesized if "aws_security_group" in str(resource))
        assert sg_count >= 2, "Should have at least 2 security groups"

    def test_alb_is_created(self, stack_config):
        """Test that Application Load Balancer is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_lb")


class TestECRResources:
    """Test suite for ECR resources."""

    def test_ecr_repositories_are_created(self, stack_config, microservices):
        """Test that ECR repositories are created for all microservices."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have 3 ECR repositories
        ecr_count = sum(1 for resource in synthesized if "aws_ecr_repository" in str(resource))
        assert ecr_count >= len(microservices), f"Should have at least {len(microservices)} ECR repositories"

    def test_ecr_lifecycle_policies_are_created(self, stack_config, microservices):
        """Test that ECR lifecycle policies are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have lifecycle policies for each repository
        lifecycle_count = sum(1 for resource in synthesized if "aws_ecr_lifecycle_policy" in str(resource))
        assert lifecycle_count >= len(microservices), "Should have lifecycle policies for all repos"


class TestCodePipelineResources:
    """Test suite for CodePipeline resources."""

    def test_codecommit_repository_is_created(self, stack_config):
        """Test that CodeCommit repository is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_codecommit_repository")

    def test_codebuild_projects_are_created(self, stack_config, microservices):
        """Test that CodeBuild projects are created for all services."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have 3 build projects + 1 test project
        codebuild_count = sum(1 for resource in synthesized if "aws_codebuild_project" in str(resource))
        assert codebuild_count >= len(microservices) + 1, "Should have build and test projects"

    def test_codepipeline_is_created(self, stack_config):
        """Test that CodePipeline is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_codepipeline")

    def test_artifacts_bucket_is_created(self, stack_config):
        """Test that S3 artifacts bucket is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_s3_bucket")


class TestECSResources:
    """Test suite for ECS resources."""

    def test_ecs_clusters_are_created(self, stack_config):
        """Test that staging and production ECS clusters are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have 2 clusters (staging + production)
        cluster_count = sum(1 for resource in synthesized if "aws_ecs_cluster" in str(resource))
        assert cluster_count >= 2, "Should have staging and production clusters"

    def test_ecs_task_definitions_are_created(self, stack_config, microservices):
        """Test that ECS task definitions are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have task definitions for each service in each environment (3 services * 2 envs = 6)
        task_def_count = sum(1 for resource in synthesized if "aws_ecs_task_definition" in str(resource))
        assert task_def_count >= len(microservices) * 2, "Should have task definitions for all services"

    def test_ecs_services_are_created(self, stack_config, microservices):
        """Test that ECS services are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have services for each microservice in each environment
        service_count = sum(1 for resource in synthesized if "aws_ecs_service" in str(resource))
        assert service_count >= len(microservices) * 2, "Should have ECS services for all microservices"

    def test_target_groups_are_created(self, stack_config, microservices):
        """Test that ALB target groups are created for blue-green deployment."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have blue and green target groups for each service in each environment
        # (3 services * 2 envs * 2 colors = 12)
        tg_count = sum(1 for resource in synthesized if "aws_lb_target_group" in str(resource))
        assert tg_count >= len(microservices) * 2 * 2, "Should have blue and green target groups"


class TestMonitoringResources:
    """Test suite for monitoring and alerting resources."""

    def test_cloudwatch_alarms_are_created(self, stack_config):
        """Test that CloudWatch alarms are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have multiple alarms (task count, 5xx errors, target health)
        alarm_count = sum(1 for resource in synthesized if "aws_cloudwatch_metric_alarm" in str(resource))
        assert alarm_count >= 6, "Should have multiple CloudWatch alarms"

    def test_sns_topic_is_created(self, stack_config):
        """Test that SNS topic for notifications is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_sns_topic")

    def test_cloudwatch_log_groups_are_created(self, stack_config):
        """Test that CloudWatch log groups are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have log groups for CodeBuild and ECS
        log_group_count = sum(1 for resource in synthesized if "aws_cloudwatch_log_group" in str(resource))
        assert log_group_count >= 3, "Should have log groups for services"


class TestLambdaResources:
    """Test suite for Lambda resources."""

    def test_lambda_function_is_created(self, stack_config):
        """Test that health check Lambda function is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        assert Testing.to_have_resource(synthesized, "aws_lambda_function")

    def test_lambda_iam_role_is_created(self, stack_config):
        """Test that Lambda execution role is created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have multiple IAM roles including Lambda role
        iam_role_count = sum(1 for resource in synthesized if "aws_iam_role" in str(resource))
        assert iam_role_count >= 4, "Should have IAM roles for CodeBuild, CodePipeline, ECS, and Lambda"


class TestParameterStore:
    """Test suite for Parameter Store resources."""

    def test_ssm_parameters_are_created(self, stack_config, microservices):
        """Test that SSM parameters are created for configuration."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have parameters for each service in each environment
        param_count = sum(1 for resource in synthesized if "aws_ssm_parameter" in str(resource))
        assert param_count >= len(microservices) * 2, "Should have SSM parameters for configuration"


class TestOutputs:
    """Test suite for stack outputs."""

    def test_stack_has_outputs(self, stack_config):
        """Test that stack produces required outputs."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Check for outputs
        outputs_exist = any("output" in str(resource).lower() for resource in synthesized)
        assert outputs_exist, "Stack should have outputs"
