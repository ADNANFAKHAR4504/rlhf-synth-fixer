from cdktf import TerraformStack, TerraformOutput, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class GlobalStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_endpoint: str,
        secondary_endpoint: str,
        primary_region: str,
        secondary_region: str,
        state_bucket: str,
        state_bucket_region: str,
        default_tags: dict
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.primary_endpoint = primary_endpoint
        self.secondary_endpoint = secondary_endpoint
        self.primary_region = primary_region
        self.secondary_region = secondary_region

        # Configure S3 Backend for remote state
        S3Backend(self,
            bucket=state_bucket,
            key=f"healthcare-dr/global/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # AWS Provider (global resources use primary region)
        AwsProvider(self, "aws", region=primary_region, default_tags=[default_tags])

        # Common tags
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled",
            "Scope": "Global",
            "ManagedBy": "CDKTF"
        }

        # DynamoDB Global Tables
        self._create_dynamodb_global_tables()

        # Route 53 DNS Failover
        self._create_route53_infrastructure()

    def _create_dynamodb_global_tables(self) -> None:
        """Create DynamoDB global tables with point-in-time recovery"""

        # Patient Records Table
        patient_records = DynamodbTable(
            self,
            "patient_records",
            name=f"healthcare-patient-records-v1-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="patient_id",
            range_key="record_timestamp",
            attribute=[
                DynamodbTableAttribute(name="patient_id", type="S"),
                DynamodbTableAttribute(name="record_timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name=self.secondary_region)
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"patient-records-v1-{self.environment_suffix}"}
        )

        # Audit Logs Table
        audit_logs = DynamodbTable(
            self,
            "audit_logs",
            name=f"healthcare-audit-logs-v1-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="audit_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="audit_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            replica=[
                DynamodbTableReplica(region_name=self.secondary_region)
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={**self.common_tags, "Name": f"audit-logs-v1-{self.environment_suffix}"}
        )

        TerraformOutput(
            self,
            "patient_records_table",
            value=patient_records.name
        )

        TerraformOutput(
            self,
            "audit_logs_table",
            value=audit_logs.name
        )

    def _create_route53_infrastructure(self) -> None:
        """Create Route 53 hosted zone with weighted routing and health checks"""

        # FIX #3: Use non-reserved domain pattern instead of example.com
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"healthcare-dr-v1-{self.environment_suffix}.com",
            tags={**self.common_tags, "Name": f"healthcare-dr-zone-v1-{self.environment_suffix}"}
        )

        # Health checks for both regions
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS",
            resource_path="/health",
            failure_threshold=3,  # Fail after 3 consecutive failures
            request_interval=30,
            tags={**self.common_tags, "Name": f"primary-health-v1-{self.environment_suffix}"}
        )

        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={**self.common_tags, "Name": f"secondary-health-v1-{self.environment_suffix}"}
        )

        # Weighted routing policy: 70% primary, 30% secondary
        Route53Record(
            self,
            "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-v1-{self.environment_suffix}.com",
            type="CNAME",
            ttl=60,
            records=[self.primary_endpoint],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=70
            ),
            set_identifier="primary",
            health_check_id=primary_health_check.id
        )

        Route53Record(
            self,
            "secondary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.healthcare-dr-v1-{self.environment_suffix}.com",
            type="CNAME",
            ttl=60,
            records=[self.secondary_endpoint],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=30
            ),
            set_identifier="secondary",
            health_check_id=secondary_health_check.id
        )

        TerraformOutput(
            self,
            "hosted_zone_id",
            value=hosted_zone.zone_id
        )

        TerraformOutput(
            self,
            "api_domain",
            value=f"api.healthcare-dr-v1-{self.environment_suffix}.com"
        )
