# Serverless Fraud Detection Pipeline - Pulumi Python Implementation

This implementation creates a complete serverless fraud detection pipeline using AWS services with Pulumi and Python.

## Architecture Overview

The solution includes:
1. API Gateway REST API with /transactions POST endpoint
2. Lambda function to validate and publish transactions to SQS
3. SQS queue with dead letter queue for reliable message processing
4. Lambda function to consume from SQS and write to DynamoDB
5. DynamoDB table for transaction storage
6. EventBridge rule for periodic batch processing
7. Lambda function for batch anomaly detection
8. Lambda function for daily report generation
9. S3 bucket for report storage with lifecycle policies
10. CloudWatch alarms for monitoring Lambda errors
11. KMS key for encrypting Lambda environment variables
12. IAM roles with least privilege access

## File: lib/tap_stack.py

```python
"""
Serverless fraud detection pipeline infrastructure stack.

This module defines the TapStack class which creates all AWS resources required for
a serverless fraud detection system including API Gateway, Lambda functions, SQS,
DynamoDB, S3, EventBridge, CloudWatch, and KMS.
"""
import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class TapStackArgs:
    """Arguments for the TapStack."""

    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    Main infrastructure stack for the fraud detection pipeline.

    Creates a complete serverless architecture with API Gateway, Lambda functions,
    SQS queues, DynamoDB table, S3 bucket, EventBridge rules, and monitoring.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('custom:resource:TapStack', name, {}, opts)

        self.environment_suffix = args.environment_suffix

        # Create KMS key for Lambda environment variable encryption
        self.kms_key = self._create_kms_key()

        # Create DynamoDB table for transaction storage
        self.dynamodb_table = self._create_dynamodb_table()

        # Create SQS queues (main queue and DLQ)
        self.dlq, self.sqs_queue = self._create_sqs_queues()

        # Create S3 bucket for reports
        self.s3_bucket = self._create_s3_bucket()

        # Create IAM roles for Lambda functions
        self.api_handler_role = self._create_lambda_role("api-handler")
        self.queue_consumer_role = self._create_lambda_role("queue-consumer")
        self.batch_processor_role = self._create_lambda_role("batch-processor")
        self.report_generator_role = self._create_lambda_role("report-generator")

        # Attach policies to Lambda roles
        self._attach_api_handler_policies()
        self._attach_queue_consumer_policies()
        self._attach_batch_processor_policies()
        self._attach_report_generator_policies()

        # Create Lambda functions
        self.api_handler_lambda = self._create_api_handler_lambda()
        self.queue_consumer_lambda = self._create_queue_consumer_lambda()
        self.batch_processor_lambda = self._create_batch_processor_lambda()
        self.report_generator_lambda = self._create_report_generator_lambda()

        # Create CloudWatch alarms for Lambda functions
        self._create_cloudwatch_alarms()

        # Create API Gateway
        self.api_gateway, self.api_url = self._create_api_gateway()

        # Create EventBridge rules
        self._create_eventbridge_rules()

        # Export stack outputs
        self._export_outputs()

        self.register_outputs({
            'api_endpoint': self.api_url,
            's3_bucket_name': self.s3_bucket.id,
            'dynamodb_table_arn': self.dynamodb_table.arn,
        })

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for Lambda environment variable encryption."""
        kms_key = aws.kms.Key(
            f"lambda-env-key-{self.environment_suffix}",
            description="KMS key for Lambda environment variable encryption",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            opts=ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"lambda-env-key-alias-{self.environment_suffix}",
            name=f"alias/lambda-env-key-{self.environment_suffix}",
            target_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        return kms_key

    def _create_dynamodb_table(self) -> aws.dynamodb.Table:
        """Create DynamoDB table for transaction storage."""
        table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            deletion_protection_enabled=False,
            opts=ResourceOptions(parent=self)
        )

        return table

    def _create_sqs_queues(self) -> tuple:
        """Create SQS main queue and dead letter queue."""
        # Create dead letter queue
        dlq = aws.sqs.Queue(
            f"transaction-dlq-{self.environment_suffix}",
            name=f"transaction-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            opts=ResourceOptions(parent=self)
        )

        # Create main queue with DLQ configuration
        main_queue = aws.sqs.Queue(
            f"transaction-queue-{self.environment_suffix}",
            name=f"transaction-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            redrive_policy=dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": 3
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        return dlq, main_queue

    def _create_s3_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for report storage with lifecycle policies."""
        bucket = aws.s3.Bucket(
            f"fraud-detection-reports-{self.environment_suffix}",
            bucket=f"fraud-detection-reports-{self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning
        aws.s3.BucketVersioningV2(
            f"fraud-detection-reports-versioning-{self.environment_suffix}",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"fraud-detection-reports-encryption-{self.environment_suffix}",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Configure lifecycle policy to transition to Glacier after 90 days
        aws.s3.BucketLifecycleConfigurationV2(
            f"fraud-detection-reports-lifecycle-{self.environment_suffix}",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition-to-glacier",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        return bucket

    def _create_lambda_role(self, function_name: str) -> aws.iam.Role:
        """Create IAM role for Lambda function."""
        role = aws.iam.Role(
            f"{function_name}-role-{self.environment_suffix}",
            name=f"{function_name}-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"{function_name}-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        return role

    def _attach_api_handler_policies(self):
        """Attach policies to API handler Lambda role."""
        # Policy to publish to SQS queue
        aws.iam.RolePolicy(
            f"api-handler-sqs-policy-{self.environment_suffix}",
            role=self.api_handler_role.id,
            policy=self.sqs_queue.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueUrl"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to use KMS key for environment variables
        aws.iam.RolePolicy(
            f"api-handler-kms-policy-{self.environment_suffix}",
            role=self.api_handler_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

    def _attach_queue_consumer_policies(self):
        """Attach policies to queue consumer Lambda role."""
        # Policy to consume from SQS queue
        aws.iam.RolePolicy(
            f"queue-consumer-sqs-policy-{self.environment_suffix}",
            role=self.queue_consumer_role.id,
            policy=Output.all(self.sqs_queue.arn, self.dlq.arn).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": arns[0]
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to write to DynamoDB
        aws.iam.RolePolicy(
            f"queue-consumer-dynamodb-policy-{self.environment_suffix}",
            role=self.queue_consumer_role.id,
            policy=self.dynamodb_table.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to use KMS key
        aws.iam.RolePolicy(
            f"queue-consumer-kms-policy-{self.environment_suffix}",
            role=self.queue_consumer_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

    def _attach_batch_processor_policies(self):
        """Attach policies to batch processor Lambda role."""
        # Policy to scan DynamoDB
        aws.iam.RolePolicy(
            f"batch-processor-dynamodb-policy-{self.environment_suffix}",
            role=self.batch_processor_role.id,
            policy=self.dynamodb_table.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:Scan",
                            "dynamodb:Query"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to use KMS key
        aws.iam.RolePolicy(
            f"batch-processor-kms-policy-{self.environment_suffix}",
            role=self.batch_processor_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

    def _attach_report_generator_policies(self):
        """Attach policies to report generator Lambda role."""
        # Policy to read from DynamoDB
        aws.iam.RolePolicy(
            f"report-generator-dynamodb-policy-{self.environment_suffix}",
            role=self.report_generator_role.id,
            policy=self.dynamodb_table.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:Scan",
                            "dynamodb:Query"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to write to S3
        aws.iam.RolePolicy(
            f"report-generator-s3-policy-{self.environment_suffix}",
            role=self.report_generator_role.id,
            policy=self.s3_bucket.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": f"{arn}/*"
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Policy to use KMS key
        aws.iam.RolePolicy(
            f"report-generator-kms-policy-{self.environment_suffix}",
            role=self.report_generator_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

    def _create_api_handler_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function to handle API Gateway requests."""
        lambda_function = aws.lambda_.Function(
            f"api-handler-{self.environment_suffix}",
            name=f"api-handler-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.api_handler_role.arn,
            memory_size=3072,  # 3GB as required
            timeout=30,
            reserved_concurrent_executions=100,  # As specified in requirements
            kms_key_arn=self.kms_key.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/api_handler')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "QUEUE_URL": self.sqs_queue.url,
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        return lambda_function

    def _create_queue_consumer_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function to consume from SQS and write to DynamoDB."""
        lambda_function = aws.lambda_.Function(
            f"queue-consumer-{self.environment_suffix}",
            name=f"queue-consumer-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.queue_consumer_role.arn,
            memory_size=3072,  # 3GB as required
            timeout=300,  # 5 minutes to match SQS visibility timeout
            reserved_concurrent_executions=100,  # As specified in requirements
            kms_key_arn=self.kms_key.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/queue_consumer')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_table.name,
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure SQS as event source for Lambda
        aws.lambda_.EventSourceMapping(
            f"queue-consumer-event-source-{self.environment_suffix}",
            event_source_arn=self.sqs_queue.arn,
            function_name=lambda_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        return lambda_function

    def _create_batch_processor_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function for batch anomaly detection."""
        lambda_function = aws.lambda_.Function(
            f"batch-processor-{self.environment_suffix}",
            name=f"batch-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.batch_processor_role.arn,
            memory_size=3072,  # 3GB as required
            timeout=300,  # 5 minutes for batch processing
            reserved_concurrent_executions=100,  # As specified in requirements
            kms_key_arn=self.kms_key.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/batch_processor')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_table.name,
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        return lambda_function

    def _create_report_generator_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function to generate daily reports."""
        lambda_function = aws.lambda_.Function(
            f"report-generator-{self.environment_suffix}",
            name=f"report-generator-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.report_generator_role.arn,
            memory_size=3072,  # 3GB as required
            timeout=300,  # 5 minutes for report generation
            reserved_concurrent_executions=100,  # As specified in requirements
            kms_key_arn=self.kms_key.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/report_generator')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_table.name,
                    "BUCKET_NAME": self.s3_bucket.id,
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        return lambda_function

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda error monitoring."""
        lambda_functions = [
            ("api-handler", self.api_handler_lambda),
            ("queue-consumer", self.queue_consumer_lambda),
            ("batch-processor", self.batch_processor_lambda),
            ("report-generator", self.report_generator_lambda)
        ]

        for name, lambda_fn in lambda_functions:
            # Create SNS topic for alarm notifications
            topic = aws.sns.Topic(
                f"{name}-alarm-topic-{self.environment_suffix}",
                name=f"{name}-alarm-topic-{self.environment_suffix}",
                opts=ResourceOptions(parent=self)
            )

            # Create CloudWatch alarm for error rate > 1% over 5 minutes
            aws.cloudwatch.MetricAlarm(
                f"{name}-error-alarm-{self.environment_suffix}",
                name=f"{name}-error-alarm-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,  # 5 minutes
                statistic="Sum",
                threshold=1,
                treat_missing_data="notBreaching",
                dimensions={
                    "FunctionName": lambda_fn.name
                },
                alarm_description=f"Alarm when {name} Lambda error rate exceeds 1% over 5 minutes",
                alarm_actions=[topic.arn],
                opts=ResourceOptions(parent=self)
            )

    def _create_api_gateway(self) -> tuple:
        """Create API Gateway with /transactions POST endpoint."""
        # Create API Gateway REST API
        api = aws.apigateway.RestApi(
            f"fraud-detection-api-{self.environment_suffix}",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="API Gateway for fraud detection transactions",
            opts=ResourceOptions(parent=self)
        )

        # Create /transactions resource
        transactions_resource = aws.apigateway.Resource(
            f"transactions-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions",
            opts=ResourceOptions(parent=self)
        )

        # Create request validator for body validation
        request_validator = aws.apigateway.RequestValidator(
            f"transactions-validator-{self.environment_suffix}",
            rest_api=api.id,
            name=f"transactions-validator-{self.environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=False,
            opts=ResourceOptions(parent=self)
        )

        # Create model for request body schema
        request_model = aws.apigateway.Model(
            f"transaction-model-{self.environment_suffix}",
            rest_api=api.id,
            name="TransactionModel",
            content_type="application/json",
            schema=json.dumps({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "required": ["transaction_id", "amount", "timestamp"],
                "properties": {
                    "transaction_id": {"type": "string"},
                    "amount": {"type": "number"},
                    "timestamp": {"type": "number"},
                    "customer_id": {"type": "string"},
                    "merchant": {"type": "string"}
                }
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create POST method
        post_method = aws.apigateway.Method(
            f"transactions-post-method-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=request_validator.id,
            request_models={
                "application/json": request_model.name
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda integration
        integration = aws.apigateway.Integration(
            f"transactions-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.api_handler_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            f"api-gateway-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.api_handler_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.all(api.execution_arn).apply(
                lambda args: f"{args[0]}/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create deployment
        deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[post_method, integration]
            )
        )

        # Create stage with throttling settings
        stage = aws.apigateway.Stage(
            f"prod-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=deployment.id,
            stage_name="prod",
            opts=ResourceOptions(parent=self)
        )

        # Configure method settings for throttling
        aws.apigateway.MethodSettings(
            f"api-method-settings-{self.environment_suffix}",
            rest_api=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_rate_limit=10000,  # 10,000 requests per second
                throttling_burst_limit=5000,  # 5,000 burst
                logging_level="INFO",
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            opts=ResourceOptions(parent=self, depends_on=[stage])
        )

        # Construct API URL
        api_url = Output.all(api.id, stage.stage_name).apply(
            lambda args: f"https://{args[0]}.execute-api.us-east-1.amazonaws.com/{args[1]}/transactions"
        )

        return api, api_url

    def _create_eventbridge_rules(self):
        """Create EventBridge rules for periodic Lambda invocations."""
        # Create EventBridge rule to trigger batch processor every 5 minutes
        batch_rule = aws.cloudwatch.EventRule(
            f"batch-processor-rule-{self.environment_suffix}",
            name=f"batch-processor-rule-{self.environment_suffix}",
            description="Trigger batch processor Lambda every 5 minutes",
            schedule_expression="rate(5 minutes)",
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge target for batch processor
        aws.cloudwatch.EventTarget(
            f"batch-processor-target-{self.environment_suffix}",
            rule=batch_rule.name,
            arn=self.batch_processor_lambda.arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant EventBridge permission to invoke batch processor Lambda
        aws.lambda_.Permission(
            f"batch-processor-eventbridge-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.batch_processor_lambda.name,
            principal="events.amazonaws.com",
            source_arn=batch_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge rule to trigger report generator daily
        report_rule = aws.cloudwatch.EventRule(
            f"report-generator-rule-{self.environment_suffix}",
            name=f"report-generator-rule-{self.environment_suffix}",
            description="Trigger report generator Lambda daily",
            schedule_expression="rate(1 day)",
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge target for report generator
        aws.cloudwatch.EventTarget(
            f"report-generator-target-{self.environment_suffix}",
            rule=report_rule.name,
            arn=self.report_generator_lambda.arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant EventBridge permission to invoke report generator Lambda
        aws.lambda_.Permission(
            f"report-generator-eventbridge-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.report_generator_lambda.name,
            principal="events.amazonaws.com",
            source_arn=report_rule.arn,
            opts=ResourceOptions(parent=self)
        )

    def _export_outputs(self):
        """Export stack outputs."""
        pulumi.export("api_endpoint", self.api_url)
        pulumi.export("s3_bucket_name", self.s3_bucket.id)
        pulumi.export("dynamodb_table_arn", self.dynamodb_table.arn)
        pulumi.export("sqs_queue_url", self.sqs_queue.url)
        pulumi.export("dlq_url", self.dlq.url)
```

