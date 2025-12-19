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
        # pylint: disable=line-too-long
        sse_default_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
        )
        # pylint: enable=line-too-long

        sse_rule_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=sse_default_args
        )

        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"fraud-detection-reports-encryption-{self.environment_suffix}",
            bucket=bucket.id,
            rules=[sse_rule_args],
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
            # reserved_concurrent_executions removed due to account limit constraints
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
            # reserved_concurrent_executions removed due to account limit constraints
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
            # reserved_concurrent_executions removed due to account limit constraints
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
            # reserved_concurrent_executions removed due to account limit constraints
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
            f"api-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=deployment.id,
            stage_name="api",
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
