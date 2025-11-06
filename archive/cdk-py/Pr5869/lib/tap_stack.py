"""tap_stack.py

Main CDK stack orchestrator for multi-environment payment processing infrastructure.
This module instantiates the environment-specific payment stacks.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from lib.payment_stacks.dev_stack import DevPaymentStack
from lib.payment_stacks.staging_stack import StagingPaymentStack
from lib.payment_stacks.prod_stack import ProdPaymentStack


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main orchestrator stack for multi-environment payment processing infrastructure.

    This stack instantiates the appropriate environment-specific payment stack
    based on the environment suffix.
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

        # Determine which environment stack to deploy based on suffix
        suffix_lower = environment_suffix.lower()

        if 'prod' in suffix_lower or 'prd' in suffix_lower:
            # Deploy production stack
            self.payment_stack = ProdPaymentStack(
                self,
                "ProdPaymentStack",
                environment_suffix=environment_suffix
            )
        elif 'stag' in suffix_lower or 'staging' in suffix_lower:
            # Deploy staging stack
            self.payment_stack = StagingPaymentStack(
                self,
                "StagingPaymentStack",
                environment_suffix=environment_suffix
            )
        else:
            # Deploy dev stack (default)
            self.payment_stack = DevPaymentStack(
                self,
                "DevPaymentStack",
                environment_suffix=environment_suffix
            )

        # Export key outputs
        self.vpc_id = self.payment_stack.vpc_id
        self.cluster_arn = self.payment_stack.cluster_arn
        self.db_endpoint = self.payment_stack.db_endpoint