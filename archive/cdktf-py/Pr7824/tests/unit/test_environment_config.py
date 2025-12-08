"""Unit tests for EnvironmentConfig."""

import pytest
from lib.environment_config import EnvironmentConfig


class TestEnvironmentConfig:
    """Test suite for EnvironmentConfig."""

    def test_get_dev_config(self):
        """Test retrieving dev environment configuration."""
        config = EnvironmentConfig.get_config("dev")

        assert config["lambda_memory"] == 256
        assert config["rds_backup_retention"] == 1
        assert config["dynamodb_billing_mode"] == "PAY_PER_REQUEST"
        assert config["s3_versioning_enabled"] is False
        assert config["cloudwatch_log_retention"] == 7
        assert config["api_stage_name"] == "dev"

    def test_get_staging_config(self):
        """Test retrieving staging environment configuration."""
        config = EnvironmentConfig.get_config("staging")

        assert config["lambda_memory"] == 512
        assert config["rds_backup_retention"] == 7
        assert config["dynamodb_billing_mode"] == "PAY_PER_REQUEST"
        assert config["s3_versioning_enabled"] is False
        assert config["cloudwatch_log_retention"] == 30
        assert config["api_stage_name"] == "staging"

    def test_get_prod_config(self):
        """Test retrieving prod environment configuration."""
        config = EnvironmentConfig.get_config("prod")

        assert config["lambda_memory"] == 1024
        assert config["rds_backup_retention"] == 30
        assert config["dynamodb_billing_mode"] == "PROVISIONED"
        assert config["dynamodb_read_capacity"] == 5
        assert config["dynamodb_write_capacity"] == 5
        assert config["s3_versioning_enabled"] is True
        assert config["cloudwatch_log_retention"] == 90
        assert config["api_stage_name"] == "prod"

    def test_invalid_environment_raises_error(self):
        """Test that invalid environment raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            EnvironmentConfig.get_config("invalid")

        assert "Unknown environment" in str(exc_info.value)
        assert "invalid" in str(exc_info.value)

    def test_get_vpc_cidr_dev(self):
        """Test retrieving VPC CIDR for dev environment."""
        cidr = EnvironmentConfig.get_vpc_cidr("dev")
        assert cidr == "10.0.0.0/16"

    def test_get_vpc_cidr_staging(self):
        """Test retrieving VPC CIDR for staging environment."""
        cidr = EnvironmentConfig.get_vpc_cidr("staging")
        assert cidr == "10.1.0.0/16"

    def test_get_vpc_cidr_prod(self):
        """Test retrieving VPC CIDR for prod environment."""
        cidr = EnvironmentConfig.get_vpc_cidr("prod")
        assert cidr == "10.2.0.0/16"

    def test_all_environments_have_required_fields(self):
        """Test that all environments have required configuration fields."""
        required_fields = [
            "lambda_memory",
            "lambda_timeout",
            "rds_backup_retention",
            "rds_instance_class",
            "rds_multi_az",
            "dynamodb_billing_mode",
            "s3_versioning_enabled",
            "cloudwatch_log_retention",
            "api_stage_name",
        ]

        for env in ["dev", "staging", "prod"]:
            config = EnvironmentConfig.get_config(env)
            for field in required_fields:
                assert field in config, f"Missing {field} in {env} config"

    def test_prod_has_provisioned_dynamodb_settings(self):
        """Test that prod environment has DynamoDB provisioned capacity settings."""
        config = EnvironmentConfig.get_config("prod")

        assert config["dynamodb_billing_mode"] == "PROVISIONED"
        assert config["dynamodb_read_capacity"] is not None
        assert config["dynamodb_write_capacity"] is not None
        assert isinstance(config["dynamodb_read_capacity"], int)
        assert isinstance(config["dynamodb_write_capacity"], int)

    def test_dev_staging_use_on_demand_dynamodb(self):
        """Test that dev and staging use on-demand DynamoDB billing."""
        for env in ["dev", "staging"]:
            config = EnvironmentConfig.get_config(env)
            assert config["dynamodb_billing_mode"] == "PAY_PER_REQUEST"
            assert config["dynamodb_read_capacity"] is None
            assert config["dynamodb_write_capacity"] is None

    def test_lambda_memory_increases_per_environment(self):
        """Test that Lambda memory increases from dev to staging to prod."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["lambda_memory"] < staging_config["lambda_memory"]
        assert staging_config["lambda_memory"] < prod_config["lambda_memory"]

    def test_rds_backup_retention_increases_per_environment(self):
        """Test that RDS backup retention increases from dev to staging to prod."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["rds_backup_retention"] < staging_config["rds_backup_retention"]
        assert staging_config["rds_backup_retention"] < prod_config["rds_backup_retention"]

    def test_cloudwatch_log_retention_increases_per_environment(self):
        """Test that CloudWatch log retention increases from dev to staging to prod."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["cloudwatch_log_retention"] < staging_config["cloudwatch_log_retention"]
        assert staging_config["cloudwatch_log_retention"] < prod_config["cloudwatch_log_retention"]

    def test_only_prod_has_s3_versioning(self):
        """Test that only prod environment has S3 versioning enabled."""
        dev_config = EnvironmentConfig.get_config("dev")
        staging_config = EnvironmentConfig.get_config("staging")
        prod_config = EnvironmentConfig.get_config("prod")

        assert dev_config["s3_versioning_enabled"] is False
        assert staging_config["s3_versioning_enabled"] is False
        assert prod_config["s3_versioning_enabled"] is True
