#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs


# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config (required)
environment_suffix = config.require("environmentSuffix")

# Get AWS region from config or use default
region = config.get("region") or "us-east-1"

# Get availability zones from config or use defaults for us-east-1
azs_config = config.get("availabilityZones")
if azs_config:
    availability_zones = azs_config.split(",")
else:
    availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Additional tags
additional_tags = {
    "DeployedBy": "Pulumi",
    "DeployedAt": datetime.now(timezone.utc).isoformat()
}

# Create TapStack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    region=region,
    availability_zones=availability_zones,
    tags=additional_tags
)

# Instantiate the TapStack
stack = TapStack("payment-platform", stack_args)
