"""
storage_stack.py

Storage resources including DynamoDB, Kinesis, and S3.
"""

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class StorageStack(pulumi.ComponentResource):
    """
    Storage infrastructure component.
    """
    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        # DynamoDB table for sensor data
        self.dynamodb_table = aws.dynamodb.Table(
            f"sensor-data-{environment_suffix}",
            name=f"SensorData-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="device_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="device_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="date",
                    type="S"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="DateIndex",
                    hash_key="date",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Kinesis Data Stream
        self.kinesis_stream = aws.kinesis.Stream(
            f"sensor-stream-{environment_suffix}",
            name=f"SensorDataStream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords"
            ],
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for data lake
        self.s3_bucket = aws.s3.BucketV2(
            f"data-lake-{environment_suffix}",
            bucket=f"iot-data-lake-{environment_suffix}-{aws.get_caller_identity().account_id}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket versioning
        self.s3_versioning = aws.s3.BucketVersioningV2(
            f"data-lake-versioning-{environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket encryption
        self.s3_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"data-lake-encryption-{environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # S3 lifecycle configuration for intelligent tiering
        self.s3_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"data-lake-lifecycle-{environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="intelligent-tiering",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=0,
                            storage_class="INTELLIGENT_TIERING"
                        ),
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER_IR"
                        )
                    ]
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket public access block
        self.s3_public_access = aws.s3.BucketPublicAccessBlock(
            f"data-lake-public-access-{environment_suffix}",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'dynamodb_table_name': self.dynamodb_table.name,
            'kinesis_stream_name': self.kinesis_stream.name,
            's3_bucket_name': self.s3_bucket.bucket
        })
