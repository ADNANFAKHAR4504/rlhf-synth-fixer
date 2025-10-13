"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless infrastructure project.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper output exports.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure modules
from infrastructure.config import InfrastructureConfig
from infrastructure.config_rules import ConfigRulesStack
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_function import LambdaStack
from infrastructure.s3 import S3Stack
from infrastructure.sns import SNSStack
from infrastructure.step_functions import StepFunctionsStack
from infrastructure.waf import WAFStack
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless infrastructure.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Initialize configuration
        self.config = InfrastructureConfig()
        
        # Override environment if provided
        if self.environment_suffix != 'dev':
            self.config.environment = self.environment_suffix
        
        # Merge custom tags
        if self.tags:
            self.config.tags.update(self.tags)

        # Initialize all infrastructure components
        self._initialize_infrastructure()

        # Export outputs for integration tests
        self._export_outputs()

    def _initialize_infrastructure(self):
        """Initialize all infrastructure components in the correct order."""
        # 1. IAM (no dependencies)
        self.iam_stack = IAMStack(self.config, ResourceOptions(parent=self))
        
        # 2. S3 (no dependencies)
        self.s3_stack = S3Stack(self.config, ResourceOptions(parent=self))
        
        # 3. DynamoDB (no dependencies)
        self.dynamodb_stack = DynamoDBStack(self.config, ResourceOptions(parent=self))
        
        # 4. SNS (no dependencies)
        self.sns_stack = SNSStack(self.config, ResourceOptions(parent=self))
        
        # 5. Lambda (depends on IAM, S3, DynamoDB)
        self.lambda_stack = LambdaStack(
            self.config, 
            self.iam_stack, 
            self.s3_stack, 
            self.dynamodb_stack,
            ResourceOptions(parent=self)
        )
        
        # 6. API Gateway (depends on Lambda, IAM)
        self.api_gateway_stack = APIGatewayStack(
            self.config, 
            self.lambda_stack, 
            self.iam_stack,
            ResourceOptions(parent=self)
        )
        
        # 7. CloudWatch (depends on Lambda, API Gateway, SNS)
        self.cloudwatch_stack = CloudWatchStack(
            self.config, 
            self.lambda_stack, 
            self.api_gateway_stack, 
            self.sns_stack,
            ResourceOptions(parent=self)
        )
        
        # 8. Step Functions (depends on Lambda, IAM)
        self.step_functions_stack = StepFunctionsStack(
            self.config, 
            self.lambda_stack, 
            self.iam_stack,
            ResourceOptions(parent=self)
        )
        
        # 9. WAF (depends on API Gateway)
        self.waf_stack = WAFStack(
            self.config, 
            self.api_gateway_stack,
            ResourceOptions(parent=self)
        )
        
        # 10. Config Rules (depends on IAM)
        self.config_rules_stack = ConfigRulesStack(
            self.config, 
            self.iam_stack,
            ResourceOptions(parent=self)
        )

    def _export_outputs(self):
        """Export all outputs for integration tests and external access."""
        # API Gateway outputs
        self.api_endpoint = self.api_gateway_stack.get_api_endpoint()
        self.rest_api_id = self.api_gateway_stack.get_rest_api_id()
        self.stage_name = self.api_gateway_stack.get_stage_name()
        
        # Lambda outputs
        self.api_handler_arn = self.lambda_stack.get_api_handler_arn()
        self.api_handler_invoke_arn = self.lambda_stack.get_api_handler_invoke_arn()
        self.data_processor_arn = self.lambda_stack.get_data_processor_arn()
        self.error_handler_arn = self.lambda_stack.get_error_handler_arn()
        
        # DynamoDB outputs
        self.main_table_name = self.dynamodb_stack.get_main_table_name()
        self.main_table_arn = self.dynamodb_stack.get_main_table_arn()
        self.audit_table_name = self.dynamodb_stack.get_audit_table_name()
        self.audit_table_arn = self.dynamodb_stack.get_audit_table_arn()
        
        # S3 outputs
        self.static_assets_bucket_name = self.s3_stack.get_static_assets_bucket_name()
        self.static_assets_bucket_arn = self.s3_stack.get_static_assets_bucket_arn()
        self.lambda_deployments_bucket_name = self.s3_stack.get_lambda_deployments_bucket_name()
        self.lambda_deployments_bucket_arn = self.s3_stack.get_lambda_deployments_bucket_arn()
        
        # Step Functions outputs
        self.state_machine_arn = self.step_functions_stack.get_state_machine_arn()
        self.state_machine_name = self.step_functions_stack.get_state_machine_name()
        
        # CloudWatch outputs
        self.lambda_error_alarm_arn = self.cloudwatch_stack.get_lambda_error_alarm_arn()
        self.api_4xx_alarm_arn = self.cloudwatch_stack.get_api_4xx_alarm_arn()
        self.api_5xx_alarm_arn = self.cloudwatch_stack.get_api_5xx_alarm_arn()
        self.dashboard_url = self.cloudwatch_stack.get_dashboard_url()
        
        # SNS outputs
        self.critical_topic_arn = self.sns_stack.get_critical_topic_arn()
        self.error_topic_arn = self.sns_stack.get_error_topic_arn()
        self.compliance_topic_arn = self.sns_stack.get_compliance_topic_arn()
        
        # WAF outputs
        self.web_acl_arn = self.waf_stack.get_web_acl_arn()
        self.web_acl_id = self.waf_stack.get_web_acl_id()
        
        # Config rules outputs
        self.config_rule_arns = self.config_rules_stack.get_rule_arns()

        # Register all outputs
        self.register_outputs({
            "api_endpoint": self.api_endpoint,
            "rest_api_id": self.rest_api_id,
            "stage_name": self.stage_name,
            "api_handler_arn": self.api_handler_arn,
            "api_handler_invoke_arn": self.api_handler_invoke_arn,
            "data_processor_arn": self.data_processor_arn,
            "error_handler_arn": self.error_handler_arn,
            "main_table_name": self.main_table_name,
            "main_table_arn": self.main_table_arn,
            "audit_table_name": self.audit_table_name,
            "audit_table_arn": self.audit_table_arn,
            "static_assets_bucket_name": self.static_assets_bucket_name,
            "static_assets_bucket_arn": self.static_assets_bucket_arn,
            "lambda_deployments_bucket_name": self.lambda_deployments_bucket_name,
            "lambda_deployments_bucket_arn": self.lambda_deployments_bucket_arn,
            "state_machine_arn": self.state_machine_arn,
            "state_machine_name": self.state_machine_name,
            "lambda_error_alarm_arn": self.lambda_error_alarm_arn,
            "api_4xx_alarm_arn": self.api_4xx_alarm_arn,
            "api_5xx_alarm_arn": self.api_5xx_alarm_arn,
            "dashboard_url": self.dashboard_url,
            "critical_topic_arn": self.critical_topic_arn,
            "error_topic_arn": self.error_topic_arn,
            "compliance_topic_arn": self.compliance_topic_arn,
            "web_acl_arn": self.web_acl_arn,
            "web_acl_id": self.web_acl_id,
            "config_rule_arns": self.config_rule_arns
        })
