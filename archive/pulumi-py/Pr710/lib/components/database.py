"""
Database Component - Creates DynamoDB tables with PITR and backup configurations
"""

import pulumi
import pulumi_aws as aws


class DatabaseComponent(pulumi.ComponentResource):
  def __init__(self, name: str, environment: str, tags: dict, opts=None):
    super().__init__("custom:aws:Database", name, None, opts)

    # Determine capacity based on environment
    read_capacity = 5 if environment in ["dev", "test"] else 20
    write_capacity = 5 if environment in ["dev", "test"] else 20

    # DynamoDB Table
    self.table = aws.dynamodb.Table(
        f"{name}-main-table",
        name=f"{environment}-application-data",
        billing_mode="PROVISIONED",
        read_capacity=read_capacity,
        write_capacity=write_capacity,
        hash_key="id",
        range_key="timestamp",
        attributes=[
            aws.dynamodb.TableAttributeArgs(name="id", type="S"),
            aws.dynamodb.TableAttributeArgs(name="timestamp", type="S"),
            aws.dynamodb.TableAttributeArgs(name="user_id", type="S"),
            aws.dynamodb.TableAttributeArgs(name="status", type="S"),
        ],
        global_secondary_indexes=[
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="UserIndex",
                hash_key="user_id",
                range_key="timestamp",
                write_capacity=read_capacity // 2,
                read_capacity=write_capacity // 2,
                projection_type="ALL",
            ),
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="StatusIndex",
                hash_key="status",
                range_key="timestamp",
                write_capacity=read_capacity,
                read_capacity=write_capacity,
                projection_type="ALL",
            ),
        ],
        # ✅ Enable PITR
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        ),
        opts=pulumi.ResourceOptions(parent=self),
    )
