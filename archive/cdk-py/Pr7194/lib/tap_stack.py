"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the single-region database infrastructure.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from lib.database_stack import DatabaseStack, DatabaseStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the single-region database infrastructure.

    This stack orchestrates the instantiation of the database infrastructure.
    It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store environment suffix for use in nested stacks
        self.environment_suffix = environment_suffix

        # Create the database infrastructure
        db_props = DatabaseStackProps(environment_suffix=environment_suffix)

        self.database_stack = DatabaseStack(
            self,
            "DatabaseStack",
            props=db_props
        )
