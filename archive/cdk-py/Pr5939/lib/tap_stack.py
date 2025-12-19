from aws_cdk import Stack
from constructs import Construct
from lib.vpc_stack import VpcStack


class TapStack(Stack):
    """
    Main orchestrator stack for payment processing infrastructure.

    This stack serves as the entry point and orchestrates the creation
    of all infrastructure components, starting with the VPC.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC infrastructure
        self.vpc_stack = VpcStack(
            self,
            "VpcStack",
            environment_suffix=environment_suffix,
            **kwargs
        )