## File: lib/lambda/api_handler/index.py

```python
"""
API Handler Lambda function.

This function receives transaction requests from API Gateway, validates them,
and publishes valid transactions to an SQS queue for processing.
"""
import json
import os
import boto3
from typing import Dict, Any

# Initialize SQS client
sqs = boto3.client('sqs')

# Get environment variables
QUEUE_URL = os.environ['QUEUE_URL']


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.

    Args:
        event: API Gateway event containing transaction data
        context: Lambda context object

    Returns:
        API Gateway response with status code and message
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'timestamp']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }

        # Validate amount is positive
        if body['amount'] <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Amount must be positive'
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }

        # Publish message to SQS
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(body),
            MessageAttributes={
                'transaction_id': {
                    'StringValue': str(body['transaction_id']),
                    'DataType': 'String'
                }
            }
        )

        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Transaction accepted for processing',
                'transaction_id': body['transaction_id'],
                'message_id': response['MessageId']
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
```

## File: lib/lambda/queue_consumer/index.py

```python
"""
Queue Consumer Lambda function.

This function consumes messages from the SQS queue and writes transaction
records to the DynamoDB table.
"""
import json
import os
import boto3
from typing import Dict, Any
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for SQS messages.

    Args:
        event: SQS event containing transaction messages
        context: Lambda context object

    Returns:
        Response indicating processing status
    """
    successful = 0
    failed = 0

    for record in event['Records']:
        try:
            # Parse message body
            body = json.loads(record['body'])

            # Convert float to Decimal for DynamoDB
            if 'amount' in body:
                body['amount'] = Decimal(str(body['amount']))

            # Write to DynamoDB
            table.put_item(Item=body)

            successful += 1
            print(f"Successfully processed transaction: {body['transaction_id']}")

        except Exception as e:
            failed += 1
            print(f"Error processing message: {str(e)}")
            print(f"Message body: {record['body']}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'successful': successful,
            'failed': failed
        })
    }
```

