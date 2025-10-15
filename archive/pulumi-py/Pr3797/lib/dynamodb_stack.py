"""
DynamoDB Stack for edge configuration data.
"""

import pulumi
from pulumi_aws import dynamodb
from pulumi import ResourceOptions
from typing import Optional


class DynamoDBStack(pulumi.ComponentResource):
    """
    Creates a DynamoDB table for storing edge configuration data.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dynamodb:DynamoDBStack', name, None, opts)

        # Create DynamoDB table for edge configuration
        self.table = dynamodb.Table(
            f"edge-config-table-{environment_suffix}",
            name=f"tap-edge-config-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="configKey",
            attributes=[
                dynamodb.TableAttributeArgs(
                    name="configKey",
                    type="S"
                )
            ],
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        self.table_name = self.table.name
        self.table_arn = self.table.arn

        self.register_outputs({
            'table_name': self.table_name,
            'table_arn': self.table_arn
        })
