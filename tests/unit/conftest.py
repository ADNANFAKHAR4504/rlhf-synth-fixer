"""
Pytest configuration file for Compliance Monitoring Stack tests.
"""

import os
import sys

# Add lib directory to Python path for imports
lib_path = os.path.join(os.path.dirname(__file__), "../lib")
if lib_path not in sys.path:
    sys.path.insert(0, lib_path)
