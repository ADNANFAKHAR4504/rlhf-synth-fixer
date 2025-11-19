#!/usr/bin/env python3
import os
from aws_cdk import App, Environment, Aspects
from lib.payment_stack import PaymentStack
from lib.tagging_aspect import MandatoryTagsAspect

app = App()

# Get environment from context (default to 'dev')
env_name = app.node.try_get_context("env") or "dev"

# Get ENVIRONMENT_SUFFIX from environment variable or default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "syntht7j2q6")

# Environment-specific configurations - ALL USE us-east-1 per PROMPT requirements
env_configs = {
    "dev": {
        "environment": "dev",
        "region": "us-east-1",
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 100,
        "cost_center": "Engineering",
        "owner": "DevTeam",
        "data_classification": "Internal",
    },
    "staging": {
        "environment": "staging",
        "region": "us-east-1",  # CORRECTED: Changed from us-east-2 to us-east-1
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 1000,
        "cost_center": "Engineering",
        "owner": "StagingTeam",
        "data_classification": "Confidential",
    },
    "production": {
        "environment": "production",
        "region": "us-east-1",
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "api_rate_limit": 10000,
        "cost_center": "Finance",
        "owner": "ProductionTeam",
        "data_classification": "Restricted",
    },
}

# Get configuration for the selected environment
config = env_configs.get(env_name)
if not config:
    raise ValueError(f"Invalid environment: {env_name}. Must be one of: dev, staging, production")

# Create stack - CORRECTED: Use ENVIRONMENT_SUFFIX from environment
stack = PaymentStack(
    app,
    f"PaymentStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env_config=config,
    env=Environment(
        account=config["account"],
        region=config["region"],
    ),
    description=f"Payment processing infrastructure for {env_name} environment",
)

# Apply mandatory tags aspect
mandatory_tags = {
    "Environment": config["environment"],
    "CostCenter": config["cost_center"],
    "Owner": config["owner"],
    "DataClassification": config["data_classification"],
}
Aspects.of(stack).add(MandatoryTagsAspect(mandatory_tags))

app.synth()
