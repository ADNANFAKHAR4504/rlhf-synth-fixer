"""
Utility functions for common operations
"""

from typing import Dict

def get_common_tags(environment: str, owner: str, project: str) -> Dict[str, str]:
    """
    Generate common tags for all resources
    """
    return {
        "Environment": environment,
        "Owner": owner,
        "Project": project,
        "ManagedBy": "Pulumi",
        "CreatedDate": "2024-01-01"  # In real implementation, use datetime.now()
    }

def validate_cidr_block(cidr: str) -> bool:
    """
    Validate CIDR block format
    """
    import ipaddress
    try:
        ipaddress.IPv4Network(cidr, strict=False)
        return True
    except ValueError:
        return False
