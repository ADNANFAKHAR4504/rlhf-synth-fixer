# CDKTF Python VPC Infrastructure - Production-Ready Implementation

This is a production-ready implementation with enhanced error handling, documentation, and best practices for a financial services VPC infrastructure using CDKTF with Python.

## File: lib/tap_stack.py

```python
"""
Production-ready VPC infrastructure for financial services platform.

This module implements a highly available, secure VPC with:
- Multi-AZ deployment across 3 availability zones
- Public and private subnet tiers
- Redundant NAT Gateways for high availability
- VPC Flow Logs for compliance and monitoring
- Network ACLs for baseline security
- Comprehensive tagging for resource management
"""

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
from typing import List


class TapStack(TerraformStack):
    """
    Production-grade VPC infrastructure stack for financial services.

    This stack creates a complete VPC infrastructure with high availability,
    security, and compliance features suitable for financial services workloads.

    Args:
        scope: The CDKTF app scope
        id: The stack identifier
        environment_suffix: Suffix for resource naming to enable multiple deployments

    Outputs:
        vpc_id: The VPC identifier
        public_subnet_ids: List of public subnet identifiers
        private_subnet_ids: List of private subnet identifiers
        nat_gateway_ips: List of NAT Gateway public IP addresses
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # AWS Provider for eu-west-1 region
        AwsProvider(self, "aws", region="eu-west-1")

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Project": "DigitalBanking",
            "ManagedBy": "CDKTF",
            "Compliance": "FinancialServices"
        }

        # VPC Configuration
        vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"vpc-{environment_suffix}"}
        )

        # Internet Gateway for public subnet internet access
        igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"igw-{environment_suffix}"}
        )

        # Availability Zones for multi-AZ deployment
        azs = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

        # Subnet creation with proper CIDR block allocation
        public_subnets: List[Subnet] = []
        private_subnets: List[Subnet] = []

        for i, az in enumerate(azs):
            # Public subnet with auto-assign public IP
            public_subnet = Subnet(
                self,
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"public-subnet-{az}-{environment_suffix}",
                    "Type": "Public",
                    "Tier": "Public",
                    "AZ": az
                }
            )
            public_subnets.append(public_subnet)

            # Private subnet without public IP assignment
            private_subnet = Subnet(
                self,
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i + 10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"private-subnet-{az}-{environment_suffix}",
                    "Type": "Private",
                    "Tier": "Private",
                    "AZ": az
                }
            )
            private_subnets.append(private_subnet)

        # Elastic IPs and NAT Gateways (one per AZ for high availability)
        nat_gateways: List[NatGateway] = []
        eips: List[Eip] = []

        for i, public_subnet in enumerate(public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"eip-{i}-{environment_suffix}",
                domain="vpc",
                tags={
                    **common_tags,
                    "Name": f"eip-nat-{azs[i]}-{environment_suffix}",
                    "Purpose": "NAT Gateway",
                    "AZ": azs[i]
                }
            )
            eips.append(eip)

            # Create NAT Gateway in public subnet
            nat_gateway = NatGateway(
                self,
                f"nat-gateway-{i}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **common_tags,
                    "Name": f"nat-gateway-{azs[i]}-{environment_suffix}",
                    "AZ": azs[i]
                }
            )
            nat_gateways.append(nat_gateway)

        # Public Route Table (shared across all public subnets)
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
            tags={
                **common_tags,
                "Name": f"public-route-table-{environment_suffix}",
                "Type": "Public"
            }
        )

        # Associate public subnets with public route table
        for i, public_subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public-route-table-association-{i}-{environment_suffix}",
                subnet_id=public_subnet.id,
                route_table_id=public_route_table.id
            )

        # Private Route Tables (one per AZ, each with its own NAT Gateway)
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
                tags={
                    **common_tags,
                    "Name": f"private-route-table-{azs[i]}-{environment_suffix}",
                    "Type": "Private",
                    "AZ": azs[i]
                }
            )

            RouteTableAssociation(
                self,
                f"private-route-table-association-{i}-{environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_route_table.id
            )

        # S3 Bucket for VPC Flow Logs storage
        flow_logs_bucket = S3Bucket(
            self,
            f"flow-logs-bucket-{environment_suffix}",
            bucket=f"vpc-flow-logs-{environment_suffix}",
            force_destroy=True,
            tags={
                **common_tags,
                "Name": f"vpc-flow-logs-{environment_suffix}",
                "Purpose": "VPC Flow Logs Storage"
            }
        )

        # Enable versioning on S3 bucket for compliance
        S3BucketVersioningA(
            self,
            f"flow-logs-bucket-versioning-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # S3 Lifecycle Configuration - transition to Glacier after 30 days
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

        # VPC Flow Logs - capture ALL traffic for compliance
        FlowLog(
            self,
            f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={
                **common_tags,
                "Name": f"vpc-flow-log-{environment_suffix}",
                "Purpose": "Network Monitoring"
            }
        )

        # Network ACLs with explicit deny-all baseline rules
        # Note: In production, you would add specific allow rules for required traffic
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
            tags={
                **common_tags,
                "Name": f"network-acl-baseline-{environment_suffix}",
                "Purpose": "Baseline Security Rules"
            }
        )

        # Stack Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="The VPC identifier"
        )

        # Group subnet outputs by type
        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="List of public subnet IDs across all availability zones"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="List of private subnet IDs across all availability zones"
        )

        # Detailed subnet mapping by AZ
        for i, az in enumerate(azs):
            TerraformOutput(
                self,
                f"public_subnet_{az.replace('-', '_')}",
                value=public_subnets[i].id,
                description=f"Public subnet ID in {az}"
            )

            TerraformOutput(
                self,
                f"private_subnet_{az.replace('-', '_')}",
                value=private_subnets[i].id,
                description=f"Private subnet ID in {az}"
            )

        # NAT Gateway public IPs
        TerraformOutput(
            self,
            "nat_gateway_ips",
            value=[eip.public_ip for eip in eips],
            description="List of NAT Gateway public IP addresses for outbound connectivity"
        )

        # Flow logs bucket information
        TerraformOutput(
            self,
            "flow_logs_bucket",
            value=flow_logs_bucket.id,
            description="S3 bucket storing VPC Flow Logs"
        )
```

