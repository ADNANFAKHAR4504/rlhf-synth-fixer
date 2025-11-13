from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_kubernetes.namespace_v1 import NamespaceV1
from cdktf_cdktf_provider_kubernetes.service_account_v1 import ServiceAccountV1
from cdktf_cdktf_provider_kubernetes.config_map_v1 import ConfigMapV1


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str):
        super().__init__(scope, id)

        # Enable CloudWatch Container Insights
        # Create amazon-cloudwatch namespace
        self.cw_namespace = NamespaceV1(self, "cloudwatch-namespace",
            metadata={
                "name": "amazon-cloudwatch",
                "labels": {
                    "name": "amazon-cloudwatch"
                }
            }
        )

        # CloudWatch Agent ConfigMap for Container Insights
        self.cw_config = ConfigMapV1(self, "cloudwatch-config",
            metadata={
                "name": "cwagentconfig",
                "namespace": "amazon-cloudwatch"
            },
            data={
                "cwagentconfig.json": """{
                    "logs": {
                        "metrics_collected": {
                            "kubernetes": {
                                "cluster_name": "%s",
                                "metrics_collection_interval": 60
                            }
                        },
                        "force_flush_interval": 5
                    }
                }""" % cluster_name
            },
            depends_on=[self.cw_namespace]
        )

        # CloudWatch Alarms with proper Container Insights setup
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
