"""
tap_stack.py

Event-Driven Logistics Application Infrastructure
Processes ~1,500 daily shipment updates using AWS serverless services
"""

import json
from typing import Optional
from datetime import datetime

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
        log_retention_days (Optional[int]): CloudWatch log retention in days.
        alert_email (Optional[str]): Email for SNS alerts.
        enable_xray (Optional[bool]): Enable X-Ray tracing.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        log_retention_days: Optional[int] = None,
        alert_email: Optional[str] = None,
        enable_xray: Optional[bool] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.log_retention_days = log_retention_days or 7
        self.alert_email = alert_email or "devops@example.com"
        self.enable_xray = enable_xray or False


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the event-driven logistics application.

    This component orchestrates the instantiation of EventBridge, Lambda, DynamoDB, SNS,
    and CloudWatch resources for processing shipment events.

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
        environment = self.environment_suffix

        # Common tags for all resources
        common_tags = {
            **args.tags,
            "Environment": environment,
            "Application": "logistics-event-processor",
            "ManagedBy": "Pulumi",
            "CreatedAt": datetime.utcnow().isoformat()
        }

        # ====================================================================
        # DynamoDB Tables
        # ====================================================================

        # Table for shipment events and tracking
        self.shipment_events_table = aws.dynamodb.Table(
            f"shipment-events-table-{environment}",
            name=f"logistics-shipment-events-{environment}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="event_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="event_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
                aws.dynamodb.TableAttributeArgs(name="shipment_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="status", type="S"),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="shipment-index",
                    hash_key="shipment_id",
                    range_key="timestamp",
                    projection_type="ALL"
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(enabled=True),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Table for processing errors
        self.error_events_table = aws.dynamodb.Table(
            f"error-events-table-{environment}",
            name=f"logistics-error-events-{environment}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="error_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="error_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
            ],
            ttl=aws.dynamodb.TableTtlArgs(enabled=True, attribute_name="ttl"),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ====================================================================
        # SNS Topics for Notifications
        # ====================================================================

        # Topic for critical alerts
        self.alert_topic = aws.sns.Topic(
            f"alert-topic-{environment}",
            name=f"logistics-alerts-{environment}",
            kms_master_key_id="alias/aws/sns",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Email subscription for alerts
        self.alert_subscription = aws.sns.TopicSubscription(
            f"alert-email-subscription-{environment}",
            topic=self.alert_topic.arn,
            protocol="email",
            endpoint=args.alert_email,
            opts=ResourceOptions(parent=self)
        )

        # Topic for processing notifications
        self.processing_topic = aws.sns.Topic(
            f"processing-topic-{environment}",
            name=f"logistics-processing-{environment}",
            kms_master_key_id="alias/aws/sns",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ====================================================================
        # EventBridge Event Bus
        # ====================================================================

        # Custom event bus for logistics events
        self.event_bus = aws.cloudwatch.EventBus(
            f"logistics-event-bus-{environment}",
            name=f"logistics-events-{environment}",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Archive for event replay capability
        self.event_archive = aws.cloudwatch.EventArchive(
            f"logistics-event-archive-{environment}",
            name=f"logistics-archive-{environment}",
            event_source_arn=self.event_bus.arn,
            retention_days=7,
            description="Archive of all logistics events for replay and audit",
            opts=ResourceOptions(parent=self)
        )

        # ====================================================================
        # IAM Role for Lambda Functions
        # ====================================================================

        lambda_role = self._create_lambda_role(
            environment,
            [
                self.shipment_events_table.arn,
                self.error_events_table.arn,
                self.alert_topic.arn,
                self.processing_topic.arn
            ],
            common_tags
        )

        # ====================================================================
        # Lambda Functions
        # ====================================================================

        # Shipment Processor Lambda
        self.shipment_processor = aws.lambda_.Function(
            f"shipment-processor-{environment}",
            name=f"logistics-shipment-processor-{environment}",
            runtime="python3.10",
            handler="shipment_processor.handler",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if args.enable_xray else "PassThrough"
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.alert_topic.arn
            ),
            reserved_concurrent_executions=10,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Status Updater Lambda
        self.status_updater = aws.lambda_.Function(
            f"status-updater-{environment}",
            name=f"logistics-status-updater-{environment}",
            runtime="python3.10",
            handler="status_updater.handler",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            role=lambda_role.arn,
            timeout=15,
            memory_size=128,
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if args.enable_xray else "PassThrough"
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Notification Handler Lambda
        self.notification_handler = aws.lambda_.Function(
            f"notification-handler-{environment}",
            name=f"logistics-notification-handler-{environment}",
            runtime="python3.10",
            handler="notification_handler.handler",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            role=lambda_role.arn,
            timeout=10,
            memory_size=128,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ====================================================================
        # EventBridge Rules and Targets
        # ====================================================================

        # Rule for shipment creation events
        shipment_create_rule = aws.cloudwatch.EventRule(
            f"shipment-create-rule-{environment}",
            name=f"logistics-shipment-create-{environment}",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": ["logistics.shipment"],
                "detail-type": ["Shipment Created"]
            }),
            state="ENABLED",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            f"shipment-create-target-{environment}",
            rule=shipment_create_rule.name,
            event_bus_name=self.event_bus.name,
            arn=self.shipment_processor.arn,
            retry_policy=aws.cloudwatch.EventTargetRetryPolicyArgs(
                maximum_event_age_in_seconds=3600,
                maximum_retry_attempts=2
            ),
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            f"shipment-processor-eventbridge-permission-{environment}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=self.shipment_processor.name,
            principal="events.amazonaws.com",
            source_arn=shipment_create_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Rule for status update events
        status_update_rule = aws.cloudwatch.EventRule(
            f"status-update-rule-{environment}",
            name=f"logistics-status-update-{environment}",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": ["logistics.shipment"],
                "detail-type": ["Shipment Status Updated"]
            }),
            state="ENABLED",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            f"status-update-target-{environment}",
            rule=status_update_rule.name,
            event_bus_name=self.event_bus.name,
            arn=self.status_updater.arn,
            retry_policy=aws.cloudwatch.EventTargetRetryPolicyArgs(
                maximum_event_age_in_seconds=1800,
                maximum_retry_attempts=1
            ),
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            f"status-updater-eventbridge-permission-{environment}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=self.status_updater.name,
            principal="events.amazonaws.com",
            source_arn=status_update_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Rule for error events
        error_rule = aws.cloudwatch.EventRule(
            f"error-event-rule-{environment}",
            name=f"logistics-errors-{environment}",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": ["logistics.error"],
                "detail-type": ["Processing Error", "Critical Error"]
            }),
            state="ENABLED",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.EventTarget(
            f"error-notification-target-{environment}",
            rule=error_rule.name,
            event_bus_name=self.event_bus.name,
            arn=self.notification_handler.arn,
            opts=ResourceOptions(parent=self)
        )

        aws.lambda_.Permission(
            f"notification-handler-eventbridge-permission-{environment}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function=self.notification_handler.name,
            principal="events.amazonaws.com",
            source_arn=error_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # ====================================================================
        # CloudWatch Monitoring
        # ====================================================================

        # Log groups for Lambda functions
        shipment_processor_logs = aws.cloudwatch.LogGroup(
            f"shipment-processor-logs-{environment}",
            name=self.shipment_processor.name.apply(lambda n: f"/aws/lambda/{n}"),
            retention_in_days=args.log_retention_days,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        status_updater_logs = aws.cloudwatch.LogGroup(
            f"status-updater-logs-{environment}",
            name=self.status_updater.name.apply(lambda n: f"/aws/lambda/{n}"),
            retention_in_days=args.log_retention_days,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        notification_handler_logs = aws.cloudwatch.LogGroup(
            f"notification-handler-logs-{environment}",
            name=self.notification_handler.name.apply(lambda n: f"/aws/lambda/{n}"),
            retention_in_days=args.log_retention_days,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Alarms
        high_error_alarm = aws.cloudwatch.MetricAlarm(
            f"high-error-alarm-{environment}",
            name=f"logistics-high-errors-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed threshold",
            alarm_actions=[self.alert_topic.arn],
            dimensions={"FunctionName": self.shipment_processor.name},
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"dynamodb-throttle-alarm-{environment}",
            name=f"logistics-dynamodb-throttles-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when DynamoDB throttling occurs",
            alarm_actions=[self.alert_topic.arn],
            dimensions={"TableName": self.shipment_events_table.name},
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "event_bus_name": self.event_bus.name,
            "event_bus_arn": self.event_bus.arn,
            "shipment_table_name": self.shipment_events_table.name,
            "error_table_name": self.error_events_table.name,
            "alert_topic_arn": self.alert_topic.arn,
            "lambda_functions": {
                "shipment_processor": self.shipment_processor.name,
                "status_updater": self.status_updater.name,
                "notification_handler": self.notification_handler.name
            }
        })

    def _create_lambda_role(self, environment: str, resource_arns: list, tags: dict) -> aws.iam.Role:
        """Creates an IAM role for Lambda functions with least-privilege access"""
        
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"logistics-lambda-role-{environment}",
            name=f"logistics-lambda-role-{environment}",
            assume_role_policy=assume_role_policy,
            tags={**tags, "Purpose": "Lambda execution role"},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-{environment}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach X-Ray tracing policy
        aws.iam.RolePolicyAttachment(
            f"lambda-xray-{environment}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Custom policy for DynamoDB and SNS access
        custom_policy = aws.iam.Policy(
            f"lambda-custom-policy-{environment}",
            name=f"logistics-lambda-custom-{environment}",
            policy=Output.all(*resource_arns).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:GetItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:Query",
                                "dynamodb:BatchWriteItem"
                            ],
                            "Resource": [arn for arn in arns if "dynamodb" in arn]
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["sns:Publish"],
                            "Resource": [arn for arn in arns if "sns" in arn]
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
                            "Resource": "*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-custom-attachment-{environment}",
            role=role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        return role
