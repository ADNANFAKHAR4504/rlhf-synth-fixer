"""
test_load_modules.py

Unit tests for the load_modules module
"""

import unittest
from unittest.mock import patch, MagicMock, mock_open
import os
import requests

from lib.load_modules import download_file, download_modules, S3_PUBLIC_BASE_URL, TARGET_MODULES_PATH, MODULES_LIST


class TestLoadModules(unittest.TestCase):
    """Test cases for load_modules functionality."""

    @patch('lib.load_modules.requests.get')
    @patch('lib.load_modules.os.makedirs')
    @patch('builtins.open', new_callable=mock_open)
    def test_download_file_success(self, mock_file, mock_makedirs, mock_get):
        """Test successful file download."""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.iter_content.return_value = [b'chunk1', b'chunk2']
        mock_get.return_value = mock_response

        target_dir = "/test/dir"
        file_name = "test.py"

        download_file(file_name, target_dir)

        # Verify requests.get was called with correct URL
        expected_url = f"{S3_PUBLIC_BASE_URL}{file_name}"
        mock_get.assert_called_once_with(expected_url, stream=True, timeout=30)

        # Verify response.raise_for_status was called
        mock_response.raise_for_status.assert_called_once()

        # Verify directories were created
        expected_path = os.path.join(target_dir, file_name)
        mock_makedirs.assert_called_once_with(
            os.path.dirname(expected_path), exist_ok=True)

        # Verify file was opened for writing
        mock_file.assert_called_once_with(expected_path, "wb")

        # Verify chunks were written
        handle = mock_file.return_value.__enter__.return_value
        handle.write.assert_any_call(b'chunk1')
        handle.write.assert_any_call(b'chunk2')

    @patch('lib.load_modules.requests.get')
    def test_download_file_http_error(self, mock_get):
        """Test download_file handles HTTP errors."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "404 Not Found")
        mock_get.return_value = mock_response

        with self.assertRaises(requests.exceptions.HTTPError):
            download_file("nonexistent.py", "/test/dir")

    @patch('lib.load_modules.download_file')
    @patch('lib.load_modules.os.path.exists')
    @patch('lib.load_modules.shutil.rmtree')
    @patch('lib.load_modules.os.makedirs')
    def test_download_modules_with_existing_dir(
            self,
            mock_makedirs,
            mock_rmtree,
            mock_exists,
            mock_download_file):
        """Test download_modules when target directory exists."""
        mock_exists.return_value = True

        download_modules()

        # Verify existing directory was removed
        mock_rmtree.assert_called_once_with(TARGET_MODULES_PATH)

        # Verify new directory was created
        mock_makedirs.assert_called_once_with(
            TARGET_MODULES_PATH, exist_ok=True)

        # Verify all modules were downloaded
        self.assertEqual(mock_download_file.call_count, len(MODULES_LIST))
        for module in MODULES_LIST:
            mock_download_file.assert_any_call(module, TARGET_MODULES_PATH)

    @patch('lib.load_modules.download_file')
    @patch('lib.load_modules.os.path.exists')
    @patch('lib.load_modules.shutil.rmtree')
    @patch('lib.load_modules.os.makedirs')
    def test_download_modules_without_existing_dir(
            self, mock_makedirs, mock_rmtree, mock_exists, mock_download_file):
        """Test download_modules when target directory doesn't exist."""
        mock_exists.return_value = False

        download_modules()

        # Verify rmtree was not called since directory doesn't exist
        mock_rmtree.assert_not_called()

        # Verify new directory was created
        mock_makedirs.assert_called_once_with(
            TARGET_MODULES_PATH, exist_ok=True)

        # Verify all modules were downloaded
        self.assertEqual(mock_download_file.call_count, len(MODULES_LIST))

    def test_constants(self):
        """Test that module constants are properly defined."""
        self.assertIsInstance(S3_PUBLIC_BASE_URL, str)
        self.assertIsInstance(TARGET_MODULES_PATH, str)
        self.assertIsInstance(MODULES_LIST, list)
        self.assertGreater(len(MODULES_LIST), 0)

        # Check that S3 URL is well-formed
        self.assertTrue(S3_PUBLIC_BASE_URL.startswith('https://'))
        self.assertTrue(S3_PUBLIC_BASE_URL.endswith('/'))

        # Check that target path contains expected components
        self.assertIn('lib', TARGET_MODULES_PATH)
        self.assertIn('modules', TARGET_MODULES_PATH)


if __name__ == '__main__':
    unittest.main()

