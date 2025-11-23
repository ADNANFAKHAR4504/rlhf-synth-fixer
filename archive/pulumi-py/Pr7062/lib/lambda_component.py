"""
Lambda Component for Payment Processing.
Creates Lambda functions with environment-specific configurations.
"""

from typing import Optional, Dict
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, AssetArchive, FileArchive
from lib.environment_config import EnvironmentConfig


class LambdaComponentArgs:
    """Arguments for Lambda Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        role_arn: str,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.role_arn = role_arn
        self.tags = tags or {}


class LambdaComponent(pulumi.ComponentResource):
    """
    Reusable Lambda component for payment processing.
    Creates Lambda function with ARM64 architecture and environment-specific settings.
    """

    def __init__(
        self,
        name: str,
        args: LambdaComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:compute:LambdaComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create Lambda function code
        # In production, this would be actual payment processing code
        lambda_code = '''
import json
import os

def handler(event, context):
    """Process payment transaction."""
    environment = os.environ.get('ENVIRONMENT', 'unknown')

    # Simulate payment processing
    transaction_id = event.get('transaction_id', 'unknown')
    amount = event.get('amount', 0)

    print(f"Processing payment in {environment} environment")
    print(f"Transaction ID: {transaction_id}, Amount: ${amount}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed successfully',
            'transaction_id': transaction_id,
            'environment': environment,
            'amount': amount
        })
    }
'''

        # Create Lambda function
        self.function = aws.lambda_.Function(
            f"payment-processor-{args.environment_suffix}",
            runtime="python3.11",
            role=args.role_arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            memory_size=args.env_config.lambda_memory_mb,
            timeout=30,
            architectures=["arm64"],  # ARM64 for cost optimization
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': args.env_config.name,
                    'LOG_LEVEL': 'INFO',
                }
            ),
            tags={
                **args.tags,
                'Name': f"payment-processor-{args.environment_suffix}",
                'Architecture': 'arm64',
            },
            opts=child_opts
        )

        # Create CloudWatch Log Group
        self.log_group = aws.cloudwatch.LogGroup(
            f"payment-processor-logs-{args.environment_suffix}",
            name=self.function.name.apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=args.env_config.s3_log_retention_days,
            tags=args.tags,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'function_arn': self.function.arn,
            'function_name': self.function.name,
            'log_group_name': self.log_group.name,
        })
