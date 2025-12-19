### Reasoning Trace

---

Alright, I'm being asked to design a real-time IoT analytics system for a smart city with 50,000 traffic sensors using AWS CDK with Python. The system should include several AWS services, ensure high availability, fault tolerance, real-time insights, and secure communication. Let me break down what's needed:

1. **IoT Core**: For securely ingesting data from the 50,000 traffic sensors
2. **Kinesis**: For real-time data streaming
3. **Lambda**: For processing the stream data and performing analytics
4. **DynamoDB**: For storing processed traffic data
5. **QuickSight**: For dashboards and visualization
6. **EventBridge**: For setting up congestion alerts
7. **CloudWatch**: For monitoring and metrics
8. **IAM**: For secure access control using least-privilege principle

The output should be a single CDK stack file named `tap_stack.py` (where TAP might stand for Traffic Analytics Platform).

Let me create this file step by step:

1. First, I'll import the necessary libraries and set up the basic CDK stack structure
2. Then, I'll set up IoT Core for sensor ingestion
3. Next, I'll create the Kinesis stream for real-time data
4. I'll set up Lambda functions for processing
5. Create DynamoDB table for storage
6. Configure QuickSight for visualization (noting that CDK support for QuickSight is limited)
7. Set up EventBridge for alerts
8. Add CloudWatch for monitoring
9. Configure IAM permissions using least-privilege principle

Let me start building the solution:

```python
from aws_cdk import (
    core as cdk,
    aws_iot as iot,
    aws_iotanalytics as iotanalytics,
    aws_kinesis as kinesis,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_quicksight as quicksight,
)

class TrafficAnalyticsPlatformStack(cdk.Stack):
    def __init__(self, scope: cdk.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # IoT Core for sensor ingestion
        # Set up IoT Core rules to forward data to Kinesis

        # Kinesis stream for real-time data
        traffic_data_stream = kinesis.Stream(
            self, "TrafficDataStream",
            shard_count=50,  # Scaled for 50,000 sensors
            retention_period=cdk.Duration.hours(24)
        )

        # DynamoDB table for storing processed data
        traffic_table = dynamodb.Table(
            self, "TrafficDataTable",
            partition_key=dynamodb.Attribute(
                name="sensor_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            # Enable point-in-time recovery for fault tolerance
            point_in_time_recovery=True,
        )

        # Lambda for processing stream data
        processing_lambda = lambda_.Function(
            self, "TrafficDataProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/processor"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
            },
            timeout=cdk.Duration.minutes(5),
            memory_size=1024
        )

        # Grant Lambda permission to read from Kinesis and write to DynamoDB
        traffic_data_stream.grant_read(processing_lambda)
        traffic_table.grant_write_data(processing_lambda)

        # Configure Lambda event source mapping with Kinesis
        lambda_.EventSourceMapping(
            self, "TrafficDataProcessorMapping",
            target=processing_lambda,
            event_source_arn=traffic_data_stream.stream_arn,
            starting_position=lambda_.StartingPosition.LATEST,
            batch_size=100,
            max_batching_window=cdk.Duration.seconds(60)
        )

        # SNS topic for alerts
        alerts_topic = sns.Topic(
            self, "TrafficAlertsTopic",
            display_name="Traffic Congestion Alerts"
        )

        # Lambda for analyzing traffic and sending alerts
        alert_lambda = lambda_.Function(
            self, "TrafficAlertProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/alerts"),
            environment={
                "SNS_TOPIC_ARN": alerts_topic.topic_arn,
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
            },
            timeout=cdk.Duration.minutes(5),
            memory_size=1024
        )

        # Grant permissions for alerts Lambda
        traffic_table.grant_read_data(alert_lambda)
        alerts_topic.grant_publish(alert_lambda)

        # EventBridge rule to trigger alerts Lambda periodically
        events.Rule(
            self, "TrafficAlertRule",
            schedule=events.Schedule.rate(cdk.Duration.minutes(5)),
            targets=[targets.LambdaFunction(alert_lambda)]
        )

        # CloudWatch dashboard for monitoring
        dashboard = cloudwatch.Dashboard(
            self, "TrafficAnalyticsDashboard",
            dashboard_name="TrafficAnalytics"
        )

        # Add metrics to dashboard
        kinesis_metrics = cloudwatch.Metric(
            namespace="AWS/Kinesis",
            metric_name="IncomingRecords",
            dimensions={"StreamName": traffic_data_stream.stream_name},
            statistic="Sum",
            period=cdk.Duration.minutes(1)
        )

        dynamodb_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=cdk.Duration.minutes(1)
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Kinesis Incoming Records",
                left=[kinesis_metrics]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[dynamodb_metrics]
            )
        )

        # IoT Core Policy
        iot_policy = iot.CfnPolicy(
            self, "TrafficSensorPolicy",
            policy_name="traffic-sensor-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish"
                        ],
                        "Resource": [
                            f"arn:aws:iot:{self.region}:{self.account}:client/${{iot:ClientId}}",
                            f"arn:aws:iot:{self.region}:{self.account}:topic/traffic/data"
                        ]
                    }
                ]
            }
        )

        # IoT Rule to forward data to Kinesis
        iot_to_kinesis_rule = iot.CfnTopicRule(
            self, "TrafficToKinesisRule",
            rule_name="TrafficToKinesis",
            topic_rule_payload={
                "sql": "SELECT * FROM 'traffic/data'",
                "actions": [
                    {
                        "kinesis": {
                            "streamName": traffic_data_stream.stream_name,
                            "partitionKey": "${sensor_id}",
                            "roleArn": iot_rule_role.role_arn
                        }
                    }
                ],
                "ruleDisabled": False
            }
        )

        # IAM role for IoT rule to publish to Kinesis
        iot_rule_role = iam.Role(
            self, "IoTRuleRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"),
            inline_policies={
                "PutRecordsPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                            resources=[traffic_data_stream.stream_arn]
                        )
                    ]
                )
            }
        )

        # Alarm for high traffic congestion
        high_traffic_alarm = cloudwatch.Alarm(
            self, "HighTrafficCongestionAlarm",
            metric=cloudwatch.Metric(
                namespace="TrafficAnalytics",
                metric_name="CongestionLevel",
                dimensions={"Region": "Downtown"},
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,  # 80% congestion
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluation_periods=1,
            alarm_description="Alarm for high traffic congestion in downtown area"
        )

        # Add SNS action to alarm
        high_traffic_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )

        # Create outputs
        cdk.CfnOutput(
            self, "KinesisStreamName",
            value=traffic_data_stream.stream_name,
            description="Name of the Kinesis stream"
        )

        cdk.CfnOutput(
            self, "DynamoDBTableName",
            value=traffic_table.table_name,
            description="Name of the DynamoDB table"
        )

        cdk.CfnOutput(
            self, "AlertsSNSTopic",
            value=alerts_topic.topic_arn,
            description="ARN of the SNS topic for alerts"
        )
```

