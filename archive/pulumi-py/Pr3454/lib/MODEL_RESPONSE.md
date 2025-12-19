Here's the complete Pulumi Python infrastructure code for the IoT data pipeline:

## lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi ComponentResource for the IoT data pipeline infrastructure.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from .iot_stack import IoTStack
from .storage_stack import StorageStack
from .compute_stack import ComputeStack
from .monitoring_stack import MonitoringStack


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
```

## lib/iot_stack.py

```python
"""
iot_stack.py

AWS IoT Core resources including Thing registry, policies, rules, and Device Defender.
"""

import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class IoTStack(pulumi.ComponentResource):
    """
    IoT Core infrastructure component.
    """
    def __init__(
        self,
        name: str,
        environment_suffix: str,
        lambda_function_arn: pulumi.Output[str],
        kinesis_stream_arn: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:iot:IoTStack', name, None, opts)

        # Get IoT endpoint
        self.iot_endpoint = aws.iot.get_endpoint()

        # Create IoT Thing Type
        self.thing_type = aws.iot.ThingType(
            f"industrial-sensor-{environment_suffix}",
            name=f"IndustrialSensor-{environment_suffix}",
            properties=aws.iot.ThingTypePropertiesArgs(
                thing_type_description="Industrial equipment sensor device type"
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IoT Policy for devices
        self.device_policy = aws.iot.Policy(
            f"device-policy-{environment_suffix}",
            name=f"DevicePolicy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish",
                            "iot:Subscribe",
                            "iot:Receive"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "greengrass:Discover"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for IoT Rule
        self.iot_rule_role = aws.iam.Role(
            f"iot-rule-role-{environment_suffix}",
            name=f"IoTRuleRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "iot.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM policies for IoT Rule
        self.iot_lambda_policy = aws.iam.RolePolicy(
            f"iot-lambda-policy-{environment_suffix}",
            role=self.iot_rule_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": lambda_function_arn
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        self.iot_kinesis_policy = aws.iam.RolePolicy(
            f"iot-kinesis-policy-{environment_suffix}",
            role=self.iot_rule_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kinesis:PutRecord",
                        "kinesis:PutRecords"
                    ],
                    "Resource": kinesis_stream_arn
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # IoT Rule for anomaly detection
        self.anomaly_rule = aws.iot.TopicRule(
            f"anomaly-detection-rule-{environment_suffix}",
            name=f"AnomalyDetectionRule_{environment_suffix}",
            description="Route sensor data with high temperature or vibration to Lambda",
            enabled=True,
            sql="SELECT * FROM 'topic/sensor/+' WHERE temperature > 100 OR vibration > 50",
            sql_version="2016-03-23",
            lambda_=aws.iot.TopicRuleLambdaArgs(
                function_arn=lambda_function_arn
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # IoT Rule for all data to Kinesis
        self.kinesis_rule = aws.iot.TopicRule(
            f"kinesis-ingestion-rule-{environment_suffix}",
            name=f"KinesisIngestionRule_{environment_suffix}",
            description="Route all sensor data to Kinesis Data Stream",
            enabled=True,
            sql="SELECT *, timestamp() as ingestion_time FROM 'topic/sensor/+'",
            sql_version="2016-03-23",
            kinesis=aws.iot.TopicRuleKinesisArgs(
                role_arn=self.iot_rule_role.arn,
                stream_name=kinesis_stream_arn.apply(
                    lambda arn: arn.split("/")[-1]
                ),
                partition_key="${topic(3)}"
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Device Defender Security Profile
        self.security_profile = aws.iot.SecurityProfile(
            f"device-security-profile-{environment_suffix}",
            name=f"DeviceSecurityProfile-{environment_suffix}",
            description="Security profile for industrial sensor devices",
            behaviors=[
                aws.iot.SecurityProfileBehaviorArgs(
                    name="message_rate_check",
                    metric="aws:num-messages-sent",
                    criteria=aws.iot.SecurityProfileBehaviorCriteriaArgs(
                        comparison_operator="greater-than",
                        value=aws.iot.SecurityProfileBehaviorCriteriaValueArgs(
                            count=1000
                        ),
                        duration_seconds=300
                    )
                ),
                aws.iot.SecurityProfileBehaviorArgs(
                    name="connection_attempts",
                    metric="aws:num-authorization-failures",
                    criteria=aws.iot.SecurityProfileBehaviorCriteriaArgs(
                        comparison_operator="greater-than",
                        value=aws.iot.SecurityProfileBehaviorCriteriaValueArgs(
                            count=5
                        ),
                        duration_seconds=600
                    )
                )
            ],
            alert_targets={
                "SNS": aws.iot.SecurityProfileAlertTargetArgs(
                    alert_target_arn=pulumi.Output.concat(
                        "arn:aws:sns:us-west-1:",
                        aws.get_caller_identity().account_id,
                        f":IoTSecurityAlerts-{environment_suffix}"
                    ),
                    role_arn=self.iot_rule_role.arn
                )
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Greengrass V2 Core Device Role
        self.greengrass_role = aws.iam.Role(
            f"greengrass-core-role-{environment_suffix}",
            name=f"GreengrassCoreRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "greengrass.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSGreengrassResourceAccessRolePolicy"
            ],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'iot_endpoint': self.iot_endpoint,
            'thing_type': self.thing_type.name,
            'device_policy': self.device_policy.name,
            'security_profile': self.security_profile.name
        })
```

## lib/storage_stack.py

```python
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
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
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
```

## lib/compute_stack.py

```python
"""
compute_stack.py

Compute resources including Lambda functions for anomaly detection.
"""

import json
import pulumi
from pulumi import ResourceOptions, AssetArchive, FileAsset
import pulumi_aws as aws


class ComputeStack(pulumi.ComponentResource):
    """
    Compute infrastructure component.
    """
    def __init__(
        self,
        name: str,
        environment_suffix: str,
        kinesis_stream_arn: pulumi.Output[str],
        dynamodb_table_name: pulumi.Output[str],
        s3_bucket_name: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"lambda-execution-role-{environment_suffix}",
            name=f"AnomalyLambdaRole-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ],
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda policy for DynamoDB, S3, and SageMaker
        self.lambda_policy = aws.iam.RolePolicy(
            f"lambda-policy-{environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": pulumi.Output.concat(
                            "arn:aws:dynamodb:us-west-1:",
                            aws.get_caller_identity().account_id,
                            ":table/",
                            dynamodb_table_name,
                            "*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": pulumi.Output.concat(
                            "arn:aws:s3:::",
                            s3_bucket_name,
                            "/*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sagemaker:InvokeEndpoint"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams"
                        ],
                        "Resource": kinesis_stream_arn
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Lambda layer for dependencies
        self.lambda_layer = aws.lambda_.LayerVersion(
            f"anomaly-detection-layer-{environment_suffix}",
            layer_name=f"AnomalyDetectionLayer-{environment_suffix}",
            compatible_runtimes=["python3.11"],
            code=AssetArchive({
                "python": FileAsset("./lib/lambda_layer")
            }),
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        self.anomaly_lambda = aws.lambda_.Function(
            f"anomaly-detection-{environment_suffix}",
            name=f"AnomalyDetection-{environment_suffix}",
            runtime="python3.11",
            handler="handler.lambda_handler",
            role=self.lambda_role.arn,
            timeout=60,
            memory_size=512,
            reserved_concurrent_executions=10,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "S3_BUCKET": s3_bucket_name,
                    "ENVIRONMENT": environment_suffix,
                    "SAGEMAKER_ENDPOINT": f"anomaly-detection-endpoint-{environment_suffix}"
                }
            ),
            layers=[self.lambda_layer.arn],
            code=AssetArchive({
                "handler.py": FileAsset("./lib/lambda_function/handler.py")
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for IoT
        self.lambda_permission = aws.lambda_.Permission(
            f"iot-invoke-permission-{environment_suffix}",
            statement_id="AllowIoTInvoke",
            action="lambda:InvokeFunction",
            function=self.anomaly_lambda.name,
            principal="iot.amazonaws.com",
            opts=ResourceOptions(parent=self)
        )

        # Kinesis event source mapping
        self.kinesis_event_mapping = aws.lambda_.EventSourceMapping(
            f"kinesis-lambda-mapping-{environment_suffix}",
            event_source_arn=kinesis_stream_arn,
            function_name=self.anomaly_lambda.name,
            starting_position="LATEST",
            maximum_batching_window_in_seconds=5,
            parallelization_factor=2,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'lambda_function_name': self.anomaly_lambda.name,
            'lambda_function_arn': self.anomaly_lambda.arn
        })
```

## lib/monitoring_stack.py

```python
"""
monitoring_stack.py

Monitoring resources including CloudWatch dashboards, alarms, and SNS topics.
"""

import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring infrastructure component.
    """
    def __init__(
        self,
        name: str,
        environment_suffix: str,
        lambda_function_name: pulumi.Output[str],
        kinesis_stream_name: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # SNS topic for anomaly alerts
        self.sns_topic = aws.sns.Topic(
            f"anomaly-alerts-{environment_suffix}",
            name=f"AnomalyAlerts-{environment_suffix}",
            display_name="IoT Anomaly Detection Alerts",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS topic for security alerts
        self.security_sns_topic = aws.sns.Topic(
            f"security-alerts-{environment_suffix}",
            name=f"IoTSecurityAlerts-{environment_suffix}",
            display_name="IoT Security Alerts",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Email subscription (placeholder - replace with actual email)
        self.sns_subscription = aws.sns.TopicSubscription(
            f"anomaly-email-{environment_suffix}",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint="alerts@example.com",
            opts=ResourceOptions(parent=self)
        )

        # Lambda error rate alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{environment_suffix}",
            name=f"Lambda-ErrorRate-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.01,
            alarm_description="Alert when Lambda error rate exceeds 1%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": lambda_function_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda duration alarm
        self.lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-duration-alarm-{environment_suffix}",
            name=f"Lambda-Duration-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=500,
            alarm_description="Alert when Lambda processing latency exceeds 500ms",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": lambda_function_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Kinesis iterator age alarm
        self.kinesis_iterator_alarm = aws.cloudwatch.MetricAlarm(
            f"kinesis-iterator-alarm-{environment_suffix}",
            name=f"Kinesis-IteratorAge-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 60 seconds",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Dashboard
        self.dashboard = aws.cloudwatch.Dashboard(
            f"iot-dashboard-{environment_suffix}",
            dashboard_name=f"IoT-Pipeline-{environment_suffix}",
            dashboard_body=pulumi.Output.json_dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                                [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                                [".", "Duration", {"stat": "Average", "label": "Lambda Duration (ms)"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "Lambda Function Metrics",
                            "period": 300,
                            "dimensions": {
                                "FunctionName": lambda_function_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum"}],
                                [".", "IncomingBytes", {"stat": "Sum"}],
                                [".", "GetRecords.IteratorAgeMilliseconds", {"stat": "Maximum"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "Kinesis Stream Metrics",
                            "period": 300,
                            "dimensions": {
                                "StreamName": kinesis_stream_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/IoT", "PublishIn.Success", {"stat": "Sum"}],
                                [".", "RuleMessageThrottled", {"stat": "Sum"}],
                                [".", "RuleNotFound", {"stat": "Sum"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "IoT Core Metrics",
                            "period": 300
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'sns_topic_arn': self.sns_topic.arn,
            'dashboard_name': self.dashboard.dashboard_name
        })
```

## lib/lambda_function/handler.py

```python
"""
handler.py

Lambda function for IoT anomaly detection using SageMaker.
"""

import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
sagemaker = boto3.client('sagemaker-runtime')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
SAGEMAKER_ENDPOINT = os.environ.get('SAGEMAKER_ENDPOINT')

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event, context):
    """
    Process IoT sensor data for anomaly detection.
    """
    try:
        # Process each record
        for record in event.get('Records', [event]):
            # Extract sensor data
            if 'kinesis' in record:
                # From Kinesis
                payload = json.loads(
                    boto3.client('kinesis').get_records(
                        ShardIterator=record['kinesis']['sequenceNumber']
                    )['Records'][0]['Data']
                )
            else:
                # Direct from IoT Rule
                payload = record

            # Extract sensor metrics
            device_id = payload.get('device_id', 'unknown')
            timestamp = payload.get('timestamp', int(time.time() * 1000))
            temperature = payload.get('temperature', 0)
            vibration = payload.get('vibration', 0)
            pressure = payload.get('pressure', 0)
            humidity = payload.get('humidity', 0)

            # Prepare data for anomaly detection
            sensor_data = {
                'temperature': temperature,
                'vibration': vibration,
                'pressure': pressure,
                'humidity': humidity
            }

            # Call SageMaker endpoint for anomaly detection (if configured)
            is_anomaly = False
            anomaly_score = 0.0

            if SAGEMAKER_ENDPOINT:
                try:
                    response = sagemaker.invoke_endpoint(
                        EndpointName=SAGEMAKER_ENDPOINT,
                        ContentType='application/json',
                        Body=json.dumps(sensor_data)
                    )
                    result = json.loads(response['Body'].read())
                    is_anomaly = result.get('is_anomaly', False)
                    anomaly_score = result.get('anomaly_score', 0.0)
                except Exception as e:
                    print(f"SageMaker inference error: {str(e)}")
                    # Fallback to rule-based detection
                    is_anomaly = temperature > 100 or vibration > 50
                    anomaly_score = 1.0 if is_anomaly else 0.0
            else:
                # Rule-based anomaly detection
                is_anomaly = temperature > 100 or vibration > 50
                anomaly_score = 1.0 if is_anomaly else 0.0

            # Store in DynamoDB
            date_str = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')

            item = {
                'device_id': device_id,
                'timestamp': timestamp,
                'date': date_str,
                'temperature': Decimal(str(temperature)),
                'vibration': Decimal(str(vibration)),
                'pressure': Decimal(str(pressure)),
                'humidity': Decimal(str(humidity)),
                'is_anomaly': is_anomaly,
                'anomaly_score': Decimal(str(anomaly_score)),
                'processed_at': int(time.time() * 1000)
            }

            table.put_item(Item=item)

            # Store raw data in S3 (partitioned by device and date)
            s3_key = f"raw-data/device_id={device_id}/year={date_str[:4]}/month={date_str[5:7]}/day={date_str[8:10]}/{timestamp}.json"
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=json.dumps(payload),
                ContentType='application/json'
            )

            # Send SNS alert if anomaly detected
            if is_anomaly:
                sns_topic_arn = f"arn:aws:sns:us-west-1:{boto3.client('sts').get_caller_identity()['Account']}:AnomalyAlerts-{ENVIRONMENT}"
                message = {
                    'device_id': device_id,
                    'timestamp': timestamp,
                    'anomaly_score': float(anomaly_score),
                    'metrics': sensor_data,
                    'alert_time': datetime.utcnow().isoformat()
                }

                sns.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(message),
                    Subject=f"Anomaly Detected: Device {device_id}"
                )

                print(f"Anomaly detected for device {device_id} with score {anomaly_score}")

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed sensor data')
        }

    except Exception as e:
        print(f"Error processing sensor data: {str(e)}")
        raise e
```

## lib/lambda_layer/requirements.txt

```
boto3==1.28.85
numpy==1.24.3
```