"""
Serverless Transaction Processing System
Pulumi Python implementation for financial transaction processing
with fraud detection, API Gateway, Lambda, DynamoDB, and SQS
"""

import os
import sys

# Add lib directory to path
sys.path.insert(0, os.path.dirname(__file__))

import pulumi
import pulumi_aws as aws
from tap_stack import TapStack, TapStackArgs

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# AWS Region - use us-east-1 to match existing deployment
region = "us-east-1"

# Create default tags
default_tags = {
    "Project": pulumi.get_project(),
    "Stack": pulumi.get_stack(),
    "Environment": environment_suffix,
    "ManagedBy": "Pulumi"
}

# Instantiate the TapStack component resource
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=default_tags
)

tap_stack = TapStack(
    "TapStack",
    stack_args
)

# Export key outputs
pulumi.export("api_endpoint", pulumi.Output.all(
    tap_stack.api_gateway.id
).apply(
    lambda args: f"https://{args[0]}.execute-api.{region}.amazonaws.com/{environment_suffix}"
))
pulumi.export("dashboard_url", tap_stack.dashboard.dashboard_name.apply(
    lambda name: (
        f"https://console.aws.amazon.com/cloudwatch/home?"
        f"region={region}#dashboards:name={name}"
    )
))
pulumi.export("merchant_table_name", tap_stack.merchant_table.name)
pulumi.export("transaction_table_name", tap_stack.transaction_table.name)
pulumi.export("queue_url", tap_stack.transaction_queue.url)
pulumi.export("sns_topic_arn", tap_stack.fraud_alert_topic.arn)
pulumi.export("validation_lambda_arn", tap_stack.validation_lambda.arn)
pulumi.export("fraud_detection_lambda_arn", tap_stack.fraud_detection_lambda.arn)
pulumi.export("failed_transaction_lambda_arn", tap_stack.failed_transaction_lambda.arn)