Wait, let me reconsider this code. There are a few issues I notice:

1. The import statement is using `core as cdk`, but AWS CDK v2 has changed the import structure.
2. QuickSight is not fully supported in CDK yet, so I'll need to handle that differently.
3. I need to add some explanation about the Lambda code that would be needed.

Let me revise the code to match AWS CDK v2 and address these issues:

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_iot as iot,
    aws_kinesis as kinesis,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_lambda_event_sources as lambda_event_sources,
    CfnOutput,
    aws_s3 as s3,
    aws_athena as athena,
    aws_glue as glue,
)
from constructs import Construct

class TrafficAnalyticsPlatformStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for storing analytics data for QuickSight
        analytics_bucket = s3.Bucket(
            self, "TrafficAnalyticsBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Kinesis Data Stream for real-time traffic sensor data
        traffic_data_stream = kinesis.Stream(
            self, "TrafficDataStream",
            shard_count=50,  # Scaled for 50,000 sensors
            retention_period=Duration.hours(24),
            stream_mode=kinesis.StreamMode.PROVISIONED,
        )

        # DynamoDB table for storing processed traffic data
        traffic_table = dynamodb.Table(
            self, "TrafficDataTable",
            partition_key=dynamodb.Attribute(
                name="sensor_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,  # Enable for fault tolerance
            removal_policy=RemovalPolicy.RETAIN,  # Keep data if stack is deleted
        )

        # Secondary indexes for efficient queries
        traffic_table.add_global_secondary_index(
            index_name="LocationIndex",
            partition_key=dynamodb.Attribute(
                name="location_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        traffic_table.add_global_secondary_index(
            index_name="CongestionIndex",
            partition_key=dynamodb.Attribute(
                name="congestion_level",
                type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        # Lambda for processing stream data
        processing_lambda = lambda_.Function(
            self, "TrafficDataProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/processor"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(5),
            memory_size=1024,
            retry_attempts=2
        )

        # Grant Lambda permission to read from Kinesis and write to DynamoDB and S3
        traffic_data_stream.grant_read(processing_lambda)
        traffic_table.grant_write_data(processing_lambda)
        analytics_bucket.grant_write(processing_lambda)

        # Configure Lambda event source mapping with Kinesis
        processing_lambda.add_event_source(
            lambda_event_sources.KinesisEventSource(
                stream=traffic_data_stream,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=100,
                max_batching_window=Duration.seconds(60),
                retry_attempts=3
            )
        )

        # Lambda for aggregating data for analytics
        aggregation_lambda = lambda_.Function(
            self, "TrafficDataAggregator",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/aggregator"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(10),
            memory_size=1024
        )

        # Grant permissions for aggregation Lambda
        traffic_table.grant_read_data(aggregation_lambda)
        analytics_bucket.grant_write(aggregation_lambda)

        # EventBridge rule to trigger aggregation Lambda periodically
        events.Rule(
            self, "TrafficAggregationRule",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[targets.LambdaFunction(aggregation_lambda)]
        )

        # SNS topic for congestion alerts
        alerts_topic = sns.Topic(
            self, "TrafficAlertsTopic",
            display_name="Traffic Congestion Alerts"
        )

        # Lambda for analyzing traffic and sending congestion alerts
        alert_lambda = lambda_.Function(
            self, "TrafficAlertProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/alerts"),
            environment={
                "SNS_TOPIC_ARN": alerts_topic.topic_arn,
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "CONGESTION_THRESHOLD": "80"
            },
            timeout=Duration.minutes(5),
            memory_size=1024
        )

        # Grant permissions for alerts Lambda
        traffic_table.grant_read_data(alert_lambda)
        alerts_topic.grant_publish(alert_lambda)

        # EventBridge rule to trigger alerts Lambda periodically
        events.Rule(
            self, "TrafficAlertRule",
            schedule=events.Schedule.rate(Duration.minutes(5)),
            targets=[targets.LambdaFunction(alert_lambda)]
        )

        # IoT Core Policy for traffic sensors
        iot_policy = iot.CfnPolicy(
            self, "TrafficSensorPolicy",
            policy_name="traffic-sensor-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish"
                        ],
                        "Resource": [
                            f"arn:aws:iot:{self.region}:{self.account}:client/${{iot:ClientId}}",
                            f"arn:aws:iot:{self.region}:{self.account}:topic/traffic/data"
                        ]
                    }
                ]
            }
        )

        # IAM role for IoT rule to publish to Kinesis
        iot_rule_role = iam.Role(
            self, "IoTRuleRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"),
        )

        # Add policy for IoT rule to publish to Kinesis
        iot_rule_role.add_to_policy(
            iam.PolicyStatement(
                actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                resources=[traffic_data_stream.stream_arn]
            )
        )

        # IoT Rule to forward data to Kinesis
        iot_to_kinesis_rule = iot.CfnTopicRule(
            self, "TrafficToKinesisRule",
            rule_name="TrafficToKinesis",
            topic_rule_payload={
                "sql": "SELECT * FROM 'traffic/data'",
                "actions": [
                    {
                        "kinesis": {
                            "streamName": traffic_data_stream.stream_name,
                            "partitionKey": "${sensor_id}",
                            "roleArn": iot_rule_role.role_arn
                        }
                    }
                ],
                "ruleDisabled": False
            }
        )

        # Glue database and tables for QuickSight access via Athena
        analytics_database = glue.CfnDatabase(
            self, "TrafficAnalyticsDatabase",
            catalog_id=self.account,
            database_input={
                "name": "traffic_analytics"
            }
        )

        traffic_data_table = glue.CfnTable(
            self, "TrafficDataTable",
            catalog_id=self.account,
            database_name=analytics_database.ref,
            table_input={
                "name": "traffic_data",
                "storageDescriptor": {
                    "location": f"s3://{analytics_bucket.bucket_name}/traffic_data/",
                    "inputFormat": "org.apache.hadoop.mapred.TextInputFormat",
                    "outputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                    "serdeInfo": {
                        "serializationLibrary": "org.openx.data.jsonserde.JsonSerDe",
                        "parameters": {
                            "paths": "sensor_id,timestamp,location_id,congestion_level,vehicle_count,average_speed"
                        }
                    },
                    "columns": [
                        {"name": "sensor_id", "type": "string"},
                        {"name": "timestamp", "type": "bigint"},
                        {"name": "location_id", "type": "string"},
                        {"name": "congestion_level", "type": "double"},
                        {"name": "vehicle_count", "type": "int"},
                        {"name": "average_speed", "type": "double"}
                    ]
                },
                "tableType": "EXTERNAL_TABLE"
            }
        )

        # Athena workgroup for traffic analytics
        analytics_workgroup = athena.CfnWorkGroup(
            self, "TrafficAnalyticsWorkGroup",
            name="traffic_analytics_workgroup",
            state="ENABLED",
            work_group_configuration={
                "resultConfiguration": {
                    "outputLocation": f"s3://{analytics_bucket.bucket_name}/athena-results/"
                }
            }
        )

        # CloudWatch dashboard for monitoring
        dashboard = cloudwatch.Dashboard(
            self, "TrafficAnalyticsDashboard",
            dashboard_name="TrafficAnalytics"
        )

        # Add metrics to dashboard
        kinesis_metrics = cloudwatch.Metric(
            namespace="AWS/Kinesis",
            metric_name="IncomingRecords",
            dimensions_map={"StreamName": traffic_data_stream.stream_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_read_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_write_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Average",
            period=Duration.minutes(1)
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Kinesis Incoming Records",
                left=[kinesis_metrics]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[dynamodb_read_metrics, dynamodb_write_metrics]
            ),
            cloudwatch.GraphWidget(
                title="Lambda Performance",
                left=[lambda_errors, lambda_duration]
            )
        )

        # Alarm for high traffic congestion (custom metric would be pushed by the alert Lambda)
        high_traffic_alarm = cloudwatch.Alarm(
            self, "HighTrafficCongestionAlarm",
            metric=cloudwatch.Metric(
                namespace="TrafficAnalytics",
                metric_name="CongestionLevel",
                dimensions_map={"Region": "Downtown"},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,  # 80% congestion
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluation_periods=1,
            alarm_description="Alarm for high traffic congestion in downtown area"
        )

        # Add SNS action to alarm
        high_traffic_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )

        # Create outputs
        CfnOutput(
            self, "KinesisStreamName",
            value=traffic_data_stream.stream_name,
            description="Name of the Kinesis stream"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=traffic_table.table_name,
            description="Name of the DynamoDB table"
        )

        CfnOutput(
            self, "AlertsSNSTopic",
            value=alerts_topic.topic_arn,
            description="ARN of the SNS topic for alerts"
        )

        CfnOutput(
            self, "AnalyticsBucketName",
            value=analytics_bucket.bucket_name,
            description="Name of the S3 bucket for analytics data"
        )

        CfnOutput(
            self, "GlueDatabaseName",
            value=analytics_database.ref,
            description="Name of the Glue database"
        )
