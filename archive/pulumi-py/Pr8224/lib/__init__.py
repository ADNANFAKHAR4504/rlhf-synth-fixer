"""
TAP Infrastructure Library

Multi-environment infrastructure components for data processing application.
"""

from .tap_stack import TapStack, TapStackArgs, validate_configuration

__all__ = ['TapStack', 'TapStackArgs', 'validate_configuration']
