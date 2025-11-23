#!/usr/bin/env python
from cdktf import App
from lib.stacks.primary_stack import PrimaryStack
from lib.stacks.secondary_stack import SecondaryStack
from lib.stacks.global_stack import GlobalStack

app = App()

# Environment suffix for unique resource naming
environment_suffix = app.node.try_get_context("environmentSuffix") or "prod-dr"

# Primary region stack (us-east-1)
primary_stack = PrimaryStack(
    app,
    "healthcare-dr-primary",
    region="us-east-1",
    environment_suffix=environment_suffix
)

# Secondary region stack (us-west-2)
secondary_stack = SecondaryStack(
    app,
    "healthcare-dr-secondary",
    region="us-west-2",
    environment_suffix=environment_suffix,
    primary_bucket_arn=primary_stack.medical_docs_bucket_arn,
    primary_kms_key_arn=primary_stack.kms_key_arn
)

# Global resources (Route53, DynamoDB global tables)
global_stack = GlobalStack(
    app,
    "healthcare-dr-global",
    environment_suffix=environment_suffix,
    primary_endpoint=primary_stack.api_endpoint,
    secondary_endpoint=secondary_stack.api_endpoint,
    primary_region="us-east-1",
    secondary_region="us-west-2"
)

app.synth()
