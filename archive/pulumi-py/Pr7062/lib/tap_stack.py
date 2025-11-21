"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of the Payment Stack component
and manages environment-specific configurations.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
from lib.payment_stack_component import PaymentStackComponent, PaymentStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
      environment_suffix (Optional[str]): An optional suffix for
        identifying the deployment environment (e.g., 'dev', 'prod').
      tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the payment processing infrastructure
    and manages the environment suffix used for naming and configuration.
    It also generates a JSON manifest of all deployed resources for compliance.

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

        # Create the payment processing stack
        self.payment_stack = PaymentStackComponent(
            f"payment-stack-{self.environment_suffix}",
            PaymentStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Generate resource manifest as JSON output
        # This manifest lists all deployed resources for compliance tracking
        manifest = Output.all(
            environment=self.payment_stack.env_config.name,
            account_id=self.payment_stack.env_config.account_id,
            region=self.payment_stack.env_config.region,
            vpc_id=self.payment_stack.vpc.vpc.id,
            lambda_arn=self.payment_stack.lambda_func.function.arn,
            lambda_name=self.payment_stack.lambda_func.function.name,
            lambda_memory=self.payment_stack.env_config.lambda_memory_mb,
            dynamodb_name=self.payment_stack.dynamodb.table.name,
            dynamodb_arn=self.payment_stack.dynamodb.table.arn,
            dynamodb_capacity_mode=self.payment_stack.env_config.dynamodb_capacity_mode,
            dynamodb_pitr=self.payment_stack.env_config.dynamodb_pitr_enabled,
            s3_bucket=self.payment_stack.s3.bucket.id,
            s3_arn=self.payment_stack.s3.bucket.arn,
            s3_retention_days=self.payment_stack.env_config.s3_log_retention_days,
            lambda_role_arn=self.payment_stack.iam.lambda_role.arn,
        ).apply(lambda vals: json.dumps({
            'environment': vals['environment'],
            'account_id': vals['account_id'],
            'region': vals['region'],
            'resources': {
                'vpc': {
                    'id': vals['vpc_id'],
                    'type': 'AWS::EC2::VPC'
                },
                'lambda': {
                    'arn': vals['lambda_arn'],
                    'name': vals['lambda_name'],
                    'memory_mb': vals['lambda_memory'],
                    'architecture': 'arm64',
                    'type': 'AWS::Lambda::Function'
                },
                'dynamodb': {
                    'name': vals['dynamodb_name'],
                    'arn': vals['dynamodb_arn'],
                    'capacity_mode': vals['dynamodb_capacity_mode'],
                    'pitr_enabled': vals['dynamodb_pitr'],
                    'type': 'AWS::DynamoDB::Table'
                },
                's3': {
                    'bucket': vals['s3_bucket'],
                    'arn': vals['s3_arn'],
                    'retention_days': vals['s3_retention_days'],
                    'type': 'AWS::S3::Bucket'
                },
                'iam': {
                    'lambda_role_arn': vals['lambda_role_arn'],
                    'type': 'AWS::IAM::Role'
                }
            }
        }, indent=2))

        # Register outputs
        self.register_outputs({
            'environment': self.payment_stack.env_config.name,
            'vpc_id': self.payment_stack.vpc.vpc.id,
            'lambda_function_arn': self.payment_stack.lambda_func.function.arn,
            'lambda_function_name': self.payment_stack.lambda_func.function.name,
            'dynamodb_table_name': self.payment_stack.dynamodb.table.name,
            's3_bucket_name': self.payment_stack.s3.bucket.id,
            'resource_manifest': manifest,
        })
