"""Monitoring and logging infrastructure."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from constructs import Construct


class MonitoringStack(Construct):
    """Creates CloudWatch log groups with compliance retention."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn

        # Application logs
        self.app_log_group = CloudwatchLogGroup(
            self,
            "app_log_group",
            name=f"/aws/payment/application-{environment_suffix}",
            retention_in_days=2557,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-app-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Audit logs
        self.audit_log_group = CloudwatchLogGroup(
            self,
            "audit_log_group",
            name=f"/aws/payment/audit-{environment_suffix}",
            retention_in_days=2557,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-audit-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Network firewall logs
        self.firewall_log_group = CloudwatchLogGroup(
            self,
            "firewall_log_group",
            name=f"/aws/networkfirewall/payment-{environment_suffix}",
            retention_in_days=2557,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-firewall-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # VPC flow logs
        self.vpc_flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/flowlogs-{environment_suffix}",
            retention_in_days=2557,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-vpc-flow-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "app_log_group_name",
            value=self.app_log_group.name,
            description="Application log group name"
        )

        TerraformOutput(
            self,
            "audit_log_group_name",
            value=self.audit_log_group.name,
            description="Audit log group name"
        )
