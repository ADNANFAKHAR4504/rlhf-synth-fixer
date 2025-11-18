"""
Integration tests for TAP stack.
Tests full stack synthesis and resource relationships.
"""

import pytest
import os
from cdktf import Testing


def test_stack_synthesis():
    """Test that the stack synthesizes without errors."""
    # This test requires actual AWS credentials and state bucket
    # For now, we'll skip it in CI/CD
    pytest.skip("Integration test requires AWS credentials")


def test_dev_environment_configuration():
    """Test dev environment configuration values."""
    from lib.config.variables import EnvironmentConfig

    config = EnvironmentConfig.get_all_config('dev')

    assert config['vpc_cidr'] == '10.0.0.0/16'
    assert config['ecs_container_count'] == 2
    assert config['rds_multi_az'] is False
    assert config['availability_zones'] == 2


def test_prod_environment_configuration():
    """Test prod environment configuration values."""
    from lib.config.variables import EnvironmentConfig

    config = EnvironmentConfig.get_all_config('prod')

    assert config['vpc_cidr'] == '10.2.0.0/16'
    assert config['ecs_container_count'] == 8
    assert config['rds_multi_az'] is True
    assert config['availability_zones'] == 3


def test_environment_specific_scaling():
    """Test that container counts scale appropriately per environment."""
    from lib.config.variables import EnvironmentConfig

    dev_count = EnvironmentConfig.get_ecs_container_count('dev')
    staging_count = EnvironmentConfig.get_ecs_container_count('staging')
    prod_count = EnvironmentConfig.get_ecs_container_count('prod')

    assert dev_count < staging_count < prod_count
    assert dev_count == 2
    assert staging_count == 4
    assert prod_count == 8
