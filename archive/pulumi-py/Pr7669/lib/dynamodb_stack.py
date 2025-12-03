"""
dynamodb_stack.py

DynamoDB tables with environment-specific configurations.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional


class DynamoDBStack(pulumi.ComponentResource):
    """DynamoDB tables for payment processing."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        read_capacity: int,
        write_capacity: int,
        enable_pitr: bool,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:dynamodb:DynamoDBStack", name, None, opts)

        # Transactions table WITHOUT delete_before_replace
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{environment_suffix}",
            name=f"transactions-{environment_suffix}",
            billing_mode="PROVISIONED",
            read_capacity=read_capacity,
            write_capacity=write_capacity,
            hash_key="transactionId",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transactionId",
                    type="S",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="customerId",
                    type="S",
                ),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="CustomerIndex",
                    hash_key="customerId",
                    range_key="timestamp",
                    projection_type="ALL",
                    read_capacity=read_capacity,
                    write_capacity=write_capacity,
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=enable_pitr,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, "Name": f"transactions-{environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                protect=(environment_suffix == "prod"),
                ignore_changes=["read_capacity", "write_capacity"] if enable_pitr else []
            )
        )

        # Sessions table - same safe replacement strategy
        self.sessions_table = aws.dynamodb.Table(
            f"sessions-{environment_suffix}",
            name=f"sessions-{environment_suffix}",
            billing_mode="PROVISIONED",
            read_capacity=read_capacity,
            write_capacity=write_capacity,
            hash_key="sessionId",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="sessionId",
                    type="S",
                ),
            ],
            ttl=aws.dynamodb.TableTtlArgs(
                enabled=True,
                attribute_name="expiresAt",
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=enable_pitr,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, "Name": f"sessions-{environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                protect=(environment_suffix == "prod"),
                ignore_changes=["read_capacity", "write_capacity"] if enable_pitr else []
            )
        )

        self.register_outputs({
            "transactions_table_name": self.transactions_table.name,
            "transactions_table_arn": self.transactions_table.arn,
            "sessions_table_name": self.sessions_table.name,
            "sessions_table_arn": self.sessions_table.arn,
        })