## File: tap.py

```python
#!/usr/bin/env python
"""
Main entry point for CDKTF VPC infrastructure deployment.

This script initializes the CDKTF app and creates the TapStack
with the appropriate environment configuration.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment suffix from environment variable or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Validate environment suffix
if not environment_suffix or not environment_suffix.isalnum():
    print("Error: ENVIRONMENT_SUFFIX must be alphanumeric")
    sys.exit(1)

# Calculate the stack name
stack_name = f"tap-{environment_suffix}"

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

print(f"✅ Successfully synthesized infrastructure for environment: {environment_suffix}")
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python tap.py",
  "projectId": "u7g9r1g8",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true"
  }
}
```

## File: requirements.txt

```
cdktf>=0.19.0,<1.0.0
cdktf-cdktf-provider-aws>=19.0.0,<20.0.0
constructs>=10.0.0,<11.0.0
```

## File: .gitignore

```
# CDKTF
cdktf.out/
.terraform/
terraform.tfstate
terraform.tfstate.backup
.terraform.lock.hcl
*.tfvars

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
ENV/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

## File: lib/README.md

```markdown
# VPC Infrastructure for Financial Services Platform

Production-ready VPC infrastructure deployed using CDKTF with Python for a digital banking platform.

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
- **Network ACLs**: Baseline deny-all rules (requires customization for production use)
- **Tagging**: Comprehensive tagging for resource management and compliance

### High Availability
- Multi-AZ deployment across 3 availability zones in eu-west-1
- Redundant NAT Gateways (one per AZ)
- No single points of failure in network design

## Prerequisites

- Python 3.8 or higher
- CDKTF 0.19 or higher
- Terraform 1.5 or higher
- AWS credentials configured with appropriate permissions
- pipenv (recommended) or pip

## Installation

1. Clone the repository and navigate to the project directory

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

Or using pipenv:
```bash
pipenv install
```

3. Install Terraform providers:
```bash
cdktf get
```

## Deployment

### Environment Configuration

Set the environment suffix for resource naming:
```bash
export ENVIRONMENT_SUFFIX=prod
```

### Synthesis

Generate Terraform configuration:
```bash
cdktf synth
```

This creates the Terraform JSON configuration in `cdktf.out/stacks/tap-<suffix>/`.

### Deployment

Deploy the infrastructure:
```bash
cdktf deploy
```

Review the plan and confirm when prompted.

### Selective Deployment

Deploy specific stacks:
```bash
cdktf deploy tap-prod
```

## Outputs

After successful deployment, you'll see the following outputs:

- **vpc_id**: The VPC identifier
- **public_subnet_ids**: List of public subnet IDs
- **private_subnet_ids**: List of private subnet IDs
- **public_subnet_<az>**: Public subnet ID for each AZ
- **private_subnet_<az>**: Private subnet ID for each AZ
- **nat_gateway_ips**: Public IP addresses of NAT Gateways
- **flow_logs_bucket**: S3 bucket for VPC Flow Logs

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