```

Let me check the code once more. I believe there are a couple more issues to fix:

1. The imports don't look quite right for AWS CDK v2
2. For QuickSight, since there's limited CDK support, I've used a combination of Athena, Glue, and S3 which is a common pattern for QuickSight data sources.
3. I should add more comments explaining the implementation and the lambda functions.

Let me refine the code one more time:

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_iot as iot,
    aws_kinesis as kinesis,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_lambda_event_sources as lambda_event_sources,
    aws_s3 as s3,
    aws_athena as athena,
    aws_glue as glue,
)
from constructs import Construct

class TrafficAnalyticsPlatformStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for storing analytics data for QuickSight
        # This bucket will store processed data in a format that QuickSight can query via Athena
        analytics_bucket = s3.Bucket(
            self, "TrafficAnalyticsBucket",
            removal_policy=RemovalPolicy.RETAIN,  # Keep the bucket even if stack is deleted
            encryption=s3.BucketEncryption.S3_MANAGED,  # Enable encryption
            versioned=True,  # Enable versioning for data protection
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL  # Security best practice
        )

        # Kinesis Data Stream for real-time traffic sensor data ingestion
        # This stream will handle the high throughput of data from 50,000 sensors
        traffic_data_stream = kinesis.Stream(
            self, "TrafficDataStream",
            shard_count=50,  # Scaled for 50,000 sensors (approximately 1000 sensors per shard)
            retention_period=Duration.hours(24),
            stream_mode=kinesis.StreamMode.PROVISIONED,
        )

        # DynamoDB table for storing processed traffic data
        # This will provide low-latency access to current traffic conditions
        traffic_table = dynamodb.Table(
            self, "TrafficDataTable",
            partition_key=dynamodb.Attribute(
                name="sensor_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling capacity
            point_in_time_recovery=True,  # Enable for fault tolerance and disaster recovery
            removal_policy=RemovalPolicy.RETAIN,  # Keep data if stack is deleted
        )

        # Secondary indexes for efficient queries by location and congestion level
        traffic_table.add_global_secondary_index(
            index_name="LocationIndex",
            partition_key=dynamodb.Attribute(
                name="location_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        traffic_table.add_global_secondary_index(
            index_name="CongestionIndex",
            partition_key=dynamodb.Attribute(
                name="congestion_level",
                type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        # Lambda for processing Kinesis stream data
        # This function will process the raw sensor data, calculate congestion metrics,
        # and store results in DynamoDB for real-time access and S3 for long-term analytics
        processing_lambda = lambda_.Function(
            self, "TrafficDataProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/processor"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(5),
            memory_size=1024,
            retry_attempts=2
        )

        # Grant Lambda permission to read from Kinesis and write to DynamoDB and S3
        traffic_data_stream.grant_read(processing_lambda)
        traffic_table.grant_write_data(processing_lambda)
        analytics_bucket.grant_write(processing_lambda)

        # Configure Lambda event source mapping with Kinesis
        processing_lambda.add_event_source(
            lambda_event_sources.KinesisEventSource(
                stream=traffic_data_stream,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=100,  # Process 100 records at a time
                max_batching_window=Duration.seconds(60),  # Wait up to 60 seconds to accumulate records
                retry_attempts=3  # Retry failed batches 3 times
            )
        )

        # Lambda for aggregating data for analytics
        # This function will run periodically to create aggregated views of traffic data
        # (e.g., hourly averages, daily trends) and store them in S3 for QuickSight dashboards
        aggregation_lambda = lambda_.Function(
            self, "TrafficDataAggregator",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/aggregator"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(10),
            memory_size=1024
        )

        # Grant permissions for aggregation Lambda
        traffic_table.grant_read_data(aggregation_lambda)
        analytics_bucket.grant_write(aggregation_lambda)

        # EventBridge rule to trigger aggregation Lambda every 15 minutes
        events.Rule(
            self, "TrafficAggregationRule",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[targets.LambdaFunction(aggregation_lambda)]
        )

        # SNS topic for congestion alerts
        # This will be used to send notifications when congestion thresholds are exceeded
        alerts_topic = sns.Topic(
            self, "TrafficAlertsTopic",
            display_name="Traffic Congestion Alerts"
        )

        # Lambda for analyzing traffic and sending congestion alerts
        # This function will periodically check traffic conditions and send alerts via SNS
        # when congestion exceeds defined thresholds
        alert_lambda = lambda_.Function(
            self, "TrafficAlertProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/alerts"),
            environment={
                "SNS_TOPIC_ARN": alerts_topic.topic_arn,
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "CONGESTION_THRESHOLD": "80"  # 80% congestion threshold
            },
            timeout=Duration.minutes(5),
            memory_size=1024
        )

        # Grant permissions for alerts Lambda
        traffic_table.grant_read_data(alert_lambda)
        alerts_topic.grant_publish(alert_lambda)

        # EventBridge rule to trigger alerts Lambda every 5 minutes
        events.Rule(
            self, "TrafficAlertRule",
            schedule=events.Schedule.rate(Duration.minutes(5)),
            targets=[targets.LambdaFunction(alert_lambda)]
        )

        # IoT Core Policy for traffic sensors
        # This policy defines what IoT devices are allowed to do
        iot_policy = iot.CfnPolicy(
            self, "TrafficSensorPolicy",
            policy_name="traffic-sensor-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish"
                        ],
                        "Resource": [
                            f"arn:aws:iot:{self.region}:{self.account}:client/${{iot:ClientId}}",
                            f"arn:aws:iot:{self.region}:{self.account}:topic/traffic/data"
                        ]
                    }
                ]
            }
        )

        # IAM role for IoT rule to publish to Kinesis
        iot_rule_role = iam.Role(
            self, "IoTRuleRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"),
        )

        # Add policy for IoT rule to publish to Kinesis
        iot_rule_role.add_to_policy(
            iam.PolicyStatement(
                actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                resources=[traffic_data_stream.stream_arn]
            )
        )

        # IoT Rule to forward data from IoT Core to Kinesis
        # This rule will process messages from traffic sensors and forward them to Kinesis
        iot_to_kinesis_rule = iot.CfnTopicRule(
            self, "TrafficToKinesisRule",
            rule_name="TrafficToKinesis",
            topic_rule_payload={
                "sql": "SELECT * FROM 'traffic/data'",  # Process all messages from traffic/data topic
                "actions": [
                    {
                        "kinesis": {
                            "streamName": traffic_data_stream.stream_name,
                            "partitionKey": "${sensor_id}",  # Partition by sensor ID for even distribution
                            "roleArn": iot_rule_role.role_arn
                        }
                    }
                ],
                "ruleDisabled": False
            }
        )

        # Glue database and tables for QuickSight access via Athena
        # Since QuickSight has limited CDK support, we're setting up Athena + Glue
        # as the analytics engine that QuickSight will use
        analytics_database = glue.CfnDatabase(
            self, "TrafficAnalyticsDatabase",
            catalog_id=self.account,
            database_input={
                "name": "traffic_analytics"
            }
        )

        # Define the schema for traffic data to enable SQL queries via Athena
        traffic_data_table = glue.CfnTable(
            self, "TrafficDataGlueTable",
            catalog_id=self.account,
            database_name=analytics_database.ref,
            table_input={
                "name": "traffic_data",
                "storageDescriptor": {
                    "location": f"s3://{analytics_bucket.bucket_name}/traffic_data/",
                    "inputFormat": "org.apache.hadoop.mapred.TextInputFormat",
                    "outputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                    "serdeInfo": {
                        "serializationLibrary": "org.openx.data.jsonserde.JsonSerDe",
                        "parameters": {
                            "paths": "sensor_id,timestamp,location_id,congestion_level,vehicle_count,average_speed"
                        }
                    },
                    "columns": [
                        {"name": "sensor_id", "type": "string"},
                        {"name": "timestamp", "type": "bigint"},
                        {"name": "location_id", "type": "string"},
                        {"name": "congestion_level", "type": "double"},
                        {"name": "vehicle_count", "type": "int"},
                        {"name": "average_speed", "type": "double"}
                    ]
                },
                "tableType": "EXTERNAL_TABLE"
            }
        )

        # Athena workgroup for traffic analytics
        # This defines the environment for running Athena queries
        analytics_workgroup = athena.CfnWorkGroup(
            self, "TrafficAnalyticsWorkGroup",
            name="traffic_analytics_workgroup",
            state="ENABLED",
            work_group_configuration={
                "resultConfiguration": {
                    "outputLocation": f"s3://{analytics_bucket.bucket_name}/athena-results/"
                }
            }
        )

        # CloudWatch dashboard for monitoring the system
        dashboard = cloudwatch.Dashboard(
            self, "TrafficAnalyticsDashboard",
            dashboard_name="TrafficAnalytics"
        )

        # Add metrics to dashboard for monitoring the system's performance
        kinesis_metrics = cloudwatch.Metric(
            namespace="AWS/Kinesis",
            metric_name="IncomingRecords",
            dimensions_map={"StreamName": traffic_data_stream.stream_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_read_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_write_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Average",
            period=Duration.minutes(1)
        )

        # Create a dashboard with widgets for key metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Kinesis Incoming Records",
                left=[kinesis_metrics]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[dynamodb_read_metrics, dynamodb_write_metrics]
            ),
            cloudwatch.GraphWidget(
                title="Lambda Performance",
                left=[lambda_errors, lambda_duration]
            )
        )

        # Alarm for high traffic congestion (custom metric would be pushed by the alert Lambda)
        high_traffic_alarm = cloudwatch.Alarm(
            self, "HighTrafficCongestionAlarm",
            metric=cloudwatch.Metric(
                namespace="TrafficAnalytics",
                metric_name="CongestionLevel",
                dimensions_map={"Region": "Downtown"},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,  # 80% congestion
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluation_periods=1,
            alarm_description="Alarm for high traffic congestion in downtown area"
        )

        # Add SNS action to alarm to send notifications
        high_traffic_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )

        # Create CloudFormation outputs for important resources
        CfnOutput(
            self, "KinesisStreamName",
            value=traffic_data_stream.stream_name,
            description="Name of the Kinesis stream for traffic data"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=traffic_table.table_name,
            description="Name of the DynamoDB table for traffic data"
        )

        CfnOutput(
            self, "AlertsSNSTopic",
            value=alerts_topic.topic_arn,
            description="ARN of the SNS topic for congestion alerts"
        )

        CfnOutput(
            self, "AnalyticsBucketName",
            value=analytics_bucket.bucket_name,
            description="Name of the S3 bucket for analytics data"
        )

        CfnOutput(
            self, "GlueDatabaseName",
            value=analytics_database.ref,
            description="Name of the Glue database for analytics"
        )
```

