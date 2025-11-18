from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingModule
from lib.security import SecurityModule
from lib.monitoring import MonitoringModule
from lib.dns import DnsModule


class TapStack(TerraformStack):
    """
    Main CDKTF stack for multi-account VPC peering infrastructure.
    Orchestrates networking, security, monitoring, and DNS modules.
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = "us-east-1"

        # Common tags for all resources
        self.common_tags = {
            "Project": "VPC-Peering",
            "CostCenter": "Infrastructure",
            "ManagedBy": "CDKTF",
            "Environment": environment_suffix
        }

        # AWS Provider configuration
        AwsProvider(
            self,
            "aws",
            region=self.region
        )

        # Create networking infrastructure
        self.networking = NetworkingModule(
            self,
            "networking",
            environment_suffix=self.environment_suffix,
            region=self.region,
            common_tags=self.common_tags
        )

        # Create security groups and network ACLs
        self.security = SecurityModule(
            self,
            "security",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            payment_private_subnets=self.networking.payment_private_subnets,
            analytics_private_subnets=self.networking.analytics_private_subnets,
            environment_suffix=self.environment_suffix,
            common_tags=self.common_tags
        )

        # Create VPC Flow Logs and monitoring
        self.monitoring = MonitoringModule(
            self,
            "monitoring",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            environment_suffix=self.environment_suffix,
            region=self.region,
            common_tags=self.common_tags
        )

        # Create Route 53 private hosted zones
        self.dns = DnsModule(
            self,
            "dns",
            payment_vpc_id=self.networking.payment_vpc.id,
            analytics_vpc_id=self.networking.analytics_vpc.id,
            environment_suffix=self.environment_suffix,
            common_tags=self.common_tags
        )

        # Create outputs
        self._create_outputs()

    def _create_outputs(self):
        """Create Terraform outputs for important resource IDs"""

        # VPC outputs
        TerraformOutput(
            self,
            "payment_vpc_id",
            value=self.networking.payment_vpc.id,
            description="Payment VPC ID"
        )

        TerraformOutput(
            self,
            "analytics_vpc_id",
            value=self.networking.analytics_vpc.id,
            description="Analytics VPC ID"
        )

        # Peering connection output
        TerraformOutput(
            self,
            "peering_connection_id",
            value=self.networking.peering_connection.id,
            description="VPC Peering Connection ID"
        )

        # Security group outputs
        TerraformOutput(
            self,
            "payment_security_group_id",
            value=self.security.payment_sg.id,
            description="Payment VPC Security Group ID"
        )

        TerraformOutput(
            self,
            "analytics_security_group_id",
            value=self.security.analytics_sg.id,
            description="Analytics VPC Security Group ID"
        )

        # Flow logs bucket outputs
        TerraformOutput(
            self,
            "payment_logs_bucket",
            value=self.monitoring.payment_logs_bucket.bucket,
            description="Payment VPC Flow Logs S3 Bucket"
        )

        TerraformOutput(
            self,
            "analytics_logs_bucket",
            value=self.monitoring.analytics_logs_bucket.bucket,
            description="Analytics VPC Flow Logs S3 Bucket"
        )

        # DNS zone outputs
        TerraformOutput(
            self,
            "payment_hosted_zone_id",
            value=self.dns.payment_zone.zone_id,
            description="Payment Private Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "analytics_hosted_zone_id",
            value=self.dns.analytics_zone.zone_id,
            description="Analytics Private Hosted Zone ID"
        )
