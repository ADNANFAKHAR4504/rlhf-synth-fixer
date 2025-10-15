from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_athena as athena
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cloudwatch_actions
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_glue as glue
from aws_cdk import aws_iam as iam
from aws_cdk import aws_iot as iot
from aws_cdk import aws_kinesis as kinesis
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_lambda_event_sources as lambda_event_sources
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_sns as sns
from constructs import Construct


class TrafficAnalyticsPlatformStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 1. S3 bucket for storing analytics data for QuickSight/Athena
        analytics_bucket = s3.Bucket(
            self,
            "TrafficAnalyticsBucket",
            removal_policy=RemovalPolicy.RETAIN,  # Keep the bucket even if stack is deleted
            encryption=s3.BucketEncryption.S3_MANAGED,  # Enable encryption
            versioned=True,  # Enable versioning for data protection (Fault Tolerance)
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Security best practice
        )

        # 2. Kinesis Data Stream for real-time traffic sensor data ingestion
        traffic_data_stream = kinesis.Stream(
            self,
            "TrafficDataStream",
            shard_count=50,  # Scaled for high volume and concurrency
            retention_period=Duration.hours(24),
            stream_mode=kinesis.StreamMode.PROVISIONED,
        )

        # 3. DynamoDB table for storing processed traffic data (High Availability & Fault Tolerance)
        traffic_table = dynamodb.Table(
            self,
            "TrafficDataTable",
            partition_key=dynamodb.Attribute(
                name="sensor_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling capacity
            point_in_time_recovery=True,  # Enable for fault tolerance and disaster recovery
            removal_policy=RemovalPolicy.RETAIN,  # Keep data if stack is deleted
        )

        # Secondary indexes for efficient queries by location and congestion level
        traffic_table.add_global_secondary_index(
            index_name="LocationIndex",
            partition_key=dynamodb.Attribute(
                name="location_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
        )

        traffic_table.add_global_secondary_index(
            index_name="CongestionIndex",
            partition_key=dynamodb.Attribute(
                name="congestion_level", type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
        )

        # 4. Lambda for processing Kinesis stream data (Real-time stream processing)
        processing_lambda = lambda_.Function(
            self,
            "TrafficDataProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset(
                "lambda/processor"
            ),  # Assumes lambda code exists
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name,
            },
            timeout=Duration.minutes(5),
            memory_size=1024,
            retry_attempts=2,
        )

        # Grant Lambda permission (Least Privilege)
        traffic_data_stream.grant_read(processing_lambda)
        traffic_table.grant_write_data(processing_lambda)
        analytics_bucket.grant_write(processing_lambda)

        # Configure Lambda event source mapping with Kinesis
        processing_lambda.add_event_source(
            lambda_event_sources.KinesisEventSource(
                stream=traffic_data_stream,
                starting_position=lambda_.StartingPosition.LATEST,  # Real-time processing
                batch_size=100,
                max_batching_window=Duration.seconds(60),
                retry_attempts=3,  # Fault Tolerance
            )
        )

        # 5. Lambda for aggregating data for analytics (Periodic Batch Processing)
        aggregation_lambda = lambda_.Function(
            self,
            "TrafficDataAggregator",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset(
                "lambda/aggregator"
            ),  # Assumes lambda code exists
            environment={
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "ANALYTICS_BUCKET_NAME": analytics_bucket.bucket_name,
            },
            timeout=Duration.minutes(10),
            memory_size=1024,
        )

        # Grant permissions for aggregation Lambda
        traffic_table.grant_read_data(aggregation_lambda)
        analytics_bucket.grant_write(aggregation_lambda)

        # EventBridge rule to trigger aggregation Lambda every 15 minutes
        events.Rule(
            self,
            "TrafficAggregationRule",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[targets.LambdaFunction(aggregation_lambda)],
        )

        # 6. SNS topic for congestion alerts
        alerts_topic = sns.Topic(
            self, "TrafficAlertsTopic", display_name="Traffic Congestion Alerts"
        )

        # 7. Lambda for analyzing traffic and sending congestion alerts (Alerting logic)
        alert_lambda = lambda_.Function(
            self,
            "TrafficAlertProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda/alerts"),  # Assumes lambda code exists
            environment={
                "SNS_TOPIC_ARN": alerts_topic.topic_arn,
                "DYNAMODB_TABLE_NAME": traffic_table.table_name,
                "CONGESTION_THRESHOLD": "80",  # 80% congestion threshold
            },
            timeout=Duration.minutes(5),
            memory_size=1024,
        )

        # Grant permissions for alerts Lambda (Least Privilege)
        traffic_table.grant_read_data(alert_lambda)
        alerts_topic.grant_publish(alert_lambda)

        # Grant permission to push custom metrics to CloudWatch for the alarm (CRITICAL FIX)
        alert_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=["cloudwatch:PutMetricData"],
                resources=["*"],  # For custom metrics, "*" is the standard practice
            )
        )

        # EventBridge rule to trigger alerts Lambda every 5 minutes
        events.Rule(
            self,
            "TrafficAlertRule",
            schedule=events.Schedule.rate(Duration.minutes(5)),
            targets=[targets.LambdaFunction(alert_lambda)],
        )

        # 8. IoT Core Policy for traffic sensors (Secure communication/Least Privilege)
        iot_policy = iot.CfnPolicy(
            self,
            "TrafficSensorPolicy",
            policy_name="traffic-sensor-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": ["iot:Connect", "iot:Publish"],
                        "Resource": [
                            f"arn:aws:iot:{self.region}:{self.account}:client/${{iot:ClientId}}",
                            f"arn:aws:iot:{self.region}:{self.account}:topic/traffic/data",
                        ],
                    }
                ],
            },
        )

        # 9. IAM role for IoT rule to publish to Kinesis (Least Privilege)
        iot_rule_role = iam.Role(
            self,
            "IoTRuleRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"),
        )

        # Add policy for IoT rule to publish to Kinesis (Least Privilege)
        iot_rule_role.add_to_policy(
            iam.PolicyStatement(
                actions=["kinesis:PutRecord", "kinesis:PutRecords"],
                resources=[traffic_data_stream.stream_arn],
            )
        )

        # 10. IoT Rule to forward data from IoT Core to Kinesis
        iot_to_kinesis_rule = iot.CfnTopicRule(
            self,
            "TrafficToKinesisRule",
            rule_name="TrafficToKinesis",
            topic_rule_payload={
                "sql": "SELECT * FROM 'traffic/data'",  # Process all messages from traffic/data topic
                "actions": [
                    {
                        "kinesis": {
                            "streamName": traffic_data_stream.stream_name,
                            "partitionKey": "${sensor_id}",  # Highly available: Partition by sensor ID
                            "roleArn": iot_rule_role.role_arn,
                        }
                    }
                ],
                "ruleDisabled": False,
            },
        )

        # 11. Glue database and tables for QuickSight access via Athena
        analytics_database = glue.CfnDatabase(
            self,
            "TrafficAnalyticsDatabase",
            catalog_id=self.account,
            database_input={"name": "traffic_analytics"},
        )

        # Define the schema for traffic data to enable SQL queries via Athena
        traffic_data_table = glue.CfnTable(
            self,
            "TrafficDataGlueTable",
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
                        },
                    },
                    "columns": [
                        {"name": "sensor_id", "type": "string"},
                        {"name": "timestamp", "type": "bigint"},
                        {"name": "location_id", "type": "string"},
                        {"name": "congestion_level", "type": "double"},
                        {"name": "vehicle_count", "type": "int"},
                        {"name": "average_speed", "type": "double"},
                    ],
                },
                "tableType": "EXTERNAL_TABLE",
            },
        )

        # Athena workgroup for traffic analytics
        analytics_workgroup = athena.CfnWorkGroup(
            self,
            "TrafficAnalyticsWorkGroup",
            name="traffic_analytics_workgroup",
            state="ENABLED",
            work_group_configuration={
                "resultConfiguration": {
                    "outputLocation": f"s3://{analytics_bucket.bucket_name}/athena-results/"
                }
            },
        )

        # 12. CloudWatch dashboard for monitoring the system (Metrics)
        dashboard = cloudwatch.Dashboard(
            self, "TrafficAnalyticsDashboard", dashboard_name="TrafficAnalytics"
        )

        # Kinesis, DynamoDB, and Lambda metrics for the dashboard
        kinesis_metrics = cloudwatch.Metric(
            namespace="AWS/Kinesis",
            metric_name="IncomingRecords",
            dimensions_map={"StreamName": traffic_data_stream.stream_name},
            statistic="Sum",
            period=Duration.minutes(1),
        )

        dynamodb_read_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1),
        )

        dynamodb_write_metrics = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            dimensions_map={"TableName": traffic_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1),
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Sum",
            period=Duration.minutes(1),
        )

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            dimensions_map={"FunctionName": processing_lambda.function_name},
            statistic="Average",
            period=Duration.minutes(1),
        )

        # Create a dashboard with widgets for key metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Kinesis Incoming Records", left=[kinesis_metrics]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[dynamodb_read_metrics, dynamodb_write_metrics],
            ),
            cloudwatch.GraphWidget(
                title="Lambda Performance", left=[lambda_errors, lambda_duration]
            ),
        )

        # Alarm for high traffic congestion (EventBridge for congestion alerts)
        # This custom metric is pushed by the alert Lambda (TrafficAnalytics namespace)
        high_traffic_alarm = cloudwatch.Alarm(
            self,
            "HighTrafficCongestionAlarm",
            metric=cloudwatch.Metric(
                namespace="TrafficAnalytics",
                metric_name="CongestionLevel",
                dimensions_map={"Region": "Downtown"},
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,  # 80% congestion
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluation_periods=1,
            alarm_description="Alarm for high traffic congestion in downtown area",
        )

        # Add SNS action to alarm to send notifications
        high_traffic_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # Create CloudFormation outputs for important resources
        CfnOutput(
            self,
            "KinesisStreamName",
            value=traffic_data_stream.stream_name,
            description="Name of the Kinesis stream for traffic data",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=traffic_table.table_name,
            description="Name of the DynamoDB table for traffic data",
        )

        CfnOutput(
            self,
            "AlertsSNSTopic",
            value=alerts_topic.topic_arn,
            description="ARN of the SNS topic for congestion alerts",
        )

        CfnOutput(
            self,
            "AnalyticsBucketName",
            value=analytics_bucket.bucket_name,
            description="Name of the S3 bucket for analytics data",
        )

        CfnOutput(
            self,
            "GlueDatabaseName",
            value=analytics_database.ref,
            description="Name of the Glue database for analytics",
        )
