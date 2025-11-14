"""
DynamoDB Global Table configuration.
BUG #14: Point-in-time recovery not enabled on replica
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional


class DynamoDBStack(pulumi.ComponentResource):
    """DynamoDB Global Table for session storage."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:DynamoDBStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-dynamodb-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB Global Table
        self.table = aws.dynamodb.Table(
            f"trading-sessions-{environment_suffix}",
            name=f"trading-sessions-{environment_suffix}-new",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="sessionId",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            # BUG #14: Point-in-time recovery not explicitly enabled on replica
            replicas=[
                aws.dynamodb.TableReplicaArgs(
                    region_name=secondary_region
                    # Missing: point_in_time_recovery=True
                )
            ],
            tags={**tags, 'Name': f"trading-sessions-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.table_name = self.table.name
        self.table_arn = self.table.arn

        self.register_outputs({
            'table_name': self.table.name,
            'table_arn': self.table.arn,
        })
