"""
test_main_module.py

Unit tests that import and test lib/__main__.py module with mocked Pulumi configuration.
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch, MagicMock
import json


class TestMainModuleImport(unittest.TestCase):
    """Test importing lib/__main__.py module with mocked dependencies."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment before importing module."""
        # Store original module state
        cls.original_module = sys.modules.get("lib.__main__")

        # Remove module from cache if it exists
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

    @classmethod
    def tearDownClass(cls):
        """Restore original module state."""
        if cls.original_module:
            sys.modules["lib.__main__"] = cls.original_module
        elif "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    @patch("pulumi.Output")
    def test_module_imports_successfully(
        self,
        mock_output,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test that lib/__main__.py can be imported with mocked dependencies."""
        # Mock Pulumi Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(side_effect=lambda key: {
            "legacyStackName": "legacy-infrastructure",
            "region": "us-east-2",
            "legacyStackEnv": "production"
        }.get(key, None))
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(side_effect=lambda key: Mock(
            apply=Mock(return_value=f"mock-{key}")
        ))
        mock_stack_ref.return_value = stack_instance

        # Mock Output.all
        mock_output.all = Mock(return_value=Mock(
            apply=Mock(side_effect=lambda fn: fn([]))
        ))

        # Now import the module
        import lib.__main__ as main_module

        # Verify module has expected attributes
        self.assertIsNotNone(main_module)

        # Verify config was called
        mock_config.assert_called()
        config_instance.require.assert_called_with("environmentSuffix")

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_common_tags_defined(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test that common_tags are properly defined."""
        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(return_value=None)
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify common_tags structure
        self.assertIsNotNone(main_module.common_tags)
        self.assertIn("environment", main_module.common_tags)
        self.assertIn("team", main_module.common_tags)
        self.assertIn("cost-center", main_module.common_tags)
        self.assertIn("project", main_module.common_tags)

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_environment_suffix_configuration(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test environment_suffix is configured from Pulumi config."""
        test_suffix = "dev-test"

        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value=test_suffix)
        config_instance.get = Mock(return_value=None)
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify environment_suffix
        self.assertEqual(main_module.environment_suffix, test_suffix)

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_region_configuration(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test region is configured correctly."""
        test_region = "us-west-2"

        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(side_effect=lambda key: {
            "region": test_region
        }.get(key, None))
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify region (default is us-east-2)
        self.assertIsNotNone(main_module.region)

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_legacy_stack_name_configuration(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test legacy stack name can be configured."""
        test_stack = "test-legacy-stack"

        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(side_effect=lambda key: {
            "legacyStackName": test_stack
        }.get(key, None))
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify legacy_stack_name
        self.assertIsNotNone(main_module.legacy_stack_name)

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    @patch("pulumi_aws.ecr.Repository")
    def test_ecr_repository_creation(
        self,
        mock_ecr_repo,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test ECR repository is created."""
        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(return_value=None)
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Mock ECR Repository
        mock_ecr_repo.return_value = Mock()

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify ECR repository was created
        mock_ecr_repo.assert_called()

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    @patch("pulumi_aws.ecs.Cluster")
    def test_ecs_cluster_creation(
        self,
        mock_ecs_cluster,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test ECS cluster is created."""
        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(return_value=None)
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Mock ECS Cluster
        mock_ecs_cluster.return_value = Mock(
            name=Mock(),
            arn=Mock()
        )

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify ECS cluster was created
        mock_ecs_cluster.assert_called()

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_stack_reference_created(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test stack reference is created for legacy infrastructure."""
        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(side_effect=lambda key: {
            "legacyStackName": "legacy-stack",
            "legacyStackEnv": "production"
        }.get(key, None))
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify StackReference was called
        mock_stack_ref.assert_called()

    @patch("pulumi.StackReference")
    @patch("pulumi.Config")
    @patch("pulumi.export")
    def test_exports_are_called(
        self,
        mock_export,
        mock_config,
        mock_stack_ref
    ):
        """Test that pulumi.export is called for stack outputs."""
        # Mock Config
        config_instance = Mock()
        config_instance.require = Mock(return_value="test")
        config_instance.get = Mock(return_value=None)
        mock_config.return_value = config_instance

        # Mock StackReference
        stack_instance = Mock()
        stack_instance.get_output = Mock(return_value=Mock())
        mock_stack_ref.return_value = stack_instance

        # Clear and import
        if "lib.__main__" in sys.modules:
            del sys.modules["lib.__main__"]

        import lib.__main__ as main_module

        # Verify pulumi.export was called
        self.assertTrue(mock_export.called)
        self.assertGreater(mock_export.call_count, 5)


if __name__ == "__main__":
    unittest.main()
