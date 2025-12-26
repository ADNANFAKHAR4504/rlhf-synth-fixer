"""Base classes and utilities for infrastructure components."""

from typing import Optional


class BaseInfrastructureComponent:
    """Base class for infrastructure components with common validation."""
    
    def __init__(self, region: str, tags: Optional[dict] = None):
        self.region = region
        self.tags = tags or {}
        self._validate_inputs()
    
    def _validate_inputs(self):
        """Validate common inputs for all infrastructure components."""
        if not isinstance(self.tags, dict):
            raise ValueError("tags must be a dictionary")
        if not self.region:
            raise ValueError("region must be provided")
