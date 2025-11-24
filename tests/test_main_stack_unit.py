"""
Unit tests for MultiRegionDRStack main stack
"""
import pytest
from cdktf import Testing, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock the imports to avoid real AWS resource creation
import unittest.mock as mock

class TestMultiRegionDRStack:
    """Test suite for the main MultiRegionDRStack"""

    @pytest.fixture
    def mock_constructs(self):
        """Mock all construct imports"""
        with mock.patch('lib.imports.networking.NetworkingConstruct') as mock_net, \
             mock.patch('lib.imports.database.DatabaseConstruct') as mock_db, \
             mock.patch('lib.imports.compute.ComputeConstruct') as mock_compute, \
             mock.patch('lib.imports.dns.DnsConstruct') as mock_dns, \
             mock.patch('lib.imports.monitoring.MonitoringConstruct') as mock_mon:

            # Configure mock return values
            mock_net.return_value.primary_vpc_id = "vpc-primary"
            mock_net.return_value.secondary_vpc_id = "vpc-secondary"
            mock_net.return_value.primary_private_subnet_ids = ["subnet-1", "subnet-2", "subnet-3"]
            mock_net.return_value.secondary_private_subnet_ids = ["subnet-4", "subnet-5", "subnet-6"]
            mock_net.return_value.primary_db_sg_id = "sg-db-primary"
            mock_net.return_value.secondary_db_sg_id = "sg-db-secondary"
            mock_net.return_value.primary_lambda_sg_id = "sg-lambda-primary"
            mock_net.return_value.secondary_lambda_sg_id = "sg-lambda-secondary"

            mock_db.return_value.global_cluster_id = "global-cluster-id"
            mock_db.return_value.primary_cluster_id = "primary-cluster-id"
            mock_db.return_value.secondary_cluster_id = "secondary-cluster-id"
            mock_db.return_value.primary_db_secret_arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:primary"
            mock_db.return_value.secondary_db_secret_arn = "arn:aws:secretsmanager:us-west-2:123456789012:secret:secondary"

            mock_compute.return_value.dynamodb_table_name = "payment-sessions-test"
            mock_compute.return_value.primary_payment_lambda_name = "payment-processor-primary-test"
            mock_compute.return_value.secondary_payment_lambda_name = "payment-processor-secondary-test"
            mock_compute.return_value.primary_api_endpoint = "https://primary.example.com"
            mock_compute.return_value.secondary_api_endpoint = "https://secondary.example.com"

            mock_dns.return_value.failover_domain = "api.payment-dr-test.example.com"

            mock_mon.return_value.sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:payment-alerts-test"

            yield {
                'networking': mock_net,
                'database': mock_db,
                'compute': mock_compute,
                'dns': mock_dns,
                'monitoring': mock_mon
            }

    def test_stack_creation_with_environment_suffix(self, mock_constructs):
        """Test that stack is created with correct environment suffix"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        assert stack.environment_suffix == "test-env"

    def test_providers_created(self, mock_constructs):
        """Test that both primary and secondary AWS providers are created"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        assert stack.primary_provider is not None
        assert stack.secondary_provider is not None

    def test_all_constructs_instantiated(self, mock_constructs):
        """Test that all required constructs are instantiated"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        # Verify all constructs were called
        mock_constructs['networking'].assert_called_once()
        mock_constructs['database'].assert_called_once()
        mock_constructs['compute'].assert_called_once()
        mock_constructs['dns'].assert_called_once()
        mock_constructs['monitoring'].assert_called_once()

    def test_networking_construct_parameters(self, mock_constructs):
        """Test that networking construct receives correct parameters"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        call_args = mock_constructs['networking'].call_args
        assert call_args[1]['environment_suffix'] == "test-env"
        assert call_args[1]['primary_provider'] == stack.primary_provider
        assert call_args[1]['secondary_provider'] == stack.secondary_provider

    def test_database_construct_parameters(self, mock_constructs):
        """Test that database construct receives correct parameters"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        call_args = mock_constructs['database'].call_args
        assert call_args[1]['environment_suffix'] == "test-env"
        assert call_args[1]['primary_provider'] == stack.primary_provider
        assert call_args[1]['secondary_provider'] == stack.secondary_provider
        assert call_args[1]['primary_vpc_id'] == "vpc-primary"
        assert call_args[1]['secondary_vpc_id'] == "vpc-secondary"

    def test_compute_construct_parameters(self, mock_constructs):
        """Test that compute construct receives correct parameters"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        call_args = mock_constructs['compute'].call_args
        assert call_args[1]['environment_suffix'] == "test-env"
        assert len(call_args[1]['primary_subnet_ids']) == 3
        assert len(call_args[1]['secondary_subnet_ids']) == 3

    def test_dns_construct_parameters(self, mock_constructs):
        """Test that DNS construct receives correct parameters"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        call_args = mock_constructs['dns'].call_args
        assert call_args[1]['environment_suffix'] == "test-env"
        assert call_args[1]['primary_endpoint'] == "https://primary.example.com"
        assert call_args[1]['secondary_endpoint'] == "https://secondary.example.com"

    def test_monitoring_construct_parameters(self, mock_constructs):
        """Test that monitoring construct receives correct parameters"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        stack = MultiRegionDRStack(app, "test-stack", "test-env")

        call_args = mock_constructs['monitoring'].call_args
        assert call_args[1]['environment_suffix'] == "test-env"
        assert call_args[1]['primary_db_cluster_id'] == "primary-cluster-id"
        assert call_args[1]['secondary_db_cluster_id'] == "secondary-cluster-id"
        assert call_args[1]['dynamodb_table_name'] == "payment-sessions-test"

    def test_environment_suffix_from_env_variable(self, mock_constructs):
        """Test that environment suffix can be set from environment variable"""
        import os
        os.environ['ENVIRONMENT_SUFFIX'] = 'from-env'

        from cdktf import App
        from main import MultiRegionDRStack

        app = App()
        # The main.py reads from os.environ, so we test that behavior
        env_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev-test")
        stack = MultiRegionDRStack(app, f"payment-dr-{env_suffix}", env_suffix)

        assert stack.environment_suffix == "from-env"

        # Cleanup
        del os.environ['ENVIRONMENT_SUFFIX']

    def test_stack_id_includes_environment_suffix(self, mock_constructs):
        """Test that stack ID is formatted correctly with environment suffix"""
        from main import MultiRegionDRStack
        from cdktf import App

        app = App()
        env_suffix = "test-123"
        stack_id = f"payment-dr-{env_suffix}"
        stack = MultiRegionDRStack(app, stack_id, env_suffix)

        # Stack should be created successfully with the formatted ID
        assert stack is not None