I believe this final version addresses all the requirements and provides a robust, secure, and scalable architecture for the smart city traffic analytics system. The code includes:

1. **IoT Core for secure sensor ingestion** - with appropriate policies and rules
2. **Kinesis for real-time data streaming** - scaled appropriately for 50,000 sensors
3. **Lambda for stream processing and analytics** - with multiple functions for different processing needs
4. **DynamoDB for storing processed traffic data** - with efficient indexing
5. **Analytics infrastructure for QuickSight** - using S3, Glue, and Athena as the data sources
6. **EventBridge for congestion alerts** - triggering analysis on a regular schedule
7. **CloudWatch for monitoring and metrics** - with dashboards and alarms
8. **IAM for secure access and least-privilege control** - using appropriate permissions and roles

The system ensures:

- **High availability** through managed services and appropriate configuration
- **Fault tolerance** through retries, error handling, and data backups
- **Real-time insights** through the Kinesis-Lambda-DynamoDB pipeline
- **Secure communication** through appropriate IAM roles and policies

This is the complete `tap_stack.py` file for the Traffic Analytics Platform.

### Answer

---

# Real-Time IoT Traffic Analytics System Using AWS CDK

Below is a comprehensive implementation of a real-time IoT analytics system for a smart city with 50,000 traffic sensors using AWS CDK in Python. This architecture ensures high availability, fault tolerance, real-time insights, and secure communication between components.

