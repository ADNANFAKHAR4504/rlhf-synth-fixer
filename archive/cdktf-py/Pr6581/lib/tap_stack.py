"""Main CDKTF stack for serverless payment processing system."""
from cdktf import TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct

from .api_gateway_construct import ApiGatewayConstruct
from .dynamodb_construct import DynamoDbConstruct
from .kms_construct import KmsConstruct
from .lambda_construct import LambdaConstruct
from .monitoring_construct import MonitoringConstruct
from .sqs_construct import SqsConstruct
from .vpc_construct import VpcConstruct


class TapStack(TerraformStack):
    """Main stack orchestrating all payment processing components."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags]
        )

        # Configure S3 Backend with native state locking
        # Temporarily disabled due to S3 access permissions
        # S3Backend(
        #     self,
        #     bucket=state_bucket,
        #     key=f"{environment_suffix}/{construct_id}.tfstate",
        #     region=state_bucket_region,
        #     encrypt=True,
        # )

        # Add S3 state locking using escape hatch
        # use_lockfile is not a valid S3 backend parameter - removed

        # KMS keys for encryption
        kms = KmsConstruct(self, "kms", environment_suffix=environment_suffix)

        # VPC for Lambda functions
        vpc = VpcConstruct(self, "vpc", environment_suffix=environment_suffix)

        # DynamoDB table for transactions
        dynamodb = DynamoDbConstruct(
            self, "dynamodb",
            environment_suffix=environment_suffix,
            kms_key_id=kms.dynamodb_key.arn
        )

        # SQS queues for inter-function communication
        sqs = SqsConstruct(
            self, "sqs",
            environment_suffix=environment_suffix,
            kms_key_id=kms.sqs_key.arn
        )

        # Lambda functions
        lambda_construct = LambdaConstruct(
            self, "lambda",
            environment_suffix=environment_suffix,
            kms_key_id=kms.lambda_key.arn,
            logs_kms_key_id=kms.logs_key.arn,
            vpc_config={
                "subnet_ids": vpc.private_subnet_ids,
                "security_group_ids": [vpc.lambda_sg_id]
            },
            sqs_queues=sqs,
            dynamodb_table=dynamodb.table,
            dynamodb_stream_arn=dynamodb.stream_arn
        )

        # API Gateway
        api_gateway = ApiGatewayConstruct(
            self, "api-gateway",
            environment_suffix=environment_suffix,
            validator_function=lambda_construct.validator_function
        )

        # Monitoring and observability
        monitoring = MonitoringConstruct(
            self, "monitoring",
            environment_suffix=environment_suffix,
            lambda_functions={
                "validator": lambda_construct.validator_function,
                "processor": lambda_construct.processor_function,
                "notifier": lambda_construct.notifier_function
            },
            sqs_queues={
                "validator_to_processor": sqs.validator_to_processor_queue,
                "processor_to_notifier": sqs.processor_to_notifier_queue
            }
        )

        # Stack outputs
        TerraformOutput(self, "api_gateway_url",
                       value=api_gateway.api_url,
                       description="API Gateway endpoint URL")

        TerraformOutput(self, "dynamodb_table_name",
                       value=dynamodb.table.name,
                       description="DynamoDB table name")

        TerraformOutput(self, "validator_queue_url",
                       value=sqs.validator_to_processor_queue.url,
                       description="Validator to processor queue URL")

        TerraformOutput(self, "processor_queue_url",
                       value=sqs.processor_to_notifier_queue.url,
                       description="Processor to notifier queue URL")

        TerraformOutput(self, "vpc_id",
                       value=vpc.vpc.id,
                       description="VPC ID")