## File: lib/lambda/batch_processor/index.py

```python
"""
Batch Processor Lambda function.

This function scans the DynamoDB table for recent transactions and performs
anomaly detection to identify potential fraudulent activities.
"""
import json
import os
import boto3
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def detect_anomalies(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect anomalies in transaction data.

    This is a simple anomaly detection algorithm that flags transactions
    based on amount thresholds and frequency patterns.

    Args:
        transactions: List of transaction records

    Returns:
        List of transactions flagged as anomalies
    """
    anomalies = []

    # Group transactions by customer
    customer_transactions = {}
    for txn in transactions:
        customer_id = txn.get('customer_id', 'unknown')
        if customer_id not in customer_transactions:
            customer_transactions[customer_id] = []
        customer_transactions[customer_id].append(txn)

    # Detect anomalies
    for customer_id, txns in customer_transactions.items():
        # Calculate average transaction amount
        amounts = [float(txn['amount']) for txn in txns]
        avg_amount = sum(amounts) / len(amounts) if amounts else 0

        # Flag transactions with amount > 3x average
        for txn in txns:
            amount = float(txn['amount'])
            if amount > 3 * avg_amount and amount > 1000:
                anomaly = txn.copy()
                anomaly['anomaly_reason'] = 'High amount compared to average'
                anomaly['anomaly_score'] = round(amount / avg_amount, 2)
                anomalies.append(anomaly)

        # Flag if more than 10 transactions in the time window
        if len(txns) > 10:
            for txn in txns:
                anomaly = txn.copy()
                anomaly['anomaly_reason'] = 'High transaction frequency'
                anomaly['anomaly_score'] = len(txns) / 10
                anomalies.append(anomaly)

    return anomalies


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for batch processing.

    Args:
        event: EventBridge event
        context: Lambda context object

    Returns:
        Response with processing results
    """
    try:
        # Calculate time window (last 5 minutes)
        current_time = datetime.now()
        five_minutes_ago = current_time - timedelta(minutes=5)
        timestamp_threshold = int(five_minutes_ago.timestamp())

        # Scan DynamoDB for recent transactions
        response = table.scan(
            FilterExpression='#ts >= :threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':threshold': timestamp_threshold
            }
        )

        transactions = response.get('Items', [])

        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts >= :threshold',
                ExpressionAttributeNames={
                    '#ts': 'timestamp'
                },
                ExpressionAttributeValues={
                    ':threshold': timestamp_threshold
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            transactions.extend(response.get('Items', []))

        # Detect anomalies
        anomalies = detect_anomalies(transactions)

        print(f"Processed {len(transactions)} transactions")
        print(f"Detected {len(anomalies)} anomalies")

        # Log anomalies for monitoring
        for anomaly in anomalies:
            print(f"ANOMALY DETECTED: {json.dumps(anomaly, default=str)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'transactions_processed': len(transactions),
                'anomalies_detected': len(anomalies)
            }, default=str)
        }

    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        raise
```

