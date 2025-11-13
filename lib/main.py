#!/usr/bin/env python3
"""
CDKTF stack for payment processing web application infrastructure.

This stack deploys a highly available, secure infrastructure including:
- VPC with public and private subnets across 3 AZs
- Application Load Balancer with HTTPS and WAF
- Auto Scaling Group with EC2 instances
- RDS PostgreSQL Multi-AZ with encryption
- S3 + CloudFront for static content
- Comprehensive monitoring and security controls
"""

from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
import os

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.networking import NetworkingInfrastructure
from lib.compute import ComputeInfrastructure
from lib.database import DatabaseInfrastructure
from lib.storage import StorageInfrastructure
from lib.security import SecurityInfrastructure
from lib.monitoring import MonitoringInfrastructure


class PaymentProcessingStack(TerraformStack):
    """Main stack for payment processing web application infrastructure."""

    def __init__(self, scope: Construct, ns: str, environment_suffix: str):
        """
        Initialize the payment processing stack.

        Args:
            scope: The scope in which to define this construct
            ns: The namespace for this stack
            environment_suffix: Unique suffix for resource naming
        """
        super().__init__(scope, ns)

        # Read region from configuration
        region_file = os.path.join(os.path.dirname(__file__), "AWS_REGION")
        with open(region_file, "r", encoding="utf-8") as f:
            region = f.read().strip()

        # AWS Provider configuration
        AwsProvider(
            self,
            "aws",
            region=region,
            default_tags=[
                {
                    "tags": {
                        "Environment": f"payment-processing-{environment_suffix}",
                        "ManagedBy": "CDKTF",
                        "Project": "PaymentProcessing",
                        "Compliance": "PCI-DSS",
                    }
                }
            ],
        )

        # Deploy networking infrastructure
        networking = NetworkingInfrastructure(
            self, "networking", environment_suffix=environment_suffix, region=region
        )

        # Deploy security infrastructure
        security = SecurityInfrastructure(
            self,
            "security",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
        )

        # Deploy database infrastructure
        database = DatabaseInfrastructure(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            db_security_group_id=security.db_security_group_id,
        )

        # Deploy storage infrastructure
        storage = StorageInfrastructure(
            self, "storage", environment_suffix=environment_suffix, region=region
        )

        # Deploy compute infrastructure
        compute = ComputeInfrastructure(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            public_subnet_ids=networking.public_subnet_ids,
            private_subnet_ids=networking.private_subnet_ids,
            alb_security_group_id=security.alb_security_group_id,
            app_security_group_id=security.app_security_group_id,
            instance_profile_name=security.instance_profile_name,
            waf_web_acl_arn=security.waf_web_acl_arn,
            db_endpoint=database.db_endpoint,
            s3_bucket_name=storage.static_content_bucket_name,
        )

        # Deploy monitoring infrastructure
        monitoring = MonitoringInfrastructure(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            autoscaling_group_name=compute.autoscaling_group_name,
            alb_arn_suffix=compute.alb_arn_suffix,
            target_group_arn_suffix=compute.target_group_arn_suffix,
            db_instance_identifier=database.db_instance_identifier,
        )

        # Stack outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=compute.alb_dns_name,
            description="Application Load Balancer DNS name",
        )

        TerraformOutput(
            self,
            "cloudfront_domain_name",
            value=storage.cloudfront_domain_name,
            description="CloudFront distribution domain name",
        )

        TerraformOutput(
            self,
            "db_endpoint",
            value=database.db_endpoint,
            description="RDS database endpoint",
        )

        TerraformOutput(
            self,
            "static_content_bucket",
            value=storage.static_content_bucket_name,
            description="S3 bucket for static content",
        )


def main():
    """Main entry point for the CDKTF application."""
    app = App()

    # Get environment suffix from environment variable or use default
    environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

    # Create the stack
    PaymentProcessingStack(app, "TapStack", environment_suffix=environment_suffix)

    app.synth()


if __name__ == "__main__":
    main()
