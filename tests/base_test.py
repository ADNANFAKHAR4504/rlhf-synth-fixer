"""
Base test class with common setup for unit and integration tests.
"""

import os
import sys
import unittest

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "lib"))
# Add the tests directory to the path so we can import utils
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import the function to test
try:
    from tap_stack import create_infrastructure
except ImportError:
    # Fallback for testing without the actual module
    create_infrastructure = None

# Import shared utilities
from utils import (
    test_nat_gateway_placement,
    validate_cidr_blocks,
    validate_nat_gateway_configuration,
    validate_region_cidr_mapping,
    validate_security_tiers,
    validate_subnet_calculation,
)


class BaseTestCase(unittest.TestCase):
    """Base test case with common setup and utilities."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_environment = "test"
        self.test_team = "platform"
        self.test_project = "tap"
