"""
CDKTF Stacks Module
Multi-Region Disaster Recovery Architecture
"""

from .primary_stack import PrimaryStack
from .secondary_stack import SecondaryStack
from .global_stack import GlobalStack

__all__ = ["PrimaryStack", "SecondaryStack", "GlobalStack"]
