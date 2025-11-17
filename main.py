#!/usr/bin/env python
import os
from cdktf import App
from lib.stacks.payment_stack import PaymentMigrationStack

app = App()

# Get configuration from environment variables or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
migration_phase = os.getenv("MIGRATION_PHASE", "legacy")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")

# Stack name includes environment suffix
stack_name = f"payment-migration-{environment_suffix}"

PaymentMigrationStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    migration_phase=migration_phase
)

app.synth()
