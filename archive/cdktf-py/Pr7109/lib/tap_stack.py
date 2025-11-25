"""TAP Stack module for CDKTF Python serverless webhook processing infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
import zipfile
import os
import tempfile
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration,
    S3BucketLifecycleConfigurationRuleTransition,
)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration,
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_event_bus import CloudwatchEventBus
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import (
    CloudwatchEventTarget,
    CloudwatchEventTargetDeadLetterConfig,
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sfn_state_machine import (
    SfnStateMachine,
    SfnStateMachineLoggingConfiguration,
)
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTargetEcsTarget
from cdktf import TerraformOutput
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for serverless webhook processing infrastructure."""

    @staticmethod
    def create_lambda_zip_file() -> str:
        """Create a ZIP file containing placeholder Lambda code and return the path."""
        # Placeholder Lambda code
        code = """def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Placeholder function - awaiting container image deployment'
    }
"""
        # Create ZIP file in a temporary location
        zip_path = os.path.join(tempfile.gettempdir(), 'lambda_placeholder.zip')
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('index.py', code)
        return zip_path

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS serverless infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[{"tags": default_tags}] if default_tags else None,
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # ===================================================================
        # S3 Bucket for Transaction Audit Logs
        # ===================================================================
        audit_bucket = S3Bucket(
            self,
            "audit_logs_bucket",
            bucket=f"transaction-audit-logs-{environment_suffix}",
            force_destroy=True,  # Allow destruction for CI/CD
        )

        # Enable versioning on audit bucket
        S3BucketVersioningA(
            self,
            "audit_bucket_versioning",
            bucket=audit_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
        )

        # Enable encryption on audit bucket
        # pylint: disable=line-too-long
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "audit_bucket_encryption",
            bucket=audit_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ],
        )

        # Configure lifecycle policies for audit logs
        S3BucketLifecycleConfiguration(
            self,
            "audit_bucket_lifecycle",
            bucket=audit_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-ia",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=30,
                            storage_class="STANDARD_IA"
                        )
                    ],
                ),
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-glacier",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ],
                ),
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=[
                        S3BucketLifecycleConfigurationRuleExpiration(
                            days=365
                        )
                    ],
                ),
            ],
        )

        # ===================================================================
        # DynamoDB Table for Transactions
        # ===================================================================
        transactions_table = DynamodbTable(
            self,
            "transactions_table",
            name=f"transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(
                    name="transaction_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="S"
                ),
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            # No deletion protection for CI/CD cleanup
        )

        # ===================================================================
        # SNS Topic for Transaction Alerts
        # ===================================================================
        alerts_topic = SnsTopic(
            self,
            "transaction_alerts_topic",
            name=f"transaction-alerts-{environment_suffix}",
        )

        # Email subscription (placeholder - requires confirmation)
        SnsTopicSubscription(
            self,
            "email_subscription",
            topic_arn=alerts_topic.arn,
            protocol="email",
            endpoint="alerts@example.com",  # Replace with actual email
        )

        # SMS subscription (placeholder - requires valid phone number)
        SnsTopicSubscription(
            self,
            "sms_subscription",
            topic_arn=alerts_topic.arn,
            protocol="sms",
            endpoint="+1234567890",  # Replace with actual phone number
        )

        # ===================================================================
        # EventBridge Custom Event Bus
        # ===================================================================
        payment_event_bus = CloudwatchEventBus(
            self,
            "payment_events_bus",
            name=f"payment-events-{environment_suffix}",
        )

        # Dead Letter Queue for EventBridge failures
        dlq = SqsQueue(
            self,
            "eventbridge_dlq",
            name=f"eventbridge-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
        )

        # ===================================================================
        # ECR Repositories for Lambda Container Images
        # ===================================================================
        webhook_validator_ecr = EcrRepository(
            self,
            "webhook_validator_ecr",
            name=f"webhook-validator-{environment_suffix}",
            force_delete=True,  # Allow deletion for CI/CD
            image_scanning_configuration={
                "scan_on_push": True
            },
        )

        fraud_detector_ecr = EcrRepository(
            self,
            "fraud_detector_ecr",
            name=f"fraud-detector-{environment_suffix}",
            force_delete=True,
            image_scanning_configuration={
                "scan_on_push": True
            },
        )

        archival_ecr = EcrRepository(
            self,
            "archival_ecr",
            name=f"transaction-archival-{environment_suffix}",
            force_delete=True,
            image_scanning_configuration={
                "scan_on_push": True
            },
        )

        # ===================================================================
        # CloudWatch Log Groups (30-day retention)
        # ===================================================================
        webhook_validator_logs = CloudwatchLogGroup(
            self,
            "webhook_validator_logs",
            name=f"/aws/lambda/webhook-validator-{environment_suffix}",
            retention_in_days=30,
        )

        fraud_detector_logs = CloudwatchLogGroup(
            self,
            "fraud_detector_logs",
            name=f"/aws/lambda/fraud-detector-{environment_suffix}",
            retention_in_days=30,
        )

        archival_logs = CloudwatchLogGroup(
            self,
            "archival_logs",
            name=f"/aws/lambda/transaction-archival-{environment_suffix}",
            retention_in_days=30,
        )

        api_gateway_logs = CloudwatchLogGroup(
            self,
            "api_gateway_logs",
            name=f"/aws/apigateway/webhook-api-{environment_suffix}",
            retention_in_days=30,
        )

        step_functions_logs = CloudwatchLogGroup(
            self,
            "step_functions_logs",
            name=f"/aws/states/transaction-workflow-{environment_suffix}",
            retention_in_days=30,
        )

        # ===================================================================
        # IAM Role for Lambda Functions
        # ===================================================================
        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"lambda-webhook-processor-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
        )

        # Separate IAM policy for Lambda permissions
        IamRolePolicy(
            self,
            "lambda_permissions_policy",
            name=f"lambda-permissions-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": transactions_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": f"{audit_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": alerts_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "events:PutEvents"
                        ],
                        "Resource": payment_event_bus.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "states:StartExecution"
                        ],
                        # pylint: disable=line-too-long
                        "Resource": f"arn:aws:states:{aws_region}:*:stateMachine:transaction-workflow-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # Attach AWS managed policy for Lambda basic execution
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # ===================================================================
        # Lambda Function: Webhook Validator (Placeholder - update to container later)
        # ===================================================================
        # Create placeholder ZIP file
        lambda_zip_path = self.create_lambda_zip_file()
        
        webhook_validator = LambdaFunction(
            self,
            "webhook_validator",
            function_name=f"webhook-validator-{environment_suffix}",
            role=lambda_role.arn,
            runtime="python3.11",
            handler="index.lambda_handler",
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            memory_size=1024,
            timeout=30,
            architectures=["x86_64"],  # Use x86_64 for placeholder
            environment={
                "variables": {
                    "DYNAMODB_TABLE": transactions_table.name,
                    "EVENT_BUS_NAME": payment_event_bus.name,
                    # pylint: disable=line-too-long
                    "STATE_MACHINE_ARN": f"arn:aws:states:{aws_region}:*:stateMachine:transaction-workflow-{environment_suffix}"
                }
            },
            tracing_config={
                "mode": "Active"  # Enable X-Ray tracing
            },
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash", "image_uri"]
            },
            depends_on=[webhook_validator_logs]
        )

        # ===================================================================
        # Lambda Function: Fraud Detector (Placeholder - update to container later)
        # ===================================================================
        fraud_detector = LambdaFunction(
            self,
            "fraud_detector",
            function_name=f"fraud-detector-{environment_suffix}",
            role=lambda_role.arn,
            runtime="python3.11",
            handler="index.lambda_handler",
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            memory_size=512,
            timeout=60,
            architectures=["x86_64"],  # Use x86_64 for placeholder
            environment={
                "variables": {
                    "DYNAMODB_TABLE": transactions_table.name,
                    "SNS_TOPIC_ARN": alerts_topic.arn
                }
            },
            tracing_config={
                "mode": "Active"  # Enable X-Ray tracing
            },
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash", "image_uri"]
            },
            depends_on=[fraud_detector_logs]
        )

        # ===================================================================
        # Lambda Function: Transaction Archival (Placeholder - update to container later)
        # ===================================================================
        archival_function = LambdaFunction(
            self,
            "transaction_archival",
            function_name=f"transaction-archival-{environment_suffix}",
            role=lambda_role.arn,
            runtime="python3.11",
            handler="index.lambda_handler",
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            memory_size=512,
            timeout=300,  # 5 minutes for batch processing
            architectures=["x86_64"],  # Use x86_64 for placeholder
            environment={
                "variables": {
                    "DYNAMODB_TABLE": transactions_table.name,
                    "S3_BUCKET": audit_bucket.bucket
                }
            },
            tracing_config={
                "mode": "Active"  # Enable X-Ray tracing
            },
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash", "image_uri"]
            },
            depends_on=[archival_logs]
        )

        # ===================================================================
        # API Gateway REST API
        # ===================================================================
        webhook_api = ApiGatewayRestApi(
            self,
            "webhook_api",
            name=f"webhook-api-{environment_suffix}",
            description="Webhook processing API for transaction notifications",
        )

        # Create /webhook resource
        webhook_resource = ApiGatewayResource(
            self,
            "webhook_resource",
            rest_api_id=webhook_api.id,
            parent_id=webhook_api.root_resource_id,
            path_part="webhook"
        )

        # POST method on /webhook
        webhook_post = ApiGatewayMethod(
            self,
            "webhook_post_method",
            rest_api_id=webhook_api.id,
            resource_id=webhook_resource.id,
            http_method="POST",
            authorization="NONE",
        )

        # Lambda integration
        webhook_integration = ApiGatewayIntegration(
            self,
            "webhook_integration",
            rest_api_id=webhook_api.id,
            resource_id=webhook_resource.id,
            http_method=webhook_post.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=webhook_validator.invoke_arn,
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_gateway_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=webhook_validator.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{webhook_api.execution_arn}/*/*"
        )

        # API deployment
        api_deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=webhook_api.id,
            depends_on=[webhook_integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # API stage
        api_stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=api_deployment.id,
            rest_api_id=webhook_api.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            access_log_settings={
                "destination_arn": api_gateway_logs.arn,
                "format": json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            }
        )

        # ===================================================================
        # IAM Role for Step Functions
        # ===================================================================
        sfn_role = IamRole(
            self,
            "step_functions_role",
            name=f"step-functions-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "states.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
        )

        # Separate IAM policy for Step Functions permissions
        # Note: This will be created after Lambda functions are ready
        sfn_policy = IamRolePolicy(
            self,
            "step_functions_permissions_policy",
            name=f"step-functions-permissions-{environment_suffix}",
            role=sfn_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            fraud_detector.arn,
                            archival_function.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": alerts_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogDelivery",
                            "logs:GetLogDelivery",
                            "logs:UpdateLogDelivery",
                            "logs:DeleteLogDelivery",
                            "logs:ListLogDeliveries",
                            "logs:PutResourcePolicy",
                            "logs:DescribeResourcePolicies",
                            "logs:DescribeLogGroups"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # ===================================================================
        # Step Functions EXPRESS Workflow
        # ===================================================================
        state_machine_definition = {
            "Comment": "Transaction processing workflow with parallel fraud detection and notification",
            "StartAt": "ProcessTransaction",
            "States": {
                "ProcessTransaction": {
                    "Type": "Parallel",
                    "Branches": [
                        {
                            "StartAt": "FraudDetection",
                            "States": {
                                "FraudDetection": {
                                    "Type": "Task",
                                    "Resource": "arn:aws:states:::lambda:invoke",
                                    "Parameters": {
                                        "FunctionName": fraud_detector.arn,
                                        "Payload": {
                                            "transaction.$": "$.transaction",
                                            "timestamp.$": "$.timestamp"
                                        }
                                    },
                                    "Retry": [
                                        {
                                            "ErrorEquals": ["States.ALL"],
                                            "IntervalSeconds": 2,
                                            "MaxAttempts": 3,
                                            "BackoffRate": 2.0
                                        }
                                    ],
                                    "End": True
                                }
                            }
                        },
                        {
                            "StartAt": "SendNotification",
                            "States": {
                                "SendNotification": {
                                    "Type": "Task",
                                    "Resource": "arn:aws:states:::sns:publish",
                                    "Parameters": {
                                        "TopicArn": alerts_topic.arn,
                                        "Message": {
                                            "transaction.$": "$.transaction",
                                            "status": "processed",
                                            "timestamp.$": "$.timestamp"
                                        }
                                    },
                                    "Retry": [
                                        {
                                            "ErrorEquals": ["States.ALL"],
                                            "IntervalSeconds": 1,
                                            "MaxAttempts": 2,
                                            "BackoffRate": 2.0
                                        }
                                    ],
                                    "End": True
                                }
                            }
                        }
                    ],
                    "End": True
                }
            }
        }

        transaction_workflow = SfnStateMachine(
            self,
            "transaction_workflow",
            name=f"transaction-workflow-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            type="EXPRESS",  # EXPRESS workflow for high-throughput
            logging_configuration=SfnStateMachineLoggingConfiguration(
                log_destination=f"{step_functions_logs.arn}:*",
                include_execution_data=True,
                level="ALL"
            ),
            tracing_configuration={
                "enabled": True
            }
        )

        # ===================================================================
        # EventBridge Rules for Amount-Based Routing
        # ===================================================================

        # IAM role for EventBridge targets
        eventbridge_role = IamRole(
            self,
            "eventbridge_target_role",
            name=f"eventbridge-targets-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "events.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            })
        )

        # Separate IAM policy for EventBridge target permissions
        IamRolePolicy(
            self,
            "eventbridge_target_permissions_policy",
            name=f"eventbridge-target-permissions-{environment_suffix}",
            role=eventbridge_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "states:StartExecution"
                        ],
                        "Resource": transaction_workflow.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": alerts_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": dlq.arn
                    }
                ]
            })
        )

        # Rule for high-value transactions (>$10,000)
        high_value_rule = CloudwatchEventRule(
            self,
            "high_value_transactions",
            name=f"high-value-transactions-{environment_suffix}",
            event_bus_name=payment_event_bus.name,
            description="Route high-value transactions for immediate processing",
            event_pattern=json.dumps({
                "source": ["webhook.transaction"],
                "detail-type": ["Transaction Created"],
                "detail": {
                    "amount": [{"numeric": [">", 10000]}]
                }
            })
        )

        # Target for high-value transactions - trigger Step Functions
        CloudwatchEventTarget(
            self,
            "high_value_target",
            rule=high_value_rule.name,
            event_bus_name=payment_event_bus.name,
            arn=transaction_workflow.arn,
            role_arn=eventbridge_role.arn,
            dead_letter_config=CloudwatchEventTargetDeadLetterConfig(
                arn=dlq.arn
            )
        )

        # Rule for medium-value transactions ($1,000 - $10,000)
        medium_value_rule = CloudwatchEventRule(
            self,
            "medium_value_transactions",
            name=f"medium-value-transactions-{environment_suffix}",
            event_bus_name=payment_event_bus.name,
            description="Route medium-value transactions for standard processing",
            event_pattern=json.dumps({
                "source": ["webhook.transaction"],
                "detail-type": ["Transaction Created"],
                "detail": {
                    "amount": [
                        {"numeric": [">=", 1000]},
                        {"numeric": ["<=", 10000]}
                    ]
                }
            })
        )

        # Target for medium-value transactions
        CloudwatchEventTarget(
            self,
            "medium_value_target",
            rule=medium_value_rule.name,
            event_bus_name=payment_event_bus.name,
            arn=alerts_topic.arn,
            role_arn=eventbridge_role.arn,
            dead_letter_config=CloudwatchEventTargetDeadLetterConfig(
                arn=dlq.arn
            )
        )

        # Rule for low-value transactions (<$1,000)
        low_value_rule = CloudwatchEventRule(
            self,
            "low_value_transactions",
            name=f"low-value-transactions-{environment_suffix}",
            event_bus_name=payment_event_bus.name,
            description="Route low-value transactions for batch processing",
            event_pattern=json.dumps({
                "source": ["webhook.transaction"],
                "detail-type": ["Transaction Created"],
                "detail": {
                    "amount": [{"numeric": ["<", 1000]}]
                }
            })
        )

        # ===================================================================
        # CloudWatch Dashboard
        # ===================================================================
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Webhook Validator"}],
                            ["...", {"stat": "Sum", "label": "Fraud Detector"}],
                            ["...", {"stat": "Sum", "label": "Archival Function"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Lambda Invocations",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Webhook Validator"}],
                            ["...", {"stat": "Average", "label": "Fraud Detector"}],
                            ["...", {"stat": "Average", "label": "Archival Function"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Lambda Duration (ms)",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Webhook Validator"}],
                            ["...", {"stat": "Sum", "label": "Fraud Detector"}],
                            ["...", {"stat": "Sum", "label": "Archival Function"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Lambda Errors",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "DynamoDB Capacity Units",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/States", "ExecutionsFailed", {"stat": "Sum"}],
                            [".", "ExecutionsSucceeded", {"stat": "Sum"}],
                            [".", "ExecutionsTimedOut", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Step Functions Executions",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", {"stat": "Sum"}],
                            [".", "4XXError", {"stat": "Sum"}],
                            [".", "5XXError", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "API Gateway Requests",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Events", "Invocations", {"stat": "Sum"}],
                            [".", "FailedInvocations", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "EventBridge Invocations",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum"}],
                            [".", "NumberOfNotificationsFailed", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "SNS Messages",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "transaction_dashboard",
            dashboard_name=f"transaction-metrics-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # ==================== Outputs ====================

        # API Gateway Outputs
        TerraformOutput(
            self,
            "api_gateway_url",
            value=f"https://{webhook_api.id}.execute-api.{aws_region}.amazonaws.com/{api_stage.stage_name}",
            description="API Gateway URL for webhook endpoint"
        )

        TerraformOutput(
            self,
            "api_gateway_id",
            value=webhook_api.id,
            description="API Gateway REST API ID"
        )

        # Lambda Function Outputs
        TerraformOutput(
            self,
            "webhook_validator_function_name",
            value=webhook_validator.function_name,
            description="Webhook Validator Lambda Function Name"
        )

        TerraformOutput(
            self,
            "webhook_validator_function_arn",
            value=webhook_validator.arn,
            description="Webhook Validator Lambda Function ARN"
        )

        TerraformOutput(
            self,
            "fraud_detector_function_name",
            value=fraud_detector.function_name,
            description="Fraud Detector Lambda Function Name"
        )

        TerraformOutput(
            self,
            "fraud_detector_function_arn",
            value=fraud_detector.arn,
            description="Fraud Detector Lambda Function ARN"
        )

        TerraformOutput(
            self,
            "archival_function_name",
            value=archival_function.function_name,
            description="Transaction Archival Lambda Function Name"
        )

        TerraformOutput(
            self,
            "archival_function_arn",
            value=archival_function.arn,
            description="Transaction Archival Lambda Function ARN"
        )

        # DynamoDB Outputs
        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=transactions_table.name,
            description="DynamoDB Transactions Table Name"
        )

        TerraformOutput(
            self,
            "dynamodb_table_arn",
            value=transactions_table.arn,
            description="DynamoDB Transactions Table ARN"
        )

        # S3 Outputs
        TerraformOutput(
            self,
            "s3_audit_bucket_name",
            value=audit_bucket.bucket,
            description="S3 Audit Logs Bucket Name"
        )

        TerraformOutput(
            self,
            "s3_audit_bucket_arn",
            value=audit_bucket.arn,
            description="S3 Audit Logs Bucket ARN"
        )

        # SNS Outputs
        TerraformOutput(
            self,
            "sns_topic_arn",
            value=alerts_topic.arn,
            description="SNS Transaction Alerts Topic ARN"
        )

        TerraformOutput(
            self,
            "sns_topic_name",
            value=alerts_topic.name,
            description="SNS Transaction Alerts Topic Name"
        )

        # EventBridge Outputs
        TerraformOutput(
            self,
            "eventbridge_bus_name",
            value=payment_event_bus.name,
            description="EventBridge Payment Events Bus Name"
        )

        TerraformOutput(
            self,
            "eventbridge_bus_arn",
            value=payment_event_bus.arn,
            description="EventBridge Payment Events Bus ARN"
        )

        # Step Functions Outputs
        TerraformOutput(
            self,
            "step_functions_state_machine_arn",
            value=transaction_workflow.arn,
            description="Step Functions Transaction Workflow State Machine ARN"
        )

        TerraformOutput(
            self,
            "step_functions_state_machine_name",
            value=transaction_workflow.name,
            description="Step Functions Transaction Workflow State Machine Name"
        )

        # ECR Outputs
        TerraformOutput(
            self,
            "webhook_validator_ecr_repository_url",
            value=webhook_validator_ecr.repository_url,
            description="Webhook Validator ECR Repository URL"
        )

        TerraformOutput(
            self,
            "fraud_detector_ecr_repository_url",
            value=fraud_detector_ecr.repository_url,
            description="Fraud Detector ECR Repository URL"
        )

        TerraformOutput(
            self,
            "archival_ecr_repository_url",
            value=archival_ecr.repository_url,
            description="Transaction Archival ECR Repository URL"
        )

        # SQS Outputs
        TerraformOutput(
            self,
            "sqs_dlq_url",
            value=dlq.url,
            description="SQS Dead Letter Queue URL"
        )

        TerraformOutput(
            self,
            "sqs_dlq_arn",
            value=dlq.arn,
            description="SQS Dead Letter Queue ARN"
        )

        # CloudWatch Outputs
        TerraformOutput(
            self,
            "cloudwatch_dashboard_name",
            value=f"transaction-metrics-{environment_suffix}",
            description="CloudWatch Dashboard Name"
        )

        # Environment Suffix Output
        TerraformOutput(
            self,
            "environment_suffix",
            value=environment_suffix,
            description="Environment Suffix"
        )
