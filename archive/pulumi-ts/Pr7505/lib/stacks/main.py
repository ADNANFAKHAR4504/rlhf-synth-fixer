#!/usr/bin/env python3
"""
Multi-Region Disaster Recovery Infrastructure
CDKTF Python Application Entry Point
"""

from cdktf import App, TerraformOutput, TerraformStack
from constructs import Construct

from lib.stacks.global_stack import GlobalStack
from lib.stacks.primary_stack import PrimaryStack
from lib.stacks.secondary_stack import SecondaryStack


def main():  # pragma: no cover
    """
    Main application entry point.
    Creates CDKTF app and instantiates all stacks.
    """
    app = App()

    # Environment suffix for resource naming
    environment_suffix = app.node.try_get_context("environment_suffix") or "dr-prod"

    # Primary region stack (us-east-1)
    primary_stack = PrimaryStack(
        app,
        "primary-stack",
        environment_suffix=environment_suffix,
        region="us-east-1",
    )

    # Secondary region stack (us-west-2)
    # Must receive global_cluster_id from primary stack
    secondary_stack = SecondaryStack(
        app,
        "secondary-stack",
        environment_suffix=environment_suffix,
        region="us-west-2",
        primary_vpc_cidr="10.0.0.0/16",
        global_cluster_id=primary_stack.aurora_global_cluster_id,
    )

    # Global stack (Route53, DynamoDB Global Tables)
    global_stack = GlobalStack(
        app,
        "global-stack",
        environment_suffix=environment_suffix,
        primary_region="us-east-1",
        secondary_region="us-west-2",
        primary_aurora_endpoint=primary_stack.aurora_writer_endpoint,
        secondary_aurora_endpoint=secondary_stack.aurora_reader_endpoint,
        primary_health_check_url=primary_stack.health_check_url,
        secondary_health_check_url=secondary_stack.health_check_url,
    )

    # Stack dependencies
    secondary_stack.add_dependency(primary_stack)
    global_stack.add_dependency(primary_stack)
    global_stack.add_dependency(secondary_stack)

    app.synth()


if __name__ == "__main__":
    main()
