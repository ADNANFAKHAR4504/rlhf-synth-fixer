"""Unit tests for tap_stack.py"""
import pytest

from lib.tap_stack import TapStackArgs


def test_tap_stack_args_initialization():
    """Test TapStackArgs initialization with different parameters"""
    # Test with no arguments
    args = TapStackArgs()
    assert not hasattr(args, 'environment_suffix')
    assert not hasattr(args, 'tags')
    
    # Test with environment suffix
    args = TapStackArgs()
    args.environment_suffix = 'dev'
    assert args.environment_suffix == 'dev'
    
    # Test with tags
    args = TapStackArgs()
    args.tags = {'environment': 'dev', 'project': 'tap'}
    assert args.tags == {'environment': 'dev', 'project': 'tap'}