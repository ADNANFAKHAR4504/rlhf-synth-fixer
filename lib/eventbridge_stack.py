"""EventBridge rules for capturing AWS service events"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
)
from constructs import Construct


class EventBridgeStackProps(cdk.StackProps):
    """Properties for EventBridgeStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class EventBridgeStack(Construct):
    """Stack for EventBridge rules and event forwarding"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[EventBridgeStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create log group for EventBridge events
        event_log_group = logs.LogGroup(
            self,
            f"EventBridgeLogGroup-{env_suffix}",
            log_group_name=f"/aws/events/payment-processing-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Rule for Lambda function state changes
        lambda_state_rule = events.Rule(
            self,
            f"LambdaStateRule-{env_suffix}",
            rule_name=f"lambda-state-changes-{env_suffix}",
            description="Capture Lambda function state changes",
            event_pattern=events.EventPattern(
                source=["aws.lambda"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ],
                detail={
                    "eventName": [
                        "CreateFunction",
                        "DeleteFunction",
                        "UpdateFunctionConfiguration",
                        "UpdateFunctionCode"
                    ]
                }
            )
        )
        lambda_state_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for API Gateway changes
        api_gateway_rule = events.Rule(
            self,
            f"ApiGatewayRule-{env_suffix}",
            rule_name=f"api-gateway-changes-{env_suffix}",
            description="Capture API Gateway changes",
            event_pattern=events.EventPattern(
                source=["aws.apigateway"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ]
            )
        )
        api_gateway_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for DynamoDB changes
        dynamodb_rule = events.Rule(
            self,
            f"DynamoDBRule-{env_suffix}",
            rule_name=f"dynamodb-changes-{env_suffix}",
            description="Capture DynamoDB table changes",
            event_pattern=events.EventPattern(
                source=["aws.dynamodb"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ],
                detail={
                    "eventName": [
                        "CreateTable",
                        "DeleteTable",
                        "UpdateTable",
                        "UpdateTimeToLive"
                    ]
                }
            )
        )
        dynamodb_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for SQS changes
        sqs_rule = events.Rule(
            self,
            f"SqsRule-{env_suffix}",
            rule_name=f"sqs-changes-{env_suffix}",
            description="Capture SQS queue changes",
            event_pattern=events.EventPattern(
                source=["aws.sqs"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ]
            )
        )
        sqs_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for CloudWatch alarm state changes
        alarm_state_rule = events.Rule(
            self,
            f"AlarmStateRule-{env_suffix}",
            rule_name=f"alarm-state-changes-{env_suffix}",
            description="Capture CloudWatch alarm state changes",
            event_pattern=events.EventPattern(
                source=["aws.cloudwatch"],
                detail_type=[
                    "CloudWatch Alarm State Change"
                ]
            )
        )
        alarm_state_rule.add_target(targets.CloudWatchLogGroup(event_log_group))
