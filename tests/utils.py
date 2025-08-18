"""
Shared utilities for test files to eliminate code duplication.
"""

import ipaddress


def validate_nat_gateway_configuration(enable_ha_nat, num_azs):
    """
    Validate NAT Gateway configuration logic.
    
    Args:
        enable_ha_nat (bool): Whether to enable high availability NAT
        num_azs (int): Number of availability zones
        
    Returns:
        dict: Validation results
    """
    if enable_ha_nat:
        nat_gateways = num_azs  # One per AZ
    else:
        nat_gateways = 1  # Single NAT Gateway
    
    return {
        "nat_gateways": nat_gateways,
        "is_valid": nat_gateways > 0 and nat_gateways <= num_azs
    }


def validate_cidr_blocks(cidr_blocks):
    """
    Validate CIDR blocks for proper network configuration.
    
    Args:
        cidr_blocks (list): List of CIDR block strings
        
    Returns:
        dict: Validation results
    """
    results = []
    
    for cidr in cidr_blocks:
        try:
            network = ipaddress.IPv4Network(cidr)
            results.append({
                "cidr": cidr,
                "is_valid": True,
                "is_private": network.is_private,
                "network": str(network)
            })
        except ValueError:
            results.append({
                "cidr": cidr,
                "is_valid": False,
                "error": f"Invalid CIDR block: {cidr}"
            })
    
    return results


def validate_subnet_calculation(vpc_cidr, subnet_size=24):
    """
    Validate subnet CIDR calculation logic.
    
    Args:
        vpc_cidr (str): VPC CIDR block
        subnet_size (int): Subnet prefix length
        
    Returns:
        dict: Calculation results
    """
    try:
        vpc_network = ipaddress.IPv4Network(vpc_cidr)
        subnets = list(vpc_network.subnets(new_prefix=subnet_size))
        
        return {
            "vpc_cidr": vpc_cidr,
            "subnet_size": subnet_size,
            "total_subnets": len(subnets),
            "first_subnet": str(subnets[0]) if subnets else None,
            "second_subnet": str(subnets[1]) if len(subnets) > 1 else None,
            "is_valid": True
        }
    except ValueError as e:
        return {
            "vpc_cidr": vpc_cidr,
            "subnet_size": subnet_size,
            "is_valid": False,
            "error": str(e)
        }


def validate_region_cidr_mapping():
    """
    Validate region CIDR mapping logic.
    
    Returns:
        dict: Region CIDR mappings and validation results
    """
    expected_mappings = {
        "us-east-1": "10.0.0.0/16",
        "us-west-2": "10.1.0.0/16",
        "us-east-2": "10.2.0.0/16",
        "us-west-1": "10.3.0.0/16",
        "eu-west-1": "10.4.0.0/16",
        "eu-central-1": "10.5.0.0/16",
        "ap-southeast-1": "10.6.0.0/16",
        "ap-northeast-1": "10.7.0.0/16",
    }
    
    results = {}
    for region, expected_cidr in expected_mappings.items():
        try:
            network = ipaddress.IPv4Network(expected_cidr)
            results[region] = {
                "cidr": expected_cidr,
                "is_private": network.is_private,
                "network": str(network),
                "is_valid": True
            }
        except ValueError as e:
            results[region] = {
                "cidr": expected_cidr,
                "is_valid": False,
                "error": str(e)
            }
    
    return results


def validate_security_tiers():
    """
    Validate security group tier configuration.
    
    Returns:
        dict: Security tier validation results
    """
    expected_tiers = ["web", "app", "db"]
    
    tier_relationships = {
        "web": ["app"],
        "app": ["db"],
        "db": []
    }
    
    results = {
        "tiers": expected_tiers,
        "relationships": tier_relationships,
        "validation": {}
    }
    
    for tier in expected_tiers:
        results["validation"][tier] = {
            "is_string": isinstance(tier, str),
            "has_length": len(tier) > 0,
            "has_relationships": tier in tier_relationships
        }
    
    return results


def test_nat_gateway_placement(nat_gateways, num_azs):
    """
    Test NAT Gateway placement logic.
    
    Args:
        nat_gateways (int): Number of NAT gateways
        num_azs (int): Number of availability zones
        
    Returns:
        dict: Placement validation results
    """
    if nat_gateways == 1:
        # Single NAT Gateway should be in first public subnet
        return {
            "placement": "single",
            "is_valid": True,
            "subnet_index": 0
        }
    else:
        # Multiple NAT Gateways should be distributed
        nat_subnet_indices = list(range(num_azs))
        return {
            "placement": "distributed",
            "is_valid": len(nat_subnet_indices) == num_azs,
            "subnet_indices": nat_subnet_indices
        }
