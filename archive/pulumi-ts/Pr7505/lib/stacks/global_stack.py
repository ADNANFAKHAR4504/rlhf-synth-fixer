"""
Global Stack
Contains Route53 failover configuration and DynamoDB Global Tables
"""

from cdktf import TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from constructs import Construct


class GlobalStack(TerraformStack):
    """
    Global stack for disaster recovery infrastructure.
    Contains Route53 and DynamoDB Global Tables.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_aurora_endpoint: str,
        secondary_aurora_endpoint: str,
        primary_health_check_url: str,
        secondary_health_check_url: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix

        # AWS Provider for global services (us-east-1)
        AwsProvider(
            self,
            "aws",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Application": "FinancialTradingPlatform",
                    "DR-Role": "Global",
                }
            }]
        )

        # Route53 Hosted Zone
        zone = Route53Zone(
            self,
            "hosted-zone",
            name=f"trading-platform-{environment_suffix}.example.com",
            comment="DNS zone for multi-region disaster recovery",
        )

        # Health Check for Primary Region
        primary_health_check = Route53HealthCheck(
            self,
            "primary-health-check",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_health_check_url.replace("https://", "").split("/")[0],
            port=443,
            request_interval=30,
            failure_threshold=2,
            measure_latency=True,
            tags={
                "Name": f"primary-health-check-{environment_suffix}",
                "Region": primary_region,
            }
        )

        # Health Check for Secondary Region
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary-health-check",
            type="HTTPS",
            resource_path="/health",
            fqdn=secondary_health_check_url.replace("https://", "").split("/")[0],
            port=443,
            request_interval=30,
            failure_threshold=2,
            measure_latency=True,
            tags={
                "Name": f"secondary-health-check-{environment_suffix}",
                "Region": secondary_region,
            }
        )

        # Primary Failover Record
        Route53Record(
            self,
            "primary-record",
            zone_id=zone.zone_id,
            name=f"db.trading-platform-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[primary_aurora_endpoint],
            set_identifier="primary",
            failover_routing_policy={
                "type": "PRIMARY"
            },
            health_check_id=primary_health_check.id,
        )

        # Secondary Failover Record
        Route53Record(
            self,
            "secondary-record",
            zone_id=zone.zone_id,
            name=f"db.trading-platform-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[secondary_aurora_endpoint],
            set_identifier="secondary",
            failover_routing_policy={
                "type": "SECONDARY"
            },
            health_check_id=secondary_health_check.id,
        )

        # DynamoDB Global Table for Session State
        dynamodb_table = DynamodbTable(
            self,
            "session-state-table",
            name=f"session-state-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[
                {
                    "name": "session_id",
                    "type": "S"
                },
                {
                    "name": "user_id",
                    "type": "S"
                }
            ],
            global_secondary_index=[{
                "name": "user-index",
                "hashKey": "user_id",
                "projectionType": "ALL",
            }],
            replica=[{
                "regionName": secondary_region,
                "propagateTags": True,
            }],
            point_in_time_recovery={
                "enabled": True
            },
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={
                "Name": f"session-state-{environment_suffix}",
                "Type": "GlobalTable",
            }
        )

        # Stack Outputs
        TerraformOutput(
            self,
            "route53-zone-id",
            value=zone.zone_id,
            description="Route53 Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "database-dns-name",
            value=f"db.trading-platform-{environment_suffix}.example.com",
            description="Database Failover DNS Name"
        )

        TerraformOutput(
            self,
            "dynamodb-table-name",
            value=dynamodb_table.name,
            description="DynamoDB Global Table Name"
        )

        TerraformOutput(
            self,
            "primary-health-check-id",
            value=primary_health_check.id,
            description="Primary Region Health Check ID"
        )

        TerraformOutput(
            self,
            "secondary-health-check-id",
            value=secondary_health_check.id,
            description="Secondary Region Health Check ID"
        )