#!/usr/bin/env python3
"""
Payment Processing Infrastructure CDK Application

This application deploys a comprehensive payment processing infrastructure with:
- Lambda, DynamoDB, API Gateway, S3, CloudWatch
- VPC, NAT Gateway, EC2 Auto Scaling
- Advanced security: WAF, GuardDuty, Secrets Manager
- Reliability: SQS with DLQ, SNS for alerts
- Compliance: AWS Config Rules, EventBridge automation
- Observability: CloudWatch Alarms, Dashboards, Systems Manager
"""
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get(
    "ENVIRONMENT_SUFFIX", "dev"
)

# Get AWS region from lib/AWS_REGION or default to us-east-1
region = "us-east-1"
try:
    with open("lib/AWS_REGION", "r", encoding="utf-8") as f:
        region = f.read().strip()
except FileNotFoundError:
    pass

# Get AWS account from environment or use default
account = os.environ.get("CDK_DEFAULT_ACCOUNT")

# Create the main stack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=account,
        region=region,
    ),
    description=f"Payment Processing Infrastructure Stack ({environment_suffix})",
)

app.synth()
