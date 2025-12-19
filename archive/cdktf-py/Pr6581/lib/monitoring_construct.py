"""CloudWatch monitoring and alarms."""
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import \
    CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from constructs import Construct


class MonitoringConstruct(Construct):
    """Monitoring and alerting."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 lambda_functions: dict, sqs_queues: dict):
        super().__init__(scope, id)

        # Metric filters for error tracking
        for name, function in lambda_functions.items():
            CloudwatchLogMetricFilter(
                self, f"{name}-error-filter",
                name=f"payment-{name}-errors-{environment_suffix}-ef",
                log_group_name=f"/aws/lambda/{function.function_name}",
                pattern="[ERROR]",
                metric_transformation={
                    "name": f"payment-{name}-errors",
                    "namespace": "PaymentProcessing",
                    "value": "1"
                }
            )

            # Alarm for function errors
            CloudwatchMetricAlarm(
                self, f"{name}-error-alarm",
                alarm_name=f"payment-{name}-errors-{environment_suffix}-ef",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=5,
                dimensions={
                    "FunctionName": function.function_name
                },
                alarm_description=f"Alert when {name} function has errors",
                tags={
                    "Name": f"payment-{name}-error-alarm-{environment_suffix}-ef",
                    "Environment": environment_suffix
                }
            )

        # Alarms for queue depths
        for name, queue in sqs_queues.items():
            CloudwatchMetricAlarm(
                self, f"{name}-queue-alarm",
                alarm_name=f"payment-{name}-queue-depth-{environment_suffix}-ef",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="ApproximateNumberOfMessagesVisible",
                namespace="AWS/SQS",
                period=300,
                statistic="Average",
                threshold=100,
                dimensions={
                    "QueueName": queue.name
                },
                alarm_description=f"Alert when {name} queue depth is high",
                tags={
                    "Name": f"payment-{name}-queue-alarm-{environment_suffix}-ef",
                    "Environment": environment_suffix
                }
            )
