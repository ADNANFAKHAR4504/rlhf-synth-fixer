"""Integration tests for TapStack."""
import json

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        # Verify basic structure
        assert stack is not None

    def test_complete_infrastructure_synthesis(self):
        """Test complete infrastructure synthesis with all AWS services."""
        app = App()
        stack = TapStack(
            app,
            "StreamFlixInfraTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        # Synthesize the complete stack
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Verify all 7 required AWS services are present
        required_services = [
            "aws_vpc",
            "aws_subnet", 
            "aws_ecs_cluster",
            "aws_rds_cluster",
            "aws_elasticache_replication_group",
            "aws_efs_file_system",
            "aws_kinesis_stream",
            "aws_api_gateway_rest_api",
            "aws_secretsmanager_secret"
        ]

        for service in required_services:
            assert service in resources, f"{service} should exist in synthesized stack"

    def test_multi_az_deployment_configuration(self):
        """Test that resources are properly configured for Multi-AZ deployment."""
        app = App()
        stack = TapStack(
            app,
            "MultiAZTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Verify subnets span multiple AZs
        subnets = resources.get("aws_subnet", {})
        assert len(subnets) >= 4, "Should have at least 4 subnets for Multi-AZ"

        azs = set()
        for subnet_config in subnets.values():
            az = subnet_config.get("availability_zone")
            if az:
                azs.add(az)

        assert len(azs) >= 2, "Subnets should span at least 2 availability zones"
        assert any("eu-west-2a" in az for az in azs), "Should include eu-west-2a"
        assert any("eu-west-2b" in az for az in azs), "Should include eu-west-2b"

    def test_security_and_encryption_configuration(self):
        """Test that security and encryption are properly configured for MPAA compliance."""
        app = App()
        stack = TapStack(
            app,
            "SecurityTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Verify RDS encryption
        rds_clusters = resources.get("aws_rds_cluster", {})
        assert len(rds_clusters) > 0, "RDS cluster should exist"
        for cluster in rds_clusters.values():
            assert cluster.get("storage_encrypted") is True, "RDS should be encrypted at rest"

        # Verify EFS encryption
        efs_filesystems = resources.get("aws_efs_file_system", {})
        assert len(efs_filesystems) > 0, "EFS filesystem should exist"
        for efs in efs_filesystems.values():
            assert efs.get("encrypted") is True, "EFS should be encrypted"

        # Verify Secrets Manager configuration
        secrets = resources.get("aws_secretsmanager_secret", {})
        assert len(secrets) >= 2, "Should have at least 2 secrets (DB and API)"

        # Verify Security Groups exist
        security_groups = resources.get("aws_security_group", {})
        assert len(security_groups) >= 4, "Should have at least 4 security groups"

    def test_auto_scaling_configuration(self):
        """Test that auto-scaling is properly configured for ECS service."""
        app = App()
        stack = TapStack(
            app,
            "AutoScalingTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Verify ECS service exists
        ecs_services = resources.get("aws_ecs_service", {})
        assert len(ecs_services) > 0, "ECS service should exist"

        # Verify auto-scaling target exists
        scaling_targets = resources.get("aws_appautoscaling_target", {})
        assert len(scaling_targets) > 0, "Auto-scaling target should exist"

        for target in scaling_targets.values():
            assert target.get("min_capacity") == 2, "Min capacity should be 2"
            assert target.get("max_capacity") == 20, "Max capacity should be 20"

        # Verify auto-scaling policy exists
        scaling_policies = resources.get("aws_appautoscaling_policy", {})
        assert len(scaling_policies) > 0, "Auto-scaling policy should exist"

    def test_environment_suffix_integration(self):
        """Test that environment suffix is properly applied across all resources."""
        app = App()
        stack = TapStack(
            app,
            "EnvSuffixTest",
            environment_suffix="prod",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Check that environment suffix is included in resource names/tags
        vpc_resources = resources.get("aws_vpc", {})
        for vpc in vpc_resources.values():
            tags = vpc.get("tags", {})
            assert "prod" in tags.get("Name", ""), "VPC should include environment suffix in name"

        # Check ECS cluster naming
        ecs_clusters = resources.get("aws_ecs_cluster", {})
        for cluster in ecs_clusters.values():
            name = cluster.get("name", "")
            assert "prod" in name, "ECS cluster should include environment suffix in name"

    def test_iam_roles_and_policies_configuration(self):
        """Test that IAM roles and policies are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IAMTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)
        resources = manifest.get("resource", {})

        # Verify IAM roles exist
        iam_roles = resources.get("aws_iam_role", {})
        assert len(iam_roles) >= 2, "Should have at least 2 IAM roles (task execution and task role)"

        # Verify IAM policies exist
        iam_policies = resources.get("aws_iam_policy", {})
        assert len(iam_policies) >= 1, "Should have at least 1 IAM policy for ECS tasks"

        # Verify IAM role policy attachments exist
        role_attachments = resources.get("aws_iam_role_policy_attachment", {})
        assert len(role_attachments) >= 2, "Should have IAM role policy attachments"

    def test_regional_configuration_compliance(self):
        """Test that all resources are properly configured for eu-west-2 region."""
        app = App()
        stack = TapStack(
            app,
            "RegionalTest",
            environment_suffix="integration",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Verify provider configuration
        providers = manifest.get("provider", {})
        aws_provider = providers.get("aws", [])
        
        # Check if provider region is properly set
        if aws_provider and len(aws_provider) > 0:
            provider_config = aws_provider[0] if isinstance(aws_provider, list) else aws_provider
            assert provider_config.get("region") == "eu-west-2", "AWS provider should be configured for eu-west-2"

        # Verify subnet AZs are in correct region
        resources = manifest.get("resource", {})
        subnets = resources.get("aws_subnet", {})
        for subnet in subnets.values():
            az = subnet.get("availability_zone", "")
            assert az.startswith("eu-west-2"), f"Subnet AZ should be in eu-west-2 region, got {az}"

