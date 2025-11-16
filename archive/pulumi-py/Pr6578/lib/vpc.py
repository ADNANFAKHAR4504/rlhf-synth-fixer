"""VPC Module for EKS Cluster.

This module creates a VPC with 3 private subnets across different availability zones,
properly tagged for EKS cluster discovery.
"""

import pulumi
import pulumi_aws as aws


def create_vpc(environment_suffix: str, region: str) -> dict:
    """
    Create VPC with private subnets for EKS cluster.

    Args:
        environment_suffix: Unique suffix for resource naming
        region: AWS region for deployment

    Returns:
        Dictionary containing VPC and subnet resources
    """
    # Create VPC
    vpc = aws.ec2.Vpc(
        f"eks-vpc-{environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"eks-vpc-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
        }
    )

    # Get availability zones
    azs = aws.get_availability_zones(
        state="available",
        filters=[aws.GetAvailabilityZonesFilterArgs(
            name="region-name",
            values=[region]
        )]
    )

    # Create Internet Gateway for NAT Gateway
    igw = aws.ec2.InternetGateway(
        f"eks-igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"eks-igw-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Create public subnets for NAT Gateways
    public_subnets = []
    for i in range(3):
        public_subnet = aws.ec2.Subnet(
            f"eks-public-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=azs.names[i],
            map_public_ip_on_launch=True,
            tags={
                "Name": f"eks-public-subnet-{i}-{environment_suffix}",
                "EnvironmentSuffix": environment_suffix,
                "kubernetes.io/role/elb": "1",
            }
        )
        public_subnets.append(public_subnet)

    # Create public route table
    public_route_table = aws.ec2.RouteTable(
        f"eks-public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"eks-public-rt-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Route to Internet Gateway
    aws.ec2.Route(
        f"eks-public-route-{environment_suffix}",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"eks-public-rta-{i}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=public_route_table.id
        )

    # Create Elastic IPs for NAT Gateways
    eips = []
    for i in range(3):
        eip = aws.ec2.Eip(
            f"eks-nat-eip-{i}-{environment_suffix}",
            domain="vpc",
            tags={
                "Name": f"eks-nat-eip-{i}-{environment_suffix}",
                "EnvironmentSuffix": environment_suffix,
            }
        )
        eips.append(eip)

    # Create NAT Gateways in public subnets
    nat_gateways = []
    for i in range(3):
        nat = aws.ec2.NatGateway(
            f"eks-nat-{i}-{environment_suffix}",
            allocation_id=eips[i].id,
            subnet_id=public_subnets[i].id,
            tags={
                "Name": f"eks-nat-{i}-{environment_suffix}",
                "EnvironmentSuffix": environment_suffix,
            }
        )
        nat_gateways.append(nat)

    # Create private subnets for EKS nodes
    private_subnets = []
    private_route_tables = []

    for i in range(3):
        # Private subnet
        private_subnet = aws.ec2.Subnet(
            f"eks-private-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{100 + i}.0/24",
            availability_zone=azs.names[i],
            tags={
                "Name": f"eks-private-subnet-{i}-{environment_suffix}",
                "EnvironmentSuffix": environment_suffix,
                f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
                "kubernetes.io/role/internal-elb": "1",
            }
        )
        private_subnets.append(private_subnet)

        # Private route table
        private_rt = aws.ec2.RouteTable(
            f"eks-private-rt-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"eks-private-rt-{i}-{environment_suffix}",
                "EnvironmentSuffix": environment_suffix,
            }
        )
        private_route_tables.append(private_rt)

        # Route to NAT Gateway
        aws.ec2.Route(
            f"eks-private-route-{i}-{environment_suffix}",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateways[i].id
        )

        # Associate private subnet with route table
        aws.ec2.RouteTableAssociation(
            f"eks-private-rta-{i}-{environment_suffix}",
            subnet_id=private_subnet.id,
            route_table_id=private_rt.id
        )

    return {
        "vpc": vpc,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "nat_gateways": nat_gateways,
    }
