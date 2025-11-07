"""
monitoring.py

CloudWatch monitoring and logging infrastructure.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates CloudWatch log groups and monitoring infrastructure.
    """

    def __init__(
        self,
        name: str,
        *,
        log_retention_days: int,
        lambda_function_name: Output[str],
        api_gateway_id: Output[str],
        api_stage_name: Output[str],
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Create log group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{environment_suffix}',
            name=lambda_function_name.apply(lambda name: f'/aws/lambda/{name}'),
            retention_in_days=log_retention_days,
            tags={**tags, 'Name': f'lambda-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create log group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f'api-log-group-{environment_suffix}',
            name=f'/aws/apigateway/payment-api-{environment_suffix}',
            retention_in_days=log_retention_days,
            tags={**tags, 'Name': f'api-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'lambda_log_group': self.lambda_log_group.name,
            'api_log_group': self.api_log_group.name
        })
