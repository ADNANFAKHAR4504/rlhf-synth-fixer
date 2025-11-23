#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Trading Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles infrastructure deployment
with configurable regions and environment-specific settings.

The stack supports both single-region and multi-region deployments based on configuration.
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get(
    "ENVIRONMENT_SUFFIX", "dev"
)

# Get log retention from context or environment variable
log_retention_days = int(
    app.node.try_get_context("logRetentionDays") or os.environ.get("LOG_RETENTION_DAYS", "7")
)

# Get domain name from context or environment variable
domain_name = app.node.try_get_context("domainName") or os.environ.get("DOMAIN_NAME")

# Get deployment region from context or environment variable (defaults to us-east-1)
deployment_region = app.node.try_get_context("deploymentRegion") or os.environ.get(
    "CDK_DEFAULT_REGION", "us-east-1"
)

# Get metadata for tagging from environment variables (typically set by CI/CD)
repository_name = os.getenv("REPOSITORY", "iac-test-automations")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "trading-platform")
created_at = datetime.now(timezone.utc).isoformat()

# Apply global tags to all resources in this app
Tags.of(app).add("Environment", environment_suffix)
Tags.of(app).add("Repository", repository_name)
Tags.of(app).add("Author", commit_author)
Tags.of(app).add("PRNumber", pr_number)
Tags.of(app).add("Team", team)
Tags.of(app).add("CreatedAt", created_at)
Tags.of(app).add("ManagedBy", "CDK")
Tags.of(app).add("Project", "TradingAutomationPlatform")

# Define primary and secondary regions for multi-region support
PRIMARY_REGION = "us-east-1"
SECONDARY_REGION = "us-west-2"

# Get AWS account from environment
aws_account = os.getenv("CDK_DEFAULT_ACCOUNT")

# Create TapStackProps for the stack
stack_props = TapStackProps(
    environment_suffix=environment_suffix,
    primary_region=PRIMARY_REGION,
    secondary_region=SECONDARY_REGION,
    log_retention_days=log_retention_days,
    domain_name=domain_name,
    env=cdk.Environment(
        account=aws_account,
        region=deployment_region,
    ),
)

# Create the main stack with standardized naming: TapStack{environment_suffix}
tap_stack = TapStack(
    app,
    f"TapStack{environment_suffix}",
    props=stack_props,
    description=f"Trading Automation Platform infrastructure - Region: {deployment_region} - Environment: {environment_suffix}",
)

# Add region-specific tags to the stack
Tags.of(tap_stack).add("Region", deployment_region)
Tags.of(tap_stack).add("DeploymentRegion", deployment_region)

# Synthesize the CDK app
app.synth()
