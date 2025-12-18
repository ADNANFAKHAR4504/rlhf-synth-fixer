"""
Main Pulumi program for VPC peering infrastructure.

This program orchestrates the creation of a secure, cross-region VPC peering
connection between payment and analytics environments with proper tagging,
monitoring, and error handling.
"""

import pulumi
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from tap_stack import TapStack, TapStackArgs

# Get configuration with validation
config = pulumi.Config()
environment_suffix = config.get("environment_suffix") or "dev"

# Validate environment suffix format
if not environment_suffix.replace("-", "").replace("_", "").isalnum():
    raise ValueError(
        f"Invalid environment_suffix: {environment_suffix}. "
        "Must be alphanumeric with dashes/underscores only."
    )

# Get optional configuration with defaults
owner = config.get("owner") or "platform-team"
cost_center = config.get("cost_center") or "engineering"

# Get VPC configuration
payment_vpc_id = config.get("payment_vpc_id") or ""
analytics_vpc_id = config.get("analytics_vpc_id") or ""
payment_vpc_cidr = config.get("payment_vpc_cidr") or "10.0.0.0/16"
analytics_vpc_cidr = config.get("analytics_vpc_cidr") or "10.1.0.0/16"
payment_app_subnet_cidr = config.get("payment_app_subnet_cidr") or "10.0.1.0/24"
analytics_api_subnet_cidr = config.get("analytics_api_subnet_cidr") or "10.1.2.0/24"
create_vpcs = config.get_bool("create_vpcs")
if create_vpcs is None:
    create_vpcs = True  # Default to creating VPCs

# Create comprehensive tags
tags = {
    "Environment": environment_suffix,
    "Owner": owner,
    "CostCenter": cost_center,
    "ManagedBy": "Pulumi",
    "Project": "VPC-Peering",
    "Compliance": "PCI-DSS"
}

# Create stack with validated arguments
args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=tags,
    payment_vpc_id=payment_vpc_id,
    analytics_vpc_id=analytics_vpc_id,
    payment_vpc_cidr=payment_vpc_cidr,
    analytics_vpc_cidr=analytics_vpc_cidr,
    payment_app_subnet_cidr=payment_app_subnet_cidr,
    analytics_api_subnet_cidr=analytics_api_subnet_cidr,
    create_vpcs=create_vpcs
)

stack = TapStack("vpc-peering-stack", args)

# Export comprehensive outputs
pulumi.export("peering_connection_id", stack.peering_connection_id)
pulumi.export("peering_status", stack.peering_status)
pulumi.export("payment_vpc_id", stack.payment_vpc_id_output)
pulumi.export("analytics_vpc_id", stack.analytics_vpc_id_output)
pulumi.export("payment_security_group_id", stack.payment_sg_id)
pulumi.export("analytics_security_group_id", stack.analytics_sg_id)
pulumi.export("dns_resolution_enabled", stack.dns_resolution_enabled)
