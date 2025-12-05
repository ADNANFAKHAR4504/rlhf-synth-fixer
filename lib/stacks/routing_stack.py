"""Global routing infrastructure - Route 53 and Global Accelerator"""

from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import (
    Route53Record,
    Route53RecordFailoverRoutingPolicy,
)
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.globalaccelerator_accelerator import (
    GlobalacceleratorAccelerator,
    GlobalacceleratorAcceleratorAttributes,
)
from cdktf_cdktf_provider_aws.globalaccelerator_listener import (
    GlobalacceleratorListener,
    GlobalacceleratorListenerPortRange,
)
from cdktf_cdktf_provider_aws.globalaccelerator_endpoint_group import (
    GlobalacceleratorEndpointGroup,
    GlobalacceleratorEndpointGroupEndpointConfiguration,
)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class RoutingStack(Construct):
    """Creates Route 53 failover and Global Accelerator"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_api_endpoint: str,
        secondary_api_endpoint: str
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # SNS topic for health check alarms
        sns_topic = SnsTopic(
            self,
            "health-alarm-topic",
            name=f"dr-health-alarms-{environment_suffix}",
            tags={
                "Name": f"dr-health-alarms-{environment_suffix}"
            }
        )

        # Route 53 Hosted Zone
        hosted_zone = Route53Zone(
            self,
            "hosted-zone",
            name=f"dr-payments-{environment_suffix}.example.com",
            tags={
                "Name": f"dr-payments-{environment_suffix}.example.com"
            }
        )

        # Health checks
        primary_health_check = Route53HealthCheck(
            self,
            "primary-health-check",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_api_endpoint.replace("https://", "").replace("http://", "").split("/")[0],
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"dr-primary-health-{environment_suffix}"
            }
        )

        secondary_health_check = Route53HealthCheck(
            self,
            "secondary-health-check",
            type="HTTPS",
            resource_path="/health",
            fqdn=secondary_api_endpoint.replace("https://", "").replace("http://", "").split("/")[0],
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"dr-secondary-health-{environment_suffix}"
            }
        )

        # CloudWatch alarms for health checks
        CloudwatchMetricAlarm(
            self,
            "primary-health-alarm",
            alarm_name=f"dr-primary-unhealthy-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthCheckStatus",
            namespace="AWS/Route53",
            period=60,
            statistic="Minimum",
            threshold=1.0,
            alarm_description="Alert when primary region is unhealthy",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "HealthCheckId": primary_health_check.id
            }
        )

        # Route 53 failover records
        Route53Record(
            self,
            "primary-failover-record",
            zone_id=hosted_zone.zone_id,
            name=f"api.dr-payments-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[primary_api_endpoint.replace("https://", "").replace("http://", "").split("/")[0]],
            set_identifier="primary",
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="PRIMARY"
            ),
            health_check_id=primary_health_check.id
        )

        Route53Record(
            self,
            "secondary-failover-record",
            zone_id=hosted_zone.zone_id,
            name=f"api.dr-payments-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[secondary_api_endpoint.replace("https://", "").replace("http://", "").split("/")[0]],
            set_identifier="secondary",
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="SECONDARY"
            ),
            health_check_id=secondary_health_check.id
        )

        # Global Accelerator
        self.global_accelerator = GlobalacceleratorAccelerator(
            self,
            "global-accelerator",
            name=f"dr-payment-accelerator-{environment_suffix}",
            ip_address_type="IPV4",
            enabled=True,
            attributes=GlobalacceleratorAcceleratorAttributes(
                flow_logs_enabled=True,
                flow_logs_s3_bucket=f"dr-ga-logs-{environment_suffix}",
                flow_logs_s3_prefix="flow-logs/"
            ),
            tags={
                "Name": f"dr-payment-accelerator-{environment_suffix}"
            }
        )

        # Global Accelerator Listener
        listener = GlobalacceleratorListener(
            self,
            "ga-listener",
            accelerator_arn=self.global_accelerator.id,
            protocol="TCP",
            port_range=[GlobalacceleratorListenerPortRange(
                from_port=443,
                to_port=443
            )]
        )

        # Endpoint Groups (one per region)
        GlobalacceleratorEndpointGroup(
            self,
            "primary-endpoint-group",
            listener_arn=listener.id,
            endpoint_group_region="us-east-1",
            traffic_dial_percentage=100,
            health_check_interval_seconds=30,
            health_check_path="/health",
            health_check_protocol="HTTPS",
            threshold_count=3,
            endpoint_configuration=[GlobalacceleratorEndpointGroupEndpointConfiguration(
                endpoint_id=f"arn:aws:apigateway:us-east-1::/restapis/{primary_api_endpoint.split('/')[-2]}",
                weight=100
            )]
        )

        GlobalacceleratorEndpointGroup(
            self,
            "secondary-endpoint-group",
            listener_arn=listener.id,
            endpoint_group_region="us-east-2",
            traffic_dial_percentage=100,
            health_check_interval_seconds=30,
            health_check_path="/health",
            health_check_protocol="HTTPS",
            threshold_count=3,
            endpoint_configuration=[GlobalacceleratorEndpointGroupEndpointConfiguration(
                endpoint_id=f"arn:aws:apigateway:us-east-2::/restapis/{secondary_api_endpoint.split('/')[-2]}",
                weight=100
            )]
        )

        # Outputs
        self.global_accelerator_dns = self.global_accelerator.dns_name
        self.failover_domain = f"api.dr-payments-{environment_suffix}.example.com"
