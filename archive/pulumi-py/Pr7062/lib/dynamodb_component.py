"""
DynamoDB Component for Transaction Storage.
Creates DynamoDB tables with environment-specific configurations.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.environment_config import EnvironmentConfig


class DynamoDBComponentArgs:
    """Arguments for DynamoDB Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.tags = tags or {}


class DynamoDBComponent(pulumi.ComponentResource):
    """
    Reusable DynamoDB component for transaction storage.
    Creates table with environment-specific capacity mode.
    """

    def __init__(
        self,
        name: str,
        args: DynamoDBComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:database:DynamoDBComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Prepare table arguments
        table_args = {
            'name': f"payment-transactions-{args.environment_suffix}",
            'hash_key': 'transaction_id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='customer_id',
                    type='S'
                ),
            ],
            'billing_mode': (
                'PAY_PER_REQUEST'
                if args.env_config.dynamodb_capacity_mode == 'on-demand'
                else 'PROVISIONED'
            ),
            'global_secondary_indexes': [
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='customer-index',
                    hash_key='customer_id',
                    range_key='timestamp',
                    projection_type='ALL',
                    read_capacity=(
                        args.env_config.dynamodb_read_capacity
                        if args.env_config.dynamodb_capacity_mode == 'provisioned'
                        else None
                    ),
                    write_capacity=(
                        args.env_config.dynamodb_write_capacity
                        if args.env_config.dynamodb_capacity_mode == 'provisioned'
                        else None
                    ),
                )
            ],
            'point_in_time_recovery': aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=args.env_config.dynamodb_pitr_enabled
            ),
            'tags': {
                **args.tags,
                'Name': f"payment-transactions-{args.environment_suffix}",
            },
            'opts': child_opts
        }

        # Add provisioned capacity if not on-demand
        if args.env_config.dynamodb_capacity_mode == 'provisioned':
            table_args['read_capacity'] = args.env_config.dynamodb_read_capacity
            table_args['write_capacity'] = args.env_config.dynamodb_write_capacity

        # Create DynamoDB table
        self.table = aws.dynamodb.Table(
            f"payment-transactions-{args.environment_suffix}",
            **table_args
        )

        # Register outputs
        self.register_outputs({
            'table_name': self.table.name,
            'table_arn': self.table.arn,
        })
