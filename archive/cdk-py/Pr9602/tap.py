#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get context from cdk.json or use defaults
env_name = app.node.try_get_context("environment") or "dev"
environment_suffix = app.node.try_get_context("environmentSuffix") or "001"

# Environment configurations from context
env_configs = {
    "dev": {
        "kinesis_shard_count": 1,
        "lambda_memory_mb": 512,
        "dynamodb_read_capacity": 5,
        "dynamodb_write_capacity": 5,
        "error_threshold_percent": 10,
        "log_retention_days": 7,
        "enable_pitr": False,
        "enable_versioning": False,
        "enable_xray": False,
        "alarm_email": "dev-alerts@example.com",
        "region": "us-east-1"
    },
    "staging": {
        "kinesis_shard_count": 2,
        "lambda_memory_mb": 1024,
        "dynamodb_read_capacity": 10,
        "dynamodb_write_capacity": 10,
        "error_threshold_percent": 5,
        "log_retention_days": 14,
        "enable_pitr": True,
        "enable_versioning": True,
        "enable_xray": True,
        "alarm_email": "staging-alerts@example.com",
        "region": "us-east-1"
    },
    "prod": {
        "kinesis_shard_count": 4,
        "lambda_memory_mb": 2048,
        "dynamodb_read_capacity": 25,
        "dynamodb_write_capacity": 25,
        "error_threshold_percent": 2,
        "log_retention_days": 30,
        "enable_pitr": True,
        "enable_versioning": True,
        "enable_xray": True,
        "alarm_email": "prod-alerts@example.com",
        "region": "us-east-1"
    }
}

# Get environment configuration
env_config = env_configs.get(env_name, env_configs["dev"])

# Deploy stack
TapStack(
    app,
    f"TapStack-{env_name}-{environment_suffix}",
    env_name=env_name,
    env_config=env_config,
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=env_config["region"]
    ),
)

app.synth()

