"""Unit tests for tap_stack.py"""
import pytest

from lib.tap_stack import TapStackArgs


def test_tap_stack_args_initialization():
    """Test TapStackArgs initialization with different parameters"""
    # Test with no arguments - should get defaults
    args = TapStackArgs()
    assert args.environment_suffix == 'dev'  # Default value from constructor
    assert args.tags is None  # Default value from constructor
    
    # Test with custom environment suffix
    args = TapStackArgs(environment_suffix='prod')
    assert args.environment_suffix == 'prod'
    
    # Test with custom tags
    test_tags = {'environment': 'dev', 'project': 'tap'}
    args = TapStackArgs(tags=test_tags)
    assert args.tags == test_tags
    assert args.environment_suffix == 'dev'  # Should still have default value
    
    # Test with both arguments
    args = TapStackArgs(environment_suffix='staging', tags=test_tags)
    assert args.environment_suffix == 'staging'
    assert args.tags == test_tags
