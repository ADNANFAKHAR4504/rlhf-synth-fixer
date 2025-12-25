"""Unit tests for TAP Stack."""

import pytest
from lib.tap_stack import TapStackArgs


class TestTapStackArgs:
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_defaults(self):
        """Test default values for TapStackArgs."""
        args = TapStackArgs()
        assert args.environment_suffix == "dev"
        assert args.team_name == "tap"
        assert args.project_name == "iac-aws-nova-model-breaking"
        assert len(args.regions) == 3
        assert args.availability_zones_per_region == 3

    def test_tap_stack_args_custom_environment(self):
        """Test TapStackArgs with custom environment."""
        args = TapStackArgs(environment_suffix="prod")
        assert args.environment_suffix == "prod"

    def test_get_resource_name(self):
        """Test resource naming convention."""
        args = TapStackArgs()
        resource_name = args.get_resource_name("vpc")
        assert resource_name == "tap-dev-vpc"

    def test_get_default_tags(self):
        """Test default tags generation."""
        args = TapStackArgs()
        tags = args.get_default_tags()
        assert "Owner" in tags
        assert "Purpose" in tags
        assert "Environment" in tags
        assert tags["Environment"] == "dev"
        assert tags["ManagedBy"] == "pulumi"
