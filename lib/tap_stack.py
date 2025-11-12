"""tap_stack.py
Main orchestration stack for Multi-Region DR Payment Processing Infrastructure.

NOTE: For multi-region deployments, stacks cannot be nested.
All infrastructure stacks must be created at the app level in tap.py.
This stack serves as a coordination point only.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod')
        **kwargs: Additional keyword arguments passed to cdk.StackProps
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main coordination stack for multi-region disaster recovery deployment.

    This stack does NOT instantiate other stacks as nested stacks.
    All actual infrastructure stacks are created at the app level in tap.py.

    For multi-region architecture:
    - Primary region stacks (us-east-1)
    - Secondary region stacks (us-east-2)
    - Global resources (Route 53)

    Args:
        scope (Construct): The parent construct (app)
        construct_id (str): Stack identifier
        props (Optional[TapStackProps]): Stack properties
        **kwargs: Additional CDK Stack arguments
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Export environment suffix for reference
        cdk.CfnOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix for multi-region DR deployment",
            export_name=f"environment-suffix-{environment_suffix}"
        )

        # All infrastructure stacks are created in tap.py at app level:
        # - VpcStack (primary and secondary)
        # - DatabaseStack (primary and secondary)
        # - LambdaStack (primary and secondary)
        # - ApiStack (primary and secondary)
        # - StorageStack (primary and secondary with CRR)
        # - Route53Stack (global)
        # - MonitoringStack (primary and secondary)
        # - ParameterStoreStack (primary and secondary)
        # - FailoverStack (global)
