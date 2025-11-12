#!/usr/bin/env python3
"""
CDK application entry point for Multi-Region DR Payment Processing Infrastructure.

This application deploys a complete disaster recovery solution across us-east-1 (primary)
and us-east-2 (secondary) regions.
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
from lib.route53_stack import Route53Stack
from lib.parameter_store_stack import ParameterStoreStack
from lib.failover_stack import FailoverStack

app = cdk.App()

# Get environment suffix
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'

# AWS environment configuration
account = os.getenv('CDK_DEFAULT_ACCOUNT')
primary_region = "us-east-1"
secondary_region = "us-east-2"

primary_env = cdk.Environment(account=account, region=primary_region)
secondary_env = cdk.Environment(account=account, region=secondary_region)

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
    props=TapStackProps(environment_suffix=environment_suffix, env=primary_env)
)

# PRIMARY REGION STACKS (us-east-1)

primary_vpc_stack = VpcStack(
    app,
    f"PrimaryVPC{environment_suffix}",
    environment_suffix=environment_suffix,
    dr_role="primary",
    env=primary_env
)

primary_db_stack = DatabaseStack(
    app,
    f"PrimaryDatabase{environment_suffix}",
    vpc=primary_vpc_stack.vpc,
    environment_suffix=environment_suffix,
    dr_role="primary",
    is_primary=True,
    env=primary_env
)
primary_db_stack.add_dependency(primary_vpc_stack)

primary_lambda_stack = LambdaStack(
    app,
    f"PrimaryLambda{environment_suffix}",
    vpc=primary_vpc_stack.vpc,
    environment_suffix=environment_suffix,
    dr_role="primary",
    env=primary_env
)
primary_lambda_stack.add_dependency(primary_vpc_stack)

primary_api_stack = ApiStack(
    app,
    f"PrimaryAPI{environment_suffix}",
    payment_validation_fn=primary_lambda_stack.payment_validation_fn,
    transaction_processing_fn=primary_lambda_stack.transaction_processing_fn,
    notification_fn=primary_lambda_stack.notification_fn,
    environment_suffix=environment_suffix,
    dr_role="primary",
    env=primary_env
)
primary_api_stack.add_dependency(primary_lambda_stack)

# SECONDARY REGION STACKS (us-east-2)

secondary_vpc_stack = VpcStack(
    app,
    f"SecondaryVPC{environment_suffix}",
    environment_suffix=environment_suffix,
    dr_role="secondary",
    env=secondary_env
)

secondary_db_stack = DatabaseStack(
    app,
    f"SecondaryDatabase{environment_suffix}",
    vpc=secondary_vpc_stack.vpc,
    environment_suffix=environment_suffix,
    dr_role="secondary",
    is_primary=False,
    global_cluster_id=f"payment-global-{environment_suffix}",  # Use string instead of ref
    env=secondary_env
)
secondary_db_stack.add_dependency(secondary_vpc_stack)
secondary_db_stack.add_dependency(primary_db_stack)

secondary_lambda_stack = LambdaStack(
    app,
    f"SecondaryLambda{environment_suffix}",
    vpc=secondary_vpc_stack.vpc,
    environment_suffix=environment_suffix,
    dr_role="secondary",
    env=secondary_env
)
secondary_lambda_stack.add_dependency(secondary_vpc_stack)

secondary_api_stack = ApiStack(
    app,
    f"SecondaryAPI{environment_suffix}",
    payment_validation_fn=secondary_lambda_stack.payment_validation_fn,
    transaction_processing_fn=secondary_lambda_stack.transaction_processing_fn,
    notification_fn=secondary_lambda_stack.notification_fn,
    environment_suffix=environment_suffix,
    dr_role="secondary",
    env=secondary_env
)
secondary_api_stack.add_dependency(secondary_lambda_stack)

# STORAGE WITH CROSS-REGION REPLICATION

secondary_storage_stack = StorageStack(
    app,
    f"SecondaryStorage{environment_suffix}",
    environment_suffix=environment_suffix,
    dr_role="secondary",
    is_primary=False,
    env=secondary_env
)

primary_storage_stack = StorageStack(
    app,
    f"PrimaryStorage{environment_suffix}",
    environment_suffix=environment_suffix,
    dr_role="primary",
    is_primary=True,
    destination_bucket_arn=secondary_storage_stack.bucket.bucket_arn,
    env=primary_env
)
primary_storage_stack.add_dependency(secondary_storage_stack)

# ROUTE 53 (Global - deployed in primary region)
# Note: Commented out due to cross-region reference limitations in CDK
# Route53 should be deployed separately after API Gateway stacks are deployed
# and API IDs are available

# route53_stack = Route53Stack(
#     app,
#     f"Route53{environment_suffix}",
#     primary_api_id=app.node.try_get_context('primaryApiId') or 'placeholder',
#     secondary_api_id=app.node.try_get_context('secondaryApiId') or 'placeholder',
#     environment_suffix=environment_suffix,
#     env=primary_env
# )
# route53_stack.add_dependency(primary_api_stack)
# route53_stack.add_dependency(secondary_api_stack)

# MONITORING (Both regions)

primary_monitoring_stack = MonitoringStack(
    app,
    f"PrimaryMonitoring{environment_suffix}",
    db_cluster=primary_db_stack.db_cluster,
    lambda_functions=[
        primary_lambda_stack.payment_validation_fn,
        primary_lambda_stack.transaction_processing_fn,
        primary_lambda_stack.notification_fn
    ],
    api=primary_api_stack.api,
    environment_suffix=environment_suffix,
    dr_role="primary",
    env=primary_env
)
primary_monitoring_stack.add_dependency(primary_db_stack)
primary_monitoring_stack.add_dependency(primary_lambda_stack)
primary_monitoring_stack.add_dependency(primary_api_stack)

secondary_monitoring_stack = MonitoringStack(
    app,
    f"SecondaryMonitoring{environment_suffix}",
    db_cluster=secondary_db_stack.db_cluster,
    lambda_functions=[
        secondary_lambda_stack.payment_validation_fn,
        secondary_lambda_stack.transaction_processing_fn,
        secondary_lambda_stack.notification_fn
    ],
    api=secondary_api_stack.api,
    environment_suffix=environment_suffix,
    dr_role="secondary",
    env=secondary_env
)
secondary_monitoring_stack.add_dependency(secondary_db_stack)
secondary_monitoring_stack.add_dependency(secondary_lambda_stack)
secondary_monitoring_stack.add_dependency(secondary_api_stack)

# PARAMETER STORE (Both regions)

primary_param_store_stack = ParameterStoreStack(
    app,
    f"PrimaryParameterStore{environment_suffix}",
    db_cluster=primary_db_stack.db_cluster,
    api=primary_api_stack.api,
    environment_suffix=environment_suffix,
    dr_role="primary",
    env=primary_env
)
primary_param_store_stack.add_dependency(primary_db_stack)
primary_param_store_stack.add_dependency(primary_api_stack)

secondary_param_store_stack = ParameterStoreStack(
    app,
    f"SecondaryParameterStore{environment_suffix}",
    db_cluster=secondary_db_stack.db_cluster,
    api=secondary_api_stack.api,
    environment_suffix=environment_suffix,
    dr_role="secondary",
    env=secondary_env
)
secondary_param_store_stack.add_dependency(secondary_db_stack)
secondary_param_store_stack.add_dependency(secondary_api_stack)

# FAILOVER AUTOMATION
# Note: Commented out since it depends on Route53 stack

# failover_stack = FailoverStack(
#     app,
#     f"Failover{environment_suffix}",
#     environment_suffix=environment_suffix,
#     hosted_zone_id=app.node.try_get_context('hostedZoneId') or 'placeholder',
#     env=primary_env
# )
# failover_stack.add_dependency(route53_stack)

app.synth()
