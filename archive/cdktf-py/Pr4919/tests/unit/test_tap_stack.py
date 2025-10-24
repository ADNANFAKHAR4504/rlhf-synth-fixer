"""Unit tests for TAP Stack."""
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="eu-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

    def test_synthesized_stack_contains_expected_resources(self):
        """Test that synthesized stack contains all expected AWS resources."""
        app = App()
        stack = TapStack(
            app,
            "TestStackSynth",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)

        # Parse the generated Terraform JSON
        manifest = json.loads(synthesized)

        # Verify that the stack contains expected resource types
        resources = manifest.get("resource", {})

        # Check for VPC
        assert "aws_vpc" in resources, "VPC resource should exist"

        # Check for subnets
        assert "aws_subnet" in resources, "Subnet resources should exist"

        # Check for security groups
        assert "aws_security_group" in resources, "Security group resources should exist"

        # Check for RDS cluster
        assert "aws_rds_cluster" in resources, "RDS cluster should exist"

        # Check for ElastiCache
        assert "aws_elasticache_replication_group" in resources, "ElastiCache replication group should exist"

        # Check for ECS cluster
        assert "aws_ecs_cluster" in resources, "ECS cluster should exist"

        # Check for EFS
        assert "aws_efs_file_system" in resources, "EFS file system should exist"

        # Check for Kinesis stream
        assert "aws_kinesis_stream" in resources, "Kinesis stream should exist"

        # Check for API Gateway
        assert "aws_api_gateway_rest_api" in resources, "API Gateway should exist"

        # Check for Secrets Manager
        assert "aws_secretsmanager_secret" in resources, "Secrets Manager secret should exist"


class TestNetworkingConfiguration:
    """Test suite for networking configuration."""

    def test_vpc_has_correct_cidr(self):
        """Test that VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(
            app,
            "TestVPC",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        vpcs = manifest.get("resource", {}).get("aws_vpc", {})
        assert len(vpcs) > 0, "At least one VPC should be defined"

        # Check first VPC has correct CIDR
        vpc_config = list(vpcs.values())[0]
        assert vpc_config.get("cidr_block") == "10.0.0.0/16"

    def test_multi_az_subnets_created(self):
        """Test that subnets are created in multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnets",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        subnets = manifest.get("resource", {}).get("aws_subnet", {})
        assert len(subnets) >= 4, "Should have at least 4 subnets (2 public, 2 private)"

        # Check that subnets span multiple AZs
        azs = set()
        for subnet_config in subnets.values():
            az = subnet_config.get("availability_zone")
            if az:
                azs.add(az)

        assert len(azs) >= 2, "Subnets should span at least 2 availability zones"


class TestDatabaseConfiguration:
    """Test suite for database configuration."""

    def test_rds_aurora_cluster_configured(self):
        """Test that RDS Aurora cluster is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestRDS",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        clusters = manifest.get("resource", {}).get("aws_rds_cluster", {})
        assert len(clusters) > 0, "RDS cluster should be defined"

        cluster_config = list(clusters.values())[0]
        assert cluster_config.get("engine") == "aurora-postgresql"
        assert cluster_config.get("storage_encrypted") is True


class TestSecurityConfiguration:
    """Test suite for security configuration."""

    def test_secrets_manager_configured(self):
        """Test that Secrets Manager secrets are configured."""
        app = App()
        stack = TapStack(
            app,
            "TestSecrets",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        secrets = manifest.get("resource", {}).get("aws_secretsmanager_secret", {})
        assert len(secrets) >= 1, "Should have at least 1 secret (API)"

    def test_ecs_tasks_have_iam_roles(self):
        """Test that ECS tasks have proper IAM roles."""
        app = App()
        stack = TapStack(
            app,
            "TestIAM",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        roles = manifest.get("resource", {}).get("aws_iam_role", {})
        assert len(roles) >= 2, "Should have at least 2 IAM roles (task execution and task role)"


class TestCacheConfiguration:
    """Test suite for cache configuration."""

    def test_elasticache_redis_configured(self):
        """Test that ElastiCache Redis is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestCache",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        cache = manifest.get("resource", {}).get("aws_elasticache_replication_group", {})
        assert len(cache) > 0, "ElastiCache replication group should be defined"

        cache_config = list(cache.values())[0]
        assert cache_config.get("engine") == "redis"
        assert cache_config.get("num_cache_clusters") >= 2


class TestStorageConfiguration:
    """Test suite for storage configuration."""

    def test_efs_filesystem_configured(self):
        """Test that EFS filesystem is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestEFS",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        efs = manifest.get("resource", {}).get("aws_efs_file_system", {})
        assert len(efs) > 0, "EFS filesystem should be defined"

        efs_config = list(efs.values())[0]
        assert efs_config.get("encrypted") is True


class TestStreamingConfiguration:
    """Test suite for streaming configuration."""

    def test_kinesis_stream_configured(self):
        """Test that Kinesis stream is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestKinesis",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        streams = manifest.get("resource", {}).get("aws_kinesis_stream", {})
        assert len(streams) > 0, "Kinesis stream should be defined"

        stream_config = list(streams.values())[0]
        assert stream_config.get("shard_count") >= 4


class TestAPIConfiguration:
    """Test suite for API configuration."""

    def test_api_gateway_configured(self):
        """Test that API Gateway is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestAPI",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        apis = manifest.get("resource", {}).get("aws_api_gateway_rest_api", {})
        assert len(apis) > 0, "API Gateway should be defined"


class TestComputeConfiguration:
    """Test suite for compute configuration."""

    def test_ecs_cluster_and_service_configured(self):
        """Test that ECS cluster and service are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestECS",
            environment_suffix="test",
            aws_region="eu-west-2",
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        clusters = manifest.get("resource", {}).get("aws_ecs_cluster", {})
        assert len(clusters) > 0, "ECS cluster should be defined"

        services = manifest.get("resource", {}).get("aws_ecs_service", {})
        assert len(services) > 0, "ECS service should be defined"

        service_config = list(services.values())[0]
        assert service_config.get("launch_type") == "FARGATE"


# add more test suites and cases as needed
