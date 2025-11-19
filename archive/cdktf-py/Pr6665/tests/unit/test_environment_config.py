"""Unit tests for environment configuration."""
import pytest
from lib.config.environment_config import EnvironmentConfig


class TestEnvironmentConfig:
    """Test cases for EnvironmentConfig."""

    def test_get_dev_config(self):
        """Test development configuration retrieval."""
        config = EnvironmentConfig.get_config("dev")
        assert config["environment"] == "dev"
        assert config["vpc_cidr"] == "10.0.0.0/16"
        assert config["rds_multi_az"] is False
        assert config["enable_nat_gateway"] is False

    def test_get_staging_config(self):
        """Test staging configuration retrieval."""
        config = EnvironmentConfig.get_config("staging")
        assert config["environment"] == "staging"
        assert config["vpc_cidr"] == "10.1.0.0/16"
        assert config["rds_multi_az"] is False
        assert config["enable_nat_gateway"] is True

    def test_get_prod_config(self):
        """Test production configuration retrieval."""
        config = EnvironmentConfig.get_config("prod")
        assert config["environment"] == "prod"
        assert config["vpc_cidr"] == "10.2.0.0/16"
        assert config["rds_multi_az"] is True
        assert config["enable_nat_gateway"] is True

    def test_non_overlapping_cidrs(self):
        """Test that VPC CIDRs don't overlap."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["vpc_cidr"] != staging_config["vpc_cidr"]
        assert dev_config["vpc_cidr"] != prod_config["vpc_cidr"]
        assert staging_config["vpc_cidr"] != prod_config["vpc_cidr"]

    def test_prod_has_multi_az(self):
        """Test that production has multi-AZ enabled."""
        prod_config = EnvironmentConfig.get_config("prod")
        assert prod_config["rds_multi_az"] is True

    def test_dev_staging_single_az(self):
        """Test that dev and staging use single-AZ."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")

        assert dev_config["rds_multi_az"] is False
        assert staging_config["rds_multi_az"] is False

    def test_backup_retention_varies(self):
        """Test that backup retention varies by environment."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["rds_backup_retention"] == 1
        assert staging_config["rds_backup_retention"] == 3
        assert prod_config["rds_backup_retention"] == 7

    def test_task_resources_increase(self):
        """Test that ECS task resources increase with environment."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert int(dev_config["ecs_task_cpu"]) < int(prod_config["ecs_task_cpu"])
        assert int(dev_config["ecs_task_memory"]) < int(prod_config["ecs_task_memory"])
        assert dev_config["ecs_desired_count"] < prod_config["ecs_desired_count"]

    def test_invalid_environment_returns_dev(self):
        """Test that invalid environment defaults to dev."""
        config = EnvironmentConfig.get_config("invalid")
        assert config["environment"] == "dev"

    def test_config_with_empty_account_id(self):
        """Test configuration with empty account_id."""
        # Temporarily add a test config with empty account_id
        original_dev = EnvironmentConfig.DEV.copy()
        try:
            # Create a config without account_id for testing
            test_config = EnvironmentConfig.DEV.copy()
            test_config["account_id"] = ""
            EnvironmentConfig.DEV = test_config

            config = EnvironmentConfig.get_config("dev")
            assert config["account_id"] == ""
        finally:
            # Restore original config
            EnvironmentConfig.DEV = original_dev

    def test_config_with_none_account_id(self):
        """Test configuration with None account_id."""
        # Temporarily add a test config with None account_id
        original_dev = EnvironmentConfig.DEV.copy()
        try:
            # Create a config without account_id for testing
            test_config = EnvironmentConfig.DEV.copy()
            test_config["account_id"] = None
            EnvironmentConfig.DEV = test_config

            config = EnvironmentConfig.get_config("dev")
            assert config["account_id"] is None
        finally:
            # Restore original config
            EnvironmentConfig.DEV = original_dev
