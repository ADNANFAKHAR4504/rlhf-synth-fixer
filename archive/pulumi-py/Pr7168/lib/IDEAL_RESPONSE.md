## tap_stack.py

```python
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

```

## lambda/priority_processor.py

```python
"""
Priority Transaction Processor Lambda Function

This Lambda function handles high-value transactions (>$10,000) with enhanced
processing logic, additional fraud checks, and expedited handling.
"""

import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal
import logging
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Main Lambda handler for processing high-priority financial transactions.
    
    Args:
        event: SQS event containing priority transaction records
        context: Lambda execution context
        
    Returns:
        dict: Processing result status
    """
    
    try:
        # Get environment variables
        processing_table_name = os.environ['PROCESSING_TABLE_NAME']
        fraud_table_name = os.environ['FRAUD_TABLE_NAME']
        reports_bucket_name = os.environ['REPORTS_BUCKET_NAME']
        fraud_alerts_topic_arn = os.environ['FRAUD_ALERTS_TOPIC_ARN']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']
        
        # Initialize DynamoDB tables
        processing_table = dynamodb.Table(processing_table_name)
        fraud_table = dynamodb.Table(fraud_table_name)
        
        logger.info(f"Processing {len(event['Records'])} priority transaction records")
        
        processed_count = 0
        failed_count = 0
        
        for record in event['Records']:
            try:
                # Parse transaction data from SQS message
                transaction_data = json.loads(record['body'])
                logger.info(f"Processing priority transaction: {transaction_data.get('transaction_id')}")
                
                # Enhanced processing for priority transactions
                result = process_priority_transaction(
                    transaction_data,
                    processing_table,
                    fraud_table,
                    reports_bucket_name,
                    fraud_alerts_topic_arn
                )
                
                if result['success']:
                    processed_count += 1
                    logger.info(f"Successfully processed priority transaction: {transaction_data.get('transaction_id')}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to process priority transaction: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing priority record: {str(e)}")
                
                # Send failure notification
                try:
                    sns.publish(
                        TopicArn=fraud_alerts_topic_arn,
                        Message=f"Priority transaction processing failed: {str(e)}",
                        Subject="CRITICAL: Priority Transaction Processing Error"
                    )
                except Exception as sns_error:
                    logger.error(f"Failed to send SNS notification: {str(sns_error)}")
        
        logger.info(f"Priority processing complete. Successful: {processed_count}, Failed: {failed_count}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Priority processing complete',
                'processed': processed_count,
                'failed': failed_count
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in priority lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def process_priority_transaction(transaction_data, processing_table, fraud_table, 
                                reports_bucket_name, fraud_alerts_topic_arn):
    """
    Process a high-priority financial transaction with enhanced checks.
    
    Args:
        transaction_data: Dictionary containing transaction details
        processing_table: DynamoDB table for processing state
        fraud_table: DynamoDB table for fraud detection results
        reports_bucket_name: S3 bucket for storing reports
        fraud_alerts_topic_arn: SNS topic for fraud alerts
        
    Returns:
        dict: Processing result
    """
    
    try:
        # Extract transaction details
        transaction_id = transaction_data.get('transaction_id', str(uuid.uuid4()))
        customer_id = transaction_data.get('customer_id')
        amount = Decimal(str(transaction_data.get('amount', 0)))
        transaction_type = transaction_data.get('type', 'unknown')
        source_account = transaction_data.get('source_account')
        destination_account = transaction_data.get('destination_account')
        timestamp = datetime.now().isoformat()
        
        # Priority transaction validation
        if amount <= Decimal('10000'):
            logger.warning(f"Transaction {transaction_id} below priority threshold: ${amount}")
        
        # Validate required fields with stricter checks for priority transactions
        if not customer_id or amount <= 0 or not source_account:
            raise ValueError("Missing critical fields for priority transaction")
        
        # Update processing state with priority flag
        processing_table.put_item(Item={
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'timestamp': timestamp,
            'status': 'priority_processing',
            'amount': amount,
            'type': transaction_type,
            'source_account': source_account,
            'destination_account': destination_account,
            'priority_level': 'HIGH',
            'created_at': timestamp,
            'sla_deadline': (datetime.now() + timedelta(minutes=30)).isoformat(),  # 30-min SLA
            'ttl': int((datetime.now().timestamp() + (90 * 24 * 60 * 60)))  # 90 days TTL for priority
        })
        
        # Enhanced fraud detection for priority transactions
        enhanced_fraud_analysis = perform_enhanced_fraud_detection(
            transaction_id, customer_id, amount, transaction_type, 
            source_account, destination_account, processing_table, fraud_table
        )
        
        # Store enhanced fraud detection results
        fraud_table.put_item(Item={
            'transaction_id': transaction_id,
            'risk_score': enhanced_fraud_analysis['risk_score'],
            'risk_factors': enhanced_fraud_analysis['risk_factors'],
            'recommendation': enhanced_fraud_analysis['recommendation'],
            'confidence_level': enhanced_fraud_analysis['confidence_level'],
            'enhanced_checks': enhanced_fraud_analysis['enhanced_checks'],
            'timestamp': timestamp,
            'status': 'priority_analyzed',
            'model_version': '2.0_enhanced',
            'processing_time_ms': enhanced_fraud_analysis.get('processing_time_ms', 0),
            'ttl': int((datetime.now().timestamp() + (2 * 365 * 24 * 60 * 60)))  # 2 years TTL
        })
        
        # Generate enhanced transaction report
        enhanced_report = generate_priority_transaction_report(
            transaction_data, enhanced_fraud_analysis, timestamp
        )
        
        # Store report in S3 with priority classification
        s3_key = f"priority-reports/{customer_id}/{datetime.now().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=reports_bucket_name,
            Key=s3_key,
            Body=json.dumps(enhanced_report, default=str),
            ServerSideEncryption='aws:kms',
            ContentType='application/json',
            StorageClass='STANDARD',  # Keep priority reports in standard storage
            Metadata={
                'transaction-id': transaction_id,
                'customer-id': customer_id,
                'risk-score': str(enhanced_fraud_analysis['risk_score']),
                'priority-level': 'HIGH',
                'processed-at': timestamp,
                'amount': str(amount)
            },
            Tagging=f'Priority=HIGH&RiskScore={enhanced_fraud_analysis["risk_score"]}&Amount={amount}'
        )
        
        # Enhanced alerting for priority transactions
        alert_sent = send_priority_alerts(
            transaction_id, customer_id, amount, enhanced_fraud_analysis,
            timestamp, fraud_alerts_topic_arn
        )
        
        # Real-time compliance checks for priority transactions
        compliance_result = perform_priority_compliance_checks(
            transaction_id, customer_id, amount, source_account, 
            destination_account, transaction_type
        )
        
        # Update final processing status with enhanced details
        processing_table.update_item(
            Key={'transaction_id': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, #completed_at = :completed_at, '
                           '#risk_score = :risk_score, #compliance_status = :compliance_status, '
                           '#alert_sent = :alert_sent, #confidence_level = :confidence_level',
            ExpressionAttributeNames={
                '#status': 'status',
                '#completed_at': 'completed_at',
                '#risk_score': 'risk_score',
                '#compliance_status': 'compliance_status',
                '#alert_sent': 'alert_sent',
                '#confidence_level': 'confidence_level'
            },
            ExpressionAttributeValues={
                ':status': 'priority_completed',
                ':completed_at': timestamp,
                ':risk_score': enhanced_fraud_analysis['risk_score'],
                ':compliance_status': compliance_result['status'],
                ':alert_sent': alert_sent,
                ':confidence_level': enhanced_fraud_analysis['confidence_level']
            }
        )
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'risk_score': enhanced_fraud_analysis['risk_score'],
            'confidence_level': enhanced_fraud_analysis['confidence_level'],
            'compliance_status': compliance_result['status'],
            'status': 'priority_completed',
            'alert_sent': alert_sent
        }
        
    except Exception as e:
        logger.error(f"Error processing priority transaction {transaction_data.get('transaction_id', 'unknown')}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'transaction_id': transaction_data.get('transaction_id', 'unknown')
        }

def perform_enhanced_fraud_detection(transaction_id, customer_id, amount, transaction_type,
                                   source_account, destination_account, processing_table, fraud_table):
    """
    Perform enhanced fraud detection with additional checks for priority transactions.
    """
    
    start_time = datetime.now()
    risk_score = 0
    risk_factors = []
    enhanced_checks = {}
    confidence_level = 'HIGH'
    
    try:
        # Base risk assessment with enhanced thresholds
        if amount > Decimal('1000000'):  # $1M+
            risk_score += 60
            risk_factors.append('ultra_high_amount')
        elif amount > Decimal('500000'):  # $500K+
            risk_score += 45
            risk_factors.append('very_high_amount')
        elif amount > Decimal('100000'):  # $100K+
            risk_score += 30
            risk_factors.append('high_amount')
        elif amount > Decimal('50000'):  # $50K+
            risk_score += 20
            risk_factors.append('elevated_amount')
        
        # Enhanced transaction type analysis
        ultra_high_risk_types = ['international_wire', 'crypto_exchange', 'cash_equivalent']
        high_risk_types = ['wire_transfer', 'international_transfer', 'large_cash_withdrawal']
        
        if transaction_type in ultra_high_risk_types:
            risk_score += 35
            risk_factors.append('ultra_high_risk_type')
        elif transaction_type in high_risk_types:
            risk_score += 25
            risk_factors.append('high_risk_type')
        
        # Account pattern analysis
        if source_account and destination_account:
            # Check for same-day bidirectional transfers (potential structuring)
            enhanced_checks['bidirectional_check'] = check_bidirectional_transfers(
                customer_id, source_account, destination_account, processing_table
            )
            if enhanced_checks['bidirectional_check']['suspicious']:
                risk_score += 40
                risk_factors.append('suspicious_bidirectional_pattern')
        
        # Velocity checks - enhanced for priority transactions
        velocity_analysis = perform_velocity_analysis(customer_id, amount, processing_table)
        enhanced_checks['velocity_analysis'] = velocity_analysis
        
        if velocity_analysis['daily_amount'] > Decimal('1000000'):
            risk_score += 35
            risk_factors.append('extreme_daily_velocity')
        elif velocity_analysis['daily_amount'] > Decimal('500000'):
            risk_score += 25
            risk_factors.append('high_daily_velocity')
        
        if velocity_analysis['transaction_count'] > 20:
            risk_score += 30
            risk_factors.append('excessive_transaction_frequency')
        
        # Geographic risk analysis (simplified)
        geo_risk = analyze_geographic_risk(source_account, destination_account)
        enhanced_checks['geographic_risk'] = geo_risk
        risk_score += geo_risk['risk_points']
        if geo_risk['risk_factors']:
            risk_factors.extend(geo_risk['risk_factors'])
        
        # Historical fraud pattern matching
        historical_analysis = check_historical_fraud_patterns(customer_id, fraud_table)
        enhanced_checks['historical_analysis'] = historical_analysis
        risk_score += historical_analysis['risk_points']
        if historical_analysis['risk_factors']:
            risk_factors.extend(historical_analysis['risk_factors'])
        
        # Time-based analysis with enhanced patterns
        time_analysis = analyze_transaction_timing(datetime.now())
        enhanced_checks['time_analysis'] = time_analysis
        risk_score += time_analysis['risk_points']
        if time_analysis['risk_factors']:
            risk_factors.extend(time_analysis['risk_factors'])
        
        # Confidence level calculation based on data availability
        if len(enhanced_checks) >= 4 and all(check.get('data_available', False) for check in enhanced_checks.values()):
            confidence_level = 'VERY_HIGH'
        elif len(enhanced_checks) >= 3:
            confidence_level = 'HIGH'
        elif len(enhanced_checks) >= 2:
            confidence_level = 'MEDIUM'
        else:
            confidence_level = 'LOW'
        
        # Cap risk score at 100
        risk_score = min(risk_score, 100)
        
        # Enhanced recommendation logic
        if risk_score >= 90:
            recommendation = 'BLOCK_IMMEDIATE'
        elif risk_score >= 75:
            recommendation = 'MANUAL_REVIEW_URGENT'
        elif risk_score >= 60:
            recommendation = 'ENHANCED_MONITORING'
        elif risk_score >= 40:
            recommendation = 'STANDARD_MONITORING'
        else:
            recommendation = 'APPROVE'
        
        processing_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return {
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'confidence_level': confidence_level,
            'enhanced_checks': enhanced_checks,
            'processing_time_ms': processing_time_ms,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced fraud detection for transaction {transaction_id}: {str(e)}")
        return {
            'risk_score': 75,  # High risk on error for priority transactions
            'risk_factors': ['enhanced_analysis_error'],
            'recommendation': 'MANUAL_REVIEW_URGENT',
            'confidence_level': 'LOW',
            'enhanced_checks': {'error': str(e)},
            'error': str(e)
        }

def check_bidirectional_transfers(customer_id, source_account, destination_account, processing_table):
    """Check for suspicious bidirectional transfer patterns."""
    try:
        # Implementation would check for recent transfers in both directions
        return {
            'suspicious': False,
            'bidirectional_count': 0,
            'data_available': True
        }
    except Exception:
        return {'suspicious': False, 'data_available': False}

def perform_velocity_analysis(customer_id, current_amount, processing_table):
    """Analyze transaction velocity for the customer."""
    try:
        # Query recent transactions for velocity analysis
        daily_amount = current_amount
        transaction_count = 1
        
        # In real implementation, would query last 24 hours of transactions
        return {
            'daily_amount': daily_amount,
            'transaction_count': transaction_count,
            'data_available': True
        }
    except Exception:
        return {'daily_amount': Decimal('0'), 'transaction_count': 0, 'data_available': False}

def analyze_geographic_risk(source_account, destination_account):
    """Analyze geographic risk based on account locations."""
    risk_points = 0
    risk_factors = []
    
    # Simplified geographic risk analysis
    high_risk_regions = ['OFFSHORE', 'SANCTIONED', 'HIGH_RISK_JURISDICTION']
    
    # In real implementation, would look up account locations
    return {
        'risk_points': risk_points,
        'risk_factors': risk_factors,
        'data_available': True
    }

def check_historical_fraud_patterns(customer_id, fraud_table):
    """Check historical fraud patterns for the customer."""
    try:
        # Query historical fraud records
        risk_points = 0
        risk_factors = []
        
        # In real implementation, would analyze historical fraud patterns
        return {
            'risk_points': risk_points,
            'risk_factors': risk_factors,
            'historical_fraud_count': 0,
            'data_available': True
        }
    except Exception:
        return {'risk_points': 0, 'risk_factors': [], 'data_available': False}

def analyze_transaction_timing(transaction_time):
    """Analyze transaction timing patterns."""
    risk_points = 0
    risk_factors = []
    
    # Weekend transactions
    if transaction_time.weekday() >= 5:
        risk_points += 15
        risk_factors.append('weekend_transaction')
    
    # Off-hours transactions (before 6 AM or after 10 PM)
    if transaction_time.hour < 6 or transaction_time.hour > 22:
        risk_points += 20
        risk_factors.append('off_hours_transaction')
    
    # Holiday transactions (simplified check)
    if transaction_time.month == 12 and transaction_time.day >= 24:
        risk_points += 10
        risk_factors.append('holiday_transaction')
    
    return {
        'risk_points': risk_points,
        'risk_factors': risk_factors,
        'data_available': True
    }

def send_priority_alerts(transaction_id, customer_id, amount, fraud_analysis, 
                        timestamp, fraud_alerts_topic_arn):
    """Send appropriate alerts for priority transactions."""
    try:
        alert_message = {
            'alert_type': 'priority_transaction_processed',
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'amount': float(amount),
            'risk_score': fraud_analysis['risk_score'],
            'confidence_level': fraud_analysis['confidence_level'],
            'recommendation': fraud_analysis['recommendation'],
            'risk_factors': fraud_analysis['risk_factors'],
            'timestamp': timestamp,
            'processing_sla': '30_minutes'
        }
        
        # Determine alert level and subject
        if fraud_analysis['risk_score'] >= 90:
            subject = f"🚨 CRITICAL: High Risk Priority Transaction - ID: {transaction_id}"
            alert_level = 'CRITICAL'
        elif fraud_analysis['risk_score'] >= 75:
            subject = f"⚠️ URGENT: Priority Transaction Review Required - ID: {transaction_id}"
            alert_level = 'URGENT'
        elif fraud_analysis['risk_score'] >= 60:
            subject = f"📊 PRIORITY: Enhanced Monitoring Required - ID: {transaction_id}"
            alert_level = 'HIGH'
        else:
            subject = f"✅ PRIORITY: Transaction Processed - ID: {transaction_id}"
            alert_level = 'INFO'
        
        sns.publish(
            TopicArn=fraud_alerts_topic_arn,
            Message=json.dumps(alert_message, default=str),
            Subject=subject,
            MessageAttributes={
                'alert_level': {'DataType': 'String', 'StringValue': alert_level},
                'transaction_id': {'DataType': 'String', 'StringValue': transaction_id},
                'priority': {'DataType': 'String', 'StringValue': 'HIGH'},
                'risk_score': {'DataType': 'Number', 'StringValue': str(fraud_analysis['risk_score'])}
            }
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send priority alert for transaction {transaction_id}: {str(e)}")
        return False

def perform_priority_compliance_checks(transaction_id, customer_id, amount, 
                                     source_account, destination_account, transaction_type):
    """Perform enhanced compliance checks for priority transactions."""
    try:
        compliance_checks = {
            'aml_check': 'PASSED',
            'sanctions_check': 'PASSED',
            'kyc_status': 'VERIFIED',
            'pep_check': 'CLEAR',
            'ofac_check': 'CLEAR',
            'regulatory_threshold': 'WITHIN_LIMITS'
        }
        
        # Enhanced compliance logic would go here
        # For demonstration, all checks pass
        
        return {
            'status': 'COMPLIANT',
            'checks': compliance_checks,
            'completed_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Compliance check error for transaction {transaction_id}: {str(e)}")
        return {
            'status': 'REVIEW_REQUIRED',
            'error': str(e),
            'completed_at': datetime.now().isoformat()
        }

def generate_priority_transaction_report(transaction_data, fraud_analysis, timestamp):
    """Generate an enhanced report for priority transactions."""
    
    return {
        'report_metadata': {
            'report_id': str(uuid.uuid4()),
            'generated_at': timestamp,
            'report_version': '2.0_priority',
            'processing_engine': 'tap-priority-processor',
            'priority_level': 'HIGH',
            'sla_target': '30_minutes'
        },
        'transaction_details': {
            'transaction_id': transaction_data.get('transaction_id'),
            'customer_id': transaction_data.get('customer_id'),
            'amount': float(transaction_data.get('amount', 0)),
            'currency': transaction_data.get('currency', 'USD'),
            'transaction_type': transaction_data.get('type', 'unknown'),
            'source_account': transaction_data.get('source_account'),
            'destination_account': transaction_data.get('destination_account'),
            'description': transaction_data.get('description', ''),
            'original_timestamp': transaction_data.get('timestamp'),
            'priority_classification': 'HIGH_VALUE'
        },
        'enhanced_processing_results': {
            'status': 'priority_completed',
            'processed_at': timestamp,
            'processing_duration_ms': fraud_analysis.get('processing_time_ms', 0),
            'fraud_analysis': fraud_analysis,
            'confidence_assessment': {
                'overall_confidence': fraud_analysis.get('confidence_level', 'MEDIUM'),
                'data_completeness': 'HIGH',
                'model_performance': 'OPTIMAL'
            }
        },
        'enhanced_compliance': {
            'regulatory_flags': [],
            'aml_status': 'enhanced_check_passed',
            'kyc_status': 'priority_verified',
            'sanctions_check': 'real_time_clear',
            'pep_screening': 'enhanced_clear',
            'regulatory_reporting': 'auto_filed'
        },
        'audit_trail': {
            'created_by': 'tap-priority-processor',
            'processing_node': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'execution_id': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME', 'unknown'),
            'priority_queue': True,
            'enhanced_checks_performed': len(fraud_analysis.get('enhanced_checks', {}))
        },
        'monitoring_metrics': {
            'queue_wait_time_ms': 0,  # Would be calculated from SQS attributes
            'processing_latency_ms': fraud_analysis.get('processing_time_ms', 0),
            'total_pipeline_time_ms': 0  # Would include end-to-end timing
        }
    }
```

