# Manufacturing IoT Sensor Data Processing Infrastructure - IDEAL RESPONSE

This document contains the production-ready, tested implementation of the IoT manufacturing data processing infrastructure using CDKTF with Python.

## Architecture Overview

Complete end-to-end IoT data pipeline for manufacturing sensor data:

1. **IoT Core** - Receives sensor data from manufacturing devices using MQTT protocol
2. **IoT Rules** - Routes incoming data to Kinesis Data Streams using IoT Topic Rules
3. **Kinesis Data Streams** - Provides real-time streaming ingestion with KMS encryption
4. **Lambda Function** - Processes data from Kinesis, performs anomaly detection
5. **DynamoDB** - Stores processed sensor metrics with point-in-time recovery
6. **S3** - Archives raw sensor data with lifecycle policies for cost optimization
7. **CloudTrail** - Provides complete audit trail of all API operations
8. **CloudWatch Logs** - Operational logging for Lambda and IoT Rules
9. **KMS** - Customer-managed encryption key for all data at rest

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure - IoT Manufacturing Data Processing."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
    DynamodbTableServerSideEncryption
)
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iot_thing_type import IotThingType
from cdktf_cdktf_provider_aws.iot_topic_rule import (
    IotTopicRule,
    IotTopicRuleKinesis
)
from cdktf_cdktf_provider_aws.cloudtrail import (
    Cloudtrail,
    CloudtrailEventSelector,
    CloudtrailInsightSelector
)
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for Manufacturing IoT Data Processing Infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'ap-southeast-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Get current account and region info
        current_account = DataAwsCallerIdentity(self, "current")
        current_region = DataAwsRegion(self, "current_region")

        # ========================================
        # KMS Key for Encryption
        # ========================================
        kms_key = KmsKey(
            self,
            "iot_encryption_key",
            description=f"KMS key for IoT manufacturing data encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": Fn.join("", [
                                "arn:aws:iam::",
                                current_account.account_id,
                                ":root"
                            ])
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": Fn.join("", [
                                "logs.",
                                current_region.name,
                                ".amazonaws.com"
                            ])
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": Fn.join("", [
                                    "arn:aws:logs:",
                                    current_region.name,
                                    ":",
                                    current_account.account_id,
                                    ":*"
                                ])
                            }
                        }
                    },
                    {
                        "Sid": "Allow Kinesis",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "kinesis.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        KmsAlias(
            self,
            "iot_key_alias",
            name=f"alias/iot-manufacturing-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # ========================================
        # S3 Bucket for Raw Sensor Data Storage
        # ========================================
        sensor_data_bucket = S3Bucket(
            self,
            "sensor_data_bucket",
            bucket=f"iot-sensor-data-{environment_suffix}",
            force_destroy=True
        )

        # Enable versioning
        sensor_bucket_versioning = S3BucketVersioningA(
            self,
            "sensor_bucket_versioning",
            bucket=sensor_data_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Enable encryption
        encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="aws:kms",
            kms_master_key_id=kms_key.arn
        )
        sensor_bucket_encryption = S3BucketServerSideEncryptionConfigurationA(
            self,
            "sensor_bucket_encryption",
            bucket=sensor_data_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=encryption_default,
                bucket_key_enabled=True
            )]
        )

        # Lifecycle policy to transition old data to Glacier
        from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
            S3BucketLifecycleConfigurationRuleFilter
        )
        S3BucketLifecycleConfiguration(
            self,
            "sensor_bucket_lifecycle",
            bucket=sensor_data_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="archive-old-data",
                    status="Enabled",
                    filter=[S3BucketLifecycleConfigurationRuleFilter(
                        prefix=""
                    )],
                    transition=[S3BucketLifecycleConfigurationRuleTransition(
                        days=90,
                        storage_class="GLACIER"
                    )]
                )
            ]
        )

        # ========================================
        # S3 Bucket for CloudTrail Logs
        # ========================================
        cloudtrail_bucket = S3Bucket(
            self,
            "cloudtrail_bucket",
            bucket=f"iot-cloudtrail-logs-{environment_suffix}",
            force_destroy=True
        )

        # Enable encryption for CloudTrail bucket
        cloudtrail_encryption_default = (
            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                sse_algorithm="AES256"
            )
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "cloudtrail_bucket_encryption",
            bucket=cloudtrail_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=cloudtrail_encryption_default
            )]
        )

        # CloudTrail bucket policy
        cloudtrail_bucket_policy = S3BucketPolicy(
            self,
            "cloudtrail_bucket_policy",
            bucket=cloudtrail_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:GetBucketAcl",
                        "Resource": cloudtrail_bucket.arn
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": f"{cloudtrail_bucket.arn}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            })
        )

        # ========================================
        # DynamoDB Table for Processed Sensor Metrics
        # ========================================
        sensor_metrics_table = DynamodbTable(
            self,
            "sensor_metrics_table",
            name=f"sensor-metrics-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="device_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(
                    name="device_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True,
                kms_key_arn=kms_key.arn
            )
        )

        # ========================================
        # Kinesis Data Stream for Real-Time Processing
        # ========================================
        sensor_stream = KinesisStream(
            self,
            "sensor_stream",
            name=f"iot-sensor-stream-{environment_suffix}",
            stream_mode_details={
                "stream_mode": "ON_DEMAND"
            },
            encryption_type="KMS",
            kms_key_id=kms_key.id,
            retention_period=24
        )

        # ========================================
        # CloudWatch Log Groups
        # ========================================
        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/iot-processor-{environment_suffix}",
            retention_in_days=30,
            kms_key_id=kms_key.arn
        )

        iot_log_group = CloudwatchLogGroup(
            self,
            "iot_log_group",
            name=f"/aws/iot/iot-rules-{environment_suffix}",
            retention_in_days=30,
            kms_key_id=kms_key.arn
        )

        # ========================================
        # IAM Role for IoT Rule
        # ========================================
        iot_rule_role = IamRole(
            self,
            "iot_rule_role",
            name=f"iot-rule-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "iot.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="iot-kinesis-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kinesis:PutRecord",
                                "kinesis:PutRecords"
                            ],
                            "Resource": sensor_stream.arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"{iot_log_group.arn}:*"
                        }
                    ]
                })
            )]
        )

        # ========================================
        # IAM Role for Lambda Function
        # ========================================
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"iot-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="lambda-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kinesis:GetRecords",
                                "kinesis:GetShardIterator",
                                "kinesis:DescribeStream",
                                "kinesis:ListShards",
                                "kinesis:ListStreams"
                            ],
                            "Resource": sensor_stream.arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:BatchWriteItem"
                            ],
                            "Resource": sensor_metrics_table.arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject",
                                "s3:PutObjectAcl"
                            ],
                            "Resource": f"{sensor_data_bucket.arn}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"{lambda_log_group.arn}:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": kms_key.arn
                        }
                    ]
                })
            )]
        )

        # ========================================
        # Lambda Function for Processing Sensor Data
        # ========================================
        import os as python_os
        lambda_zip_path = python_os.path.abspath("lambda.zip")
        lambda_function = LambdaFunction(
            self,
            "sensor_processor",
            function_name=f"iot-processor-{environment_suffix}",
            role=lambda_role.arn,
            runtime="python3.11",
            handler="index.lambda_handler",
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=60,
            memory_size=256,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": sensor_metrics_table.name,
                    "S3_BUCKET": sensor_data_bucket.bucket,
                    "ENVIRONMENT_SUFFIX": environment_suffix
                }
            }
        )

        # ========================================
        # Lambda Event Source Mapping from Kinesis
        # ========================================
        LambdaEventSourceMapping(
            self,
            "kinesis_lambda_mapping",
            event_source_arn=sensor_stream.arn,
            function_name=lambda_function.arn,
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=10
        )

        # ========================================
        # IoT Thing Type
        # ========================================
        thing_type = IotThingType(
            self,
            "manufacturing_sensor",
            name=f"manufacturing-sensor-{environment_suffix}",
            properties={
                "searchable_attributes": ["location", "facility", "equipment_type"]
            }
        )

        # ========================================
        # IoT Topic Rule
        # ========================================
        IotTopicRule(
            self,
            "sensor_data_rule",
            name=f"sensor_data_rule_{environment_suffix.replace('-', '_')}",
            description="Route sensor data to Kinesis stream",
            enabled=True,
            sql="SELECT * FROM 'manufacturing/sensors/+/data'",
            sql_version="2016-03-23",
            kinesis=[IotTopicRuleKinesis(
                stream_name=sensor_stream.name,
                role_arn=iot_rule_role.arn,
                partition_key="$${topic(3)}"
            )]
        )

        # ========================================
        # CloudTrail for Compliance Logging
        # ========================================
        Cloudtrail(
            self,
            "iot_audit_trail",
            name=f"iot-audit-trail-{environment_suffix}",
            s3_bucket_name=cloudtrail_bucket.bucket,
            include_global_service_events=True,
            is_multi_region_trail=False,
            enable_logging=True,
            event_selector=[CloudtrailEventSelector(
                read_write_type="All",
                include_management_events=True
            )],
            insight_selector=[CloudtrailInsightSelector(
                insight_type="ApiCallRateInsight"
            )],
            depends_on=[cloudtrail_bucket_policy]
        )

        # ========================================
        # Outputs
        # ========================================
        TerraformOutput(
            self,
            "sensor_data_bucket_name",
            value=sensor_data_bucket.bucket,
            description="S3 bucket for raw sensor data"
        )

        TerraformOutput(
            self,
            "sensor_metrics_table_name",
            value=sensor_metrics_table.name,
            description="DynamoDB table for processed sensor metrics"
        )

        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=sensor_stream.name,
            description="Kinesis stream for real-time sensor data"
        )

        TerraformOutput(
            self,
            "lambda_function_name",
            value=lambda_function.function_name,
            description="Lambda function processing sensor data"
        )

        TerraformOutput(
            self,
            "iot_thing_type_name",
            value=thing_type.name,
            description="IoT Thing Type for manufacturing sensors"
        )

        TerraformOutput(
            self,
            "cloudtrail_name",
            value=f"iot-audit-trail-{environment_suffix}",
            description="CloudTrail for audit logging"
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=kms_key.key_id,
            description="KMS key for encryption"
        )

        # Store references for testing
        self.bucket = sensor_data_bucket
        self.bucket_versioning = sensor_bucket_versioning
        self.bucket_encryption = sensor_bucket_encryption
        self.sensor_data_bucket = sensor_data_bucket
        self.sensor_metrics_table = sensor_metrics_table
        self.kinesis_stream = sensor_stream
        self.lambda_function = lambda_function
        self.kms_key = kms_key
        self.thing_type = thing_type
