"""Main Pulumi program for multi-environment trading analytics platform."""
import pulumi
from lib.tap_stack import TradingAnalyticsStack

# Get the current stack name (e.g., 'dev', 'staging', 'production')
stack_name = pulumi.get_stack()

# Create the trading analytics infrastructure stack
stack = TradingAnalyticsStack(f"trading-analytics-{stack_name}", stack_name)

# Export key resource information
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('lambda_function_arn', stack.lambda_function.arn)
pulumi.export('dynamodb_table_name', stack.dynamodb_table.name)
pulumi.export('s3_bucket_name', stack.s3_bucket.bucket)
pulumi.export('s3_bucket_arn', stack.s3_bucket.arn)
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('log_group_name', stack.log_group.name)
pulumi.export('environment', stack_name)
