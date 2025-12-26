"""
Main entry point for Pulumi infrastructure deployment
Deploys the TapStack with serverless architecture
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment_suffix = pulumi.get_stack()

# Create stack arguments with LocalStack-compatible settings
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    region=config.get("region") or "us-east-1",
    project_name=config.get("projectName") or "NovaModelBreaking",
    enable_multi_region=config.get_bool("enableMultiRegion") or False,
    lambda_memory_size=config.get_int("lambdaMemorySize") or 256,
    lambda_timeout=config.get_int("lambdaTimeout") or 30,
    kinesis_shard_count=config.get_int("kinesisShardCount") or 1,
    s3_lifecycle_days=config.get_int("s3LifecycleDays") or 30,
    cloudwatch_retention_days=config.get_int("cloudwatchRetentionDays") or 14,
    enable_xray_tracing=False,  # Disabled for LocalStack compatibility
)

# Deploy the stack
stack = TapStack("tap-stack", stack_args)

# Export stack outputs
pulumi.export("api_gateway_url",
    pulumi.Output.concat(
        stack.api_gateway.api_endpoint, "/", stack_args.environment
    ) if stack.api_gateway else None
)
pulumi.export("lambda_functions", {
    name: func.arn for name, func in stack.lambda_functions.items()
})
pulumi.export("s3_buckets", {
    name: bucket.bucket for name, bucket in stack.s3_buckets.items()
})
pulumi.export("kinesis_streams", {
    name: stream.arn for name, stream in stack.kinesis_streams.items()
})
pulumi.export("region", stack.region)
pulumi.export("environment", stack_args.environment)
