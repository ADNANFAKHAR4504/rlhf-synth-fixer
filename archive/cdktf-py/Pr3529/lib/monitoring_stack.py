"""Monitoring Stack for CloudWatch and EventBridge."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.scheduler_schedule import SchedulerSchedule
from cdktf_cdktf_provider_aws.scheduler_schedule_group import SchedulerScheduleGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
import json


class MonitoringStack(Construct):
    """Monitoring stack with CloudWatch and EventBridge."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str,
        *,
        ecr_repository_name: str,
        lambda_function_arn: str,
        lambda_function_name: str,
        sns_topic_arn: str
    ):
        super().__init__(scope, "MonitoringStack")

        # Create EventBridge rule for ECR scan completion
        scan_rule = CloudwatchEventRule(
            self,
            "ecr_scan_complete",
            name=f"ecr-scan-complete-{environment_suffix}",
            description="Trigger Lambda on ECR scan completion",
            event_pattern=json.dumps({
                "source": ["aws.ecr"],
                "detail-type": ["ECR Image Scan"],
                "detail": {
                    "scan-status": ["COMPLETE"],
                    "repository-name": [ecr_repository_name]
                }
            })
        )

        # Add Lambda as target for EventBridge rule
        CloudwatchEventTarget(
            self,
            "scan_lambda_target",
            rule=scan_rule.name,
            arn=lambda_function_arn,
            target_id="1"
        )

        # Create EventBridge Scheduler group
        schedule_group = SchedulerScheduleGroup(
            self,
            "cleanup_schedule_group",
            name=f"ecr-cleanup-{environment_suffix}"
        )

        # Create role for EventBridge Scheduler
        scheduler_role = IamRole(
            self,
            "scheduler_role",
            name=f"ecr-scheduler-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "scheduler.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            inline_policy=[
                {
                    "name": "invoke_lambda",
                    "policy": json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": "lambda:InvokeFunction",
                                "Resource": lambda_function_arn
                            }
                        ]
                    })
                }
            ]
        )

        # Create periodic cleanup schedule
        SchedulerSchedule(
            self,
            "cleanup_schedule",
            name=f"ecr-cleanup-{environment_suffix}",
            group_name=schedule_group.name,
            flexible_time_window={
                "mode": "FLEXIBLE",
                "maximum_window_in_minutes": 15
            },
            schedule_expression="rate(1 day)",
            target={
                "arn": lambda_function_arn,
                "role_arn": scheduler_role.arn,
                "input": json.dumps({
                    "action": "cleanup",
                    "repository": ecr_repository_name
                })
            }
        )

        # Create CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECR", "RepositoryPushCount", {"stat": "Sum", "label": "Push Count"}],
                            [".", "RepositoryPullCount", {"stat": "Sum", "label": "Pull Count"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "ECR Repository Activity"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Scan Processor Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Duration (ms)"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Lambda Function Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum", "label": "Security Alerts Sent"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-2",
                        "title": "Security Notifications"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "ecr_dashboard",
            dashboard_name=f"ecr-registry-metrics-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )
