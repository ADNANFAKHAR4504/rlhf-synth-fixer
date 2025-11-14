from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str):
        super().__init__(scope, id)

        # CloudWatch Alarms for Container Insights
        # Note: Container Insights needs to be enabled via EKS add-on or kubectl
        self.cpu_alarm = CloudwatchMetricAlarm(self, "cpu-alarm",
            alarm_name=f"eks-cluster-cpu-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="node_cpu_utilization",
            namespace="ContainerInsights",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when cluster CPU exceeds 80%",
            dimensions={
                "ClusterName": cluster_name
            }
        )

        self.memory_alarm = CloudwatchMetricAlarm(self, "memory-alarm",
            alarm_name=f"eks-cluster-memory-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="node_memory_utilization",
            namespace="ContainerInsights",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when cluster memory exceeds 80%",
            dimensions={
                "ClusterName": cluster_name
            }
        )
