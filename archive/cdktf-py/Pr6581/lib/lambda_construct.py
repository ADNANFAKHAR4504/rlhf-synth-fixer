"""Lambda functions with layers and proper configuration."""
import json

from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import \
    LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_layer_version import LambdaLayerVersion
from constructs import Construct


class LambdaConstruct(Construct):
    """Lambda functions with layers and monitoring."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 kms_key_id: str, logs_kms_key_id: str, vpc_config: dict, sqs_queues,
                 dynamodb_table, dynamodb_stream_arn: str):
        super().__init__(scope, id)
        
        self.logs_kms_key_id = logs_kms_key_id

        # Create shared layer
        self.shared_layer = self._create_shared_layer(environment_suffix)

        # Create IAM roles
        validator_role = self._create_lambda_role(
            "validator", environment_suffix, sqs_queues.validator_to_processor_queue.arn,
            dynamodb_table.arn, kms_key_id, is_validator=True
        )

        processor_role = self._create_lambda_role(
            "processor", environment_suffix, sqs_queues.processor_to_notifier_queue.arn,
            dynamodb_table.arn, kms_key_id, is_processor=True,
            validator_queue_arn=sqs_queues.validator_to_processor_queue.arn
        )

        notifier_role = self._create_lambda_role(
            "notifier", environment_suffix, None, dynamodb_table.arn, kms_key_id,
            is_notifier=True, processor_queue_arn=sqs_queues.processor_to_notifier_queue.arn,
            stream_arn=dynamodb_stream_arn
        )

        # Validator function
        self.validator_function = self._create_lambda_function(
            "validator", environment_suffix, validator_role.arn,
            kms_key_id, vpc_config, {
                "TABLE_NAME": dynamodb_table.name,
                "PROCESSOR_QUEUE_URL": sqs_queues.validator_to_processor_queue.url
            }
        )

        # Processor function
        self.processor_function = self._create_lambda_function(
            "processor", environment_suffix, processor_role.arn,
            kms_key_id, vpc_config, {
                "TABLE_NAME": dynamodb_table.name,
                "NOTIFIER_QUEUE_URL": sqs_queues.processor_to_notifier_queue.url
            }
        )

        # Notifier function
        self.notifier_function = self._create_lambda_function(
            "notifier", environment_suffix, notifier_role.arn,
            kms_key_id, vpc_config, {
                "TABLE_NAME": dynamodb_table.name
            }
        )

        # Event source mappings
        LambdaEventSourceMapping(
            self, "processor-sqs-trigger",
            event_source_arn=sqs_queues.validator_to_processor_queue.arn,
            function_name=self.processor_function.function_name
        )

        LambdaEventSourceMapping(
            self, "notifier-sqs-trigger",
            event_source_arn=sqs_queues.processor_to_notifier_queue.arn,
            function_name=self.notifier_function.function_name
        )

    def _create_shared_layer(self, environment_suffix: str):
        """Create Lambda layer with shared code."""
        layer = LambdaLayerVersion(
            self, "shared-layer",
            layer_name=f"payment-shared-layer-{environment_suffix}-ef",
            compatible_runtimes=["python3.11"],
            description="Shared utilities for payment processing",
            filename="../../../lib/lambda/shared_layer.zip"
        )
        return layer

    def _create_lambda_role(self, function_name: str, environment_suffix: str,
                           queue_arn: str = None, table_arn: str = None, kms_key_arn: str = None,
                           is_validator: bool = False, is_processor: bool = False,
                           is_notifier: bool = False, validator_queue_arn: str = None,
                           processor_queue_arn: str = None, stream_arn: str = None):
        """Create IAM role for Lambda function."""
        role = IamRole(
            self, f"{function_name}-role",
            name=f"payment-{function_name}-role-{environment_suffix}-ef",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-{function_name}-role-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Basic Lambda execution policy
        IamRolePolicyAttachment(
            self, f"{function_name}-basic-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # X-Ray policy
        IamRolePolicyAttachment(
            self, f"{function_name}-xray-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Custom policy for specific permissions
        policy_statements = []

        # KMS decrypt permissions
        if kms_key_arn:
            policy_statements.append({
                "Effect": "Allow",
                "Action": ["kms:Decrypt", "kms:DescribeKey"],
                "Resource": kms_key_arn
            })

        if table_arn:
            policy_statements.append({
                "Effect": "Allow",
                "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:Query"],
                "Resource": [table_arn, f"{table_arn}/index/*"]
            })

        if is_validator and queue_arn:
            policy_statements.append({
                "Effect": "Allow",
                "Action": ["sqs:SendMessage"],
                "Resource": queue_arn
            })

        if is_processor:
            if validator_queue_arn:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
                    "Resource": validator_queue_arn
                })
            if queue_arn:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": queue_arn
                })

        if is_notifier:
            if processor_queue_arn:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
                    "Resource": processor_queue_arn
                })
            if stream_arn:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": ["dynamodb:GetRecords", "dynamodb:GetShardIterator",
                              "dynamodb:DescribeStream", "dynamodb:ListStreams"],
                    "Resource": stream_arn
                })

        if policy_statements:
            custom_policy = IamPolicy(
                self, f"{function_name}-custom-policy",
                name=f"payment-{function_name}-policy-{environment_suffix}-ef",
                policy=json.dumps({"Version": "2012-10-17", "Statement": policy_statements})
            )

            IamRolePolicyAttachment(
                self, f"{function_name}-custom-policy-attachment",
                role=role.name,
                policy_arn=custom_policy.arn
            )

        return role

    def _create_lambda_function(self, function_name: str, environment_suffix: str,
                               role_arn: str, kms_key_id: str, vpc_config: dict,
                               env_vars: dict):
        """Create Lambda function."""
        # CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self, f"{function_name}-logs",
            name=f"/aws/lambda/payment-{function_name}-{environment_suffix}-ef",
            retention_in_days=7,
            kms_key_id=self.logs_kms_key_id,
            tags={
                "Name": f"payment-{function_name}-logs-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Lambda function - MISSING reserved_concurrent_executions (deliberate error)
        function = LambdaFunction(
            self, f"{function_name}-function",
            function_name=f"payment-{function_name}-{environment_suffix}-ef",
            filename=f"../../../lib/lambda/{function_name}.zip",
            handler="handler.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            role=role_arn,
            timeout=30,
            memory_size=512,
            layers=[self.shared_layer.arn],
            environment={
                "variables": env_vars
            },
            kms_key_arn=kms_key_id,
            vpc_config={
                "subnet_ids": vpc_config["subnet_ids"],
                "security_group_ids": vpc_config["security_group_ids"]
            },
            tracing_config={
                "mode": "Active"
            },
            tags={
                "Name": f"payment-{function_name}-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            },
            depends_on=[log_group]
        )

        return function
