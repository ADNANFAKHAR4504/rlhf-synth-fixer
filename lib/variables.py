"""
Variables and configuration for multi-region deployment
"""

# Region configurations
REGION_CONFIGS = {
    "us-east-1": {
        "cidr": "10.0.0.0/16",
        "availability_zones": ["us-east-1a", "us-east-1b", "us-east-1c"]
    },
    "us-east-2": {
        "cidr": "10.1.0.0/16",
        "availability_zones": ["us-east-2a", "us-east-2b", "us-east-2c"]
    },
    "eu-west-1": {
        "cidr": "10.2.0.0/16",
        "availability_zones": ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
    }
}

# Workspace configurations
WORKSPACE_CONFIGS = {
    "dev": {
        "instance_type": "db.t3.small",
        "lambda_memory": 256,
        "backup_retention": 1
    },
    "staging": {
        "instance_type": "db.t3.medium",
        "lambda_memory": 512,
        "backup_retention": 7
    },
    "prod": {
        "instance_type": "db.r5.large",
        "lambda_memory": 1024,
        "backup_retention": 30
    }
}


def validate_cidr_overlap(cidrs: list[str]) -> bool:
    """
    Validate that CIDR blocks do not overlap
    """
    # Basic validation - in production would use ipaddress module
    octets_set = set()
    for cidr in cidrs:
        second_octet = cidr.split('.')[1]
        if second_octet in octets_set:
            return False
        octets_set.add(second_octet)
    return True


def validate_required_tags(tags: dict) -> bool:
    """
    Validate that required tags are present
    """
    required_tags = ["Environment", "Region", "CostCenter"]
    return all(tag in tags for tag in required_tags)
