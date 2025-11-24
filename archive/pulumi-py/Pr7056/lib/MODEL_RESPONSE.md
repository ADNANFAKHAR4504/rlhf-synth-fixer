# Pulumi Python VPC Infrastructure Implementation

This implementation creates a production-ready three-tier VPC architecture for a financial services trading platform with complete network segmentation, monitoring, and PCI DSS compliance features.

## Architecture Overview

The solution creates:
- VPC with 10.0.0.0/16 CIDR block across 3 availability zones
- 3 public subnets for load balancers and NAT gateways
- 3 private subnets for application servers with NAT gateway routing
- 3 isolated subnets for databases with no internet connectivity
- VPC Flow Logs stored in encrypted S3 bucket with lifecycle policies
- Network ACLs for public subnet security
- Proper routing tables for each tier

## File: lib/tap_stack.py

```python
"""
tap_stack.py

VPC Infrastructure Stack for Financial Services Trading Platform

This module creates a production-ready three-tier VPC architecture with:
- Public subnets for load balancers and NAT gateways
- Private subnets for application servers
- Isolated subnets for databases
- VPC Flow Logs to S3 with encryption
- Network ACLs and proper routing
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for three-tier VPC infrastructure.

    Creates a production-ready VPC with proper network segmentation for PCI DSS compliance.
    Includes public, private, and isolated subnet tiers across 3 availability zones.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Merge default tags with provided tags
        resource_tags = {
            **self.tags,
            'Environment': 'production',
            'Project': 'trading-platform'
        }

        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        az_names = azs.names[:3]  # Use first 3 AZs

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **resource_tags,
                'Name': f'vpc-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'igw-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = aws.s3.Bucket(
            f"vpc-flow-logs-bucket-{self.environment_suffix}",
            bucket=f"vpc-flow-logs-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=30,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            force_destroy=True,
            tags={
                **resource_tags,
                'Name': f'vpc-flow-logs-bucket-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for VPC Flow Logs
        flow_logs_role = aws.iam.Role(
            f"vpc-flow-logs-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={
                **resource_tags,
                'Name': f'vpc-flow-logs-role-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM policy for VPC Flow Logs
        flow_logs_policy = aws.iam.RolePolicy(
            f"vpc-flow-logs-policy-{self.environment_suffix}",
            role=flow_logs_role.id,
            policy=self.flow_logs_bucket.arn.apply(lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "{arn}",
                            "{arn}/*"
                        ]
                    }}
                ]
            }}"""),
            opts=ResourceOptions(parent=self)
        )

        # Enable VPC Flow Logs
        self.flow_logs = aws.ec2.FlowLog(
            f"vpc-flow-logs-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                **resource_tags,
                'Name': f'vpc-flow-logs-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[flow_logs_policy])
        )

        # Subnet CIDR blocks
        public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
        isolated_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

        # Create Public Subnets
        self.public_subnets = []
        for i, (az, cidr) in enumerate(zip(az_names, public_cidrs)):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **resource_tags,
                    'Name': f'public-subnet-{i+1}-{self.environment_suffix}',
                    'Tier': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create Private Subnets
        self.private_subnets = []
        for i, (az, cidr) in enumerate(zip(az_names, private_cidrs)):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **resource_tags,
                    'Name': f'private-subnet-{i+1}-{self.environment_suffix}',
                    'Tier': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create Isolated Subnets
        self.isolated_subnets = []
        for i, (az, cidr) in enumerate(zip(az_names, isolated_cidrs)):
            subnet = aws.ec2.Subnet(
                f"isolated-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **resource_tags,
                    'Name': f'isolated-subnet-{i+1}-{self.environment_suffix}',
                    'Tier': 'isolated'
                },
                opts=ResourceOptions(parent=self)
            )
            self.isolated_subnets.append(subnet)

        # Create Elastic IPs for NAT Gateways
        self.nat_eips = []
        for i in range(3):
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment_suffix}",
                vpc=True,
                tags={
                    **resource_tags,
                    'Name': f'nat-eip-{i+1}-{self.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )
            self.nat_eips.append(eip)

        # Create NAT Gateways (one per AZ)
        self.nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.nat_eips)):
            nat = aws.ec2.NatGateway(
                f"nat-gateway-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={
                    **resource_tags,
                    'Name': f'nat-gateway-{i+1}-{self.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)

        # Create Public Route Table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'public-rt-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Add route to Internet Gateway for public subnets
        aws.ec2.Route(
            f"public-route-igw-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create Private Route Tables (one per AZ for NAT Gateway routing)
        self.private_route_tables = []
        for i, nat_gateway in enumerate(self.nat_gateways):
            rt = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    **resource_tags,
                    'Name': f'private-rt-{i+1}-{self.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"private-route-nat-{i+1}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

            self.private_route_tables.append(rt)

        # Create Isolated Route Tables (no internet connectivity)
        self.isolated_route_tables = []
        for i, subnet in enumerate(self.isolated_subnets):
            rt = aws.ec2.RouteTable(
                f"isolated-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    **resource_tags,
                    'Name': f'isolated-rt-{i+1}-{self.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )

            # Associate isolated subnet with its route table (local routes only)
            aws.ec2.RouteTableAssociation(
                f"isolated-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

            self.isolated_route_tables.append(rt)

        # Create Network ACL for Public Subnets
        self.public_nacl = aws.ec2.NetworkAcl(
            f"public-nacl-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f'public-nacl-{self.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Allow inbound HTTP (port 80)
        aws.ec2.NetworkAclRule(
            f"public-nacl-http-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=80,
            to_port=80,
            egress=False,
            opts=ResourceOptions(parent=self)
        )

        # Allow inbound HTTPS (port 443)
        aws.ec2.NetworkAclRule(
            f"public-nacl-https-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=443,
            to_port=443,
            egress=False,
            opts=ResourceOptions(parent=self)
        )

        # Allow inbound ephemeral ports (for return traffic)
        aws.ec2.NetworkAclRule(
            f"public-nacl-ephemeral-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=self)
        )

        # Deny all other inbound traffic
        aws.ec2.NetworkAclRule(
            f"public-nacl-deny-all-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=999,
            protocol="-1",
            rule_action="deny",
            cidr_block="0.0.0.0/0",
            egress=False,
            opts=ResourceOptions(parent=self)
        )

        # Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"public-nacl-allow-all-out-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="-1",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            egress=True,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with Network ACL
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.NetworkAclAssociation(
                f"public-nacl-assoc-{i+1}-{self.environment_suffix}",
                network_acl_id=self.public_nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=self)
            )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
            'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
            'isolated_subnet_ids': [subnet.id for subnet in self.isolated_subnets],
            'nat_gateway_ids': [nat.id for nat in self.nat_gateways],
            'internet_gateway_id': self.igw.id,
            'flow_logs_bucket_name': self.flow_logs_bucket.bucket,
            'flow_logs_bucket_arn': self.flow_logs_bucket.arn,
        })
```

