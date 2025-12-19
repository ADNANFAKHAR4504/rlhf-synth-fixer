"""IoT Data Processing Stack with all AWS services."""

from constructs import Construct
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.kinesis_firehose_delivery_stream import (
    KinesisFirehoseDeliveryStream,
    KinesisFirehoseDeliveryStreamExtendedS3Configuration,
    KinesisFirehoseDeliveryStreamKinesisSourceConfiguration
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTableGlobalSecondaryIndex,
    DynamodbTableServerSideEncryption
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf import TerraformOutput
import json
import os


class IotProcessingStack(Construct):
    """IoT Data Processing infrastructure stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize the IoT Processing stack."""
        super().__init__(scope, construct_id)

        # Get current AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # KMS Key for encryption
        kms_key = KmsKey(
            self,
            "iot-kms-key",
            description=f"KMS key for IoT data encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{current.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow services to use the key",
                        "Effect": "Allow",
                        "Principal": {"Service": [
                            "kinesis.amazonaws.com",
                            "firehose.amazonaws.com",
                            "lambda.amazonaws.com",
                            "s3.amazonaws.com",
                            "sns.amazonaws.com",
                            "cloudwatch.amazonaws.com"
                        ]},
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey",
                            "kms:CreateGrant"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        KmsAlias(
            self,
            "iot-kms-alias",
            name=f"alias/iot-processing-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # S3 Bucket for raw data storage
        raw_data_bucket = S3Bucket(
            self,
            "raw-data-bucket",
            bucket=f"iot-raw-data-{environment_suffix}-{aws_region}",
            force_destroy=True
        )

        S3BucketVersioningA(
            self,
            "raw-data-versioning",
            bucket=raw_data_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "raw-data-encryption",
            bucket=raw_data_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default={
                        "sse_algorithm": "aws:kms",
                        "kms_master_key_id": kms_key.arn
                    },
                    bucket_key_enabled=True
                )
            ]
        )

        S3BucketPublicAccessBlock(
            self,
            "raw-data-pab",
            bucket=raw_data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # S3 Bucket for processed data
        processed_data_bucket = S3Bucket(
            self,
            "processed-data-bucket",
            bucket=f"iot-processed-data-{environment_suffix}-{aws_region}",
            force_destroy=True
        )

        S3BucketVersioningA(
            self,
            "processed-data-versioning",
            bucket=processed_data_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "processed-data-encryption",
            bucket=processed_data_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default={
                        "sse_algorithm": "aws:kms",
                        "kms_master_key_id": kms_key.arn
                    },
                    bucket_key_enabled=True
                )
            ]
        )

        S3BucketPublicAccessBlock(
            self,
            "processed-data-pab",
            bucket=processed_data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Kinesis Data Stream for IoT data ingestion
        kinesis_stream = KinesisStream(
            self,
            "iot-data-stream",
            name=f"iot-data-stream-{environment_suffix}",
            shard_count=10,
            retention_period=24,
            encryption_type="KMS",
            kms_key_id=kms_key.id,
            stream_mode_details={
                "stream_mode": "PROVISIONED"
            }
        )

        # DynamoDB Table for IoT sensor data (replacing Timestream for better compatibility)
        dynamodb_table = DynamodbTable(
            self,
            "iot-sensor-data-table",
            name=f"iot-sensor-data-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sensor_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="sensor_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="S"),
                DynamodbTableAttribute(name="sensor_type", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="SensorTypeIndex",
                    hash_key="sensor_type",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],

            tags={"Purpose": "IoT sensor data storage", "Environment": environment_suffix}
        )

        # SNS Topic for alerts
        alert_topic = SnsTopic(
            self,
            "anomaly-alerts",
            name=f"iot-anomaly-alerts-{environment_suffix}",
            kms_master_key_id=kms_key.id
        )

        # Use existing Secrets Manager secret (fetch, don't create)
        # This assumes the secret already exists in the AWS account
        api_secret_name = f"iot-api-credentials-{environment_suffix}"

        # IAM Role for Lambda processing
        lambda_assume_role = DataAwsIamPolicyDocument(
            self,
            "lambda-assume-role",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["lambda.amazonaws.com"]
                }],
                "effect": "Allow"
            }]
        )

        lambda_role = IamRole(
            self,
            "lambda-execution-role",
            name=f"iot-lambda-role-{environment_suffix}",
            assume_role_policy=lambda_assume_role.json
        )

        lambda_policy = IamRolePolicy(
            self,
            "lambda-execution-policy",
            name="iot-lambda-policy",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{aws_region}:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams",
                            "kinesis:ListShards"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem",
                            "dynamodb:BatchWriteItem"
                        ],
                        "Resource": [
                            dynamodb_table.arn,
                            f"{dynamodb_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": [
                            f"{processed_data_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": alert_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{aws_region}:{current.account_id}:secret:{api_secret_name}*"
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
        )

        # CloudWatch Log Group for Lambda (without KMS key to avoid permission issues)
        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda-log-group",
            name=f"/aws/lambda/iot-processor-{environment_suffix}",
            retention_in_days=7
            # Note: KMS encryption removed to avoid CloudWatch Logs KMS key permission issues
        )

        # Lambda function for data processing and anomaly detection
        processor_lambda = LambdaFunction(
            self,
            "iot-processor",
            function_name=f"iot-processor-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            filename=os.path.join(os.path.dirname(__file__), "lambda", "processor.zip"),
            role=lambda_role.arn,
            timeout=60,
            memory_size=512,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "ALERT_TOPIC_ARN": alert_topic.arn,
                    "PROCESSED_BUCKET": processed_data_bucket.id,
                    "API_SECRET_NAME": api_secret_name
                }
            },
            depends_on=[lambda_log_group]
        )

        # Lambda event source mapping for Kinesis
        LambdaEventSourceMapping(
            self,
            "kinesis-lambda-mapping",
            event_source_arn=kinesis_stream.arn,
            function_name=processor_lambda.arn,
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=10,
            parallelization_factor=2,
            bisect_batch_on_function_error=True,
            maximum_retry_attempts=3
        )

        # IAM Role for Firehose
        firehose_assume_role = DataAwsIamPolicyDocument(
            self,
            "firehose-assume-role",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["firehose.amazonaws.com"]
                }],
                "effect": "Allow"
            }]
        )

        firehose_role = IamRole(
            self,
            "firehose-role",
            name=f"iot-firehose-role-{environment_suffix}",
            assume_role_policy=firehose_assume_role.json
        )

        firehose_policy = IamRolePolicy(
            self,
            "firehose-policy",
            name="iot-firehose-policy",
            role=firehose_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:AbortMultipartUpload",
                            "s3:GetBucketLocation",
                            "s3:GetObject",
                            "s3:ListBucket",
                            "s3:ListBucketMultipartUploads",
                            "s3:PutObject"
                        ],
                        "Resource": [
                            raw_data_bucket.arn,
                            f"{raw_data_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:DescribeStream",
                            "kinesis:GetShardIterator",
                            "kinesis:GetRecords",
                            "kinesis:ListShards"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{aws_region}:*:*"
                    }
                ]
            })
        )

        # Kinesis Firehose for archiving raw data
        firehose_stream = KinesisFirehoseDeliveryStream(
            self,
            "iot-firehose",
            name=f"iot-firehose-{environment_suffix}",
            destination="extended_s3",
            kinesis_source_configuration=KinesisFirehoseDeliveryStreamKinesisSourceConfiguration(
                kinesis_stream_arn=kinesis_stream.arn,
                role_arn=firehose_role.arn
            ),
            extended_s3_configuration=KinesisFirehoseDeliveryStreamExtendedS3Configuration(
                role_arn=firehose_role.arn,
                bucket_arn=raw_data_bucket.arn,
                prefix=(
                    "raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/"
                    "day=!{timestamp:dd}/hour=!{timestamp:HH}/"
                ),
                error_output_prefix=(
                    "errors/year=!{timestamp:yyyy}/month=!{timestamp:MM}/"
                    "day=!{timestamp:dd}/hour=!{timestamp:HH}/!{firehose:error-output-type}"
                ),
                buffering_size=5,
                buffering_interval=300,
                compression_format="GZIP",
                kms_key_arn=kms_key.arn
            )
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum", "label": "Incoming Records"}],
                            [".", "IncomingBytes", {"stat": "Sum", "label": "Incoming Bytes"}],
                            [".", "WriteProvisionedThroughputExceeded", {"stat": "Sum", "label": "Throttled"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Kinesis Stream Metrics",
                        "yAxis": {"left": {"label": "Count"}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}],
                            [".", "ConcurrentExecutions", {"stat": "Maximum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Lambda Processing Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Firehose", "DeliveryToS3.Success", {"stat": "Sum"}],
                            [".", "DeliveryToS3.DataFreshness", {"stat": "Average"}],
                            [".", "DeliveryToS3.Records", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Firehose Delivery Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", dynamodb_table.name, {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", ".", ".", {"stat": "Sum"}],
                            [".", "ItemCount", ".", ".", {"stat": "Average"}],
                            [".", "ThrottledRequests", ".", ".", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "DynamoDB Table Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "iot-dashboard",
            dashboard_name=f"iot-processing-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # CloudWatch Alarms
        kinesis_throttle_alarm = CloudwatchMetricAlarm(
            self,
            "kinesis-throttle-alarm",
            alarm_name=f"iot-kinesis-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="WriteProvisionedThroughputExceeded",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Sum",
            threshold=100,
            alarm_description="Alert when Kinesis stream is being throttled",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "StreamName": kinesis_stream.name
            }
        )

        lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda-error-alarm",
            alarm_name=f"iot-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda errors exceed threshold",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": processor_lambda.function_name
            }
        )

        lambda_duration_alarm = CloudwatchMetricAlarm(
            self,
            "lambda-duration-alarm",
            alarm_name=f"iot-lambda-duration-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=50000,
            alarm_description="Alert when Lambda duration is high",
            alarm_actions=[alert_topic.arn],
            dimensions={
                "FunctionName": processor_lambda.function_name
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis_stream.name,
            description="Name of the Kinesis data stream"
        )

        TerraformOutput(
            self,
            "raw_data_bucket_name",
            value=raw_data_bucket.id,
            description="Name of the raw data S3 bucket"
        )

        TerraformOutput(
            self,
            "processed_data_bucket_name",
            value=processed_data_bucket.id,
            description="Name of the processed data S3 bucket"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=dynamodb_table.name,
            description="Name of the DynamoDB table for IoT sensor data"
        )

        TerraformOutput(
            self,
            "processor_lambda_name",
            value=processor_lambda.function_name,
            description="Name of the processor Lambda function"
        )

        TerraformOutput(
            self,
            "api_secret_name",
            value=api_secret_name,
            description="Name of the existing API credentials secret"
        )

        TerraformOutput(
            self,
            "sns_topic_name",
            value=alert_topic.name,
            description="Name of the SNS topic for alerts"
        )

        TerraformOutput(
            self,
            "firehose_name",
            value=firehose_stream.name,
            description="Name of the Kinesis Firehose delivery stream"
        )

        TerraformOutput(
            self,
            "dashboard_name",
            value=f"iot-processing-{environment_suffix}",
            description="Name of the CloudWatch dashboard"
        )
