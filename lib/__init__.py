"""
lib package for TAP Infrastructure as Code automation.

This package contains the core Pulumi components for deploying
AWS microservices infrastructure.
"""

__version__ = "1.0.0"
__author__ = "TAP Team"

# Export main classes for easier imports
from .tap_stack import TapStack, TapStackArgs

__all__ = ["TapStack", "TapStackArgs"]
