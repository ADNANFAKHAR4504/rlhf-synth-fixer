"""route53_stack.py
Route 53 health checks and weighted routing for failover.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_route53 as route53
from constructs import Construct


class Route53StackProps:
    """Properties for Route53 stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_function_url: str,
        secondary_function_url: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_function_url = primary_function_url
        self.secondary_function_url = secondary_function_url


class Route53Stack(Construct):
    """Creates Route 53 health checks and routing policies."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Route53StackProps
    ):
        super().__init__(scope, construct_id)

        # Create hosted zone (assuming domain is provided)
        self.hosted_zone = route53.HostedZone(
            self,
            f'HostedZone{props.environment_suffix}',
            zone_name=f'dr-example-{props.environment_suffix}.com',
            comment='Hosted zone for disaster recovery solution'
        )

        # Create health check for primary region
        primary_health_check = route53.CfnHealthCheck(
            self,
            f'PrimaryHealthCheck{props.environment_suffix}',
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type='HTTPS',
                resource_path='/health',
                fully_qualified_domain_name=props.primary_function_url,
                port=443,
                request_interval=30,
                failure_threshold=3,
                measure_latency=True
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key='Name',
                    value=f'dr-primary-health-check-{props.environment_suffix}'
                ),
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key='DR-Role',
                    value='Primary-HealthCheck'
                )
            ]
        )

        # Create health check for secondary region
        secondary_health_check = route53.CfnHealthCheck(
            self,
            f'SecondaryHealthCheck{props.environment_suffix}',
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type='HTTPS',
                resource_path='/health',
                fully_qualified_domain_name=props.secondary_function_url,
                port=443,
                request_interval=30,
                failure_threshold=3,
                measure_latency=True
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key='Name',
                    value=f'dr-secondary-health-check-{props.environment_suffix}'
                ),
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key='DR-Role',
                    value='Secondary-HealthCheck'
                )
            ]
        )

        # Create A record with weighted routing for primary
        route53.ARecord(
            self,
            f'PrimaryARecord{props.environment_suffix}',
            zone=self.hosted_zone,
            record_name='api',
            target=route53.RecordTarget.from_ip_addresses(props.primary_function_url),
            weight=100,
            set_identifier='primary'
        )

        # Create A record with weighted routing for secondary
        route53.ARecord(
            self,
            f'SecondaryARecord{props.environment_suffix}',
            zone=self.hosted_zone,
            record_name='api',
            target=route53.RecordTarget.from_ip_addresses(props.secondary_function_url),
            weight=0,
            set_identifier='secondary'
        )

        # Outputs
        cdk.CfnOutput(
            self,
            'HostedZoneId',
            value=self.hosted_zone.hosted_zone_id,
            description='Route 53 hosted zone ID'
        )
        cdk.CfnOutput(
            self,
            'HostedZoneName',
            value=self.hosted_zone.zone_name,
            description='Route 53 hosted zone name'
        )