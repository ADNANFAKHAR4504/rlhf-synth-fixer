"""Event processing - EventBridge Global Endpoints"""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_event_bus import CloudwatchEventBus
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import (
    CloudwatchEventTarget,
    CloudwatchEventTargetDeadLetterConfig,
    CloudwatchEventTargetRetryPolicy
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
import json


class EventsStack(Construct):
    """Creates EventBridge infrastructure with dead letter queues"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        is_primary: bool
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.is_primary = is_primary

        # Custom Event Bus
        self.event_bus = CloudwatchEventBus(
            self,
            "payment-event-bus",
            name=f"dr-payment-events-{region}-{environment_suffix}",
            tags={
                "Name": f"dr-payment-events-{region}-{environment_suffix}"
            }
        )

        # Dead Letter Queue
        self.dlq = SqsQueue(
            self,
            "event-dlq",
            name=f"dr-event-dlq-{region}-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            tags={
                "Name": f"dr-event-dlq-{region}-{environment_suffix}"
            }
        )

        # Event Rule for payment transactions
        payment_rule = CloudwatchEventRule(
            self,
            "payment-rule",
            name=f"dr-payment-rule-{region}-{environment_suffix}",
            description="Route payment events",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": ["custom.payment"],
                "detail-type": ["Payment Transaction"]
            }),
            tags={
                "Name": f"dr-payment-rule-{region}-{environment_suffix}"
            }
        )

        # Target queue for events
        target_queue = SqsQueue(
            self,
            "event-target-queue",
            name=f"dr-event-target-{region}-{environment_suffix}",
            message_retention_seconds=86400,  # 1 day
            visibility_timeout_seconds=300,
            tags={
                "Name": f"dr-event-target-{region}-{environment_suffix}"
            }
        )

        # Event target with DLQ
        CloudwatchEventTarget(
            self,
            "payment-target",
            rule=payment_rule.name,
            event_bus_name=self.event_bus.name,
            arn=target_queue.arn,
            dead_letter_config=CloudwatchEventTargetDeadLetterConfig(
                arn=self.dlq.arn
            ),
            retry_policy=CloudwatchEventTargetRetryPolicy(
                maximum_event_age_in_seconds=3600,
                maximum_retry_attempts=2
            )
        )
