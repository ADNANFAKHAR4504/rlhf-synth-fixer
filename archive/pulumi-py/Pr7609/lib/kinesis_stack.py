"""
kinesis_stack.py

Kinesis Data Stream for real-time transaction ingestion.
Configured for 1000 transactions per minute with encryption.
"""

from typing import Optional, Dict
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import kinesis, cloudwatch


class KinesisStack(pulumi.ComponentResource):
    """
    Kinesis Data Stream stack for transaction ingestion.

    Creates:
    - Kinesis Data Stream with appropriate shard count
    - Stream-level encryption
    - Retention period for transaction monitoring
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:kinesis:KinesisStack', name, None, opts)

        resource_tags = tags or {}

        # Calculate shard count: 1000 tx/min = ~17 tx/sec
        # 1 shard = 1000 records/sec or 1MB/sec
        # Using 1 shard is sufficient for 17 tx/sec
        shard_count = 1

        # Create Kinesis Data Stream
        self.stream = kinesis.Stream(
            f"transaction-stream-{environment_suffix}",
            name=f"transaction-stream-{environment_suffix}",
            shard_count=shard_count,
            retention_period=24,  # 24 hours retention
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",  # Use AWS managed key
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded"
            ],
            tags={
                **resource_tags,
                'Name': f"transaction-stream-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Export values
        self.stream_name = self.stream.name
        self.stream_arn = self.stream.arn

        self.register_outputs({
            'stream_name': self.stream_name,
            'stream_arn': self.stream_arn
        })
