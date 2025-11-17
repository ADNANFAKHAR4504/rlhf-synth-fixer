"""Naming module for consistent resource naming across environments."""
from typing import Dict


class NamingModule:
    """Generate standardized resource names following pattern: {env}-{region}-{service}-{resource}"""

    def __init__(self, environment: str, region: str, environment_suffix: str):
        self.environment = environment
        self.region = region
        self.environment_suffix = environment_suffix

    def generate_name(self, service: str, resource: str) -> str:
        """Generate resource name following standard pattern."""
        return f"{self.environment}-{self.region}-{service}-{resource}-{self.environment_suffix}"

    def generate_simple_name(self, resource: str) -> str:
        """Generate simple resource name with environment suffix."""
        return f"{self.environment}-{resource}-{self.environment_suffix}"
