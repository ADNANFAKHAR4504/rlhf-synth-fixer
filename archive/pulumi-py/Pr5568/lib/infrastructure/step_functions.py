"""
Step Functions module.

This module creates Step Functions state machines with proper
service integration format for Lambda invocations.
"""

import json

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack


class StepFunctionsStack:
    """
    Manages Step Functions state machines.
    
    Creates state machines with proper Lambda service integration
    using the correct ARN format and Parameters.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Step Functions stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.state_machines = {}
        self.log_groups = {}
        
        self._create_order_workflow()
    
    def _create_order_workflow(self):
        """Create order processing workflow state machine."""
        workflow_name = 'order-workflow'
        
        user_function = self.lambda_stack.get_function('user-service')
        order_function = self.lambda_stack.get_function('order-service')
        product_function = self.lambda_stack.get_function('product-service')
        
        role = self.iam_stack.create_step_functions_role(
            workflow_name,
            lambda_arns=[
                user_function.arn,
                order_function.arn,
                product_function.arn
            ]
        )
        
        definition = Output.all(
            user_arn=user_function.arn,
            order_arn=order_function.arn,
            product_arn=product_function.arn
        ).apply(lambda args: json.dumps({
            "Comment": "Order processing workflow",
            "StartAt": "ValidateUser",
            "States": {
                "ValidateUser": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['user_arn'],
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.userResult",
                    "OutputPath": "$",
                    "Next": "ProcessOrder",
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "ProcessOrder": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['order_arn'],
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.orderResult",
                    "OutputPath": "$",
                    "Next": "UpdateInventory",
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "UpdateInventory": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['product_arn'],
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.productResult",
                    "OutputPath": "$",
                    "End": True,
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "WorkflowFailed",
                    "Cause": "An error occurred during workflow execution"
                }
            }
        }))
        
        opts = self.provider_manager.get_resource_options()
        
        log_group = aws.cloudwatch.LogGroup(
            f'{workflow_name}-logs',
            name=f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.log_groups[workflow_name] = log_group
        
        state_machine = aws.sfn.StateMachine(
            workflow_name,
            name=self.config.get_resource_name(workflow_name, include_region=False),
            role_arn=role.arn,
            definition=definition,
            logging_configuration=aws.sfn.StateMachineLoggingConfigurationArgs(
                level='ALL',
                include_execution_data=True,
                log_destination=log_group.arn.apply(lambda arn: f"{arn}:*")
            ),
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=self.config.enable_xray_tracing
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role, log_group]
            ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
                depends_on=[role, log_group]
            )
        )
        
        self.state_machines[workflow_name] = state_machine
    
    def get_state_machine(self, workflow_name: str) -> aws.sfn.StateMachine:
        """
        Get a state machine by name.
        
        Args:
            workflow_name: Name of the workflow
            
        Returns:
            State Machine resource
        """
        return self.state_machines.get(workflow_name)
    
    def get_state_machine_arn(self, workflow_name: str) -> Output[str]:
        """
        Get the ARN of a state machine.
        
        Args:
            workflow_name: Name of the workflow
            
        Returns:
            State machine ARN as Output
        """
        sm = self.get_state_machine(workflow_name)
        return sm.arn if sm else None

