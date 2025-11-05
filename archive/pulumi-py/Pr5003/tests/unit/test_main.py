"""
Unit tests for __main__.py entry point.
"""

import os
import sys
from unittest.mock import patch, MagicMock
import pytest


def test_main_imports():
    """Test that main module can be imported successfully."""
    # Import should work without errors
    import lib.__main__
    assert lib.__main__ is not None


def test_main_environment_suffix_default():
    """Test that environment suffix defaults to synth7196603919."""
    with patch.dict(os.environ, {}, clear=True):
        # Remove from sys.modules to force re-import
        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']

        import lib.__main__
        assert lib.__main__.environment_suffix == 'synth7196603919'


def test_main_environment_suffix_from_env():
    """Test that environment suffix can be set via environment variable."""
    with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test123'}):
        # Remove from sys.modules to force re-import
        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']

        import lib.__main__
        assert lib.__main__.environment_suffix == 'test123'


def test_main_aws_region():
    """Test that AWS region is set to eu-central-1."""
    import lib.__main__
    assert lib.__main__.aws_region == 'eu-central-1'


def test_main_tags_structure():
    """Test that tags dictionary has correct structure."""
    import lib.__main__
    assert 'Environment' in lib.__main__.tags
    assert 'ManagedBy' in lib.__main__.tags
    assert 'Project' in lib.__main__.tags
    assert lib.__main__.tags['ManagedBy'] == 'Pulumi'
    assert lib.__main__.tags['Project'] == 'IoTSensorDataProcessing'


def test_main_tags_environment_matches_suffix():
    """Test that tags Environment matches environment_suffix."""
    import lib.__main__
    assert lib.__main__.tags['Environment'] == lib.__main__.environment_suffix


def test_main_stack_args_creation():
    """Test that TapStackArgs is created with correct parameters."""
    import lib.__main__
    assert lib.__main__.args is not None
    assert lib.__main__.args.environment_suffix == lib.__main__.environment_suffix
    assert lib.__main__.args.tags == lib.__main__.tags


def test_main_stack_creation():
    """Test that TapStack instance is created."""
    import lib.__main__
    assert lib.__main__.stack is not None
    # Stack name should include environment suffix
    assert 'TapStack' in str(lib.__main__.stack)
