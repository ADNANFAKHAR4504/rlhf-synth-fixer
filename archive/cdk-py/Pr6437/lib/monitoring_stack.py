from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_rds as rds,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    Duration,
    Tags,
    CfnOutput
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 db_cluster: rds.DatabaseCluster,
                 lambda_functions: list,
                 api: apigw.RestApi,
                 environment_suffix: str,
                 alarm_email: str = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alarms
        alarm_topic = sns.Topic(
            self, f"AlarmTopic-{environment_suffix}",
            display_name=f"Payment Processing Alarms",
            topic_name=f"payment-alarms-{environment_suffix}"
        )

        # Add email subscription if provided
        if alarm_email:
            alarm_topic.add_subscription(
                subscriptions.EmailSubscription(alarm_email)
            )

        self.alarm_topic = alarm_topic

        # RDS CPU Utilization Alarm
        rds_cpu_alarm = cloudwatch.Alarm(
            self, f"RDSCPUUtilization-{environment_suffix}",
            alarm_name=f"RDS-CPU-High-{environment_suffix}",
            metric=db_cluster.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,  # 80% CPU utilization
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        rds_cpu_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Database connections alarm
        db_connections_alarm = cloudwatch.Alarm(
            self, f"DBConnections-{environment_suffix}",
            alarm_name=f"DB-Connections-High-{environment_suffix}",
            metric=db_cluster.metric_database_connections(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=100,
            evaluation_periods=2
        )

        db_connections_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Lambda Error Alarms (percentage-based)
        for idx, fn in enumerate(lambda_functions):
            error_rate_metric = cloudwatch.MathExpression(
                expression="(errors / invocations) * 100",
                using_metrics={
                    "errors": fn.metric_errors(statistic="Sum", period=Duration.minutes(5)),
                    "invocations": fn.metric_invocations(statistic="Sum", period=Duration.minutes(5))
                }
            )

            error_alarm = cloudwatch.Alarm(
                self, f"LambdaError{idx}-{environment_suffix}",
                alarm_name=f"Lambda-Errors-{idx}-{environment_suffix}",
                metric=error_rate_metric,
                threshold=5,  # 5% error rate
                evaluation_periods=2,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
            )
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # API Gateway 5XX Error Alarm (percentage threshold)
        api_error_metric = cloudwatch.MathExpression(
            expression="(errors / requests) * 100",
            using_metrics={
                "errors": api.metric_server_error(statistic="Sum", period=Duration.minutes(5)),
                "requests": api.metric_count(statistic="Sum", period=Duration.minutes(5))
            }
        )

        api_error_alarm = cloudwatch.Alarm(
            self, f"APIGateway5XX-{environment_suffix}",
            alarm_name=f"API-5XX-Errors-{environment_suffix}",
            metric=api_error_metric,
            threshold=1,  # 1% error rate
            evaluation_periods=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        api_error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"PaymentDashboard-{environment_suffix}",
            dashboard_name=f"Payment-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS Cluster Metrics",
                left=[
                    db_cluster.metric_database_connections(),
                    db_cluster.metric_cpu_utilization()
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[fn.metric_invocations() for fn in lambda_functions],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[
                    api.metric_count(),
                    api.metric_client_error(),
                    api.metric_server_error()
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Latency",
                left=[api.metric_latency(statistic="Average")],
                width=12,
                height=6
            )
        )

        CfnOutput(
            self, "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            export_name=f"alarm-topic-arn-{environment_suffix}"
        )
