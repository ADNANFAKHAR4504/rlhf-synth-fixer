"""
Networking module for VPC, subnets, security groups, and VPC peering
"""

from typing import Dict, Any, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


def create_vpc_and_networking(
    environment: str,
    region: str,
    environment_suffix: str,
    az_count: int = 3,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create VPC with public/private subnets across multiple AZs,
    security groups, and NAT gateways.
    """
    
    tags = tags or {}
    
    # Get available AZs in the region
    azs = aws.get_availability_zones(state="available")
    selected_azs = azs.names[:az_count]
    
    # Create VPC
    vpc = aws.ec2.Vpc(
        f"{environment}-{region}-vpc-{environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**tags, "Name": f"{environment}-{region}-vpc-{environment_suffix}"},
        opts=opts,
    )
    
    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"{environment}-{region}-igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{environment}-{region}-igw-{environment_suffix}"},
        opts=ResourceOptions(parent=vpc),
    )
    
    # Create public subnets
    public_subnets = []
    for i, az in enumerate(selected_azs):
        subnet = aws.ec2.Subnet(
            f"{environment}-{region}-public-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={
                **tags,
                "Name": f"{environment}-{region}-public-subnet-{i}-{environment_suffix}",
                "Type": "public",
            },
            opts=ResourceOptions(parent=vpc),
        )
        public_subnets.append(subnet)
    
    # Create private subnets
    private_subnets = []
    for i, az in enumerate(selected_azs):
        subnet = aws.ec2.Subnet(
            f"{environment}-{region}-private-subnet-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{10 + i}.0/24",
            availability_zone=az,
            tags={
                **tags,
                "Name": f"{environment}-{region}-private-subnet-{i}-{environment_suffix}",
                "Type": "private",
            },
            opts=ResourceOptions(parent=vpc),
        )
        private_subnets.append(subnet)
    
    # Create public route table
    public_rt = aws.ec2.RouteTable(
        f"{environment}-{region}-public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{environment}-{region}-public-rt-{environment_suffix}"},
        opts=ResourceOptions(parent=vpc),
    )
    
    # Route to Internet Gateway
    public_route = aws.ec2.Route(
        f"{environment}-{region}-public-route-{environment_suffix}",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
        opts=ResourceOptions(parent=public_rt),
    )
    
    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"{environment}-{region}-public-rta-{i}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=public_rt),
        )
    
    # Create EIP and NAT Gateway for each AZ (high availability)
    nat_gateways = []
    for i, subnet in enumerate(public_subnets):
        eip = aws.ec2.Eip(
            f"{environment}-{region}-eip-{i}-{environment_suffix}",
            domain="vpc",
            tags={**tags, "Name": f"{environment}-{region}-eip-{i}-{environment_suffix}"},
            opts=ResourceOptions(parent=vpc),
        )
        
        nat = aws.ec2.NatGateway(
            f"{environment}-{region}-nat-{i}-{environment_suffix}",
            subnet_id=subnet.id,
            allocation_id=eip.id,
            tags={**tags, "Name": f"{environment}-{region}-nat-{i}-{environment_suffix}"},
            opts=ResourceOptions(parent=vpc, depends_on=[eip]),
        )
        nat_gateways.append(nat)
    
    # Create private route tables (one per AZ for HA)
    for i, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
        private_rt = aws.ec2.RouteTable(
            f"{environment}-{region}-private-rt-{i}-{environment_suffix}",
            vpc_id=vpc.id,
            tags={**tags, "Name": f"{environment}-{region}-private-rt-{i}-{environment_suffix}"},
            opts=ResourceOptions(parent=vpc),
        )
        
        # Route to NAT Gateway
        private_route = aws.ec2.Route(
            f"{environment}-{region}-private-route-{i}-{environment_suffix}",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat.id,
            opts=ResourceOptions(parent=private_rt),
        )
        
        # Associate private subnet with private route table
        aws.ec2.RouteTableAssociation(
            f"{environment}-{region}-private-rta-{i}-{environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=private_rt),
        )
    
    # Security Group for ALB
    alb_sg = aws.ec2.SecurityGroup(
        f"{environment}-{region}-alb-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for Application Load Balancer",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=80,
                to_port=80,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP from anywhere",
            ),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS from anywhere",
            ),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            ),
        ],
        tags={**tags, "Name": f"{environment}-{region}-alb-sg-{environment_suffix}"},
        opts=ResourceOptions(parent=vpc),
    )
    
    # Security Group for ECS tasks
    ecs_sg = aws.ec2.SecurityGroup(
        f"{environment}-{region}-ecs-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for ECS tasks",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=8080,
                to_port=8080,
                security_groups=[alb_sg.id],
                description="Allow traffic from ALB",
            ),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            ),
        ],
        tags={**tags, "Name": f"{environment}-{region}-ecs-sg-{environment_suffix}"},
        opts=ResourceOptions(parent=vpc),
    )
    
    # Security Group for Aurora
    aurora_sg = aws.ec2.SecurityGroup(
        f"{environment}-{region}-aurora-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for Aurora PostgreSQL",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[ecs_sg.id],
                description="PostgreSQL from ECS tasks",
            ),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            ),
        ],
        tags={**tags, "Name": f"{environment}-{region}-aurora-sg-{environment_suffix}"},
        opts=ResourceOptions(parent=vpc),
    )
    
    return {
        "vpc_id": vpc.id,
        "vpc_cidr": vpc.cidr_block,
        "public_subnet_ids": [s.id for s in public_subnets],
        "private_subnet_ids": [s.id for s in private_subnets],
        "alb_security_group_id": alb_sg.id,
        "ecs_security_group_id": ecs_sg.id,
        "aurora_security_group_id": aurora_sg.id,
    }