## `tap_stack.py`

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_iot as iot,
    aws_kinesis as kinesis,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_lambda_event_sources as lambda_event_sources,
    aws_s3 as s3,
    aws_athena as athena,
    aws_glue as glue,
)
from constructs import Construct

class TrafficAnalyticsPlatformStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for storing analytics data for QuickSight
        analytics_bucket = s3.Bucket(
            self, "TrafficAnalyticsBucket",
            removal_policy=RemovalPolicy.RETAIN,  # Keep the bucket even if stack is deleted
            encryption=s3.BucketEncryption.S3_MANAGED,  # Enable encryption
            versioned=True,  # Enable versioning for data protection
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL  # Security best practice
        )

        # Kinesis Data Stream for real-time traffic sensor data ingestion
        traffic_data_stream = kinesis.Stream(
            self, "TrafficDataStream",
            shard_count=50,  # Scaled for 50,000 sensors (approximately 1000 sensors per shard)
            retention_period=Duration.hours(24),
            stream_mode=kinesis.StreamMode.PROVISIONED,
        )

        # DynamoDB table for storing processed traffic data
        traffic_table = dynamodb.Table(
            self, "TrafficDataTable",
            partition_key=dynamodb.Attribute(
                name="sensor_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling capacity
            point_in_time_recovery=True,  # Enable for fault tolerance and disaster recovery
            removal_policy=RemovalPolicy.RETAIN,  # Keep data if stack is deleted
        )

        # Secondary indexes for efficient queries by location and congestion level
        traffic_table.add_global_secondary_index(
            index_name="LocationIndex",
            partition_key=dynamodb.Attribute(
                name="location_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        traffic_table.add_global_secondary_index(
            index_name="CongestionIndex",
            partition_key=dynamodb.Attribute(
                name="congestion_level",
                type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
        )

        # Lambda for processing Kinesis stream data
        processing_lambda = lambda_.Function(
            self, "TrafficDataProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/processor"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(5),
            memory_size=1024,
            retry_attempts=2
        )

        # Grant Lambda permission to read from Kinesis and write to DynamoDB and S3
        traffic_data_stream.grant_read(processing_lambda)
        traffic_table.grant_write_data(processing_lambda)
        analytics_bucket.grant_write(processing_lambda)

        # Configure Lambda event source mapping with Kinesis
        processing_lambda.add_event_source(
            lambda_event_sources.KinesisEventSource(
                stream=traffic_data_stream,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=100,  # Process 100 records at a time
                max_batching_window=Duration.seconds(60),  # Wait up to 60 seconds to accumulate records
                retry_attempts=3  # Retry failed batches 3 times
            )
        )

        # Lambda for aggregating data for analytics
        aggregation_lambda = lambda_.Function(
            self, "TrafficDataAggregator",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/aggregator"),
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name
            },
            timeout=Duration.minutes(10),
            memory_size=1024
        )

        # Grant permissions for aggregation Lambda
        traffic_table.grant_read_data(aggregation_lambda)
        analytics_bucket.grant_write(aggregation_lambda)

        # EventBridge rule to trigger aggregation Lambda every 15 minutes
        events.Rule(
            self, "TrafficAggregationRule",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[targets.LambdaFunction(aggregation_lambda)]
        )

        # SNS topic for congestion alerts
        alerts_topic = sns.Topic(
            self, "TrafficAlertsTopic",
            display_name="Traffic Congestion Alerts"
        )

        # Lambda for analyzing traffic and sending congestion alerts
        alert_lambda = lambda_.Function(
            self, "TrafficAlertProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/alerts"),
            environment={
                "SNS_TOPIC_ARN": alerts_topic.topic_arn,
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "CONGESTION_THRESHOLD": "80"  # 80% congestion threshold
            },
            timeout=Duration.minutes(5),
            memory_size=1024
        )

        # Grant permissions for alerts Lambda
        traffic_table.grant_read_data(alert_lambda)
        alerts_topic.grant_publish(alert_lambda)

        # EventBridge rule to trigger alerts Lambda every 5 minutes
        events.Rule(
            self, "TrafficAlertRule",
            schedule=events.Schedule.rate(Duration.minutes(5)),
            targets=[targets.LambdaFunction(alert_lambda)]
        )

        # IoT Core Policy for traffic sensors
        iot_policy = iot.CfnPolicy(
            self, "TrafficSensorPolicy",
            policy_name="traffic-sensor-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iot:Connect",
                            "iot:Publish"
                        ],
                        "Resource": [
                            f"arn:aws:iot:{self.region}:{self.account}:client/${{iot:ClientId}}",
                            f"arn:aws:iot:{self.region}:{self.account}:topic/traffic/data"
                        ]
                    }
                ]
            }
        )

        # IAM role for IoT rule to publish to Kinesis
        iot_rule_role = iam.Role(
            self, "IoTRuleRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"),
        )

        # Add policy for IoT rule to publish to Kinesis
        iot_rule_role.add_to_policy(
            iam.PolicyStatement(
                actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                resources=[traffic_data_stream.stream_arn]
            )
        )

        # IoT Rule to forward data from IoT Core to Kinesis
        iot_to_kinesis_rule = iot.CfnTopicRule(
            self, "TrafficToKinesisRule",
            rule_name="TrafficToKinesis",
            topic_rule_payload={
                "sql": "SELECT * FROM 'traffic/data'",  # Process all messages from traffic/data topic
                "actions": [
                    {
                        "kinesis": {
                            "streamName": traffic_data_stream.stream_name,
                            "partitionKey": "${sensor_id}",  # Partition by sensor ID for even distribution
                            "roleArn": iot_rule_role.role_arn
                        }
                    }
                ],
                "ruleDisabled": False
            }
        )

        # Glue database and tables for QuickSight access via Athena
        analytics_database = glue.CfnDatabase(
            self, "TrafficAnalyticsDatabase",
            catalog_id=self.account,
            database_input={
                "name": "traffic_analytics"
            }
        )

        # Define the schema for traffic data to enable SQL queries via Athena
        traffic_data_table = glue.CfnTable(
            self, "TrafficDataGlueTable",
            catalog_id=self.account,
            database_name=analytics_database.ref,
            table_input={
                "name": "traffic_data",
                "storageDescriptor": {
                    "location": f"s3://{analytics_bucket.bucket_name}/traffic_data/",
                    "inputFormat": "org.apache.hadoop.mapred.TextInputFormat",
                    "outputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                    "serdeInfo": {
                        "serializationLibrary": "org.openx.data.jsonserde.JsonSerDe",
                        "parameters": {
                            "paths": "sensor_id,timestamp,location_id,congestion_level,vehicle_count,average_speed"
                        }
                    },
                    "columns": [
                        {"name": "sensor_id", "type": "string"},
                        {"name": "timestamp", "type": "bigint"},
                        {"name": "location_id", "type": "string"},
                        {"name": "congestion_level", "type": "double"},
                        {"name": "vehicle_count", "type": "int"},
                        {"name": "average_speed", "type": "double"}
                    ]
                },
                "tableType": "EXTERNAL_TABLE"
            }
        )

        # Athena workgroup for traffic analytics
        analytics_workgroup = athena.CfnWorkGroup(
            self, "TrafficAnalyticsWorkGroup",
            name="traffic_analytics_workgroup",
            state="ENABLED",
            work_group_configuration={
                "resultConfiguration": {
                    "outputLocation": f"s3://{analytics_bucket.bucket_name}/athena-results/"
                }
            }
        )

        # CloudWatch dashboard for monitoring the system
        dashboard = cloudwatch.Dashboard(
            self, "TrafficAnalyticsDashboard",
            dashboard_name="TrafficAnalytics"
        )

        # Add metrics to dashboard for monitoring the system's performance
        kinesis_metrics = cloudwatch.Metric(
            namespace="AWS/Kinesis",
            metric_name="IncomingRecords",
            dimensions_map={"StreamName": traffic_data_stream.stream_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_read_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        dynamodb_write_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Sum",
            period=Duration.minutes(1)
        )

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Average",
            period=Duration.minutes(1)
        )

        # Create a dashboard with widgets for key metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Kinesis Incoming Records",
                left=[kinesis_metrics]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[dynamodb_read_metrics, dynamodb_write_metrics]
            ),
            cloudwatch.GraphWidget(
                title="Lambda Performance",
                left=[lambda_errors, lambda_duration]
            )
        )

        # Alarm for high traffic congestion (custom metric would be pushed by the alert Lambda)
        high_traffic_alarm = cloudwatch.Alarm(
            self, "HighTrafficCongestionAlarm",
            metric=cloudwatch.Metric(
                namespace="TrafficAnalytics",
                metric_name="CongestionLevel",
                dimensions_map={"Region": "Downtown"},
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,  # 80% congestion
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluation_periods=1,
            alarm_description="Alarm for high traffic congestion in downtown area"
        )

        # Add SNS action to alarm to send notifications
        high_traffic_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )

        # Create CloudFormation outputs for important resources
        CfnOutput(
            self, "KinesisStreamName",
            value=traffic_data_stream.stream_name,
            description="Name of the Kinesis stream for traffic data"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=traffic_table.table_name,
            description="Name of the DynamoDB table for traffic data"
        )

        CfnOutput(
            self, "AlertsSNSTopic",
            value=alerts_topic.topic_arn,
            description="ARN of the SNS topic for congestion alerts"
        )

        CfnOutput(
            self, "AnalyticsBucketName",
            value=analytics_bucket.bucket_name,
            description="Name of the S3 bucket for analytics data"
        )

        CfnOutput(
            self, "GlueDatabaseName",
            value=analytics_database.ref,
            description="Name of the Glue database for analytics"
        )
