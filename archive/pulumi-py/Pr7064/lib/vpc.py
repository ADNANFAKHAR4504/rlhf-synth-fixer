"""VPC and Networking Resources"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

def create_vpc(
    environment_suffix: str,
    vpc_cidr: str,
    enable_multi_az: bool,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create VPC with public and private subnets"""

    # Get availability zones
    azs = aws.get_availability_zones(state="available")
    az_count = 3 if enable_multi_az else 2
    selected_azs = azs.names[:az_count]

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"transaction-vpc-{environment_suffix}",
        cidr_block=vpc_cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**tags, "Name": f"transaction-vpc-{environment_suffix}"}
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"transaction-igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"transaction-igw-{environment_suffix}"}
    )

    # Create public subnets
    public_subnets = []
    for i, az in enumerate(selected_azs):
        public_subnet = aws.ec2.Subnet(
            f"public-subnet-{i+1}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={**tags, "Name": f"public-subnet-{i+1}-{environment_suffix}", "Type": "public"}
        )
        public_subnets.append(public_subnet)

    # Create private subnets
    private_subnets = []
    for i, az in enumerate(selected_azs):
        private_subnet = aws.ec2.Subnet(
            f"private-subnet-{i+1}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i + 10}.0/24",
            availability_zone=az,
            tags={**tags, "Name": f"private-subnet-{i+1}-{environment_suffix}", "Type": "private"}
        )
        private_subnets.append(private_subnet)

    # Create public route table
    public_rt = aws.ec2.RouteTable(
        f"public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"public-rt-{environment_suffix}"}
    )

    # Route to Internet Gateway
    aws.ec2.Route(
        f"public-route-{environment_suffix}",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"public-rta-{i+1}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

    # Create private route table
    private_rt = aws.ec2.RouteTable(
        f"private-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"private-rt-{environment_suffix}"}
    )

    # Note: Private route to NAT Gateway is disabled due to AWS account quota limits
    # When NAT Gateway is available, uncomment:
    # private_route = aws.ec2.Route(...)

    # Associate private subnets with private route table
    for i, subnet in enumerate(private_subnets):
        aws.ec2.RouteTableAssociation(
            f"private-rta-{i+1}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=private_rt.id
        )

    # Create VPC endpoints for private subnet access to AWS services
    s3_endpoint = aws.ec2.VpcEndpoint(
        f"s3-endpoint-{environment_suffix}",
        vpc_id=vpc.id,
        service_name=f"com.amazonaws.{aws.config.region}.s3",
        route_table_ids=[private_rt.id],
        tags={**tags, "Name": f"s3-endpoint-{environment_suffix}"}
    )

    return {
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "public_subnet_ids": [s.id for s in public_subnets],
        "private_subnet_ids": [s.id for s in private_subnets],
        "public_rt": public_rt,
        "private_rt": private_rt,
        "s3_endpoint": s3_endpoint
    }
