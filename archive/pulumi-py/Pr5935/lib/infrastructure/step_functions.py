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
from .config import FileUploadConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack


class StepFunctionsStack:
    """
    Manages Step Functions state machines.
    
    Creates state machines with proper Lambda service integration
    using the correct ARN format (arn:aws:states:::lambda:invoke) and Parameters.
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Step Functions stack.
        
        Args:
            config: FileUploadConfig instance
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
        
        self._create_file_processing_workflow()
    
    def _create_file_processing_workflow(self):
        """Create file processing workflow state machine."""
        workflow_name = 'file-workflow'
        
        function = self.lambda_stack.get_function('file-processor')
        
        log_group = aws.cloudwatch.LogGroup(
            f'{workflow_name}-logs',
            name=f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}"
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[workflow_name] = log_group
        
        role = self.iam_stack.create_step_functions_role(
            workflow_name,
            lambda_arns=[function.arn],
            log_group_arn=log_group.arn
        )
        
        definition = Output.all(
            function_arn=function.arn
        ).apply(lambda args: json.dumps({
            "Comment": "File processing workflow with retry logic",
            "StartAt": "ProcessFile",
            "States": {
                "ProcessFile": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['function_arn'],
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.processResult",
                    "OutputPath": "$",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": self.config.step_functions_retry_interval,
                            "MaxAttempts": self.config.step_functions_max_attempts,
                            "BackoffRate": self.config.step_functions_backoff_rate
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError",
                            "ResultPath": "$.errorInfo"
                        }
                    ],
                    "End": True
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "FileProcessingFailed",
                    "Cause": "File processing failed after retries"
                }
            }
        }))
        
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
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(workflow_name, include_region=False)
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role, log_group, function]
            ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
                depends_on=[role, log_group, function]
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

