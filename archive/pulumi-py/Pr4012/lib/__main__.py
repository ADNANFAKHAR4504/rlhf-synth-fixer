"""
Main entry point for the Pulumi serverless application.

This module initializes the TapStack with proper configuration and
serves as the entry point for Pulumi deployments.
"""

import pulumi
from tap_stack import TapStack, TapStackArgs


def main():
    """
    Main function to initialize the TapStack.
    
    This function creates the TapStack with environment-specific configuration
    and serves as the entry point for Pulumi deployments.
    """
    # Get Pulumi configuration
    config = pulumi.Config()
    
    # Get environment-specific configuration
    environment = config.get("environment") or "dev"
    project_name = config.get("project_name") or "serverless-app"
    aws_region = config.get("aws:region") or "us-east-1"
    
    # Get additional configuration
    lambda_timeout = config.get_int("lambda_timeout") or 30
    lambda_memory = config.get_int("lambda_memory") or 128
    s3_log_retention_days = config.get_int("s3_log_retention_days") or 90
    cloudwatch_log_retention_days = config.get_int("cloudwatch_log_retention_days") or 14
    
    # Create configuration dictionary
    stack_config = {
        "environment": environment,
        "project_name": project_name,
        "aws_region": aws_region,
        "lambda_timeout": lambda_timeout,
        "lambda_memory": lambda_memory,
        "s3_log_retention_days": s3_log_retention_days,
        "cloudwatch_log_retention_days": cloudwatch_log_retention_days
    }
    
    # Create default tags
    default_tags = {
        "Environment": environment,
        "Project": project_name,
        "ManagedBy": "Pulumi",
        "CreatedBy": "ServerlessApplication"
    }
    
    # Create TapStack arguments
    stack_args = TapStackArgs(
        environment_suffix=environment,
        tags=default_tags,
        config=stack_config
    )
    
    # Create the TapStack
    stack = TapStack(
        "serverless-app",
        stack_args,
        opts=pulumi.ResourceOptions()
    )
    
    # Export key outputs for easy access
    pulumi.export("environment", stack.config.environment)
    pulumi.export("aws_region", stack.config.aws_region)
    pulumi.export("project_name", stack.config.project_name)
    
    # Export Lambda function outputs
    pulumi.export("lambda_function_name", stack.lambda_stack.get_main_function_name())
    pulumi.export("lambda_function_arn", stack.lambda_stack.get_main_function_arn())
    pulumi.export("lambda_function_invoke_arn", stack.lambda_stack.get_main_function_invoke_arn())
    
    # Export API Gateway outputs
    pulumi.export("api_gateway_id", stack.api_gateway_stack.get_rest_api_id())
    pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_invoke_url())
    
    # Export S3 bucket outputs
    pulumi.export("s3_bucket_name", stack.s3_stack.get_logs_bucket_name())
    pulumi.export("s3_bucket_arn", stack.s3_stack.get_logs_bucket_arn())
    
    # Export IAM role outputs
    pulumi.export("lambda_execution_role_arn", stack.iam_stack.get_lambda_execution_role_arn())
    pulumi.export("api_gateway_role_arn", stack.iam_stack.get_api_gateway_role_arn())
    
    # Export CloudWatch outputs
    pulumi.export("cloudwatch_dashboard_url", stack.cloudwatch_stack.get_dashboard_url())
    
    # Export log group outputs
    pulumi.export("main_log_group_name", stack.cloudwatch_stack.get_log_groups()['main'].name)
    pulumi.export("processor_log_group_name", stack.cloudwatch_stack.get_log_groups()['processor'].name)
    pulumi.export("api_log_group_name", stack.cloudwatch_stack.get_log_groups()['api'].name)


if __name__ == "__main__":
    main()
