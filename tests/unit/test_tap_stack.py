"""
Simple tests for tap_stack module to improve coverage.
"""
import pytest
from lib.tap_stack import (
    clean_aws_suffix,
    get_environment_config,
    get_lambda_trust_policy,
    get_cicd_trust_policy,
    TapStackArgs
)


def test_clean_aws_suffix():
    """Test AWS suffix cleaning function."""
    assert clean_aws_suffix("pr1442") == "pr1442"
    assert clean_aws_suffix("PR-1442") == "pr-1442"
    assert clean_aws_suffix("test_env") == "testenv"
    assert clean_aws_suffix("") != ""  # Should return timestamp
    assert clean_aws_suffix(None) != ""  # Should return timestamp


def test_get_environment_config():
    """Test environment configuration retrieval."""
    config = get_environment_config()
    assert "dev" in config
    assert "prod" in config
    assert config["dev"]["region"] == "us-west-2"
    assert config["prod"]["region"] == "eu-central-1"


def test_get_lambda_trust_policy():
    """Test Lambda trust policy generation."""
    policy = get_lambda_trust_policy()
    assert policy["Version"] == "2012-10-17"
    assert len(policy["Statement"]) > 0
    assert policy["Statement"][0]["Effect"] == "Allow"


def test_get_cicd_trust_policy():
    """Test CI/CD trust policy generation."""
    policy = get_cicd_trust_policy()
    assert policy["Version"] == "2012-10-17"
    assert len(policy["Statement"]) > 0
    assert "codebuild.amazonaws.com" in policy["Statement"][0]["Principal"]["Service"]


def test_tap_stack_args():
    """Test TapStackArgs initialization."""
    args = TapStackArgs()
    assert args.environment is None
    assert args.region is None
    assert args.environment_suffix is None
    
    args_with_values = TapStackArgs(
        environment="dev",
        region="us-west-2", 
        environment_suffix="pr1442"
    )
    assert args_with_values.environment == "dev"
    assert args_with_values.region == "us-west-2"
    assert args_with_values.environment_suffix == "pr1442"