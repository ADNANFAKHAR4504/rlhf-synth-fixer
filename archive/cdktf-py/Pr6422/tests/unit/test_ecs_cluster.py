"""Unit tests for ECS Cluster Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.ecs_cluster import EcsClusterStack  # noqa: E402


class TestEcsClusterStack:
    """Test suite for ECS Cluster Stack."""

    def test_ecs_cluster_stack_instantiates_successfully(self):
        """ECS cluster stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = EcsClusterStack(
            parent_stack,
            "test_cluster",
            environment_suffix="test",
        )

        assert stack is not None
        assert hasattr(stack, 'cluster')

    def test_ecs_cluster_stack_creates_cluster(self):
        """ECS cluster stack creates ECS cluster."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = EcsClusterStack(
            parent_stack,
            "test_cluster",
            environment_suffix="test",
        )

        assert stack.cluster is not None
        assert hasattr(stack.cluster, 'name')
        assert hasattr(stack.cluster, 'id')

    def test_ecs_cluster_stack_exports_cluster_id(self):
        """ECS cluster stack exports cluster ID."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = EcsClusterStack(
            parent_stack,
            "test_cluster",
            environment_suffix="test",
        )

        cluster_id = stack.cluster_id
        assert cluster_id is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(cluster_id, str)

    def test_ecs_cluster_stack_exports_cluster_name(self):
        """ECS cluster stack exports cluster name."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = EcsClusterStack(
            parent_stack,
            "test_cluster",
            environment_suffix="test",
        )

        cluster_name = stack.cluster_name
        assert cluster_name is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(cluster_name, str)

    def test_ecs_cluster_stack_with_different_suffix(self):
        """ECS cluster stack works with different environment suffix."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = EcsClusterStack(
            parent_stack,
            "test_cluster",
            environment_suffix="staging",
        )

        assert stack is not None
        assert stack.cluster is not None