```

## Architecture Overview

This implementation provides a comprehensive smart city traffic analytics platform with the following components:

1. **IoT Core**: Securely ingests data from 50,000 traffic sensors with proper authentication and authorization.

2. **Kinesis Data Stream**: Handles real-time streaming of sensor data with appropriate scaling (50 shards to handle the high volume of data).

3. **Lambda Functions**:
   - Processing Lambda: Processes incoming sensor data from Kinesis
   - Aggregation Lambda: Creates time-based aggregations for analytics
   - Alert Lambda: Monitors for traffic congestion and triggers alerts

4. **DynamoDB**: Stores processed traffic data with GSIs for efficient queries by location and congestion level.

5. **QuickSight Integration**: Uses S3, Glue, and Athena to create a data source that QuickSight can query for visualization.

6. **EventBridge**: Schedules regular data aggregation and congestion analysis.

7. **CloudWatch**: Provides comprehensive monitoring with dashboards and alarms.

8. **IAM**: Implements least-privilege security principles throughout the stack.

## Key Features

- **High Availability**: Uses AWS managed services that provide inherent high availability.
- **Fault Tolerance**: Includes error handling, retry logic, and data backup strategies.
- **Real-time Insights**: The Kinesis-Lambda-DynamoDB pipeline provides near real-time traffic insights.
- **Security**: Implements proper IAM roles, encryption, and secure communication.
- **Scalability**: Architecture can handle 50,000 sensors with room for growth.
- **Analytics**: Provides both real-time and historical analytics capabilities.
- **Alerting**: Automatically detects and notifies about traffic congestion.

## Lambda Function Requirements

This stack references three Lambda functions that would need to be created in the appropriate folders:

1. `lambda/processor/index.py`: Processes raw sensor data from Kinesis, calculates metrics, and stores in DynamoDB and S3.
2. `lambda/aggregator/index.py`: Creates time-based aggregations (hourly, daily) of traffic data.
3. `lambda/alerts/index.py`: Analyzes traffic patterns to detect congestion and trigger alerts.

Each Lambda function would have access to only the resources it needs, following the principle of least privilege.
