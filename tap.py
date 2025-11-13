#!/usr/bin/env python3
"""
CDK application entry point for Single-Region Payment Processing Infrastructure.

This application deploys a complete payment processing solution in us-east-1.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps
from lib.vpc_stack import VpcStack
from lib.database_stack import DatabaseStack
from lib.lambda_stack import LambdaStack
from lib.api_stack import ApiStack
from lib.storage_stack import StorageStack
from lib.monitoring_stack import MonitoringStack
from lib.parameter_store_stack import ParameterStoreStack
# Route53Stack removed - using API Gateway default URL instead
# from lib.route53_stack import Route53Stack

app = cdk.App()

# Get environment suffix
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'

# AWS environment configuration
account = os.getenv('CDK_DEFAULT_ACCOUNT')
region = "us-east-1"

env = cdk.Environment(account=account, region=region)

# Repository metadata
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply global tags
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'PaymentDR')

# Main coordination stack
main_stack = TapStack(
    app,
    f"TapStack{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix, env=env)
)

# VPC STACK

vpc_stack = VpcStack(
    app,
    f"VPC{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env
)

# DATABASE STACK

db_stack = DatabaseStack(
    app,
    f"Database{environment_suffix}",
    vpc=vpc_stack.vpc,
    environment_suffix=environment_suffix,
    env=env
)
db_stack.add_dependency(vpc_stack)

# LAMBDA STACK

lambda_stack = LambdaStack(
    app,
    f"Lambda{environment_suffix}",
    vpc=vpc_stack.vpc,
    environment_suffix=environment_suffix,
    env=env
)
lambda_stack.add_dependency(vpc_stack)

# API GATEWAY STACK

api_stack = ApiStack(
    app,
    f"API{environment_suffix}",
    payment_validation_fn=lambda_stack.payment_validation_fn,
    transaction_processing_fn=lambda_stack.transaction_processing_fn,
    notification_fn=lambda_stack.notification_fn,
    environment_suffix=environment_suffix,
    env=env
)
api_stack.add_dependency(lambda_stack)

# STORAGE STACK

storage_stack = StorageStack(
    app,
    f"Storage{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env
)

# MONITORING STACK

monitoring_stack = MonitoringStack(
    app,
    f"Monitoring{environment_suffix}",
    db_cluster=db_stack.db_cluster,
    lambda_functions=[
        lambda_stack.payment_validation_fn,
        lambda_stack.transaction_processing_fn,
        lambda_stack.notification_fn
    ],
    api=api_stack.api,
    environment_suffix=environment_suffix,
    env=env
)
monitoring_stack.add_dependency(db_stack)
monitoring_stack.add_dependency(lambda_stack)
monitoring_stack.add_dependency(api_stack)

# PARAMETER STORE STACK

param_store_stack = ParameterStoreStack(
    app,
    f"ParameterStore{environment_suffix}",
    db_cluster=db_stack.db_cluster,
    api=api_stack.api,
    environment_suffix=environment_suffix,
    env=env
)
param_store_stack.add_dependency(db_stack)
param_store_stack.add_dependency(api_stack)

# ROUTE53 STACK (Custom Domain) - Skipped for test environment
# Route53 requires a real domain name; API Gateway default URL is used instead
# Custom domain implementation can be added when a registered domain is available

app.synth()
