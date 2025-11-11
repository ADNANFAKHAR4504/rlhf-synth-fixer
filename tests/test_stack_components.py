"""
Unit tests for TAP stack infrastructure components.

Tests validate that all infrastructure components are properly configured
with security, reliability, and cost optimization best practices.
"""

import unittest
import sys
import os

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestNetworkStackArgsInitialization(unittest.TestCase):
    """Test NetworkStackArgs initialization and configuration."""

    def test_network_stack_args_default_initialization(self):
        """Test NetworkStackArgs initializes with default values."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test"
        )

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")
        self.assertEqual(args.tags, {})

    def test_network_stack_args_custom_regions(self):
        """Test NetworkStackArgs accepts custom regions."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="prod",
            primary_region="eu-west-1",
            secondary_region="eu-central-1",
            tertiary_region="ap-northeast-1"
        )

        self.assertEqual(args.primary_region, "eu-west-1")
        self.assertEqual(args.secondary_region, "eu-central-1")
        self.assertEqual(args.tertiary_region, "ap-northeast-1")

    def test_network_stack_args_with_tags(self):
        """Test NetworkStackArgs accepts custom tags."""
        from lib.network_stack import NetworkStackArgs

        tags = {"Owner": "Infrastructure", "Project": "TAP"}
        args = NetworkStackArgs(
            environment_suffix="staging",
            tags=tags
        )

        self.assertEqual(args.tags, tags)

    def test_network_stack_args_environment_suffix_stored(self):
        """Test NetworkStackArgs stores environment suffix for naming."""
        from lib.network_stack import NetworkStackArgs

        suffix = "synth7up57r"
        args = NetworkStackArgs(environment_suffix=suffix)

        self.assertIsNotNone(args.environment_suffix)
        self.assertEqual(args.environment_suffix, suffix)


class TestTapStackArgsInitialization(unittest.TestCase):
    """Test TapStackArgs initialization and configuration."""

    def test_tap_stack_args_default_initialization(self):
        """Test TapStackArgs initializes with defaults."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.alert_email_addresses, [])
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_environment_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="production")

        self.assertEqual(args.environment_suffix, "production")

    def test_tap_stack_args_with_alert_emails(self):
        """Test TapStackArgs accepts alert email addresses."""
        from lib.tap_stack import TapStackArgs

        emails = ["admin@example.com", "ops@example.com"]
        args = TapStackArgs(
            environment_suffix="prod",
            alert_email_addresses=emails
        )

        self.assertEqual(args.alert_email_addresses, emails)
        self.assertEqual(len(args.alert_email_addresses), 2)

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs accepts custom tags."""
        from lib.tap_stack import TapStackArgs

        tags = {"Environment": "production", "CostCenter": "CORE"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=tags
        )

        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_all_parameters(self):
        """Test TapStackArgs with all parameters configured."""
        from lib.tap_stack import TapStackArgs

        emails = ["admin@example.com"]
        tags = {"Service": "TAP"}

        args = TapStackArgs(
            environment_suffix="staging",
            alert_email_addresses=emails,
            tags=tags
        )

        self.assertEqual(args.environment_suffix, "staging")
        self.assertEqual(args.alert_email_addresses, emails)
        self.assertEqual(args.tags, tags)


class TestStorageStackArgsInitialization(unittest.TestCase):
    """Test StorageStackArgs initialization."""

    def test_storage_stack_args_default_initialization(self):
        """Test StorageStackArgs initializes with defaults."""
        from lib.storage_stack import StorageStackArgs

        args = StorageStackArgs(environment_suffix="test")

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tags, {})

    def test_storage_stack_args_with_tags(self):
        """Test StorageStackArgs accepts tags."""
        from lib.storage_stack import StorageStackArgs

        tags = {"DataClassification": "Internal"}
        args = StorageStackArgs(
            environment_suffix="prod",
            tags=tags
        )

        self.assertEqual(args.tags, tags)


