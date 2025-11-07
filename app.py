#!/usr/bin/env python3
import aws_cdk as cdk
from lib.rds_migration_stack import RdsMigrationStack


app = cdk.App()

RdsMigrationStack(
    app,
    "RdsMigrationStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-east-1",
    ),
    description="RDS PostgreSQL database migration to staging environment with enhanced security and monitoring",
)

app.synth()
