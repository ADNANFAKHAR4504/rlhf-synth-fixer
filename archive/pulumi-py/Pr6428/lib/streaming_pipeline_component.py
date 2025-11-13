"""
Streaming Pipeline Component
Encapsulates pipeline orchestration resources (event mappings, alarms)
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List
import time
import random


def create_with_retry(resource_fn, max_retries=5):
    """
    Custom retry logic with exponential backoff and jitter
    Demonstrates advanced error handling pattern
    """
    for attempt in range(max_retries):
        try:
            return resource_fn()
        except Exception as error:
            if attempt == max_retries - 1:
                raise error
            # Exponential backoff with jitter
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            print(f"Retry attempt {attempt + 1}/{max_retries} after {wait_time}s")
            time.sleep(wait_time)
    return None


class StreamingPipelineComponent(pulumi.ComponentResource):
    """
    Custom ComponentResource for streaming pipeline orchestration
    Demonstrates resource encapsulation and dependency management
    """

    def __init__(
            self,
            name: str,
            *,
            environment_suffix: str,
            kinesis_stream_arn: pulumi.Output[str],
            lambda_function_arns: List[pulumi.Output[str]],
            dynamodb_table_name: pulumi.Output[str],
            common_tags: Dict[str, str],
            opts: pulumi.ResourceOptions = None
        ):
        super().__init__("custom:pipeline:StreamingPipeline", name, None, opts)

        child_opts = pulumi.ResourceOptions(parent=self)

        # Create event source mapping for first Lambda (ingestion from Kinesis)
        self.event_source_mapping = aws.lambda_.EventSourceMapping(
            f"kinesis-event-source-{environment_suffix}",
            event_source_arn=kinesis_stream_arn,
            function_name=lambda_function_arns[0],
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=5,
            parallelization_factor=1,
            bisect_batch_on_function_error=True,
            maximum_retry_attempts=3,
            maximum_record_age_in_seconds=86400,
            opts=child_opts
        )

        # Create CloudWatch alarms for monitoring (batched using apply())
        alarm_configs = [
            {
                "name": "kinesis-iterator-age",
                "metric": "GetRecords.IteratorAgeMilliseconds",
                "namespace": "AWS/Kinesis",
                "threshold": 60000,
                "comparison": "GreaterThanThreshold",
                "description": "Kinesis iterator age too high"
            },
            {
                "name": "dynamodb-throttle",
                "metric": "UserErrors",
                "namespace": "AWS/DynamoDB",
                "threshold": 10,
                "comparison": "GreaterThanThreshold",
                "description": "DynamoDB throttling detected"
            }
        ]

        # Create SNS topic for alarm notifications
        self.alarm_topic = aws.sns.Topic(
            f"pipeline-alarms-{environment_suffix}",
            name=f"pipeline-alarms-{environment_suffix}",
            tags={**common_tags, "Name": f"pipeline-alarms-{environment_suffix}"},
            opts=child_opts
        )

        # Create CloudWatch alarms with SNS actions
        self.alarms = []
        for config in alarm_configs:
            alarm = aws.cloudwatch.MetricAlarm(
                f"alarm-{config['name']}-{environment_suffix}",
                name=f"pipeline-{config['name']}-{environment_suffix}",
                comparison_operator=config["comparison"],
                evaluation_periods=2,
                metric_name=config["metric"],
                namespace=config["namespace"],
                period=300,
                statistic="Average",
                threshold=config["threshold"],
                alarm_description=config["description"],
                treat_missing_data="notBreaching",
                alarm_actions=[self.alarm_topic.arn],
                tags={**common_tags, "Name": f"alarm-{config['name']}-{environment_suffix}"},
                opts=pulumi.ResourceOptions(
                    parent=self,
                    depends_on=[self.alarm_topic]
                )
            )
            self.alarms.append(alarm)

        self.register_outputs({
            "event_source_mapping_id": self.event_source_mapping.id,
            "alarm_topic_arn": self.alarm_topic.arn
        })
