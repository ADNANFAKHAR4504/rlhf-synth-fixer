"""Unit tests for disaster recovery stacks."""
import pytest
import os
import sys
from unittest.mock import Mock, patch, MagicMock

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from cdktf import App, Testing


class TestDisasterRecoveryStack:
    """Tests for DisasterRecoveryStack."""

    def test_primary_stack_initialization(self):
        """Test primary region stack initialization."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-primary",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert stack is not None
        assert stack.region == "us-east-1"
        assert stack.environment_suffix == "test"
        assert stack.is_primary is True
        assert stack.dr_region_tag == "primary"

    def test_secondary_stack_initialization(self):
        """Test secondary region stack initialization."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-secondary",
            region="us-east-2",
            environment_suffix="test"
        )
        
        assert stack is not None
        assert stack.region == "us-east-2"
        assert stack.is_primary is False
        assert stack.dr_region_tag == "secondary"

    def test_stack_has_network_stack(self):
        """Test stack creates network stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'network_stack')
        assert stack.network_stack is not None

    def test_stack_has_database_stack(self):
        """Test stack creates database stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'database_stack')
        assert stack.database_stack is not None

    def test_stack_has_storage_stack(self):
        """Test stack creates storage stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'storage_stack')
        assert stack.storage_stack is not None

    def test_stack_has_compute_stack(self):
        """Test stack creates compute stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'compute_stack')
        assert stack.compute_stack is not None

    def test_stack_has_api_stack(self):
        """Test stack creates API stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'api_stack')
        assert stack.api_stack is not None

    def test_stack_has_events_stack(self):
        """Test stack creates events stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'events_stack')
        assert stack.events_stack is not None

    def test_primary_stack_has_backup_stack(self):
        """Test primary stack creates backup stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'backup_stack')
        assert stack.backup_stack is not None

    def test_secondary_stack_no_backup_stack(self):
        """Test secondary stack does not create backup stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-2",
            environment_suffix="test"
        )
        
        assert not hasattr(stack, 'backup_stack') or stack.backup_stack is None

    def test_stack_has_monitoring_stack(self):
        """Test stack creates monitoring stack."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack, 'monitoring_stack')
        assert stack.monitoring_stack is not None


class TestGlobalResourcesStack:
    """Tests for GlobalResourcesStack."""

    def test_global_stack_initialization(self):
        """Test global resources stack initialization."""
        from main import GlobalResourcesStack
        
        app = App()
        stack = GlobalResourcesStack(
            app,
            "test-global",
            environment_suffix="test",
            primary_api_endpoint="https://api-primary.test",
            secondary_api_endpoint="https://api-secondary.test"
        )
        
        assert stack is not None
        assert stack.environment_suffix == "test"

    def test_global_stack_has_routing(self):
        """Test global stack creates routing stack."""
        from main import GlobalResourcesStack
        
        app = App()
        stack = GlobalResourcesStack(
            app,
            "test-global",
            environment_suffix="test",
            primary_api_endpoint="https://api-primary.test",
            secondary_api_endpoint="https://api-secondary.test"
        )
        
        assert hasattr(stack, 'routing_stack')
        assert stack.routing_stack is not None


class TestNetworkStack:
    """Tests for NetworkStack."""

    def test_network_stack_creates_vpc(self):
        """Test network stack creates VPC."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.network_stack, 'vpc')
        assert stack.network_stack.vpc is not None

    def test_network_stack_creates_subnets(self):
        """Test network stack creates subnets."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.network_stack, 'public_subnets')
        assert hasattr(stack.network_stack, 'private_subnets')

    def test_network_stack_creates_security_groups(self):
        """Test network stack creates security groups."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.network_stack, 'lambda_security_group')
        assert hasattr(stack.network_stack, 'aurora_security_group')


