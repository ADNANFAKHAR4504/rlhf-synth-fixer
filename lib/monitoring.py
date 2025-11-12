"""Monitoring stack for CloudWatch log groups."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup


class MonitoringStack(Construct):
    """CloudWatch monitoring infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        self.services = ["payment-api", "fraud-detection", "notification-service"]
        self.log_groups = {}

        # Create CloudWatch log groups for each service
        for service in self.services:
            log_group = CloudwatchLogGroup(
                self,
                f"{service}_log_group",
                name=f"/ecs/{service}-{environment_suffix}",
                retention_in_days=30,
                kms_key_id=None,  # Using AWS-managed keys
                tags={
                    "Name": f"{service}-logs-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                    "Service": service,
                },
            )
            self.log_groups[service] = log_group

    @property
    def log_group_names(self):
        return {service: lg.name for service, lg in self.log_groups.items()}

    @property
    def log_group_arns(self):
        return [lg.arn for lg in self.log_groups.values()]
