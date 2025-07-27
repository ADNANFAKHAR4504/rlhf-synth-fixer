"""stepfunctions_stack.py
This module defines the Step Functions stack for asynchronous processing.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    NestedStack,
    aws_stepfunctions as sfn,
)
from constructs import Construct


class StepFunctionsStackProps:
    """
    StepFunctionsStackProps defines the properties for the Step Functions stack.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        
    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix


class StepFunctionsStack(cdk.Stack):
    """
    Step Functions stack for asynchronous processing.
    
    This stack creates:
    - Step Functions state machine for processing requests
    """
    
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[StepFunctionsStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix
        environment_suffix = props.environment_suffix if props else 'dev'
        
        # Step Functions state machine (simple Pass state for demo)
        pass_state = sfn.Pass(
            self, "ProcessPayload",
            comment="Simple processing state",
            result=sfn.Result.from_object({"status": "processed"})
        )

        self.state_machine = sfn.StateMachine(
            self, "RequestStateMachine",
            state_machine_name=f"tap-{environment_suffix}-statemachine",
            definition=pass_state,
            timeout=Duration.minutes(5),
        )


class NestedStepFunctionsStack(NestedStack):
    """
    Nested Step Functions stack wrapper.
    
    This nested stack wraps the Step Functions stack to be used within the main TapStack.
    """
    
    def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the original StepFunctionsStack logic here
        self.sf_stack = StepFunctionsStack(self, "Resource", props=props)
        self.state_machine = self.sf_stack.state_machine