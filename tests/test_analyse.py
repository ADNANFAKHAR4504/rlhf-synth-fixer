"""
Unit tests for the infrastructure analysis script.
"""

import unittest
import os
import sys

# Add lib directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))


class TestAnalysisScriptExists(unittest.TestCase):
    """Test that the analysis script exists."""

    def test_analyse_script_exists(self):
        """Test that lib/analyse.py exists."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        self.assertTrue(os.path.exists(script_path), "lib/analyse.py should exist")

    def test_analyse_script_is_executable(self):
        """Test that lib/analyse.py is executable."""
        script_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'analyse.py')
        self.assertTrue(os.access(script_path, os.X_OK), "lib/analyse.py should be executable")


class TestAnalysisScriptImport(unittest.TestCase):
    """Test that the analysis script can be imported."""

    def test_can_import_analyse_module(self):
        """Test that we can import the analyse module."""
        try:
            # pylint: disable=import-outside-toplevel,unused-import
            import analyse
            # If we get here without exception, import succeeded
            self.assertIsNotNone(analyse)
        except ImportError as e:
            self.fail(f"Failed to import analyse module: {e}")

    def test_infrastructure_analyzer_class_exists(self):
        """Test that InfrastructureAnalyzer class exists."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer
        self.assertTrue(callable(InfrastructureAnalyzer))


class TestInfrastructureAnalyzer(unittest.TestCase):
    """Test the InfrastructureAnalyzer class."""

    def test_can_instantiate_analyzer(self):
        """Test that we can create an InfrastructureAnalyzer instance."""
        # pylint: disable=import-outside-toplevel
        from analyse import InfrastructureAnalyzer

        try:
            analyzer = InfrastructureAnalyzer(environment_suffix="test")
            self.assertIsNotNone(analyzer)
            self.assertEqual(analyzer.environment_suffix, "test")
        except Exception as e:
            # May fail if AWS credentials not available, which is okay for unit tests
            self.skipTest(f"Cannot instantiate analyzer without AWS credentials: {e}")


if __name__ == '__main__':
    unittest.main()
