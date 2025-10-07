"""
test_create_lambda_package.py

Unit tests for the Lambda package creation script.
"""

import unittest
from unittest.mock import patch, MagicMock, mock_open, call
import os
import sys
import zipfile
import shutil

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from create_lambda_package import create_lambda_package


class TestCreateLambdaPackage(unittest.TestCase):
    """Test cases for Lambda package creation."""

    @patch('create_lambda_package.shutil.rmtree')
    @patch('create_lambda_package.shutil.copy')
    @patch('create_lambda_package.zipfile.ZipFile')
    @patch('create_lambda_package.os.walk')
    @patch('create_lambda_package.subprocess.run')
    @patch('create_lambda_package.os.makedirs')
    @patch('create_lambda_package.os.path.exists')
    def test_create_lambda_package_success(
        self, mock_exists, mock_makedirs, mock_subprocess,
        mock_walk, mock_zipfile, mock_copy, mock_rmtree
    ):
        """Test successful Lambda package creation."""
        # Mock os.path.exists to return True for cleanup, False for creation
        mock_exists.return_value = True

        # Mock os.walk to simulate package directory structure
        mock_walk.return_value = [
            ('lambda_package', [], ['handler.py', 'PIL.so']),
            ('lambda_package/PIL', [], ['__init__.py', 'Image.py'])
        ]

        # Mock ZipFile context manager
        mock_zip = MagicMock()
        mock_zipfile.return_value.__enter__.return_value = mock_zip

        # Execute function
        create_lambda_package()

        # Verify directory cleanup was performed (called twice - beginning and end)
        self.assertEqual(mock_rmtree.call_count, 2)
        mock_rmtree.assert_any_call('lambda_package')

        # Verify directory was created
        mock_makedirs.assert_called_once_with('lambda_package')

        # Verify pip install was called
        mock_subprocess.assert_called_once()
        subprocess_args = mock_subprocess.call_args[0][0]
        self.assertEqual(subprocess_args[0], 'pip')
        self.assertEqual(subprocess_args[1], 'install')
        self.assertIn('Pillow==10.2.0', subprocess_args)

        # Verify Lambda handler was copied
        mock_copy.assert_called_once_with(
            'lambda_handler.py',
            os.path.join('lambda_package', 'handler.py')
        )

        # Verify ZIP file was created
        mock_zipfile.assert_called_once_with(
            'lambda_code.zip', 'w', zipfile.ZIP_DEFLATED
        )

        # Verify files were added to ZIP
        self.assertTrue(mock_zip.write.called)

        # Verify cleanup after ZIP creation
        self.assertEqual(mock_rmtree.call_count, 2)

    @patch('create_lambda_package.shutil.rmtree')
    @patch('create_lambda_package.os.makedirs')
    @patch('create_lambda_package.os.path.exists')
    def test_create_lambda_package_directory_creation(
        self, mock_exists, mock_makedirs, mock_rmtree
    ):
        """Test directory creation when it doesn't exist."""
        # Mock that directory doesn't exist
        mock_exists.return_value = False

        with patch('create_lambda_package.subprocess.run'):
            with patch('create_lambda_package.shutil.copy'):
                with patch('create_lambda_package.zipfile.ZipFile'):
                    with patch('create_lambda_package.os.walk', return_value=[]):
                        create_lambda_package()

                        # Verify rmtree was not called for non-existent directory
                        # Only called once at the end for cleanup
                        self.assertEqual(mock_rmtree.call_count, 1)

                        # Verify directory was created
                        mock_makedirs.assert_called_once_with('lambda_package')

    @patch('create_lambda_package.subprocess.run')
    @patch('create_lambda_package.os.makedirs')
    @patch('create_lambda_package.os.path.exists')
    def test_pip_install_failure(self, mock_exists, mock_makedirs, mock_subprocess):
        """Test handling of pip install failure."""
        mock_exists.return_value = False

        # Mock subprocess to raise exception
        mock_subprocess.side_effect = Exception("pip install failed")

        # Execute and expect exception
        with self.assertRaises(Exception) as context:
            create_lambda_package()

        self.assertIn("pip install failed", str(context.exception))


if __name__ == '__main__':
    unittest.main()