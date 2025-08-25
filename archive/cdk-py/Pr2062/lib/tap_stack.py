"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct

# Import the stacks
from .vpc_stack import VpcStack
from .ecs_stack import EcsStack
from .monitoring_stack import MonitoringStack
from .parameter_stack import ParameterStack

class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.
    """
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the WebApp project.
    This stack orchestrates the deployment of a containerized web application
    with CI/CD pipeline, auto-scaling, and monitoring capabilities.
    """

    def __init__(self, scope: Construct, construct_id: str, 
                 props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create Parameter Store stack first (dependencies need it)
        parameter_stack = ParameterStack(
            self, f"ParameterStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create VPC stack
        vpc_stack = VpcStack(
            self, f"VpcStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create ECS stack
        ecs_stack = EcsStack(
            self, f"EcsStack{environment_suffix}",
            vpc_stack=vpc_stack,
            environment_suffix=environment_suffix
        )
        ecs_stack.add_dependency(vpc_stack)
        ecs_stack.add_dependency(parameter_stack)

        # Create Monitoring stack
        monitoring_stack = MonitoringStack(
            self, f"MonitoringStack{environment_suffix}",
            ecs_stack=ecs_stack,
            environment_suffix=environment_suffix
        )
        monitoring_stack.add_dependency(ecs_stack)

        # Store references for potential external access
        self.vpc_stack = vpc_stack
        self.ecs_stack = ecs_stack
        self.monitoring_stack = monitoring_stack
        self.parameter_stack = parameter_stack
