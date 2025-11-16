"""SQS queues for inter-function communication."""
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from constructs import Construct


class SqsConstruct(Construct):
    """SQS queues with DLQs."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, kms_key_id: str):
        super().__init__(scope, id)

        # Dead letter queues
        validator_dlq = SqsQueue(
            self, "validator-dlq",
            name=f"payment-validator-dlq-{environment_suffix}-ef",
            kms_master_key_id=kms_key_id,
            tags={
                "Name": f"payment-validator-dlq-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        processor_dlq = SqsQueue(
            self, "processor-dlq",
            name=f"payment-processor-dlq-{environment_suffix}-ef",
            kms_master_key_id=kms_key_id,
            tags={
                "Name": f"payment-processor-dlq-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        # Main queues (visibility timeout = 6 * 30 seconds = 180 seconds)
        self.validator_to_processor_queue = SqsQueue(
            self, "validator-to-processor",
            name=f"payment-validator-to-processor-{environment_suffix}-ef",
            visibility_timeout_seconds=180,
            kms_master_key_id=kms_key_id,
            redrive_policy='{"deadLetterTargetArn":"' + validator_dlq.arn + '","maxReceiveCount":3}',
            tags={
                "Name": f"payment-validator-to-processor-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        self.processor_to_notifier_queue = SqsQueue(
            self, "processor-to-notifier",
            name=f"payment-processor-to-notifier-{environment_suffix}-ef",
            visibility_timeout_seconds=180,
            kms_master_key_id=kms_key_id,
            redrive_policy='{"deadLetterTargetArn":"' + processor_dlq.arn + '","maxReceiveCount":3}',
            tags={
                "Name": f"payment-processor-to-notifier-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )
