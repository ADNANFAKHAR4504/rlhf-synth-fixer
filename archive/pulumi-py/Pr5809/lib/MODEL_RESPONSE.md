# Production-Ready VPC Infrastructure with Pulumi Python

This implementation creates a highly available, production-grade VPC infrastructure for a financial services trading platform using Pulumi with Python.

## File: __main__.py

```python
"""
Production-Ready VPC Infrastructure for Financial Services Trading Platform
Deploys a secure, isolated network environment with multi-AZ high availability
"""
import pulumi
from tap_stack import TapStack

# Create the VPC infrastructure stack
stack = TapStack("trading-platform-vpc")

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("vpc_cidr", stack.vpc.cidr_block)
pulumi.export("public_subnet_ids", [subnet.id for subnet in stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in stack.private_subnets])
pulumi.export("nat_gateway_ids", [nat.id for nat in stack.nat_gateways])
pulumi.export("s3_endpoint_id", stack.s3_endpoint.id)
pulumi.export("internet_gateway_id", stack.internet_gateway.id)
pulumi.export("flow_logs_group", stack.flow_logs_group.name)
```

## File: tap_stack.py

```python
"""
VPC Stack Module for Trading Platform Infrastructure
Implements production-grade networking with high availability across 3 AZs
"""
import pulumi
import pulumi_aws as aws
import json
from typing import List


class TapStack:
    """
    Production VPC infrastructure with multi-AZ support for financial services platform

    Features:
    - VPC with DNS support and proper CIDR allocation
    - 6 subnets (3 public, 3 private) across 3 availability zones
    - Internet Gateway for public internet access
    - NAT Gateways in each AZ for high availability
    - VPC Flow Logs with CloudWatch Logs integration
    - S3 VPC Endpoint for efficient AWS service access
    - Network ACLs for traffic filtering
    """

    def __init__(self, name: str):
        """
        Initialize the VPC stack with all required components

        Args:
            name: Base name for resources (will be combined with environmentSuffix)
        """
        self.name = name
        self.region = "us-east-1"
        self.availability_zones = [
            f"{self.region}a",
            f"{self.region}b",
            f"{self.region}c"
        ]

        # Common tags for all resources
        self.common_tags = {
            "Environment": "production",
            "Project": "trading-platform",
            "ManagedBy": "pulumi"
        }

        # Create VPC and all components
        self.vpc = self._create_vpc()
        self.internet_gateway = self._create_internet_gateway()
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        self.nat_gateways = self._create_nat_gateways()
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
        self._associate_subnet_route_tables()
        self.s3_endpoint = self._create_s3_endpoint()
        self.flow_logs_role = self._create_flow_logs_role()
        self.flow_logs_group = self._create_flow_logs_group()
        self.flow_logs = self._create_flow_logs()
        self.network_acl = self._create_network_acl()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC with DNS support and proper CIDR allocation

        Returns:
            VPC resource with CIDR 10.0.0.0/16
        """
        return aws.ec2.Vpc(
            f"{self.name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.common_tags,
                "Name": f"{self.name}-vpc-production"
            }
        )

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway with specific naming format

        Returns:
            Internet Gateway attached to VPC
        """
        return aws.ec2.InternetGateway(
            "prod-igw",
            vpc_id=self.vpc.id,
            tags={
                **self.common_tags,
                "Name": f"prod-igw-{self.region}"
            }
        )

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets in each availability zone

        Returns:
            List of 3 public subnets with CIDR blocks 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
        """
        public_subnets = []

        for idx, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx + 1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.common_tags,
                    "Name": f"production-public-{az}",
                    "Type": "public"
                }
            )
            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create private subnets in each availability zone

        Returns:
            List of 3 private subnets with CIDR blocks 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
        """
        private_subnets = []

        for idx, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{101 + idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.common_tags,
                    "Name": f"production-private-{az}",
                    "Type": "private"
                }
            )
            private_subnets.append(subnet)

        return private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways in each public subnet with Elastic IPs

        Returns:
            List of 3 NAT Gateways, one per availability zone for redundancy
        """
        nat_gateways = []

        for idx, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"nat-eip-{idx}",
                domain="vpc",
                tags={
                    **self.common_tags,
                    "Name": f"nat-eip-{self.availability_zones[idx]}"
                }
            )

            # Create NAT Gateway
            nat = aws.ec2.NatGateway(
                f"nat-gateway-{idx}",
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.common_tags,
                    "Name": f"nat-gateway-{self.availability_zones[idx]}"
                }
            )
            nat_gateways.append(nat)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create public route table with route to Internet Gateway

        Returns:
            Route table for public subnets with default route to IGW
        """
        route_table = aws.ec2.RouteTable(
            "public-route-table",
            vpc_id=self.vpc.id,
            tags={
                **self.common_tags,
                "Name": "public-route-table"
            }
        )

        # Add route to Internet Gateway
        aws.ec2.Route(
            "public-route-to-igw",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id
        )

        return route_table

    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create private route tables with routes to respective NAT Gateways

        Returns:
            List of 3 private route tables, one per AZ with route to corresponding NAT Gateway
        """
        private_route_tables = []

        for idx, nat_gateway in enumerate(self.nat_gateways):
            route_table = aws.ec2.RouteTable(
                f"private-route-table-{idx}",
                vpc_id=self.vpc.id,
                tags={
                    **self.common_tags,
                    "Name": f"private-route-table-{self.availability_zones[idx]}"
                }
            )

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"private-route-to-nat-{idx}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )

            private_route_tables.append(route_table)

        return private_route_tables

    def _associate_subnet_route_tables(self):
        """
        Associate subnets with their respective route tables
        """
        # Associate public subnets with public route table
        for idx, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-subnet-association-{idx}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Associate private subnets with private route tables
        for idx, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-subnet-association-{idx}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_tables[idx].id
            )

    def _create_s3_endpoint(self) -> aws.ec2.VpcEndpoint:
        """
        Create S3 VPC Endpoint (Gateway type) for private subnet access

        Returns:
            S3 VPC endpoint associated with private subnet route tables
        """
        return aws.ec2.VpcEndpoint(
            "s3-vpc-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.common_tags,
                "Name": "s3-vpc-endpoint"
            }
        )

    def _create_flow_logs_role(self) -> aws.iam.Role:
        """
        Create IAM role for VPC Flow Logs with appropriate permissions

        Returns:
            IAM role with permissions to write to CloudWatch Logs
        """
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "vpc-flow-logs.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            "flow-logs-role",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        # Attach policy to allow writing to CloudWatch Logs
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "*"
            }]
        }

        aws.iam.RolePolicy(
            "flow-logs-policy",
            role=role.id,
            policy=json.dumps(policy_document)
        )

        return role

    def _create_flow_logs_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for VPC Flow Logs with 7-day retention

        Returns:
            CloudWatch Log Group with 7-day retention policy
        """
        return aws.cloudwatch.LogGroup(
            "vpc-flow-logs-group",
            name=f"/aws/vpc/flowlogs/{self.name}",
            retention_in_days=7,
            tags=self.common_tags
        )

    def _create_flow_logs(self) -> aws.ec2.FlowLog:
        """
        Enable VPC Flow Logs with CloudWatch Logs as destination

        Returns:
            VPC Flow Log resource
        """
        return aws.ec2.FlowLog(
            "vpc-flow-logs",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            iam_role_arn=self.flow_logs_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=self.flow_logs_group.arn,
            tags=self.common_tags
        )

    def _create_network_acl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL with rules for HTTP, HTTPS, and SSH traffic

        Returns:
            Network ACL with security rules
        """
        nacl = aws.ec2.NetworkAcl(
            "vpc-network-acl",
            vpc_id=self.vpc.id,
            tags={
                **self.common_tags,
                "Name": "vpc-network-acl"
            }
        )

        # Ingress rules
        # Allow HTTP
        aws.ec2.NetworkAclRule(
            "nacl-ingress-http",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=80,
            to_port=80,
            egress=False
        )

        # Allow HTTPS
        aws.ec2.NetworkAclRule(
            "nacl-ingress-https",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=443,
            to_port=443,
            egress=False
        )

        # Allow SSH
        aws.ec2.NetworkAclRule(
            "nacl-ingress-ssh",
            network_acl_id=nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=22,
            to_port=22,
            egress=False
        )

        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            "nacl-ingress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=130,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535,
            egress=False
        )

        # Egress rules
        # Allow HTTP
        aws.ec2.NetworkAclRule(
            "nacl-egress-http",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=80,
            to_port=80,
            egress=True
        )

        # Allow HTTPS
        aws.ec2.NetworkAclRule(
            "nacl-egress-https",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=443,
            to_port=443,
            egress=True
        )

        # Allow SSH
        aws.ec2.NetworkAclRule(
            "nacl-egress-ssh",
            network_acl_id=nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=22,
            to_port=22,
            egress=True
        )

        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            "nacl-egress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=130,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535,
            egress=True
        )

        return nacl
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: Pulumi.yaml

```yaml
name: trading-platform-vpc
runtime: python
description: Production-ready VPC infrastructure for financial services trading platform
config:
  aws:region:
    default: us-east-1
