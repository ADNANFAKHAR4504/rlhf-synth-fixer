"""
Step Functions module for the serverless infrastructure.

This module creates Step Functions state machines with proper service integration
patterns as required by model failures.
"""

import json

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class StepFunctionsStack:
    """
    Manages Step Functions for the serverless infrastructure.
    
    Model failure fix: Uses proper service integration patterns
    (arn:aws:states:::lambda:invoke) instead of raw Lambda ARNs.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        role: aws.iam.Role
    ):
        """
        Initialize Step Functions Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            role: IAM role for Step Functions
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.role = role
        self.state_machines = {}
    
    def create_processing_workflow(
        self,
        processing_lambda_arn: Output[str],
        dlq_url: Output[str]
    ) -> aws.sfn.StateMachine:
        """
        Create Step Functions state machine for data processing workflow.
        
        Model failure fix: Uses proper service integration pattern with Parameters.
        
        Args:
            processing_lambda_arn: Processing Lambda function ARN
            dlq_url: Dead Letter Queue URL for failed executions
            
        Returns:
            State Machine resource
        """
        state_machine_name = self.config.get_resource_name(
            "processing-workflow",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Define state machine with proper service integration
        # Model failure fix: Uses arn:aws:states:::lambda:invoke pattern
        definition = Output.all(
            lambda_arn=processing_lambda_arn,
            dlq_url=dlq_url
        ).apply(lambda args: json.dumps({
            "Comment": "Data processing workflow with proper service integration",
            "StartAt": "ProcessData",
            "States": {
                "ProcessData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['lambda_arn'],
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": self.config.lambda_max_retries,
                            "BackoffRate": 2
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError"
                        }
                    ],
                    "Next": "ProcessingComplete"
                },
                "HandleError": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sqs:sendMessage",
                    "Parameters": {
                        "QueueUrl": args['dlq_url'],
                        "MessageBody.$": "$"
                    },
                    "Next": "ProcessingFailed"
                },
                "ProcessingFailed": {
                    "Type": "Fail",
                    "Error": "ProcessingError",
                    "Cause": "Data processing failed after retries"
                },
                "ProcessingComplete": {
                    "Type": "Succeed"
                }
            }
        }))
        
        # Create state machine
        state_machine = aws.sfn.StateMachine(
            "processing-workflow",
            name=state_machine_name,
            role_arn=self.role.arn,
            definition=definition,
            type="STANDARD",
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=self.config.enable_xray_tracing
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.state_machines['processing'] = state_machine
        return state_machine
    
    def get_state_machine_arn(self, name: str) -> Output[str]:
        """Get state machine ARN by name."""
        return self.state_machines[name].arn
    
    def get_state_machine_name(self, name: str) -> Output[str]:
        """Get state machine name by name."""
        return self.state_machines[name].name

