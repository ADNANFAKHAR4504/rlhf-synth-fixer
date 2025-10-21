"""Unit tests for Cache stack."""

import pytest
from cdktf import Testing, TerraformStack
from lib.cache_stack import CacheStack


class TestCacheStack:
    """Test Cache stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        cache_stack = CacheStack(
            stack,
            "test-cache",
            vpc_id="vpc-12345",
            private_subnet_ids=["subnet-1", "subnet-2"],
            cache_security_group_id="sg-12345",
            environment_suffix="test"
        )
        return Testing.synth(stack)

    def test_elasticache_subnet_group_created(self, synth_stack):
        """Test that ElastiCache subnet group is created."""
        subnet_group = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_elasticache_subnet_group",
            {
                "name": "pc-cache-subnet-test",
                "description": "Subnet group for product catalog cache"
            }
        )
        assert subnet_group is not None

    def test_elasticache_replication_group_created(self, synth_stack):
        """Test that ElastiCache replication group is created."""
        cache = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_elasticache_replication_group",
            {
                "replication_group_id": "pc-test",
                "description": "Product catalog cache cluster",
                "engine": "valkey",
                "engine_version": "8.0",
                "node_type": "cache.t3.micro",
                "num_cache_clusters": 1,
                "port": 6379
            }
        )
        assert cache is not None

    def test_stack_properties(self):
        """Test that stack properties are accessible."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        cache_stack = CacheStack(
            stack,
            "test-cache",
            vpc_id="vpc-12345",
            private_subnet_ids=["subnet-1", "subnet-2"],
            cache_security_group_id="sg-12345",
            environment_suffix="test"
        )

        # Test that properties exist
        assert cache_stack.cache_endpoint is not None
