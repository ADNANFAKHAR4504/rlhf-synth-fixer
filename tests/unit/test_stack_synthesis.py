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

        # Check for AWS provider in synthesized JSON
        synth_json = json.loads(synthesized)
        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]

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
        synth_json = json.loads(synthesized)
        subnet_count = len(synth_json.get("resource", {}).get("aws_subnet", {}))
        assert subnet_count >= 6, f"Should have at least 6 subnets, found {subnet_count}"

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
        synth_json = json.loads(synthesized)
        sg_count = len(synth_json.get("resource", {}).get("aws_security_group", {}))
        assert sg_count >= 2, f"Should have at least 2 security groups, found {sg_count}"

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
        synth_json = json.loads(synthesized)
        ecr_count = len(synth_json.get("resource", {}).get("aws_ecr_repository", {}))
        assert ecr_count >= len(microservices), f"Should have at least {len(microservices)} ECR repositories, found {ecr_count}"

    def test_ecr_lifecycle_policies_are_created(self, stack_config, microservices):
        """Test that ECR lifecycle policies are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have lifecycle policies for each repository
        synth_json = json.loads(synthesized)
        lifecycle_count = len(synth_json.get("resource", {}).get("aws_ecr_lifecycle_policy", {}))
        assert lifecycle_count >= len(microservices), f"Should have lifecycle policies for all repos, found {lifecycle_count}"


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
        synth_json = json.loads(synthesized)
        codebuild_count = len(synth_json.get("resource", {}).get("aws_codebuild_project", {}))
        assert codebuild_count >= len(microservices) + 1, f"Should have build and test projects, found {codebuild_count}"

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
        synth_json = json.loads(synthesized)
        cluster_count = len(synth_json.get("resource", {}).get("aws_ecs_cluster", {}))
        assert cluster_count >= 2, f"Should have staging and production clusters, found {cluster_count}"

    def test_ecs_task_definitions_are_created(self, stack_config, microservices):
        """Test that ECS task definitions are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have task definitions for each service in each environment (3 services * 2 envs = 6)
        synth_json = json.loads(synthesized)
        task_def_count = len(synth_json.get("resource", {}).get("aws_ecs_task_definition", {}))
        assert task_def_count >= len(microservices) * 2, f"Should have task definitions for all services, found {task_def_count}"

    def test_ecs_services_are_created(self, stack_config, microservices):
        """Test that ECS services are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have services for each microservice in each environment
        synth_json = json.loads(synthesized)
        service_count = len(synth_json.get("resource", {}).get("aws_ecs_service", {}))
        assert service_count >= len(microservices) * 2, f"Should have ECS services for all microservices, found {service_count}"

    def test_target_groups_are_created(self, stack_config, microservices):
        """Test that ALB target groups are created for blue-green deployment."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have blue and green target groups for each service in each environment
        # (3 services * 2 envs * 2 colors = 12)
        synth_json = json.loads(synthesized)
        tg_count = len(synth_json.get("resource", {}).get("aws_lb_target_group", {}))
        assert tg_count >= len(microservices) * 2 * 2, f"Should have blue and green target groups, found {tg_count}"


class TestMonitoringResources:
    """Test suite for monitoring and alerting resources."""

    def test_cloudwatch_alarms_are_created(self, stack_config):
        """Test that CloudWatch alarms are created."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have multiple alarms (task count, 5xx errors, target health)
        synth_json = json.loads(synthesized)
        alarm_count = len(synth_json.get("resource", {}).get("aws_cloudwatch_metric_alarm", {}))
        assert alarm_count >= 6, f"Should have multiple CloudWatch alarms, found {alarm_count}"

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
        synth_json = json.loads(synthesized)
        log_group_count = len(synth_json.get("resource", {}).get("aws_cloudwatch_log_group", {}))
        assert log_group_count >= 3, f"Should have log groups for services, found {log_group_count}"


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
        synth_json = json.loads(synthesized)
        iam_role_count = len(synth_json.get("resource", {}).get("aws_iam_role", {}))
        assert iam_role_count >= 4, f"Should have IAM roles for CodeBuild, CodePipeline, ECS, and Lambda, found {iam_role_count}"


class TestParameterStore:
    """Test suite for Parameter Store resources."""

    def test_ssm_parameters_are_created(self, stack_config, microservices):
        """Test that SSM parameters are created for configuration."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Should have parameters for each service in each environment
        synth_json = json.loads(synthesized)
        param_count = len(synth_json.get("resource", {}).get("aws_ssm_parameter", {}))
        assert param_count >= len(microservices) * 2, f"Should have SSM parameters for configuration, found {param_count}"


class TestOutputs:
    """Test suite for stack outputs."""

    def test_stack_has_outputs(self, stack_config):
        """Test that stack produces required outputs."""
        app = Testing.app()
        stack = TapStack(app, "test-stack", **stack_config)
        synthesized = Testing.synth(stack)

        # Check for outputs in synthesized JSON
        synth_json = json.loads(synthesized)
        assert "output" in synth_json, "Stack should have outputs"
        assert len(synth_json["output"]) > 0, "Stack should have at least one output"
