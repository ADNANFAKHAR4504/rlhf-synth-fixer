"""
Comprehensive unit tests for drift detector module
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import json
from datetime import datetime


class TestDriftDetectorMethods(unittest.TestCase):
    """Comprehensive test cases for DriftDetector class methods"""

    def test_drift_detector_import(self):
        """Test that DriftDetector can be imported"""
        from lib.drift_detector import DriftDetector
        self.assertIsNotNone(DriftDetector)

    def test_drift_detector_init(self):
        """Test DriftDetector initialization"""
        from lib.drift_detector import DriftDetector

        detector = DriftDetector(
            project_name="fraud-detection",
            stack_name="dev",
            work_dir="."
        )

        self.assertEqual(detector.project_name, "fraud-detection")
        self.assertEqual(detector.stack_name, "dev")
        self.assertEqual(detector.work_dir, ".")
        self.assertIsNone(detector.stack)

    @patch('pulumi.automation.select_stack')
    def test_initialize_stack_success(self, mock_select_stack):
        """Test successful stack initialization"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.initialize_stack()

        self.assertTrue(result)
        self.assertIsNotNone(detector.stack)

    @patch('pulumi.automation.select_stack')
    def test_initialize_stack_failure(self, mock_select_stack):
        """Test stack initialization failure"""
        from lib.drift_detector import DriftDetector

        # Mock exception during stack selection
        mock_select_stack.side_effect = Exception("Stack not found")

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.initialize_stack()

        self.assertFalse(result)
        self.assertIsNone(detector.stack)

    def test_refresh_stack_without_initialization(self):
        """Test refresh_stack when stack is not initialized"""
        from lib.drift_detector import DriftDetector

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.refresh_stack()

        self.assertFalse(result)

    @patch('pulumi.automation.select_stack')
    def test_refresh_stack_success(self, mock_select_stack):
        """Test successful stack refresh"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.refresh.return_value = Mock()
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.refresh_stack()

        self.assertTrue(result)
        mock_stack_instance.refresh.assert_called_once()

    @patch('pulumi.automation.select_stack')
    def test_refresh_stack_failure(self, mock_select_stack):
        """Test stack refresh failure"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.refresh.side_effect = Exception("Refresh failed")
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.refresh_stack()

        self.assertFalse(result)

    def test_preview_changes_without_initialization(self):
        """Test preview_changes when stack is not initialized"""
        from lib.drift_detector import DriftDetector

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.preview_changes()

        self.assertIsNone(result)

    @patch('pulumi.automation.select_stack')
    def test_preview_changes_no_changes(self, mock_select_stack):
        """Test preview_changes when no changes detected"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_preview_result = Mock()
        mock_preview_result.change_summary = {}
        mock_stack_instance.preview.return_value = mock_preview_result
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.preview_changes()

        self.assertIsNotNone(result)
        self.assertEqual(result["total_changes"], 0)

    @patch('pulumi.automation.select_stack')
    def test_preview_changes_with_changes(self, mock_select_stack):
        """Test preview_changes with detected changes"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_preview_result = Mock()
        mock_preview_result.change_summary = {
            "create": 2,
            "update": 3,
            "delete": 1
        }
        mock_stack_instance.preview.return_value = mock_preview_result
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.preview_changes()

        self.assertIsNotNone(result)
        self.assertEqual(result["total_changes"], 6)
        self.assertEqual(result["changes"]["create"], 2)
        self.assertEqual(result["changes"]["update"], 3)
        self.assertEqual(result["changes"]["delete"], 1)

    @patch('pulumi.automation.select_stack')
    def test_preview_changes_failure(self, mock_select_stack):
        """Test preview_changes exception handling"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.preview.side_effect = Exception("Preview failed")
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.preview_changes()

        self.assertIsNone(result)

    def test_get_stack_outputs_without_initialization(self):
        """Test get_stack_outputs when stack is not initialized"""
        from lib.drift_detector import DriftDetector

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.get_stack_outputs()

        self.assertEqual(result, {})

    @patch('pulumi.automation.select_stack')
    def test_get_stack_outputs_success(self, mock_select_stack):
        """Test successful get_stack_outputs"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.outputs.return_value = {
            "vpc_id": Mock(value="vpc-12345"),
            "cluster_arn": Mock(value="arn:aws:ecs:us-east-1:123456789012:cluster/test")
        }
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        detector.initialize_stack()
        result = detector.get_stack_outputs()

        self.assertIsNotNone(result)
        self.assertIn("vpc_id", result)
        self.assertEqual(result["vpc_id"], "vpc-12345")

    @patch('pulumi.automation.select_stack')
    def test_detect_drift_no_changes(self, mock_select_stack):
        """Test detect_drift with no drift"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.refresh.return_value = Mock()
        mock_preview_result = Mock()
        mock_preview_result.change_summary = {}
        mock_stack_instance.preview.return_value = mock_preview_result
        mock_stack_instance.outputs.return_value = {}  # Mock empty outputs
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.detect_drift()

        self.assertIsNotNone(result)
        self.assertFalse(result["has_drift"])

    @patch('pulumi.automation.select_stack')
    def test_detect_drift_with_changes(self, mock_select_stack):
        """Test detect_drift with drift detected"""
        from lib.drift_detector import DriftDetector

        # Mock the workspace and stack
        mock_stack_instance = Mock()
        mock_stack_instance.refresh.return_value = Mock()
        mock_preview_result = Mock()
        mock_preview_result.change_summary = {"update": 5}
        mock_stack_instance.preview.return_value = mock_preview_result
        mock_stack_instance.outputs.return_value = {}  # Mock empty outputs
        mock_select_stack.return_value = mock_stack_instance

        detector = DriftDetector("test-project", "dev", ".")
        result = detector.detect_drift()

        self.assertIsNotNone(result)
        self.assertTrue(result["has_drift"])

    def test_detect_drift_initialization_failure(self):
        """Test detect_drift when initialization fails"""
        from lib.drift_detector import DriftDetector

        with patch('pulumi.automation.LocalWorkspace') as mock_workspace:
            mock_workspace.select_stack.side_effect = Exception("Init failed")

            detector = DriftDetector("test-project", "dev", ".")
            result = detector.detect_drift()

            self.assertIsNone(result)

    @patch('lib.drift_detector.DriftDetector')
    def test_check_all_environments_success(self, mock_detector_class):
        """Test check_all_environments function"""
        from lib.drift_detector import check_all_environments

        # Mock detector instances
        mock_detector = Mock()
        mock_detector.detect_drift.return_value = {
            "has_drift": False,
            "total_changes": 0
        }
        mock_detector_class.return_value = mock_detector

        results = check_all_environments(
            project_name="test-project",
            environments=["dev", "staging"],
            work_dir="."
        )

        self.assertIsNotNone(results)
        self.assertIn("environments", results)
        self.assertEqual(len(results["environments"]), 2)

    @patch('lib.drift_detector.DriftDetector')
    def test_check_all_environments_with_drift(self, mock_detector_class):
        """Test check_all_environments with drift in one environment"""
        from lib.drift_detector import check_all_environments

        # Mock detector instances - one with drift, one without
        def side_effect_detect(*args, **kwargs):
            if mock_detector_class.call_count == 1:
                return {"has_drift": True, "total_changes": 3}
            else:
                return {"has_drift": False, "total_changes": 0}

        mock_detector = Mock()
        mock_detector.detect_drift.side_effect = side_effect_detect
        mock_detector_class.return_value = mock_detector

        results = check_all_environments(
            project_name="test-project",
            environments=["dev", "prod"],
            work_dir="."
        )

        self.assertIsNotNone(results)
        self.assertIn("environments", results)
        self.assertEqual(len(results["environments"]), 2)

    @patch('sys.argv', ['drift_detector.py', '--project', 'test', '--environments', 'dev', 'staging', '--work-dir', '.'])
    @patch('lib.drift_detector.check_all_environments')
    def test_main_function_with_args(self, mock_check_all):
        """Test main function with command line arguments"""
        from lib.drift_detector import main

        mock_check_all.return_value = {
            "timestamp": "2025-01-01T00:00:00",
            "project": "test",
            "environments": {
                "dev": {
                    "has_drift": False,
                    "total_changes": 0
                },
                "staging": {
                    "has_drift": False,
                    "total_changes": 0
                }
            },
            "summary": {
                "total_environments": 2,
                "environments_with_drift": 0,
                "total_changes": 0
            }
        }

        # Execute main (it should run without errors)
        try:
            result = main()
            # Main returns 0 on success, 1 on drift
            self.assertIn(result, [0, 1])
        except SystemExit as e:
            # Main might call sys.exit()
            self.assertIn(e.code, [0, 1])

    @patch('sys.argv', ['drift_detector.py', '--project', 'test', '--stack', 'dev'])
    @patch('lib.drift_detector.DriftDetector')
    def test_main_function_single_stack(self, mock_detector_class):
        """Test main function with single stack"""
        from lib.drift_detector import main

        mock_detector = Mock()
        mock_detector.detect_drift.return_value = {
            "has_drift": False,
            "total_changes": 0,
            "timestamp": "2025-01-01T00:00:00"
        }
        mock_detector_class.return_value = mock_detector

        try:
            result = main()
            self.assertIn(result, [0, 1])
        except SystemExit as e:
            self.assertIn(e.code, [0, 1])

    @patch('sys.argv', ['drift_detector.py'])
    @patch('lib.drift_detector.check_all_environments')
    def test_main_function_default_args(self, mock_check_all):
        """Test main function with default arguments"""
        from lib.drift_detector import main

        mock_check_all.return_value = []

        try:
            result = main()
            self.assertIsNotNone(result)
        except SystemExit:
            pass  # Expected behavior

    def test_drift_detector_work_dir_default(self):
        """Test DriftDetector with default work_dir"""
        from lib.drift_detector import DriftDetector

        detector = DriftDetector("test-project", "dev")
        self.assertEqual(detector.work_dir, ".")


if __name__ == "__main__":
    unittest.main()