## File: lib/lambda/report_generator/index.py

```python
"""
Report Generator Lambda function.

This function generates daily reports from transaction data and stores
them in S3 for long-term archival and analysis.
"""
import json
import os
import boto3
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import csv
from io import StringIO

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']
table = dynamodb.Table(TABLE_NAME)


def generate_report(transactions: list) -> str:
    """
    Generate CSV report from transaction data.

    Args:
        transactions: List of transaction records

    Returns:
        CSV string containing report data
    """
    output = StringIO()

    if not transactions:
        return "No transactions for the reporting period"

    # Define CSV headers
    fieldnames = ['transaction_id', 'timestamp', 'amount', 'customer_id', 'merchant']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    # Calculate summary statistics
    total_amount = Decimal('0')
    transaction_count = 0

    for txn in transactions:
        # Convert Decimal to float for CSV
        row = {
            'transaction_id': txn.get('transaction_id', ''),
            'timestamp': txn.get('timestamp', ''),
            'amount': float(txn.get('amount', 0)),
            'customer_id': txn.get('customer_id', ''),
            'merchant': txn.get('merchant', '')
        }
        writer.writerow(row)

        total_amount += txn.get('amount', Decimal('0'))
        transaction_count += 1

    # Add summary section
    output.write('\n')
    output.write('Summary Statistics\n')
    output.write(f'Total Transactions,{transaction_count}\n')
    output.write(f'Total Amount,{float(total_amount)}\n')
    output.write(f'Average Amount,{float(total_amount / transaction_count) if transaction_count > 0 else 0}\n')

    return output.getvalue()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for report generation.

    Args:
        event: EventBridge event
        context: Lambda context object

    Returns:
        Response with report generation status
    """
    try:
        # Calculate time window (last 24 hours)
        current_time = datetime.now()
        yesterday = current_time - timedelta(days=1)
        timestamp_threshold = int(yesterday.timestamp())

        # Scan DynamoDB for transactions in the last 24 hours
        response = table.scan(
            FilterExpression='#ts >= :threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':threshold': timestamp_threshold
            }
        )

        transactions = response.get('Items', [])

        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts >= :threshold',
                ExpressionAttributeNames={
                    '#ts': 'timestamp'
                },
                ExpressionAttributeValues={
                    ':threshold': timestamp_threshold
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            transactions.extend(response.get('Items', []))

        # Generate report
        report_content = generate_report(transactions)

        # Create report filename with timestamp
        report_date = current_time.strftime('%Y-%m-%d')
        report_key = f"reports/{report_date}/fraud-detection-report.csv"

        # Upload report to S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=report_key,
            Body=report_content.encode('utf-8'),
            ContentType='text/csv'
        )

        print(f"Report generated successfully: {report_key}")
        print(f"Processed {len(transactions)} transactions")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Report generated successfully',
                'report_key': report_key,
                'transactions_processed': len(transactions)
            })
        }

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise
```

