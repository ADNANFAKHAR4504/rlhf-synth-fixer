"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless infrastructure project.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper output exports.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

from lib.infrastructure.api_gateway import APIGatewayStack
from lib.infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure modules
from lib.infrastructure.config import InfrastructureConfig
from lib.infrastructure.config_rules import ConfigRulesStack
from lib.infrastructure.dynamodb import DynamoDBStack
from lib.infrastructure.iam import IAMStack
from lib.infrastructure.lambda_function import LambdaStack
from lib.infrastructure.s3 import S3Stack
from lib.infrastructure.sns import SNSStack
from lib.infrastructure.step_functions import StepFunctionsStack
from lib.infrastructure.waf import WAFStack


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

        # Register outputs for Pulumi stack exports
        self._register_outputs()

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

    def _register_outputs(self):
        """Register all stack outputs for integration testing and CI/CD pipeline."""
        # Collect all outputs from infrastructure components
        all_outputs = {
            # Configuration outputs
            "environment_suffix": self.environment_suffix,
            "aws_region": self.config.aws_region,
            "project_name": self.config.project_name,
            
            # API Gateway outputs
            "api_endpoint": self.api_gateway_stack.stage.invoke_url,
            "rest_api_id": self.api_gateway_stack.rest_api.id,
            "stage_name": self.api_gateway_stack.stage.stage_name,
            
            # Lambda outputs
            "api_handler_arn": self.lambda_stack.api_handler.arn,
            "api_handler_invoke_arn": self.lambda_stack.api_handler.invoke_arn,
            "data_processor_arn": self.lambda_stack.data_processor.arn,
            "error_handler_arn": self.lambda_stack.error_handler.arn,
            
            # DynamoDB outputs
            "main_table_name": self.dynamodb_stack.main_table.name,
            "main_table_arn": self.dynamodb_stack.main_table.arn,
            "audit_table_name": self.dynamodb_stack.audit_table.name,
            "audit_table_arn": self.dynamodb_stack.audit_table.arn,
            
            # S3 outputs
            "static_assets_bucket_name": self.s3_stack.static_assets_bucket.bucket,
            "static_assets_bucket_arn": self.s3_stack.static_assets_bucket.arn,
            "lambda_deployments_bucket_name": self.s3_stack.lambda_deployments_bucket.bucket,
            "lambda_deployments_bucket_arn": self.s3_stack.lambda_deployments_bucket.arn,
            
            # Step Functions outputs
            "state_machine_arn": self.step_functions_stack.state_machine.arn,
            "state_machine_name": self.step_functions_stack.state_machine.name,
            
            # CloudWatch outputs
            "lambda_error_alarm_arn": self.cloudwatch_stack.alarms['lambda_errors'].arn,
            "api_4xx_alarm_arn": self.cloudwatch_stack.alarms['api_4xx_errors'].arn,
            "api_5xx_alarm_arn": self.cloudwatch_stack.alarms['api_5xx_errors'].arn,
            "dashboard_url": self.cloudwatch_stack.get_dashboard_url(),
            
            # SNS outputs
            "critical_topic_arn": self.sns_stack.critical_topic.arn,
            "error_topic_arn": self.sns_stack.error_topic.arn,
            "compliance_topic_arn": self.sns_stack.compliance_topic.arn,
            
            # WAF outputs
            "web_acl_arn": self.waf_stack.web_acl.arn,
            "web_acl_id": self.waf_stack.web_acl.id,
            
            # Config rules outputs
            "config_rule_arns": [rule.arn for rule in self.config_rules_stack.rules.values()]
        }
        
        # Create individual attributes for direct access (flat outputs)
        self.api_endpoint = all_outputs["api_endpoint"]
        self.rest_api_id = all_outputs["rest_api_id"]
        self.stage_name = all_outputs["stage_name"]
        self.api_handler_arn = all_outputs["api_handler_arn"]
        self.api_handler_invoke_arn = all_outputs["api_handler_invoke_arn"]
        self.data_processor_arn = all_outputs["data_processor_arn"]
        self.error_handler_arn = all_outputs["error_handler_arn"]
        self.main_table_name = all_outputs["main_table_name"]
        self.main_table_arn = all_outputs["main_table_arn"]
        self.audit_table_name = all_outputs["audit_table_name"]
        self.audit_table_arn = all_outputs["audit_table_arn"]
        self.static_assets_bucket_name = all_outputs["static_assets_bucket_name"]
        self.static_assets_bucket_arn = all_outputs["static_assets_bucket_arn"]
        self.lambda_deployments_bucket_name = all_outputs["lambda_deployments_bucket_name"]
        self.lambda_deployments_bucket_arn = all_outputs["lambda_deployments_bucket_arn"]
        self.state_machine_arn = all_outputs["state_machine_arn"]
        self.state_machine_name = all_outputs["state_machine_name"]
        self.lambda_error_alarm_arn = all_outputs["lambda_error_alarm_arn"]
        self.api_4xx_alarm_arn = all_outputs["api_4xx_alarm_arn"]
        self.api_5xx_alarm_arn = all_outputs["api_5xx_alarm_arn"]
        self.dashboard_url = all_outputs["dashboard_url"]
        self.critical_topic_arn = all_outputs["critical_topic_arn"]
        self.error_topic_arn = all_outputs["error_topic_arn"]
        self.compliance_topic_arn = all_outputs["compliance_topic_arn"]
        self.web_acl_arn = all_outputs["web_acl_arn"]
        self.web_acl_id = all_outputs["web_acl_id"]
        self.config_rule_arns = all_outputs["config_rule_arns"]
        
        # Register outputs with Pulumi for stack exports
        self.register_outputs(all_outputs)
        
        # Export outputs to stack level for CI/CD pipeline
        try:
            import pulumi
            for key, value in all_outputs.items():
                pulumi.export(key, value)
        except Exception:
            # In test environment, pulumi.export may not be available
            # This is expected and handled gracefully
            pass
