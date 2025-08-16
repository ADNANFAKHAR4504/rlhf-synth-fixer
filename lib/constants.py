"""Constants for tap_stack testing and configuration."""

# Module constants for testing
PROJECT_NAME = "tap-ds-demo"
AWS_REGION = "us-east-1"
ENVIRONMENT = "dev"
INSTANCE_TYPE = "t3.micro"
DEPLOYMENT_ID = "1234"

def get_resource_name(resource_type: str) -> str:
    """Generate resource name based on project constants."""
    return f"{PROJECT_NAME}-{ENVIRONMENT}-{resource_type}-{DEPLOYMENT_ID}"

def get_short_name(resource_type: str, max_length: int = 32) -> str:
    """Generate short resource name with length limit."""
    short_name = f"{PROJECT_NAME}-{resource_type}-{DEPLOYMENT_ID}"
    if len(short_name) > max_length:
        available_chars = max_length - len(f"-{DEPLOYMENT_ID}")
        truncated = f"{PROJECT_NAME}-{resource_type}"[:available_chars]
        short_name = f"{truncated}-{DEPLOYMENT_ID}"
    return short_name

def calculate_ipv6_cidr(vpc_cidr: str, subnet_index: int) -> str:
    """Calculate IPv6 CIDR for subnet based on VPC CIDR."""
    import ipaddress
    net = ipaddress.IPv6Network(vpc_cidr)
    subnets = list(net.subnets(new_prefix=64))
    return str(subnets[subnet_index])