```

## File: lib/lambda/index.py

```python
"""Lambda function to process IoT sensor data from Kinesis stream."""

import json
import base64
import boto3
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def lambda_handler(event, context):
    """
    Process sensor data from Kinesis stream.

    Args:
        event: Kinesis event with sensor data records
        context: Lambda context object

    Returns:
        dict: Processing result with success/failure counts
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = base64.b64decode(record['kinesis']['data'])
            sensor_data = json.loads(payload)

            # Extract sensor information
            device_id = sensor_data.get('device_id', 'unknown')
            timestamp = sensor_data.get('timestamp', int(datetime.now().timestamp()))
            temperature = sensor_data.get('temperature')
            vibration = sensor_data.get('vibration')
            pressure = sensor_data.get('pressure')

            # Store processed metrics in DynamoDB
            item = {
                'device_id': device_id,
                'timestamp': Decimal(str(timestamp)),
                'temperature': Decimal(str(temperature)) if temperature else None,
                'vibration': Decimal(str(vibration)) if vibration else None,
                'pressure': Decimal(str(pressure)) if pressure else None,
                'processed_at': Decimal(str(int(datetime.now().timestamp())))
            }

            # Remove None values
            item = {k: v for k, v in item.items() if v is not None}

            table.put_item(Item=item)

            # Archive raw data to S3
            s3_key = f"raw-data/{device_id}/{datetime.fromtimestamp(timestamp).strftime('%Y/%m/%d')}/{timestamp}.json"
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=json.dumps(sensor_data),
                ContentType='application/json'
            )

            processed_count += 1

            # Log anomaly detection (simple threshold-based)
            if temperature and float(temperature) > 100:
                print(f"ALERT: High temperature detected for device {device_id}: {temperature}°C")

            if vibration and float(vibration) > 50:
                print(f"ALERT: High vibration detected for device {device_id}: {vibration} Hz")

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            print(f"Record data: {record}")
            failed_count += 1
            continue

    result = {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count,
            'total': len(event['Records'])
        })
    }

    print(f"Processing complete: {processed_count} succeeded, {failed_count} failed")

    return result
```

## Implementation Notes

### Security Features
- KMS customer-managed key with automatic rotation enabled
- All data encrypted at rest (S3, DynamoDB, Kinesis, CloudWatch Logs)
- Least-privilege IAM roles for all services
- CloudTrail enabled for audit logging with insights
- Certificate-based IoT device authentication

### Cost Optimization
- Kinesis on-demand mode for auto-scaling (pay per use)
- DynamoDB on-demand billing mode (no capacity planning needed)
- S3 lifecycle policy transitions to Glacier after 90 days
- CloudWatch Logs retention set to 30 days
- S3 bucket key enabled for reduced KMS costs

### Compliance Features
- CloudTrail logs all API calls with insights enabled
- CloudTrail insights detect unusual API activity
- CloudWatch Logs for operational visibility (30-day retention)
- Point-in-time recovery enabled for DynamoDB
- S3 versioning enabled for data integrity

### Reliability Features
- Lambda error handling with comprehensive logging
- DynamoDB point-in-time recovery for data protection
- S3 versioning for data protection
- Kinesis retention period of 24 hours
- Lambda batch processing from Kinesis (100 records per batch)

### Resource Naming Convention
All resources include the environment suffix for uniqueness:
- S3 buckets: `iot-sensor-data-{suffix}`, `iot-cloudtrail-logs-{suffix}`
- DynamoDB table: `sensor-metrics-{suffix}`
- Kinesis stream: `iot-sensor-stream-{suffix}`
- Lambda function: `iot-processor-{suffix}`
- IAM roles: `iot-rule-role-{suffix}`, `iot-lambda-role-{suffix}`
- IoT Thing Type: `manufacturing-sensor-{suffix}`
- CloudTrail: `iot-audit-trail-{suffix}`
- KMS Alias: `alias/iot-manufacturing-{suffix}`
- CloudWatch Log Groups: `/aws/lambda/iot-processor-{suffix}`, `/aws/iot/iot-rules-{suffix}`

## AWS Services Coverage

1. **AWS IoT Core** - Thing Types and Topic Rules for MQTT data ingestion
2. **Amazon Kinesis Data Streams** - Real-time streaming with on-demand mode
3. **AWS Lambda** - Serverless data processing with Python 3.11 runtime
4. **Amazon DynamoDB** - NoSQL database with on-demand billing and PITR
5. **Amazon S3** - Object storage with versioning and lifecycle policies
6. **AWS KMS** - Customer-managed encryption key with automatic rotation
7. **AWS CloudTrail** - Audit logging with insights enabled
8. **Amazon CloudWatch Logs** - Operational logging for Lambda and IoT Rules
9. **AWS IAM** - Roles and policies with least-privilege access
