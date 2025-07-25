"""
tap_stack.py

This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

import os
from typing import Optional

from aws_cdk import (
    Stack,
    Environment,
)
from constructs import Construct

# Import your supporting modules
from .metadata_stack import RegionStackProps, NestedRegionStack
from .route53_stack import Route53Stack
from .kms_stack import KmsStack
from .vpc_stack import VpcStack
from .alb_stack import AlbStack
from .database_stack import DatabaseStack 
# from .monitoring_stack import MonitoringStack


class TapStackProps(Stack):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): Optional suffix to identify the 
      deployment environment (e.g., 'dev', 'prod').
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Represents the main CDK stack for the TAP project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.

    Note:
      - DO NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Determine the environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Define multi-region deployment
        regions = ["us-east-1", "us-west-2"]

        for region in regions:
            env = Environment(
                account=os.getenv("CDK_DEFAULT_ACCOUNT"),
                region=region
            )

            region_props = RegionStackProps(
                environment_suffix=region,
                env=env
            )

            # Deploy regional nested stack
            NestedRegionStack(
                self,
                f"NestedRegionStack-{region}",
                props=region_props
            )

        # Deploy Route53 in a single region
        route53_stack = Route53Stack(
            self,
            "Route53Stack",
            # env=Environment(
            #     account=os.getenv("CDK_DEFAULT_ACCOUNT"),
            #     region="us-east-1"
            # )
        )