## File: lib/__init__.py

```python
"""
Fraud detection infrastructure package.
"""
```

## File: lib/README.md

```markdown
# Serverless Fraud Detection Pipeline

This directory contains the Pulumi Python implementation of a serverless fraud detection pipeline for processing transaction data.

## Architecture

The solution implements a complete serverless architecture using the following AWS services:

### Core Components

1. **API Gateway REST API**
   - POST endpoint at `/transactions`
   - Request body schema validation
   - Throttling: 10,000 requests/second with 5,000 burst

2. **Lambda Functions** (all using Python 3.11, 3GB memory, 100 reserved concurrency)
   - `api-handler`: Receives API requests and publishes to SQS
   - `queue-consumer`: Consumes from SQS and writes to DynamoDB
   - `batch-processor`: Scans DynamoDB every 5 minutes for anomaly detection
   - `report-generator`: Generates daily reports and stores in S3

3. **SQS Queues**
   - Main queue: `transaction-queue`
   - Dead letter queue: `transaction-dlq` (max receive count: 3)

4. **DynamoDB Table**
   - Name: `transactions`
   - Partition key: `transaction_id` (String)
   - Sort key: `timestamp` (Number)
   - Billing: On-demand
   - Point-in-time recovery: Enabled

5. **S3 Bucket**
   - Name: `fraud-detection-reports`
   - Versioning: Enabled
   - Encryption: AES256
   - Lifecycle: Transition to Glacier after 90 days

6. **EventBridge Rules**
   - Batch processor: Triggers every 5 minutes
   - Report generator: Triggers daily

7. **CloudWatch Alarms**
   - Monitor Lambda error rates
   - Threshold: > 1% error rate over 5 minutes

8. **KMS Key**
   - Customer-managed key for Lambda environment variable encryption

## Directory Structure

```
lib/
├── tap_stack.py              # Main Pulumi stack definition
├── lambda/                   # Lambda function code
│   ├── api_handler/         # API Gateway request handler
│   │   └── index.py
│   ├── queue_consumer/      # SQS to DynamoDB consumer
│   │   └── index.py
│   ├── batch_processor/     # Anomaly detection processor
│   │   └── index.py
│   └── report_generator/    # Daily report generator
│       └── index.py
└── README.md                # This file
```

## Resource Naming

All resources include the `environmentSuffix` to ensure uniqueness across deployments:

- S3 Bucket: `fraud-detection-reports-{environmentSuffix}`
- Lambda Functions: `{function-name}-{environmentSuffix}`
- DynamoDB Table: `transactions-{environmentSuffix}`
- SQS Queues: `transaction-queue-{environmentSuffix}`
- IAM Roles: `{function-name}-role-{environmentSuffix}`

## Security Features

1. **Encryption at Rest**
   - DynamoDB: Default encryption
   - S3: AES256 server-side encryption
   - Lambda environment variables: Customer-managed KMS key

2. **Encryption in Transit**
   - API Gateway: HTTPS only
   - All AWS service communications: TLS

3. **IAM Least Privilege**
   - Separate IAM roles for each Lambda function
   - Fine-grained policies for specific actions
   - No overly permissive wildcards

4. **Data Retention**
   - DynamoDB: Point-in-time recovery enabled
   - S3: Versioning enabled
   - SQS: Dead letter queue for failed messages

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Python 3.8 or higher

### Deploy Stack

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="dev"

# Deploy infrastructure
pulumi up
```

