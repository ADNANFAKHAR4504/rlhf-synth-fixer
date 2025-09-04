"""
TAP Infrastructure Library

This package contains the main infrastructure components for the TAP (Test Automation Platform) project.
"""

# Import main components for easier access
try:
  from .cloudtrail_config import (get_cloudtrail_name,
                                  get_existing_cloudtrail_name_pattern,
                                  should_skip_cloudtrail_creation,
                                  should_skip_iam_creation,
                                  should_use_existing_cloudtrail)
  from .tap_stack import TapStack, TapStackArgs, deploy_infrastructure
except ImportError:
  # Fallback for when running tests
  pass

__version__ = "1.0.0"
__author__ = "TAP Team"
