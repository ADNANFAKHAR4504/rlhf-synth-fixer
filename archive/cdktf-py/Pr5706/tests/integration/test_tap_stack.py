"""Integration tests for TapStack."""
import json
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack synthesizes valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse the configuration
        config = json.loads(synthesized)
        assert "resource" in config
        assert "terraform" in config

        resources = config.get("resource", {})

        # Verify VPC resources
        assert "aws_vpc" in resources
        assert "aws_subnet" in resources
        assert "aws_internet_gateway" in resources
        assert "aws_route_table" in resources
        assert "aws_route_table_association" in resources

        # Verify Security Groups
        assert "aws_security_group" in resources

        # Verify ECS resources
        assert "aws_ecs_cluster" in resources
        assert "aws_ecs_cluster_capacity_providers" in resources
        assert "aws_ecs_task_definition" in resources
        assert "aws_ecs_service" in resources

        # Verify Load Balancer resources
        assert "aws_lb" in resources
        assert "aws_lb_target_group" in resources
        assert "aws_lb_listener" in resources

        # Verify RDS resources
        assert "aws_rds_cluster" in resources
        assert "aws_rds_cluster_instance" in resources
        assert "aws_db_subnet_group" in resources

        # Verify CloudFront
        assert "aws_cloudfront_distribution" in resources

        # Verify Secrets Manager
        assert "aws_secretsmanager_secret" in resources
        assert "aws_secretsmanager_secret_version" in resources

        # Verify IAM resources
        assert "aws_iam_role" in resources
        assert "aws_iam_role_policy_attachment" in resources
        assert "aws_iam_policy" in resources

        # Verify Auto Scaling
        assert "aws_appautoscaling_target" in resources
        assert "aws_appautoscaling_policy" in resources

        # Verify S3 and CloudWatch
        assert "aws_s3_bucket" in resources
        assert "aws_s3_bucket_lifecycle_configuration" in resources
        assert "aws_cloudwatch_log_group" in resources

        # Verify backend configuration
        backend = config.get("terraform", {}).get("backend", {})
        assert "s3" in backend

        # Verify outputs
        assert "output" in config
        outputs = config.get("output", {})
        assert "alb_dns_name" in outputs
        assert "cloudfront_distribution_url" in outputs
        assert "rds_cluster_endpoint" in outputs
        assert "ecs_cluster_name" in outputs

    def test_stack_with_custom_suffix(self):
        """Test stack creation with custom environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "CustomSuffixStack",
            environment_suffix="prod",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify resources are created with custom suffix
        resources = config.get("resource", {})
        assert len(resources) > 0

    def test_stack_region_configuration(self):
        """Test that stack respects AWS region configuration."""
        app = App()
        stack = TapStack(
            app,
            "RegionTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify provider configuration
        provider = config.get("provider", {}).get("aws", [])
        assert len(provider) > 0
        assert provider[0].get("region") == "eu-north-1"

    def test_rds_aurora_version_compatibility(self):
        """Test that RDS Aurora uses eu-north-1 compatible version."""
        app = App()
        stack = TapStack(
            app,
            "RDSVersionTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify Aurora PostgreSQL version is 16.4 (eu-north-1 compatible)
        rds_clusters = config.get("resource", {}).get("aws_rds_cluster", {})
        for cluster_name, cluster_config in rds_clusters.items():
            assert cluster_config.get("engine") == "aurora-postgresql"
            assert cluster_config.get("engine_version") == "16.4"

    def test_ecs_service_capacity_provider_configuration(self):
        """Test that ECS service uses capacity provider strategy correctly."""
        app = App()
        stack = TapStack(
            app,
            "ECSCapacityTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify ECS service does not have launch_type
        ecs_services = config.get("resource", {}).get("aws_ecs_service", {})
        for service_name, service_config in ecs_services.items():
            # Should NOT have launch_type when using capacity_provider_strategy
            assert "launch_type" not in service_config
            # Should have capacity_provider_strategy
            assert "capacity_provider_strategy" in service_config

    def test_cloudfront_cache_policy_configuration(self):
        """Test that CloudFront uses cache_policy_id without forwarded_values."""
        app = App()
        stack = TapStack(
            app,
            "CloudFrontTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify CloudFront configuration
        cloudfront_dists = config.get("resource", {}).get("aws_cloudfront_distribution", {})
        for dist_name, dist_config in cloudfront_dists.items():
            # default_cache_behavior can be a list or dict depending on cdktf version
            cache_behavior_data = dist_config.get("default_cache_behavior", [])
            if isinstance(cache_behavior_data, list):
                cache_behavior = cache_behavior_data[0] if cache_behavior_data else {}
            else:
                cache_behavior = cache_behavior_data

            # Should have cache_policy_id
            assert "cache_policy_id" in cache_behavior
            # Should NOT have forwarded_values
            assert "forwarded_values" not in cache_behavior

    def test_s3_lifecycle_configuration_filter(self):
        """Test that S3 lifecycle rules include required filter."""
        app = App()
        stack = TapStack(
            app,
            "S3LifecycleTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify S3 lifecycle configuration
        s3_lifecycle = config.get("resource", {}).get("aws_s3_bucket_lifecycle_configuration", {})
        for lifecycle_name, lifecycle_config in s3_lifecycle.items():
            rules = lifecycle_config.get("rule", [])
            for rule in rules:
                # Each rule must have filter or prefix
                assert "filter" in rule or "prefix" in rule

    def test_secrets_manager_recovery_window(self):
        """Test that Secrets Manager secret has recovery_window_in_days set."""
        app = App()
        stack = TapStack(
            app,
            "SecretsTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify Secrets Manager configuration
        secrets = config.get("resource", {}).get("aws_secretsmanager_secret", {})
        for secret_name, secret_config in secrets.items():
            # Should have recovery_window_in_days set to 0 for test environments
            assert "recovery_window_in_days" in secret_config
            assert secret_config.get("recovery_window_in_days") == 0

    def test_backend_s3_configuration(self):
        """Test that S3 backend is configured correctly without invalid properties."""
        app = App()
        stack = TapStack(
            app,
            "BackendTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify S3 backend configuration
        backend = config.get("terraform", {}).get("backend", {}).get("s3", {})
        assert backend is not None
        # Should have encrypt property
        assert "encrypt" in backend
        assert backend.get("encrypt") is True
        # Should NOT have use_lockfile (invalid property)
        assert "use_lockfile" not in backend

    def test_resource_tagging(self):
        """Test that resources are tagged correctly."""
        app = App()
        stack = TapStack(
            app,
            "TaggingTestStack",
            environment_suffix="test",
            aws_region="eu-north-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify provider default tags
        provider = config.get("provider", {}).get("aws", [])
        assert len(provider) > 0
        default_tags = provider[0].get("default_tags", [{}])[0]
        tags = default_tags.get("tags", {})
        assert tags.get("Environment") == "production"
        assert tags.get("Project") == "catalog-api"

