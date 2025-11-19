"""Naming module for consistent resource naming across environments."""
from typing import Dict
import hashlib
import uuid


class NamingModule:
    """Generate standardized resource names following pattern: {env}-{region}-{service}-{resource}"""

    def __init__(self, environment: str, region: str, environment_suffix: str, stack_id: str = None):
        self.environment = environment
        self.region = region
        self.environment_suffix = environment_suffix
        # Generate a unique identifier for this naming instance to avoid conflicts
        # Include stack_id if provided to ensure uniqueness across different stack instances
        # Use UUID as fallback to ensure uniqueness even with same inputs
        if stack_id:
            unique_str = f"{environment}-{region}-{environment_suffix}-{stack_id}"
        else:
            # Use UUID to ensure uniqueness when stack_id is not available
            # This ensures each deployment gets unique resource names to avoid conflicts
            unique_str = f"{environment}-{region}-{environment_suffix}-{str(uuid.uuid4())}"
        self.unique_suffix = hashlib.md5(unique_str.encode()).hexdigest()[:8]

    def generate_name(self, service: str, resource: str) -> str:
        """Generate resource name following standard pattern."""
        return f"{self.environment}-{self.region}-{service}-{resource}-{self.environment_suffix}"

    def generate_simple_name(self, resource: str) -> str:
        """Generate simple resource name with environment suffix."""
        return f"{self.environment}-{resource}-{self.environment_suffix}"

    def generate_unique_name(self, resource: str) -> str:
        """Generate unique resource name with unique suffix to avoid conflicts."""
        return f"{self.environment}-{resource}-{self.environment_suffix}-{self.unique_suffix}"

    def generate_unique_ssm_path(self, key: str) -> str:
        """Generate unique SSM parameter path to avoid conflicts."""
        return f"/{self.environment}/{key}-{self.unique_suffix}"
