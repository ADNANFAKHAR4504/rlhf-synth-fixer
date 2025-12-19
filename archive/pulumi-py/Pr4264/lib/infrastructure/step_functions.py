"""
Step Functions module for the serverless infrastructure.

This module creates AWS Step Functions with proper Lambda service integration,
addressing the model failures about incorrect Resource ARN usage in state definitions.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class StepFunctionsStack:
    """
    Step Functions stack for orchestrating serverless workflows.
    
    Creates Step Functions with:
    - Proper Lambda service integration (arn:aws:states:::lambda:invoke)
    - Correct Parameters configuration
    - Error handling and retry logic
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        lambda_stack,
        iam_stack,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the Step Functions stack.
        
        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function references
            iam_stack: IAM stack for execution role
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.iam_stack = iam_stack
        self.opts = opts or ResourceOptions()
        
        # Create the state machine
        self.state_machine = self._create_state_machine()
    
    def _create_state_machine(self):
        """Create Step Functions state machine with proper Lambda integration."""
        state_machine_name = f"{self.config.get_resource_name('step-function', 'workflow')}-{self.config.environment}"
        
        # Define the state machine definition with CORRECT Lambda service integration
        definition = pulumi.Output.all(
            self.lambda_stack.api_handler.arn,
            self.lambda_stack.data_processor.arn,
            self.lambda_stack.error_handler.arn
        ).apply(lambda args: {
            "Comment": "Serverless workflow orchestration",
            "StartAt": "ProcessData",
            "States": {
                "ProcessData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",  # CORRECT service integration
                    "Parameters": {
                        "FunctionName": args[1],  # data_processor function
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.dataResult",
                    "Next": "ValidateData",
                    "Retry": [
                        {
                            "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "ValidateData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",  # CORRECT service integration
                    "Parameters": {
                        "FunctionName": args[0],  # api_handler function
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.validationResult",
                    "Next": "Success",
                    "Retry": [
                        {
                            "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "HandleError": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",  # CORRECT service integration
                    "Parameters": {
                        "FunctionName": args[2],  # error_handler function
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.errorResult",
                    "Next": "Failure"
                },
                "Success": {
                    "Type": "Pass",
                    "Result": "Workflow completed successfully",
                    "End": True
                },
                "Failure": {
                    "Type": "Fail",
                    "Cause": "Workflow failed",
                    "Error": "WorkflowError"
                }
            }
        })
        
        # Create the state machine
        state_machine = aws.sfn.StateMachine(
            state_machine_name,
            name=state_machine_name,
            role_arn=self.iam_stack.step_functions_role.arn,
            definition=definition.apply(lambda defn: json.dumps(defn)),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return state_machine
    
    def get_state_machine_arn(self) -> pulumi.Output[str]:
        """Get state machine ARN."""
        return self.state_machine.arn
    
    def get_state_machine_name(self) -> pulumi.Output[str]:
        """Get state machine name."""
        return self.state_machine.name