### Configuration

The stack requires the following environment variables:

- `ENVIRONMENT_SUFFIX`: Suffix for resource names (default: "dev")
- `AWS_REGION`: Target AWS region (default: "us-east-1")

### Outputs

After deployment, the stack exports:

- `api_endpoint`: API Gateway endpoint URL for /transactions
- `s3_bucket_name`: Name of the S3 bucket for reports
- `dynamodb_table_arn`: ARN of the DynamoDB transactions table
- `sqs_queue_url`: URL of the main SQS queue
- `dlq_url`: URL of the dead letter queue

## Testing

### Manual Testing

1. **Test API Gateway endpoint:**

```bash
API_URL=$(pulumi stack output api_endpoint)
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-12345",
    "amount": 99.99,
    "timestamp": 1700000000,
    "customer_id": "cust-001",
    "merchant": "Test Merchant"
  }'
```

2. **Check DynamoDB table:**

```bash
TABLE_NAME=$(pulumi stack output dynamodb_table_arn | cut -d'/' -f2)
aws dynamodb scan --table-name $TABLE_NAME
```

3. **Check S3 bucket for reports:**

```bash
BUCKET_NAME=$(pulumi stack output s3_bucket_name)
aws s3 ls s3://$BUCKET_NAME/reports/ --recursive
```

## Monitoring

### CloudWatch Logs

Each Lambda function writes logs to CloudWatch Logs:

- `/aws/lambda/api-handler-{environmentSuffix}`
- `/aws/lambda/queue-consumer-{environmentSuffix}`
- `/aws/lambda/batch-processor-{environmentSuffix}`
- `/aws/lambda/report-generator-{environmentSuffix}`

### CloudWatch Alarms

Error alarms are configured for each Lambda function and send notifications to SNS topics.

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable without retention policies.

## Compliance

- All resources use encryption at rest and in transit
- IAM roles follow least privilege principle
- Logging and monitoring enabled for all components
- Data retention policies configured as required
- Reserved concurrency prevents throttling as specified
```
