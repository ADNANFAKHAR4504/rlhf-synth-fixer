#!/usr/bin/env python
import time
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider

# Generate unique suffix to avoid resource naming conflicts
UNIQUE_SUFFIX = str(int(time.time()))[-6:]
from lib.vpc import VpcConstruct
from lib.security import SecurityConstruct
from lib.database import DatabaseConstruct
from lib.storage import StorageConstruct
from lib.alb import AlbConstruct
from lib.compute import ComputeConstruct
from lib.cdn import CdnConstruct
from lib.secrets import SecretsConstruct
from lib.monitoring import MonitoringConstruct


class FinancialTransactionStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "AWS",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "ManagedBy": "cdktf"
                }
            }]
        )

        self.environment_suffix = environment_suffix

        # VPC and Networking
        vpc = VpcConstruct(self, "vpc", environment_suffix)

        # Security (IAM, KMS, Security Groups)
        security = SecurityConstruct(self, "security", environment_suffix, vpc)

        # Database
        database = DatabaseConstruct(
            self, "database", environment_suffix, vpc, security
        )

        # Storage (S3 buckets)
        storage = StorageConstruct(self, "storage", environment_suffix)

        # Secrets Manager with rotation
        secrets = SecretsConstruct(
            self, "secrets", environment_suffix, database, security, vpc
        )

        # Application Load Balancer
        alb = AlbConstruct(self, "alb", environment_suffix, vpc, security)

        # Compute (Auto Scaling)
        compute = ComputeConstruct(
            self, "compute", environment_suffix, vpc, security, alb, database, secrets
        )

        # CloudFront and WAF
        cdn = CdnConstruct(self, "cdn", environment_suffix, alb, storage, security)

        # Monitoring (CloudWatch, SNS)
        monitoring = MonitoringConstruct(
            self, "monitoring", environment_suffix, alb, database
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "alb_dns_name",
            value=alb.alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(self, "cloudfront_domain_name",
            value=cdn.distribution.domain_name,
            description="CloudFront Distribution Domain Name"
        )

        TerraformOutput(self, "cloudfront_url",
            value=f"https://{cdn.distribution.domain_name}",
            description="Application Endpoint URL (via CloudFront)"
        )

        TerraformOutput(self, "database_endpoint",
            value=database.cluster.endpoint,
            description="Aurora MySQL Cluster Endpoint"
        )

        TerraformOutput(self, "database_reader_endpoint",
            value=database.cluster.reader_endpoint,
            description="Aurora MySQL Reader Endpoint"
        )

        TerraformOutput(self, "monitoring_dashboard_url",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=financial-transaction-{environment_suffix}",
            description="CloudWatch Dashboard URL"
        )


app = App()
# Include unique suffix in environment_suffix to avoid resource conflicts
env_suffix = f"dev-{UNIQUE_SUFFIX}"
FinancialTransactionStack(app, "financial-transaction-platform", environment_suffix=env_suffix)
app.synth()