## File: lib/__init__.py

```python
"""
TAP Infrastructure Package

This package contains the Pulumi infrastructure definitions for the
Test Automation Platform (TAP) project.
"""

from .tap_stack import TapStack, TapStackArgs

__all__ = ['TapStack', 'TapStackArgs']
```

## Implementation Notes

### Network Architecture

1. **Three-Tier Design**:
   - Public Tier: Direct internet access via Internet Gateway
   - Private Tier: Internet access via NAT Gateways (one per AZ)
   - Isolated Tier: No internet access, local VPC routes only

2. **High Availability**:
   - Resources distributed across 3 availability zones
   - Each AZ has one subnet of each tier
   - Dedicated NAT Gateway per AZ for redundancy

3. **Security**:
   - Network ACLs restrict public subnet inbound traffic to ports 80/443
   - Isolated subnets have no routes to internet
   - VPC Flow Logs capture all network traffic for monitoring

4. **Cost Optimization**:
   - One NAT Gateway per AZ (not per subnet) reduces costs
   - S3 lifecycle policy transitions logs to Glacier after 30 days
   - All resources are destroyable (no retention policies)

### Compliance Features

1. **PCI DSS Network Segmentation**:
   - Clear separation between public, private, and database tiers
   - Isolated subnets for sensitive databases with no internet connectivity
   - Network ACLs provide additional security layer

2. **Monitoring and Audit**:
   - VPC Flow Logs capture all network traffic
   - S3 bucket versioning maintains audit trail
   - AES-256 encryption for flow logs at rest

3. **Resource Tagging**:
   - All resources tagged with Environment=production
   - All resources tagged with Project=trading-platform
   - Additional tags from provider config (Repository, Author, PRNumber, Team)

### Outputs

The stack exports the following outputs via Pulumi:
- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: Array of public subnet IDs
- `private_subnet_ids`: Array of private subnet IDs
- `isolated_subnet_ids`: Array of isolated subnet IDs
- `nat_gateway_ids`: Array of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket_name`: S3 bucket name for flow logs
- `flow_logs_bucket_arn`: S3 bucket ARN for flow logs

### Deployment

The infrastructure integrates with the existing `tap.py` entry point. Deploy with:

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output

# Destroy infrastructure
pulumi destroy
```

All resources include the `environment_suffix` in their names for uniqueness and can be completely destroyed without retention policies.
