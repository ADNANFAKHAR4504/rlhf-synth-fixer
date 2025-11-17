#!/usr/bin/env python
from cdktf import App
from stacks.payment_stack import PaymentMigrationStack

app = App()

# Create stack with environment suffix
environment_suffix = app.node.try_get_context("environment_suffix") or "dev"
migration_phase = app.node.try_get_context("migration_phase") or "legacy"

PaymentMigrationStack(
    app,
    "payment-migration",
    environment_suffix=environment_suffix,
    migration_phase=migration_phase
)

app.synth()
