from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_apigateway as apigw,
    Duration,
    Tags,
    CfnOutput
)
from constructs import Construct

class Route53Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 primary_api_id: str,
                 secondary_api_id: str,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create hosted zone
        hosted_zone = route53.HostedZone(
            self, f"PaymentHostedZone-{environment_suffix}",
            zone_name=f"payment-{environment_suffix}.example.com"
        )

        self.hosted_zone = hosted_zone

        # Health check for primary API
        health_check = route53.CfnHealthCheck(
            self, f"PrimaryAPIHealthCheck-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/prod/health",  # Fixed: added stage
                fully_qualified_domain_name=f"{primary_api_id}.execute-api.us-east-1.amazonaws.com",
                request_interval=30,
                failure_threshold=3
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"Primary API Health Check - {environment_suffix}"
                )
            ]
        )

        # Weighted routing for primary region (FIXED: added set_identifier and record_name)
        primary_record = route53.CfnRecordSet(
            self, f"PrimaryAPIRecord-{environment_suffix}",
            hosted_zone_id=hosted_zone.hosted_zone_id,
            name=f"api.{hosted_zone.zone_name}",
            type="A",
            set_identifier="primary-us-east-1",
            weight=100,
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=f"{primary_api_id}.execute-api.us-east-1.amazonaws.com",
                hosted_zone_id="Z1UJRXOUMOOFQ8",  # API Gateway hosted zone for us-east-1
                evaluate_target_health=True
            ),
            health_check_id=health_check.attr_health_check_id
        )

        # Weighted routing for secondary region (FIXED: proper configuration)
        secondary_record = route53.CfnRecordSet(
            self, f"SecondaryAPIRecord-{environment_suffix}",
            hosted_zone_id=hosted_zone.hosted_zone_id,
            name=f"api.{hosted_zone.zone_name}",
            type="A",
            set_identifier="secondary-us-east-2",
            weight=0,
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=f"{secondary_api_id}.execute-api.us-east-2.amazonaws.com",
                hosted_zone_id="Z2OJLYMUO9EFXC",  # API Gateway hosted zone for us-east-2
                evaluate_target_health=False
            )
        )

        CfnOutput(
            self, "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            export_name=f"hosted-zone-id-{environment_suffix}"
        )

        CfnOutput(
            self, "APIEndpoint",
            value=f"https://api.{hosted_zone.zone_name}",
            export_name=f"api-endpoint-{environment_suffix}"
        )
