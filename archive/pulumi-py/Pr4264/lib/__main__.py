"""
Main Pulumi program for the serverless infrastructure.

This program instantiates the TapStack and exports all outputs.
"""

import pulumi

from lib.tap_stack import TapStack, TapStackArgs

# Create the TapStack
stack = TapStack(
    "serverless-infrastructure",
    TapStackArgs(
        environment_suffix="dev",
        tags={
            "Project": "ServerlessApp",
            "Environment": "dev"
        }
    )
)

# Export all outputs
pulumi.export("api_endpoint", stack.api_endpoint)
pulumi.export("rest_api_id", stack.rest_api_id)
pulumi.export("stage_name", stack.stage_name)
pulumi.export("api_handler_arn", stack.api_handler_arn)
pulumi.export("api_handler_invoke_arn", stack.api_handler_invoke_arn)
pulumi.export("data_processor_arn", stack.data_processor_arn)
pulumi.export("error_handler_arn", stack.error_handler_arn)
pulumi.export("main_table_name", stack.main_table_name)
pulumi.export("main_table_arn", stack.main_table_arn)
pulumi.export("audit_table_name", stack.audit_table_name)
pulumi.export("audit_table_arn", stack.audit_table_arn)
pulumi.export("static_assets_bucket_name", stack.static_assets_bucket_name)
pulumi.export("static_assets_bucket_arn", stack.static_assets_bucket_arn)
pulumi.export("lambda_deployments_bucket_name", stack.lambda_deployments_bucket_name)
pulumi.export("lambda_deployments_bucket_arn", stack.lambda_deployments_bucket_arn)
pulumi.export("state_machine_arn", stack.state_machine_arn)
pulumi.export("state_machine_name", stack.state_machine_name)
pulumi.export("lambda_error_alarm_arn", stack.lambda_error_alarm_arn)
pulumi.export("api_4xx_alarm_arn", stack.api_4xx_alarm_arn)
pulumi.export("api_5xx_alarm_arn", stack.api_5xx_alarm_arn)
pulumi.export("dashboard_url", stack.dashboard_url)
pulumi.export("critical_topic_arn", stack.critical_topic_arn)
pulumi.export("error_topic_arn", stack.error_topic_arn)
pulumi.export("compliance_topic_arn", stack.compliance_topic_arn)
pulumi.export("web_acl_arn", stack.web_acl_arn)
pulumi.export("web_acl_id", stack.web_acl_id)
pulumi.export("config_rule_arns", stack.config_rule_arns)
