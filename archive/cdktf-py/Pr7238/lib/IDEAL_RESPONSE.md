# CDKTF Python VPC Infrastructure - Production-Ready Implementation

This is a production-ready implementation with enhanced error handling, documentation, and best practices for a financial services VPC infrastructure using CDKTF with Python.

## File: lib/tap_stack.py

```python
import os
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.network_acl import NetworkAcl, NetworkAclEgress, NetworkAclIngress


def get_aws_region():
    """Read AWS region from lib/AWS_REGION file or environment variable."""
    # First check environment variable
    region = os.getenv("AWS_REGION")
    if region:
        return region.strip()

    # Fall back to reading from file
    region_file = os.path.join(os.path.dirname(__file__), "AWS_REGION")
    if os.path.exists(region_file):
        with open(region_file, "r", encoding="utf-8") as f:
            return f.read().strip()

    # Default fallback
    return "us-east-1"


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, environment_suffix: str):
        super().__init__(scope, stack_id)

        # Get AWS region from file or environment
        aws_region = get_aws_region()

        # AWS Provider
        AwsProvider(self, "aws", region=aws_region)

        # Common tags
        common_tags = {
            "Environment": environment_suffix,
            "Project": "DigitalBanking"
        }

        # VPC
        vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"vpc-{environment_suffix}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"igw-{environment_suffix}"}
        )

        # Availability Zones (3 AZs for high availability as per requirements)
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # Create subnets
        public_subnets = []
        private_subnets = []

        for i, az in enumerate(azs):
            # Public subnet
            public_subnet = Subnet(
                self,
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"public-subnet-{az}-{environment_suffix}", "Type": "Public"}
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i + 10}.0/24",
                availability_zone=az,
                tags={**common_tags, "Name": f"private-subnet-{az}-{environment_suffix}", "Type": "Private"}
            )
            private_subnets.append(private_subnet)

        # Elastic IPs and NAT Gateways
        nat_gateways = []
        for i, public_subnet in enumerate(public_subnets):
            eip = Eip(
                self,
                f"eip-{i}-{environment_suffix}",
                domain="vpc",
                tags={**common_tags, "Name": f"eip-nat-{azs[i]}-{environment_suffix}"}
            )

            nat_gateway = NatGateway(
                self,
                f"nat-gateway-{i}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**common_tags, "Name": f"nat-gateway-{azs[i]}-{environment_suffix}"}
            )
            nat_gateways.append(nat_gateway)

        # Public Route Table
        public_route_table = RouteTable(
            self,
            f"public-route-table-{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={**common_tags, "Name": f"public-route-table-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, public_subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public-route-table-association-{i}-{environment_suffix}",
                subnet_id=public_subnet.id,
                route_table_id=public_route_table.id
            )

        # Private Route Tables (one per AZ for NAT Gateway)
        for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
            private_route_table = RouteTable(
                self,
                f"private-route-table-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gateway.id
                    )
                ],
                tags={**common_tags, "Name": f"private-route-table-{azs[i]}-{environment_suffix}"}
            )

            RouteTableAssociation(
                self,
                f"private-route-table-association-{i}-{environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_route_table.id
            )

        # S3 Bucket for VPC Flow Logs
        # Note: S3 bucket names must be globally unique, prefix omitted to allow Terraform to generate unique name
        flow_logs_bucket = S3Bucket(
            self,
            f"flow-logs-bucket-{environment_suffix}",
            bucket_prefix=f"vpc-flow-logs-{environment_suffix}-",
            force_destroy=True,
            tags={**common_tags, "Name": f"vpc-flow-logs-{environment_suffix}"}
        )

        # Enable versioning on S3 bucket
        S3BucketVersioningA(
            self,
            f"flow-logs-bucket-versioning-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # S3 Lifecycle Configuration
        S3BucketLifecycleConfiguration(
            self,
            f"flow-logs-lifecycle-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-glacier",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=30,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # VPC Flow Logs
        FlowLog(
            self,
            f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={**common_tags, "Name": f"vpc-flow-log-{environment_suffix}"}
        )

        # Network ACLs with explicit deny rules
        NetworkAcl(
            self,
            f"network-acl-{environment_suffix}",
            vpc_id=vpc.id,
            subnet_ids=[subnet.id for subnet in public_subnets + private_subnets],
            egress=[
                NetworkAclEgress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            ingress=[
                NetworkAclIngress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            tags={**common_tags, "Name": f"network-acl-baseline-{environment_suffix}"}
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="Public Subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="Private Subnet IDs"
        )

        TerraformOutput(
            self,
            "nat_gateway_ips",
            value=[nat_gateways[i].public_ip for i in range(len(nat_gateways))],
            description="NAT Gateway Public IPs"
        )
```

## File: tap.py

```python
#!/usr/bin/env python
"""
Main entry point for CDKTF VPC infrastructure deployment.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment suffix from environment variable or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Calculate the stack name
stack_name = f"tapstack{environment_suffix}"

# Initialize CDKTF app
app = App()

# Create the TapStack with environment suffix
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix
)

# Synthesize the app to generate Terraform configuration
app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python tap.py",
  "projectId": "u7g9r1g8",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 6.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true"
  }
}
```

## Architecture Overview

This infrastructure implements a highly available, secure VPC foundation with the following components:

### Network Architecture
- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Subnets**: 6 subnets across 3 availability zones
  - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
  - 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- **Internet Gateway**: Public internet access for public subnets
- **NAT Gateways**: 3 NAT Gateways (one per AZ) for private subnet outbound connectivity
- **Route Tables**: Dedicated route tables for public and private subnets

### Security & Compliance
- **VPC Flow Logs**: All traffic logged to S3
- **S3 Bucket**: Versioned storage with 30-day Glacier transition
- **Network ACLs**: Baseline deny-all rules

### High Availability
- Multi-AZ deployment across 3 availability zones
- Redundant NAT Gateways (one per AZ)
- Dynamic region configuration via AWS_REGION file or environment variable
