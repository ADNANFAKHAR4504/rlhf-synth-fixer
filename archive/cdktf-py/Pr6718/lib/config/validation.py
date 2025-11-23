"""
Input validation logic for infrastructure configuration.
Implements validation rules to prevent invalid configurations.
"""

import ipaddress
from typing import List, Optional


class ConfigValidator:
    """Validator for infrastructure configuration parameters."""

    @staticmethod
    def validate_cidr(cidr: str) -> bool:
        """Validate CIDR block format."""
        try:
            ipaddress.ip_network(cidr)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_cidr_non_overlapping(cidrs: List[str]) -> bool:
        """Validate that CIDR blocks do not overlap."""
        networks = []
        for cidr in cidrs:
            try:
                network = ipaddress.ip_network(cidr)
                networks.append(network)
            except ValueError:
                return False

        # Check for overlaps
        for i, net1 in enumerate(networks):
            for net2 in networks[i + 1:]:
                if net1.overlaps(net2):
                    return False
        return True

    @staticmethod
    def validate_container_count(count: int) -> bool:
        """Validate ECS container count (must be positive)."""
        return 0 < count <= 100

    @staticmethod
    def validate_instance_class(instance_class: str) -> bool:
        """Validate RDS instance class format."""
        valid_prefixes = ['db.t3.', 'db.t4g.', 'db.r5.', 'db.r6g.', 'db.r6i.']
        return any(instance_class.startswith(prefix) for prefix in valid_prefixes)

    @staticmethod
    def validate_availability_zones(az_count: int, max_azs: int = 6) -> bool:
        """Validate availability zone count."""
        return 1 <= az_count <= max_azs

    @staticmethod
    def validate_environment_suffix(suffix: str) -> bool:
        """Validate environment suffix format."""
        if not suffix:
            return False
        # Must be alphanumeric with hyphens, 1-50 chars
        return len(suffix) <= 50 and all(c.isalnum() or c == '-' for c in suffix)

    @staticmethod
    def validate_all(config: dict) -> tuple[bool, Optional[str]]:
        """Validate all configuration parameters. Returns (is_valid, error_message)."""
        # Validate CIDR
        if not ConfigValidator.validate_cidr(config.get('vpc_cidr', '')):
            return False, f"Invalid CIDR block: {config.get('vpc_cidr')}"

        # Validate container count
        count = config.get('ecs_container_count', 0)
        if not ConfigValidator.validate_container_count(count):
            return False, f"Invalid container count: {count}. Must be between 1 and 100."

        # Validate instance class
        instance_class = config.get('rds_instance_class', '')
        if not ConfigValidator.validate_instance_class(instance_class):
            return False, f"Invalid RDS instance class: {instance_class}"

        # Validate AZ count
        az_count = config.get('availability_zones', 0)
        if not ConfigValidator.validate_availability_zones(az_count):
            return False, f"Invalid AZ count: {az_count}. Must be between 1 and 6."

        return True, None
