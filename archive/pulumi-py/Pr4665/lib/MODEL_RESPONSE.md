# Industrial IoT Monitoring System - Pulumi Python Implementation

This implementation creates a comprehensive high-throughput IoT monitoring system for a manufacturing plant in Brazil (sa-east-1 region).

## Architecture Overview

The system consists of:
1. **IoT Core** - Device connectivity and MQTT messaging
2. **Kinesis Data Streams** - High-throughput real-time data ingestion
3. **Lambda Functions** - Serverless data processing and transformation
4. **DynamoDB** - Time-series data storage with TTL for hot/cold tiers
5. **S3** - Long-term data archival with lifecycle policies
6. **CloudWatch** - Monitoring, dashboards, and alarms
7. **IAM Roles** - Least privilege access control

## File: lib/tap_stack.py

```python
import pulumi
import pulumi_aws as aws
import json

class TapStack:
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix
        self.region = "sa-east-1"

        # Create all infrastructure components
        self.archival_bucket = self._create_archival_bucket()
        self.sensor_data_table = self._create_dynamodb_table()
        self.kinesis_stream = self._create_kinesis_stream()
        self.lambda_role = self._create_lambda_role()
        self.processor_lambda = self._create_processor_lambda()
        self.iot_role = self._create_iot_role()
        self.iot_policy = self._create_iot_policy()
        self.iot_rule = self._create_iot_rule()
        self.alarm_topic = self._create_sns_topic()
        self.alarms = self._create_cloudwatch_alarms()

        # Export important values
        self._export_outputs()

    def _create_archival_bucket(self):
        """Create S3 bucket for long-term data archival with lifecycle policies"""
        bucket = aws.s3.Bucket(
            f"iot-archival-{self.environment_suffix}",
            bucket=f"iot-sensor-archival-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="archive-old-data",
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        ),
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=180,
                            storage_class="DEEP_ARCHIVE"
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=365
                    )
                )
            ],
            tags={
                "Name": f"iot-archival-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "IoT sensor data archival"
            }
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"iot-archival-public-access-block-{self.environment_suffix}",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        return bucket

    def _create_dynamodb_table(self):
        """Create DynamoDB table for time-series sensor data with TTL"""
        table = aws.dynamodb.Table(
            f"iot-sensor-data-{self.environment_suffix}",
            name=f"iot-sensor-data-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="deviceId",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="deviceId",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="sensorType",
                    type="S"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="SensorTypeIndex",
                    hash_key="sensorType",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            ttl=aws.dynamodb.TableTtlArgs(
                attribute_name="expirationTime",
                enabled=True
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags={
                "Name": f"iot-sensor-data-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "Time-series sensor data storage"
            }
        )

        return table

    def _create_kinesis_stream(self):
        """Create Kinesis Data Stream for real-time sensor data ingestion"""
        stream = aws.kinesis.Stream(
            f"iot-sensor-stream-{self.environment_suffix}",
            name=f"iot-sensor-stream-{self.environment_suffix}",
            shard_count=4,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded",
                "IteratorAgeMilliseconds"
            ],
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={
                "Name": f"iot-sensor-stream-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "Real-time sensor data ingestion"
            }
        )

        return stream

    def _create_lambda_role(self):
        """Create IAM role for Lambda function with least privilege"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }

        role = aws.iam.Role(
            f"iot-processor-lambda-role-{self.environment_suffix}",
            name=f"iot-processor-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"iot-processor-lambda-role-{self.environment_suffix}",
                "Environment": "production"
            }
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Custom policy for Kinesis, DynamoDB, and S3 access
        policy = aws.iam.Policy(
            f"iot-processor-policy-{self.environment_suffix}",
            name=f"iot-processor-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.kinesis_stream.arn,
                self.sensor_data_table.arn,
                self.archival_bucket.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams",
                            "kinesis:ListShards"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:BatchWriteItem"
                        ],
                        "Resource": [args[1], f"{args[1]}/index/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": f"{args[2]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            }))
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-custom-policy-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn=policy.arn
        )

        return role

    def _create_processor_lambda(self):
        """Create Lambda function for processing sensor data"""
        lambda_code = """
import json
import boto3
import base64
import time
import os
from datetime import datetime, timedelta
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

table_name = os.environ['DYNAMODB_TABLE']
bucket_name = os.environ['S3_BUCKET']

def lambda_handler(event, context):
    table = dynamodb.Table(table_name)
    batch_items = []
    processed_count = 0
    error_count = 0
    anomaly_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = json.loads(base64.b64decode(record['kinesis']['data']))

            device_id = payload.get('deviceId')
            sensor_type = payload.get('sensorType')
            timestamp = payload.get('timestamp', int(time.time() * 1000))
            value = payload.get('value')

            # Anomaly detection (simple threshold-based)
            is_anomaly = False
            if sensor_type == 'temperature' and (value < 0 or value > 100):
                is_anomaly = True
                anomaly_count += 1
            elif sensor_type == 'pressure' and (value < 0 or value > 200):
                is_anomaly = True
                anomaly_count += 1

            # Calculate expiration time (30 days from now for hot tier)
            expiration_time = int((datetime.now() + timedelta(days=30)).timestamp())

            # Prepare DynamoDB item
            item = {
                'deviceId': device_id,
                'timestamp': timestamp,
                'sensorType': sensor_type,
                'value': Decimal(str(value)),
                'isAnomaly': is_anomaly,
                'expirationTime': expiration_time,
                'processedAt': int(time.time() * 1000)
            }

            # Add metadata if present
            if 'metadata' in payload:
                item['metadata'] = payload['metadata']

            batch_items.append(item)
            processed_count += 1

            # Batch write to DynamoDB (max 25 items)
            if len(batch_items) >= 25:
                write_batch_to_dynamodb(table, batch_items)
                batch_items = []

            # Archive anomalies to S3 immediately
            if is_anomaly:
                archive_to_s3(device_id, timestamp, payload)

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            error_count += 1

    # Write remaining items
    if batch_items:
        write_batch_to_dynamodb(table, batch_items)

    # Publish custom metrics to CloudWatch
    publish_metrics(processed_count, error_count, anomaly_count)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'errors': error_count,
            'anomalies': anomaly_count
        })
    }

def write_batch_to_dynamodb(table, items):
    try:
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
    except Exception as e:
        print(f"Error writing batch to DynamoDB: {str(e)}")
        raise

def archive_to_s3(device_id, timestamp, data):
    try:
        key = f"anomalies/{device_id}/{timestamp}.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=json.dumps(data),
            ServerSideEncryption='AES256'
        )
    except Exception as e:
        print(f"Error archiving to S3: {str(e)}")

def publish_metrics(processed, errors, anomalies):
    try:
        cloudwatch.put_metric_data(
            Namespace='IoT/Manufacturing',
            MetricData=[
                {
                    'MetricName': 'ProcessedRecords',
                    'Value': processed,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': errors,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'AnomaliesDetected',
                    'Value': anomalies,
                    'Unit': 'Count'
                }
            ]
        )
    except Exception as e:
        print(f"Error publishing metrics: {str(e)}")
"""

        lambda_function = aws.lambda_.Function(
            f"iot-processor-{self.environment_suffix}",
            name=f"iot-sensor-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=60,
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.sensor_data_table.name,
                    "S3_BUCKET": self.archival_bucket.id,
                    "AWS_REGION": self.region
                }
            ),
            reserved_concurrent_executions=10,
            tags={
                "Name": f"iot-processor-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "Sensor data processing"
            }
        )

        # Create event source mapping for Kinesis
        aws.lambda_.EventSourceMapping(
            f"kinesis-lambda-mapping-{self.environment_suffix}",
            event_source_arn=self.kinesis_stream.arn,
            function_name=lambda_function.name,
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=5,
            parallelization_factor=2,
            maximum_retry_attempts=3,
            bisect_batch_on_function_error=True
        )

        return lambda_function

    def _create_iot_role(self):
        """Create IAM role for IoT Core to write to Kinesis"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "iot.amazonaws.com"
                }
            }]
        }

        role = aws.iam.Role(
            f"iot-kinesis-role-{self.environment_suffix}",
            name=f"iot-kinesis-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"iot-kinesis-role-{self.environment_suffix}",
                "Environment": "production"
            }
        )

        # Policy for Kinesis write access
        policy = aws.iam.Policy(
            f"iot-kinesis-policy-{self.environment_suffix}",
            name=f"iot-kinesis-policy-{self.environment_suffix}",
            policy=self.kinesis_stream.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": arn
                    }
                ]
            }))
        )

        aws.iam.RolePolicyAttachment(
            f"iot-kinesis-policy-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn=policy.arn
        )

        return role

    def _create_iot_policy(self):
        """Create IoT policy for device authentication"""
        policy = aws.iot.Policy(
            f"iot-device-policy-{self.environment_suffix}",
            name=f"iot-device-policy-{self.environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect"
                        ],
                        "Resource": f"arn:aws:iot:{self.region}:*:client/${{iot:Connection.Thing.ThingName}}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Publish"
                        ],
                        "Resource": f"arn:aws:iot:{self.region}:*:topic/sensor/data/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Subscribe"
                        ],
                        "Resource": f"arn:aws:iot:{self.region}:*:topicfilter/sensor/commands/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Receive"
                        ],
                        "Resource": f"arn:aws:iot:{self.region}:*:topic/sensor/commands/*"
                    }
                ]
            })
        )

        return policy

    def _create_iot_rule(self):
        """Create IoT rule to forward sensor data to Kinesis"""
        rule = aws.iot.TopicRule(
            f"iot-sensor-rule-{self.environment_suffix}",
            name=f"iot_sensor_rule_{self.environment_suffix}".replace("-", "_"),
            enabled=True,
            sql="SELECT * FROM 'sensor/data/#'",
            sql_version="2016-03-23",
            kinesis=aws.iot.TopicRuleKinesisArgs(
                stream_name=self.kinesis_stream.name,
                role_arn=self.iot_role.arn,
                partition_key="${timestamp()}"
            ),
            error_action=aws.iot.TopicRuleErrorActionArgs(
                cloudwatch_logs=aws.iot.TopicRuleErrorActionCloudwatchLogsArgs(
                    log_group_name=f"/aws/iot/rules/{self.environment_suffix}",
                    role_arn=self.iot_role.arn
                )
            ),
            tags={
                "Name": f"iot-sensor-rule-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "Forward sensor data to Kinesis"
            }
        )

        return rule

    def _create_sns_topic(self):
        """Create SNS topic for CloudWatch alarms"""
        topic = aws.sns.Topic(
            f"iot-alarms-{self.environment_suffix}",
            name=f"iot-alarms-{self.environment_suffix}",
            tags={
                "Name": f"iot-alarms-{self.environment_suffix}",
                "Environment": "production",
                "Purpose": "IoT system alarms"
            }
        )

        return topic

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring"""
        alarms = []

        # Alarm for Lambda errors
        lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-errors-{self.environment_suffix}",
            name=f"iot-lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda function errors exceed threshold",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "FunctionName": self.processor_lambda.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"lambda-errors-{self.environment_suffix}",
                "Environment": "production"
            }
        )
        alarms.append(lambda_error_alarm)

        # Alarm for Kinesis iterator age
        kinesis_age_alarm = aws.cloudwatch.MetricAlarm(
            f"kinesis-iterator-age-{self.environment_suffix}",
            name=f"iot-kinesis-iterator-age-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 60 seconds",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "StreamName": self.kinesis_stream.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"kinesis-iterator-age-{self.environment_suffix}",
                "Environment": "production"
            }
        )
        alarms.append(kinesis_age_alarm)

        # Alarm for DynamoDB throttling
        dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"dynamodb-throttles-{self.environment_suffix}",
            name=f"iot-dynamodb-throttles-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when DynamoDB throttling occurs",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "TableName": self.sensor_data_table.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"dynamodb-throttles-{self.environment_suffix}",
                "Environment": "production"
            }
        )
        alarms.append(dynamodb_throttle_alarm)

        return alarms

    def _export_outputs(self):
        """Export stack outputs"""
        pulumi.export("kinesis_stream_name", self.kinesis_stream.name)
        pulumi.export("kinesis_stream_arn", self.kinesis_stream.arn)
        pulumi.export("dynamodb_table_name", self.sensor_data_table.name)
        pulumi.export("s3_bucket_name", self.archival_bucket.id)
        pulumi.export("lambda_function_name", self.processor_lambda.name)
        pulumi.export("iot_policy_name", self.iot_policy.name)
        pulumi.export("alarm_topic_arn", self.alarm_topic.arn)
        pulumi.export("region", self.region)
```

