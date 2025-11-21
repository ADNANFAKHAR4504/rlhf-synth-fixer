#!/usr/bin/env python3
"""
AWS CDK Application entry point for Multi-Environment Fraud Detection Pipeline.

This module defines the CDK application and instantiates the TapStack with
environment-specific configurations for dev, staging, and production environments.
"""
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = (
    app.node.try_get_context("environmentSuffix") or
    os.environ.get("ENVIRONMENT_SUFFIX", "default")
)

# Define environment configurations
environments = {
    "dev": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "us-east-1",
        "config": {
            "kinesis_shard_count": 1,
            "lambda_memory_mb": 512,
            "dynamodb_read_capacity": 5,
            "dynamodb_write_capacity": 5,
            "error_threshold_percent": 10,
            "log_retention_days": 7,
            "enable_tracing": False,
            "enable_pitr": False,
            "enable_versioning": False,
        }
    },
    "staging": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "us-west-2",
        "config": {
            "kinesis_shard_count": 2,
            "lambda_memory_mb": 1024,
            "dynamodb_read_capacity": 10,
            "dynamodb_write_capacity": 10,
            "error_threshold_percent": 5,
            "log_retention_days": 14,
            "enable_tracing": True,
            "enable_pitr": True,
            "enable_versioning": True,
        }
    },
    "prod": {
        "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
        "region": "us-east-1",
        "config": {
            "kinesis_shard_count": 4,
            "lambda_memory_mb": 2048,
            "dynamodb_read_capacity": 25,
            "dynamodb_write_capacity": 25,
            "error_threshold_percent": 2,
            "log_retention_days": 30,
            "enable_tracing": True,
            "enable_pitr": True,
            "enable_versioning": True,
        }
    }
}

# Deploy to the environment specified in context or default to dev
deploy_env = app.node.try_get_context("environment") or "dev"

if deploy_env not in environments:
    raise ValueError(
        f"Invalid environment: {deploy_env}. "
        f"Must be one of: {list(environments.keys())}"
    )

env_config = environments[deploy_env]

# Create stack with standard naming: TapStack{environmentSuffix}
TapStack(
    app,
    f"TapStack{environment_suffix}",
    env_name=deploy_env,
    env_config=env_config["config"],
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=env_config["account"],
        region=env_config["region"]
    ),
    description=(
        f"Multi-Environment Fraud Detection Pipeline - {deploy_env} environment"
    ),
    tags={
        "Environment": deploy_env,
        "Project": "FraudDetection",
        "ManagedBy": "CDK",
        "CostCenter": f"fraud-detection-{deploy_env}",
    }
)

app.synth()
