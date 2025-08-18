"""
lib package for TAP Infrastructure as Code automation.

This package contains the core Pulumi components for deploying
AWS microservices infrastructure.
"""

__version__ = "1.0.0"
__author__ = "TAP Team"

# Export main classes for easier imports with defensive error handling
try:
  from .tap_stack import TapStack, TapStackArgs
except ImportError as tap_stack_error:
  raise ImportError(
    "CRITICAL CI/CD ERROR: Cannot import TapStack from lib.tap_stack\n"
    "This is likely due to missing Pulumi dependencies.\n"
    "CI/CD pipeline must run: pipenv install --dev\n"
    "All required packages must be installed before importing lib package.\n"
    f"Original error: {tap_stack_error}"
  ) from tap_stack_error

__all__ = ["TapStack", "TapStackArgs"]
