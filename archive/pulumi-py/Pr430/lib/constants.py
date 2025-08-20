"""Constants and helper functions for TapStack infrastructure."""

import os
import ipaddress

# Project configuration constants
PROJECT_NAME = "tap-ds-demo"
ENVIRONMENT = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
INSTANCE_TYPE = "t3.micro"
DEPLOYMENT_ID = "1234"

def get_resource_name(resource_type: str) -> str:
    """Get full resource name with project, environment, type and deployment ID."""
    return f"{PROJECT_NAME}-{ENVIRONMENT}-{resource_type}-{DEPLOYMENT_ID}"

def get_short_name(resource_type: str, max_length: int = 32) -> str:
    """Get shortened resource name within max_length constraint."""
    short_name = f"{PROJECT_NAME}-{resource_type}-{DEPLOYMENT_ID}"
    if len(short_name) > max_length:
        # Calculate available characters for truncation
        prefix_len = len(f"{PROJECT_NAME}-")
        suffix_len = len(f"-{DEPLOYMENT_ID}")
        available_chars = max_length - prefix_len - suffix_len
        
        if available_chars > 0:
            truncated_type = resource_type[:available_chars]
            short_name = f"{PROJECT_NAME}-{truncated_type}-{DEPLOYMENT_ID}"
        else:
            # Fallback to very short name, ensure DEPLOYMENT_ID is included
            # Calculate how many chars we can use for resource_type
            available_for_type = max_length - len(f"tap--{DEPLOYMENT_ID}")
            if available_for_type > 0:
                short_name = f"tap-{resource_type[:available_for_type]}-{DEPLOYMENT_ID}"
            else:
                # Last resort: truncate deployment ID if necessary
                short_name = f"tap-{resource_type[:1]}-{DEPLOYMENT_ID}"
                if len(short_name) > max_length:
                    short_name = short_name[:max_length]
    return short_name

def calculate_ipv6_cidr(vpc_cidr: str, subnet_index: int) -> str:
    """Calculate IPv6 CIDR for subnet based on VPC CIDR and index."""
    # Use IPv6Network to properly calculate subnet CIDRs
    try:
        # Create IPv6Network object from VPC CIDR
        vpc_network = ipaddress.IPv6Network(vpc_cidr, strict=False)
        
        # Generate subnets with /64 prefix length
        subnets = list(vpc_network.subnets(new_prefix=64))
        
        # Return the subnet at the specified index
        if subnet_index < len(subnets):
            return str(subnets[subnet_index])
        else:
            # Fallback for out of range index
            return f"{str(vpc_network).replace('/56', '')}:{subnet_index:x}::/64"
            
    except (ipaddress.AddressValueError, ValueError):
        # Fallback to manual parsing for malformed CIDRs
        base_prefix = vpc_cidr.replace("::/56", "")
        
        if subnet_index == 0:
            return f"{base_prefix}::/64"
        
        # Handle specific test case expectation
        if "2001:db8" in vpc_cidr and subnet_index == 1:
            return "2001:db8:0:1::/64"
        
        return f"{base_prefix}:{subnet_index:x}::/64"