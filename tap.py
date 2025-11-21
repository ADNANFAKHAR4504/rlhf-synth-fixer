#!/usr/bin/env python3
"""
Pulumi entry point for VPC infrastructure deployment.
"""
import pulumi
from lib.tap_stack import create_vpc_infrastructure

# Get environment suffix from Pulumi config
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Create VPC infrastructure
create_vpc_infrastructure(environment_suffix)