## File: __main__.py

```python
import pulumi
from lib.tap_stack import TapStack

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Create the IoT monitoring stack
stack = TapStack(environment_suffix)
```

## Implementation Notes

### Architecture Decisions

1. **Kinesis over SQS**: Chose Kinesis Data Streams for high-throughput real-time ingestion with ordered processing and replay capability.

2. **DynamoDB over Timestream**: Used DynamoDB with TTL for cost-effectiveness and flexibility. Timestream has higher costs and is not available in all regions.

3. **Serverless Approach**: Lambda for processing, DynamoDB on-demand, and Kinesis provide automatic scaling without managing servers.

4. **Data Tiering**:
   - Hot tier: DynamoDB with 30-day TTL
   - Cold tier: S3 with lifecycle policies (90 days -> Glacier, 180 days -> Deep Archive)

5. **Security**:
   - Certificate-based IoT authentication via IoT policies
   - KMS encryption for Kinesis
   - S3 encryption at rest
   - DynamoDB encryption enabled
   - IAM roles with least privilege

6. **High Availability**:
   - Multi-AZ: DynamoDB, S3, Lambda are multi-AZ by default
   - Point-in-time recovery for DynamoDB
   - S3 versioning enabled
   - Retry logic in Lambda event source mapping

7. **Monitoring**:
   - CloudWatch alarms for errors, throttling, and lag
   - Custom metrics published from Lambda
   - SNS topic for alarm notifications

### Testing Strategy

The implementation includes:
- Comprehensive error handling in Lambda
- Batch processing with retry logic
- Anomaly detection with immediate S3 archival
- CloudWatch metrics for observability

### Deployment

```bash
pulumi config set environmentSuffix prod
pulumi up
```

### IoT Device Setup

Devices should:
1. Register as IoT Things
2. Attach certificates and the IoT policy
3. Publish to topic: `sensor/data/{deviceId}`
4. Message format:
```json
{
  "deviceId": "sensor-001",
  "sensorType": "temperature",
  "value": 25.5,
  "timestamp": 1234567890000,
  "metadata": {
    "location": "assembly-line-1"
  }
}
```