```

## Architecture Summary

This implementation creates a production-grade VPC infrastructure with the following components:

### Network Architecture
- **VPC**: 10.0.0.0/16 CIDR with DNS support enabled
- **Public Subnets**: 3 subnets across 3 AZs (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Private Subnets**: 3 subnets across 3 AZs (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24)

### High Availability
- **NAT Gateways**: One in each AZ with dedicated Elastic IPs for redundancy
- **Multi-AZ Design**: Resources distributed across us-east-1a, us-east-1b, us-east-1c

### Routing
- **Public Route Table**: Routes internet traffic (0.0.0.0/0) to Internet Gateway
- **Private Route Tables**: Each AZ has its own route table routing to the corresponding NAT Gateway
- **S3 VPC Endpoint**: Gateway-type endpoint associated with private route tables

### Security & Compliance
- **VPC Flow Logs**: Enabled for all traffic, sent to CloudWatch Logs with 7-day retention
- **Network ACLs**: Configured to allow HTTP (80), HTTPS (443), and SSH (22) traffic
- **Private Subnet Isolation**: Private subnets route through NAT Gateways for outbound access
- **IAM Role**: Dedicated role for VPC Flow Logs with appropriate permissions

### Resource Tagging
All resources tagged with:
- Environment: production
- Project: trading-platform
- ManagedBy: pulumi

### Outputs
- VPC ID and CIDR block
- Public subnet IDs (grouped)
- Private subnet IDs (grouped)
- NAT Gateway IDs
- S3 endpoint ID
- Internet Gateway ID
- Flow logs group name

## Deployment Instructions

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Initialize Pulumi stack:
   ```bash
   pulumi stack init dev
   ```

4. Deploy infrastructure:
   ```bash
   pulumi up
   ```

5. View outputs:
   ```bash
   pulumi stack output
   ```

6. Destroy infrastructure (when needed):
   ```bash
   pulumi destroy
   ```

## Cost Optimization Notes

- **NAT Gateways**: Most expensive component (~$0.045/hour per gateway = ~$100/month total)
- **Elastic IPs**: No charge while associated with running resources
- **VPC Flow Logs**: Storage costs based on CloudWatch Logs pricing
- **S3 VPC Endpoint**: No additional charge (Gateway type)

## Security Best Practices

1. Private subnets have no direct internet access
2. VPC Flow Logs enabled for audit trails
3. Network ACLs provide additional security layer
4. S3 VPC Endpoint prevents data exfiltration through internet
5. Consistent tagging for compliance and resource management

## High Availability Features

1. Multi-AZ design across 3 availability zones
2. Redundant NAT Gateways in each AZ
3. Independent routing per AZ for fault isolation
4. No single point of failure in network architecture