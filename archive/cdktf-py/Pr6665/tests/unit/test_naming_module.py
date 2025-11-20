"""Unit tests for naming module."""
import pytest
from lib.modules.naming import NamingModule


class TestNamingModule:
    """Test cases for NamingModule."""

    def test_generate_name(self):
        """Test full resource name generation."""
        naming = NamingModule("dev", "us-east-1", "demo")
        result = naming.generate_name("vpc", "main")
        assert result == "dev-us-east-1-vpc-main-demo"

    def test_generate_simple_name(self):
        """Test simple resource name generation."""
        naming = NamingModule("prod", "us-east-1", "demo")
        result = naming.generate_simple_name("postgres")
        assert result == "prod-postgres-demo"

    def test_environment_suffix_included(self):
        """Test that environment suffix is always included."""
        naming = NamingModule("staging", "us-west-2", "test123")
        result = naming.generate_simple_name("bucket")
        assert "test123" in result
        assert result == "staging-bucket-test123"

    def test_different_environments(self):
        """Test naming across different environments."""
        dev_naming = NamingModule("dev", "us-east-1", "demo")
        prod_naming = NamingModule("prod", "us-east-1", "demo")

        dev_name = dev_naming.generate_simple_name("vpc")
        prod_name = prod_naming.generate_simple_name("vpc")

        assert dev_name != prod_name
        assert "dev" in dev_name
        assert "prod" in prod_name