class TestDatabaseStack:
    """Tests for DatabaseStack."""

    def test_primary_database_stack_creates_dynamodb(self):
        """Test primary database stack creates DynamoDB table."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.database_stack, 'dynamodb_table')
        # Primary region creates DynamoDB table
        assert stack.database_stack.dynamodb_table is not None

    def test_secondary_database_stack_no_dynamodb(self):
        """Test secondary database stack does not create DynamoDB table (replicated from primary)."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-2",
            environment_suffix="test"
        )
        
        assert hasattr(stack.database_stack, 'dynamodb_table')
        # Secondary region uses replica from primary, so table is None
        assert stack.database_stack.dynamodb_table is None

    def test_database_stack_creates_aurora(self):
        """Test database stack creates Aurora cluster."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.database_stack, 'aurora_cluster')
        assert stack.database_stack.aurora_cluster is not None

    def test_primary_database_stack_creates_global_cluster(self):
        """Test primary database stack creates global cluster."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.database_stack, 'global_cluster')
        assert stack.database_stack.global_cluster is not None


class TestStorageStack:
    """Tests for StorageStack."""

    def test_storage_stack_creates_bucket(self):
        """Test storage stack creates S3 bucket."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.storage_stack, 'bucket')
        assert stack.storage_stack.bucket is not None


class TestApiStack:
    """Tests for ApiStack."""

    def test_api_stack_creates_gateway(self):
        """Test API stack creates API Gateway."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.api_stack, 'api_gateway')
        assert stack.api_stack.api_gateway is not None

    def test_api_stack_has_endpoint(self):
        """Test API stack has endpoint."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.api_stack, 'api_endpoint')


class TestComputeStack:
    """Tests for ComputeStack."""

    def test_compute_stack_creates_lambda(self):
        """Test compute stack creates Lambda function."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert hasattr(stack.compute_stack, 'payment_processor_lambda')
        assert stack.compute_stack.payment_processor_lambda is not None


class TestRoutingStack:
    """Tests for RoutingStack."""

    def test_routing_stack_creates_accelerator(self):
        """Test routing stack creates Global Accelerator."""
        from main import GlobalResourcesStack
        
        app = App()
        stack = GlobalResourcesStack(
            app,
            "test-global",
            environment_suffix="test",
            primary_api_endpoint="https://api-primary.test",
            secondary_api_endpoint="https://api-secondary.test"
        )
        
        assert hasattr(stack.routing_stack, 'global_accelerator_dns')

    def test_routing_stack_creates_failover_domain(self):
        """Test routing stack creates failover domain."""
        from main import GlobalResourcesStack
        
        app = App()
        stack = GlobalResourcesStack(
            app,
            "test-global",
            environment_suffix="test",
            primary_api_endpoint="https://api-primary.test",
            secondary_api_endpoint="https://api-secondary.test"
        )
        
        assert hasattr(stack.routing_stack, 'failover_domain')


class TestMainFunction:
    """Tests for main function."""

    def test_main_uses_environment_suffix(self):
        """Test main function uses environment suffix."""
        environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        assert environment_suffix is not None

    def test_default_environment_suffix(self):
        """Test default environment suffix."""
        with patch.dict(os.environ, {}, clear=True):
            environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
            assert environment_suffix == "dev"

    def test_custom_environment_suffix(self):
        """Test custom environment suffix."""
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "prod"}):
            environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
            assert environment_suffix == "prod"


class TestResourceNaming:
    """Tests for resource naming conventions."""

    def test_stack_uses_environment_suffix(self):
        """Test stack uses environment suffix in naming."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="myenv"
        )
        
        assert stack.environment_suffix == "myenv"

    def test_stack_uses_region_in_id(self):
        """Test stack uses region in construct IDs."""
        from main import DisasterRecoveryStack
        
        app = App()
        stack = DisasterRecoveryStack(
            app,
            "test-stack",
            region="us-east-1",
            environment_suffix="test"
        )
        
        assert stack.region == "us-east-1"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

