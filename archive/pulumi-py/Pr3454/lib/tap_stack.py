"""
tap_stack.py

Main Pulumi ComponentResource for the IoT data pipeline infrastructure.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
try:
    from .iot_stack import IoTStack
    from .storage_stack import StorageStack
    from .compute_stack import ComputeStack
    from .monitoring_stack import MonitoringStack
except ImportError:
    # Fallback for direct imports
    from iot_stack import IoTStack
    from storage_stack import StorageStack
    from compute_stack import ComputeStack
    from monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for the IoT TAP project.
    """
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Add default tags
        self.tags.update({
            'Project': 'IoT-TAP',
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        })

        # Create storage resources
        self.storage = StorageStack(
            f"storage-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute resources
        self.compute = ComputeStack(
            f"compute-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            kinesis_stream_arn=self.storage.kinesis_stream.arn,
            dynamodb_table_name=self.storage.dynamodb_table.name,
            s3_bucket_name=self.storage.s3_bucket.bucket,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IoT resources
        self.iot = IoTStack(
            f"iot-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            lambda_function_arn=self.compute.anomaly_lambda.arn,
            kinesis_stream_arn=self.storage.kinesis_stream.arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring resources
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            lambda_function_name=self.compute.anomaly_lambda.name,
            kinesis_stream_name=self.storage.kinesis_stream.name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'iot_endpoint': self.iot.iot_endpoint,
            'kinesis_stream_name': self.storage.kinesis_stream.name,
            'dynamodb_table_name': self.storage.dynamodb_table.name,
            's3_bucket_name': self.storage.s3_bucket.bucket,
            'sns_topic_arn': self.monitoring.sns_topic.arn,
            'lambda_function_name': self.compute.anomaly_lambda.name
        })
