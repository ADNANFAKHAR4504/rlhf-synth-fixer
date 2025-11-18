"""
Unit tests for TAP stack and modules.
Tests configuration, validation, and resource creation logic.
"""

import pytest
from lib.config.variables import EnvironmentConfig
from lib.config.validation import ConfigValidator


class TestEnvironmentConfig:
    """Test environment configuration class."""

    def test_vpc_cidr_dev(self):
        """Test VPC CIDR for dev environment."""
        assert EnvironmentConfig.get_vpc_cidr('dev') == '10.0.0.0/16'

    def test_vpc_cidr_staging(self):
        """Test VPC CIDR for staging environment."""
        assert EnvironmentConfig.get_vpc_cidr('staging') == '10.1.0.0/16'

    def test_vpc_cidr_prod(self):
        """Test VPC CIDR for prod environment."""
        assert EnvironmentConfig.get_vpc_cidr('prod') == '10.2.0.0/16'

    def test_ecs_container_count_dev(self):
        """Test ECS container count for dev."""
        assert EnvironmentConfig.get_ecs_container_count('dev') == 2

    def test_ecs_container_count_staging(self):
        """Test ECS container count for staging."""
        assert EnvironmentConfig.get_ecs_container_count('staging') == 4

    def test_ecs_container_count_prod(self):
        """Test ECS container count for prod."""
        assert EnvironmentConfig.get_ecs_container_count('prod') == 8

    def test_rds_multi_az_dev(self):
        """Test RDS Multi-AZ setting for dev."""
        assert EnvironmentConfig.get_rds_multi_az('dev') is False

    def test_rds_multi_az_prod(self):
        """Test RDS Multi-AZ setting for prod."""
        assert EnvironmentConfig.get_rds_multi_az('prod') is True

    def test_workspace_validation_valid(self):
        """Test workspace validation with valid values."""
        assert EnvironmentConfig.validate_workspace('dev') is True
        assert EnvironmentConfig.validate_workspace('staging') is True
        assert EnvironmentConfig.validate_workspace('prod') is True

    def test_workspace_validation_invalid(self):
        """Test workspace validation with invalid values."""
        assert EnvironmentConfig.validate_workspace('invalid') is False
        assert EnvironmentConfig.validate_workspace('test') is False

    def test_get_all_config_dev(self):
        """Test getting all configuration for dev."""
        config = EnvironmentConfig.get_all_config('dev')
        assert config['workspace'] == 'dev'
        assert config['vpc_cidr'] == '10.0.0.0/16'
        assert config['ecs_container_count'] == 2
        assert config['rds_multi_az'] is False

    def test_get_all_config_invalid_workspace(self):
        """Test getting config with invalid workspace raises error."""
        with pytest.raises(ValueError, match="Invalid workspace"):
            EnvironmentConfig.get_all_config('invalid')


class TestConfigValidator:
    """Test configuration validator class."""

    def test_validate_cidr_valid(self):
        """Test CIDR validation with valid CIDR blocks."""
        assert ConfigValidator.validate_cidr('10.0.0.0/16') is True
        assert ConfigValidator.validate_cidr('192.168.1.0/24') is True

    def test_validate_cidr_invalid(self):
        """Test CIDR validation with invalid CIDR blocks."""
        assert ConfigValidator.validate_cidr('invalid') is False
        assert ConfigValidator.validate_cidr('10.0.0.0/33') is False

    def test_validate_cidr_non_overlapping_valid(self):
        """Test non-overlapping CIDR validation with valid blocks."""
        cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16']
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is True

    def test_validate_cidr_non_overlapping_invalid(self):
        """Test non-overlapping CIDR validation with overlapping blocks."""
        cidrs = ['10.0.0.0/16', '10.0.1.0/24', '10.2.0.0/16']
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is False

    def test_validate_container_count_valid(self):
        """Test container count validation with valid counts."""
        assert ConfigValidator.validate_container_count(1) is True
        assert ConfigValidator.validate_container_count(50) is True
        assert ConfigValidator.validate_container_count(100) is True

    def test_validate_container_count_invalid(self):
        """Test container count validation with invalid counts."""
        assert ConfigValidator.validate_container_count(0) is False
        assert ConfigValidator.validate_container_count(101) is False
        assert ConfigValidator.validate_container_count(-1) is False

    def test_validate_instance_class_valid(self):
        """Test RDS instance class validation with valid classes."""
        assert ConfigValidator.validate_instance_class('db.t3.medium') is True
        assert ConfigValidator.validate_instance_class('db.r5.large') is True

    def test_validate_instance_class_invalid(self):
        """Test RDS instance class validation with invalid classes."""
        assert ConfigValidator.validate_instance_class('invalid') is False
        assert ConfigValidator.validate_instance_class('t3.medium') is False

    def test_validate_availability_zones_valid(self):
        """Test AZ count validation with valid counts."""
        assert ConfigValidator.validate_availability_zones(1) is True
        assert ConfigValidator.validate_availability_zones(3) is True
        assert ConfigValidator.validate_availability_zones(6) is True

    def test_validate_availability_zones_invalid(self):
        """Test AZ count validation with invalid counts."""
        assert ConfigValidator.validate_availability_zones(0) is False
        assert ConfigValidator.validate_availability_zones(7) is False

    def test_validate_environment_suffix_valid(self):
        """Test environment suffix validation with valid suffixes."""
        assert ConfigValidator.validate_environment_suffix('dev-12345') is True
        assert ConfigValidator.validate_environment_suffix('prod-abc') is True

    def test_validate_environment_suffix_invalid(self):
        """Test environment suffix validation with invalid suffixes."""
        assert ConfigValidator.validate_environment_suffix('') is False
        assert ConfigValidator.validate_environment_suffix('a' * 51) is False

    def test_validate_all_valid_config(self):
        """Test validate_all with valid configuration."""
        config = {
            'vpc_cidr': '10.0.0.0/16',
            'ecs_container_count': 2,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is True
        assert error_msg is None

    def test_validate_all_invalid_cidr(self):
        """Test validate_all with invalid CIDR."""
        config = {
            'vpc_cidr': 'invalid',
            'ecs_container_count': 2,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is False
        assert 'CIDR' in error_msg

    def test_validate_all_invalid_container_count(self):
        """Test validate_all with invalid container count."""
        config = {
            'vpc_cidr': '10.0.0.0/16',
            'ecs_container_count': 0,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is False
        assert 'container count' in error_msg


class TestCIDRNonOverlapping:
    """Test CIDR non-overlapping validation across all environments."""

    def test_all_environment_cidrs_non_overlapping(self):
        """Verify that all environment CIDRs are non-overlapping."""
        cidrs = [
            EnvironmentConfig.get_vpc_cidr('dev'),
            EnvironmentConfig.get_vpc_cidr('staging'),
            EnvironmentConfig.get_vpc_cidr('prod')
        ]
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is True
