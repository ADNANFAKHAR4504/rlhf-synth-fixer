"""Monitoring infrastructure including CloudWatch, SNS, and EventBridge."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json


class MonitoringConstruct(Construct):
    """Construct for monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        api_gateway_id: str,
        api_gateway_stage_name: str,
        data_processor_function_name: str,
        dynamodb_table_name: str,
        remediation_function_arn: str,
    ):
        """Initialize monitoring infrastructure."""
        super().__init__(scope, construct_id)

        # Create SNS topic for alerts
        alert_topic = SnsTopic(
            self,
            "alert_topic",
            name=f"healthcare-alerts-{environment_suffix}",
            display_name="Healthcare System Alerts",
        )

        # Lambda Errors Alarm
        lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"healthcare-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors exceed threshold",
            dimensions={"FunctionName": data_processor_function_name},
            alarm_actions=[alert_topic.arn],
        )

        # Lambda Throttles Alarm
        lambda_throttle_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_throttle_alarm",
            alarm_name=f"healthcare-lambda-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Lambda function throttles exceed threshold",
            dimensions={"FunctionName": data_processor_function_name},
            alarm_actions=[alert_topic.arn],
        )

        # API Gateway 4xx Errors Alarm
        api_4xx_alarm = CloudwatchMetricAlarm(
            self,
            "api_4xx_alarm",
            alarm_name=f"healthcare-api-4xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=50,
            alarm_description="API Gateway 4xx errors exceed threshold",
            dimensions={
                "ApiName": f"healthcare-api-{environment_suffix}",
                "Stage": api_gateway_stage_name,
            },
            alarm_actions=[alert_topic.arn],
        )

        # API Gateway 5xx Errors Alarm
        api_5xx_alarm = CloudwatchMetricAlarm(
            self,
            "api_5xx_alarm",
            alarm_name=f"healthcare-api-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 5xx errors exceed threshold",
            dimensions={
                "ApiName": f"healthcare-api-{environment_suffix}",
                "Stage": api_gateway_stage_name,
            },
            alarm_actions=[alert_topic.arn],
        )

        # DynamoDB Read Throttle Events Alarm
        dynamodb_read_throttle_alarm = CloudwatchMetricAlarm(
            self,
            "dynamodb_read_throttle_alarm",
            alarm_name=f"healthcare-dynamodb-read-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="DynamoDB read throttle events exceed threshold",
            dimensions={"TableName": dynamodb_table_name},
            alarm_actions=[alert_topic.arn],
        )

        # EventBridge rule for automated remediation
        remediation_rule = CloudwatchEventRule(
            self,
            "remediation_rule",
            name=f"healthcare-auto-remediation-{environment_suffix}",
            description="Trigger remediation on CloudWatch alarms",
            event_pattern=json.dumps(
                {
                    "source": ["aws.cloudwatch"],
                    "detail-type": ["CloudWatch Alarm State Change"],
                    "detail": {"state": {"value": ["ALARM"]}},
                }
            ),
        )

        # EventBridge target for Lambda remediation
        CloudwatchEventTarget(
            self,
            "remediation_target",
            rule=remediation_rule.name,
            arn=remediation_function_arn,
        )

        # Lambda permission for EventBridge
        LambdaPermission(
            self,
            "eventbridge_lambda_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=remediation_function_arn,
            principal="events.amazonaws.com",
            source_arn=remediation_rule.arn,
        )

        # CloudWatch Dashboard
        dashboard = CloudwatchDashboard(
            self,
            "healthcare_dashboard",
            dashboard_name=f"healthcare-dashboard-{environment_suffix}",
            dashboard_body=json.dumps(
                {
                    "widgets": [
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    [
                                        "AWS/Lambda",
                                        "Invocations",
                                        {"stat": "Sum", "label": "Invocations"},
                                    ],
                                    [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                                    [
                                        ".",
                                        "Throttles",
                                        {"stat": "Sum", "label": "Throttles"},
                                    ],
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "Lambda Metrics",
                                "yAxis": {"left": {"min": 0}},
                            },
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    [
                                        "AWS/ApiGateway",
                                        "Count",
                                        {"stat": "Sum", "label": "Requests"},
                                    ],
                                    [
                                        ".",
                                        "4XXError",
                                        {"stat": "Sum", "label": "4xx Errors"},
                                    ],
                                    [
                                        ".",
                                        "5XXError",
                                        {"stat": "Sum", "label": "5xx Errors"},
                                    ],
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "API Gateway Metrics",
                                "yAxis": {"left": {"min": 0}},
                            },
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    [
                                        "AWS/DynamoDB",
                                        "ConsumedReadCapacityUnits",
                                        {"stat": "Sum"},
                                    ],
                                    [
                                        ".",
                                        "ConsumedWriteCapacityUnits",
                                        {"stat": "Sum"},
                                    ],
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "DynamoDB Capacity",
                                "yAxis": {"left": {"min": 0}},
                            },
                        },
                    ]
                }
            ),
        )

        # Export values
        self.alert_topic_arn = alert_topic.arn
        self.dashboard_url = f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={dashboard.dashboard_name}"