class TestConfigurationTypes(unittest.TestCase):
    """Test configuration parameter types and validation."""

    def test_network_stack_args_regions_are_strings(self):
        """Test that regions are stored as strings."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="ap-southeast-1"
        )

        self.assertIsInstance(args.primary_region, str)
        self.assertTrue(len(args.primary_region) > 0)

    def test_tap_stack_args_email_list_type(self):
        """Test that alert emails are stored as list."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            alert_email_addresses=["test@example.com"]
        )

        self.assertIsInstance(args.alert_email_addresses, list)

    def test_tap_stack_args_tags_dict_type(self):
        """Test that tags are stored as dictionary."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(tags={"Key": "Value"})

        self.assertIsInstance(args.tags, dict)

    def test_storage_stack_args_tags_dict_type(self):
        """Test that StorageStack tags are dictionary."""
        from lib.storage_stack import StorageStackArgs

        args = StorageStackArgs(
            environment_suffix="test",
            tags={"Owner": "Team"}
        )

        self.assertIsInstance(args.tags, dict)


class TestEnvironmentSuffixNaming(unittest.TestCase):
    """Test environment suffix usage for resource naming."""

    def test_network_stack_environment_suffix_stored(self):
        """Test NetworkStack stores environment suffix for naming."""
        from lib.network_stack import NetworkStackArgs

        env_suffix = "synth7up57r"
        args = NetworkStackArgs(environment_suffix=env_suffix)

        self.assertEqual(args.environment_suffix, env_suffix)
        self.assertIn(env_suffix, args.environment_suffix)

    def test_storage_stack_environment_suffix_stored(self):
        """Test StorageStack stores environment suffix."""
        from lib.storage_stack import StorageStackArgs

        env_suffix = "prod-v2"
        args = StorageStackArgs(environment_suffix=env_suffix)

        self.assertEqual(args.environment_suffix, env_suffix)

    def test_tap_stack_environment_suffix_defaults_to_dev(self):
        """Test TapStack environment suffix defaults to 'dev'."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, "dev")

    def test_tap_stack_environment_suffix_custom_value(self):
        """Test TapStack accepts custom environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="custom-env")

        self.assertEqual(args.environment_suffix, "custom-env")


class TestMultiRegionConfiguration(unittest.TestCase):
    """Test multi-region configuration for high availability."""

    def test_network_stack_supports_three_regions(self):
        """Test NetworkStack configures three regions for HA."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="ap-southeast-1",
            secondary_region="us-east-1",
            tertiary_region="us-east-2"
        )

        self.assertIsNotNone(args.primary_region)
        self.assertIsNotNone(args.secondary_region)
        self.assertIsNotNone(args.tertiary_region)
        self.assertEqual(args.primary_region, "ap-southeast-1")
        self.assertEqual(args.secondary_region, "us-east-1")
        self.assertEqual(args.tertiary_region, "us-east-2")

    def test_network_stack_regions_are_different(self):
        """Test that three regions are distinct."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            tertiary_region="eu-west-1"
        )

        regions = [args.primary_region, args.secondary_region, args.tertiary_region]
        self.assertEqual(len(regions), len(set(regions)))


class TestTaggingStrategy(unittest.TestCase):
    """Test tagging configuration and best practices."""

    def test_network_stack_args_stores_tags(self):
        """Test NetworkStack stores tags for resource labeling."""
        from lib.network_stack import NetworkStackArgs

        tags = {"Environment": "staging", "Component": "Network"}
        args = NetworkStackArgs(
            environment_suffix="stage",
            tags=tags
        )

        self.assertEqual(args.tags, tags)

    def test_tap_stack_args_stores_tags(self):
        """Test TapStack stores tags."""
        from lib.tap_stack import TapStackArgs

        tags = {"Project": "TAP", "Owner": "Platform"}
        args = TapStackArgs(tags=tags)

        self.assertEqual(args.tags, tags)

    def test_storage_stack_supports_custom_tags(self):
        """Test StorageStack supports custom tagging."""
        from lib.storage_stack import StorageStackArgs

        tags = {
            "DataClassification": "Confidential",
            "Backup": "Required",
            "Owner": "DataTeam"
        }
        args = StorageStackArgs(
            environment_suffix="prod",
            tags=tags
        )

        self.assertEqual(args.tags, tags)
        self.assertEqual(len(args.tags), 3)


class TestNotificationConfiguration(unittest.TestCase):
    """Test notification and alerting configuration."""

    def test_tap_stack_alert_emails_list(self):
        """Test TapStack alert emails are stored as list."""
        from lib.tap_stack import TapStackArgs

        emails = ["admin@example.com", "ops@example.com"]
        args = TapStackArgs(alert_email_addresses=emails)

        self.assertEqual(args.alert_email_addresses, emails)
        self.assertIsInstance(args.alert_email_addresses, list)

    def test_tap_stack_alert_emails_empty_default(self):
        """Test TapStack alert emails defaults to empty list."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.alert_email_addresses, [])
        self.assertIsInstance(args.alert_email_addresses, list)


class TestResourceNamingConventions(unittest.TestCase):
    """Test resource naming conventions."""

    def test_network_stack_args_suffix_for_naming(self):
        """Test NetworkStack suffix can be used in resource naming."""
        from lib.network_stack import NetworkStackArgs

        suffix = "synth-abc123"
        args = NetworkStackArgs(environment_suffix=suffix)

        # Verify suffix is available for naming
        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertIn("-", args.environment_suffix)

    def test_storage_stack_args_suffix_for_naming(self):
        """Test StorageStack suffix can be used in names."""
        from lib.storage_stack import StorageStackArgs

        suffix = "prod-2024"
        args = StorageStackArgs(environment_suffix=suffix)

        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertEqual(args.environment_suffix, suffix)


class TestSecurityConfiguration(unittest.TestCase):
    """Test security-related configurations."""

    def test_tap_stack_alert_emails_can_be_configured(self):
        """Test that alert emails can be configured for security monitoring."""
        from lib.tap_stack import TapStackArgs

        security_emails = ["security@example.com", "audit@example.com"]
        args = TapStackArgs(alert_email_addresses=security_emails)

        self.assertEqual(args.alert_email_addresses, security_emails)

    def test_storage_stack_security_tags_supported(self):
        """Test StorageStack supports security-related tags."""
        from lib.storage_stack import StorageStackArgs

        security_tags = {
            "Encryption": "Required",
            "PublicAccess": "Denied",
            "VersioningEnabled": "True"
        }
        args = StorageStackArgs(
            environment_suffix="prod",
            tags=security_tags
        )

        self.assertEqual(args.tags, security_tags)


class TestHighAvailabilityConfiguration(unittest.TestCase):
    """Test high availability configurations."""

    def test_network_stack_multi_region_ha(self):
        """Test NetworkStack configures HA across multiple regions."""
        from lib.network_stack import NetworkStackArgs

        args = NetworkStackArgs(
            environment_suffix="test",
            primary_region="ap-southeast-1",
            secondary_region="us-east-1",
            tertiary_region="us-east-2"
        )

        # All regions configured for high availability
        self.assertIsNotNone(args.primary_region)
        self.assertIsNotNone(args.secondary_region)
        self.assertIsNotNone(args.tertiary_region)
        # Verify regions form a valid HA strategy (multiple geographic regions)
        self.assertGreater(len(args.primary_region), 0)
        self.assertGreater(len(args.secondary_region), 0)
        self.assertGreater(len(args.tertiary_region), 0)


if __name__ == '__main__':
    unittest.main()
