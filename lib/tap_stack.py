"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project focused on Financial Transaction Processing.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations for an asynchronous transaction processing pipeline.
"""

import os
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.
    
    This component creates a complete asynchronous financial transaction processing pipeline
    including SQS FIFO queues, Lambda functions, DynamoDB tables, S3 buckets, EventBridge,
    Step Functions, and comprehensive monitoring.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Get current AWS region and account ID
        region = os.getenv('AWS_REGION', 'us-east-1')
        current_identity = aws.get_caller_identity()
        account_id = current_identity.account_id

        # Create KMS key for encryption
        self._create_kms_key()
        
        # Create VPC Endpoints for private communication
        self._create_vpc_endpoints()
        
        # Create DynamoDB tables for state management
        self._create_dynamodb_tables()
        
        # Create S3 buckets for storing processed reports
        self._create_s3_buckets()
        
        # Create SQS FIFO queues for transaction processing
        self._create_sqs_queues()
        
        # Create SNS topics for alerting
        self._create_sns_topics()
        
        # Create IAM roles for Lambda functions
        self._create_iam_roles()
        
        # Create Lambda functions for transaction processing
        self._create_lambda_functions()
        
        # Create EventBridge rules for event routing
        self._create_eventbridge_rules()
        
        # Create Step Functions for workflow orchestration
        self._create_step_functions()
        
        # Create CloudWatch alarms for monitoring
        self._create_cloudwatch_alarms()

        # Register outputs
        self.register_outputs({
            'transaction_queue_url': self.transaction_queue.url,
            'priority_queue_url': self.priority_queue.url,
            'processing_table_name': self.processing_table.name,
            'reports_bucket_name': self.reports_bucket.bucket,
            'fraud_detection_state_machine_arn': self.fraud_detection_state_machine.arn,
            'sns_alerts_topic_arn': self.sns_alerts_topic.arn
        })

    def _create_kms_key(self):
        """Create KMS key for encryption across all services."""
        # Note: KMS key policies require "Resource": "*" per AWS specifications
        # The key policy applies only to this specific key, so wildcard is appropriate
        self.kms_key = aws.kms.Key(
            f"tap-kms-key-{self.environment_suffix}",
            description=f"KMS key for TAP financial transaction processing - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=pulumi.Output.all().apply(lambda _: """{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::""" + aws.get_caller_identity().account_id + """:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow Lambda access",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow SQS access",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "sqs.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }"""),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f"tap-kms-alias-{self.environment_suffix}",
            name=f"alias/tap-financial-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for private service communication (placeholder)."""
        # VPC Endpoints Documentation:
        # 
        # For production deployments, consider implementing VPC endpoints to enable
        # private communication between Lambda functions and AWS services without
        # traversing the public internet. This improves security and reduces data
        # transfer costs.
        #
        # Recommended VPC endpoints for this stack:
        # 1. DynamoDB Gateway Endpoint (no additional cost)
        # 2. S3 Gateway Endpoint (no additional cost)
        # 3. SQS Interface Endpoint (hourly charge applies)
        # 4. SNS Interface Endpoint (hourly charge applies)
        # 5. Step Functions Interface Endpoint (hourly charge applies)
        # 6. EventBridge Interface Endpoint (hourly charge applies)
        # 7. CloudWatch Logs Interface Endpoint (hourly charge applies)
        # 8. KMS Interface Endpoint (hourly charge applies)
        #
        # Implementation requires:
        # - VPC with private subnets
        # - Lambda functions configured with VPC attachment
        # - Security groups allowing egress to VPC endpoints
        # - VPC endpoint security groups allowing ingress from Lambda SG
        #
        # Example implementation:
        # vpc = aws.ec2.Vpc(...)
        # dynamodb_endpoint = aws.ec2.VpcEndpoint(
        #     f"tap-dynamodb-endpoint-{self.environment_suffix}",
        #     vpc_id=vpc.id,
        #     service_name=f"com.amazonaws.{aws.get_region().name}.dynamodb",
        #     vpc_endpoint_type="Gateway",
        #     route_table_ids=[route_table.id]
        # )
        pass

    def _create_dynamodb_tables(self):
        """Create DynamoDB tables for tracking processing state."""
        # Transaction processing state table
        self.processing_table = aws.dynamodb.Table(
            f"tap-processing-state-{self.environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="customer_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="S"),
            ],
            hash_key="transaction_id",
            range_key="timestamp",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="customer-timestamp-index",
                    hash_key="customer_id",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Fraud detection results table
        self.fraud_table = aws.dynamodb.Table(
            f"tap-fraud-detection-{self.environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="risk_score", type="N"),
            ],
            hash_key="transaction_id",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="risk-score-index",
                    hash_key="risk_score",
                    projection_type="ALL"
                )
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_s3_buckets(self):
        """Create S3 buckets with intelligent tiering for storing processed reports."""
        # Reports bucket with intelligent tiering
        self.reports_bucket = aws.s3.Bucket(
            f"tap-transaction-reports-{self.environment_suffix}",
            bucket=f"tap-transaction-reports-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    )
                )
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Separate public access block resource
        self.reports_bucket_pab = aws.s3.BucketPublicAccessBlock(
            f"tap-transaction-reports-pab-{self.environment_suffix}",
            bucket=self.reports_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Intelligent tiering configuration
        self.intelligent_tiering = aws.s3.BucketIntelligentTieringConfiguration(
            f"tap-reports-intelligent-tiering-{self.environment_suffix}",
            bucket=self.reports_bucket.bucket,
            name="EntireBucket",
            status="Enabled",
            tierings=[
                aws.s3.BucketIntelligentTieringConfigurationTieringArgs(
                    access_tier="ARCHIVE_ACCESS",
                    days=90
                ),
                aws.s3.BucketIntelligentTieringConfigurationTieringArgs(
                    access_tier="DEEP_ARCHIVE_ACCESS",
                    days=180
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Lifecycle configuration for processed data
        self.lifecycle_configuration = aws.s3.BucketLifecycleConfiguration(
            f"tap-reports-lifecycle-{self.environment_suffix}",
            bucket=self.reports_bucket.bucket,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="archive_old_reports",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=2555  # 7 years for financial data retention
                    ),
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=365,
                            storage_class="DEEP_ARCHIVE"
                        )
                    ]
                )
            ],
            opts=ResourceOptions(parent=self)
        )

    def _create_sqs_queues(self):
        """Create SQS FIFO queues for transaction processing."""
        # Standard dead letter queue for Lambda functions (FIFO not supported for Lambda DLQ)
        self.lambda_dead_letter_queue = aws.sqs.Queue(
            f"tap-lambda-dlq-{self.environment_suffix}",
            name=f"tap-lambda-dlq-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.key_id,
            message_retention_seconds=1209600,  # 14 days
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # FIFO dead letter queue for SQS redrive policy
        self.dead_letter_queue = aws.sqs.Queue(
            f"tap-transactions-dlq-{self.environment_suffix}.fifo",
            name=f"tap-transactions-dlq-{self.environment_suffix}.fifo",
            fifo_queue=True,
            content_based_deduplication=True,
            kms_master_key_id=self.kms_key.key_id,
            message_retention_seconds=1209600,  # 14 days
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Main transaction processing queue
        self.transaction_queue = aws.sqs.Queue(
            f"tap-transactions-{self.environment_suffix}.fifo",
            name=f"tap-transactions-{self.environment_suffix}.fifo",
            fifo_queue=True,
            content_based_deduplication=True,
            deduplication_scope="messageGroup",
            fifo_throughput_limit="perMessageGroupId",
            kms_master_key_id=self.kms_key.key_id,
            visibility_timeout_seconds=300,  # 5 minutes
            message_retention_seconds=1209600,  # 14 days
            redrive_policy=pulumi.Output.all(
                self.dead_letter_queue.arn
            ).apply(lambda args: json.dumps({
                "deadLetterTargetArn": args[0],
                "maxReceiveCount": 3
            })),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Priority queue for high-value transactions
        self.priority_queue = aws.sqs.Queue(
            f"tap-priority-transactions-{self.environment_suffix}.fifo",
            name=f"tap-priority-transactions-{self.environment_suffix}.fifo",
            fifo_queue=True,
            content_based_deduplication=True,
            deduplication_scope="messageGroup",
            fifo_throughput_limit="perMessageGroupId",
            kms_master_key_id=self.kms_key.key_id,
            visibility_timeout_seconds=180,  # 3 minutes for priority processing
            message_retention_seconds=1209600,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_sns_topics(self):
        """Create SNS topics for alerting on processing failures and fraud detection."""
        self.sns_alerts_topic = aws.sns.Topic(
            f"tap-alerts-{self.environment_suffix}",
            name=f"tap-processing-alerts-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.key_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Fraud detection alerts topic
        self.fraud_alerts_topic = aws.sns.Topic(
            f"tap-fraud-alerts-{self.environment_suffix}",
            name=f"tap-fraud-alerts-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.key_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_iam_roles(self):
        """Create IAM roles for Lambda functions with least privilege access."""
        # Lambda execution role for transaction processing
        self.lambda_role = aws.iam.Role(
            f"tap-lambda-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }""",
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Policy for Lambda to access SQS, DynamoDB, S3, SNS
        self.lambda_policy = aws.iam.RolePolicy(
            f"tap-lambda-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.all(
                self.transaction_queue.arn,
                self.priority_queue.arn,
                self.dead_letter_queue.arn,
                self.lambda_dead_letter_queue.arn,
                self.processing_table.arn,
                self.fraud_table.arn,
                self.reports_bucket.arn,
                self.sns_alerts_topic.arn,
                self.fraud_alerts_topic.arn,
                self.kms_key.arn
            ).apply(lambda args: """{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes",
                            "sqs:SendMessage"
                        ],
                        "Resource": [
                            """ + f'"{args[0]}"' + """,
                            """ + f'"{args[1]}"' + """,
                            """ + f'"{args[2]}"' + """,
                            """ + f'"{args[3]}"' + """
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            """ + f'"{args[4]}"' + """,
                            """ + f'"{args[4]}/index/*"' + """,
                            """ + f'"{args[5]}"' + """,
                            """ + f'"{args[5]}/index/*"' + """
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": """ + f'"{args[6]}/*"' + """
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": [
                            """ + f'"{args[7]}"' + """,
                            """ + f'"{args[8]}"' + """
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": """ + f'"{args[9]}"' + """
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "events:PutEvents"
                        ],
                        "Resource": "arn:aws:events:""" + aws.get_region().name + """:""" + aws.get_caller_identity().account_id + """:event-bus/tap-transaction-events-""" + self.environment_suffix + """"
                    }
                ]
            }"""),
            opts=ResourceOptions(parent=self)
        )

        # Step Functions execution role
        self.stepfunctions_role = aws.iam.Role(
            f"tap-stepfunctions-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "states.amazonaws.com"
                        }
                    }
                ]
            }""",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for transaction processing with Graviton2 architecture."""
        
        # Create Lambda layer for common dependencies
        self.lambda_layer = aws.lambda_.LayerVersion(
            f"tap-common-layer-{self.environment_suffix}",
            layer_name=f"tap-common-dependencies-{self.environment_suffix}",
            description="Common dependencies for TAP transaction processing",
            compatible_runtimes=["python3.11"],
            code=pulumi.FileArchive("./lib/lambda"),
            opts=ResourceOptions(parent=self)
        )

        # Transaction processor Lambda function
        self.transaction_processor = aws.lambda_.Function(
            f"tap-transaction-processor-{self.environment_suffix}",
            name=f"tap-transaction-processor-{self.environment_suffix}",
            runtime="python3.11",
            architectures=["arm64"],  # Graviton2
            handler="transaction_processor.lambda_handler",
            role=self.lambda_role.arn,
            timeout=300,
            memory_size=512,
            layers=[self.lambda_layer.arn],
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PROCESSING_TABLE_NAME": self.processing_table.name,
                    "FRAUD_TABLE_NAME": self.fraud_table.name,
                    "REPORTS_BUCKET_NAME": self.reports_bucket.bucket,
                    "SNS_ALERTS_TOPIC_ARN": self.sns_alerts_topic.arn,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            code=pulumi.FileArchive("./lib/lambda"),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.lambda_dead_letter_queue.arn
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Event source mapping for SQS to Lambda
        self.transaction_event_source = aws.lambda_.EventSourceMapping(
            f"tap-transaction-event-source-{self.environment_suffix}",
            event_source_arn=self.transaction_queue.arn,
            function_name=self.transaction_processor.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Priority processor Lambda function
        self.priority_processor = aws.lambda_.Function(
            f"tap-priority-processor-{self.environment_suffix}",
            name=f"tap-priority-processor-{self.environment_suffix}",
            runtime="python3.11",
            architectures=["arm64"],  # Graviton2
            handler="priority_processor.lambda_handler",
            role=self.lambda_role.arn,
            timeout=180,
            memory_size=1024,
            layers=[self.lambda_layer.arn],
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "PROCESSING_TABLE_NAME": self.processing_table.name,
                    "FRAUD_TABLE_NAME": self.fraud_table.name,
                    "REPORTS_BUCKET_NAME": self.reports_bucket.bucket,
                    "FRAUD_ALERTS_TOPIC_ARN": self.fraud_alerts_topic.arn,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            code=pulumi.FileArchive("./lib/lambda"),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Event source mapping for priority queue
        self.priority_event_source = aws.lambda_.EventSourceMapping(
            f"tap-priority-event-source-{self.environment_suffix}",
            event_source_arn=self.priority_queue.arn,
            function_name=self.priority_processor.name,
            batch_size=5,
            opts=ResourceOptions(parent=self)
        )

    def _create_eventbridge_rules(self):
        """Create EventBridge rules for routing high-value transactions."""
        
        # Custom event bus for transaction events
        self.event_bus = aws.cloudwatch.EventBus(
            f"tap-transaction-events-{self.environment_suffix}",
            name=f"tap-transaction-events-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Rule for high-value transactions (>$10,000)
        self.high_value_rule = aws.cloudwatch.EventRule(
            f"tap-high-value-rule-{self.environment_suffix}",
            name=f"tap-high-value-transactions-{self.environment_suffix}",
            description="Route high-value transactions to priority queue",
            event_bus_name=self.event_bus.name,
            event_pattern="""{
                "source": ["transaction.processor"],
                "detail-type": ["Transaction Received"],
                "detail": {
                    "amount": [{"numeric": [">", 10000]}]
                }
            }""",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Target for high-value rule to send to priority queue
        self.high_value_target = aws.cloudwatch.EventTarget(
            f"tap-high-value-target-{self.environment_suffix}",
            rule=self.high_value_rule.name,
            event_bus_name=self.event_bus.name,
            arn=self.priority_queue.arn,
            sqs_target=aws.cloudwatch.EventTargetSqsTargetArgs(
                message_group_id="high-value-transactions"
            ),
            opts=ResourceOptions(parent=self)
        )

    def _create_step_functions(self):
        """Create Step Functions for fraud detection workflow orchestration."""
        
        # Step Functions state machine for fraud detection
        self.fraud_detection_state_machine = aws.sfn.StateMachine(
            f"tap-fraud-detection-{self.environment_suffix}",
            name=f"tap-fraud-detection-workflow-{self.environment_suffix}",
            role_arn=self.stepfunctions_role.arn,
            definition=pulumi.Output.all(
                self.transaction_processor.arn,
                self.fraud_alerts_topic.arn
            ).apply(lambda args: json.dumps({
                "Comment": "Fraud detection workflow for transaction processing",
                "StartAt": "ValidateTransaction",
                "States": {
                    "ValidateTransaction": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::lambda:invoke",
                        "Parameters": {
                            "FunctionName": args[0],
                            "Payload.$": "$"
                        },
                        "Retry": [
                            {
                                "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"],
                                "IntervalSeconds": 2,
                                "MaxAttempts": 6,
                                "BackoffRate": 2
                            }
                        ],
                        "Next": "CheckRiskScore"
                    },
                    "CheckRiskScore": {
                        "Type": "Choice",
                        "Choices": [
                            {
                                "Variable": "$.riskScore",
                                "NumericGreaterThan": 80,
                                "Next": "HighRiskAlert"
                            },
                            {
                                "Variable": "$.riskScore",
                                "NumericGreaterThan": 50,
                                "Next": "MediumRiskReview"
                            }
                        ],
                        "Default": "LowRiskApprove"
                    },
                    "HighRiskAlert": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::sns:publish",
                        "Parameters": {
                            "TopicArn": args[1],
                            "Message.$": "$.transactionId",
                            "Subject": "High Risk Transaction Alert"
                        },
                        "End": True
                    },
                    "MediumRiskReview": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::sns:publish",
                        "Parameters": {
                            "TopicArn": args[1],
                            "Message.$": "$.transactionId",
                            "Subject": "Medium Risk Transaction Review"
                        },
                        "End": True
                    },
                    "LowRiskApprove": {
                        "Type": "Pass",
                        "Result": "Transaction approved",
                        "End": True
                    }
                }
            })),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Policy for Step Functions to invoke Lambda and SNS
        self.stepfunctions_policy = aws.iam.RolePolicy(
            f"tap-stepfunctions-policy-{self.environment_suffix}",
            role=self.stepfunctions_role.id,
            policy=pulumi.Output.all(
                self.transaction_processor.arn,
                self.fraud_alerts_topic.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": args[1]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for queue depth and processing failures."""
        
        # Alarm for transaction queue depth
        self.queue_depth_alarm = aws.cloudwatch.MetricAlarm(
            f"tap-queue-depth-alarm-{self.environment_suffix}",
            alarm_description="Transaction queue depth exceeding threshold",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApproximateNumberOfVisibleMessages",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=1000,
            alarm_actions=[self.sns_alerts_topic.arn],
            dimensions={
                "QueueName": self.transaction_queue.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Alarm for Lambda function errors
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"tap-lambda-error-alarm-{self.environment_suffix}",
            alarm_description="Lambda function error rate exceeding threshold",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_actions=[self.sns_alerts_topic.arn],
            dimensions={
                "FunctionName": self.transaction_processor.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Alarm for DLQ message count
        self.dlq_alarm = aws.cloudwatch.MetricAlarm(
            f"tap-dlq-alarm-{self.environment_suffix}",
            alarm_description="Messages in dead letter queue",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfVisibleMessages",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=0,
            alarm_actions=[self.sns_alerts_topic.arn],
            dimensions={
                "QueueName": self.dead_letter_queue.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