**Warning**: This will permanently delete all resources. Ensure you have backups of any important data.

## Configuration

### Environment Suffix

The stack uses `environment_suffix` to enable multiple deployments:
- Set via `ENVIRONMENT_SUFFIX` environment variable
- Appended to all resource names
- Enables dev, staging, prod environments in the same account

### Region

The stack is configured for `eu-west-1` (Ireland). To change regions:
1. Update the region in `lib/tap_stack.py`
2. Update the availability zones list to match the target region

### CIDR Blocks

Current configuration:
- VPC: 10.0.0.0/16
- Public subnets: 10.0.{0-2}.0/24
- Private subnets: 10.0.{10-12}.0/24

To modify, update the `cidr_block` parameters in `lib/tap_stack.py`.

## Security Considerations

### Network ACLs

The current Network ACL configuration includes baseline deny-all rules. For production use:
1. Add specific allow rules for required traffic
2. Follow principle of least privilege
3. Document all rules and their purposes

Example allow rule structure:
```python
NetworkAclIngress(
    protocol="6",  # TCP
    rule_no=200,
    action="allow",
    cidr_block="10.0.0.0/16",
    from_port=443,
    to_port=443
)
```

### VPC Flow Logs

Flow logs capture ALL traffic (accepted, rejected, and all):
- Stored in S3 with versioning
- Lifecycle policy transitions logs to Glacier after 30 days
- Ensure proper IAM permissions for log delivery

### IAM Permissions

Required AWS permissions:
- VPC, Subnet, Internet Gateway, NAT Gateway creation
- Elastic IP allocation
- Route table management
- S3 bucket creation and configuration
- VPC Flow Logs creation
- Network ACL management

## Compliance

This infrastructure meets the following compliance requirements:

- **Network Segmentation**: Public/private subnet tiers
- **High Availability**: Multi-AZ deployment
- **Monitoring**: VPC Flow Logs enabled
- **Data Retention**: 30-day hot storage, then Glacier
- **Tagging**: Environment, Project, ManagedBy, Compliance tags

## Cost Optimization

### NAT Gateway Costs

NAT Gateways are the primary cost driver:
- 3 NAT Gateways (one per AZ) for high availability
- Charged per hour and per GB processed
- Consider consolidating to fewer AZs if cost is a concern

### S3 Storage Costs

Flow logs storage:
- S3 Standard for first 30 days
- Glacier for long-term retention
- Consider expiration policies for very old logs

## Troubleshooting

### Synthesis Errors

If `cdktf synth` fails:
1. Check Python version (3.8+)
2. Verify all dependencies installed
3. Run `cdktf get` to update providers

### Deployment Failures

Common issues:
1. **CIDR conflicts**: Ensure VPC CIDR doesn't overlap with existing VPCs
2. **Resource limits**: Check AWS service quotas
3. **IAM permissions**: Verify credentials have required permissions

### NAT Gateway Issues

If private subnets can't reach internet:
1. Verify NAT Gateway in healthy state
2. Check route table associations
3. Verify route to NAT Gateway exists (0.0.0.0/0)

## Development

### Code Structure

```
.
├── lib/
│   ├── __init__.py
│   ├── tap_stack.py          # Main stack implementation
│   ├── PROMPT.md              # Task requirements
│   ├── MODEL_RESPONSE.md      # Initial implementation
│   ├── IDEAL_RESPONSE.md      # Production-ready implementation
│   └── README.md              # This file
├── tap.py                      # Entry point
├── cdktf.json                  # CDKTF configuration
├── requirements.txt            # Python dependencies
└── metadata.json               # Task metadata
```

### Adding Resources

To add new resources:
1. Import required classes from `cdktf_cdktf_provider_aws`
2. Add resource creation in `TapStack.__init__`
3. Use `environment_suffix` for resource naming
4. Apply `common_tags` to all resources
5. Add relevant outputs

### Testing

Before deployment:
1. Run `cdktf synth` to generate Terraform config
2. Review generated JSON in `cdktf.out/`
3. Use `terraform plan` for detailed change preview
4. Test in non-production environment first

## Support

For issues or questions:
1. Check AWS CloudWatch for resource health
2. Review VPC Flow Logs for network issues
3. Consult AWS documentation for service-specific concerns
4. Review CDKTF documentation for framework issues

## License

[Your License Here]

## References

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [AWS NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
```
