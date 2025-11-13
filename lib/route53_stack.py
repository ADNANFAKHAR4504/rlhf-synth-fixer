from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_apigateway as apigw,
    aws_certificatemanager as acm,
    Duration,
    CfnOutput
)
from constructs import Construct

class Route53Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 api: apigw.RestApi,
                 environment_suffix: str,
                 domain_name: str = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Use provided domain or create test domain
        # Using .test TLD which is reserved for testing per RFC 6761
        base_domain = domain_name or f"payment-{environment_suffix}.test"

        # Create hosted zone
        hosted_zone = route53.HostedZone(
            self, f"PaymentHostedZone-{environment_suffix}",
            zone_name=base_domain,
            comment=f"Hosted zone for payment processing API - {environment_suffix}"
        )

        self.hosted_zone = hosted_zone

        # Health check for API Gateway
        health_check = route53.CfnHealthCheck(
            self, f"APIHealthCheck-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/prod/health",
                fully_qualified_domain_name=f"{api.rest_api_id}.execute-api.{self.region}.amazonaws.com",
                request_interval=30,
                failure_threshold=3
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"API Health Check - {environment_suffix}"
                ),
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Environment",
                    value=environment_suffix
                )
            ]
        )

        # Create A record pointing to API Gateway
        api_record = route53.CfnRecordSet(
            self, f"APIRecord-{environment_suffix}",
            hosted_zone_id=hosted_zone.hosted_zone_id,
            name=f"api.{base_domain}",
            type="A",
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=f"{api.rest_api_id}.execute-api.{self.region}.amazonaws.com",
                hosted_zone_id="Z1UJRXOUMOOFQ8",  # API Gateway hosted zone for us-east-1
                evaluate_target_health=True
            ),
            health_check_id=health_check.attr_health_check_id
        )

        # Outputs
        CfnOutput(
            self, "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            export_name=f"hosted-zone-id-{environment_suffix}",
            description="Route53 Hosted Zone ID"
        )

        CfnOutput(
            self, "HostedZoneName",
            value=hosted_zone.zone_name,
            export_name=f"hosted-zone-name-{environment_suffix}",
            description="Route53 Hosted Zone Name"
        )

        CfnOutput(
            self, "APICustomDomain",
            value=f"https://api.{base_domain}",
            export_name=f"api-custom-domain-{environment_suffix}",
            description="Custom domain for API Gateway"
        )

        CfnOutput(
            self, "HealthCheckId",
            value=health_check.attr_health_check_id,
            export_name=f"health-check-id-{environment_suffix}",
            description="Route53 Health Check ID"
        )
