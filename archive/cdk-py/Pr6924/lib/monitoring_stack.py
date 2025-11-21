"""monitoring_stack.py

This module defines the MonitoringStack for CloudWatch monitoring and alerting.
It creates CloudWatch dashboards, event rules, and alarms for pipeline and build metrics.
"""

from aws_cdk import (
    Stack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_events as events,
    aws_events_targets as targets,
    aws_sns as sns,
    aws_codepipeline as codepipeline,
)
from constructs import Construct


class MonitoringStack(Stack):
    """Creates CloudWatch monitoring infrastructure with dashboards, event rules, and alarms."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        pipeline_name: str,
        failure_topic: sns.Topic,
        pipeline: codepipeline.Pipeline = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"PipelineDashboard{environment_suffix}",
            dashboard_name=f"cicd-pipeline-{environment_suffix}"
        )

        # Pipeline failure rule
        pipeline_failure_rule = events.Rule(
            self,
            f"PipelineFailureRule{environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.codepipeline"],
                detail_type=["CodePipeline Pipeline Execution State Change"],
                detail={
                    "state": ["FAILED"],
                    "pipeline": [pipeline_name]
                }
            )
        )

        pipeline_failure_rule.add_target(
            targets.SnsTopic(failure_topic)
        )

        # Pipeline success rule
        pipeline_success_rule = events.Rule(
            self,
            f"PipelineSuccessRule{environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.codepipeline"],
                detail_type=["CodePipeline Pipeline Execution State Change"],
                detail={
                    "state": ["SUCCEEDED"],
                    "pipeline": [pipeline_name]
                }
            )
        )

        # Dashboard widgets - Pipeline execution status
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Pipeline Execution Status",
                width=12,
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CodePipeline",
                        metric_name="PipelineExecutionSuccess",
                        dimensions_map={"PipelineName": pipeline_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/CodePipeline",
                        metric_name="PipelineExecutionFailure",
                        dimensions_map={"PipelineName": pipeline_name},
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="Build Duration",
                width=12,
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CodeBuild",
                        metric_name="Duration",
                        dimensions_map={"ProjectName": f"app-build-{environment_suffix}"},
                        statistic="Average",
                        period=Duration.minutes(5)
                    )
                ]
            )
        )

        # More comprehensive metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Build Success Rate",
                width=12,
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CodeBuild",
                        metric_name="SuccessfulBuilds",
                        dimensions_map={"ProjectName": f"app-build-{environment_suffix}"},
                        statistic="Sum",
                        period=Duration.hours(1)
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/CodeBuild",
                        metric_name="FailedBuilds",
                        dimensions_map={"ProjectName": f"app-build-{environment_suffix}"},
                        statistic="Sum",
                        period=Duration.hours(1)
                    )
                ]
            ),
            cloudwatch.SingleValueWidget(
                title="Pipeline Executions (24h)",
                width=12,
                metrics=[
                    cloudwatch.Metric(
                        namespace="AWS/CodePipeline",
                        metric_name="PipelineExecutionSuccess",
                        dimensions_map={"PipelineName": pipeline_name},
                        statistic="Sum",
                        period=Duration.hours(24)
                    )
                ]
            )
        )

        # CloudWatch alarm for pipeline failures
        pipeline_failure_alarm = cloudwatch.Alarm(
            self,
            f"PipelineFailureAlarm{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/CodePipeline",
                metric_name="PipelineExecutionFailure",
                dimensions_map={"PipelineName": pipeline_name},
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            evaluation_periods=1,
            threshold=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alert when pipeline execution fails"
        )

        pipeline_failure_alarm.add_alarm_action(
            cw_actions.SnsAction(failure_topic)
        )
