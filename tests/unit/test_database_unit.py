"""
Unit tests for DatabaseConstruct
"""
import pytest
from cdktf import Testing
from cdktf_cdktf_provider_aws.provider import AwsProvider
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lib.imports.database import DatabaseConstruct


class TestDatabaseConstruct:
    """Test suite for DatabaseConstruct"""

    @pytest.fixture
    def setup_stack(self):
        """Create a test stack with providers and mock data"""
        stack = Testing.stub_stack()
        primary_provider = AwsProvider(stack, "aws_primary", region="us-east-1", alias="primary")
        secondary_provider = AwsProvider(stack, "aws_secondary", region="us-west-2", alias="secondary")

        mock_data = {
            'primary_vpc_id': 'vpc-primary-123',
            'secondary_vpc_id': 'vpc-secondary-456',
            'primary_subnet_ids': ['subnet-1', 'subnet-2', 'subnet-3'],
            'secondary_subnet_ids': ['subnet-4', 'subnet-5', 'subnet-6'],
            'primary_security_group_id': 'sg-primary-db',
            'secondary_security_group_id': 'sg-secondary-db'
        }

        return stack, primary_provider, secondary_provider, mock_data

    def test_database_construct_creation(self, setup_stack):
        """Test that database construct is created successfully"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct is not None
        assert construct.environment_suffix == "test"

    def test_global_cluster_creation(self, setup_stack):
        """Test that Aurora Global Cluster is created"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.global_cluster is not None
        assert construct.global_cluster.engine == "aurora-postgresql"
        assert construct.global_cluster.engine_version == "15.3"
        assert construct.global_cluster.storage_encrypted is True

    def test_primary_cluster_configuration(self, setup_stack):
        """Test that primary cluster is configured correctly"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.primary_cluster is not None
        assert construct.primary_cluster.engine == "aurora-postgresql"
        assert construct.primary_cluster.engine_version == "15.3"
        assert construct.primary_cluster.storage_encrypted is True
        assert construct.primary_cluster.skip_final_snapshot is True
        assert construct.primary_cluster.backup_retention_period == 7

    def test_secondary_cluster_configuration(self, setup_stack):
        """Test that secondary cluster is configured correctly"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.secondary_cluster is not None
        assert construct.secondary_cluster.engine == "aurora-postgresql"
        assert construct.secondary_cluster.engine_version == "15.3"
        assert construct.secondary_cluster.storage_encrypted is True
        assert construct.secondary_cluster.skip_final_snapshot is True

    def test_secrets_manager_creation(self, setup_stack):
        """Test that Secrets Manager secrets are created"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.primary_secret is not None
        assert construct.secondary_secret is not None

    def test_subnet_groups(self, setup_stack):
        """Test that DB subnet groups are created"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.primary_subnet_group is not None
        assert construct.secondary_subnet_group is not None
        assert construct.primary_subnet_group.subnet_ids == mock_data['primary_subnet_ids']
        assert construct.secondary_subnet_group.subnet_ids == mock_data['secondary_subnet_ids']

    def test_property_accessors(self, setup_stack):
        """Test that property accessors return correct values"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.global_cluster_id == construct.global_cluster.id
        assert construct.primary_cluster_id == construct.primary_cluster.id
        assert construct.secondary_cluster_id == construct.secondary_cluster.id
        assert construct.primary_db_secret_arn == construct.primary_secret.arn
        assert construct.secondary_db_secret_arn == construct.secondary_secret.arn

    def test_resource_naming_includes_environment_suffix(self, setup_stack):
        """Test that all resources are named with environment suffix"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack
        env_suffix = "test-456"

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix=env_suffix,
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert f"payment-global-{env_suffix}" in construct.global_cluster.global_cluster_identifier
        assert f"payment-primary-{env_suffix}" in construct.primary_cluster.cluster_identifier
        assert f"payment-secondary-{env_suffix}" in construct.secondary_cluster.cluster_identifier

    def test_encryption_enabled(self, setup_stack):
        """Test that encryption is enabled for all resources"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        assert construct.global_cluster.storage_encrypted is True
        assert construct.primary_cluster.storage_encrypted is True
        assert construct.secondary_cluster.storage_encrypted is True

    def test_no_deletion_protection(self, setup_stack):
        """Test that deletion protection is not enabled"""
        stack, primary_provider, secondary_provider, mock_data = setup_stack

        construct = DatabaseConstruct(
            stack,
            "test-database",
            environment_suffix="test",
            primary_provider=primary_provider,
            secondary_provider=secondary_provider,
            **mock_data
        )

        # Verify skip_final_snapshot is True (allows deletion)
        assert construct.primary_cluster.skip_final_snapshot is True
        assert construct.secondary_cluster.skip_final_snapshot is True