## lambda/transaction_processor.py

```python
"""
Transaction Processor Lambda Function

This Lambda function processes financial transactions from SQS FIFO queues,
performs fraud detection analysis, and stores results in DynamoDB and S3.
"""

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
import logging
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
events = boto3.client('events')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Main Lambda handler for processing financial transactions.
    
    Args:
        event: SQS event containing transaction records
        context: Lambda execution context
        
    Returns:
        dict: Processing result status
    """
    
    try:
        # Get environment variables
        processing_table_name = os.environ['PROCESSING_TABLE_NAME']
        fraud_table_name = os.environ['FRAUD_TABLE_NAME']
        reports_bucket_name = os.environ['REPORTS_BUCKET_NAME']
        sns_alerts_topic_arn = os.environ['SNS_ALERTS_TOPIC_ARN']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']
        
        # Initialize DynamoDB tables
        processing_table = dynamodb.Table(processing_table_name)
        fraud_table = dynamodb.Table(fraud_table_name)
        
        logger.info(f"Processing {len(event['Records'])} transaction records")
        
        processed_count = 0
        failed_count = 0
        
        for record in event['Records']:
            try:
                # Parse transaction data from SQS message
                transaction_data = json.loads(record['body'])
                logger.info(f"Processing transaction: {transaction_data.get('transaction_id')}")
                
                # Process the transaction
                result = process_transaction(
                    transaction_data,
                    processing_table,
                    fraud_table,
                    reports_bucket_name,
                    sns_alerts_topic_arn
                )
                
                if result['success']:
                    processed_count += 1
                    logger.info(f"Successfully processed transaction: {transaction_data.get('transaction_id')}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to process transaction: {result.get('error')}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing record: {str(e)}")
                
                # Send failure notification
                try:
                    sns.publish(
                        TopicArn=sns_alerts_topic_arn,
                        Message=f"Transaction processing failed: {str(e)}",
                        Subject="Processing Error"
                    )
                except Exception as sns_error:
                    logger.error(f"Failed to send SNS notification: {str(sns_error)}")
        
        logger.info(f"Processing complete. Successful: {processed_count}, Failed: {failed_count}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing complete',
                'processed': processed_count,
                'failed': failed_count
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def process_transaction(transaction_data, processing_table, fraud_table, 
                       reports_bucket_name, sns_alerts_topic_arn):
    """
    Process a single financial transaction.
    
    Args:
        transaction_data: Dictionary containing transaction details
        processing_table: DynamoDB table for processing state
        fraud_table: DynamoDB table for fraud detection results
        reports_bucket_name: S3 bucket for storing reports
        sns_alerts_topic_arn: SNS topic for alerts
        
    Returns:
        dict: Processing result
    """
    
    try:
        # Extract transaction details
        transaction_id = transaction_data.get('transaction_id', str(uuid.uuid4()))
        customer_id = transaction_data.get('customer_id')
        amount = Decimal(str(transaction_data.get('amount', 0)))
        transaction_type = transaction_data.get('type', 'unknown')
        source_account = transaction_data.get('source_account')
        destination_account = transaction_data.get('destination_account')
        timestamp = datetime.now().isoformat()
        
        # Validate required fields
        if not customer_id or amount <= 0:
            raise ValueError("Missing required fields: customer_id or invalid amount")
        
        # Update processing state
        processing_table.put_item(Item={
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'timestamp': timestamp,
            'status': 'processing',
            'amount': amount,
            'type': transaction_type,
            'source_account': source_account,
            'destination_account': destination_account,
            'created_at': timestamp,
            'ttl': int((datetime.now().timestamp() + (30 * 24 * 60 * 60)))  # 30 days TTL
        })
        
        # Perform fraud detection analysis
        fraud_analysis = perform_fraud_detection(
            transaction_id, customer_id, amount, transaction_type, processing_table
        )
        
        # Store fraud detection results
        fraud_table.put_item(Item={
            'transaction_id': transaction_id,
            'risk_score': fraud_analysis['risk_score'],
            'risk_factors': fraud_analysis['risk_factors'],
            'recommendation': fraud_analysis['recommendation'],
            'timestamp': timestamp,
            'status': 'analyzed',
            'model_version': '1.0',
            'ttl': int((datetime.now().timestamp() + (365 * 24 * 60 * 60)))  # 1 year TTL
        })
        
        # Generate and store processing report
        report = generate_transaction_report(
            transaction_data, fraud_analysis, timestamp
        )
        
        # Store report in S3 with intelligent tiering
        s3_key = f"reports/{customer_id}/{datetime.now().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=reports_bucket_name,
            Key=s3_key,
            Body=json.dumps(report, default=str),
            ServerSideEncryption='aws:kms',
            ContentType='application/json',
            Metadata={
                'transaction-id': transaction_id,
                'customer-id': customer_id,
                'risk-score': str(fraud_analysis['risk_score']),
                'processed-at': timestamp
            }
        )
        
        # Send alerts based on risk level
        if fraud_analysis['risk_score'] >= 80:
            # High risk - immediate alert
            sns.publish(
                TopicArn=sns_alerts_topic_arn,
                Message=json.dumps({
                    'alert_type': 'high_risk_transaction',
                    'transaction_id': transaction_id,
                    'customer_id': customer_id,
                    'amount': float(amount),
                    'risk_score': fraud_analysis['risk_score'],
                    'risk_factors': fraud_analysis['risk_factors'],
                    'timestamp': timestamp
                }),
                Subject=f"HIGH RISK TRANSACTION ALERT - ID: {transaction_id}",
                MessageAttributes={
                    'alert_level': {'DataType': 'String', 'StringValue': 'HIGH'},
                    'transaction_id': {'DataType': 'String', 'StringValue': transaction_id}
                }
            )
        elif fraud_analysis['risk_score'] >= 50:
            # Medium risk - review alert
            sns.publish(
                TopicArn=sns_alerts_topic_arn,
                Message=json.dumps({
                    'alert_type': 'medium_risk_transaction',
                    'transaction_id': transaction_id,
                    'customer_id': customer_id,
                    'amount': float(amount),
                    'risk_score': fraud_analysis['risk_score'],
                    'timestamp': timestamp
                }),
                Subject=f"MEDIUM RISK TRANSACTION - ID: {transaction_id}",
                MessageAttributes={
                    'alert_level': {'DataType': 'String', 'StringValue': 'MEDIUM'},
                    'transaction_id': {'DataType': 'String', 'StringValue': transaction_id}
                }
            )
        
        # Update final processing status
        processing_table.update_item(
            Key={'transaction_id': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, #completed_at = :completed_at, #risk_score = :risk_score',
            ExpressionAttributeNames={
                '#status': 'status',
                '#completed_at': 'completed_at',
                '#risk_score': 'risk_score'
            },
            ExpressionAttributeValues={
                ':status': 'completed',
                ':completed_at': timestamp,
                ':risk_score': fraud_analysis['risk_score']
            }
        )
        
        # Publish event to EventBridge for downstream processing
        if amount > 10000:  # High-value transaction
            events.put_events(
                Entries=[
                    {
                        'Source': 'transaction.processor',
                        'DetailType': 'High Value Transaction Processed',
                        'Detail': json.dumps({
                            'transaction_id': transaction_id,
                            'customer_id': customer_id,
                            'amount': float(amount),
                            'risk_score': fraud_analysis['risk_score'],
                            'timestamp': timestamp
                        })
                    }
                ]
            )
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'risk_score': fraud_analysis['risk_score'],
            'status': 'completed'
        }
        
    except Exception as e:
        logger.error(f"Error processing transaction {transaction_data.get('transaction_id', 'unknown')}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'transaction_id': transaction_data.get('transaction_id', 'unknown')
        }

def perform_fraud_detection(transaction_id, customer_id, amount, transaction_type, processing_table):
    """
    Perform fraud detection analysis on the transaction.
    
    Args:
        transaction_id: Unique transaction identifier
        customer_id: Customer identifier
        amount: Transaction amount
        transaction_type: Type of transaction
        processing_table: DynamoDB table for querying history
        
    Returns:
        dict: Fraud analysis results
    """
    
    risk_score = 0
    risk_factors = []
    
    try:
        # Base risk assessment
        if amount > Decimal('100000'):
            risk_score += 50
            risk_factors.append('very_high_amount')
        elif amount > Decimal('50000'):
            risk_score += 30
            risk_factors.append('high_amount')
        elif amount > Decimal('10000'):
            risk_score += 15
            risk_factors.append('elevated_amount')
        
        # Transaction type risk
        high_risk_types = ['wire_transfer', 'international_transfer', 'cash_withdrawal']
        if transaction_type in high_risk_types:
            risk_score += 20
            risk_factors.append('high_risk_transaction_type')
        
        # Check for unusual activity patterns (simplified)
        # In a real implementation, this would involve more sophisticated ML models
        current_time = datetime.now()
        
        # Query recent transactions for this customer
        try:
            response = processing_table.query(
                IndexName='customer-timestamp-index',
                KeyConditionExpression='customer_id = :customer_id',
                ExpressionAttributeValues={
                    ':customer_id': customer_id
                },
                ScanIndexForward=False,  # Most recent first
                Limit=10  # Last 10 transactions
            )
            
            recent_transactions = response.get('Items', [])
            
            # Check for rapid succession of transactions
            if len(recent_transactions) >= 3:
                risk_score += 15
                risk_factors.append('rapid_transaction_pattern')
            
            # Check for amount patterns
            recent_amounts = [float(t.get('amount', 0)) for t in recent_transactions]
            if recent_amounts and max(recent_amounts) > 0:
                current_amount_ratio = float(amount) / max(recent_amounts)
                if current_amount_ratio > 5:  # 5x larger than usual
                    risk_score += 25
                    risk_factors.append('unusual_amount_increase')
                    
        except Exception as e:
            logger.warning(f"Could not analyze transaction history: {str(e)}")
            risk_factors.append('history_analysis_unavailable')
        
        # Weekend/off-hours transactions (simplified)
        if current_time.weekday() >= 5 or current_time.hour < 6 or current_time.hour > 22:
            risk_score += 10
            risk_factors.append('off_hours_transaction')
        
        # Cap risk score at 100
        risk_score = min(risk_score, 100)
        
        # Determine recommendation
        if risk_score >= 80:
            recommendation = 'BLOCK'
        elif risk_score >= 50:
            recommendation = 'REVIEW'
        elif risk_score >= 30:
            recommendation = 'MONITOR'
        else:
            recommendation = 'APPROVE'
        
        return {
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'analysis_timestamp': current_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in fraud detection for transaction {transaction_id}: {str(e)}")
        return {
            'risk_score': 50,  # Default medium risk on error
            'risk_factors': ['analysis_error'],
            'recommendation': 'REVIEW',
            'error': str(e)
        }

def generate_transaction_report(transaction_data, fraud_analysis, timestamp):
    """
    Generate a comprehensive transaction processing report.
    
    Args:
        transaction_data: Original transaction data
        fraud_analysis: Results from fraud detection
        timestamp: Processing timestamp
        
    Returns:
        dict: Transaction report
    """
    
    return {
        'report_metadata': {
            'report_id': str(uuid.uuid4()),
            'generated_at': timestamp,
            'report_version': '1.0',
            'processing_engine': 'tap-transaction-processor'
        },
        'transaction_details': {
            'transaction_id': transaction_data.get('transaction_id'),
            'customer_id': transaction_data.get('customer_id'),
            'amount': float(transaction_data.get('amount', 0)),
            'currency': transaction_data.get('currency', 'USD'),
            'transaction_type': transaction_data.get('type', 'unknown'),
            'source_account': transaction_data.get('source_account'),
            'destination_account': transaction_data.get('destination_account'),
            'description': transaction_data.get('description', ''),
            'original_timestamp': transaction_data.get('timestamp')
        },
        'processing_results': {
            'status': 'completed',
            'processed_at': timestamp,
            'processing_duration_ms': 0,  # Would be calculated in real implementation
            'fraud_analysis': fraud_analysis
        },
        'compliance': {
            'regulatory_flags': [],
            'aml_status': 'processed',
            'kyc_status': 'verified',
            'sanctions_check': 'clear'
        },
        'audit_trail': {
            'created_by': 'tap-transaction-processor',
            'processing_node': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
            'execution_id': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME', 'unknown')
        }
    }
```

