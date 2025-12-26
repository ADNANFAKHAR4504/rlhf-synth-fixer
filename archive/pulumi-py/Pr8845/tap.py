"""Main entry point for Pulumi stack."""
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environment_suffix") or "dev"

# Create the stack
args = TapStackArgs(environment_suffix=environment_suffix)
stack = TapStack("tap-stack", args)

# Export stack outputs
pulumi.export("bucket_name", stack.bucket_name)
pulumi.export("bucket_arn", stack.bucket_arn)
pulumi.export("lambda_function_name", stack.lambda_function_name)
pulumi.export("lambda_function_arn", stack.lambda_function_arn)
pulumi.export("lambda_role_arn", stack.lambda_role_arn)
