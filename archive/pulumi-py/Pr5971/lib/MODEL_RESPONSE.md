# Pulumi Python VPC Infrastructure for Payment Processing

This solution implements a production-ready VPC infrastructure using Pulumi with Python for a payment processing system with PCI DSS compliance requirements.

## File: __main__.py

```python
"""Main entry point for the Pulumi program."""
import pulumi
from lib.tap_stack import create_vpc_infrastructure

# Create the VPC infrastructure
vpc_resources = create_vpc_infrastructure()

# Export stack outputs
pulumi.export("vpc_id", vpc_resources["vpc"].id)
pulumi.export("vpc_cidr", vpc_resources["vpc"].cidr_block)
pulumi.export("internet_gateway_id", vpc_resources["igw"].id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in vpc_resources["public_subnets"]])
pulumi.export("private_subnet_ids", [subnet.id for subnet in vpc_resources["private_subnets"]])
pulumi.export("nat_gateway_ids", [nat.id for nat in vpc_resources["nat_gateways"]])
pulumi.export("security_group_id", vpc_resources["security_group"].id)
pulumi.export("flow_log_id", vpc_resources["flow_log"].id)
```

## File: lib/tap_stack.py

```python
"""VPC infrastructure stack for payment processing system."""
from typing import Dict, List, Any
import pulumi
import pulumi_aws as aws


def create_vpc_infrastructure() -> Dict[str, Any]:
    """
    Create a production-ready VPC infrastructure with multi-AZ deployment.

    Returns:
        Dictionary containing all created AWS resources
    """
    # Get Pulumi configuration
    config = pulumi.Config()
    environment_suffix = config.get("environmentSuffix") or "prod"

    # Common tags for all resources
    common_tags = {
        "Environment": "Production",
        "Project": "PaymentGateway",
    }

    # Get availability zones dynamically
    azs_result = aws.get_availability_zones(state="available")
    azs = azs_result.names[:3]  # Use first 3 AZs

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"vpc-{environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**common_tags, "Name": f"vpc-{environment_suffix}"},
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**common_tags, "Name": f"igw-{environment_suffix}"},
    )

    # Define subnet CIDRs
    public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
    private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

    # Create public subnets
    public_subnets: List[aws.ec2.Subnet] = []
    for i, (az, cidr) in enumerate(zip(azs, public_cidrs)):
        subnet = aws.ec2.Subnet(
            f"public-subnet-{i+1}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=cidr,
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"public-subnet-{az}-{environment_suffix}", "Type": "Public"},
        )
        public_subnets.append(subnet)

    # Create private subnets
    private_subnets: List[aws.ec2.Subnet] = []
    for i, (az, cidr) in enumerate(zip(azs, private_cidrs)):
        subnet = aws.ec2.Subnet(
            f"private-subnet-{i+1}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=cidr,
            availability_zone=az,
            map_public_ip_on_launch=False,
            tags={**common_tags, "Name": f"private-subnet-{az}-{environment_suffix}", "Type": "Private"},
        )
        private_subnets.append(subnet)

    # Create Elastic IPs for NAT Gateways
    eips: List[aws.ec2.Eip] = []
    for i in range(3):
        eip = aws.ec2.Eip(
            f"eip-nat-{i+1}-{environment_suffix}",
            domain="vpc",
            tags={**common_tags, "Name": f"eip-nat-{azs[i]}-{environment_suffix}"},
        )
        eips.append(eip)

    # Create NAT Gateways (one per public subnet)
    nat_gateways: List[aws.ec2.NatGateway] = []
    for i, (subnet, eip, az) in enumerate(zip(public_subnets, eips, azs)):
        nat = aws.ec2.NatGateway(
            f"nat-gateway-{i+1}-{environment_suffix}",
            subnet_id=subnet.id,
            allocation_id=eip.id,
            tags={**common_tags, "Name": f"nat-gateway-{az}-{environment_suffix}"},
        )
        nat_gateways.append(nat)

    # Create public route table
    public_route_table = aws.ec2.RouteTable(
        f"public-route-table-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**common_tags, "Name": f"Public-RouteTable-{environment_suffix}"},
    )

    # Create route to Internet Gateway
    public_route = aws.ec2.Route(
        f"public-route-igw-{environment_suffix}",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
    )

    # Associate public subnets with public route table
    public_rt_associations: List[aws.ec2.RouteTableAssociation] = []
    for i, subnet in enumerate(public_subnets):
        assoc = aws.ec2.RouteTableAssociation(
            f"public-rt-assoc-{i+1}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=public_route_table.id,
        )
        public_rt_associations.append(assoc)

    # Create private route tables (one per AZ)
    private_route_tables: List[aws.ec2.RouteTable] = []
    private_routes: List[aws.ec2.Route] = []
    private_rt_associations: List[aws.ec2.RouteTableAssociation] = []

    for i, (az, nat, subnet) in enumerate(zip(azs, nat_gateways, private_subnets)):
        # Create route table
        rt = aws.ec2.RouteTable(
            f"private-route-table-{i+1}-{environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"Private-RouteTable-{az}"},
        )
        private_route_tables.append(rt)

        # Create route to NAT Gateway
        route = aws.ec2.Route(
            f"private-route-nat-{i+1}-{environment_suffix}",
            route_table_id=rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat.id,
        )
        private_routes.append(route)

        # Associate private subnet with route table
        assoc = aws.ec2.RouteTableAssociation(
            f"private-rt-assoc-{i+1}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=rt.id,
        )
        private_rt_associations.append(assoc)

    # Create security group allowing only HTTPS
    security_group = aws.ec2.SecurityGroup(
        f"https-only-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group allowing only HTTPS inbound traffic",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow HTTPS from anywhere",
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic",
            )
        ],
        tags={**common_tags, "Name": f"https-only-sg-{environment_suffix}"},
    )

    # Create IAM role for VPC Flow Logs
    flow_log_role = aws.iam.Role(
        f"vpc-flow-log-role-{environment_suffix}",
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
        tags={**common_tags, "Name": f"vpc-flow-log-role-{environment_suffix}"},
    )

    # Create IAM policy for VPC Flow Logs
    flow_log_policy = aws.iam.RolePolicy(
        f"vpc-flow-log-policy-{environment_suffix}",
        role=flow_log_role.id,
        policy="""{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "*"
                }
            ]
        }""",
    )

    # Create CloudWatch Log Group for VPC Flow Logs
    log_group = aws.cloudwatch.LogGroup(
        f"vpc-flow-logs-{environment_suffix}",
        name=pulumi.Output.concat("/aws/vpc/flow-logs-", environment_suffix),
        retention_in_days=7,
        tags={**common_tags, "Name": f"vpc-flow-logs-{environment_suffix}"},
    )

    # Create VPC Flow Log
    flow_log = aws.ec2.FlowLog(
        f"vpc-flow-log-{environment_suffix}",
        vpc_id=vpc.id,
        traffic_type="ALL",
        log_destination_type="cloud-watch-logs",
        log_destination=log_group.arn,
        iam_role_arn=flow_log_role.arn,
        max_aggregation_interval=300,  # 5 minutes
        tags={**common_tags, "Name": f"vpc-flow-log-{environment_suffix}"},
        opts=pulumi.ResourceOptions(depends_on=[flow_log_policy, log_group]),
    )

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "eips": eips,
        "nat_gateways": nat_gateways,
        "public_route_table": public_route_table,
        "private_route_tables": private_route_tables,
        "security_group": security_group,
        "flow_log_role": flow_log_role,
        "flow_log_policy": flow_log_policy,
        "log_group": log_group,
        "flow_log": flow_log,
    }
```

## File: Pulumi.yaml

```yaml
name: tap-payment-vpc
runtime: python
description: Production-ready VPC infrastructure for payment processing system
config:
  environmentSuffix:
    description: Environment suffix for resource naming (e.g., prod, dev, staging)
    default: prod
  aws:region:
    description: AWS region to deploy resources
    default: us-east-1
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## Implementation Summary

This Pulumi Python implementation provides:

1. **VPC Configuration**: VPC with CIDR 10.0.0.0/16, DNS hostnames enabled
2. **Multi-AZ Deployment**: 3 public and 3 private subnets across 3 availability zones
3. **High Availability**: 3 NAT Gateways for redundant outbound connectivity
4. **Security**: HTTPS-only security group, VPC Flow Logs with 5-minute intervals
5. **Compliance**: Resource tagging for PCI DSS compliance tracking
6. **Naming Convention**: All resources include environmentSuffix
7. **Infrastructure Outputs**: All VPC, subnet, and NAT Gateway IDs exported

The solution is production-ready, maintainable, and follows AWS and Pulumi best practices.